// email.ts (Member 7)
// Email service - Handles email notifications and confirmations
// Sends booking confirmations, payment confirmations, refund notifications
// Note: This implementation uses console logging for development. In production,
// integrate with a real email service like SendGrid, Mailgun, or AWS SES.

import { PaymentDocument } from '../models/Payment';
import { IUser } from '../models/User';

/* =======================
  Populated Booking Type
======================= */
interface PopulatedMovie {
  title: string;
  posterUrl?: string;
}

interface PopulatedCinema {
  name: string;
  location?: string;
}

interface PopulatedShowtime {
  movieId: PopulatedMovie;
  cinemaId: PopulatedCinema;
  date?: Date;
  startTime: string | Date;
  screenNumber: number;
}

interface PopulatedSeat {
  seatNumber: string;
  row: string;
  column: number;
}

interface PopulatedBooking {
  _id: string;
  showtimeId: PopulatedShowtime; // Note: Mongoose uses 'showtimeId' for the populated field
  seatIds: PopulatedSeat[]; // Note: Mongoose uses 'seatIds' for the populated field
  totalAmount: number;
  qrCode?: string;
}

/* =======================
  Email Service Class
======================= */
class EmailService {
  /**
   * Send payment confirmation email after successful payment
   * @param booking - Populated booking with showtime, movie, cinema, and seats
   * @param payment - Payment document with transaction details
   * @param user - User document with email and name
   */
  async sendPaymentConfirmation(
    booking: PopulatedBooking,
    payment: PaymentDocument,
    user: IUser
  ): Promise<void> {
    const paymentDate = payment.paymentDate
      ? new Date(payment.paymentDate).toLocaleString()
      : new Date().toLocaleString();

    // Handle both date and startTime as fallback for showDate
    const showDateValue = booking.showtimeId.date || booking.showtimeId.startTime;
    const showDate = showDateValue 
      ? new Date(showDateValue).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'TBD';

    // Format startTime for display
    const startTimeStr = booking.showtimeId.startTime
      ? new Date(booking.showtimeId.startTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'TBD';

    const seatNumbers = booking.seatIds.map((s) => s.seatNumber).join(', ') || 'N/A';
    const movieTitle = booking.showtimeId.movieId?.title || 'Movie';
    const cinemaName = booking.showtimeId.cinemaId?.name || 'Cinema';

    console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║              PAYMENT CONFIRMATION EMAIL                      ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ To: ${user.email}
      ║ Subject: Payment Confirmed - ${movieTitle}
      ║
      ║ Dear ${user.firstName},
      ║
      ║ Your payment has been successfully processed!
      ║
      ║ ────────────────────────────────────────────────────────────
      ║ PAYMENT DETAILS
      ║ ────────────────────────────────────────────────────────────
      ║ Transaction ID: ${payment.paypalCaptureId || 'N/A'}
      ║ Amount Paid: USD ${payment.amount.toFixed(2)}
      ║ Payment Method: ${payment.paymentMethod === 'paypal' ? 'PayPal' : 'Card'}
      ║ Date: ${paymentDate}
      ║
      ║ ────────────────────────────────────────────────────────────
      ║ BOOKING DETAILS
      ║ ────────────────────────────────────────────────────────────
      ║ Booking Reference: ${booking._id}
      ║ Movie: ${movieTitle}
      ║ Cinema: ${cinemaName}
      ║ Screen: ${booking.showtimeId.screenNumber}
      ║ Date: ${showDate}
      ║ Time: ${startTimeStr}
      ║ Seats: ${seatNumbers}
      ║
      ║ Show your QR code at the cinema entrance.
      ║
      ║ Thank you for booking with CineBook!
      ╚══════════════════════════════════════════════════════════════╝
    `);

    // TODO: In production, replace console.log with actual email sending
    // Example with SendGrid:
    // await sendgrid.send({
    //   to: user.email,
    //   from: 'noreply@cinebook.com',
    //   subject: `Payment Confirmed - ${movieTitle}`,
    //   html: generateEmailTemplate(booking, payment, user),
    // });
  }

  /**
   * Send refund confirmation email after successful refund
   * @param booking - Populated booking with showtime, movie, cinema, and seats
   * @param payment - Payment document with refund details
   * @param user - User document with email and name
   */
  async sendRefundConfirmation(
    booking: PopulatedBooking,
    payment: PaymentDocument,
    user: IUser
  ): Promise<void> {
    const movieTitle = booking.showtimeId?.movieId?.title || 'Your booking';

    console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║              REFUND CONFIRMATION EMAIL                       ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ To: ${user.email}
      ║ Subject: Refund Processed - ${movieTitle}
      ║
      ║ Dear ${user.firstName},
      ║
      ║ Your refund has been successfully processed.
      ║
      ║ ────────────────────────────────────────────────────────────
      ║ REFUND DETAILS
      ║ ────────────────────────────────────────────────────────────
      ║ Refund Amount: USD ${payment.amount.toFixed(2)}
      ║ Refund ID: ${payment.paypalRefundId || 'N/A'}
      ║ Original Transaction: ${payment.paypalCaptureId || 'N/A'}
      ║ Booking Reference: ${booking._id}
      ║
      ║ The amount will be credited to your original payment method
      ║ within 5-10 business days.
      ║
      ║ If you have any questions, please contact our support team.
      ║
      ║ Thank you for using CineBook!
      ╚══════════════════════════════════════════════════════════════╝
    `);

    // TODO: In production, replace console.log with actual email sending
  }

  /**
   * Send booking confirmation email (before payment)
   * @param booking - Populated booking with showtime, movie, cinema, and seats
   * @param user - User document with email and name
   */
  async sendBookingConfirmation(
    booking: PopulatedBooking,
    user: IUser
  ): Promise<void> {
    // Handle both date and startTime as fallback for showDate
    const showDateValue = booking.showtimeId.date || booking.showtimeId.startTime;
    const showDate = showDateValue 
      ? new Date(showDateValue).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'TBD';

    // Format startTime for display
    const startTimeStr = booking.showtimeId.startTime
      ? new Date(booking.showtimeId.startTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'TBD';

    const seatNumbers = booking.seatIds.map((s) => s.seatNumber).join(', ') || 'N/A';
    const movieTitle = booking.showtimeId.movieId?.title || 'Movie';
    const cinemaName = booking.showtimeId.cinemaId?.name || 'Cinema';

    console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║              BOOKING CONFIRMATION EMAIL                      ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ To: ${user.email}
      ║ Subject: Booking Confirmed - ${movieTitle}
      ║
      ║ Dear ${user.firstName},
      ║
      ║ Your booking has been confirmed!
      ║
      ║ ────────────────────────────────────────────────────────────
      ║ BOOKING DETAILS
      ║ ────────────────────────────────────────────────────────────
      ║ Booking Reference: ${booking._id}
      ║ Movie: ${movieTitle}
      ║ Cinema: ${cinemaName}
      ║ Screen: ${booking.showtimeId.screenNumber}
      ║ Date: ${showDate}
      ║ Time: ${startTimeStr}
      ║ Seats: ${seatNumbers}
      ║ Total Amount: USD ${booking.totalAmount.toFixed(2)}
      ║
      ║ Please complete your payment within 10 minutes to secure
      ║ your seats.
      ║
      ║ Thank you for choosing CineBook!
      ╚══════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Send booking cancellation email
   * @param booking - Populated booking with showtime, movie, cinema, and seats
   * @param user - User document with email and name
   * @param reason - Optional cancellation reason
   */
  async sendBookingCancellation(
    booking: PopulatedBooking,
    user: IUser,
    reason?: string
  ): Promise<void> {
    const movieTitle = booking.showtimeId?.movieId?.title || 'Your booking';
    const cancellationReason = reason || 'User requested cancellation';

    console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║              BOOKING CANCELLATION EMAIL                      ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ To: ${user.email}
      ║ Subject: Booking Cancelled - ${movieTitle}
      ║
      ║ Dear ${user.firstName},
      ║
      ║ Your booking has been cancelled.
      ║
      ║ ────────────────────────────────────────────────────────────
      ║ CANCELLATION DETAILS
      ║ ────────────────────────────────────────────────────────────
      ║ Booking Reference: ${booking._id}
      ║ Reason: ${cancellationReason}
      ║
      ║ If a payment was made, a refund will be processed within
      ║ 5-10 business days.
      ║
      ║ We hope to see you again soon at CineBook!
      ╚══════════════════════════════════════════════════════════════╝
    `);
  }
}

/* =======================
  Export Singleton Instance
======================= */
export default new EmailService();
