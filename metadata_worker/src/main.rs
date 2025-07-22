use rdkafka::config::ClientConfig;
use rdkafka::consumer::{StreamConsumer, Consumer};
use rdkafka::message::Message;
use std::env;
use common::NftMintJob; // Assuming 'common' is a crate in your workspace
use serde_json;
use tokio_stream::StreamExt;
use reqwest::Client;
use reqwest::StatusCode;
use std::time::Duration;
// Removed fs and Path imports as we won't be writing to local filesystem for media cache
// use std::fs;
// use std::path::Path;
use sha2::{Sha256, Digest};
use sqlx::PgPool;
use db::{NftMetadata, NftMedia}; // Assuming 'db' is a crate in your workspace
use aws_sdk_s3::{Client as S3Client, primitives::ByteStream};
use aws_sdk_s3::config::Credentials;
use aws_config::Region;
use aws_config::BehaviorVersion;
use anyhow; // Added anyhow explicitly, though it might be transitive

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NormalizedMetadata {
    pub name: Option<String>,
    pub description: Option<String>,
    pub image: Option<String>,
    pub animation_url: Option<String>,
    pub attributes: Option<serde_json::Value>,
    pub raw: serde_json::Value,
}

fn resolve_uri(uri: &str) -> String {
    if uri.starts_with("ipfs://") {
        let hash = uri.trim_start_matches("ipfs://");
        format!("https://ipfs.io/ipfs/{}", hash)
    } else if uri.starts_with("ar://") {
        let hash = uri.trim_start_matches("ar://");
        format!("https://arweave.net/{}", hash)
    } else {
        uri.to_string()
    }
}

async fn fetch_and_normalize_metadata(client: &Client, uri: &str) -> anyhow::Result<NormalizedMetadata> {
    let resolved = resolve_uri(uri);
    let resp = client.get(&resolved)
        .timeout(Duration::from_secs(10))
        .send().await;
    let resp = match resp {
        Ok(r) => r,
        Err(e) => {
            return Err(anyhow::anyhow!("HTTP error fetching metadata: {} ({})", resolved, e));
        }
    };
    if resp.status() != StatusCode::OK {
        return Err(anyhow::anyhow!("Non-200 status {} fetching metadata: {}", resp.status(), resolved));
    }
    let raw: serde_json::Value = match resp.json().await {
        Ok(json) => json,
        Err(e) => {
            return Err(anyhow::anyhow!("Invalid JSON in metadata: {} ({})", resolved, e));
        }
    };
    let name = raw.get("name").and_then(|v| v.as_str()).map(|s| s.to_string());
    let description = raw.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
    let image = raw.get("image").and_then(|v| v.as_str()).map(|s| s.to_string());
    let animation_url = raw.get("animation_url").and_then(|v| v.as_str()).map(|s| s.to_string());
    let attributes = raw.get("attributes").cloned();
    Ok(NormalizedMetadata { name, description, image, animation_url, attributes, raw })
}

async fn upload_to_s3(s3: &S3Client, bucket: &str, key: &str, bytes: &[u8]) -> anyhow::Result<String> {
    let body = ByteStream::from(bytes.to_vec());
    s3.put_object()
        .bucket(bucket)
        .key(key)
        .body(body)
        .send()
        .await?;
    let url = format!("https://{}.s3.amazonaws.com/{}", bucket, key);
    Ok(url)
}

// Modified to only upload to S3. If S3 config is missing or upload fails, it returns an error.
async fn fetch_and_cache_media(client: &Client, s3: Option<&S3Client>, bucket: Option<&str>, url: &str) -> anyhow::Result<(String, String, String)> {
    let resolved = resolve_uri(url);
    let resp = client.get(&resolved)
        .timeout(Duration::from_secs(20))
        .send().await;
    let resp = match resp {
        Ok(r) => r,
        Err(e) => {
            return Err(anyhow::anyhow!("HTTP error fetching media: {} ({})", resolved, e));
        }
    };
    if resp.status() != StatusCode::OK {
        return Err(anyhow::anyhow!("Non-200 status {} fetching media: {}", resp.status(), resolved));
    }
    let bytes = match resp.bytes().await {
        Ok(b) => b,
        Err(e) => {
            return Err(anyhow::anyhow!("Failed to read media bytes: {} ({})", resolved, e));
        }
    };

    // Hash the original URL for a unique filename
    let mut hasher = Sha256::new();
    hasher.update(url.as_bytes());
    let hash = format!("{:x}", hasher.finalize());

    // Determine extension from original URL (or default to "bin")
    let ext_pos = resolved.rfind('.').map_or(resolved.len(), |idx| idx + 1);
    let ext = &resolved[ext_pos..];
    let ext = if ext.is_empty() || ext.contains('/') || ext.contains('\\') {
        "bin" // Fallback if no valid extension found or it's part of a path
    } else {
        ext
    };


    // If S3 is configured, upload and return S3 URL
    if let (Some(s3), Some(bucket)) = (s3, bucket) {
        let s3_key = format!("{}.{}", hash, ext);
        match upload_to_s3(s3, bucket, &s3_key, &bytes).await {
            Ok(s3_url) => return Ok((s3_url, resolved, "s3".to_string())),
            Err(e) => {
                // If S3 upload fails, we now return an error instead of falling back to local.
                return Err(anyhow::anyhow!("Failed to upload to S3: {}", e));
            }
        }
    } else {
        // If S3 is NOT configured, we also return an error because local caching is removed.
        return Err(anyhow::anyhow!("S3 not configured for media caching. No local fallback enabled."));
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load Kafka and DB config from env
    let kafka_brokers = env::var("KAFKA_BROKERS").expect("KAFKA_BROKERS must be set");
    let kafka_topic = env::var("KAFKA_TOPIC").unwrap_or_else(|_| "nft_mint_jobs".to_string());
    let group_id = env::var("KAFKA_GROUP_ID").unwrap_or_else(|_| "metadata_worker_group".to_string());
    
    // --- START: ADDED/UPDATED KAFKA SASL/SSL CONFIGURATION ---
    let security_protocol = env::var("KAFKA_SECURITY_PROTOCOL").unwrap_or_else(|_| "SASL_SSL".to_string());
    let sasl_mechanisms = env::var("KAFKA_SASL_MECHANISMS").unwrap_or_else(|_| "PLAIN".to_string());
    let sasl_username = env::var("KAFKA_SASL_USERNAME").expect("KAFKA_SASL_USERNAME must be set for Confluent Cloud");
    let sasl_password = env::var("KAFKA_SASL_PASSWORD").expect("KAFKA_SASL_PASSWORD must be set for Confluent Cloud");
    let session_timeout_ms = env::var("KAFKA_SESSION_TIMEOUT_MS").unwrap_or_else(|_| "45000".to_string());
    // --- END: ADDED/UPDATED KAFKA SASL/SSL CONFIGURATION ---

    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&db_url).await?;

    // S3 config
    let s3_bucket = env::var("S3_BUCKET").ok();
    let s3_region = env::var("AWS_REGION").ok();
    let s3_access_key = env::var("AWS_ACCESS_KEY_ID").ok();
    let s3_secret_key = env::var("AWS_SECRET_ACCESS_KEY").ok();
    let s3_client = if let (Some(region), Some(access_key), Some(secret_key)) = (s3_region.clone(), s3_access_key.clone(), s3_secret_key.clone()) {
        let region_provider = Region::new(region);
        let credentials_provider = Credentials::new(access_key, secret_key, None, None, "env");
        let sdk_config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .region(region_provider)
            .credentials_provider(credentials_provider)
            .load()
            .await;
        Some(S3Client::new(&sdk_config))
    } else {
        None
    };

    // Set up Kafka consumer
    let consumer: StreamConsumer = ClientConfig::new()
        .set("bootstrap.servers", &kafka_brokers)
        .set("group.id", &group_id)
        .set("auto.offset.reset", "earliest")
        // --- START: APPLYING KAFKA SASL/SSL SETTINGS TO CLIENT CONFIG ---
        .set("security.protocol", &security_protocol)
        .set("sasl.mechanisms", &sasl_mechanisms)
        .set("sasl.username", &sasl_username)
        .set("sasl.password", &sasl_password)
        .set("session.timeout.ms", &session_timeout_ms)
        // --- END: APPLYING KAFKA SASL/SSL SETTINGS TO CLIENT CONFIG ---
        .create()
        .expect("Failed to create Kafka consumer");

    consumer.subscribe(&[&kafka_topic])?;
    println!("Metadata worker listening to Kafka topic: {}", kafka_topic);

    let client = Client::new();
    let mut message_stream = consumer.stream();
    while let Some(message) = message_stream.next().await {
        match message {
            Ok(m) => {
                if let Some(payload) = m.payload() {
                    match serde_json::from_slice::<NftMintJob>(payload) {
                        Ok(job) => {
                            println!("Received job: {:?}", job);
                            if let Some(token_uri) = &job.metadata_uri {
                                match fetch_and_normalize_metadata(&client, token_uri).await {
                                    Ok(normalized) => {
                                        println!("Normalized metadata: {:?}", normalized);
                                        // Store metadata in DB
                                        let meta = NftMetadata {
                                            contract_address: job.contract_address.clone(),
                                            token_id: job.token_id.clone(),
                                            chain: job.chain.clone(),
                                            name: normalized.name.clone(),
                                            description: normalized.description.clone(),
                                            attributes: normalized.attributes.clone(),
                                            raw_metadata: normalized.raw.clone(),
                                        };
                                        if let Err(e) = db::insert_nft_metadata(&pool, &meta).await {
                                            eprintln!("[ERROR] Failed to insert metadata into DB: {}", e);
                                        }
                                        // Fetch and cache media (image, animation_url)
                                        if let Some(image_url) = &normalized.image {
                                            match fetch_and_cache_media(&client, s3_client.as_ref(), s3_bucket.as_deref(), image_url).await {
                                                Ok((cached_url, resolved_url, backend)) => {
                                                    println!("Cached image to: {} (backend: {})", cached_url, backend);
                                                    let media = NftMedia {
                                                        contract_address: job.contract_address.clone(),
                                                        token_id: job.token_id.clone(),
                                                        media_type: "image".to_string(),
                                                        original_url: image_url.to_string(),
                                                        cached_url,
                                                        storage_backend: backend,
                                                    };
                                                    if let Err(e) = db::insert_nft_media(&pool, &media).await {
                                                        eprintln!("[ERROR] Failed to insert image media into DB: {}", e);
                                                    }
                                                }
                                                Err(e) => eprintln!("[ERROR] Failed to cache image: {}", e),
                                            }
                                        }
                                        if let Some(anim_url) = &normalized.animation_url {
                                            match fetch_and_cache_media(&client, s3_client.as_ref(), s3_bucket.as_deref(), anim_url).await {
                                                Ok((cached_url, resolved_url, backend)) => {
                                                    println!("Cached animation to: {} (backend: {})", cached_url, backend);
                                                    let media = NftMedia {
                                                        contract_address: job.contract_address.clone(),
                                                        token_id: job.token_id.clone(),
                                                        media_type: "animation".to_string(),
                                                        original_url: anim_url.to_string(),
                                                        cached_url,
                                                        storage_backend: backend,
                                                    };
                                                    if let Err(e) = db::insert_nft_media(&pool, &media).await {
                                                        eprintln!("[ERROR] Failed to insert animation media into DB: {}", e);
                                                    }
                                                }
                                                Err(e) => eprintln!("[ERROR] Failed to cache animation: {}", e),
                                            }
                                        }
                                    }
                                    Err(e) => eprintln!("[ERROR] Failed to fetch/normalize metadata for token_uri '{}': {}", token_uri, e),
                                }
                            } else {
                                eprintln!("[ERROR] No metadata_uri in job");
                            }
                        }
                        Err(e) => eprintln!("[ERROR] Failed to deserialize job: {e}"),
                    }
                }
            }
            Err(e) => eprintln!("[ERROR] Kafka error: {e}"),
        }
    }
    Ok(())
}
