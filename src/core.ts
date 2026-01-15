import { generateSubCircles } from "./geometry";
import { fetchPlaceFromApi } from "./api";
import { writeFileSync } from "fs";
import { Coordinate, PlaceResult } from "./types";

type OutputFormat = "csv" | "json" | ((places: PlaceResult[]) => void);

export class PlaceQueryBuilder {
  private _location: Coordinate;
  private _radius: number = 4000; // Default 4km
  private _subRadius: number = 500; // Default 500m
  private _minRate: number = 4.1;
  private _limitCount: number | undefined;
  private _type: string = "restaurant";
  private _onFinished?: OutputFormat;
  private _showLogs: boolean = false;
  private _showProgress: boolean = false;
  private _apiKey: string | undefined;
  private _forceQueryClosedStores: boolean = false;

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
   * Sets the minimum rating to filter results (default 4.1).
   * @param rate Minimum rating.
   */
  public minRate(rate: number): this {
    this._minRate = rate;
    return this;
  }

  /**
   * Limits the number of results and optimizes the query by reducing the number of sub-circles searched.
   * Optimization assumption: ~60 results per sub-circle.
   * @param max Max number of places to return.
   */
  public limit(max: number): this {
    this._limitCount = max;
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
   * By default, this library filters out the TEMPORARILY_CLOSED stores.
   * Use this method to allow them to be included in the results.
   */
  public allowClosedStores(): this {
    this._forceQueryClosedStores = true;
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
    let subCircles = generateSubCircles(this._location, this._radius, this._subRadius);
    
    // Optimization: If limit is set, reduce the number of batches
    if (this._limitCount) {
      const maxBatches = Math.ceil(this._limitCount / 60);
      if (subCircles.length > maxBatches) {
        // Shuffle array to get random circles
        for (let i = subCircles.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [subCircles[i], subCircles[j]] = [subCircles[j], subCircles[i]];
        }
        // Slice to the max needed matches
        subCircles = subCircles.slice(0, maxBatches);
        if (this._showLogs) console.log(`Optimization: Limiting to ${maxBatches} batches based on limit of ${this._limitCount}`);
      }
    }

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
        },
        this._forceQueryClosedStores
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
      // Wait 2 seconds every 20 batches
      if(processedBatches % 20 === 0) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    let uniquePlaces = Array.from(allPlacesMap.values());
    
    // Filter by minRate
    uniquePlaces = uniquePlaces.filter(p => (p.rating || 0) >= this._minRate);

    // Apply limit
    if (this._limitCount && uniquePlaces.length > this._limitCount) {
      uniquePlaces = uniquePlaces.slice(0, this._limitCount);
    }
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
                    p.geometry?.location?.lat || "",
                    p.geometry?.location?.lng || ""
                ].join(",")
            })
        ].join("\n");
        writeFileSync("places_output.csv", csvContent);
        if (this._showLogs) console.log("Saved results to places_output.csv");
    }
  }
}

/**
 * 
 * @param location {latitude: number, longitude: number}
 * @returns PlaceQueryBuilder
 * 
 * @version 1.0.0
 */
export function getGooglePlaces(location: Coordinate) {
  return new PlaceQueryBuilder(location);
}
