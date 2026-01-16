import { generateSubCircles } from "./geometry";
import { fetchLegacyPlaces, fetchNewPlaces } from "./api";
import { writeFileSync } from "fs";
import { Coordinate, MapsPlaceResult, NearbySearchAttributes, PlaceResult } from "./types";

type OutputFormat = "csv" | "json" | ((places: MapsPlaceResult[]) => void);
type NewOutputFormat = "csv" | "json" | ((places: PlaceResult[]) => void);

/**
 * Legacy Query Builder using the original Maps API (Nearby Search).
 */
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

  public placesType(type: string): this {
    this._type = type;
    return this;
  }

  public radius(radius: number): this {
    this._radius = radius;
    return this;
  }

  public minRate(rate: number): this {
    this._minRate = rate;
    return this;
  }

  public limit(max: number): this {
    this._limitCount = max;
    return this;
  }

  public apiKey(key: string): this {
    this._apiKey = key;
    return this;
  }

  public onFinished(format: OutputFormat): this {
    this._onFinished = format;
    return this;
  }

  public showLogs(): this {
    this._showLogs = true;
    return this;
  }

  public showProgress(): this {
    this._showProgress = true;
    return this;
  }

  public allowClosedStores(): this {
    this._forceQueryClosedStores = true;
    return this;
  }

  public async run(): Promise<void> {
    if (!this._apiKey) {
      throw new Error("API Key is required. Set it via .apiKey() or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY env var.");
    }
    if (!this._onFinished) {
      throw new Error("onFinished callback or format is required.");
    }

    if (this._showLogs) console.log("Starting Google Places (Legacy) query...");

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
    const allPlacesMap = new Map<string, MapsPlaceResult>();
    let processedBatches = 0;
    
    for (const circle of subCircles) {
      if (this._showLogs) console.log(`Querying batch ${processedBatches + 1}/${totalBatches} at ${circle.latitude}, ${circle.longitude}...`);
      
      const places = await fetchLegacyPlaces(
        circle, 
        this._subRadius, 
        this._type, 
        this._apiKey,
        (count) => {},
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

      await new Promise(r => setTimeout(r, 200)); 
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

    this.handleOutput(uniquePlaces);
  }

  private handleOutput(places: MapsPlaceResult[]) {
    if (typeof this._onFinished === "function") {
      this._onFinished(places);
    } else if (this._onFinished === "json") {
      const jsonContent = JSON.stringify(places, null, 2);
      writeFileSync("maps_places_output.json", jsonContent);
      if (this._showLogs) console.log("Saved results to maps_places_output.json");
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
        writeFileSync("maps_places_output.csv", csvContent);
        if (this._showLogs) console.log("Saved results to maps_places_output.csv");
    }
  }
}

/**
 * New Places API Query Builder (v1).
 */
export class NewPlaceQueryBuilder {
  private _location: Coordinate;
  private _radius: number = 4000;
  private _subRadius: number = 500; 
  private _minRate: number = 4.1;
  private _limitCount: number | undefined;
  private _type: string = "restaurant";
  private _fields: NearbySearchAttributes[] = ["name", "displayName", "id", "formattedAddress", "rating", "location"]; // Defaults
  private _onFinished?: NewOutputFormat;
  private _showLogs: boolean = false;
  private _showProgress: boolean = false;
  private _apiKey: string | undefined;
  private _forceQueryClosedStores: boolean = false;

  constructor(location: Coordinate) {
    this._location = location;
    this._apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }

  public placesType(type: string): this {
    this._type = type;
    return this;
  }

  public radius(radius: number): this {
    this._radius = radius;
    return this;
  }

  public minRate(rate: number): this {
    this._minRate = rate;
    return this;
  }

  public limit(max: number): this {
    this._limitCount = max;
    return this;
  }

  public apiKey(key: string): this {
    this._apiKey = key;
    return this;
  }

  /**
   * Specifies fields to return from the New Places API.
   * e.g. ["displayName", "rating", "formattedAddress"]
   */
  public fields(fields: NearbySearchAttributes[]): this {
    this._fields = [...this._fields, ...fields];
    return this;
  }

  public onFinished(format: NewOutputFormat): this {
    this._onFinished = format;
    return this;
  }

  public showLogs(): this {
    this._showLogs = true;
    return this;
  }

  public showProgress(): this {
    this._showProgress = true;
    return this;
  }

  public allowClosedStores(): this {
    this._forceQueryClosedStores = true;
    return this;
  }

  public async run(): Promise<void> {
    if (!this._apiKey) {
      throw new Error("API Key is required.");
    }
    if (!this._onFinished) {
      throw new Error("onFinished callback or format is required.");
    }

    if (this._showLogs) console.log("Starting Google Places (New) query...");

    let subCircles = generateSubCircles(this._location, this._radius, this._subRadius);
    
    // Same optimization logic
    if (this._limitCount) {
      const maxBatches = Math.ceil(this._limitCount / 20); // Note: New API limit is 20 per call
      if (subCircles.length > maxBatches) {
        for (let i = subCircles.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [subCircles[i], subCircles[j]] = [subCircles[j], subCircles[i]];
        }
        subCircles = subCircles.slice(0, maxBatches);
      }
    }

    const totalBatches = subCircles.length;
    const allPlacesMap = new Map<string, PlaceResult>();
    let processedBatches = 0;
    
    for (const circle of subCircles) {
      if (this._showLogs) console.log(`Querying batch ${processedBatches + 1}/${totalBatches}...`);
      
      const places = await fetchNewPlaces(
        circle, 
        this._subRadius, 
        this._type, 
        this._apiKey,
        this._fields,
        (count) => {},
        this._forceQueryClosedStores
      );

      for (const place of places) {
        if (place.id) {
          allPlacesMap.set(place.id, place);
        }
      }

      processedBatches++;
      
      if (this._showProgress) {
        const percentage = ((processedBatches / totalBatches) * 100).toFixed(1);
        console.log(`Progress: ${percentage}%`);
      }

      await new Promise(r => setTimeout(r, 200)); 
      if(processedBatches % 20 === 0) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    let uniquePlaces = Array.from(allPlacesMap.values());
    uniquePlaces = uniquePlaces.filter(p => (p.rating || 0) >= this._minRate);

    if (this._limitCount && uniquePlaces.length > this._limitCount) {
      uniquePlaces = uniquePlaces.slice(0, this._limitCount);
    }
    if (this._showLogs) console.log(`Finished! Found ${uniquePlaces.length} unique places.`);

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
        const headers = ["id", "rating", "formattedAddress", "displayName"];
        const csvContent = [
            headers.join(","),
            ...places.map(p => {
                return [
                  p.id,
                  p.rating || "",
                  `"${(p.formattedAddress || "").replace(/"/g, '""')}"`,
                  `"${(p.displayName?.text || p.name || "").replace(/"/g, '""')}"`
                ].join(",")
            })
        ].join("\n");
        writeFileSync("places_output.csv", csvContent);
        if (this._showLogs) console.log("Saved results to places_output.csv");
    }
  }
}

export function getLegacyGooglePlaces(location: Coordinate) {
  return new PlaceQueryBuilder(location);
}

export function getGooglePlaces(location: Coordinate) {
  return new NewPlaceQueryBuilder(location);
}
