# Communities API

The Communities API (`/api/communities/`) manages residential communities and their administrative configuration, including their metadata, administrators, and member relationships.

> **API Documentation**
>
> This document is part of the API documentation. For more information, return to the [API Documentation Index](./README.md).

---

## Application Error Codes

| Code | Description |
|----|-------------|
| COMMUNITY_NOT_FOUND | Community does not exist |
| COMMUNITY_ALREADY_EXISTS | Duplicate community |
| COMMUNITY_ACCESS_DENIED | User is not a member |
| COMMUNITY_ROLE_INVALID | Invalid role assignment |
| COMMUNITY_MEMBER_EXISTS | User already belongs to community |

---

## Endpoints Index

- [GET /api/forum/threads](#get-apiforumthreads)

---

## GET `/api/forum/threads`

<description>

### Headers
`Content-Type: application/json`

### Body
```json
{
  "body": "ToDo"
}
```

### Validations
* List of pertinent validations

### Response - `2XX <Response>`
```json
{
  "response": "ToDo"
}
```

### Errors
##### Errors
| Error Code    | Message |
| -------- | ------- |
| 4XX  | ToDo |
| 4XX | ToDo |