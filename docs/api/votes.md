# Voting API

The Voting API (`/api/votes/`) supports voting processes within communities through polls and votes.

> **API Documentation**
>
> This document is part of the API documentation. For more information, return to the [API Documentation Index](./README.md).

---

## Application Error Codes
| Code | Description |
|----|-------------|
| POLL_NOT_FOUND | Poll does not exist |
| POLL_CLOSED | Voting period has ended |
| DUPLICATE_VOTE | User already voted |
| VOTE_OPTION_INVALID | Invalid vote option |

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