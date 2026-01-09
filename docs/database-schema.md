# Cinema Booking System - Database Schema

## Collections

### Users

**Purpose**: Store user accounts for authentication and profile management.

**Schema (MongoDB / Mongoose)**

- `email` (String, required, unique, lowercase, trimmed, regex validated)
- `password` (String, required, minLength: 6, `select: false`)
- `firstName` (String, required, trimmed, maxLength: 50)
- `lastName` (String, required, trimmed, maxLength: 50)
- `phone` (String, optional)
- `role` (Enum: `user | cinema_admin | platform_admin`, default: `user`)
- `cinemaId` (ObjectId, ref: `Cinema`, optional; used for `cinema_admin`)
- `isActive` (Boolean, default: `true`)
- `resetPasswordToken` (String, optional)
- `resetPasswordExpire` (Date, optional)
- `createdAt` (Date, auto)
- `updatedAt` (Date, auto)

**Notes**

- Passwords are hashed via a pre-save hook.
- JWT tokens include `{ id, email, role }`.

---

### Cinemas

**Purpose**: Store cinema theatre locations and high-level details (chain, location, facilities).

**Schema (MongoDB / Mongoose)**

- `name` (String, required, trimmed)
- `chain` (String, optional, trimmed)
- `location` (Object)
  - `address` (String, optional, trimmed)
  - `city` (String, optional, trimmed)
  - `coordinates` (Object, optional)
    - `lat` (Number, range: -90..90)
    - `lng` (Number, range: -180..180)
- `facilities` (String[], default: `[]`)
- `adminUserId` (ObjectId, ref: `User`, optional)
- `screens` (Number, optional, min: 0)
- `isActive` (Boolean, default: `true`)
- `createdAt` (Date, auto)
- `updatedAt` (Date, auto)

**Notes**

- Soft delete is performed via `isActive=false`.
- Cinema model includes a method `calculateDistance(lat, lng)` that returns distance in km using the Haversine formula.

**Sample Data**

```json
{
  "_id": "6587b3b0c2f4c10a8e2b1234",
  "name": "PVR Cinemas - Colombo",
  "chain": "PVR",
  "location": {
    "address": "123 Main St",
    "city": "Colombo",
    "coordinates": { "lat": 6.9271, "lng": 79.8612 }
  },
  "facilities": ["3D", "IMAX", "Dolby Atmos"],
  "adminUserId": "6587b3b0c2f4c10a8e2b5678",
  "screens": 10,
  "isActive": true,
  "createdAt": "2024-01-15T08:00:00.000Z",
  "updatedAt": "2024-01-15T08:00:00.000Z"
}
```

```json
{
  "_id": "6587b3b0c2f4c10a8e2b9999",
  "name": "Scope Cinemas - Kandy",
  "chain": "Scope",
  "location": {
    "address": "45 Lake Rd",
    "city": "Kandy",
    "coordinates": { "lat": 7.2906, "lng": 80.6337 }
  },
  "facilities": ["3D"],
  "screens": 6,
  "isActive": true,
  "createdAt": "2024-01-15T08:10:00.000Z",
  "updatedAt": "2024-01-15T08:10:00.000Z"
}
```

## Relationships

- User (`cinema_admin`) → Cinema (one-to-one)
  - `User.cinemaId` references `Cinema._id`
  - `Cinema.adminUserId` references `User._id`

## Indexes

Recommended indexes (some may be implemented later as the dataset grows):

- Cinemas: `{ "location.city": 1, "isActive": 1 }`
- Cinemas: name search is implemented using a case-insensitive regex on the `name` field (no text index defined). A MongoDB text index `{ "name": "text" }` can be added in the future if needed for full-text search and performance.

---


### Movies

**Purpose**: Store movie metadata used by showtimes, bookings and reviews.

**Schema (MongoDB / Mongoose)**

- `title` (String, required, trimmed, indexed for text search)
- `description` (String, optional, trimmed)
- `genre` (String[], enum: `Action`, `Drama`, `Comedy`, default: `[]`)
- `language` (String, enum: `English`, `Sinhala`, `Tamil`)
- `duration` (Number, minutes, integer >= 0)
- `releaseDate` (Date)
- `rating` (String, enum: `G`, `PG`, `PG-13`, `R`)
- `posterUrl` (String, optional)
- `trailerUrl` (String, optional)
- `cast` (String[], default: `[]`)
- `director` (String, optional)
- `isActive` (Boolean, default: `true`) — soft delete
- `createdAt` / `updatedAt` (Date, auto)

**Indexes**

- Text index on `title` for full-text search: `{ title: "text" }`
- Optional compound index for common filters: `{ genre: 1, language: 1, isActive: 1 }`

**Relationships**

- `Showtime` documents reference a `Movie` (`one movie -> many showtimes`).
- `Review` and `Booking` documents reference `Movie._id`.

**Sample document**

```json
{
  "_id": "<ObjectId>",
  "title": "Example Movie",
  "description": "Short synopsis",
  "genre": ["Action"],
  "language": "English",
  "duration": 150,
  "releaseDate": "2025-12-01T00:00:00.000Z",
  "rating": "PG-13",
  "posterUrl": "https://...",
  "trailerUrl": "https://youtube.com/...",
  "cast": ["Actor A", "Actor B"],
  "director": "Director X",
  "isActive": true,
  "createdAt": "<Date>",
  "updatedAt": "<Date>"
}
```

**Notes / Implementation**

- Store `duration` in minutes; add a helper `formatDuration()` to display e.g. `"2h 30m"` (see `backend/src/models/Movie.ts`).
- For richer searching consider adding `description` to the text index or using a dedicated search service.



