# Docker Setup for M3U8 to MP4 Converter

This document provides instructions for running the M3U8 to MP4 Converter using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### Production Mode

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

3. **Stop the services:**
   ```bash
   docker-compose down
   ```

### Development Mode

1. **Build and start development services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Access the application:**
   - Frontend (with hot reload): http://localhost:5173
   - Backend API (with hot reload): http://localhost:4000

3. **Stop the development services:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## Available Commands

### Production Commands

```bash
# Build and start services in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop services and remove volumes
docker-compose down -v

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d --build

# View development logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## Service Details

### Backend Service
- **Container Name:** m3u8-converter-backend
- **Port:** 4000
- **Health Check:** GET /health
- **Volumes:** 
  - backend_uploads (for temporary uploaded files)
  - backend_downloads (for converted files)

### Frontend Service
- **Container Name:** m3u8-converter-frontend
- **Port:** 3000 (production) / 5173 (development)
- **Web Server:** Nginx (production) / Vite dev server (development)

## Environment Variables

### Backend
- `NODE_ENV`: Set to 'production' or 'development'
- `PORT`: Server port (default: 4000)

### Frontend
- `NODE_ENV`: Set to 'production' or 'development'

## Volumes

- `backend_uploads`: Stores temporary uploaded M3U8 files
- `backend_downloads`: Stores converted MP4 files

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check if ports are in use
   lsof -i :3000
   lsof -i :4000
   lsof -i :5173
   ```

2. **Permission issues with volumes:**
   ```bash
   # Reset volumes
   docker-compose down -v
   docker-compose up --build
   ```

3. **FFmpeg not found:**
   - FFmpeg is automatically installed in the backend container
   - If issues persist, rebuild the backend image:
   ```bash
   docker-compose build --no-cache backend
   ```

4. **Frontend not connecting to backend:**
   - Ensure both services are running
   - Check if backend health check passes:
   ```bash
   curl http://localhost:4000/health
   ```

### Debugging

1. **Access container shell:**
   ```bash
   # Backend container
   docker-compose exec backend sh
   
   # Frontend container
   docker-compose exec frontend sh
   ```

2. **Check container logs:**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Inspect container status:**
   ```bash
   docker-compose ps
   ```

## Performance Optimization

### Production Optimizations
- Multi-stage builds for smaller image sizes
- Nginx with gzip compression and caching
- Health checks for service monitoring
- Proper volume management for temporary files

### Development Optimizations
- Hot reloading for both frontend and backend
- Volume mounts for source code
- Separate development containers

## Security Considerations

- Containers run as non-root users where possible
- Nginx security headers configured
- Temporary files are properly isolated in volumes
- No sensitive data in environment variables

## Scaling

To scale the application:

```bash
# Scale backend service
docker-compose up --scale backend=3

# Use a load balancer (nginx, traefik, etc.) for multiple frontend instances
```

Note: The current setup uses local volumes. For production scaling, consider using external storage solutions.