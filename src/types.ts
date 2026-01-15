/**
 * Represents a geographic coordinate.
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Define simplified interface for the result based on the user's snippet
// --- Legacy Maps API Types ---

export interface MapsPlaceResult {
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

// --- New Places API Types ---

export interface PlaceResult {
  name?: string; // Resource name: places/PLACE_ID
  id?: string; // The Place ID
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
    languageCode: string;
  }>;
  plusCode?: {
    globalCode: string;
    compoundCode: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  viewport?: {
    low: {
      latitude: number;
      longitude: number;
    };
    high: {
      latitude: number;
      longitude: number;
    };
  };
  rating?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    openNow: boolean;
    periods: Array<{
      open: {
        day: number;
        hour: number;
        minute: number;
      };
      close: {
        day: number;
        hour: number;
        minute: number;
      };
    }>;
    weekdayDescriptions: string[];
  };
  utcOffsetMinutes?: number;
  userRatingCount?: number;
  displayName?: {
    text: string;
    languageCode: string;
  };
  priceLevel?: string; 
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
    authorAttributions: Array<{
      displayName: string;
      uri: string;
      photoUri: string;
    }>;
  }>;
  businessStatus?: string;
  reservable?: boolean;
  parkingOptions?: string[];
  googleMapsLinks?: string[];
}