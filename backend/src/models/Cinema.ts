// Cinema.ts (Member 2)
// Cinema model - Defines the cinema schema/entity for theater locations
// Handles cinema data structure including location, facilities, and screening rooms

import mongoose, { Document, Schema } from 'mongoose';

export interface ICinemaCoordinates {
  lat: number;
  lng: number;
}

// Location information for a cinema (optional fields allow partial updates)
export interface ICinemaLocation {
  address?: string;
  city?: string;
  coordinates?: ICinemaCoordinates;
}

// Cinema document interface (Mongoose + application fields)
export interface ICinema extends Document {
  
  name: string;
  chain?: string;
  location?: ICinemaLocation;
  facilities: string[];
  adminUserId?: mongoose.Types.ObjectId;
  screens?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  calculateDistance(lat: number, lng: number): number;
}

// ============================================
// SCHEMA
// ============================================

const CinemaSchema: Schema<ICinema> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Cinema name is required'],
      trim: true,
    },
    chain: {
      type: String,
      trim: true,
    },
    location: {
      address: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      coordinates: {
        lat: {
          type: Number,
          min: [-90, 'Latitude must be >= -90'],
          max: [90, 'Latitude must be <= 90'],
        },
        lng: {
          type: Number,
          min: [-180, 'Longitude must be >= -180'],
          max: [180, 'Longitude must be <= 180'],
        },
      },
    },
    facilities: {
      type: [String],
      default: [],
    },
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    screens: {
      type: Number,
      min: [0, 'Screens must be >= 0'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// METHODS
// ============================================

// Calculates the great-circle distance (Haversine formula) between this cinema and
// a target coordinate. Returns distance in kilometers.
CinemaSchema.methods.calculateDistance = function (
  lat: number,
  lng: number
): number {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Invalid coordinates provided');
  }

  const cinemaLat = this.location?.coordinates?.lat;
  const cinemaLng = this.location?.coordinates?.lng;

  if (typeof cinemaLat !== 'number' || typeof cinemaLng !== 'number') {
    throw new Error('Cinema coordinates are not set');
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat - cinemaLat);
  const dLng = toRadians(lng - cinemaLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(cinemaLat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

// ============================================
// MODEL EXPORT
// ============================================

const Cinema = mongoose.model<ICinema>('Cinema', CinemaSchema);

export default Cinema;
