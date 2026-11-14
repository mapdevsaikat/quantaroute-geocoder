export declare const FeatureStatus: {
    readonly available: "available";
    readonly unavailable: "unavailable";
};
export type FeatureStatus = (typeof FeatureStatus)[keyof typeof FeatureStatus];
type Feature = {
    id: string;
    status: FeatureStatus;
    backendEndpoint: string;
    message: string;
};
export declare const FEATURES: Record<string, Feature> & {
    nearbyBoundaries: Feature;
};
export type FeatureName = 'nearbyBoundaries';
export declare function isFeatureAvailable(name: FeatureName): boolean;
export {};
//# sourceMappingURL=features.d.ts.map