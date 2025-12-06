# API Contracts

## Modules Index
- [Auth](#auth)
- [Communities](#communities)
- [Forum](#forum)

## Auth

### POST /api/auth/register

#### Request
##### Hearders
```pgsql
Content-Type: application/json
```

##### Body
```json
{
  "firstName": "Ana",
  "lastName": "García",
  "email": "user@example.com",
  "phone": "+34600123456",
  "password": "12345678"
}
```

##### Validations
- `firstName` and `lastName` not empty.
- `email` mandatory, valid format (([A-Z|a-z|0-9])+@ucm.es)
- `phone` optional, valid format (optional id code + 9 numbers).
- `password` mandatory, complexity: minimum 8 character, 1 upper-case, 1 lower-case, 1 number.

##### Response - 201 User Created
###### Set-Cookie
```ini
auth_token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600
```
###### Body
```json
{
  "firstName": "Ana",
  "lastName": "García",
  "email": "user@example.com",
  "phone": "+34600123456",
  "password": "12345678"
}
```

##### Errors
| Error Code    | Message |
| -------- | ------- |
| 400  | Email already registered or wrong password |
| 409 | Email already registered     |
| 500    | Internal error    |

### POST /api/auth/login

### GET /api/auth/me

### PUT /api/auth/reset-password

### PUT /api/auth/change-password

### POST /api/auth/logout

### PUT /api/auth/delete-account
(Tmp) Modify user `active` state to "_inactive_". Then, delete user information after six months.

## Communities

## Forum
