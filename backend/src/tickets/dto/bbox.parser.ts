export interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export function parseBoundingBox(value: string): BoundingBox {
  const parts = value.split(',');
  if (parts.length !== 4) {
    throw new Error('bbox must contain exactly four values in minLng,minLat,maxLng,maxLat order');
  }

  const coordinates = parts.map((part) => {
    const trimmed = part.trim();
    if (!trimmed) return Number.NaN;
    return Number(trimmed);
  });
  if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    throw new Error('bbox coordinates must be finite numbers');
  }

  const [minLng, minLat, maxLng, maxLat] = coordinates;
  if (minLng < -180 || minLng > 180 || maxLng < -180 || maxLng > 180) {
    throw new Error('bbox longitude values must be between -180 and 180');
  }
  if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
    throw new Error('bbox latitude values must be between -90 and 90');
  }
  if (minLng >= maxLng) {
    throw new Error('bbox minimum longitude must be less than maximum longitude');
  }
  if (minLat >= maxLat) {
    throw new Error('bbox minimum latitude must be less than maximum latitude');
  }

  return { minLng, minLat, maxLng, maxLat };
}
