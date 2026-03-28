# Incidents API

> API index: [docs/api/README.md](./README.md)

This page is reserved for the future `incidents` module.

Planned base path: `/api/incidents`

---

## Implementation status

This module is not implemented in the current backend.

What is currently visible in the codebase:

- No dedicated module was found under `backend/src/modules/incidents`
- No implemented HTTP routes were found for this module
- No request or response contract is defined yet

This document keeps a stable structure so it can be completed once the module exists.

---

## Overview

### Planned scope

- Placeholder: document incident reporting and follow-up workflows
- Placeholder: define whether incidents are private, administrative or community-visible
- Placeholder: document lifecycle states such as open, in progress and resolved

### What is not defined yet

- Endpoint list
- Incident state model
- Attachment support
- Module-specific error codes

---

## Access rules

Not defined yet.

Placeholder topics to document later:

- Who can create incidents
- Who can review or resolve incidents
- Whether incidents can be filtered by community or status

---

## Common response shapes

Not defined yet.

Placeholder topics to document later:

- Incident summary
- Incident detail
- Status transition result

---

## Endpoints

No endpoints are currently implemented for this module.

Placeholder sections to complete later:

### 1. List incidents

Placeholder.

### 2. Get incident detail

Placeholder.

### 3. Create incident

Placeholder.

### 4. Update incident status

Placeholder.

### 5. Close or archive incident

Placeholder.

---

## Common incidents error cases

Not defined yet.

Placeholder topics to document later:

- Not found cases
- Permission errors
- Invalid state transitions
- Validation errors

---

## Frontend integration notes

- Do not integrate against this module yet
- Reuse [API Conventions](./conventions.md) for shared rules until a real contract exists
- Revisit this page when the backend module is implemented
