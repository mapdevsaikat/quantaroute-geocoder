export const FeatureStatus = {
  available: 'available',
  unavailable: 'unavailable',
} as const;

export type FeatureStatus = (typeof FeatureStatus)[keyof typeof FeatureStatus];

type Feature = {
  id: string;
  status: FeatureStatus;
  backendEndpoint: string;
  message: string;
};

export const FEATURES: Record<string, Feature> & {
  nearbyBoundaries: Feature;
} = {
  nearbyBoundaries: {
    id: 'find-nearby-boundaries',
    status: FeatureStatus.unavailable,
    backendEndpoint: '/v1/location/nearby',
    message:
      'Postal-boundary nearby search is not on Location Lookup. Category nearby (hospital near me, schools nearby) is live on geocode and autocomplete when you pass latitude and longitude.',
  },
};

export type FeatureName = 'nearbyBoundaries';

export function isFeatureAvailable(name: FeatureName): boolean {
  return FEATURES[name].status === FeatureStatus.available;
}
