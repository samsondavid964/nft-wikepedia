# Use the latest official Rust image as a base
FROM rust:slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        pkg-config \
        libssl-dev \
        ca-certificates \
        librdkafka-dev \
        build-essential \
        cmake \
        && rm -rf /var/lib/apt/lists/*

# Create a new user
RUN useradd -ms /bin/bash appuser

# Set workdir
WORKDIR /app

# Copy the entire project context
COPY . .

# Build the specific package
RUN cargo build --release --package backfill_script && \
    chown -R appuser:appuser /app/target

# Switch to non-root user
USER appuser

# Command to run the backfill script
CMD ["/app/target/release/backfill_script"] 