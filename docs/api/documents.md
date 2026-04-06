# Documents API

> API index: [docs/api/README.md](./README.md)

Base path: `/api/communities/:communityId/documents`

---

## Overview

Community documents are protected resources scoped to a community.

Access rules:

- any active membership in the community can browse folders, list documents and open document content
- administrative write actions require community administrative access, so suspended vice presidents become read-only automatically
- only PDF files are accepted
- uploads count against the community quota tracked by `storage_quota_bytes` and `storage_used_bytes`

---

## Endpoints

### 1. List documents in a scope

`GET /api/communities/:communityId/documents`

Query params:

- `parentId?`
- `search?`
- `page`
- `pageSize`

Response:

- `parentFolder`
- `breadcrumbs`
- `folders`
- `documents`
- `pagination`
- `storage`

### 2. Get folder tree

`GET /api/communities/:communityId/documents/folders/tree`

Returns the active folder tree for navigation and selectors.

### 3. Create folder

`POST /api/communities/:communityId/documents/folders`

Body:

```json
{
  "name": "Actas",
  "parentId": "optional-folder-uuid"
}
```

### 4. Rename folder

`PATCH /api/communities/:communityId/documents/folders/:folderId`

### 5. Delete folder

`DELETE /api/communities/:communityId/documents/folders/:folderId`

Deletes the folder recursively with logical deletion in database and best-effort cleanup in storage.

### 6. Upload document

`POST /api/communities/:communityId/documents/files`

Content type: `multipart/form-data`

Fields:

- `name`
- `description?`
- `folderId?`
- `file`

### 7. Rename document

`PATCH /api/communities/:communityId/documents/files/:documentId`

### 8. Delete document

`DELETE /api/communities/:communityId/documents/files/:documentId`

### 9. Stream document content

`GET /api/communities/:communityId/documents/files/:documentId/content`

Query params:

- `download?` set to `1` or `true` to force attachment mode

---

## Error cases

Common error scenarios:

- invalid or missing PDF file
- file larger than the configured upload limit
- quota exceeded
- folder or document not found
- forbidden write attempt by a non-admin or suspended vice president
- name conflict in the same active scope