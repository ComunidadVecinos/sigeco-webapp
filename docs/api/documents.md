# Documents API

> API index: [docs/api/README.md](./README.md)

This module manages community folders, PDF files and document streaming.

Base path: `/api/communities/:communityId/documents`

---

## Access rules

| Endpoint group | Required access |
|---|---|
| `GET /documents` | Any active membership in the community |
| `GET /documents/folders/tree` | Any active membership in the community |
| `GET /documents/files/:documentId/content` | Any active membership in the community |
| Folder and file write operations | Active administrative access in the community |

Shared business rules:

- Read access allows browsing folders, listing files and opening document content
- Write access requires community administrative access
- Only PDF files are accepted
- Uploads count against the community storage quota

---

## Common resource shapes

### Folder item

```json
{
  "id": "uuid",
  "name": "Minutes",
  "parentId": null,
  "createdAt": "2026-04-01T10:00:00.000Z",
  "documentsCount": 12,
  "childrenCount": 3
}
```

### Folder reference

Used by `parentFolder` and `breadcrumbs`.

```json
{
  "id": "uuid",
  "name": "Minutes",
  "parentId": null,
  "createdAt": "2026-04-01T10:00:00.000Z"
}
```

### Document item

```json
{
  "id": "uuid",
  "name": "Minutes April 2026",
  "description": "Approved by the board",
  "parentId": "uuid",
  "sizeBytes": 482013,
  "mimeType": "application/pdf",
  "createdAt": "2026-04-02T09:15:00.000Z",
  "updatedAt": "2026-04-02T09:15:00.000Z",
  "url": "/api/communities/<communityId>/documents/files/<documentId>/content"
}
```

### Storage summary

```json
{
  "quotaBytes": 104857600,
  "usedBytes": 27500000,
  "availableBytes": 77357600,
  "usagePercent": 26.23
}
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/communities/:communityId/documents` | List folders and documents in the selected scope |
| `GET` | `/api/communities/:communityId/documents/folders/tree` | Get the active folder tree |
| `POST` | `/api/communities/:communityId/documents/folders` | Create a folder |
| `PATCH` | `/api/communities/:communityId/documents/folders/:folderId` | Rename a folder |
| `DELETE` | `/api/communities/:communityId/documents/folders/:folderId` | Delete a folder recursively |
| `POST` | `/api/communities/:communityId/documents/files` | Upload a PDF file |
| `PATCH` | `/api/communities/:communityId/documents/files/:documentId` | Rename a document |
| `DELETE` | `/api/communities/:communityId/documents/files/:documentId` | Delete a document |
| `GET` | `/api/communities/:communityId/documents/files/:documentId/content` | Stream or download a document |

---

## 1. List documents in a scope

`GET /api/communities/:communityId/documents`

### Query params

| Param | Required | Rules |
|---|---|---|
| `parentId` | No | UUID |
| `search` | No | Trimmed text filter |
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `20` |

`parentId` selects the folder scope. Omitting it lists the root level.

### Success

- Status: `200 OK`

```json
{
  "parentFolder": null,
  "breadcrumbs": [],
  "folders": [
    {
      "id": "uuid",
      "name": "Minutes",
      "parentId": null,
      "createdAt": "2026-04-01T10:00:00.000Z",
      "documentsCount": 12,
      "childrenCount": 3
    }
  ],
  "documents": [
    {
      "id": "uuid",
      "name": "Minutes April 2026",
      "description": "Approved by the board",
      "parentId": "uuid",
      "sizeBytes": 482013,
      "mimeType": "application/pdf",
      "createdAt": "2026-04-02T09:15:00.000Z",
      "updatedAt": "2026-04-02T09:15:00.000Z",
      "url": "/api/communities/<communityId>/documents/files/<documentId>/content"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  },
  "storage": {
    "quotaBytes": 104857600,
    "usedBytes": 27500000,
    "availableBytes": 77357600,
    "usagePercent": 26.23
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community or requested parent folder not found |
| `422` | `VALIDATION_ERROR` | Invalid params or query values |

---

## 2. Get folder tree

`GET /api/communities/:communityId/documents/folders/tree`

Returns the active folder hierarchy for navigation and selectors.

### Success

- Status: `200 OK`

```json
{
  "folders": [
    {
      "id": "uuid",
      "name": "Minutes",
      "children": []
    }
  ]
}
```

---

## 3. Create folder

`POST /api/communities/:communityId/documents/folders`

### Request

```json
{
  "name": "Minutes",
  "parentId": "optional-folder-uuid"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `name` | Required, trimmed, max `255` |
| `parentId` | Optional, UUID |

### Success

- Status: `201 Created`

```json
{
  "folder": {
    "id": "uuid",
    "name": "Minutes",
    "parentId": null,
    "createdAt": "2026-04-01T10:00:00.000Z",
    "documentsCount": 0,
    "childrenCount": 0
  }
}
```

### Business rules

- Folder names must be unique within the same active parent scope
- `parentId`, when provided, must refer to an active folder in the same community

---

## 4. Rename folder

`PATCH /api/communities/:communityId/documents/folders/:folderId`

### Request

```json
{
  "name": "Board Minutes"
}
```

### Success

- Status: `200 OK`

```json
{
  "folder": {
    "id": "uuid",
    "name": "Board Minutes",
    "parentId": null,
    "createdAt": "2026-04-01T10:00:00.000Z",
    "documentsCount": 0,
    "childrenCount": 0
  }
}
```

---

## 5. Delete folder

`DELETE /api/communities/:communityId/documents/folders/:folderId`

Deletes the folder recursively, including active descendant folders and documents.

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "folderId": "uuid",
  "deletedDocuments": 4
}
```

---

## 6. Upload document

`POST /api/communities/:communityId/documents/files`

### Request

```http
Content-Type: multipart/form-data
```

Form fields:

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | Text | Yes | Max `255` |
| `description` | Text | No | Max `2000` |
| `folderId` | Text | No | UUID |
| `file` | File | Yes | PDF only |

### Success

- Status: `201 Created`

```json
{
  "document": {
    "id": "uuid",
    "name": "Budget 2026",
    "description": null,
    "parentId": null,
    "sizeBytes": 482013,
    "mimeType": "application/pdf",
    "createdAt": "2026-04-02T09:15:00.000Z",
    "updatedAt": "2026-04-02T09:15:00.000Z",
    "url": "/api/communities/<communityId>/documents/files/<documentId>/content"
  }
}
```

### Business rules

- The uploaded file must be a valid PDF
- The target folder, when provided, must belong to the same community and remain active
- Upload is rejected when the new file would exceed the community storage quota
- Active documents cannot reuse the same name within the same active folder scope

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `409` | `CONFLICT` | Name conflict in the same scope |
| `409` | `STORAGE_QUOTA_EXCEEDED` | Upload would exceed the available quota |
| `413` | `FILE_TOO_LARGE` | File exceeds the upload limit |
| `415` | `FILE_TYPE_UNSUPPORTED` | File is not an accepted PDF |
| `422` | `VALIDATION_ERROR` | Missing file or invalid multipart fields |

---

## 7. Rename document

`PATCH /api/communities/:communityId/documents/files/:documentId`

### Request

```json
{
  "name": "Budget 2026 v2"
}
```

### Success

- Status: `200 OK`

```json
{
  "document": {
    "id": "uuid",
    "name": "Budget 2026 v2",
    "description": null,
    "parentId": null,
    "sizeBytes": 482013,
    "mimeType": "application/pdf",
    "createdAt": "2026-04-02T09:15:00.000Z",
    "updatedAt": "2026-04-03T11:00:00.000Z",
    "url": "/api/communities/<communityId>/documents/files/<documentId>/content"
  }
}
```

---

## 8. Delete document

`DELETE /api/communities/:communityId/documents/files/:documentId`

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "documentId": "uuid"
}
```

Deletion removes the active database record, releases the tracked storage usage and deletes the stored PDF.

---

## 9. Stream document content

`GET /api/communities/:communityId/documents/files/:documentId/content`

### Query params

| Param | Required | Rules |
|---|---|---|
| `download` | No | Boolean-like value; `true`, `1` and `yes` force attachment mode |

### Behavior

- Default mode serves the PDF inline
- When `download=true`, the response uses attachment disposition
- The endpoint streams the binary content instead of returning JSON

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community, folder or document not found |
| `422` | `VALIDATION_ERROR` | Invalid params or query values |

---

## Common document error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| User lacks the required community access | `403` | `FORBIDDEN` |
| Parent folder or document does not exist | `404` | `NOT_FOUND` |
| Invalid UUID, pagination or query value | `422` | `VALIDATION_ERROR` |
| Duplicate active name in the same scope | `409` | `CONFLICT` |
| Upload exceeds community quota | `409` | `STORAGE_QUOTA_EXCEEDED` |
| Invalid or unsupported uploaded PDF | `415` or `422` | Depends on the failure source |
