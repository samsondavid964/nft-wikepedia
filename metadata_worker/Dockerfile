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

# Create a new user to avoid running as root
RUN useradd -ms /bin/bash appuser

# Set workdir
WORKDIR /app

# Copy the entire workspace into the image
COPY . .

# --- IMPORTANT CHANGE STARTS HERE ---
# Switch to the non-root user *before* building
USER appuser

# Now, explicitly chown /app to appuser.
# This is still necessary because `COPY . .` (which happens before `USER appuser`)
# runs as root, so the copied files will be initially owned by root.
# We need appuser to own them before it tries to build/write.
RUN chown -R appuser:appuser /app

# --- IMPORTANT CHANGE ENDS HERE ---

# Accept DATABASE_URL as build arg for sqlx
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the project
# This command will now run as 'appuser', and it should have the necessary permissions
# to create and modify files within /app/target/release.
RUN cargo build --release

# The final USER appuser instruction for the CMD is now redundant, but harmless,
# as the user was already set. You can remove it or keep it for clarity.
# USER appuser

# Default command (can be overridden)
CMD ["cargo", "run", "--release", "-p", "metadata_worker"]
