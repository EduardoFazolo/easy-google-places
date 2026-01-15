import { Coordinate, PlaceResult } from "./types";

export async function fetchPlaceFromApi(
  location: Coordinate,
  radius: number,
  type: string,
  apiKey: string,
  onProgress?: (count: number) => void,
  allowClosedStores: boolean = false,
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

  for (let i = 0; i < maxPages; i++) {
    if (i > 0 && !nextPageToken) {
      break;
    }

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
        // console.log("\n\n\n", JSON.stringify(data.results))
        let activePlaces: PlaceResult[] = [];
        if (!allowClosedStores) {
          activePlaces = (data.results as PlaceResult[]).filter(
            (place) => place.business_status !== "CLOSED_TEMPORARILY"
          );
        } else {
          activePlaces = data.results as PlaceResult[];
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
