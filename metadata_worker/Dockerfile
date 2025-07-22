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
        awscli \
        cmake \
        && rm -rf /var/lib/apt/lists/*

# Create a new user (appuser) and its home directory
RUN useradd -ms /bin/bash appuser

# Set workdir for subsequent commands
WORKDIR /app

# Copy only Cargo.toml first to leverage Docker caching.
COPY --chown=appuser:appuser Cargo.toml ./

# Copy the rest of the application source code.
COPY --chown=appuser:appuser . .

# Ensure necessary build directories/files are owned by appuser
# These commands run as root before USER appuser
RUN mkdir -p target && chown appuser:appuser target
RUN touch Cargo.lock && chown appuser:appuser Cargo.lock

# No longer need RUN mkdir -p /app/image_cache and chown for it
# because the application no longer writes to media_cache locally.

# Now, set the user for all subsequent build and runtime commands.
USER appuser

# Accept DATABASE_URL as build arg for sqlx
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the project
RUN cargo build --release -p metadata_worker

# Default command (can be overridden)
CMD ["cargo", "run", "--release", "-p", "metadata_worker"]
