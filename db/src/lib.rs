//! Database schema (Postgres):
// Table: nft_metadata
//   - id (serial primary key)
//   - contract_address (text)
//   - token_id (text)
//   - chain (text)
//   - name (text)
//   - description (text)
//   - attributes (jsonb)
//   - raw_metadata (jsonb)
//   - created_at (timestamp)
//
// Table: nft_media
//   - id (serial primary key)
//   - contract_address (text)
//   - token_id (text)
//   - media_type (text) -- e.g. 'image', 'animation'
//   - original_url (text)
//   - cached_url (text)
//   - storage_backend (text) -- e.g. 'local', 's3'
//   - created_at (timestamp)

use sqlx::PgPool;
use serde_json::Value;

#[derive(serde::Serialize)]
pub struct NftMetadata {
    pub contract_address: String,
    pub token_id: String,
    pub chain: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub attributes: Option<Value>,
    pub raw_metadata: Value,
}

pub struct NftMedia {
    pub contract_address: String,
    pub token_id: String,
    pub media_type: String,
    pub original_url: String,
    pub cached_url: String,
    pub storage_backend: String,
}

pub async fn insert_nft_metadata(pool: &PgPool, meta: &NftMetadata) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"INSERT INTO nft_metadata (contract_address, token_id, chain, name, description, attributes, raw_metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (contract_address, token_id, chain) DO NOTHING"#,
        meta.contract_address,
        meta.token_id,
        meta.chain,
        meta.name,
        meta.description,
        meta.attributes.clone(),
        meta.raw_metadata.clone()
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn insert_nft_media(pool: &PgPool, media: &NftMedia) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"INSERT INTO nft_media (contract_address, token_id, media_type, original_url, cached_url, storage_backend, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (contract_address, token_id, media_type) DO NOTHING"#,
        media.contract_address,
        media.token_id,
        media.media_type,
        media.original_url,
        media.cached_url,
        media.storage_backend
    )
    .execute(pool)
    .await?;
    Ok(())
}
