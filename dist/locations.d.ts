export type CoordinateLocation = {
    latitude: number;
    longitude: number;
};
export type DigiPinLocation = {
    digipin: string;
};
export type BatchLocation = CoordinateLocation | DigiPinLocation;
export declare function isCoordinateLocation(location: BatchLocation): location is CoordinateLocation;
export declare function assertCoordinateRange(latitude: number, longitude: number, prefix?: string): void;
export declare function parseOptionalBias(latitude: unknown, longitude: unknown): CoordinateLocation | undefined;
export declare function parseBatchLocation(item: unknown, index?: number): BatchLocation;
export declare function parseBatchLocations(locations: unknown): BatchLocation[];
//# sourceMappingURL=locations.d.ts.map