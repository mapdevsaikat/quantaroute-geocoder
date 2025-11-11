#!/usr/bin/env node

/**
 * QuantaRoute Geocoder MCP Server
 * 
 * Provides MCP tools for geocoding addresses, location lookups, and DigiPin processing
 * using the QuantaRoute Geocoding API.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

interface GeocodeParams {
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

interface CoordinatesParams {
  latitude: number;
  longitude: number;
}

interface DigiPinParams {
  digipin: string;
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

interface LocationLookupParams {
  latitude: number;
  longitude: number;
}

interface NearbyBoundariesParams {
  latitude: number;
  longitude: number;
  radius_km?: number;
  limit?: number;
}

class QuantaRouteClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl: string = 'https://api.quantaroute.com') {
    this.apiKey = apiKey || process.env.QUANTAROUTE_API_KEY || '';
    this.baseUrl = baseUrl;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'User-Agent': 'quantaroute-geocoder-mcp/1.0.0',
      },
    });
  }

  private async makeRequest(method: 'GET' | 'POST', endpoint: string, data?: any, params?: any) {
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
        const message = error.response.data?.message || error.message;
        
        if (status === 401) {
          throw new McpError(ErrorCode.InvalidRequest, `Authentication failed: ${message}`);
        }
        if (status === 429) {
          throw new McpError(ErrorCode.InternalError, `Rate limit exceeded: ${message}`);
        }
        throw new McpError(ErrorCode.InternalError, `API error (${status}): ${message}`);
      }
      throw new McpError(ErrorCode.InternalError, `Request failed: ${error.message}`);
    }
  }

  async geocode(params: GeocodeParams) {
    const data: any = {
      address: params.address,
      country: params.country || 'India',
    };
    if (params.city) data.city = params.city;
    if (params.state) data.state = params.state;
    if (params.pincode) data.pincode = params.pincode;

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

  async autocomplete(query: string, limit: number = 5) {
    const response = await this.makeRequest('GET', '/v1/digipin/autocomplete', undefined, {
      q: query,
      limit: Math.min(limit, 10),
    });
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

  async batchLocationLookup(locations: BatchLocationParams['locations']) {
    const response = await this.makeRequest('POST', '/v1/location/batch-lookup', { locations });
    return response.data || response;
  }

  async findNearbyBoundaries(latitude: number, longitude: number, radius_km: number = 5.0, limit: number = 10) {
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

// Initialize MCP server
const server = new Server(
  {
    name: 'quantaroute-geocoder',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize client
const client = new QuantaRouteClient();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'geocode',
        description: 'Geocode an address to get DigiPin code and coordinates. Returns location information including latitude, longitude, and DigiPin.',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'The address to geocode (required)',
            },
            city: {
              type: 'string',
              description: 'City name (optional)',
            },
            state: {
              type: 'string',
              description: 'State name (optional)',
            },
            pincode: {
              type: 'string',
              description: 'Postal code (optional)',
            },
            country: {
              type: 'string',
              description: 'Country name (optional, defaults to India)',
            },
          },
          required: ['address'],
        },
      },
      {
        name: 'reverse_geocode',
        description: 'Reverse geocode a DigiPin code to get coordinates and address information.',
        inputSchema: {
          type: 'object',
          properties: {
            digipin: {
              type: 'string',
              description: 'The DigiPin code to reverse geocode (format: XXX-XXX-XXXX)',
            },
          },
          required: ['digipin'],
        },
      },
      {
        name: 'coordinates_to_digipin',
        description: 'Convert latitude and longitude coordinates to a DigiPin code.',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude coordinate (-90 to 90)',
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate (-180 to 180)',
            },
          },
          required: ['latitude', 'longitude'],
        },
      },
      {
        name: 'validate_digipin',
        description: 'Validate a DigiPin format and check if it corresponds to a real location.',
        inputSchema: {
          type: 'object',
          properties: {
            digipin: {
              type: 'string',
              description: 'The DigiPin code to validate',
            },
          },
          required: ['digipin'],
        },
      },
      {
        name: 'batch_geocode',
        description: 'Geocode multiple addresses in a single batch request (up to 100 addresses).',
        inputSchema: {
          type: 'object',
          properties: {
            addresses: {
              type: 'array',
              description: 'Array of address objects to geocode',
              items: {
                type: 'object',
                properties: {
                  address: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  pincode: { type: 'string' },
                  country: { type: 'string' },
                },
                required: ['address'],
              },
              maxItems: 100,
            },
          },
          required: ['addresses'],
        },
      },
      {
        name: 'autocomplete',
        description: 'Get autocomplete suggestions for addresses (minimum 3 characters).',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (minimum 3 characters)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of suggestions (default: 5, max: 10)',
              default: 5,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'lookup_location_from_coordinates',
        description: '🚀 REVOLUTIONARY: Get administrative boundaries (pincode, state, division, locality) from coordinates. Provides precision that even government services don\'t offer.',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude coordinate (-90 to 90)',
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate (-180 to 180)',
            },
          },
          required: ['latitude', 'longitude'],
        },
      },
      {
        name: 'lookup_location_from_digipin',
        description: '🚀 REVOLUTIONARY: Get administrative boundaries from a DigiPin code.',
        inputSchema: {
          type: 'object',
          properties: {
            digipin: {
              type: 'string',
              description: 'DigiPin code (format: XXX-XXX-XXXX)',
            },
          },
          required: ['digipin'],
        },
      },
      {
        name: 'batch_location_lookup',
        description: '🚀 REVOLUTIONARY: Batch lookup for multiple locations. Each location can be specified by coordinates or DigiPin (up to 100 locations).',
        inputSchema: {
          type: 'object',
          properties: {
            locations: {
              type: 'array',
              description: 'Array of location objects (each with latitude+longitude OR digipin)',
              items: {
                type: 'object',
                oneOf: [
                  {
                    properties: {
                      latitude: { type: 'number' },
                      longitude: { type: 'number' },
                    },
                    required: ['latitude', 'longitude'],
                  },
                  {
                    properties: {
                      digipin: { type: 'string' },
                    },
                    required: ['digipin'],
                  },
                ],
              },
              maxItems: 100,
            },
          },
          required: ['locations'],
        },
      },
      {
        name: 'find_nearby_boundaries',
        description: 'Find nearby postal boundaries within a specified radius (experimental feature).',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Center latitude',
            },
            longitude: {
              type: 'number',
              description: 'Center longitude',
            },
            radius_km: {
              type: 'number',
              description: 'Search radius in kilometers (default: 5.0, max: 100)',
              default: 5.0,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10, max: 50)',
              default: 10,
            },
          },
          required: ['latitude', 'longitude'],
        },
      },
      {
        name: 'get_usage',
        description: 'Get API usage statistics and quota information.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_location_statistics',
        description: 'Get live statistics about the Location Lookup service (total boundaries, states, divisions, etc.).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_health',
        description: 'Check API health status and availability.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args || typeof args !== 'object') {
    throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments');
  }

  try {
    switch (name) {
      case 'geocode': {
        const params = args as unknown as GeocodeParams;
        if (!params.address || typeof params.address !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Address is required');
        }
        const result = await client.geocode(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'reverse_geocode': {
        const params = args as unknown as DigiPinParams;
        if (!params.digipin || typeof params.digipin !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'DigiPin is required');
        }
        const result = await client.reverseGeocode(params.digipin);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'coordinates_to_digipin': {
        const params = args as unknown as CoordinatesParams;
        if (typeof params.latitude !== 'number' || typeof params.longitude !== 'number') {
          throw new McpError(ErrorCode.InvalidParams, 'Latitude and longitude must be numbers');
        }
        if (params.latitude < -90 || params.latitude > 90) {
          throw new McpError(ErrorCode.InvalidParams, 'Latitude must be between -90 and 90');
        }
        if (params.longitude < -180 || params.longitude > 180) {
          throw new McpError(ErrorCode.InvalidParams, 'Longitude must be between -180 and 180');
        }
        const result = await client.coordinatesToDigiPin(params.latitude, params.longitude);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'validate_digipin': {
        const params = args as unknown as DigiPinParams;
        if (!params.digipin || typeof params.digipin !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'DigiPin is required');
        }
        const result = await client.validateDigiPin(params.digipin);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'batch_geocode': {
        const params = args as unknown as BatchGeocodeParams;
        if (!params.addresses || !Array.isArray(params.addresses) || params.addresses.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, 'Addresses must be a non-empty array');
        }
        if (params.addresses.length > 100) {
          throw new McpError(ErrorCode.InvalidParams, 'Maximum 100 addresses allowed per batch');
        }
        const result = await client.batchGeocode(params.addresses);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'autocomplete': {
        const params = args as unknown as { query: string; limit?: number };
        if (!params.query || typeof params.query !== 'string' || params.query.length < 3) {
          throw new McpError(ErrorCode.InvalidParams, 'Query must be at least 3 characters long');
        }
        const result = await client.autocomplete(params.query, params.limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'lookup_location_from_coordinates': {
        const params = args as unknown as LocationLookupParams;
        if (typeof params.latitude !== 'number' || typeof params.longitude !== 'number') {
          throw new McpError(ErrorCode.InvalidParams, 'Latitude and longitude must be numbers');
        }
        if (params.latitude < -90 || params.latitude > 90) {
          throw new McpError(ErrorCode.InvalidParams, 'Latitude must be between -90 and 90');
        }
        if (params.longitude < -180 || params.longitude > 180) {
          throw new McpError(ErrorCode.InvalidParams, 'Longitude must be between -180 and 180');
        }
        const result = await client.lookupLocationFromCoordinates(params.latitude, params.longitude);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'lookup_location_from_digipin': {
        const params = args as unknown as DigiPinParams;
        if (!params.digipin || typeof params.digipin !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'DigiPin is required');
        }
        const result = await client.lookupLocationFromDigiPin(params.digipin);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'batch_location_lookup': {
        const params = args as unknown as BatchLocationParams;
        if (!params.locations || !Array.isArray(params.locations) || params.locations.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, 'Locations must be a non-empty array');
        }
        if (params.locations.length > 100) {
          throw new McpError(ErrorCode.InvalidParams, 'Maximum 100 locations allowed per batch');
        }
        const result = await client.batchLocationLookup(params.locations);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'find_nearby_boundaries': {
        const params = args as unknown as NearbyBoundariesParams;
        if (typeof params.latitude !== 'number' || typeof params.longitude !== 'number') {
          throw new McpError(ErrorCode.InvalidParams, 'Latitude and longitude must be numbers');
        }
        const result = await client.findNearbyBoundaries(
          params.latitude,
          params.longitude,
          params.radius_km,
          params.limit
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_usage': {
        const result = await client.getUsage();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_location_statistics': {
        const result = await client.getLocationStatistics();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_health': {
        const result = await client.getHealth();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('QuantaRoute Geocoder MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

