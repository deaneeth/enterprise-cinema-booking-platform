// Showtime.ts (Member 4)
// Showtime model - Defines the showtime schema/entity for movie screening schedules
// Handles showtime data structure including movie, cinema, time, and available seats

// backend/src/models/Showtime.ts

import mongoose, { Schema, Document } from "mongoose";

/* =======================
  Showtime Document Type
======================= */
export interface ShowtimeDocument extends Document {
 movieId: mongoose.Types.ObjectId;
 cinemaId: mongoose.Types.ObjectId;
 screenNumber: number;
 startTime: Date;
 endTime: Date;
 date: Date;
 price: number;
 format?: "2D" | "3D" | "IMAX";
 language?: string;
 totalSeats: number;
 availableSeats: number;
 isActive: boolean;

 isBookable(): boolean;
 hasBookings: boolean;
}

/* =======================
  Showtime Schema
======================= */
const ShowtimeSchema = new Schema<ShowtimeDocument>(
 {
   movieId: {
     type: Schema.Types.ObjectId,
     ref: "Movie",
     required: true
   },
   cinemaId: {
     type: Schema.Types.ObjectId,
     ref: "Cinema",
     required: true
   },
   screenNumber: {
     type: Number,
     required: true
   },
   startTime: {
     type: Date,
     required: true
   },
   endTime: {
     type: Date,
     required: true
   },
   date: {
     type: Date,
     required: true
   },
   price: {
     type: Number,
     required: true
   },
   format: {
     type: String,
     enum: ["2D", "3D", "IMAX"]
   },
   language: {
     type: String
   },
   totalSeats: {
     type: Number,
     required: true
   },
   availableSeats: {
     type: Number,
     required: true
   },
   isActive: {
     type: Boolean,
     default: true
   }
 },
 {
   timestamps: true,
   toJSON: { virtuals: true },
   toObject: { virtuals: true }
 }
);

/* =======================
  Virtuals
======================= */

// Seats already booked?
ShowtimeSchema.virtual("hasBookings").get(function (this: ShowtimeDocument) {
 return this.availableSeats < this.totalSeats;
});

// Virtual populate (optional)
ShowtimeSchema.virtual("seats", {
 ref: "Seat",
 localField: "_id",
 foreignField: "showtimeId"
});

/* =======================
  Hooks
======================= */

// Auto-calculate endTime from movie duration
ShowtimeSchema.pre("save", async function (next) {
 if (!this.isModified("startTime") && !this.isModified("movieId")) {
   return next();
 }

 const Movie = mongoose.model("Movie");
 const movie: any = await Movie.findById(this.movieId).select("duration");

 if (!movie?.duration) {
   return next(new Error("Movie duration is required to calculate endTime"));
 }

 this.endTime = new Date(
   this.startTime.getTime() + movie.duration * 60000
 );

 // Normalize date (date-only)
 this.date = new Date(this.startTime.setHours(0, 0, 0, 0));

 next();
});

/* =======================
  Instance Methods
======================= */

ShowtimeSchema.methods.isBookable = function (): boolean {
 return (
   this.isActive &&
   this.startTime > new Date() &&
   this.availableSeats > 0
 );
};

/* =======================
  Indexes
======================= */

ShowtimeSchema.index({ movieId: 1, cinemaId: 1, date: 1 });
ShowtimeSchema.index({ startTime: 1 });

/* =======================
  Model Export
======================= */

// const Showtime = mongoose.model<ShowtimeDocument>(
//   "Showtime",
//   ShowtimeSchema
// );

// export default Showtime;

const Showtime = mongoose.model<ShowtimeDocument>('Showtime', ShowtimeSchema);

export default Showtime;





