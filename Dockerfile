# Multi-stage build for React App Shell
# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Accept build argument for npm token
ARG NPM_PACKAGE_TOKEN

# Configure npm to authenticate with GitHub Packages
RUN if [ -n "$NPM_PACKAGE_TOKEN" ]; then \
      echo "//npm.pkg.github.com/:_authToken=${NPM_PACKAGE_TOKEN}" > ~/.npmrc && \
      echo "@amuaapps:registry=https://npm.pkg.github.com" >> ~/.npmrc; \
    fi

# Install dependencies
# Use npm install due to persistent lock file sync issues
RUN npm install --only=production

# Clean up npmrc to avoid leaking token in image
RUN rm -f ~/.npmrc

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine

# Copy custom nginx configuration
COPY infra/azure/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
