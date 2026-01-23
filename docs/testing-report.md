# Testing Report — Cinema Booking System

## Testing Strategy

This project implements a **4-layer testing approach** to ensure comprehensive quality assurance:

1. **Unit Testing** — Tests individual models, services, and utilities in isolation
2. **Integration Testing** — Tests API endpoints with database interactions
3. **System Testing** — End-to-end validation of complete user flows
4. **User Acceptance Testing (UAT)** — Real user validation of the booking journey

---

## Unit Testing

- **Framework**: Jest with ts-jest
- **Total Test Suites**: 31 (22 unit + 9 integration)
- **Total Tests**: 622 passed, 1 skipped
- **Actual Coverage**: 86.22% lines, 88.78% functions, 85.75% statements, 74.25% branches

### Test Categories

| Category   | Test File                         | Description                                                       |
| ---------- | --------------------------------- | ----------------------------------------------------------------- |
| Models     | `booking.test.ts`                 | Booking schema validation, QR code generation, cancellation logic |
| Models     | `user.test.ts`                    | User creation, password hashing, token generation                 |
| Models     | `cinema.test.ts`                  | Cinema CRUD operations                                            |
| Models     | `movie.test.ts`                   | Movie schema and queries                                          |
| Models     | `showtime.test.ts`                | Showtime validation and availability                              |
| Models     | `seat.test.ts`                    | Seat status management, hold/release logic                        |
| Models     | `payment.test.ts`                 | Payment status transitions                                        |
| Models     | `review.test.ts`                  | Review creation and rating calculation                            |
| Services   | `websocket.test.ts`               | WebSocket event broadcasting                                      |
| Services   | `email.test.ts`                   | Email notification service                                        |
| Services   | `qrcode.test.ts`                  | QR code generation                                                |
| Services   | `seatCleanup.test.ts`             | Expired seat hold cleanup                                         |
| Middleware | `auth.middleware.test.ts`         | JWT validation, role-based access                                 |
| Middleware | `errorHandler.middleware.test.ts` | Error response formatting                                         |
| Utils      | `bcrypt.test.ts`                  | Password hashing verification                                     |
| Utils      | `jwt.test.ts`                     | Token generation and verification                                 |

### Example Unit Test: Booking Model Validation

```typescript
describe("Schema Validation", () => {
  it("should create a booking with required fields", async () => {
    const { user, showtime } = await createTestData();
    const seatId = new mongoose.Types.ObjectId();

    const booking = await Booking.create({
      userId: user._id,
      showtimeId: showtime._id,
      seatIds: [seatId],
      numberOfSeats: 1,
      totalAmount: 1000,
    });

    expect(booking._id).toBeDefined();
    expect(booking.bookingStatus).toBe("pending"); // default value
    expect(booking.bookingDate).toBeDefined();
  });

  it("should fail with empty seatIds array", async () => {
    const { user, showtime } = await createTestData();

    await expect(
      Booking.create({
        userId: user._id,
        showtimeId: showtime._id,
        seatIds: [],
        numberOfSeats: 1,
        totalAmount: 1000,
      }),
    ).rejects.toThrow(/At least one seat must be selected/);
  });
});
```

### Example Unit Test: QR Code Generation

```typescript
describe("generateQRCode()", () => {
  it("should generate a unique QR code string", async () => {
    const { user, showtime } = await createTestData();
    const booking = await Booking.create({
      userId: user._id,
      showtimeId: showtime._id,
      seatIds: [new mongoose.Types.ObjectId()],
      numberOfSeats: 1,
      totalAmount: 1000,
    });

    const qrCode = booking.generateQRCode();

    expect(qrCode).toBeDefined();
    expect(qrCode).toMatch(/^BOOK-[A-Z0-9]{6}-[A-Z0-9]{16}$/);
    expect(booking.qrCode).toBe(qrCode);
  });
});
```

---

## Integration Testing

- **Framework**: Jest + Supertest
- **Database**: MongoDB Memory Server (replica set for transaction support)
- **Total Test Suites**: 9
- **Execution Mode**: Sequential (`--runInBand`) for test stability

### API Endpoints Tested

| Endpoint Group | Test File           | Key Test Cases                                             |
| -------------- | ------------------- | ---------------------------------------------------------- |
| Authentication | `auth.test.ts`      | Registration, login, token validation, password reset      |
| Users          | `users.test.ts`     | Profile CRUD, role-based access, booking history           |
| Cinemas        | `cinemas.test.ts`   | Cinema creation, filtering, admin management               |
| Movies         | `movies.test.ts`    | Movie CRUD, search, filtering by genre/language            |
| Showtimes      | `showtimes.test.ts` | Schedule creation, availability checks, date filtering     |
| Bookings       | `bookings.test.ts`  | Booking creation, confirmation, cancellation, seat updates |
| Seats          | `seats.test.ts`     | Seat generation, hold/release, real-time status            |
| Payments       | `payments.test.ts`  | PayPal integration, refund processing                      |
| Reviews        | `reviews.test.ts`   | Review CRUD, verified booking badge, rating aggregation    |

### Example Integration Test: Create Booking

```typescript
describe("POST /api/bookings - Create Booking", () => {
  it("should create a booking successfully", async () => {
    const cinema = await Cinema.create({ name: "Test Cinema" });
    const { token: adminToken } = await createUserWithToken({
      role: "cinema_admin",
      cinemaId: cinema._id,
    });
    const { token } = await createUserWithToken();
    const { showtime } = await createTestShowtime(adminToken, cinema._id);
    const seatIds = await createTestSeats(showtime._id, 2, showtime.price);

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        showtimeId: showtime._id,
        seatIds,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.numberOfSeats).toBe(2);
    expect(res.body.data.booking.bookingStatus).toBe("pending");
    expect(res.body.data.expiresAt).toBeDefined();
  });

  it("should reject booking for non-existent showtime", async () => {
    const { token } = await createUserWithToken();

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        showtimeId: new mongoose.Types.ObjectId().toString(),
        seatIds: generateSeatIds(1),
      })
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});
```

### Example Integration Test: Booking Cancellation

```typescript
describe("DELETE /api/bookings/:id - Cancel Booking", () => {
  it("should restore available seats after cancellation", async () => {
    // Setup...
    const { showtime } = await createTestShowtime(adminToken, cinema._id, {
      totalSeats: 50,
    });

    // Create and confirm booking
    const createRes = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ showtimeId: showtime._id, seatIds });

    await request(app)
      .post(`/api/bookings/${createRes.body.data.booking._id}/confirm`)
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentId });

    // Verify seats decreased
    const afterConfirm = await Showtime.findById(showtime._id);
    expect(afterConfirm?.availableSeats).toBe(48);

    // Cancel booking
    await request(app)
      .delete(`/api/bookings/${createRes.body.data.booking._id}`)
      .set("Authorization", `Bearer ${token}`);

    // Verify seats restored
    const afterCancel = await Showtime.findById(showtime._id);
    expect(afterCancel?.availableSeats).toBe(50);
  });
});
```

---

## System Testing

Complete end-to-end user flows validated:

### Flow 1: Registration to Booking

1. User registers with email
2. User logs in and receives JWT token
3. User browses movies and selects a showtime
4. User selects seats (with 10-minute hold)
5. User completes PayPal Sandbox payment
6. Booking is confirmed with QR code
7. Booking appears in user history

### Flow 2: Booking Cancellation

1. User views booking history
2. User selects a confirmed booking
3. User cancels booking (before showtime)
4. Seats are released and become available
5. Refund is processed (PayPal Sandbox)
6. Booking status updates to "cancelled"

### Flow 3: Admin Operations

1. Cinema admin creates showtimes
2. Platform admin manages movies and cinemas
3. Admin views all bookings for their cinema
4. Revenue and booking statistics displayed

### Flow 4: WebSocket Real-time Updates

1. User A selects seats
2. User B sees seats as "held" in real-time
3. Booking confirmation broadcasts seat status
4. Expired holds release seats automatically

### Flow 5: Payment Processing

1. User initiates PayPal Sandbox payment
2. PayPal order created with booking details
3. User completes payment on PayPal
4. Payment captured and booking confirmed
5. Payment history accessible from profile

---

## User Acceptance Testing

- **Target Participants**: 5 (not team members)
- **Session Duration**: 15–25 minutes each
- **Protocol**: Think-aloud observation with moderator

### Test Scenarios

| Scenario | Description                             | Success Criteria                                      |
| -------- | --------------------------------------- | ----------------------------------------------------- |
| A        | First-time user booking (core flow)     | Complete without guidance, booking visible in history |
| B        | Seat selection clarity + changing seats | User understands seat states, updates correctly       |
| C        | Search/filter discovery                 | User locates specific movie and showtime              |
| D        | Cancellation + verification             | Booking cancelled, seats available again              |

### Data Captured

- Pass/Fail per scenario
- Time per scenario
- Errors/blockers encountered
- Satisfaction rating (1–5)
- Key feedback quotes
- Screenshots as evidence

### Results Summary

> _(To be completed after UAT execution)_
>
> - Scenario A success rate: \_\_%
> - Scenario B success rate: \_\_%
> - Average satisfaction: \_\_/5
> - Issues found: [List]
> - Issues fixed: [List with commit references]

---

## Code Quality

### ESLint Configuration

- **Status**: ✅ Configured
- **Parser**: @typescript-eslint/parser
- **Rules**: Strict TypeScript checks enabled

### Prettier Configuration

- **Status**: ✅ Configured
- **Integration**: Format on save

### TypeScript

- **Mode**: Strict mode enabled
- **Target**: ES2020
- **Compiler**: ts-jest for tests

### Coverage Thresholds (Jest)

```javascript
coverageThreshold: {
  global: {
    branches: 55,   // Actual: 74.25%
    functions: 70,  // Actual: 88.78%
    lines: 70,      // Actual: 86.22%
    statements: 70, // Actual: 85.75%
  },
},
```

> **All thresholds exceeded ✅**

---

## Running Tests

```bash
# Run all tests with coverage
npm run test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## Test Configuration Files

- `backend/jest.config.js` — Jest configuration with coverage thresholds
- `backend/src/tests/setup.ts` — MongoDB Memory Server setup and teardown
- `backend/package.json` — Test scripts

---

_Report generated for Cinema Booking System v1.0.0_
