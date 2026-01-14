/**
 * Represents a geographic coordinate.
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Define simplified interface for the result based on the user's snippet
export interface PlaceResult {
  place_id: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?:
      | {
          lat(): number;
          lng(): number;
        }
      | {
          lat: number;
          lng: number;
        };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_phone_number?: string;
  website?: string;
  price_level?: number;
  rating?: number;
  types?: string[];
  timezone?: string;
  business_status?: string;
  user_ratings_total?: number;
}