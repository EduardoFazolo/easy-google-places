# Easy Google Restaurants

A TypeScript library to query Google Places API with automatic area subdivision used to bypass the 60 results limit.

## Features

- **Automatic Subdivision**: Splits large search areas into smaller 500m radius sub-circles to maximize results, overcoming the 60-result limit per query.
- **Fluent API**: Easy-to-use chainable methods for configuration.
- **Rate Limiting**: Handles API pagination and rate limiting automatically.
- **Filtering**: By default, filters out temporarily closed places (configurable).
- **Flexible Output**: Export to JSON, CSV, or handle results with a custom callback.

## Installation

```bash
npm install easy-google-places
# or
bun add easy-google-places
# or
yarn add easy-google-places
```

## Basic Usage

```typescript
import { getGooglePlaces } from "easy-google-places";

// Coordinates for the center of your search (e.g., Paris)
const location = { latitude: 48.8566, longitude: 2.3522 };

await getGooglePlaces(location)
  .radius(2000) // Search within 2km radius
  .placesType("restaurant") // Default is "restaurant"
  .apiKey("YOUR_GOOGLE_MAPS_API_KEY") // Or set via NEXT_PUBLIC_GOOGLE_MAPS_API_KEY env var
  .showLogs() // Print logs to console
  .showProgress() // Show progress per batch
  .onFinished("json") // Save results to places_output.json
  .run();

// or, if you want to extract the results to a variable
const places: PlaceResult[] =[]
await getGooglePlaces(location)
  .radius(2000)
  .placesType("restaurant")
  .apiKey("YOUR_GOOGLE_MAPS_API_KEY")
  .showLogs()
  .showProgress()
  .onFinished((p) => places.push(...p))
  .run();
```

## Including Temporarily Closed Stores
By default, the library filters out places with `business_status: "CLOSED_TEMPORARILY"`. To include them:

```typescript
await getGooglePlaces(location)
  .allowClosedStores() // Include temporarily closed places
  .run();
```

## detailed Usage & Output Formats

### Using a Callback (`onFinished`)

You can process the results directly in your code instead of saving to a file:

```typescript
await getGooglePlaces(location)
  .apiKey("YOUR_API_KEY")
  .onFinished((places) => {
    console.log(`Found ${places.length} places!`);
    places.forEach(place => {
      console.log(`Name: ${place.name}, Rating: ${place.rating}`);
    });
  })
  .run();
```

### Output Formats

**CSV Output (`.onFinished("csv")`)**
Creates `places_output.csv` with columns:
`name, address, rating, user_ratings_total, place_id, lat, lng`

**JSON Output (`.onFinished("json")`)**
Creates `places_output.json` containing an array of place objects:
```json
[
  {
    "place_id": "ChIJ...",
    "name": "Le Example Bistro",
    "formatted_address": "123 Rue de Example, Paris",
    "geometry": {
      "location": {
        "lat": 48.85,
        "lng": 2.35
      }
    },
    "types": ["restaurant", "food", "point_of_interest"],
    "rating": 4.5,
    "user_ratings_total": 120,
    "business_status": "OPERATIONAL"
  }
]
```

## Requirements
- Node.js or Bun environment.
- A valid Google Cloud API Key with **Places API (New)** or **Places API** enabled.

## License
MIT
