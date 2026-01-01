// Showtime.ts (Member 4)
// Showtime model - Defines the showtime schema/entity for movie screening schedules
// Handles showtime data structure including movie, cinema, time, and available seats

// backend/src/models/Showtime.ts

import mongoose, { Schema, Document, Model } from 'mongoose';


export interface ShowtimeDocument extends Document {
  movieId: mongoose.Types.ObjectId;
  cinemaId: mongoose.Types.ObjectId;
  screenNumber: number;
  startTime: Date;
  endTime: Date;
  date: Date;
  price: number;
  format?: '2D' | '3D' | 'IMAX';
  language?: string;
  totalSeats: number;
  availableSeats: number;
  isActive: boolean;
  isBookable(): boolean;
}

const ShowtimeSchema = new Schema<ShowtimeDocument>(
  {
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    cinemaId: { type: Schema.Types.ObjectId, ref: 'Cinema', required: true },
    screenNumber: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date }, // auto-calculated
    date: { type: Date, required: true },
    price: { type: Number, required: true },
    format: { type: String, enum: ['2D', '3D', 'IMAX'] },
    language: { type: String },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual populate for seats
ShowtimeSchema.virtual('seats', {
  ref: 'Seat',
  localField: '_id',
  foreignField: 'showtimeId',
});

// Pre-save hook to calculate endTime from movie duration
ShowtimeSchema.pre('save', async function (next) {
  if (this.isModified('startTime') || this.isModified('movieId')) {
    const Movie = mongoose.model('Movie'); 
    const movie: any = await Movie.findById(this.movieId);
    if (movie && movie.duration) {
      this.endTime = new Date(this.startTime.getTime() + movie.duration * 60000);
    }
  }
  next();
});

// Instance method
ShowtimeSchema.methods.isBookable = function (): boolean {
  return this.startTime > new Date() && this.availableSeats > 0;
};

// Indexes
ShowtimeSchema.index({ movieId: 1, cinemaId: 1, date: 1 });

export const Showtime: Model<ShowtimeDocument> = mongoose.model<ShowtimeDocument>(
  'Showtime',
  ShowtimeSchema
);






