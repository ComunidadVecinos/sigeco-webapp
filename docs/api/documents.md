# Documents API

> API index: [docs/api/README.md](./README.md)

This page is reserved for the future `documents` module.

Planned base path: `/api/documents`

---

## Implementation status

This module is not implemented as a dedicated backend HTTP module at the moment.

What is currently visible in the codebase:

- No dedicated module was found under `backend/src/modules/documents`
- No implemented HTTP routes were found for this module
- The database schema already includes `community_folders` and `community_documents` tables

This means storage-related entities exist in the data model, but their HTTP contract is still undocumented because the module itself is not implemented yet.

---

## Overview

### Planned scope

- Placeholder: document folder browsing
- Placeholder: document file uploads and downloads
- Placeholder: document community-scoped permissions over documents

### What is not defined yet

- Endpoint list
- Upload contract
- Download/access contract
- Module-specific error codes

---

## Access rules

Not defined yet.

Placeholder topics to document later:

- Who can upload documents
- Who can create, rename or delete folders
- Whether residents can download all documents in their community

---

## Common response shapes

Not defined yet.

Placeholder topics to document later:

- Folder tree item
- Document summary
- Upload result

---

## Endpoints

No endpoints are currently implemented for this module.

Placeholder sections to complete later:

### 1. List folders or documents

Placeholder.

### 2. Create folder

Placeholder.

### 3. Upload document

Placeholder.

### 4. Rename, move or update metadata

Placeholder.

### 5. Delete document or folder

Placeholder.

---

## Common documents error cases

Not defined yet.

Placeholder topics to document later:

- Unsupported file type
- File size or quota limits
- Not found cases
- Permission errors

---

## Frontend integration notes

- Do not integrate against this module yet
- The presence of document tables in the schema does not imply a stable public API contract yet
- Reuse [API Conventions](./conventions.md) for shared rules until a real contract exists
