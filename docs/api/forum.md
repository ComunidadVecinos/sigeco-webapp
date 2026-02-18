# Forum API

The Forum API (`/api/forum/`) provides discussion features within a community, allowing users to create threads and post messages.

> **API Documentation**
>
> This document is part of the API documentation. For more information, return to the [API Documentation Index](./README.md).

---

## Application Error Codes
| Code | Description |
|----|-------------|
| THREAD_NOT_FOUND | Forum thread not found |
| POST_NOT_FOUND | Post does not exist |
| FORUM_WRITE_FORBIDDEN | User cannot post |
| COMMENT_LIMIT_REACHED | Comment limit exceeded |

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