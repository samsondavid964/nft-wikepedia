# Use the latest official Rust image as a base
FROM rust:slim

# Install system dependencies (OpenSSL, pkg-config, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        pkg-config \
        libssl-dev \
        ca-certificates \
        librdkafka-dev \
        build-essential \
        && rm -rf /var/lib/apt/lists/*

# Create a new user to avoid running as root
RUN useradd -ms /bin/bash appuser

# Set workdir
WORKDIR /app

# Copy the source code
COPY . .

# Accept DATABASE_URL as build arg for sqlx
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the project and change ownership
RUN cargo build --release --workspace && \
    chown -R appuser:appuser /app/target

# Switch to non-root user for running
USER appuser

# Default command (can be overridden)
CMD ["cargo", "run", "--release", "-p", "event_listener"] 