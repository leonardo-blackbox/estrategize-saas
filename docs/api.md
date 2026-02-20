# Iris Platform — API Reference

Base URL: `http://localhost:3001`

All `/api/*` routes require `Authorization: Bearer <token>`.

---

## Consultancies (`/api/consultancies`)

### POST /api/consultancies

Create a new consultancy.

```bash
curl -X POST http://localhost:3001/api/consultancies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Digital Transformation", "client_name": "TechCorp"}'
```

**Body:** `{ title: string, client_name?: string, status?: "active"|"archived" }`
**Response:** `201 { data: Consultancy }`

### GET /api/consultancies

List all consultancies for the authenticated user (excludes soft-deleted).

```bash
curl http://localhost:3001/api/consultancies \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** `200 { data: Consultancy[] }`

### GET /api/consultancies/:id

Get a single consultancy by ID.

```bash
curl http://localhost:3001/api/consultancies/<uuid> \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** `200 { data: Consultancy }` or `404 { error: "Consultancy not found" }`

### PUT /api/consultancies/:id

Update a consultancy.

```bash
curl -X PUT http://localhost:3001/api/consultancies/<uuid> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "status": "archived"}'
```

**Body:** `{ title?: string, client_name?: string, status?: "active"|"archived" }`
**Response:** `200 { data: Consultancy }` or `404`

### DELETE /api/consultancies/:id

Soft delete (sets `deleted_at`, does not remove the row).

```bash
curl -X DELETE http://localhost:3001/api/consultancies/<uuid> \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** `200 { ok: true }` or `404`

---

## Diagnoses (`/api/consultancies/:id/diagnose`)

**Story 1.8** — Strategic diagnosis generation via OpenAI using the Iris method framework.

### POST /api/consultancies/:id/diagnose

Generate a strategic diagnosis for a consultancy using the Iris method.

```bash
curl -X POST http://localhost:3001/api/consultancies/<uuid>/diagnose \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:** `201 { data: Diagnosis }`

**Error:**
- `404` Consultancy not found
- `409` Diagnosis already exists (use PUT to update)
- `500` OpenAI API error or database error

### GET /api/consultancies/:id/diagnose

Fetch the latest diagnosis for a consultancy.

```bash
curl http://localhost:3001/api/consultancies/<uuid>/diagnose \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** `200 { data: Diagnosis }` or `404 { error: "No diagnosis found" }`

### PUT /api/consultancies/:id/diagnose

Update diagnosis content (executive summary). Creates a new version.

```bash
curl -X PUT http://localhost:3001/api/consultancies/<uuid>/diagnose \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "executiveSummary": "Updated summary...",
      "sections": [
        {"name": "Internal Assessment", "insights": [...]},
        {"name": "Market Reality", "insights": [...]}
      ]
    }
  }'
```

**Body:**
```json
{
  "content": {
    "executiveSummary": "string",
    "sections": [
      {"name": "string", "insights": ["string"]}
    ]
  }
}
```

**Response:** `200 { data: Diagnosis }` (new version)

### GET /api/consultancies/:id/diagnose/history

Get all diagnosis versions (history) for a consultancy.

```bash
curl http://localhost:3001/api/consultancies/<uuid>/diagnose/history \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** `200 { data: Diagnosis[] }`

---

## Diagnosis Schema

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner (auth.users FK) |
| consultancy_id | uuid | Parent consultancy (FK) |
| content | jsonb | Diagnosis content (`{ executiveSummary, sections }`) |
| is_edited | boolean | Whether the diagnosis was manually edited |
| edited_at | timestamptz | Last manual edit timestamp |
| version | integer | Diagnosis version (increments on edit) |
| tokens_used | integer | OpenAI tokens consumed |
| created_at | timestamptz | Initial generation timestamp |
| updated_at | timestamptz | Last update timestamp |

---

## Credits (`/api/credits`)

**Story 1.9** — Atomic reserve/consume/release credit system with idempotency.

### GET /api/credits/balance

Get current credit balance and usage stats.

```bash
curl http://localhost:3001/api/credits/balance \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "data": {
    "available": 100,
    "reserved": 5,
    "total_consumed": 20,
    "consumed_this_month": 8,
    "transaction_count": 15
  }
}
```

### POST /api/credits/reserve

Reserve credits before an operation (e.g. AI diagnosis). Atomic with balance check.

```bash
curl -X POST http://localhost:3001/api/credits/reserve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5, "idempotency_key": "diag-abc123", "description": "AI diagnosis"}'
```

**Body:** `{ amount: number, idempotency_key?: string, reference_id?: string, description?: string }`

**Response:** `201 { data: { reservation_id: "uuid" } }`

**Errors:**
- `400` Invalid input (Zod)
- `402` Insufficient credits

### POST /api/credits/consume

Confirm a reservation (reserve -> consume). Atomic, prevents double-consume.

```bash
curl -X POST http://localhost:3001/api/credits/consume \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reservation_id": "uuid"}'
```

**Body:** `{ reservation_id: string (uuid) }`

**Response:** `200 { ok: true }`

**Errors:**
- `404` Reservation not found
- `409` Reservation already processed (double-consume prevented)

### POST /api/credits/release

Cancel a reservation (returns credits to available balance). Atomic, prevents double-release.

```bash
curl -X POST http://localhost:3001/api/credits/release \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reservation_id": "uuid"}'
```

**Body:** `{ reservation_id: string (uuid) }`

**Response:** `200 { ok: true }`

**Errors:**
- `404` Reservation not found
- `409` Reservation already processed

### GET /api/credits/transactions

List recent credit transactions (paginated).

```bash
curl "http://localhost:3001/api/credits/transactions?limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**Query params:** `limit` (default 50, max 100), `offset` (default 0)

**Response:** `200 { data: CreditTransaction[] }`

---

## Credit Transaction Schema

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner (auth.users FK) |
| amount | integer | Credit amount (always positive) |
| type | text | `purchase`, `monthly_grant`, `reserve`, `consume`, `release` |
| status | text | `pending`, `confirmed`, `released` |
| idempotency_key | text | Unique key for dedup (nullable) |
| reference_id | text | Related entity ID (nullable) |
| description | text | Human-readable description (nullable) |
| created_at | timestamptz | Transaction timestamp |

### Credit Flow

```
User has 100 credits available

1. POST /reserve {amount: 5}  → available: 95, reserved: 5
2a. POST /consume {id}        → available: 95, consumed: 5   (success path)
2b. POST /release {id}        → available: 100, reserved: 0  (error path)
```

### Idempotency

Sending the same `idempotency_key` twice returns the existing reservation ID without creating a duplicate. This prevents double-charges under network retries.

---

## Error Format

All errors return: `{ error: string }`

| Code | Meaning |
|------|---------|
| 400 | Validation error (Zod) |
| 401 | Missing or invalid auth token |
| 402 | Insufficient credits |
| 404 | Resource not found or not owned |
| 409 | Conflict (already processed) |
| 500 | Internal server error |

---

## Consultancy Schema

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner (auth.users FK) |
| title | text | Consultancy title (required) |
| client_name | text | Client name (optional) |
| status | text | `active` or `archived` |
| deleted_at | timestamptz | Soft delete timestamp |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |
