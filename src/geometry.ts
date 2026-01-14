/**
 * Represents a geographic coordinate.
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Generates a list of coordinates for sub-circles that cover a larger circle.
 * Uses a hexagonal packing strategy to ensure coverage.
 * 
 * @param center The center of the main search area.
 * @param radius The radius of the main search area in meters.
 * @param subRadius The radius of each sub-circle in meters (default 500m).
 * @returns Array of coordinates for the centers of the sub-circles.
 */
export function generateSubCircles(
  center: Coordinate,
  radius: number,
  subRadius: number = 500
): Coordinate[] {
  // If the main radius is smaller than the subRadius, just return the center.
  if (radius <= subRadius) {
    return [center];
  }

  const coordinates: Coordinate[] = [];
  
  // Earth's radius in meters
  const R = 6371000;
  
  // Convert latitude to radians to calculate longitude offsets correctly
  const latRad = (center.latitude * Math.PI) / 180;
  
  // Distance between centers of hexagonally packed circles to ensure coverage.
  // Ideally, for r=subRadius, the distance should be approx r * sqrt(3) for tight packing without gaps,
  // but to be safe and ensure overlap (so we don't miss spots), we can use a slightly tighter spacing.
  // Using subRadius * 1.5 is a reasonable approximation for coverage with overlap.
  const step = subRadius * 1.5; 

  // Simple grid or spiral generation could work, but let's do a bounding box scan
  // We scan a square area around the center and keep points within the radius.
  
  // Degrees per meter (approximate)
  const latDegPerMeter = 1 / 111320; 
  const lonDegPerMeter = 1 / (111320 * Math.cos(latRad));

  const latStep = step * latDegPerMeter;
  const lonStep = step * lonDegPerMeter;

  // Calculate bounds
  const numSteps = Math.ceil(radius / step);
  
  for (let i = -numSteps; i <= numSteps; i++) {
    for (let j = -numSteps; j <= numSteps; j++) {
      // Offset based on hexagonal-like grid (shift every other row)
      const xOffset = j * lonStep + (i % 2 === 0 ? 0 : lonStep / 2);
      const yOffset = i * latStep * (Math.sqrt(3) / 2); // Hexagonal height factor

      // Calculate distance from center in meters (approx)
      const distX = xOffset / lonDegPerMeter;
      const distY = yOffset / latDegPerMeter;
      const distance = Math.sqrt(distX * distX + distY * distY);

      // We include the circle if its center is within (ParentRadius + epsilon) 
      // or if it covers any part of the parent circle. 
      // Being generous: if distance - subRadius < radius
      if (distance - subRadius < radius) {
        coordinates.push({
          latitude: center.latitude + yOffset,
          longitude: center.longitude + xOffset
        });
      }
    }
  }

  return coordinates;
}
