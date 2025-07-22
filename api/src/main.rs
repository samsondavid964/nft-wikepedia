use axum::{routing::get, Router, Json, extract::State};
use db::NftMetadata; // Assuming NftMetadata is in your 'db' crate and has 'cached_image_url' field
use sqlx::PgPool;
use std::net::SocketAddr;
use std::env;
use tower_http::cors::{CorsLayer, Any};
use axum::http::{Method, HeaderValue};

#[axum::debug_handler]
async fn list_nfts(State(pool): State<PgPool>) -> Json<Vec<NftMetadata>> {
    let nfts = sqlx::query_as!(
        // We select all existing columns from nft_metadata (nm.*)
        // AND specifically the cached_url from the joined nft_media table, aliased as cached_image_url.
        // NftMetadata struct MUST have a 'pub cached_image_url: Option<String>' field to match this.
        NftMetadata,
        r#"
        SELECT
            nm.contract_address,
            nm.token_id,
            nm.chain,
            nm.name,
            nm.description,
            nm.attributes,
            nm.raw_metadata,
            img_media.cached_url AS cached_image_url -- Alias to match NftMetadata field
        FROM
            nft_metadata nm
        LEFT JOIN
            nft_media img_media ON nm.contract_address = img_media.contract_address
                                AND nm.token_id = img_media.token_id
                                AND img_media.media_type = 'image' -- Crucial: only get the image media
        LIMIT 50
        "#
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_else(|e| {
        eprintln!("Failed to fetch NFTs: {}", e); // Log the actual error for debugging
        Vec::new() // Return an empty vector on error, so the API doesn't crash
    });
    Json(nfts)
}

#[tokio::main]
async fn main() {
    // Load environment variables from .env file (for local development)
    dotenvy::dotenv().ok();

    // Database connection setup
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL environment variable must be set");
    let pool = PgPool::connect(&db_url).await.expect("Failed to connect to PostgreSQL database");
    
    // CORS (Cross-Origin Resource Sharing) configuration
    // This allows your frontend (nft-wikepedia-1.onrender.com) to make requests to this API.
    let cors = CorsLayer::new()
        // Allow requests from your specific frontend origin.
        // It's parsed into a HeaderValue because `allow_origin` expects this type.
        .allow_origin(
            "https://nft-wikepedia-1.onrender.com"
                .parse::<HeaderValue>()
                .expect("Failed to parse allowed origin URL"), // Use expect for clearer error if URL is malformed
        )
        // Allow common HTTP methods for API interaction. OPTIONS is needed for preflight requests.
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        // Allow any headers. You could restrict this to specific headers if needed for more security.
        .allow_headers(Any);

    // Create the Axum router
    let app = Router::new()
        // Define the /nfts endpoint that handles GET requests
        .route("/nfts", get(list_nfts))
        // Share the database connection pool across all handlers
        .with_state(pool.clone())
        // Apply the CORS middleware to the router
        .layer(cors);
        
    // Server setup: Get port from environment or default to 3000
    let port = env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>() // Parse port as u16
        .expect("PORT environment variable must be a valid number");
    
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse().unwrap();
    
    // Start the Axum server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("✅ API Worker listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}
