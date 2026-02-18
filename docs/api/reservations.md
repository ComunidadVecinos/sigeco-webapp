# Reservations API

The Reservations API (`/api/reservations/`) allows booking and management of shared spaces and resources.

> **API Documentation**
>
> This document is part of the API documentation. For more information, return to the [API Documentation Index](./README.md).

---

## Application Error Codes
| Code | Description |
|----|-------------|
| RESERVATION_NOT_FOUND | Reservation does not exist |
| RESERVATION_SLOT_TAKEN | Time slot already reserved |
| RESERVATION_PAST_DATE | Cannot reserve past date |
| RESERVATION_ALREADY_CANCELLED | Reservation already cancelled |
| RESERVATION_ACCESS_DENIED | User cannot modify reservation |

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