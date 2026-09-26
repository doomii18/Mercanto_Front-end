set dotenv-load

# List recipes
default:
    @just --list

# Install npm dependencies
install:
    npm install

# Start Vite development server
dev:
    npm run dev

# Typecheck and build for production
build:
    npm run build

# Run Vue TypeScript typecheck
typecheck:
    npm run typecheck

# Preview production build locally
preview:
    npm run preview
