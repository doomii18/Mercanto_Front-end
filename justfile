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
build-image:
    podman build -t mercanto-frontend:prod -f Containerfile .

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
