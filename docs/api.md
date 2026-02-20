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

## Error Format

All errors return: `{ error: string }`

| Code | Meaning |
|------|---------|
| 400 | Validation error (Zod) |
| 401 | Missing or invalid auth token |
| 404 | Resource not found or not owned |
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
