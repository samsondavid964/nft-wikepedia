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

# Copy only Cargo.toml and Cargo.lock first to leverage Docker caching
# This step runs as root initially, but we'll chown them before building.
COPY --chown=appuser:appuser Cargo.toml Cargo.lock ./

# Copy the rest of the application source code, also with appuser ownership
COPY --chown=appuser:appuser . .

# Now, set the user for all subsequent build and runtime commands.
USER appuser

# Accept DATABASE_URL as build arg for sqlx
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the project
# Now that Cargo.toml and Cargo.lock (and the rest of the app) are
# owned by appuser, this build should proceed without permission issues.
RUN cargo build --release -p metadata_worker

# Default command (can be overridden)
CMD ["cargo", "run", "--release", "-p", "metadata_worker"]
