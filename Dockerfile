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
EXPOSE 3000
CMD ["cargo", "run", "--release", "-p", "api"] 

# Build the frontend
FROM node:20 as frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Continue Rust build as before
FROM rust:slim as backend
# Set workdir
WORKDIR /app
COPY . .
# Accept DATABASE_URL as build arg for sqlx
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN cargo build --release --workspace && \
    chown -R appuser:appuser /app/target

# Copy frontend build output into backend image
COPY --from=frontend /app/frontend/dist /app/frontend_dist

USER appuser
EXPOSE 3000
CMD ["cargo", "run", "--release", "-p", "api"] 