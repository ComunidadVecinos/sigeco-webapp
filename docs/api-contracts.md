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

#### Request
##### Hearders
```pgsql
Content-Type: application/json
```

##### Body
```json
{
  "email": "user@example.com",
  "phone": "+34600123456",
  "password": "12345678"
}
Note: You must send an email or phone.
```

##### Validations
- Must provide either `email` OR `phone`.
- `password` mandatory.

##### Response - 200 OK
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
  "phone": "+34600123456"
}
```

##### Errors
| Error Code    | Message |
| -------- | ------- |
| 400  | Missing credentials |
| 401 | Invalid credentials     |
| 500    | Internal error    |

### GET /api/auth/me


#### Request
##### Hearders
```pgsql
Content-Type: application/json
Cookie: auth_token=<jwt>
```

##### Response - 200 OK

###### Body
```json
{
  "firstName": "Ana",
  "lastName": "García",
  "email": "user@example.com",
  "phone": "+34600123456",
  "photo": "url.png",
  "communities": [
    {
      "id": 1,
      "name": "Los Robledales",
      "address": "adressExample 1",
      "province": "provinceExample",
      "member since": "May 2025",
      "municipality": "municipalityExample"
    }
  ]
}
```

##### Errors
| Error Code    | Message |
| -------- | ------- |
| 401  | User not authenticated |
| 404 | User not found     |
| 500    | Internal error    |


### PUT /api/auth/reset-password


#### Request
##### Hearders
```pgsql
Content-Type: application/json
```

##### Body
```json
{
  "email": "user@example.com"
}
```

##### Validations
- `email` mandatory, valid format (([A-Z|a-z|0-9])+@ucm.es).

##### Response - 200 OK

###### Body
```json
{
  "message": "Temporary password sent to email."
}
```

##### Errors
| Error Code    | Message |
| -------- | ------- |
| 400  | Invalid email format |
| 404 | Email not registered     |
| 500    | Internal error    |

### PUT /api/auth/change-password


#### Request
##### Hearders
```pgsql
Content-Type: application/json
Cookie: auth_token=<jwt>
```

##### Body
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123",
  "repeatNewPassword": "newPassword123"
}
```

##### Validations
- `currentPassword` must match the user's active password.
- `newPassword` mandatory, complexity: minimum 8 character, 1 upper-case, 1 lower-case, 1 number.
- `newPassword` must match `repeatNewPassword`.

##### Response - 200 OK
###### Body
```json
{
  "message": "Password update successfully"
}
```

##### Errors
| Error Code    | Message |
| -------- | ------- |
| 400  | Passwords do not match or invalid format |
| 401 | Incorrect current password    |
| 500    | Internal error    |

### POST /api/auth/logout


#### Request
##### Hearders
```pgsql
Content-Type: application/json
Cookie: auth_token=<jwt>
```

##### Response - 200 OK
###### Set-Cookie
```ini
auth_token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=0
```
###### Body
```json
{
  "message": "Logged out successfully"
}
```

##### Errors
| Error Code    | Message |
| -------- | ------- |
| 500    | Internal error    |

### PUT /api/auth/delete-account
(Tmp) Modify user `active` state to "_inactive_". Then, delete user information after six months.
#### Request
##### Hearders
```pgsql
Content-Type: application/json
Cookie: auth_token=<jwt>
```
##### Body
```json
{
  "password": "12345678"
}
```
##### Validations
- `password` mandatory and must match the current user's password.
- Internally sets `active` to `false` (soft delete).

##### Response - 200 OK
###### Set-Cookie
```ini
auth_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0
(Note: By deactivating the account, we also log out by deleting the cookie).
```
###### Body
```json
{
  "message": "Account deactivated successfully"
}
```

##### Errors
| Error Code    | Message |
| -------- | ------- |
| 401    | Incorrect password    |
| 500    | Internal error    |

## Communities

## Forum
