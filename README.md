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
    "business_status":"OPERATIONAL",
    "geometry":{
      "location":{
          "lat":48.86455669999999,
          "lng":2.3730067
      },
      "viewport":{
          "northeast":{
            "lat":48.8658997302915,
            "lng":2.374421130291502
          },
          "southwest":{
            "lat":48.8632017697085,
            "lng":2.371723169708498
          }
      }
    },
    "icon":"https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png",
    "icon_background_color":"#FF9E67",
    "icon_mask_base_uri":"https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet",
    "international_phone_number":"+33 1 47 00 61 73",
    "name":"Ave Maria (ce restaurant n'est pas un restaurant Brésilien, même si nous faisons de la caipi)",
    "opening_hours":{
      "open_now":true
    },
    "photos":[
      {
          "height":4032,
          "html_attributions":[
            "<a href=\"https://maps.google.com/maps/contrib/111679119907463921442\">Johnny Højer Johansen</a>"
          ],
          "photo_reference":"AcnlKN1mAFiMl0uJqOk2mvJIgVYd-hUpCeWbBWMLF_c199JF6iZv7pbx0XNx8fUjFBD8sHqpIyeyJ5wzcj9_c_6JK3aDSxEw6unaD_6-k8RM5fw0as-vDN6l6AgjnzuKsA6bC1_bsFApbqq2s1PIZgmXkKrjK32aZt-uRki-ESkkLKfuIYUQe_TL7OTeh-rxOz92YeZWL6H-_F5N5fraJSHCl7UpJmTpnod2SgKFwSvUG1qH5zSHqGwL2knEkdWfuQR-lWrlYTCPtC3zgqyd7_KsPdkZPoSuDuW0KqH4H_ksgsu6XEaHFqRCR_SJXa_pC-bXdDNqbr4V1aeG33x2EwoNDQF9gYuEWryPm5ro5oN9cYwEnmlObfokk4RyGFlxueWxLhoudTJsdYq-lusL8tBup2ochGqiY_0jllUTgGkC_20jdcjRtr-GSDOfpajTo-VGMjVq0uWipXBS9cnvOTooQ_sbSvEokDHHhDRjgN3B4JRnZTL2FwdrI3bDamnxaVw4nOUuNBPdqFx9FQE3fEZWhrvyfCMP9-xUnFQhz1xgUJVJCi1UU9Bt3_wU1ntLTraHwrKXzJH_bkE5fbGiohycEC24DoJukmE1poW9NJMP786yDWeSEuVgEoMoToRXwnrm8lS5fQ",
          "width":3024
      }
    ],
    "place_id":"ChIJr21RoPxt5kcRXLq_HJp3lFc",
    "plus_code":{
      "compound_code":"V97F+R6 Paris, France",
      "global_code":"8FW4V97F+R6"
    },
    "price_level":2,
    "rating":4.4,
    "reference":"ChIJr21RoPxt5kcRXLq_HJp3lFc",
    "scope":"GOOGLE",
    "types":[
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
  ],
  "user_ratings_total":707,
  "vicinity":"1 Rue Jacquard, Paris"
  }
]
```

## Requirements
- Node.js or Bun environment.
- A valid Google Cloud API Key with **Places API (New)** or **Places API** enabled.

## License
MIT
