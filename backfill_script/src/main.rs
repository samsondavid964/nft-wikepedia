use ethers::prelude::*;
use ethers::providers::{Provider, Http};
use ethers::types::{U256};
use std::env;
use std::sync::Arc;
use common::NftMintJob;
use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use std::time::Duration;
use anyhow::Result;

// Minimal ERC721 ABI with totalSupply and tokenURI
abigen!(
    ERC721,
    r#"[
        function totalSupply() external view returns (uint256)
        function tokenURI(uint256 tokenId) external view returns (string)
    ]"#,
);

async fn produce_job(producer: &FutureProducer, topic: &str, job: NftMintJob) {
    let job_payload = match serde_json::to_string(&job) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("[ERROR] Failed to serialize job: {}", e);
            return;
        }
    };

    let record = FutureRecord::to(topic)
        .payload(&job_payload)
        .key(&job.contract_address);

    if let Err((e, _)) = producer.send(record, Duration::from_secs(0)).await {
        eprintln!("[ERROR] Failed to send job to Kafka: {}", e);
    } else {
        println!("[SUCCESS] Sent job for Token ID: {}", job.token_id);
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    // --- Configuration ---
    let http_url = env::var("ETHEREUM_HTTP_URL").expect("ETHEREUM_HTTP_URL must be set");
    let kafka_brokers = env::var("KAFKA_BROKERS").expect("KAFKA_BROKERS must be set");
    let kafka_topic = env::var("KAFKA_TOPIC").unwrap_or_else(|_| "nft_mint_jobs".to_string());
    
    // Target NFT contracts to backfill (comma-separated)
    let contracts_to_backfill_str = env::var("BACKFILL_CONTRACTS")
        .expect("BACKFILL_CONTRACTS must be set (e.g., '0xAddress1,0xAddress2')");
    let contract_addresses: Vec<&str> = contracts_to_backfill_str.split(',').collect();

    // --- Setup Connections ---
    let provider = Provider::<Http>::try_from(http_url)?;
    let client = Arc::new(provider);

    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", &kafka_brokers)
        .set("message.timeout.ms", "5000")
        .create()
        .expect("Failed to create Kafka producer");

    // --- Main Backfill Logic ---
    for address_str in contract_addresses {
        let address: Address = address_str.parse()?;
        let contract = ERC721::new(address, client.clone());

        println!("\n[INFO] Starting backfill for contract: {}", address_str);

        // 1. Get total supply to know how many tokens to loop through
        let total_supply = match contract.total_supply().call().await {
            Ok(supply) => supply,
            Err(e) => {
                eprintln!("[ERROR] Could not fetch total supply for {}: {}", address_str, e);
                continue; // Skip to next contract
            }
        };
        println!("[INFO] Total supply for {} is: {}", address_str, total_supply);
        
        // 2. Loop from token ID 1 (or 0, depending on the contract) up to totalSupply
        for i in 1..=total_supply.as_u64() {
            let token_id = U256::from(i);

            // 3. Fetch the token URI
            let token_uri_result = contract.token_uri(token_id).call().await;

            match token_uri_result {
                Ok(metadata_uri) => {
                    // 4. Create and send the job
                    let job = NftMintJob {
                        contract_address: format!("{:?}", address),
                        token_id: token_id.to_string(),
                        chain: "ethereum".to_string(),
                        metadata_uri: Some(metadata_uri),
                    };

                    println!("[QUEUING] Job for Contract: {:?}, Token ID: {}", address, token_id);
                    produce_job(&producer, &kafka_topic, job).await;
                }
                Err(e) => {
                    eprintln!("[ERROR] Could not fetch token URI for token {}: {}", token_id, e);
                    // Decide if you want to stop or continue. Continuing is usually better.
                }
            }
        }
    }

    println!("\n[INFO] Backfill script finished.");
    Ok(())
} 