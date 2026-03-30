# Announcements API

> API index: [docs/api/README.md](./README.md)

This page is reserved for the future `announcements` module.

Planned base path: `/api/announcements`

---

## Implementation status

This module is not implemented in the current backend.

What is currently visible in the codebase:

- No dedicated module was found under `backend/src/modules/announcements`
- No implemented HTTP routes were found for this module
- No request or response contract is defined yet

This document keeps a stable structure so it can be completed once the module exists.

---

## Overview

### Planned scope

- Placeholder: document publication, listing and lifecycle of announcements
- Placeholder: clarify whether announcements are global or community-scoped
- Placeholder: document visibility rules for residents and administrators

### What is not defined yet

- Endpoint list
- Payload shapes
- Filters, pagination and sorting
- Module-specific error codes

---

## Access rules

Not defined yet.

Placeholder topics to document later:

- Who can create announcements
- Who can edit or archive announcements
- Whether residents can read all announcements or only community-scoped ones

---

## Common response shapes

Not defined yet.

Placeholder topics to document later:

- Announcement summary shape
- Announcement detail shape
- Pagination envelope, if introduced

---

## Endpoints

No endpoints are currently implemented for this module.

Placeholder sections to complete later:

### 1. List announcements

Placeholder.

### 2. Get announcement detail

Placeholder.

### 3. Create announcement

Placeholder.

### 4. Update announcement

Placeholder.

### 5. Archive or delete announcement

Placeholder.

---

## Common announcements error cases

Not defined yet.

Placeholder topics to document later:

- Not found cases
- Permission errors
- Validation errors
- State conflicts

---

## Frontend integration notes

- Do not integrate against this module yet
- Reuse [API Conventions](./conventions.md) for shared rules until a real contract exists
- Revisit this page when the backend module is implemented
