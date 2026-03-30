# Voting API

> API index: [docs/api/README.md](./README.md)

This page is reserved for the future `votes` module.

Planned base path: `/api/votes`

---

## Implementation status

This module is not implemented in the current backend.

What is currently visible in the codebase:

- No dedicated module was found under `backend/src/modules/votes`
- No implemented HTTP routes were found for this module
- No request or response contract is defined yet

This document keeps a stable structure so it can be completed once the module exists.

---

## Overview

### Planned scope

- Placeholder: document polls, options and ballot submission
- Placeholder: define whether votes are anonymous, open or role-restricted
- Placeholder: document vote lifecycle, closing and result publication

### What is not defined yet

- Endpoint list
- Poll and vote models
- Result publication rules
- Module-specific error codes

---

## Access rules

Not defined yet.

Placeholder topics to document later:

- Who can create polls
- Who can vote
- Whether administrative roles have additional voting capabilities

---

## Common response shapes

Not defined yet.

Placeholder topics to document later:

- Poll summary
- Poll detail
- Vote submission result

---

## Endpoints

No endpoints are currently implemented for this module.

Placeholder sections to complete later:

### 1. List polls

Placeholder.

### 2. Get poll detail

Placeholder.

### 3. Create poll

Placeholder.

### 4. Submit vote

Placeholder.

### 5. Close poll or publish results

Placeholder.

---

## Common voting error cases

Not defined yet.

Placeholder topics to document later:

- Poll not found
- Poll closed
- Duplicate vote
- Invalid option

---

## Frontend integration notes

- Do not integrate against this module yet
- Reuse [API Conventions](./conventions.md) for shared rules until a real contract exists
- Revisit this page when the backend module is implemented
