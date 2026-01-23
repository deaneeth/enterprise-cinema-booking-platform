# Cinema Booking API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Cinema Booking System. The API is built with Express.js and uses MongoDB as the database.

**Base URL:** `/api`

**Authentication:** JWT Bearer Token (where required)

---

## Table of Contents

1. [Authentication & Users](#1-authentication--users)
2. [Cinemas](#2-cinemas)
3. [Movies](#3-movies)
4. [Showtimes](#4-showtimes)
5. [Bookings](#5-bookings)
6. [Seats](#6-seats)
7. [Payments](#7-payments)
8. [Reviews](#8-reviews)
9. [Analytics](#9-analytics-admin)
10. [Applications](#10-cinema-admin-applications)
11. [WebSocket Events](#11-websocket-events)

---

## Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### User Roles

| Role | Description |
|------|-------------|
| `user` | Regular customer (default) |
| `cinema_admin` | Cinema administrator - can manage their assigned cinema |
| `platform_admin` | Platform administrator - full system access |

---

## 1. Authentication & Users

### Register User

```http
POST /api/auth/register
```

**Access:** Public

**Description:** Register a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true
    },
    "token": "jwt_token_here"
  }
}
```

---

### Login

```http
POST /api/auth/login
```

**Access:** Public

**Description:** Login and receive JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

---

### Forgot Password

```http
POST /api/auth/forgot-password
```

**Access:** Public

**Description:** Request a password reset email

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### Reset Password

```http
POST /api/auth/reset-password
```

**Access:** Public

**Description:** Reset password using token from email

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### Get Current User

```http
GET /api/auth/me
```

**Access:** Private (Authenticated)

**Description:** Get current logged in user's profile

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Logout

```http
POST /api/auth/logout
```

**Access:** Private (Authenticated)

**Description:** Logout user (invalidate session)

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get User by ID

```http
GET /api/users/:id
```

**Access:** Private (Authenticated)

**Description:** Get user profile by ID

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

---

### Update User Profile

```http
PUT /api/users/:id
```

**Access:** Private (Owner or Admin)

**Description:** Update user profile information

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID |

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Updated",
  "phone": "+0987654321"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Updated",
    "phone": "+0987654321"
  }
}
```

---

### Change Password

```http
PUT /api/users/:id/change-password
```

**Access:** Private (Owner only)

**Description:** Change user's password

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID |

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Get User Reviews

```http
GET /api/users/:id/reviews
```

**Access:** Private (Owner or Admin)

**Description:** Get all reviews by a specific user

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "review_id",
      "targetType": "movie",
      "targetId": "movie_id",
      "rating": 5,
      "comment": "Great movie!",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

---

### Deactivate User

```http
DELETE /api/users/:id
```

**Access:** Private (Owner or Admin)

**Description:** Soft delete/deactivate user account

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID |

**Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

### Get All Users (Admin)

```http
GET /api/users
```

**Access:** Private (Platform Admin only)

**Description:** Get all users with pagination

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `role` | string | - | Filter by role |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

## 2. Cinemas

### Get All Cinemas

```http
GET /api/cinemas
```

**Access:** Public

**Description:** Get all cinemas with optional filters

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `city` | string | Filter by city |
| `chain` | string | Filter by cinema chain |
| `isActive` | boolean | Filter by active status |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "cinema_id",
      "name": "Grand Cinema",
      "chain": "CineMax",
      "location": {
        "address": "123 Main St",
        "city": "New York",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "facilities": ["Parking", "Food Court", "3D"],
      "screens": 8,
      "averageRating": 4.5,
      "totalReviews": 120,
      "isActive": true
    }
  ]
}
```

---

### Search Cinemas

```http
GET /api/cinemas/search
```

**Access:** Public

**Description:** Search cinemas by name or city

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search term |

**Response (200):**
```json
{
  "success": true,
  "data": [...]
}
```

---

### Get Cinema by ID

```http
GET /api/cinemas/:id
```

**Access:** Public

**Description:** Get detailed cinema information

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Cinema ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "cinema_id",
    "name": "Grand Cinema",
    "chain": "CineMax",
    "location": {...},
    "facilities": [...],
    "screens": 8,
    "averageRating": 4.5,
    "totalReviews": 120
  }
}
```

---

### Get Cinema Reviews

```http
GET /api/cinemas/:id/reviews
```

**Access:** Public

**Description:** Get all reviews for a cinema

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Cinema ID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "pagination": {...}
  }
}
```

---

### Create Cinema

```http
POST /api/cinemas
```

**Access:** Private (Platform Admin only)

**Description:** Create a new cinema

**Request Body:**
```json
{
  "name": "Grand Cinema",
  "chain": "CineMax",
  "location": {
    "address": "123 Main St",
    "city": "New York",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "facilities": ["Parking", "Food Court", "3D"],
  "screens": 8
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "cinema_id",
    "name": "Grand Cinema",
    ...
  }
}
```

---

### Update Cinema

```http
PUT /api/cinemas/:id
```

**Access:** Private (Cinema Admin of that cinema OR Platform Admin)

**Description:** Update cinema information

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Cinema ID |

**Request Body:**
```json
{
  "name": "Updated Cinema Name",
  "facilities": ["Parking", "IMAX", "Dolby Atmos"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {...}
}
```

---

### Delete Cinema

```http
DELETE /api/cinemas/:id
```

**Access:** Private (Platform Admin only)

**Description:** Soft delete cinema (set isActive=false)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Cinema ID |

**Response (200):**
```json
{
  "success": true,
  "message": "Cinema deleted successfully"
}
```

---

## 3. Movies

### Get All Movies

```http
GET /api/movies
```

**Access:** Public

**Description:** Get all movies with optional filters

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `genre` | string | Filter by genre |
| `language` | string | Filter by language (English, Sinhala, Tamil) |
| `rating` | string | Filter by content rating (G, PG, PG-13, R) |
| `q` | string | Search by title |
| `isActive` | boolean | Filter by active status |

**Available Genres:**
`Action`, `Adventure`, `Animation`, `Biography`, `Comedy`, `Crime`, `Documentary`, `Drama`, `Family`, `Fantasy`, `History`, `Horror`, `Music`, `Musical`, `Mystery`, `Romance`, `Sci-Fi`, `Sport`, `Thriller`, `War`, `Western`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "movie_id",
      "title": "The Great Adventure",
      "description": "An epic tale of adventure...",
      "genre": ["Action", "Adventure"],
      "language": "English",
      "duration": 142,
      "releaseDate": "2024-01-15T00:00:00.000Z",
      "rating": "PG-13",
      "posterUrl": "https://example.com/poster.jpg",
      "trailerUrl": "https://youtube.com/watch?v=...",
      "cast": ["Actor One", "Actor Two"],
      "director": "Famous Director",
      "averageRating": 4.3,
      "totalReviews": 85,
      "isActive": true
    }
  ]
}
```

---

### Search Movies

```http
GET /api/movies/search
```

**Access:** Public

**Description:** Text search movies by title

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search term |

**Response (200):**
```json
{
  "success": true,
  "data": [...]
}
```

---

### Get Movie by ID

```http
GET /api/movies/:id
```

**Access:** Public

**Description:** Get detailed movie information

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Movie ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "movie_id",
    "title": "The Great Adventure",
    ...
  }
}
```

---

### Get Movie Showtimes

```http
GET /api/movies/:id/showtimes
```

**Access:** Public

**Description:** Get all showtimes for a specific movie

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Movie ID |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Filter by date (YYYY-MM-DD) |
| `cinemaId` | string | Filter by cinema |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "showtime_id",
      "movieId": "movie_id",
      "cinemaId": {...},
      "screenNumber": 1,
      "startTime": "2024-01-15T18:00:00.000Z",
      "endTime": "2024-01-15T20:30:00.000Z",
      "price": 12.99,
      "format": "2D",
      "availableSeats": 45
    }
  ]
}
```

---

### Get Movie Reviews

```http
GET /api/movies/:id/reviews
```

**Access:** Public

**Description:** Get all reviews for a movie

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Movie ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "pagination": {...}
  }
}
```

---

### Create Movie

```http
POST /api/movies
```

**Access:** Private (Platform Admin only)

**Description:** Create a new movie

**Request Body:**
```json
{
  "title": "New Movie Title",
  "description": "Movie description...",
  "genre": ["Action", "Thriller"],
  "language": "English",
  "duration": 120,
  "releaseDate": "2024-03-15",
  "rating": "PG-13",
  "posterUrl": "https://example.com/poster.jpg",
  "trailerUrl": "https://youtube.com/watch?v=...",
  "cast": ["Actor One", "Actor Two"],
  "director": "Director Name"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "movie_id",
    ...
  }
}
```

---

### Update Movie

```http
PUT /api/movies/:id
```

**Access:** Private (Platform Admin only)

**Description:** Update movie information

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Movie ID |

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {...}
}
```

---

### Delete Movie

```http
DELETE /api/movies/:id
```

**Access:** Private (Platform Admin only)

**Description:** Soft delete movie (set isActive=false)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Movie ID |

**Response (200):**
```json
{
  "success": true,
  "message": "Movie deleted successfully"
}
```

---

## 4. Showtimes

### Get All Showtimes

```http
GET /api/showtimes
```

**Access:** Public

**Description:** Get all showtimes with optional filters

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `movieId` | string | Filter by movie |
| `cinemaId` | string | Filter by cinema |
| `date` | string | Filter by date (YYYY-MM-DD) |
| `format` | string | Filter by format (2D, 3D, IMAX) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "showtime_id",
      "movieId": {
        "_id": "movie_id",
        "title": "Movie Title",
        "posterUrl": "..."
      },
      "cinemaId": {
        "_id": "cinema_id",
        "name": "Cinema Name"
      },
      "screenNumber": 1,
      "startTime": "2024-01-15T18:00:00.000Z",
      "endTime": "2024-01-15T20:30:00.000Z",
      "date": "2024-01-15T00:00:00.000Z",
      "price": 12.99,
      "vipPrice": 19.99,
      "format": "2D",
      "language": "English",
      "totalSeats": 100,
      "availableSeats": 45,
      "isActive": true
    }
  ]
}
```

---

### Get Showtime by ID

```http
GET /api/showtimes/:id
```

**Access:** Public

**Description:** Get detailed showtime information

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Showtime ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "showtime_id",
    ...
  }
}
```

---

### Get Showtimes by Cinema

```http
GET /api/cinemas/:cinemaId/showtimes
```

**Access:** Public

**Description:** Get all showtimes for a specific cinema

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `cinemaId` | string | Cinema ID |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Filter by date |

**Response (200):**
```json
{
  "success": true,
  "data": [...]
}
```

---

### Get Showtime Seats

```http
GET /api/showtimes/:showtimeId/seats
```

**Access:** Public

**Description:** Get all seats for a showtime (grouped by row)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `showtimeId` | string | Showtime ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "A": [
      {
        "_id": "seat_id",
        "seatNumber": "A1",
        "row": "A",
        "column": 1,
        "seatType": "regular",
        "status": "available",
        "price": 12.99
      },
      ...
    ],
    "B": [...],
    ...
  }
}
```

---

### Create Showtime

```http
POST /api/showtimes
```

**Access:** Private (Cinema Admin or Platform Admin)

**Description:** Create a new showtime

**Request Body:**
```json
{
  "movieId": "movie_id",
  "cinemaId": "cinema_id",
  "screenNumber": 1,
  "startTime": "2024-01-15T18:00:00.000Z",
  "date": "2024-01-15",
  "price": 12.99,
  "vipPrice": 19.99,
  "format": "2D",
  "language": "English",
  "totalSeats": 100,
  "rows": 10,
  "seatsPerRow": 10
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "showtime_id",
    ...
  }
}
```

---

### Update Showtime

```http
PUT /api/showtimes/:id
```

**Access:** Private (Cinema Admin or Platform Admin)

**Description:** Update showtime information

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Showtime ID |

**Request Body:**
```json
{
  "price": 14.99,
  "startTime": "2024-01-15T19:00:00.000Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {...}
}
```

---

### Delete Showtime

```http
DELETE /api/showtimes/:id
```

**Access:** Private (Cinema Admin or Platform Admin)

**Description:** Soft delete showtime (set isActive=false)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Showtime ID |

**Response (200):**
```json
{
  "success": true,
  "message": "Showtime deleted successfully"
}
```

---

### Regenerate Seats

```http
POST /api/showtimes/:id/regenerate-seats
```

**Access:** Private (Cinema Admin or Platform Admin)

**Description:** Regenerate seats for a showtime (delete existing, create new)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Showtime ID |

**Request Body:**
```json
{
  "rows": 10,
  "seatsPerRow": 10,
  "vipRows": ["A", "B"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSeats": 100,
    "seatsCreated": 100
  }
}
```

---

## 5. Bookings

### Create Booking

```http
POST /api/bookings
```

**Access:** Private (Authenticated users)

**Description:** Create a new booking with pending status (10-minute hold)

**Request Body:**
```json
{
  "showtimeId": "showtime_id",
  "seatIds": ["seat_id_1", "seat_id_2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "userId": "user_id",
    "showtimeId": "showtime_id",
    "seatIds": ["seat_id_1", "seat_id_2"],
    "numberOfSeats": 2,
    "totalAmount": 25.98,
    "bookingStatus": "pending",
    "expiresAt": "2024-01-15T18:10:00.000Z",
    "createdAt": "2024-01-15T18:00:00.000Z"
  }
}
```

---

### Confirm Booking

```http
POST /api/bookings/:id/confirm
```

**Access:** Private (Booking owner or Admin)

**Description:** Confirm a booking after payment

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Booking ID |

**Request Body:**
```json
{
  "paymentId": "payment_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "bookingStatus": "confirmed",
    "qrCode": "base64_qr_code_string",
    "paymentId": "payment_id"
  }
}
```

---

### Get Booking by ID

```http
GET /api/bookings/:id
```

**Access:** Private (Booking owner or Admin)

**Description:** Get a specific booking with all details

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Booking ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "userId": {...},
    "showtimeId": {...},
    "seatIds": [...],
    "numberOfSeats": 2,
    "totalAmount": 25.98,
    "bookingStatus": "confirmed",
    "qrCode": "...",
    "paymentId": {...}
  }
}
```

---

### Update Booking Seats

```http
PUT /api/bookings/:id/seats
```

**Access:** Private (Booking owner or Admin)

**Description:** Update booking seats (pending bookings only, does not extend hold)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Booking ID |

**Request Body:**
```json
{
  "seatIds": ["new_seat_id_1", "new_seat_id_2", "new_seat_id_3"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {...}
}
```

---

### Get User Bookings

```http
GET /api/users/me/bookings
```

**Access:** Private (Authenticated users)

**Description:** Get all bookings for the current user

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter: pending, confirmed, cancelled |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookings": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

### Cancel Booking

```http
DELETE /api/bookings/:id
```

**Access:** Private (Booking owner or Admin)

**Description:** Cancel a booking (if showtime hasn't started)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Booking ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "booking": {...},
    "refundRequired": true
  }
}
```

---

### Get All Bookings (Admin)

```http
GET /api/bookings
```

**Access:** Private (Cinema Admin or Platform Admin)

**Description:** Get all bookings with filters

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Filter by user |
| `showtimeId` | string | Filter by showtime |
| `status` | string | Filter: pending, confirmed, cancelled |
| `startDate` | string | Filter from date (YYYY-MM-DD) |
| `endDate` | string | Filter to date (YYYY-MM-DD) |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookings": [...],
    "pagination": {...}
  }
}
```

---

## 6. Seats

### Get Seats for Showtime

```http
GET /api/seats/showtime/:showtimeId
```

**Access:** Public

**Description:** Get all seats for a showtime (grouped by row)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `showtimeId` | string | Showtime ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "A": [
      {
        "_id": "seat_id",
        "seatNumber": "A1",
        "row": "A",
        "column": 1,
        "seatType": "vip",
        "status": "available",
        "price": 19.99
      }
    ],
    "B": [...]
  }
}
```

---

### Get Seat by ID

```http
GET /api/seats/:id
```

**Access:** Private (Authenticated)

**Description:** Get single seat details

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Seat ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "seat_id",
    "showtimeId": "showtime_id",
    "seatNumber": "A1",
    "row": "A",
    "column": 1,
    "seatType": "regular",
    "status": "available",
    "price": 12.99
  }
}
```

---

### Hold Seat

```http
PUT /api/seats/:id/hold
```

**Access:** Private (Authenticated)

**Description:** Temporarily hold a seat (10 minutes)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Seat ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "seat_id",
    "status": "held",
    "heldBy": "user_id",
    "heldUntil": "2024-01-15T18:10:00.000Z"
  }
}
```

---

### Release Seat

```http
PUT /api/seats/:id/release
```

**Access:** Private (Authenticated)

**Description:** Release a held seat

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Seat ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "seat_id",
    "status": "available",
    "heldBy": null,
    "heldUntil": null
  }
}
```

---

### Book Seat

```http
PUT /api/seats/:id/book
```

**Access:** Private (Authenticated)

**Description:** Book a single seat (internal use by booking flow)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Seat ID |

**Request Body:**
```json
{
  "bookingId": "booking_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "seat_id",
    "status": "booked",
    "bookingId": "booking_id"
  }
}
```

---

### Get All Seats (Admin)

```http
GET /api/seats
```

**Access:** Private (Platform Admin or Cinema Admin)

**Description:** Get all seats with filters and pagination

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `showtimeId` | string | Filter by showtime |
| `status` | string | Filter: available, held, booked |
| `seatType` | string | Filter: regular, vip, wheelchair |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "seats": [...],
    "pagination": {...}
  }
}
```

---

### Generate Seats (Admin)

```http
POST /api/seats/generate
```

**Access:** Private (Platform Admin or Cinema Admin)

**Description:** Generate seats for a showtime

**Request Body:**
```json
{
  "showtimeId": "showtime_id",
  "rows": 10,
  "seatsPerRow": 10,
  "vipRows": ["A", "B"],
  "wheelchairSeats": ["J1", "J10"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "seatsCreated": 100,
    "totalSeats": 100
  }
}
```

---

### Book Multiple Seats

```http
POST /api/seats/book
```

**Access:** Private (Authenticated)

**Description:** Book multiple seats at once

**Request Body:**
```json
{
  "seatIds": ["seat_id_1", "seat_id_2"],
  "bookingId": "booking_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookedCount": 2
  }
}
```

---

### Reset Seats for Showtime (Admin)

```http
DELETE /api/seats/reset/:showtimeId
```

**Access:** Private (Platform Admin or Cinema Admin)

**Description:** Reset all seats for a showtime to available

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `showtimeId` | string | Showtime ID |

**Response (200):**
```json
{
  "success": true,
  "message": "All seats reset to available"
}
```

---

### Sync Seats from Bookings (Admin)

```http
POST /api/seats/sync/:showtimeId
```

**Access:** Private (Platform Admin or Cinema Admin)

**Description:** Sync seats from confirmed bookings (repair missing booked status)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `showtimeId` | string | Showtime ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "syncedCount": 15
  }
}
```

---

## 7. Payments

### Create PayPal Order

```http
POST /api/payments/create-order
```

**Access:** Private (Authenticated users)

**Description:** Create a PayPal order for a pending booking

**Request Body:**
```json
{
  "bookingId": "booking_id"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "orderId": "paypal_order_id",
    "approvalUrl": "https://www.paypal.com/checkoutnow?token=..."
  }
}
```

---

### Capture PayPal Payment

```http
POST /api/payments/capture
```

**Access:** Private (Authenticated users)

**Description:** Capture payment after user approves in PayPal

**Request Body:**
```json
{
  "orderId": "paypal_order_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payment": {
      "_id": "payment_id",
      "amount": 25.98,
      "paymentStatus": "completed",
      "paypalCaptureId": "capture_id"
    },
    "booking": {
      "_id": "booking_id",
      "bookingStatus": "confirmed",
      "qrCode": "..."
    }
  }
}
```

---

### Cancel Payment

```http
POST /api/payments/cancel
```

**Access:** Private (Authenticated users)

**Description:** Cancel a pending payment (user cancelled in PayPal)

**Request Body:**
```json
{
  "orderId": "paypal_order_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment cancelled"
}
```

---

### Get User Payments

```http
GET /api/payments/my-payments
```

**Access:** Private (Authenticated users)

**Description:** Get all payments for the current user

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "payment_id",
      "bookingId": {...},
      "amount": 25.98,
      "currency": "USD",
      "paymentMethod": "paypal",
      "paymentStatus": "completed",
      "paymentDate": "2024-01-15T18:05:00.000Z"
    }
  ]
}
```

---

### Get Payment by ID

```http
GET /api/payments/:id
```

**Access:** Private (Payment owner or Admin)

**Description:** Get a specific payment with all details

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Payment ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "payment_id",
    "bookingId": {...},
    "userId": {...},
    "amount": 25.98,
    "currency": "USD",
    "paymentMethod": "paypal",
    "paymentStatus": "completed",
    "paypalOrderId": "...",
    "paypalCaptureId": "...",
    "payerEmail": "user@example.com",
    "payerName": "John Doe",
    "paymentDate": "2024-01-15T18:05:00.000Z"
  }
}
```

---

### Process Refund

```http
POST /api/payments/:id/refund
```

**Access:** Private (Payment owner or Admin)

**Description:** Process refund for a completed payment

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Payment ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payment": {
      "_id": "payment_id",
      "paymentStatus": "refunded",
      "paypalRefundId": "refund_id",
      "refundDate": "2024-01-16T10:00:00.000Z"
    },
    "refundId": "paypal_refund_id",
    "refundAmount": "25.98"
  }
}
```

---

### Get All Payments (Admin)

```http
GET /api/payments
```

**Access:** Private (Platform Admin only)

**Description:** Get all payments with filters

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Filter by user |
| `status` | string | Filter: pending, completed, failed, refunded, cancelled |
| `startDate` | string | Filter from date (YYYY-MM-DD) |
| `endDate` | string | Filter to date (YYYY-MM-DD) |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 500,
      "pages": 50
    }
  }
}
```

---

## 8. Reviews

### Get All Reviews

```http
GET /api/reviews
```

**Access:** Public

**Description:** Get all reviews with optional filters

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `targetType` | string | Filter: movie, cinema |
| `targetId` | string | Filter by target ID |
| `rating` | number | Filter by rating (1-5) |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "userId": {
          "_id": "user_id",
          "firstName": "John",
          "lastName": "Doe"
        },
        "targetType": "movie",
        "targetId": "movie_id",
        "rating": 5,
        "comment": "Excellent movie! Highly recommended.",
        "isVerifiedBooking": true,
        "createdAt": "2024-01-15T20:00:00.000Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### Get Review by ID

```http
GET /api/reviews/:id
```

**Access:** Public

**Description:** Get a single review by ID

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Review ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "review_id",
    "userId": {...},
    "targetType": "movie",
    "targetId": "movie_id",
    "rating": 5,
    "comment": "Great movie!",
    "isVerifiedBooking": true
  }
}
```

---

### Create Review

```http
POST /api/reviews
```

**Access:** Private (Authenticated users)

**Description:** Create a new review for a movie or cinema

**Request Body:**
```json
{
  "targetType": "movie",
  "targetId": "movie_id",
  "rating": 5,
  "comment": "Amazing movie! The special effects were incredible."
}
```

**Note:** `isVerifiedBooking` is automatically set to `true` if the user has a confirmed booking for the movie/cinema.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "review_id",
    "userId": "user_id",
    "targetType": "movie",
    "targetId": "movie_id",
    "rating": 5,
    "comment": "Amazing movie! The special effects were incredible.",
    "isVerifiedBooking": true,
    "createdAt": "2024-01-15T20:00:00.000Z"
  }
}
```

---

### Update Review

```http
PUT /api/reviews/:id
```

**Access:** Private (Owner only)

**Description:** Update an existing review

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Review ID |

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated review comment"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {...}
}
```

---

### Delete Review

```http
DELETE /api/reviews/:id
```

**Access:** Private (Owner or Admin)

**Description:** Soft delete a review (set isActive=false)

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Review ID |

**Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## 9. Analytics (Admin)

All analytics endpoints require **Platform Admin** role.

### Get Overview Statistics

```http
GET /api/admin/analytics/overview
```

**Access:** Private (Platform Admin only)

**Description:** Get system-wide statistics

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 5000,
    "totalCinemas": 25,
    "totalMovies": 150,
    "totalBookings": 12500,
    "totalRevenue": 287500.00,
    "activeShowtimes": 450
  }
}
```

---

### Get Revenue Data

```http
GET /api/admin/analytics/revenue
```

**Access:** Private (Platform Admin only)

**Description:** Get revenue data grouped by day (for charts)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | week | Time period: week, month, year |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "revenue": 2500.00,
      "bookings": 95
    },
    {
      "date": "2024-01-14",
      "revenue": 2750.00,
      "bookings": 102
    }
  ]
}
```

---

### Get Bookings Data

```http
GET /api/admin/analytics/bookings
```

**Access:** Private (Platform Admin only)

**Description:** Get booking counts grouped by day (for charts)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | week | Time period: week, month, year |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "confirmed": 85,
      "cancelled": 5,
      "pending": 5
    }
  ]
}
```

---

### Get Top Movies

```http
GET /api/admin/analytics/top-movies
```

**Access:** Private (Platform Admin only)

**Description:** Get top 10 movies by booking count

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "movieId": "movie_id",
      "title": "Popular Movie",
      "posterUrl": "...",
      "bookingCount": 1250,
      "revenue": 31250.00
    }
  ]
}
```

---

### Get Cinema Statistics

```http
GET /api/admin/analytics/cinemas
```

**Access:** Private (Platform Admin only)

**Description:** Get cinema performance statistics

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "cinemaId": "cinema_id",
      "name": "Grand Cinema",
      "city": "New York",
      "bookingCount": 3500,
      "revenue": 87500.00,
      "averageRating": 4.5
    }
  ]
}
```

---

## 10. Cinema Admin Applications

### Apply for Cinema Admin

```http
POST /api/auth/apply-cinema-admin
```

**Access:** Private (Authenticated users)

**Description:** Apply to become a cinema admin

**Request Body:**
```json
{
  "businessName": "My Cinema Business",
  "businessAddress": "123 Business St, City",
  "businessLicense": "LIC-12345-2024"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "applicationStatus": "pending",
    "applicationDetails": {
      "businessName": "My Cinema Business",
      "businessAddress": "123 Business St, City",
      "businessLicense": "LIC-12345-2024",
      "appliedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### Get My Application Status

```http
GET /api/auth/my-application
```

**Access:** Private (Authenticated users)

**Description:** Get current user's application status

**Response (200):**
```json
{
  "success": true,
  "data": {
    "applicationStatus": "pending",
    "applicationDetails": {
      "businessName": "My Cinema Business",
      "appliedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### List Applications (Admin)

```http
GET /api/admin/applications
```

**Access:** Private (Platform Admin only)

**Description:** List all cinema admin applications

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | pending | Filter: pending, all |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user_id",
      "email": "applicant@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "applicationStatus": "pending",
      "applicationDetails": {
        "businessName": "Cinema Business",
        "appliedAt": "2024-01-15T10:00:00.000Z"
      }
    }
  ]
}
```

---

### Approve Application (Admin)

```http
PUT /api/admin/applications/:userId/approve
```

**Access:** Private (Platform Admin only)

**Description:** Approve a cinema admin application

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Applicant's user ID |

**Request Body:**
```json
{
  "cinemaId": "existing_cinema_id"
}
```

OR to create a new cinema:

```json
{
  "createCinema": {
    "name": "New Cinema",
    "location": {
      "address": "123 Cinema St",
      "city": "New York"
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "role": "cinema_admin",
      "cinemaId": "cinema_id",
      "applicationStatus": "approved"
    },
    "cinema": {...}
  }
}
```

---

### Reject Application (Admin)

```http
PUT /api/admin/applications/:userId/reject
```

**Access:** Private (Platform Admin only)

**Description:** Reject a cinema admin application

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Applicant's user ID |

**Request Body:**
```json
{
  "reason": "Insufficient documentation provided"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "applicationStatus": "rejected",
    "applicationDetails": {
      "rejectionReason": "Insufficient documentation provided",
      "reviewedAt": "2024-01-16T10:00:00.000Z"
    }
  }
}
```

---

## 11. WebSocket Events

The application uses Socket.io for real-time updates. Connect to the WebSocket server at the same host as the API.

### Connection

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Events

#### Seat Updates

```javascript
// Join a showtime room to receive seat updates
socket.emit('join-showtime', showtimeId);

// Leave a showtime room
socket.emit('leave-showtime', showtimeId);

// Receive seat status updates
socket.on('seat-update', (data) => {
  // data: { seatId, status, heldBy, heldUntil }
});

// Receive bulk seat updates
socket.on('seats-updated', (data) => {
  // data: { showtimeId, seats: [...] }
});
```

#### Booking Updates

```javascript
// Receive booking confirmation
socket.on('booking-confirmed', (data) => {
  // data: { bookingId, status, qrCode }
});

// Receive booking expiration notice
socket.on('booking-expired', (data) => {
  // data: { bookingId }
});
```

---

## Error Responses

All endpoints follow a consistent error response format:

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation error message",
  "details": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": "User role 'user' is not authorized to access this route"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints:** 100 requests per minute per IP
- **Authentication endpoints:** 10 requests per minute per IP
- **Payment endpoints:** 20 requests per minute per user

---

## Health Check

```http
GET /health
```

**Access:** Public

**Description:** Check API server health status

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T18:00:00.000Z",
    "environment": "development"
  }
}
```

---

## Data Models Reference

### User
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `email` | string | User email (unique) |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `phone` | string | Phone number (optional) |
| `role` | enum | user, cinema_admin, platform_admin |
| `cinemaId` | ObjectId | Assigned cinema (cinema_admin only) |
| `isActive` | boolean | Account status |
| `applicationStatus` | enum | none, pending, approved, rejected |

### Cinema
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `name` | string | Cinema name |
| `chain` | string | Cinema chain (optional) |
| `location` | object | Address, city, coordinates |
| `facilities` | array | List of facilities |
| `screens` | number | Number of screens |
| `averageRating` | number | Average user rating (0-5) |
| `totalReviews` | number | Total review count |
| `isActive` | boolean | Active status |

### Movie
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `title` | string | Movie title |
| `description` | string | Movie description |
| `genre` | array | List of genres |
| `language` | enum | English, Sinhala, Tamil |
| `duration` | number | Duration in minutes |
| `releaseDate` | Date | Release date |
| `rating` | enum | G, PG, PG-13, R |
| `posterUrl` | string | Poster image URL |
| `trailerUrl` | string | Trailer video URL |
| `cast` | array | List of cast members |
| `director` | string | Director name |
| `averageRating` | number | Average user rating (0-5) |
| `totalReviews` | number | Total review count |
| `isActive` | boolean | Active status |

### Showtime
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `movieId` | ObjectId | Reference to Movie |
| `cinemaId` | ObjectId | Reference to Cinema |
| `screenNumber` | number | Screen number |
| `startTime` | Date | Showtime start |
| `endTime` | Date | Showtime end |
| `date` | Date | Showtime date |
| `price` | number | Regular ticket price |
| `vipPrice` | number | VIP ticket price |
| `format` | enum | 2D, 3D, IMAX |
| `language` | string | Audio language |
| `totalSeats` | number | Total seat count |
| `availableSeats` | number | Available seats |
| `isActive` | boolean | Active status |

### Booking
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `userId` | ObjectId | Reference to User |
| `showtimeId` | ObjectId | Reference to Showtime |
| `seatIds` | array | List of seat ObjectIds |
| `numberOfSeats` | number | Total seats booked |
| `totalAmount` | number | Total booking amount |
| `bookingStatus` | enum | pending, confirmed, cancelled, expired |
| `bookingDate` | Date | When booking was created |
| `paymentId` | ObjectId | Reference to Payment |
| `qrCode` | string | QR code for ticket |
| `expiresAt` | Date | When pending booking expires |

### Seat
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `showtimeId` | ObjectId | Reference to Showtime |
| `seatNumber` | string | Seat label (e.g., "A1") |
| `row` | string | Row letter |
| `column` | number | Column number |
| `seatType` | enum | regular, vip, wheelchair |
| `status` | enum | available, held, booked |
| `heldBy` | ObjectId | User holding the seat |
| `heldUntil` | Date | Hold expiration time |
| `bookingId` | ObjectId | Reference to Booking |
| `price` | number | Seat price |

### Payment
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `bookingId` | ObjectId | Reference to Booking |
| `userId` | ObjectId | Reference to User |
| `amount` | number | Payment amount |
| `currency` | string | Currency code (USD) |
| `paymentMethod` | enum | paypal, card |
| `paymentStatus` | enum | pending, completed, failed, refunded, cancelled |
| `paypalOrderId` | string | PayPal order ID |
| `paypalCaptureId` | string | PayPal capture ID |
| `paypalRefundId` | string | PayPal refund ID |
| `payerEmail` | string | Payer email |
| `payerName` | string | Payer name |
| `paymentDate` | Date | When payment completed |
| `refundDate` | Date | When refund processed |

### Review
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `userId` | ObjectId | Reference to User |
| `targetType` | enum | movie, cinema |
| `targetId` | ObjectId | Reference to Movie or Cinema |
| `rating` | number | Rating (1-5) |
| `comment` | string | Review text |
| `isVerifiedBooking` | boolean | User has confirmed booking |
| `isActive` | boolean | Active status |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | January 2024 | Initial API release |

---

*Documentation generated for Cinema Booking System API*
