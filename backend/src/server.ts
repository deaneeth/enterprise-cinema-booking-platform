// server.ts (Member 1 initializes)
// Server entry point - Initializes and starts the Express server
// Sets up middleware, routes, database connection, and starts listening on configured port

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import showtimeRoutes from './routes/showtimes';

// Config imports
import { env, isDevelopment } from './config/environment';
import { connectDatabase, setupDatabaseEvents } from './config/database';

// Route imports
import userRoutes from './routes/users';
import cinemaRoutes from './routes/cinemas';
import movieRoutes from './routes/movies';
import bookingRoutes from './routes/bookings';
import seatRoutes from './routes/seats';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';

// Service imports
import websocketService from './services/websocket';
import seatCleanupService from './services/seatCleanup';

// Middleware imports
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

// Create Express app
const app: Application = express();

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request logging (only in development)
if (isDevelopment()) {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// HEALTH CHECK ROUTE
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

// ============================================
// API ROUTES
// ============================================

// User routes (auth + users)
app.use('/api', userRoutes);

// Cinema routes
app.use('/api', cinemaRoutes);

// Movie routes
app.use('/api', movieRoutes);

// Showtime routes
app.use('/api', showtimeRoutes);

// Booking routes
app.use('/api', bookingRoutes);

// Seat routes (Member 6)
app.use('/api/seats', seatRoutes);

// Payment routes (Member 7)
app.use('/api', paymentRoutes);

// Review routes (Member 8)
app.use('/api', reviewRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// WEBSOCKET INITIALIZATION
// ============================================

// Initialize WebSocket service with HTTP server
websocketService.initialize(httpServer);

// ============================================
// SERVER STARTUP
// ============================================

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Setup database event handlers
    setupDatabaseEvents();

    // Start seat hold cleanup job (runs every 30 seconds)
    seatCleanupService.startCleanupJob();

    // Start listening
    httpServer.listen(env.PORT, () => {
      console.log(`
========================================
🎬 Cinema Booking API Server
========================================
Environment: ${env.NODE_ENV}
Port: ${env.PORT}
Frontend URL: ${env.FRONTEND_URL}
========================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if not in test environment
if (env.NODE_ENV !== 'test') {
  startServer();
}

// Export for testing
export { app, httpServer, websocketService };
export default app;
