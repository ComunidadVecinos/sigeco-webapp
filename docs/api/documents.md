# Documents API

> API index: [docs/api/README.md](./README.md)

Community folders, PDF files, logical moves, and document streaming.

Base path: `/api/communities/:communityId/documents`

## Access rules

| Endpoint group | Required access |
|---|---|
| Browsing, tree view, and document content | Operational membership in the community |
| Folder and file write operations | Active administrative access |

Shared rules:

- Only PDF files are accepted
- Uploads count against the community storage quota
- Folder moves and file moves are logical operations on the document tree

## Resource shapes

Folder item:

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

Document item:

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

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/communities/:communityId/documents` | List folders and documents in one scope |
| `GET` | `/api/communities/:communityId/documents/folders/tree` | Get the folder tree |
| `POST` | `/api/communities/:communityId/documents/folders` | Create a folder |
| `PATCH` | `/api/communities/:communityId/documents/folders/:folderId` | Rename a folder |
| `DELETE` | `/api/communities/:communityId/documents/folders/:folderId` | Delete a folder recursively |
| `POST` | `/api/communities/:communityId/documents/files` | Upload a PDF document |
| `PATCH` | `/api/communities/:communityId/documents/files/:documentId` | Rename a document |
| `PATCH` | `/api/communities/:communityId/documents/move` | Move a folder or document |
| `DELETE` | `/api/communities/:communityId/documents/files/:documentId` | Delete a document |
| `GET` | `/api/communities/:communityId/documents/files/:documentId/content` | Stream or download a document |

## List query

`GET /api/communities/:communityId/documents`

| Param | Required | Rules |
|---|---|---|
| `parentId` | No | UUID |
| `search` | No | Text filter |
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `20`, max `100` |

Omitting `parentId` lists the root level.

The response includes `parentFolder`, `breadcrumbs`, `folders`, `documents`, `pagination`, and `storage`.

## Folder and file creation

Create folder request:

```json
{
  "name": "Minutes",
  "parentId": "optional-folder-uuid"
}
```

Upload request:

- content type: `multipart/form-data`
- file field: `file`
- text fields:
  - `name`
  - `description`
  - `folderId`

Rules:

- folder names are limited to `255` characters
- document names are limited to `255` characters
- document descriptions are optional and limited to `2000` characters
- `folderId` is optional; omitting it uploads to the root scope

## Rename and move contract

Rename folder request:

```json
{
  "name": "Board Minutes"
}
```

Rename document request:

```json
{
  "name": "Minutes May 2026"
}
```

Move request:

```json
{
  "itemId": "uuid",
  "itemType": "folder",
  "targetFolderId": "uuid-or-null"
}
```

Rules:

- `itemType` must be `folder` or `file`
- `targetFolderId: null` moves the item to the root scope
- folder moves and file moves change the logical tree only
- moving a file does not change its physical storage path

## Document content

`GET /api/communities/:communityId/documents/files/:documentId/content`

| Query param | Required | Rules |
|---|---|---|
| `download` | No | Boolean-like value; defaults to `false` |

When `download` is truthy, the endpoint serves the document as an attachment. Otherwise, it streams the PDF inline when possible.
