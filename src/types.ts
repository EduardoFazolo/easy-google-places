/**
 * Represents a geographic coordinate.
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Define simplified interface for the result based on the user's snippet
export interface PlaceResult {
  business_status?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    } | {
      lat(): number;
      lng(): number;
    };
    viewport?: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  icon?: string;
  icon_background_color?: string;
  icon_mask_base_uri?: string;
  international_phone_number?: string;
  name?: string;
  opening_hours?: {
    open_now: boolean;
    periods?: Array<{
      close: {
        time: string;
      };
      open: {
        time: string;
      };
    }>;
  };
  photos?: Array<{
    height: number;
    html_attributions: string[];
    photo_reference: string;
    width: number;
  }>;
  place_id?: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  rating?: number;
  reference?: string;
  scope?: string;
  types?: string[];
  user_ratings_total?: number;
  vicinity?: string;
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_phone_number?: string;
  website?: string;
  price_level?: number;
  timezone?: string;
}