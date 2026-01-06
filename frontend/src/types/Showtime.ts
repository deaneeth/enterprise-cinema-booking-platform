export interface Showtime {
  _id: string;

  movieId?:
    | {
        _id: string;
        title: string;
        posterUrl?: string; // new
        duration?: number; // new
      }
    | string;

  cinemaId?:
    | {
        _id: string;
        name: string;
        location?: {
          // new
          city?: string; // new
        };
      }
    | string;

  screenNumber: number; // new
  isActive: boolean; // new

  startTime: string; // ISO date string
  endTime: string; // ISO date string
  date: string; // ISO date string

  format?: "2D" | "3D" | "IMAX";
  language?: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
}
