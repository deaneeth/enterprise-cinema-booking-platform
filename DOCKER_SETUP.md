# Docker Setup Guide

Quick guide for running the Cinema Booking System with Docker.

---

## Prerequisites

1. **Install Docker Desktop**

   - Windows/Mac: https://www.docker.com/products/docker-desktop/
   - Linux: https://docs.docker.com/engine/install/

2. **Verify installation:**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## Quick Start

### Start All Services

```bash
docker-compose up -d
```

This starts:

- **MongoDB** → `localhost:27017`
- **Backend API** → `http://localhost:5000`
- **Frontend** → `http://localhost:3000`

### Run MongoDB Only (Without Backend and Frontend)

```bash
docker-compose up -d mongodb
```

### Run Backend Only (Without MongoDB and Frontend)

```bash
docker-compose up -d backend
```

### Run Frontend Only (Without MongoDB and Backend)

```bash
docker-compose up -d frontend
```

### Stop All Services

```bash
docker-compose down
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

---

## Useful Commands

| Command                          | Description              |
| -------------------------------- | ------------------------ |
| `docker-compose logs -f`         | View live logs           |
| `docker-compose logs backend`    | View backend logs only   |
| `docker-compose ps`              | Check container status   |
| `docker-compose restart backend` | Restart specific service |

---

## First-Time Build

First build takes **5-15 minutes** (downloading images + installing dependencies).

Subsequent builds are **much faster** due to Docker caching.

---

## Troubleshooting

**Containers not starting?**

```bash
docker-compose down
docker-compose up -d --build
```

**Port already in use?**

- Stop any local MongoDB/Node servers running on ports 27017, 5000, or 3000

**Clear everything and start fresh:**

```bash
docker-compose down -v    # Removes volumes too
docker-compose up -d --build
```

---

## Without Docker (Local Development)

If you prefer running locally without Docker:

1. Install MongoDB locally or use MongoDB Atlas
2. Run `npm install` in both `/backend` and `/frontend`
3. Create `.env` files with required variables
4. Run `npm run dev` (backend) and `npm start` (frontend)
