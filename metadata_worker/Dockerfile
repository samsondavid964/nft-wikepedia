# Use the latest official Rust image as a base
FROM rust:slim

# Install system dependencies (OpenSSL, pkg-config, etc.)
# Ensure there are NO non-breaking spaces (\u00a0) here, only regular spaces
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

# Create a new user to avoid running as root
RUN useradd -ms /bin/bash appuser

# Set workdir
WORKDIR /app

# Copy the entire workspace into the image
COPY . .

# IMPORTANT CHANGE HERE: Change ownership of the whole /app directory
# (This was the fix for the previous "Permission denied" error, keep it)
RUN chown -R appuser:appuser /app

# Accept DATABASE_URL as build arg for sqlx (no change needed here)
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the project (no ownership change needed here anymore, as /app is already owned by appuser)
RUN cargo build --release

# Switch to non-root user for running
USER appuser

# Default command (can be overridden)
CMD ["cargo", "run", "--release", "-p", "metadata_worker"]
