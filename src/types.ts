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
  displayName?: {
    text: string;
    languageCode: string;
  };
  name?: string; // Resource name: places/PLACE_ID
  id?: string; // The Place ID
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  primaryType?: string;
  primaryTypeDisplayName?: string;
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
}


/**
 * The following fields trigger the [Nearby Search Pro SKU](https://developers.google.com/maps/billing-and-pricing/sku-details#nearbysearch-pro-sku):
 * 
 */
export type NearbySearchProSKUInput =
  | "accessibilityOptions"
  | "addressComponents"
  | "addressDescriptor"
  | "adrFormatAddress"
  | "attributions"
  | "businessStatus"
  | "containingPlaces"
  | "displayName"
  | "formattedAddress"
  | "googleMapsLinks"
  | "googleMapsUri"
  | "iconBackgroundColor"
  | "iconMaskBaseUri"
  | "id"
  | "location"
  /**
   * The places.name field contains the place resource name in the form: places/PLACE_ID. Use places.displayName to access the text name of the place
   */
  | "name"
  | "movedPlace"
  | "movedPlaceId"
  | "photos"
  | "plusCode"
  | "postalAddress"
  | "primaryType"
  | "primaryTypeDisplayName"
  | "pureServiceAreaBusiness"
  | "shortFormattedAddress"
  | "subDestinations"
  | "types"
  | "utcOffsetMinutes"
  | "viewport";


/**
 * The following fields trigger the [Nearby Search Enterprise SKU](https://developers.google.com/maps/billing-and-pricing/sku-details#nearby-search-ent-sku):
 */
export type NearbySearchEnterpriseSKUInput =
  | "currentOpeningHours"
  | "currentSecondaryOpeningHours"
  | "internationalPhoneNumber"
  | "nationalPhoneNumber"
  | "priceLevel"
  | "priceRange"
  | "rating"
  | "regularOpeningHours"
  | "regularSecondaryOpeningHours"
  | "userRatingCount"
  | "websiteUri";


/**
 * The following fields trigger the [Nearby Search Enterprise + Atmosphere SKU:](https://developers.google.com/maps/billing-and-pricing/sku-details#nearby-search-ent-plus-sku):
 */
export type NearbySearchEnterpriseAtmosphereSKUInput =
  | "allowsDogs"
  | "curbsidePickup"
  | "delivery"
  | "dineIn"
  | "editorialSummary"
  | "evChargeAmenitySummary"
  | "evChargeOptions"
  | "fuelOptions"
  | "generativeSummary"
  | "goodForChildren"
  | "goodForGroups"
  | "goodForWatchingSports"
  | "liveMusic"
  | "menuForChildren"
  | "neighborhoodSummary"
  | "parkingOptions"
  | "paymentOptions"
  | "outdoorSeating"
  | "reservable"
  | "restroom"
  | "reviews"
  | "reviewSummary"
  | "routingSummaries"
  | "servesBeer"
  | "servesBreakfast"
  | "servesBrunch"
  | "servesCocktails"
  | "servesCoffee"
  | "servesDessert"
  | "servesDinner"
  | "servesLunch"
  | "servesVegetarianFood"
  | "servesWine"
  | "takeout";

/**
 * Specify one or more of the following fields, [according to the API](https://developers.google.com/maps/documentation/places/web-service/nearby-search)
 */
export type NearbySearchAttributes = NearbySearchProSKUInput | NearbySearchEnterpriseSKUInput | NearbySearchEnterpriseAtmosphereSKUInput;
