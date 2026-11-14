interface GeocodeParams {
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}
interface BatchGeocodeParams {
    addresses: Array<{
        address: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
    }>;
}
export { ApiError, ApiErrorCode, AuthenticationError, RateLimitError, ValidationError } from './errors.js';
export { FEATURES, isFeatureAvailable } from './features.js';
export { parseBatchLocations, parseOptionalBias, type BatchLocation } from './locations.js';
export { resolveApiKey } from './credentials.js';
export declare class QuantaRouteClient {
    private client;
    private apiKey;
    private baseUrl;
    private maxRetries;
    constructor(apiKey?: string, baseUrl?: string, maxRetries?: number);
    private makeRequest;
    geocode(params: GeocodeParams): Promise<any>;
    reverseGeocode(digipin: string): Promise<any>;
    coordinatesToDigiPin(latitude: number, longitude: number): Promise<any>;
    validateDigiPin(digipin: string): Promise<any>;
    batchGeocode(addresses: BatchGeocodeParams['addresses']): Promise<any>;
    autocomplete(query: string, limit?: number, latitude?: unknown, longitude?: unknown): Promise<any>;
    lookupLocationFromCoordinates(latitude: number, longitude: number): Promise<any>;
    lookupLocationFromDigiPin(digipin: string): Promise<any>;
    batchLocationLookup(locations: unknown): Promise<any>;
    findNearbyBoundaries(latitude: number, longitude: number, radius_km?: number, limit?: number): Promise<any>;
    getUsage(): Promise<any>;
    getLocationStatistics(): Promise<any>;
    getHealth(): Promise<any>;
}
//# sourceMappingURL=client.d.ts.map