export interface Showtime {
  _id: string;
  movieId?: {
    _id: string;
    title: string;
  } | string;
  cinemaId?: {
    _id: string;
    name: string;
  } | string;
  startTime: string;  // ISO date string
  endTime: string;    // ISO date string
  date: string;       // ISO date string
  format?: "2D" | "3D" | "IMAX";
  language?: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
}