// Required environment variables for Confluent Cloud:
// KAFKA_BROKERS
// KAFKA_TOPIC
// KAFKA_USERNAME
// KAFKA_PASSWORD
// ETHEREUM_WS_URL

use ethers::prelude::*;
use ethers::providers::{Provider, Ws};
use ethers::types::{Filter, H256, U256};
use std::env;
use std::sync::Arc;
use common::NftMintJob;
use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use serde_json;
use std::time::Duration;
use anyhow;

// ERC-721 ABI fragment for tokenURI
abigen!(ERC721, r#"[
    function tokenURI(uint256 tokenId) external view returns (string)
]"#);

// ERC-1155 ABI fragment (no tokenURI standard, but some contracts implement uri(uint256))
abigen!(ERC1155, r#"[
    function uri(uint256 id) external view returns (string)
]"#);

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load Ethereum node URL and Kafka brokers from env
    let ws_url = env::var("ETHEREUM_WS_URL").expect("ETHEREUM_WS_URL must be set");
    let kafka_brokers = env::var("KAFKA_BROKERS").expect("KAFKA_BROKERS must be set");
    let kafka_topic = env::var("KAFKA_TOPIC").unwrap_or_else(|_| "nft_mint_jobs".to_string());
    let kafka_username = env::var("KAFKA_USERNAME").expect("KAFKA_USERNAME must be set for Confluent Cloud");
    let kafka_password = env::var("KAFKA_PASSWORD").expect("KAFKA_PASSWORD must be set for Confluent Cloud");

    // Set up Kafka producer with Confluent Cloud SASL/PLAIN authentication
    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", &kafka_brokers)
        .set("security.protocol", "SASL_SSL")
        .set("sasl.mechanism", "PLAIN")
        .set("sasl.username", &kafka_username)
        .set("sasl.password", &kafka_password)
        .create()
        .expect("Failed to create Kafka producer");

    let producer = Arc::new(producer);

    let provider = Provider::<Ws>::connect(ws_url.clone()).await?;
    let provider2 = Arc::new(Provider::<Ws>::connect(ws_url).await?); // For contract calls

    // ERC-721 and ERC-1155 event names (not hashes)
    let filter = Filter::new()
        .event("Transfer(address,address,uint256)")
        .event("TransferSingle(address,address,address,uint256,uint256)")
        .event("TransferBatch(address,address,address,uint256[],uint256[])");
    let mut stream = provider.subscribe_logs(&filter).await?;

    println!("Listening for NFT Transfer events (ERC-721 & ERC-1155)...");
    while let Some(log) = stream.next().await {
        // ERC-721 Transfer
        if let Some(event_sig) = log.topics.get(0) {
            if *event_sig == H256::from_slice(&ethers::utils::keccak256("Transfer(address,address,uint256)")) {
                // topics: [event, from, to, tokenId]
                if let Some(from) = log.topics.get(1) {
                    if *from == H256::zero() {
                        // Mint detected
                        let contract_address = log.address;
                        let token_id = log.topics.get(3)
                            .map(|h| U256::from_big_endian(h.as_bytes()).to_string())
                            .unwrap_or_else(|| "unknown".to_string());
                        // Try to fetch tokenURI
                        let erc721 = ERC721::new(contract_address, provider2.clone());
                        let token_id_u256 = U256::from_dec_str(&token_id).unwrap_or(U256::zero());
                        let metadata_uri = match erc721.token_uri(token_id_u256).call().await {
                            Ok(uri) => Some(uri),
                            Err(_) => None,
                        };
                        let job = NftMintJob {
                            contract_address: format!("0x{:x}", contract_address),
                            token_id: token_id.clone(),
                            chain: "ethereum".to_string(),
                            metadata_uri,
                        };
                        println!("[ERC-721] Detected NFT mint: {:?}", job);
                        produce_job(producer.clone(), kafka_topic.clone(), job).await;
                    }
                }
            }
            // ERC-1155 TransferSingle
            else if *event_sig == H256::from_slice(&ethers::utils::keccak256("TransferSingle(address,address,address,uint256,uint256)")) {
                // topics: [event, operator, from, to, id, value]
                if let Some(from) = log.topics.get(2) {
                    if *from == H256::zero() {
                        // Mint detected
                        let contract_address = log.address;
                        // token_id is in data (4th topic)
                        let token_id = log.topics.get(4)
                            .map(|h| U256::from_big_endian(h.as_bytes()).to_string())
                            .unwrap_or_else(|| "unknown".to_string());
                        // Try to fetch uri (not standard, so usually None)
                        let erc1155 = ERC1155::new(contract_address, provider2.clone());
                        let token_id_u256 = U256::from_dec_str(&token_id).unwrap_or(U256::zero());
                        let metadata_uri = match erc1155.uri(token_id_u256).call().await {
                            Ok(uri) => Some(uri),
                            Err(_) => None,
                        };
                        let job = NftMintJob {
                            contract_address: format!("0x{:x}", contract_address),
                            token_id: token_id.clone(),
                            chain: "ethereum".to_string(),
                            metadata_uri,
                        };
                        println!("[ERC-1155] Detected NFT mint: {:?}", job);
                        produce_job(producer.clone(), kafka_topic.clone(), job).await;
                    }
                }
            }
            // ERC-1155 TransferBatch
            else if *event_sig == H256::from_slice(&ethers::utils::keccak256("TransferBatch(address,address,address,uint256[],uint256[])")) {
                // topics: [event, operator, from, to], data: token ids and values (encoded)
                if let Some(from) = log.topics.get(2) {
                    if *from == H256::zero() {
                        let contract_address = log.address;
                        // Decode token ids from data (first 32 bytes is offset, then array)
                        if let Ok(decoded) = ethers::abi::decode(&[ethers::abi::ParamType::Array(Box::new(ethers::abi::ParamType::Uint(256)))], &log.data.0[0..]) {
                            if let Some(ids) = decoded.get(0).and_then(|v| v.clone().into_array()) {
                                for id in ids {
                                    let token_id = id.into_uint().unwrap_or(U256::zero()).to_string();
                                    let erc1155 = ERC1155::new(contract_address, provider2.clone());
                                    let token_id_u256 = U256::from_dec_str(&token_id).unwrap_or(U256::zero());
                                    let metadata_uri = match erc1155.uri(token_id_u256).call().await {
                                        Ok(uri) => Some(uri),
                                        Err(_) => None,
                                    };
                                    let job = NftMintJob {
                                        contract_address: format!("0x{:x}", contract_address),
                                        token_id: token_id.clone(),
                                        chain: "ethereum".to_string(),
                                        metadata_uri,
                                    };
                                    println!("[ERC-1155 Batch] Detected NFT mint: {:?}", job);
                                    produce_job(producer.clone(), kafka_topic.clone(), job.clone()).await;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

async fn produce_job(producer: Arc<FutureProducer>, topic: String, job: NftMintJob) {
    match serde_json::to_string(&job) {
        Ok(payload) => {
            let key = job.contract_address.clone();
            // Leak the memory so the reference is 'static for the async task
            let topic = Box::leak(topic.into_boxed_str());
            let payload = Box::leak(payload.into_boxed_str());
            let key = Box::leak(key.into_boxed_str());
            let record = FutureRecord::to(topic)
                .payload(payload)
                .key(key);
            let producer = Arc::clone(&producer);
            tokio::spawn(async move {
                let produce_future = producer.send(record, Duration::from_secs(0));
                match produce_future.await {
                    Ok((partition, offset)) => println!("Kafka delivery success: partition={partition}, offset={offset}"),
                    Err((e, _msg)) => eprintln!("Kafka delivery error: {e:?}"),
                }
            });
        }
        Err(e) => eprintln!("Failed to serialize job: {e}"),
    }
}
