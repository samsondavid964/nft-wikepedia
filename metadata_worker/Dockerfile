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

# --- Revised COPY strategy ---
# Copy only Cargo.toml first. This is crucial for caching and
# for cases where Cargo.lock might not exist initially.
COPY --chown=appuser:appuser Cargo.toml ./

# Copy the rest of the application source code, including Cargo.lock if it exists locally.
# If Cargo.lock doesn't exist, Cargo will generate it in the next step.
COPY --chown=appuser:appuser . .

# Now, set the user for all subsequent build and runtime commands.
USER appuser

# Accept DATABASE_URL as build arg for sqlx
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the project
# Cargo will now create or update Cargo.lock under appuser's ownership.
RUN cargo build --release -p metadata_worker

# Default command (can be overridden)
CMD ["cargo", "run", "--release", "-p", "metadata_worker"]
