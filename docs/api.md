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
