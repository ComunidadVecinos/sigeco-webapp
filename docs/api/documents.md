# Documents API

The Documents API (`/api/documents/`) manages shared files and document repositories.

> **API Documentation**
>
> This document is part of the API documentation. For more information, return to the [API Documentation Index](./README.md).

---

## Application Error Codes
| Code | Description |
|----|-------------|
| DOCUMENT_NOT_FOUND | Document does not exist |
| DOCUMENT_UPLOAD_FAILED | Upload failed |
| DOCUMENT_ACCESS_DENIED | Access denied |
| DOCUMENT_TYPE_NOT_ALLOWED | Unsupported file type |

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