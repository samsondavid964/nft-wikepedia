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

# --- IMPORTANT CHANGE STARTS HERE ---
# Instead of `COPY . .` followed by `chown`,
# use `COPY --chown` to set ownership during the copy itself.
# This ensures files are owned by appuser from the moment they land in /app.
COPY --chown=appuser:appuser . .

# Now, set the user for all subsequent build and runtime commands.
# This ensures cargo build runs as appuser and creates files with correct ownership.
USER appuser
# --- IMPORTANT CHANGE ENDS HERE ---

# Accept DATABASE_URL as build arg for sqlx
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the project
# This command will now run as 'appuser', and because /app and its contents
# are already owned by appuser, there should be no permission issues.
RUN cargo build --release -p metadata_worker

# Default command (can be overridden)
# We are already as appuser from above, so this is just for clarity or if
# you wanted to change user again for the final run, which is rare.
CMD ["cargo", "run", "--release", "-p", "metadata_worker"]
