# API Contracts (Pending Implementation)

This document now contains only API contracts that are still pending implementation.

Implemented auth endpoints are documented in:
- `docs/api/auth.md`

## Modules Index
- [Communities](#communities)
- [Forum](#forum)

## Communities

### GET /api/communities

#### Request
##### Headers
```pgsql
Content-Type: application/json
Cookie: sid=<signed_session_cookie>
```

##### Response - 200 OK

##### Body
```json
[
  {
    "id": "1",
    "name": "Los Robledales",
    "cif": "A12345678",
    "address": "Calle Mayor 5",
    "province": "Madrid",
    "municipality": "Madrid",
    "memberSince": "May 2025"
  }
]
```

##### Errors
| Error Code | Message |
| ---------- | ------- |
| 401 | User not authenticated |
| 500 | Internal error |

### POST /api/communities

#### Request
##### Headers
```pgsql
Content-Type: application/json
Cookie: sid=<signed_session_cookie>
```

##### Body
```json
{
  "name": "Los Robledales",
  "cif": "A12345678",
  "country": "España",
  "province": "Madrid",
  "municipality": "Madrid",
  "streetType": "Calle",
  "streetName": "Mayor",
  "postalCode": "28001",
  "number": "5"
}
```

##### Validations
- `name` mandatory, not empty.
- `cif` mandatory, format: 1 letter + 8 digits.
- All address fields mandatory.
- `postalCode` must be exactly 5 digits.
- `number` must be numeric.

##### Response - 201 Created

###### Body
```json
{
  "id": "1",
  "name": "Los Robledales",
  "cif": "A12345678",
  "code": "ABC123"
}
```

##### Errors
| Error Code | Message |
| ---------- | ------- |
| 400 | Invalid data |
| 401 | User not authenticated |
| 409 | CIF already registered |
| 500 | Internal error |

### POST /api/communities/join

#### Request
##### Headers
```pgsql
Content-Type: application/json
Cookie: sid=<signed_session_cookie>
```

##### Body
```json
{
  "code": "ABC123",
  "domicile": {
    "country": "España",
    "province": "Madrid",
    "municipality": "Madrid",
    "streetType": "Calle",
    "streetName": "Mayor",
    "postalCode": "28001",
    "number": "5",
    "block": "A",
    "floor": "3",
    "door": "B"
  }
}
```

##### Validations
- `code` mandatory, not empty.
- All domicile address fields mandatory except `block`, `floor` and `door`.
- `postalCode` must be exactly 5 digits.
- `number` must be numeric.

##### Response - 200 OK

###### Body
```json
{
  "message": "Join community successfully",
  "community": {
    "id": 1,
    "name": "Los Robledales"
  }
}
```

##### Errors
| Error Code | Message |
| ---------- | ------- |
| 400 | Invalid data |
| 401 | User not authenticated |
| 404 | Invalid community code |
| 409 | Already a member |
| 500 | Internal error |

## Forum

No pending endpoint contracts defined yet.