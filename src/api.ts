import { Coordinate } from "./geometry";

// Define simplified interface for the result based on the user's snippet
export interface PlaceResult {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  [key: string]: any;
}

export async function fetchPlaceFromApi(
  location: Coordinate,
  radius: number,
  type: string,
  apiKey: string,
  onProgress?: (count: number) => void
): Promise<PlaceResult[]> {
  const allPlaces: PlaceResult[] = [];
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
  let pageCount = 0;

  do {
    const currentUrl = new URL(url.toString());
    if (nextPageToken) {
      currentUrl.searchParams.append("pagetoken", nextPageToken);
      // Determine if we need to wait.
      // Although the user snippet has a wait, let's keep it robust.
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
        allPlaces.push(...(data.results as PlaceResult[]));
        if (onProgress) {
            onProgress(data.results.length);
        }
      }

      nextPageToken = data.next_page_token;
      pageCount++;
    } catch (error) {
      console.error("Network error fetching places:", error);
      break;
    }
  } while (nextPageToken && pageCount < maxPages);

  return allPlaces;
}
