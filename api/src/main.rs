use axum::{routing::get, Router, Json, extract::State};
use db::NftMetadata;
use sqlx::PgPool;
use std::net::SocketAddr;
use std::env;
use tower_http::cors::{CorsLayer, Any};
use axum::http::Method;

#[axum::debug_handler]
async fn list_nfts(State(pool): State<PgPool>) -> Json<Vec<NftMetadata>> {
    let nfts = sqlx::query_as!(
        NftMetadata,
        r#"SELECT contract_address, token_id, chain, name, description, attributes, raw_metadata FROM nft_metadata LIMIT 50"#
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();
    Json(nfts)
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&db_url).await.expect("Failed to connect to DB");
    
    let cors = CorsLayer::new()
        .allow_origin("https://nft-wikepedia-1.onrender.com".parse().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    let app = Router::new()
        .route("/nfts", get(list_nfts))
        .with_state(pool.clone())
        .layer(cors);
        
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse().unwrap();
    
    // Correct way to start the server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("✅ Listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}