import { Coordinate, generateSubCircles } from "./geometry";
import { fetchPlaceFromApi, PlaceResult } from "./api";
import { appendFileSync, writeFileSync } from "fs";

type OutputFormat = "csv" | "json" | ((places: PlaceResult[]) => void);

export class PlaceQueryBuilder {
  private _location: Coordinate;
  private _radius: number = 4000; // Default 4km
  private _subRadius: number = 500; // Default 500m
  private _type: string = "restaurant";
  private _onFinished?: OutputFormat;
  private _showLogs: boolean = false;
  private _showProgress: boolean = false;
  private _apiKey: string | undefined;

  constructor(location: Coordinate) {
    this._location = location;
    // Try to load API Key from env if available (Bun loads .env automatically)
    this._apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }

  /**
   * Sets the type of place to search for (e.g., 'restaurant', 'cafe').
   * @param type The place type.
   */
  public placesType(type: string): this {
    this._type = type;
    return this;
  }

  /**
   * Sets the search radius in meters.
   * @param radius Radius in meters (default 4000).
   */
  public radius(radius: number): this {
    this._radius = radius;
    return this;
  }

  /**
   * Sets the API Key. If not set here, checks NEXT_PUBLIC_GOOGLE_MAPS_API_KEY env var.
   * @param key Google Maps API Key.
   */
  public apiKey(key: string): this {
    this._apiKey = key;
    return this;
  }

  /**
   * Defines what to do when the process finishes.
   * @param format 'csv', 'json', or a callback function.
   */
  public onFinished(format: OutputFormat): this {
    this._onFinished = format;
    return this;
  }

  /**
   * Enables logging of the process.
   */
  public showLogs(): this {
    this._showLogs = true;
    return this;
  }

  /**
   * Enables progress tracking logging.
   */
  public showProgress(): this {
    this._showProgress = true;
    return this;
  }

  /**
   * Executes the query process.
   */
  public async run(): Promise<void> {
    if (!this._apiKey) {
      throw new Error("API Key is required. Set it via .apiKey() or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY env var.");
    }
    if (!this._onFinished) {
      throw new Error("onFinished callback or format is required.");
    }

    if (this._showLogs) console.log("Starting Google Places query...");
    if (this._showLogs) console.log(`Location: ${this._location.latitude}, ${this._location.longitude}`);
    if (this._showLogs) console.log(`Radius: ${this._radius}m, Sub-radius: ${this._subRadius}m`);

    // 1. Generate sub-circles
    const subCircles = generateSubCircles(this._location, this._radius, this._subRadius);
    const totalBatches = subCircles.length;

    if (this._showLogs) console.log(`Generated ${totalBatches} sub-circles for searching.`);

    const allPlacesMap = new Map<string, PlaceResult>();
    let processedBatches = 0;
    
    // 2. Iterate batches
    // We implement a queue/concurrency limit? The user mentioned "20 every 2 seconds". 
    // Since each fetchPlaceFromApi call takes at least ~4s (2s wait between pages, 3 pages max),
    // and we want to respect rate limits.
    // Let's run them sequentially to be safe and simple, or with very low concurrency.
    // Sequential is safest for a "library" that shouldn't blast the API.

    for (const circle of subCircles) {
      if (this._showLogs) console.log(`Querying batch ${processedBatches + 1}/${totalBatches} at ${circle.latitude}, ${circle.longitude}...`);
      
      const places = await fetchPlaceFromApi(
        circle, 
        this._subRadius, 
        this._type, 
        this._apiKey,
        (count) => {
             // Optional: finer progress update
        }
      );

      for (const place of places) {
        if (place.place_id) {
          allPlacesMap.set(place.place_id, place);
        }
      }

      processedBatches++;
      
      if (this._showProgress) {
        const percentage = ((processedBatches / totalBatches) * 100).toFixed(1);
        console.log(`Progress: ${percentage}% (${processedBatches}/${totalBatches} batches)`);
      }

      // Small delay between batches to be polite to the API?
      await new Promise(r => setTimeout(r, 200)); 
    }

    const uniquePlaces = Array.from(allPlacesMap.values());
    if (this._showLogs) console.log(`Finished! Found ${uniquePlaces.length} unique places.`);

    // 3. Handle output
    this.handleOutput(uniquePlaces);
  }

  private handleOutput(places: PlaceResult[]) {
    if (typeof this._onFinished === "function") {
      this._onFinished(places);
    } else if (this._onFinished === "json") {
      const jsonContent = JSON.stringify(places, null, 2);
      writeFileSync("places_output.json", jsonContent);
      if (this._showLogs) console.log("Saved results to places_output.json");
    } else if (this._onFinished === "csv") {
        const headers = ["name", "address", "rating", "user_ratings_total", "place_id", "lat", "lng"];
        const csvContent = [
            headers.join(","),
            ...places.map(p => {
                return [
                    `"${(p.name || "").replace(/"/g, '""')}"`,
                    `"${(p.formatted_address || "").replace(/"/g, '""')}"`,
                    p.rating || "",
                    p.user_ratings_total || "",
                    p.place_id,
                    p.geometry?.location.lat || "",
                    p.geometry?.location.lng || ""
                ].join(",")
            })
        ].join("\n");
        writeFileSync("places_output.csv", csvContent);
        if (this._showLogs) console.log("Saved results to places_output.csv");
    }
  }
}

export function getGooglePlaces(location: Coordinate) {
  return new PlaceQueryBuilder(location);
}
