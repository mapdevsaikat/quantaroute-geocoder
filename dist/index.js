#!/usr/bin/env node
/**
 * QuantaRoute Geocoder MCP Server
 *
 * Provides MCP tools for geocoding addresses, location lookups, and DigiPin processing
 * using the QuantaRoute Geocoding API.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { ApiError, QuantaRouteClient, ValidationError } from './client.js';
// Initialize MCP server
const server = new Server({
    name: '@quantaroute/mcp-server',
    version: '1.2.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize client
const client = new QuantaRouteClient();
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'geocode',
                description: 'Geocode an address to DigiPin and coordinates. Pass latitude+longitude together to bias local results and enable category nearby queries such as "hospital near me". Without a point, those queries return NEARBY_LOCATION_REQUIRED.',
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
                        latitude: {
                            type: 'number',
                            description: 'User or map-centre latitude. Must be sent with longitude. Enables location bias and category nearby.',
                        },
                        longitude: {
                            type: 'number',
                            description: 'User or map-centre longitude. Must be sent with latitude.',
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
                description: 'Address autocomplete (minimum 3 characters). Pass latitude+longitude to bias results and support "near me" / "nearby" category queries (hospital, school, park).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query (minimum 3 characters). Supports near-me keywords when latitude and longitude are set.',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of suggestions (default: 5, max: 10)',
                            default: 5,
                        },
                        latitude: {
                            type: 'number',
                            description: 'User latitude. Must be sent with longitude.',
                        },
                        longitude: {
                            type: 'number',
                            description: 'User longitude. Must be sent with latitude.',
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
                description: 'Postal-boundary nearby search is not on Location Lookup. For category nearby (hospital near me, schools nearby, parks near me) use geocode or autocomplete with latitude and longitude.',
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
                const params = args;
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
                const params = args;
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
                const params = args;
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
                const params = args;
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
                const params = args;
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
                const params = args;
                if (!params.query || typeof params.query !== 'string' || params.query.length < 3) {
                    throw new McpError(ErrorCode.InvalidParams, 'Query must be at least 3 characters long');
                }
                const result = await client.autocomplete(params.query, params.limit, params.latitude, params.longitude);
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
                const params = args;
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
                const params = args;
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
                const params = args;
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
                const params = args;
                if (typeof params.latitude !== 'number' || typeof params.longitude !== 'number') {
                    throw new McpError(ErrorCode.InvalidParams, 'Latitude and longitude must be numbers');
                }
                const result = await client.findNearbyBoundaries(params.latitude, params.longitude, params.radius_km, params.limit);
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
    }
    catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        if (error instanceof ValidationError) {
            throw new McpError(ErrorCode.InvalidParams, error.message);
        }
        if (error instanceof ApiError) {
            throw new McpError(ErrorCode.InternalError, error.message);
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('QuantaRoute MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map