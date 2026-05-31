export interface Reservation {
  id: string;
  queueNumber: string;
  status: string;
  position: number;
  peopleAhead: number;
  estimatedWait: number;
  currentServingNumber: string;
  agencyName: string;
  agencyNameAr?: string;
  agencyNameFr?: string;
  serviceName: string;
  serviceNameAr?: string;
  serviceNameFr?: string;
  joinedAt: string;
  reservedDate?: string;
  rating?: number | null;
  skippedForNoShow?: boolean;
  preferredTime?: string;
  fixedTimeEnabled?: boolean;
  postponeCount?: number;
}

// Progress ring constants
export const RING_RADIUS = 52;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Circular countdown constants
export const COUNTDOWN_RADIUS = 36;
export const COUNTDOWN_CIRCUMFERENCE = 2 * Math.PI * COUNTDOWN_RADIUS;
