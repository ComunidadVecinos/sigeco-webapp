# Calendar API

> API index: [docs/api/README.md](./README.md)

This page is reserved for the future `calendar` module.

Planned base path: `/api/calendar`

---

## Implementation status

This module is not implemented in the current backend.

What is currently visible in the codebase:

- No dedicated module was found under `backend/src/modules/calendar`
- No implemented HTTP routes were found for this module
- No request or response contract is defined yet

This document keeps a stable structure so it can be completed once the module exists.

---

## Overview

### Planned scope

- Placeholder: document community events and calendar entries
- Placeholder: clarify whether personal events will exist in the same module
- Placeholder: define whether this module also aggregates voting or reservation events

### What is not defined yet

- Endpoint list
- Event model
- Date and timezone rules
- Module-specific error codes

---

## Access rules

Not defined yet.

Placeholder topics to document later:

- Who can create or edit events
- Whether residents can create personal events
- Whether calendar visibility depends on community membership

---

## Common response shapes

Not defined yet.

Placeholder topics to document later:

- Calendar event summary
- Event detail
- Date range query response

---

## Endpoints

No endpoints are currently implemented for this module.

Placeholder sections to complete later:

### 1. List calendar events

Placeholder.

### 2. Get event detail

Placeholder.

### 3. Create event

Placeholder.

### 4. Update event

Placeholder.

### 5. Delete or cancel event

Placeholder.

---

## Common calendar error cases

Not defined yet.

Placeholder topics to document later:

- Invalid date ranges
- Event overlap conflicts
- Permission errors
- Not found cases

---

## Frontend integration notes

- Do not integrate against this module yet
- Reuse [API Conventions](./conventions.md) for shared rules until a real contract exists
- Revisit this page when the backend module is implemented
