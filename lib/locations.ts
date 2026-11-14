import { ValidationError } from './errors.js';

export type CoordinateLocation = {
  latitude: number;
  longitude: number;
};

export type DigiPinLocation = {
  digipin: string;
};

export type BatchLocation = CoordinateLocation | DigiPinLocation;

export function isCoordinateLocation(location: BatchLocation): location is CoordinateLocation {
  return 'latitude' in location && 'longitude' in location;
}

export function assertCoordinateRange(latitude: number, longitude: number, prefix = 'Coordinates'): void {
  if (latitude < -90 || latitude > 90) {
    throw new ValidationError(`${prefix} latitude must be between -90 and 90`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new ValidationError(`${prefix} longitude must be between -180 and 180`);
  }
}

export function parseOptionalBias(
  latitude: unknown,
  longitude: unknown
): CoordinateLocation | undefined {
  const hasLat = latitude !== undefined && latitude !== null && latitude !== '';
  const hasLng = longitude !== undefined && longitude !== null && longitude !== '';

  if (!hasLat && !hasLng) {
    return undefined;
  }
  if (hasLat !== hasLng) {
    throw new ValidationError('latitude and longitude must be provided together');
  }

  const lat = typeof latitude === 'number' ? latitude : Number(latitude);
  const lng = typeof longitude === 'number' ? longitude : Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ValidationError('latitude and longitude must be numbers');
  }
  assertCoordinateRange(lat, lng);
  return { latitude: lat, longitude: lng };
}

export function parseBatchLocation(item: unknown, index?: number): BatchLocation {
  const prefix = index === undefined ? 'Each location' : `Location ${index}`;

  if (!item || typeof item !== 'object') {
    throw new ValidationError(`${prefix} must be an object`);
  }

  const record = item as Record<string, unknown>;
  const hasLatitude = typeof record.latitude === 'number';
  const hasLongitude = typeof record.longitude === 'number';
  const hasCoords = hasLatitude && hasLongitude;
  const hasDigipin = typeof record.digipin === 'string' && record.digipin.length > 0;

  if (hasCoords && hasDigipin) {
    throw new ValidationError(
      `${prefix} must use either latitude+longitude or digipin, not both`
    );
  }

  if (hasCoords) {
    assertCoordinateRange(record.latitude as number, record.longitude as number, prefix);
    return {
      latitude: record.latitude as number,
      longitude: record.longitude as number,
    };
  }

  if (hasDigipin) {
    return { digipin: record.digipin as string };
  }

  throw new ValidationError(`${prefix} must include latitude+longitude or digipin`);
}

export function parseBatchLocations(locations: unknown): BatchLocation[] {
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new ValidationError('Locations must be a non-empty array');
  }
  if (locations.length > 100) {
    throw new ValidationError('Maximum 100 locations allowed per batch');
  }
  return locations.map((location, index) => parseBatchLocation(location, index));
}
