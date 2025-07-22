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
# This ensures we have the manifest, and Cargo.lock will be handled next.
COPY --chown=appuser:appuser Cargo.toml ./

# Copy the rest of the application source code.
# This will bring in src/, Cargo.lock (if it exists locally), etc.
COPY --chown=appuser:appuser . .

# IMPORTANT: Explicitly ensure Cargo.lock is owned by appuser
# This addresses cases where Cargo.lock might be brought in with root ownership
# due to caching or previous build steps, or if it's newly created.
# We also create a dummy Cargo.lock if it doesn't exist, owned by appuser.
# This ensures the file exists and is writable by appuser before cargo build tries to use it.
# If it exists, `chown` will fix its permissions.
RUN touch Cargo.lock && chown appuser:appuser Cargo.lock

# Now, set the user for all subsequent build and runtime commands.
USER appuser

# Accept DATABASE_URL as build arg for sqlx
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the project
# Now, with explicit chown on Cargo.lock (and ensuring it exists and is writable),
# this build should proceed without permission issues.
RUN cargo build --release -p metadata_worker

# Default command (can be overridden)
CMD ["cargo", "run", "--release", "-p", "metadata_worker"]
