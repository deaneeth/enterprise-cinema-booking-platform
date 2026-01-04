# Cinema Booking System API

Welcome to the **Cinema Booking System API**.  
This API enables platform administrators, cinema administrators, and users to manage cinemas, movies, showtimes, and bookings in a secure and scalable way.

---

##  Base URL

```
http://localhost:5000/api
```

All endpoints listed below are relative to this base URL.

---

##  Authentication

The API uses **JWT (JSON Web Token)**–based authentication.

### Authorization Header

All protected endpoints require the following HTTP header:

```
Authorization: Bearer <token>
```

### Roles

| Role | Description |
|---|---|
| `user` | Regular user (browse movies, cinemas, showtimes) |
| `cinema_admin` | Manages showtimes for their assigned cinema |
| `platform_admin` | Full system access |

---

##  Standard Response Format

### Success
```json
{
  "success": true,
  "data": { }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "message": "Human readable message"
  }
}
```

---

## Authentication Endpoints

> _Implemented by Member 1_

### POST `/api/auth/register`
Create a new user account.

- **Auth required:** No  
- **Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

### POST `/api/auth/login`
Authenticate user and return JWT.

- **Auth required:** No  
- **Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token"
  }
}
```

---

##  Users Endpoints

> _Managed by Member 1_

### GET `/api/users/me`
Get currently authenticated user.

- **Auth required:** Yes  
- **Roles:** Any  
- **Response:** User profile

---

##  Cinemas Endpoints

### GET `/api/cinemas`
List active cinemas.

- **Auth required:** No  
- **Query parameters:**
  - `city`
  - `facilities` (comma-separated)

---

### GET `/api/cinemas/:id`
Get cinema details by ID.

- **Auth required:** No  

---

### POST `/api/cinemas`
Create a cinema.

- **Auth required:** Yes  
- **Role:** `platform_admin`  
- **Request body:**
```json
{
  "name": "PVR Cinemas",
  "location": { "city": "Colombo" },
  "facilities": ["IMAX", "3D"],
  "screens": 10
}
```

---

### PUT `/api/cinemas/:id`
Update cinema details.

- **Auth required:** Yes  
- **Role:** `cinema_admin` (own cinema) or `platform_admin`

---

### DELETE `/api/cinemas/:id`
Soft delete cinema.

- **Auth required:** Yes  
- **Role:** `platform_admin`

---

##  Movies Endpoints

### GET `/api/movies`
List movies.

- **Auth required:** No  
- **Query parameters:** `genre`, `language`, `search`

---

### GET `/api/movies/:id`
Get movie details.

- **Auth required:** No  

---

### POST `/api/movies`
Create a movie.

- **Auth required:** Yes  
- **Role:** `platform_admin`

---

##  Showtimes Endpoints

### GET `/api/showtimes`
List showtimes.

- **Auth required:** No  
- **Query parameters:**
  - `movieId`
  - `cinemaId`
  - `date`
  - `format`

---

### GET `/api/showtimes/:id`
Get showtime by ID.

- **Auth required:** No  
- **Populates:** `movieId`, `cinemaId`

---

### GET `/api/movies/:movieId/showtimes`
Get showtimes for a movie.

- **Auth required:** No  
- **Grouped by:** cinema

---

### GET `/api/cinemas/:cinemaId/showtimes`
Get showtimes for a cinema.

- **Auth required:** No  
- **Grouped by:** movie

---

### POST `/api/showtimes`
Create a showtime.

- **Auth required:** Yes  
- **Role:** `cinema_admin` (own cinema) or `platform_admin`  
- **Logic:** `endTime` auto-calculated from movie duration

**Request body**
```json
{
  "movieId": "movieId",
  "cinemaId": "cinemaId",
  "startTime": "2026-01-10T18:30:00Z",
  "format": "IMAX",
  "language": "EN",
  "price": 1200
}
```

---

### PUT `/api/showtimes/:id`
Update showtime.

- **Auth required:** Yes  
- **Role:** Ownership enforced

---

### DELETE `/api/showtimes/:id`
Soft delete showtime.

- **Auth required:** Yes  
- **Role:** `platform_admin` or owning `cinema_admin`

---

##  Common Error Codes

| Code | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource not found |
| 500 | Server error |

---

##  Reference Files

- `routes/auth.ts`
- `routes/users.ts`
- `routes/cinemas.ts`
- `routes/movies.ts`
- `routes/showtimes.ts`

---

© Cinema Booking System API
