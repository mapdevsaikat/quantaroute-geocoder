interface GeocodeParams {
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
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
interface BatchLocationParams {
    locations: Array<{
        latitude?: number;
        longitude?: number;
        digipin?: string;
    }>;
}
export declare class QuantaRouteClient {
    private client;
    private apiKey;
    private baseUrl;
    constructor(apiKey?: string, baseUrl?: string);
    private makeRequest;
    geocode(params: GeocodeParams): Promise<any>;
    reverseGeocode(digipin: string): Promise<any>;
    coordinatesToDigiPin(latitude: number, longitude: number): Promise<any>;
    validateDigiPin(digipin: string): Promise<any>;
    batchGeocode(addresses: BatchGeocodeParams['addresses']): Promise<any>;
    autocomplete(query: string, limit?: number): Promise<any>;
    lookupLocationFromCoordinates(latitude: number, longitude: number): Promise<any>;
    lookupLocationFromDigiPin(digipin: string): Promise<any>;
    batchLocationLookup(locations: BatchLocationParams['locations']): Promise<any>;
    findNearbyBoundaries(latitude: number, longitude: number, radius_km?: number, limit?: number): Promise<any>;
    getUsage(): Promise<any>;
    getLocationStatistics(): Promise<any>;
    getHealth(): Promise<any>;
}
export {};
//# sourceMappingURL=client.d.ts.map