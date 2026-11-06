# Product Compliance Dashboard

This project contains two applications:
- `backend`: Express + TypeScript API
- `frontend`: React + Vite dashboard

## Prerequisites

- Node.js 20+
- npm 10+
- Docker

## 1) Docker Setup (MySQL)

Run MySQL in Docker:

```bash
docker run --name my_db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=dev_test114 \
  -p 3306:3306 \
  -d mysql:8.4
```

Check container status:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

If you already have your own MySQL server, you can skip this step and adjust `.env` values.

## 2) Environment Configuration

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=dev_test114
PORT=8000
DASHBOARD_CACHE_TTL_MS=30000
AREAS_CACHE_TTL_MS=60000
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## 3) Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 4) Run the Project

Open two terminals.

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

## 5) URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

