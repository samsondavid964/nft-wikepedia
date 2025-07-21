-- NFT Metadata Table
CREATE TABLE IF NOT EXISTS nft_metadata (
    id SERIAL PRIMARY KEY,
    contract_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    chain TEXT NOT NULL,
    name TEXT,
    description TEXT,
    attributes JSONB,
    raw_metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (contract_address, token_id, chain)
);

-- NFT Media Table
CREATE TABLE IF NOT EXISTS nft_media (
    id SERIAL PRIMARY KEY,
    contract_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    media_type TEXT NOT NULL, -- e.g. 'image', 'animation'
    original_url TEXT NOT NULL,
    cached_url TEXT NOT NULL,
    storage_backend TEXT NOT NULL, -- e.g. 'local', 's3'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (contract_address, token_id, media_type)
); 