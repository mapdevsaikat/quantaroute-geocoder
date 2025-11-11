import type { VercelRequest, VercelResponse } from '@vercel/node';
import { QuantaRouteClient } from '../src/client.js';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Content-Type': 'application/json',
};

// Helper to send JSON response
function sendJson(res: VercelResponse, status: number, data: any) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.status(status).json(data);
}

// Helper to handle errors
function handleError(res: VercelResponse, error: any, status: number = 500) {
  console.error('API Error:', error);
  
  // Determine status code from error message
  if (error.message?.includes('Authentication failed')) {
    status = 401;
  } else if (error.message?.includes('Rate limit exceeded')) {
    status = 429;
  } else if (error.message?.includes('required') || error.message?.includes('must be')) {
    status = 400;
  }
  
  sendJson(res, status, {
    error: error.message || 'Internal server error',
    success: false,
  });
}

// Get API key from request headers or environment
function getApiKey(req: VercelRequest): string {
  // Priority: Request header > Environment variable
  const headerKey = req.headers['x-api-key'] as string;
  const envKey = process.env.QUANTAROUTE_API_KEY;
  
  if (headerKey) {
    return headerKey;
  }
  
  if (envKey) {
    return envKey;
  }
  
  throw new Error('API key is required. Set QUANTAROUTE_API_KEY environment variable or provide x-api-key header');
}

// Create client instance with API key
function createClient(req: VercelRequest): QuantaRouteClient {
  const apiKey = getApiKey(req);
  return new QuantaRouteClient(apiKey);
}

// Handle CORS preflight
function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.status(200).end();
    return true;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (handleCors(req, res)) {
    return;
  }

  const { method, query, body } = req;
  const path = (query.path as string[]) || [];
  const endpoint = path[0] || '';

  try {
    // Create client instance with API key from request or environment
    const client = createClient(req);

    // Health check
    if (endpoint === 'health' && method === 'GET') {
      const result = await client.getHealth();
      return sendJson(res, 200, { success: true, data: result });
    }

    // Get usage statistics
    if (endpoint === 'usage' && method === 'GET') {
      const result = await client.getUsage();
      return sendJson(res, 200, { success: true, data: result });
    }

    // Get location statistics
    if (endpoint === 'location-statistics' && method === 'GET') {
      const result = await client.getLocationStatistics();
      return sendJson(res, 200, { success: true, data: result });
    }

    // Geocode
    if (endpoint === 'geocode' && method === 'POST') {
      if (!body || !body.address) {
        return sendJson(res, 400, {
          success: false,
          error: 'Address is required',
        });
      }
      const result = await client.geocode(body);
      return sendJson(res, 200, { success: true, data: result });
    }

    // Reverse geocode
    if (endpoint === 'reverse-geocode' && method === 'POST') {
      if (!body || !body.digipin) {
        return sendJson(res, 400, {
          success: false,
          error: 'DigiPin is required',
        });
      }
      const result = await client.reverseGeocode(body.digipin);
      return sendJson(res, 200, { success: true, data: result });
    }

    // Coordinates to DigiPin
    if (endpoint === 'coordinates-to-digipin' && method === 'POST') {
      if (typeof body?.latitude !== 'number' || typeof body?.longitude !== 'number') {
        return sendJson(res, 400, {
          success: false,
          error: 'Latitude and longitude are required and must be numbers',
        });
      }
      if (body.latitude < -90 || body.latitude > 90) {
        return sendJson(res, 400, {
          success: false,
          error: 'Latitude must be between -90 and 90',
        });
      }
      if (body.longitude < -180 || body.longitude > 180) {
        return sendJson(res, 400, {
          success: false,
          error: 'Longitude must be between -180 and 180',
        });
      }
      const result = await client.coordinatesToDigiPin(body.latitude, body.longitude);
      return sendJson(res, 200, { success: true, data: result });
    }

    // Validate DigiPin (GET method with query parameter)
    if (endpoint === 'validate-digipin') {
      if (method === 'GET') {
        const digipin = query.digipin as string;
        if (!digipin) {
          return sendJson(res, 400, {
            success: false,
            error: 'DigiPin query parameter is required',
          });
        }
        const result = await client.validateDigiPin(digipin);
        return sendJson(res, 200, { success: true, data: result });
      }
      // Also support POST for consistency
      if (method === 'POST') {
        if (!body || !body.digipin) {
          return sendJson(res, 400, {
            success: false,
            error: 'DigiPin is required',
          });
        }
        const result = await client.validateDigiPin(body.digipin);
        return sendJson(res, 200, { success: true, data: result });
      }
    }

    // Batch geocode
    if (endpoint === 'batch-geocode' && method === 'POST') {
      if (!body || !Array.isArray(body.addresses) || body.addresses.length === 0) {
        return sendJson(res, 400, {
          success: false,
          error: 'Addresses must be a non-empty array',
        });
      }
      if (body.addresses.length > 100) {
        return sendJson(res, 400, {
          success: false,
          error: 'Maximum 100 addresses allowed per batch',
        });
      }
      const result = await client.batchGeocode(body.addresses);
      return sendJson(res, 200, { success: true, data: result });
    }

    // Autocomplete
    if (endpoint === 'autocomplete' && method === 'GET') {
      const queryParam = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      
      if (!queryParam || queryParam.length < 3) {
        return sendJson(res, 400, {
          success: false,
          error: 'Query parameter "q" must be at least 3 characters long',
        });
      }
      if (limit > 10) {
        return sendJson(res, 400, {
          success: false,
          error: 'Limit cannot exceed 10',
        });
      }
      const result = await client.autocomplete(queryParam, limit);
      return sendJson(res, 200, { success: true, data: result });
    }

    // Lookup location from coordinates
    if (endpoint === 'lookup-location-from-coordinates' && method === 'POST') {
      if (typeof body?.latitude !== 'number' || typeof body?.longitude !== 'number') {
        return sendJson(res, 400, {
          success: false,
          error: 'Latitude and longitude are required and must be numbers',
        });
      }
      if (body.latitude < -90 || body.latitude > 90) {
        return sendJson(res, 400, {
          success: false,
          error: 'Latitude must be between -90 and 90',
        });
      }
      if (body.longitude < -180 || body.longitude > 180) {
        return sendJson(res, 400, {
          success: false,
          error: 'Longitude must be between -180 and 180',
        });
      }
      const result = await client.lookupLocationFromCoordinates(body.latitude, body.longitude);
      return sendJson(res, 200, { success: true, data: result });
    }

    // Lookup location from DigiPin
    if (endpoint === 'lookup-location-from-digipin' && method === 'POST') {
      if (!body || !body.digipin) {
        return sendJson(res, 400, {
          success: false,
          error: 'DigiPin is required',
        });
      }
      const result = await client.lookupLocationFromDigiPin(body.digipin);
      return sendJson(res, 200, { success: true, data: result });
    }

    // Batch location lookup
    if (endpoint === 'batch-location-lookup' && method === 'POST') {
      if (!body || !Array.isArray(body.locations) || body.locations.length === 0) {
        return sendJson(res, 400, {
          success: false,
          error: 'Locations must be a non-empty array',
        });
      }
      if (body.locations.length > 100) {
        return sendJson(res, 400, {
          success: false,
          error: 'Maximum 100 locations allowed per batch',
        });
      }
      const result = await client.batchLocationLookup(body.locations);
      return sendJson(res, 200, { success: true, data: result });
    }

    // Find nearby boundaries
    if (endpoint === 'find-nearby-boundaries' && method === 'POST') {
      if (typeof body?.latitude !== 'number' || typeof body?.longitude !== 'number') {
        return sendJson(res, 400, {
          success: false,
          error: 'Latitude and longitude are required and must be numbers',
        });
      }
      if (body.latitude < -90 || body.latitude > 90) {
        return sendJson(res, 400, {
          success: false,
          error: 'Latitude must be between -90 and 90',
        });
      }
      if (body.longitude < -180 || body.longitude > 180) {
        return sendJson(res, 400, {
          success: false,
          error: 'Longitude must be between -180 and 180',
        });
      }
      const radius_km = typeof body.radius_km === 'number' ? body.radius_km : 5.0;
      const limit = typeof body.limit === 'number' ? body.limit : 10;
      
      if (radius_km > 100) {
        return sendJson(res, 400, {
          success: false,
          error: 'Radius cannot exceed 100 km',
        });
      }
      if (limit > 50) {
        return sendJson(res, 400, {
          success: false,
          error: 'Limit cannot exceed 50',
        });
      }
      
      const result = await client.findNearbyBoundaries(body.latitude, body.longitude, radius_km, limit);
      return sendJson(res, 200, { success: true, data: result });
    }

    // Root endpoint - show API documentation
    if (endpoint === '' && method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        message: 'QuantaRoute Geocoder REST API',
        version: '1.0.0',
        documentation: 'https://github.com/mapdevsaikat/quantaroute-geocoder',
        authentication: {
          method: 'API Key',
          header: 'x-api-key',
          env: 'QUANTAROUTE_API_KEY',
          note: 'API key can be provided via x-api-key header or QUANTAROUTE_API_KEY environment variable. Get your API key from https://developers.quantaroute.com',
          getApiKey: 'https://developers.quantaroute.com',
        },
        endpoints: {
          'GET /api': 'Get API information (this endpoint)',
          'GET /api/health': 'Check API health status',
          'GET /api/usage': 'Get API usage statistics',
          'GET /api/location-statistics': 'Get location service statistics',
          'GET /api/autocomplete?q=query&limit=5': 'Get address autocomplete suggestions (min 3 chars)',
          'GET /api/validate-digipin?digipin=XXX-XXX-XXXX': 'Validate a DigiPin code',
          'POST /api/geocode': 'Geocode an address to get DigiPin and coordinates',
          'POST /api/reverse-geocode': 'Reverse geocode a DigiPin to get address',
          'POST /api/coordinates-to-digipin': 'Convert coordinates to DigiPin',
          'POST /api/validate-digipin': 'Validate a DigiPin code (alternative to GET)',
          'POST /api/batch-geocode': 'Geocode multiple addresses (up to 100)',
          'POST /api/lookup-location-from-coordinates': 'Get administrative boundaries from coordinates',
          'POST /api/lookup-location-from-digipin': 'Get administrative boundaries from DigiPin',
          'POST /api/batch-location-lookup': 'Batch lookup for multiple locations (up to 100)',
          'POST /api/find-nearby-boundaries': 'Find nearby postal boundaries within a radius',
        },
        examples: {
          geocode: {
            method: 'POST',
            url: '/api/geocode',
            headers: { 'Content-Type': 'application/json', 'x-api-key': 'your-api-key' },
            body: {
              address: '123 Main Street, New Delhi',
              city: 'New Delhi',
              state: 'Delhi',
              pincode: '110001',
            },
          },
          reverseGeocode: {
            method: 'POST',
            url: '/api/reverse-geocode',
            headers: { 'Content-Type': 'application/json', 'x-api-key': 'your-api-key' },
            body: { digipin: 'ABC-DEF-1234' },
          },
          autocomplete: {
            method: 'GET',
            url: '/api/autocomplete?q=New Delhi&limit=5',
            headers: { 'x-api-key': 'your-api-key' },
          },
        },
      });
    }

    // 404 for unknown endpoints
    return sendJson(res, 404, {
      success: false,
      error: 'Endpoint not found',
      endpoint: endpoint || '(root)',
      method: method,
      availableEndpoints: [
        'GET /api',
        'GET /api/health',
        'GET /api/usage',
        'GET /api/location-statistics',
        'GET /api/autocomplete?q=query&limit=5',
        'GET /api/validate-digipin?digipin=XXX-XXX-XXXX',
        'POST /api/geocode',
        'POST /api/reverse-geocode',
        'POST /api/coordinates-to-digipin',
        'POST /api/validate-digipin',
        'POST /api/batch-geocode',
        'POST /api/lookup-location-from-coordinates',
        'POST /api/lookup-location-from-digipin',
        'POST /api/batch-location-lookup',
        'POST /api/find-nearby-boundaries',
      ],
    });
  } catch (error: any) {
    handleError(res, error);
  }
}
