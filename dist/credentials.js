import { AuthenticationError } from './errors.js';
export const CredentialSource = {
    header: 'header',
    env: 'env',
};
export function resolveApiKey(headerKey, envKey) {
    if (headerKey) {
        return { apiKey: headerKey, source: CredentialSource.header };
    }
    if (envKey) {
        return { apiKey: envKey, source: CredentialSource.env };
    }
    throw new AuthenticationError('API key is required. Set QUANTAROUTE_API_KEY environment variable or provide x-api-key header');
}
//# sourceMappingURL=credentials.js.map