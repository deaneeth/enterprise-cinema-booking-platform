# Cinema Booking System

## Setup Instructions

1. Clone repository
2. Install Docker Desktop
3. Run: `docker-compose up -d`
4. Frontend: http://localhost:3000
5. Backend: http://localhost:5000

## Team Members & Entities

- Member 1: Users (Auth)
- Member 2: Cinemas
- Member 3: Movies
- Member 4: Showtimes
- Member 5: Bookings
- Member 6: Seats
- Member 7: Payments
- Member 8: Reviews

## Branch Structure

- `main` - Production ready
- `dev` - Integration branch
- `feature/memberX-entity` - Individual work

## Workflow

1. Pull latest dev: `git checkout dev && git pull`
2. Switch to your branch: `git checkout feature/member1-users`
3. Work on your entity
4. Commit: `git add . && git commit -m "feat(users): description"`
5. Push: `git push origin feature/member1-users`
6. Create PR to `dev` on GitHub
7. Get review from PM (Member 1)
8. Merge after approval