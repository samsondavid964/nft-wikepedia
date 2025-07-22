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

# --- NEW ADDITION FOR TARGET DIRECTORY PERMISSIONS ---
# Create the target directory and ensure it's owned by appuser.
# This prevents permission denied errors when Cargo tries to build.
# This must run as root (before USER appuser).
RUN mkdir -p target && chown appuser:appuser target

# Ensure Cargo.lock is owned by appuser (from previous fix)
RUN touch Cargo.lock && chown appuser:appuser Cargo.lock
# --- END NEW ADDITION ---

# Now, set the user for all subsequent build and runtime commands.
USER appuser

# Accept DATABASE_URL as build arg for sqlx
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the project
RUN cargo build --release -p metadata_worker

# Default command (can be overridden)
CMD ["cargo", "run", "--release", "-p", "metadata_worker"]
