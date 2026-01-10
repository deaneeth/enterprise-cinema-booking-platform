# Cinema Booking System

Multi-cinema booking platform with real-time seat selection.

## Team Members

- **Member 1**: Users (Authentication) - Tech Lead
- **Member 2**: Cinemas - Database Lead
- **Member 3**: Movies - Frontend Lead
- **Member 4**: Showtimes - API Lead
- **Member 5**: Bookings - Integration Lead
- **Member 6**: Seats - UI/UX Lead
- **Member 7**: Payments - Payments Lead
- **Member 8**: Reviews - Testing Lead

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **Testing**: Jest + Supertest
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + Docker Compose

## Prerequisites

- Node.js 18+
- Docker Desktop
- Git

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repo-url>
cd cinema-booking-system

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/cinema-booking
JWT_SECRET=your-secret-key
```

### 4. Build and Run

```bash
npm run build
npm run start
```

### 5. Access the Application

Open your browser and navigate to `http://localhost:3000` to access the application.

### 6. Stop the Application

```bash
npm run stop
```

### 7. Clean Up

```bash
docker-compose down
```

## Two Ways to Run the Project

### Option 1: Full Docker (No Terminal Logs)

```bash
docker-compose up -d --build
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: localhost:27017

**To view logs:**

```bash
docker-compose logs -f          # All services
docker-compose logs -f backend  # Just backend
docker-compose logs -f frontend # Just frontend
```

### Option 2: MongoDB Docker + Local Dev (Terminal Logs ✅)

**Terminal 1 - Start MongoDB only:**
```bash
docker-compose up -d mongodb
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

*This gives you live terminal logs for debugging.*

### Quick Summary

| Mode | Logs in Terminal | Best For |
| :--- | :--- | :--- |
| `docker-compose up -d` | No (use `logs -f`) | Production testing |
| MongoDB Docker + local dev | Yes | Development/debugging |