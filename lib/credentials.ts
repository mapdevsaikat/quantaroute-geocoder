import { AuthenticationError } from './errors.js';

export const CredentialSource = {
  header: 'header',
  env: 'env',
} as const;

export type CredentialSource = (typeof CredentialSource)[keyof typeof CredentialSource];

export type ResolvedCredential = {
  apiKey: string;
  source: CredentialSource;
};

export function resolveApiKey(headerKey?: string, envKey?: string): ResolvedCredential {
  if (headerKey) {
    return { apiKey: headerKey, source: CredentialSource.header };
  }
  if (envKey) {
    return { apiKey: envKey, source: CredentialSource.env };
  }
  throw new AuthenticationError(
    'API key is required. Set QUANTAROUTE_API_KEY environment variable or provide x-api-key header'
  );
}
