# Forum API

> API index: [docs/api/README.md](./README.md)

This page is reserved for the future `forum` module.

Planned base path: `/api/forum`

---

## Implementation status

This module is not implemented in the current backend.

What is currently visible in the codebase:

- No dedicated module was found under `backend/src/modules/forum`
- No implemented HTTP routes were found for this module
- No request or response contract is defined yet

This document keeps a stable structure so it can be completed once the module exists.

---

## Overview

### Planned scope

- Placeholder: document threads, posts and community discussions
- Placeholder: define whether moderation belongs to this module
- Placeholder: document whether forum content is community-scoped

### What is not defined yet

- Endpoint list
- Thread and post models
- Pagination and sorting rules
- Module-specific error codes

---

## Access rules

Not defined yet.

Placeholder topics to document later:

- Who can create threads
- Who can reply or moderate content
- Whether suspended members can still read forum content

---

## Common response shapes

Not defined yet.

Placeholder topics to document later:

- Thread summary
- Thread detail
- Post summary

---

## Endpoints

No endpoints are currently implemented for this module.

Placeholder sections to complete later:

### 1. List threads

Placeholder.

### 2. Get thread detail

Placeholder.

### 3. Create thread

Placeholder.

### 4. Reply to thread

Placeholder.

### 5. Edit, moderate or delete content

Placeholder.

---

## Common forum error cases

Not defined yet.

Placeholder topics to document later:

- Not found cases
- Permission errors
- Validation errors
- Moderation conflicts

---

## Frontend integration notes

- Do not integrate against this module yet
- Reuse [API Conventions](./conventions.md) for shared rules until a real contract exists
- Revisit this page when the backend module is implemented
