/**
 * Car interface
 */

export interface CarItem {
  id: string;
  make: string;
  model: string;
  seats: number;
  pricePerDayCents: number;
  owner: { email?: string; phone?: string };
}
