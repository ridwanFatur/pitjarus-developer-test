# Backend API - Product Compliance Dashboard

## Run

```bash
npm install
npm run dev
```

Default server URL: `http://localhost:8000`

## Environment

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=dev_test114
PORT=8000
```

## API Endpoints

### 1) Get Areas

`GET /api/areas`

Example:

```bash
curl "http://localhost:8000/api/areas"
```

Response:

```json
{
  "data": [
    { "area_id": 1, "area_name": "DKI jakarta" }
  ]
}
```

### 2) Get Dashboard Data

`GET /api/dashboard?areaIds=1,2&dateFrom=2021-01-01&dateTo=2021-01-03`

Query params:
- `areaIds` (required): comma-separated area IDs.
- `dateFrom` (optional): format `YYYY-MM-DD`.
- `dateTo` (optional): format `YYYY-MM-DD`.

Examples:

```bash
# All dates for areas 1 and 2
curl "http://localhost:8000/api/dashboard?areaIds=1,2"

# From a specific date onward
curl "http://localhost:8000/api/dashboard?areaIds=1,2&dateFrom=2021-01-02"

# Up to a specific date
curl "http://localhost:8000/api/dashboard?areaIds=1,2&dateTo=2021-01-03"

# Between two dates (inclusive)
curl "http://localhost:8000/api/dashboard?areaIds=1,2&dateFrom=2021-01-01&dateTo=2021-01-03"
```

Response shape:

```json
{
  "chart": [
    {
      "area_id": 1,
      "area_name": "DKI jakarta",
      "compliance_percentage": 70
    }
  ],
  "table": [
    {
      "brand_id": 1,
      "brand_name": "ROTI TAWAR",
      "areas": [
        {
          "area_id": 1,
          "area_name": "DKI jakarta",
          "compliance_percentage": 70
        }
      ]
    }
  ]
}
```

### 3) Health Check

`GET /health`

```bash
curl "http://localhost:8000/health"
```
