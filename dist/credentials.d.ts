export declare const CredentialSource: {
    readonly header: "header";
    readonly env: "env";
};
export type CredentialSource = (typeof CredentialSource)[keyof typeof CredentialSource];
export type ResolvedCredential = {
    apiKey: string;
    source: CredentialSource;
};
export declare function resolveApiKey(headerKey?: string, envKey?: string): ResolvedCredential;
//# sourceMappingURL=credentials.d.ts.map