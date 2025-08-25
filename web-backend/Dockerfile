# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 4000

# Create directories for uploads and downloads
RUN mkdir -p /tmp/uploads /tmp/downloads

# Start the application
CMD ["npm", "start"]