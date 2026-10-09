set dotenv-load

# List available recipes
default:
    @just --list

# Install npm dependencies locally on host
install:
    npm install

# Start development container using Podman (Node 26 Debian + mounted source & node_modules)
dev:
    podman compose -f debug.compose.yml up

# Start development server directly on the host
dev-local:
    npm run dev

# Stop development container
down-dev:
    podman compose -f debug.compose.yml down

# Stream logs from development container
logs-dev:
    podman compose -f debug.compose.yml logs -f

# Build production OCI container image using Podman (multi-stage Node build + Nginx runtime)
build-image api_base_url="":
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -n "{{api_base_url}}" ]; then
        podman build --build-arg VITE_API_BASE_URL="{{api_base_url}}" -t mercanto-frontend:prod -f Containerfile .
    else
        podman build -t mercanto-frontend:prod -f Containerfile .
    fi

# Tag production container image for Docker Hub registry
tag-image tag="prod":
    podman tag mercanto-frontend:prod docker.io/haterofvectors/mercanto-client:{{tag}}

# Upload production container image to Docker Hub registry using Podman
upload-image tag="prod":
    #!/usr/bin/env bash
    set -euo pipefail
    target="docker.io/haterofvectors/mercanto-client:{{tag}}"
    if ! podman image exists "$target" && podman image exists "haterofvectors/mercanto-client:{{tag}}"; then
        podman tag "haterofvectors/mercanto-client:{{tag}}" "$target"
    elif ! podman image exists "$target" && podman image exists "mercanto-frontend:prod"; then
        podman tag "mercanto-frontend:prod" "$target"
    fi
    podman push "$target"

alias push-image := upload-image
alias upload := upload-image

# Pull production container image from Docker Hub registry
pull-image tag="prod":
    podman pull docker.io/haterofvectors/mercanto-client:{{tag}}

# Build production static assets directly on host
build-local:
    npm run build

# Run Vue TypeScript static typecheck
typecheck:
    npm run typecheck

# Deploy / run production container in background
up-prod:
    podman compose up -d

# Stop production container
down-prod:
    podman compose down

# Stream logs from production container
logs-prod:
    podman compose logs -f

# Preview production build locally via Vite
preview:
    npm run preview
