export const FeatureStatus = {
    available: 'available',
    unavailable: 'unavailable',
};
export const FEATURES = {
    nearbyBoundaries: {
        id: 'find-nearby-boundaries',
        status: FeatureStatus.unavailable,
        backendEndpoint: '/v1/location/nearby',
        message: 'Postal-boundary nearby search is not on Location Lookup. Category nearby (hospital near me, schools nearby) is live on geocode and autocomplete when you pass latitude and longitude.',
    },
};
export function isFeatureAvailable(name) {
    return FEATURES[name].status === FeatureStatus.available;
}
//# sourceMappingURL=features.js.map