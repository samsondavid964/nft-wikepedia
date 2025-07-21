# NFT Wikipedia

## Vision
A comprehensive, open-source, multi-chain NFT artwork indexer and discovery engine. Our mission is to make all digital art on-chain easily accessible, searchable, and discoverable for everyone.

## Architecture Overview
- **Rust Backend**: High-performance, modular event listener and metadata fetcher.
- **Message Queue**: Kafka (preferred) or RabbitMQ for job distribution.
- **PostgreSQL**: Primary database for normalized NFT data (with JSONB support).
- **Pluggable Chains**: Start with Ethereum (ERC-721/1155), designed for easy extension to other chains.

```
[Archive Node] -> [Rust Event Listener] -> [Kafka/RabbitMQ] -> [Rust Metadata Worker] -> [PostgreSQL]
```

## Getting Started

### Prerequisites
- Rust (latest stable)
- Docker (for Kafka/RabbitMQ and PostgreSQL)

### Project Structure
- `/event_listener` — Listens to blockchain events and produces jobs
- `/metadata_worker` — Consumes jobs, fetches/normalizes metadata, stores in DB
- `/db` — Database schema and migrations
- `/common` — Shared types and utilities

### Quickstart
1. Clone the repo
2. The Rust workspace is scaffolded and ready for development.
3. Run `docker-compose up` (coming soon) to start Kafka/RabbitMQ and PostgreSQL
4. Build the project: `cargo build`
5. Run the event listener and worker (instructions coming soon)

## Contributing
- Open to all contributors! Please see `CONTRIBUTING.md` (coming soon).

## License
MIT 