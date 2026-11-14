import axios, { AxiosInstance } from 'axios';
import { ApiError, ApiErrorCode, errorFromHttpResponse } from './errors.js';
import { FEATURES, isFeatureAvailable } from './features.js';
import { parseBatchLocations, parseOptionalBias } from './locations.js';

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class QuantaRouteClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;

  constructor(
    apiKey?: string,
    baseUrl: string = 'https://api.quantaroute.com',
    maxRetries: number = 3
  ) {
    this.apiKey = apiKey || process.env.QUANTAROUTE_API_KEY || '';
    this.baseUrl = baseUrl;
    this.maxRetries = maxRetries;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '@quantaroute/mcp-server/1.1.0',
      },
    });

    if (this.apiKey) {
      this.client.interceptors.request.use((config) => {
        config.headers['x-api-key'] = this.apiKey;
        return config;
      });
    }
  }

  private async makeRequest(method: 'GET' | 'POST', endpoint: string, data?: any, params?: any) {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.request({
          method,
          url: endpoint,
          data,
          params,
        });
        return response.data;
      } catch (error: any) {
        if (error.response) {
          const status = error.response.status;
          const payload = error.response.data;
          const message = payload?.message || error.message;
          const upstreamCode = payload?.code;
          const retryAfterHeader = Number(error.response.headers?.['retry-after']);
          const retryAfter = Number.isFinite(retryAfterHeader) ? retryAfterHeader : undefined;

          if (status === 429 && attempt < this.maxRetries) {
            const waitMs = (retryAfter ?? 1) * 1000;
            if (waitMs <= 2000) {
              await sleep(waitMs);
              continue;
            }
          }

          throw errorFromHttpResponse(status, message, { upstreamCode, retryAfter });
        }

        if (attempt < this.maxRetries) {
          await sleep(200 * 2 ** attempt);
          continue;
        }
        throw new ApiError(ApiErrorCode.NETWORK, error.message || 'Request failed');
      }
    }

    throw new ApiError(ApiErrorCode.NETWORK, 'Max retries exceeded');
  }

  async geocode(params: GeocodeParams) {
    const bias = parseOptionalBias(params.latitude, params.longitude);
    const data: any = {
      address: params.address,
      country: params.country || 'India',
    };
    if (params.city) data.city = params.city;
    if (params.state) data.state = params.state;
    if (params.pincode) data.pincode = params.pincode;
    if (bias) {
      data.latitude = bias.latitude;
      data.longitude = bias.longitude;
    }

    const response = await this.makeRequest('POST', '/v1/digipin/geocode', data);
    return response.data || response;
  }

  async reverseGeocode(digipin: string) {
    const response = await this.makeRequest('POST', '/v1/digipin/reverse', { digipin });
    return response.data || response;
  }

  async coordinatesToDigiPin(latitude: number, longitude: number) {
    const response = await this.makeRequest('POST', '/v1/digipin/coordinates-to-digipin', {
      latitude,
      longitude,
    });
    return response.data || response;
  }

  async validateDigiPin(digipin: string) {
    const response = await this.makeRequest('GET', `/v1/digipin/validate/${digipin}`);
    return response.data || response;
  }

  async batchGeocode(addresses: BatchGeocodeParams['addresses']) {
    const response = await this.makeRequest('POST', '/v1/digipin/batch', { addresses });
    return response.data || response;
  }

  async autocomplete(query: string, limit: number = 5, latitude?: unknown, longitude?: unknown) {
    const bias = parseOptionalBias(latitude, longitude);
    const params: Record<string, string | number> = {
      q: query,
      limit: Math.min(limit, 10),
    };
    if (bias) {
      params.lat = bias.latitude;
      params.lng = bias.longitude;
    }
    const response = await this.makeRequest('GET', '/v1/digipin/autocomplete', undefined, params);
    return response.data || response;
  }

  async lookupLocationFromCoordinates(latitude: number, longitude: number) {
    const response = await this.makeRequest('POST', '/v1/location/lookup', {
      latitude,
      longitude,
    });
    return response.data || response;
  }

  async lookupLocationFromDigiPin(digipin: string) {
    const response = await this.makeRequest('POST', '/v1/location/lookup', { digipin });
    return response.data || response;
  }

  async batchLocationLookup(locations: unknown) {
    const parsed = parseBatchLocations(locations);
    const response = await this.makeRequest('POST', '/v1/location/batch-lookup', { locations: parsed });
    return response.data || response;
  }

  async findNearbyBoundaries(latitude: number, longitude: number, radius_km: number = 5.0, limit: number = 10) {
    if (!isFeatureAvailable('nearbyBoundaries')) {
      const feature = FEATURES.nearbyBoundaries;
      throw new ApiError(ApiErrorCode.NOT_IMPLEMENTED, feature.message, {
        details: {
          feature: feature.id,
          status: feature.status,
          backendEndpoint: feature.backendEndpoint,
        },
      });
    }

    const response = await this.makeRequest('GET', '/v1/location/nearby', undefined, {
      lat: latitude,
      lng: longitude,
      radius: radius_km,
      limit: Math.min(limit, 50),
    });
    return response.data || response;
  }

  async getUsage() {
    const response = await this.makeRequest('GET', '/v1/digipin/usage');
    return response.data || response;
  }

  async getLocationStatistics() {
    const response = await this.makeRequest('GET', '/v1/location/stats');
    return response.data || response;
  }

  async getHealth() {
    const response = await this.makeRequest('GET', '/health');
    return response.data || response;
  }
}
