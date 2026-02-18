# Calendar API

The Calendar API (`/api/calendar/`) manages community events, such as voting events, reservations, and scheduled events, as well as personal created events.

> **API Documentation**
>
> This document is part of the API documentation. For more information, return to the [API Documentation Index](./README.md).

---

## Application Error Codes
| Code | Description |
|----|-------------|
| EVENT_NOT_FOUND | Event does not exist |
| EVENT_DATE_INVALID | Invalid event date |
| EVENT_OVERLAP | Event conflicts with existing one |

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