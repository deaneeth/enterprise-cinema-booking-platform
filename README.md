<p align="center">
  <img src="docs/assets/logo.png" alt="CineBook Logo" width="100" style="border-radius: 20px;" />
</p>

<h1 align="center">🎬 Enterprise Cinema Booking Platform</h1>

<p align="center">
  <strong>A scalable, multi-tenant cinema management platform built with the MERN Stack</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-documentation">API</a> •
  <a href="#contributors">Contributors</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" style="border-radius: 8px;" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" style="border-radius: 8px;" />
  <img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" style="border-radius: 8px;" />
  <img src="https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" style="border-radius: 8px;" />
  <img src="https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" style="border-radius: 8px;" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" style="border-radius: 8px;" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/deaneeth/enterprise-cinema-booking-platform/ci.yml?branch=main&style=flat-square&label=CI" alt="CI Status" />
  <img src="https://img.shields.io/badge/License-ISC-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/github/last-commit/deaneeth/enterprise-cinema-booking-platform?style=flat-square" alt="Last Commit" />
  <img src="https://img.shields.io/github/contributors/deaneeth/enterprise-cinema-booking-platform?style=flat-square" alt="Contributors" />
</p>

---

## 📸 Screenshots

<p align="center">
  <img src="docs/assets/screenshots/home.gif" alt="Home Page" width="100%" />
</p>

<details>
<summary><strong>🖼️ View More Screenshots</strong></summary>

<br />

| Page                     | Screenshot                                                 |
| ------------------------ | ---------------------------------------------------------- |
| **Home**        | ![Home](docs/assets/screenshots/home.png)              |
| **Movie Listing**        | ![Movies](docs/assets/screenshots/movies.png)              |
| **Movie Details**        | ![Movie Details](docs/assets/screenshots/movie-detail.png) |
| **Seat Selection**       | ![Seat Selection](docs/assets/screenshots/seats.png)       |
| **Payment**              | ![Payment](docs/assets/screenshots/payment.png)            |
| **Booking Confirmation** | ![Confirmation](docs/assets/screenshots/confirmation.png)  |
| **User Profile**         | ![Profile](docs/assets/screenshots/profile.png)            |
| **Admin Dashboard**      | ![Admin](docs/assets/screenshots/admin.png)                |
| **Cinema-Admin Dashboard**      | ![Admin](docs/assets/screenshots/cinema-admin.png)                |


</details>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎟️ Booking System

- **Real-time seat reservation** with WebSocket updates
- **Interactive seat map** with live availability
- **15-minute booking timer** with auto-expiration
- **QR code tickets** with PDF download
- **Booking history** with status tracking

</td>
<td width="50%">

### 🔐 Authentication & Security

- **JWT-based authentication** with refresh tokens
- **Role-based access control** (User, Cinema Admin, Platform Admin)
- **Email verification** via OTP
- **Secure password hashing** with bcrypt
- **Rate limiting** & CORS protection

</td>
</tr>
<tr>
<td width="50%">

### 💳 Payment Integration

- **PayPal Checkout** integration
- **Sandbox & Production** modes
- **Automatic refund** on cancellation
- **Payment history** & receipts
- **Secure transaction** handling

</td>
<td width="50%">

### 🎬 Cinema Management

- **Multi-cinema support** (B2B platform)
- **Movie & showtime management**
- **Dynamic pricing** by showtime
- **Seating layout** customization
- **Cinema admin applications**

</td>
</tr>
<tr>
<td width="50%">

### 📊 Admin Dashboards

- **Platform Admin**: User, cinema, movie management
- **Cinema Admin**: Showtimes, bookings, analytics
- **Approval workflows** for new cinemas
- **Revenue tracking** & reports

</td>
<td width="50%">

### ⭐ Reviews & Ratings

- **Movie & cinema reviews**
- **Star ratings** with averages
- **Verified booking badge**
- **Review moderation**

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<table>
<tr>
<th align="center">Frontend</th>
<th align="center">Backend</th>
<th align="center">Database</th>
<th align="center">DevOps</th>
</tr>
<tr>
<td align="center">
<img src="https://skillicons.dev/icons?i=react" width="40" height="40" alt="React" /><br />React 18
</td>
<td align="center">
<img src="https://skillicons.dev/icons?i=nodejs" width="40" height="40" alt="Node.js" /><br />Node.js
</td>
<td align="center">
<img src="https://skillicons.dev/icons?i=mongodb" width="40" height="40" alt="MongoDB" /><br />MongoDB
</td>
<td align="center">
<img src="https://skillicons.dev/icons?i=docker" width="40" height="40" alt="Docker" /><br />Docker
</td>
</tr>
<tr>
<td align="center">
<img src="https://skillicons.dev/icons?i=typescript" width="40" height="40" alt="TypeScript" /><br />TypeScript
</td>
<td align="center">
<img src="https://skillicons.dev/icons?i=express" width="40" height="40" alt="Express" /><br />Express.js
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongoose/mongoose-original.svg" width="40" height="40" alt="Mongoose" /><br />Mongoose
</td>
<td align="center">
<img src="https://skillicons.dev/icons?i=githubactions" width="40" height="40" alt="GitHub Actions" /><br />CI/CD
</td>
</tr>
<tr>
<td align="center">
<img src="https://skillicons.dev/icons?i=tailwind" width="40" height="40" alt="Tailwind" /><br />Tailwind CSS
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="40" height="40" alt="Socket.io" /><br />Socket.io
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="40" height="40" alt="Redis" /><br />Redis (Cache)
</td>
<td align="center">
<img src="https://skillicons.dev/icons?i=jest" width="40" height="40" alt="Jest" /><br />Jest
</td>
</tr>
</table>

### Additional Technologies

| Category             | Technologies                           |
| -------------------- | -------------------------------------- |
| **State Management** | React Query (TanStack Query)           |
| **Form Handling**    | React Hook Form                        |
| **HTTP Client**      | Axios                                  |
| **Authentication**   | JWT, bcryptjs                          |
| **Validation**       | Joi                                    |
| **Payment**          | PayPal Checkout SDK                    |
| **File Generation**  | jsPDF, html2canvas, QRCode             |
| **Testing**          | Jest, Supertest, React Testing Library |

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Frontend (React)"]
        UI[UI Components]
        RQ[React Query]
        WS[WebSocket Client]
    end

    subgraph Server["⚙️ Backend (Express)"]
        API[REST API]
        Auth[Auth Middleware]
        WSS[WebSocket Server]
    end

    subgraph Data["💾 Data Layer"]
        MongoDB[(MongoDB)]
        Cache[(Redis Cache)]
    end

    subgraph External["🌐 External Services"]
        PayPal[PayPal API]
        Email[SendGrid]
    end

    UI --> RQ --> API
    WS <--> WSS
    API --> Auth --> MongoDB
    API --> Cache
    API --> PayPal
    API --> Email
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.0 (or Docker)
- **npm** >= 9.x

### Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/deaneeth/enterprise-cinema-booking-platform.git
cd enterprise-cinema-booking-platform

# Start all services
docker compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MongoDB: localhost:27017
```

### Manual Installation

<details>
<summary><strong>📋 Step-by-step instructions</strong></summary>

#### 1. Clone the repository

```bash
git clone https://github.com/deaneeth/enterprise-cinema-booking-platform.git
cd enterprise-cinema-booking-platform
```

#### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 3. Configure environment variables

```bash
# Backend (.env in /backend directory)
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/cinema-booking

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# PayPal (Optional - for payments)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox

# Email (Optional - for verification)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourcinema.com
```

#### 4. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
# https://www.mongodb.com/docs/manual/installation/
```

#### 5. Run the application

```bash
# Start backend (from /backend directory)
cd backend
npm run dev

# Start frontend (from /frontend directory - new terminal)
cd frontend
npm start
```

</details>

---

## 📖 Usage

### Default Accounts

After seeding the database (or first run), use these accounts:

| Role               | Email                | Password     |
| ------------------ | -------------------- | ------------ |
| **Platform Admin** | `admin@gmail.com` | `Admin123`  |
| **Cinema Admin**   | `cinema@gmail.com`    | `Cinema123` |
| **Regular User**   | `user@gmail.com`      | `User123`   |

### User Workflows

```mermaid
journey
    title Movie Booking Journey
    section Browse
      View Movies: 5: User
      Select Movie: 5: User
      View Showtimes: 5: User
    section Book
      Select Seats: 4: User
      15-min Timer Starts: 3: System
      Proceed to Payment: 4: User
    section Pay
      PayPal Checkout: 4: User
      Confirm Payment: 5: PayPal
    section Receive
      Get QR Ticket: 5: System
      Download PDF: 5: User
```

---

## 📡 API Documentation

The API follows RESTful conventions with comprehensive documentation.

### Base URL

```
Development: http://localhost:5000/api
Production: https://api.your-domain.com/api
```

### Authentication

All protected endpoints require a Bearer token:

```bash
Authorization: Bearer <your-jwt-token>
```

### Quick Reference

| Endpoint                 | Method | Description         | Auth |
| ------------------------ | ------ | ------------------- | ---- |
| `/auth/register`         | POST   | Register new user   | ❌   |
| `/auth/login`            | POST   | Login user          | ❌   |
| `/movies`                | GET    | List all movies     | ❌   |
| `/movies/:id`            | GET    | Get movie details   | ❌   |
| `/cinemas`               | GET    | List all cinemas    | ❌   |
| `/showtimes`             | GET    | Get showtimes       | ❌   |
| `/bookings`              | POST   | Create booking      | ✅   |
| `/bookings/:id`          | GET    | Get booking         | ✅   |
| `/payments/create-order` | POST   | Create PayPal order | ✅   |
| `/payments/capture`      | POST   | Capture payment     | ✅   |

<details>
<summary><strong>📚 View Full API Documentation</strong></summary>

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for complete endpoint details, request/response schemas, and examples.

</details>

---

## 🧪 Testing

```bash
# Run all backend tests
cd backend
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run frontend tests
cd frontend
npm test
```

### Test Coverage

| Module      | Coverage |
| ----------- | -------- |
| Controllers | ~80%     |
| Services    | ~85%     |
| Models      | ~90%     |
| Middleware  | ~75%     |

---

## 📁 Project Structure

```
enterprise-cinema-booking-platform/
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 📂 config/        # Database & app configuration
│   │   ├── 📂 controllers/   # Route handlers
│   │   ├── 📂 middlewares/   # Auth, validation, error handling
│   │   ├── 📂 models/        # Mongoose schemas
│   │   ├── 📂 routes/        # API routes
│   │   ├── 📂 services/      # Business logic
│   │   ├── 📂 tests/         # Unit & integration tests
│   │   ├── 📂 types/         # TypeScript definitions
│   │   ├── 📂 utils/         # Helper functions
│   │   └── 📄 server.ts      # Entry point
│   ├── 📄 package.json
│   └── 📄 tsconfig.json
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/    # Reusable UI components
│   │   ├── 📂 contexts/      # React contexts
│   │   ├── 📂 hooks/         # Custom hooks
│   │   ├── 📂 pages/         # Page components
│   │   ├── 📂 services/      # API client
│   │   ├── 📂 types/         # TypeScript types
│   │   └── 📄 App.tsx        # Root component
│   ├── 📄 package.json
│   └── 📄 tailwind.config.js
│
├── 📂 docs/                  # Documentation
├── 📄 docker-compose.yml     # Docker configuration
├── 📄 .github/workflows/     # CI/CD pipelines
└── 📄 README.md
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    USER ||--o{ BOOKING : makes
    USER ||--o{ REVIEW : writes
    CINEMA ||--o{ SHOWTIME : has
    CINEMA ||--o{ REVIEW : receives
    MOVIE ||--o{ SHOWTIME : scheduled_in
    MOVIE ||--o{ REVIEW : receives
    SHOWTIME ||--o{ BOOKING : for
    BOOKING ||--o| PAYMENT : has

    USER {
        ObjectId _id PK
        string email UK
        string password
        string name
        enum role
        boolean isVerified
    }

    CINEMA {
        ObjectId _id PK
        string name
        string location
        array facilities
        ObjectId adminId FK
    }

    MOVIE {
        ObjectId _id PK
        string title
        string description
        number duration
        string genre
        string poster
    }

    SHOWTIME {
        ObjectId _id PK
        ObjectId movieId FK
        ObjectId cinemaId FK
        datetime startTime
        number price
        array seats
    }

    BOOKING {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId showtimeId FK
        array seats
        enum status
        number totalAmount
    }

    PAYMENT {
        ObjectId _id PK
        ObjectId bookingId FK
        string paypalOrderId
        number amount
        enum status
    }
```

<details>
<summary><strong>📚 View Full Database Schema</strong></summary>
<p align="center">
  <img src="docs/assets/database-schema.png" alt="Database Schema" width="80%" />
</p>
</details>

---

## 🤝 Contributors

<table>
<tr>
<td align="center">
<a href="https://github.com/deaneeth">
<img src="https://github.com/deaneeth.png" width="80px" alt="Dean Hettiarachchi" style="border-radius: 50%"/>
<br />
<sub><b>Dineth Hettiarachchi</b></sub>
</a>
<br />
<sub>Project Lead</sub>
</td>
<td align="center">
<a href="https://github.com/WickramaarachchiBS">
<img src="https://github.com/WickramaarachchiBS.png" width="80px" alt="Wickramaarachchi B S" style="border-radius: 50%"/>
<br />
<sub><b>Wickramaarachchi B S</b></sub>
</a>
<br />
<sub>Backend Developer</sub>
</td>
<td align="center">
<a href="https://github.com/Himashasandeepani">
<img src="https://github.com/Himashasandeepani.png" width="80px" alt="Himasha Sandeepani" style="border-radius: 50%"/>
<br />
<sub><b>Himasha Sandeepani</b></sub>
</a>
<br />
<sub>Frontend Developer</sub>
</td>
<td align="center">
<a href="https://github.com/Kasuuun7">
<img src="https://github.com/Kasuuun7.png" width="80px" alt="Kasun Madhusanka" style="border-radius: 50%"/>
<br />
<sub><b>Kasun Madhusanka</b></sub>
</a>
<br />
<sub>Full Stack Developer</sub>
</td>
</tr>
<tr>
<td align="center">
<a href="https://github.com/Kavix31299">
<img src="https://github.com/Kavix31299.png" width="80px" alt="Kavix" style="border-radius: 50%"/>
<br />
<sub><b>Kavindu</b></sub>
</a>
<br />
<sub>Backend Developer</sub>
</td>
<td align="center">
<a href="https://github.com/ashiru202">
<img src="https://github.com/ashiru202.png" width="80px" alt="Ashiru" style="border-radius: 50%"/>
<br />
<sub><b>Ashiru</b></sub>
</a>
<br />
<sub>Frontend Developer</sub>
</td>
<td align="center">
<a href="#">
<img src="https://ui-avatars.com/api/?name=Jayaweera+HRK&background=random" width="80px" alt="Jayaweera HRK" style="border-radius: 50%"/>
<br />
<sub><b>Jayaweera HRK</b></sub>
</a>
<br />
<sub>Developer</sub>
</td>
<td align="center">
<a href="#">
<img src="https://ui-avatars.com/api/?name=Rashmi+E&background=random" width="80px" alt="Rashmi Edirisinghe" style="border-radius: 50%"/>
<br />
<sub><b>Rashmi Edirisinghe</b></sub>
</a>
<br />
<sub>Developer</sub>
</td>
</tr>
</table>

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [PayPal Developer](https://developer.paypal.com/) - Payment integration
- [Socket.io](https://socket.io/) - Real-time communication
- [TailwindCSS](https://tailwindcss.com/) - Styling framework
- [React Query](https://tanstack.com/query) - Data fetching
- [MongoDB](https://www.mongodb.com/) - Database

---

<p align="center">
  <strong>⭐ Star this repository if you found it helpful!</strong>
</p>

<p align="center">
  <a href="https://github.com/deaneeth/enterprise-cinema-booking-platform/issues">Report Bug</a>
  •
  <a href="https://github.com/deaneeth/enterprise-cinema-booking-platform/issues">Request Feature</a>
</p>
