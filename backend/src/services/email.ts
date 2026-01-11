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
interface PopulatedShowtime {
  movie: {
    title: string;
    posterUrl?: string;
  };
  cinema: {
    name: string;
    location?: string;
  };
  date: Date;
  startTime: string;
  screenNumber: number;
}

interface PopulatedSeat {
  seatNumber: string;
  row: string;
  column: number;
}

interface PopulatedBooking {
  _id: string;
  showtime: PopulatedShowtime;
  seats: PopulatedSeat[];
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

    const showDate = new Date(booking.showtime.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const seatNumbers = booking.seats.map((s) => s.seatNumber).join(', ');

    console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║              PAYMENT CONFIRMATION EMAIL                      ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ To: ${user.email}
      ║ Subject: Payment Confirmed - ${booking.showtime.movie.title}
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
      ║ Movie: ${booking.showtime.movie.title}
      ║ Cinema: ${booking.showtime.cinema.name}
      ║ Screen: ${booking.showtime.screenNumber}
      ║ Date: ${showDate}
      ║ Time: ${booking.showtime.startTime}
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
    //   subject: `Payment Confirmed - ${booking.showtime.movie.title}`,
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
    const movieTitle = booking.showtime?.movie?.title || 'Your booking';

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
    const showDate = new Date(booking.showtime.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const seatNumbers = booking.seats.map((s) => s.seatNumber).join(', ');

    console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║              BOOKING CONFIRMATION EMAIL                      ║
      ╠══════════════════════════════════════════════════════════════╣
      ║ To: ${user.email}
      ║ Subject: Booking Confirmed - ${booking.showtime.movie.title}
      ║
      ║ Dear ${user.firstName},
      ║
      ║ Your booking has been confirmed!
      ║
      ║ ────────────────────────────────────────────────────────────
      ║ BOOKING DETAILS
      ║ ────────────────────────────────────────────────────────────
      ║ Booking Reference: ${booking._id}
      ║ Movie: ${booking.showtime.movie.title}
      ║ Cinema: ${booking.showtime.cinema.name}
      ║ Screen: ${booking.showtime.screenNumber}
      ║ Date: ${showDate}
      ║ Time: ${booking.showtime.startTime}
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
    const movieTitle = booking.showtime?.movie?.title || 'Your booking';
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
