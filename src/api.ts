import { Coordinate, MapsPlaceResult, PlaceResult } from "./types";

/**
 * Fetches places using the Legacy Google Places API (Nearby Search).
 * Matches the original behavior of this library.
 */
export async function fetchLegacyPlaces(
  location: Coordinate,
  radius: number,
  type: string,
  apiKey: string,
  onProgress?: (count: number) => void,
  allowClosedStores: boolean = false
): Promise<MapsPlaceResult[]> {
  const allPlaces: MapsPlaceResult[] = [];
  const maxPages = 3;
  
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.append("location", `${location.latitude},${location.longitude}`);
  url.searchParams.append("radius", radius.toString());
  url.searchParams.append("type", type);
  // Important: Google Places API does not support explicit pagination by page number,
  // only by next_page_token.
  url.searchParams.append("key", apiKey);

  let nextPageToken: string | undefined = undefined;

  for (let i = 0; i < maxPages; i++) {
    if (i > 0 && !nextPageToken) {
      break;
    }

    const currentUrl = new URL(url.toString());
    if (nextPageToken) {
      currentUrl.searchParams.append("pagetoken", nextPageToken);
      // Determine if we need to wait.
      // Google requires a short delay before the next_page_token becomes valid.
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    try {
      const response = await fetch(currentUrl.toString());
      const data = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Google Places API error:", data.status, data.error_message);
        break;
      }

      if (data.results) {
        let activePlaces: MapsPlaceResult[] = [];
        if (!allowClosedStores) {
          activePlaces = (data.results as MapsPlaceResult[]).filter(
            (place) => place.business_status !== "CLOSED_TEMPORARILY"
          );
        } else {
          activePlaces = data.results as MapsPlaceResult[];
        }
        
        allPlaces.push(...activePlaces);

        if (onProgress) {
          onProgress(activePlaces.length);
        }
      }

      nextPageToken = data.next_page_token;
    } catch (error) {
      console.error("Network error fetching places:", error);
      break;
    }
  }

  return allPlaces;
}

/**
 * Fetches places using the New Google Places API (v1).
 * Allows specifying fields to retrieve.
 */
export async function fetchNewPlaces(
  location: Coordinate,
  radius: number,
  type: string,
  apiKey: string,
  fields: string[],
  onProgress?: (count: number) => void,
  allowClosedStores: boolean = false
): Promise<PlaceResult[]> {
  const allPlaces: PlaceResult[] = [];
  
  const url = "https://places.googleapis.com/v1/places:searchNearby";

  // Ensure fields are properly formatted (prefixed with 'places.')
  const formattedFields = fields.map(f => f.startsWith("places.") ? f : `places.${f}`).join(",");
  
  // Implementation for single call:
  const requestBody = {
      locationRestriction: {
        circle: {
          center: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          radius: radius,
        },
      },
      includedTypes: [type], 
      maxResultCount: 20
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": formattedFields,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Google Places API error:", data.error?.message || data.error || data);
      return [];
    }

    if (data.places) {
       let activePlaces: PlaceResult[] = [];
       // Filter closed stores if needed.
       if (!allowClosedStores) {
          activePlaces = (data.places as PlaceResult[]).filter(
             (place) => place.businessStatus !== "CLOSED_TEMPORARILY" && place.businessStatus !== "CLOSED_PERMANENTLY"
          );
       } else {
          activePlaces = data.places as PlaceResult[];
       }

       allPlaces.push(...activePlaces);

       if (onProgress) {
         onProgress(activePlaces.length);
       }
    }
  } catch (error) {
    console.error("Network error fetching places:", error);
  }
  
  return allPlaces;
}
