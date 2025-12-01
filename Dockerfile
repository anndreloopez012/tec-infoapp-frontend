# Custom Dockerfile to avoid npm ci lockfile mismatch issues
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (leveraging Docker layer cache)
COPY package.json package-lock.json ./

# Use npm install instead of npm ci to allow lockfile update inside container
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the Vite app
RUN npm run build

# Production image: use a lightweight Node image with a simple static file server
FROM node:20-alpine AS runner
WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port (Vite preview / static server default)
EXPOSE 4173

# Serve the built app
CMD ["serve", "-s", "dist", "-l", "4173"]
