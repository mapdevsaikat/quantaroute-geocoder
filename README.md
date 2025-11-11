# QuantaRoute Geocoder MCP Server

A Model Context Protocol (MCP) server that provides AI assistants (Claude Desktop, Cursor, and more) with powerful geocoding, location lookup, and DigiPin processing capabilities using the QuantaRoute Geocoding API.

**✅ Fully compatible with Claude Desktop and Cursor**

## Features

### 🗺️ Geocoding Tools
- **Geocode addresses** to DigiPin codes and coordinates
- **Reverse geocode** DigiPin codes to addresses
- **Convert coordinates** to DigiPin codes
- **Validate DigiPin** format and location
- **Batch geocode** multiple addresses (up to 100)
- **Autocomplete** address suggestions

### 🚀 Revolutionary Location Lookup with Nominatim + Pincode + Digipin
- **Lookup administrative boundaries** from coordinates (pincode, state, division, locality)
- **Lookup from DigiPin** codes
- **Batch location lookup** for multiple locations
- **Find nearby boundaries** within a radius
- Access to **36,000+ postal boundaries** across India

### 📊 Utility Tools
- **Get API usage** statistics
- **Get location statistics** (boundaries, states, divisions)
- **Check API health** status

## Installation

This MCP server is compatible with **Claude Desktop** and **Cursor**. Follow the instructions below for your platform.

### For Claude Desktop

1. **Locate the Claude Desktop configuration file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Edit the configuration file** and add:

```json
{
  "mcpServers": {
    "quantaroute-geocoder": {
      "command": "npx",
      "args": [
        "-y",
        "git+https://github.com/mapdevsaikat/quantaroute-geocoder.git"
      ],
      "env": {
        "QUANTAROUTE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

3. **Save and restart Claude Desktop** to apply the changes.

### For Cursor

Add to your MCP configuration file (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "quantaroute-geocoder": {
      "command": "npx",
      "args": [
        "-y",
        "git+https://github.com/mapdevsaikat/quantaroute-geocoder.git"
      ],
      "env": {
        "QUANTAROUTE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Restart Cursor after making changes.

### Environment Variables

- `QUANTAROUTE_API_KEY` (required): Your QuantaRoute API key
  - Get your API key from: https://developers.quantaroute.com
  - Free tier test key: `demo_free_key_123` (for testing)

## Available Tools

### `geocode`
Geocode an address to get DigiPin code and coordinates.

**Parameters:**
- `address` (required): The address to geocode
- `city` (optional): City name
- `state` (optional): State name
- `pincode` (optional): Postal code
- `country` (optional): Country name (defaults to India)

**Example:**
```json
{
  "address": "123 Main Street, New Delhi",
  "city": "New Delhi",
  "state": "Delhi",
  "pincode": "110001"
}
```

### `reverse_geocode`
Reverse geocode a DigiPin code to get coordinates and address.

**Parameters:**
- `digipin` (required): DigiPin code (format: XXX-XXX-XXXX)

### `coordinates_to_digipin`
Convert latitude and longitude to DigiPin code.

**Parameters:**
- `latitude` (required): Latitude (-90 to 90)
- `longitude` (required): Longitude (-180 to 180)

### `lookup_location_from_coordinates`
🚀 **REVOLUTIONARY**: Get administrative boundaries from coordinates.

Returns: pincode, state, division, locality, district, population density, and more.

**Parameters:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate

### `lookup_location_from_digipin`
Get administrative boundaries from a DigiPin code.

**Parameters:**
- `digipin` (required): DigiPin code

### `batch_location_lookup`
Batch lookup for multiple locations (up to 100).

**Parameters:**
- `locations` (required): Array of location objects
  - Each object can have `latitude` + `longitude` OR `digipin`

### `batch_geocode`
Geocode multiple addresses in a single request (up to 100).

**Parameters:**
- `addresses` (required): Array of address objects

### `autocomplete`
Get address autocomplete suggestions.

**Parameters:**
- `query` (required): Search query (minimum 3 characters)
- `limit` (optional): Max suggestions (default: 5, max: 10)

### `find_nearby_boundaries`
Find nearby postal boundaries within a radius.

**Parameters:**
- `latitude` (required): Center latitude
- `longitude` (required): Center longitude
- `radius_km` (optional): Search radius in km (default: 5.0, max: 100)
- `limit` (optional): Max results (default: 10, max: 50)

### `validate_digipin`
Validate DigiPin format and check if it's a real location.

**Parameters:**
- `digipin` (required): DigiPin code to validate

### `get_usage`
Get API usage statistics and quota information.

### `get_location_statistics`
Get live statistics about the Location Lookup service.

### `get_health`
Check API health status.

## Development

### Prerequisites
- Node.js 18+
- TypeScript 5+

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Project Structure

```
mcp-server/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## API Documentation

Full API documentation: https://api.quantaroute.com/v1/digipin/docs

## License

MIT License

## Support

- **Website**: https://quantaroute.com
- **API Docs**: https://api.quantaroute.com/v1/digipin/docs
- **Issues**: https://github.com/mapdevsaikat/quantaroute-geocoder/issues

## Supported Platforms

✅ **Claude Desktop** - Fully supported  
✅ **Cursor** - Fully supported  
✅ **Other MCP-compatible clients** - Should work with any MCP-compatible application

## Example Usage in AI Assistants

Once configured, AI assistants (Claude, Cursor AI, etc.) can use tools like:

### Example 1: Geocoding
```
User: "What's the DigiPin for 123 Main Street, New Delhi?"

Assistant: [Uses geocode tool]
The DigiPin code for that address is ABC-DEF-1234, located at coordinates 28.6139°N, 77.2090°E.
```

### Example 2: Location Lookup
```
User: "What administrative boundaries are at coordinates 28.6139, 77.2090?"

Assistant: [Uses lookup_location_from_coordinates tool]
That location is in:
- Pincode: 110001
- State: Delhi
- Division: New Delhi Central
- Locality: Connaught Place
- District: New Delhi
```

### Example 3: Reverse Geocoding
```
User: "What's the address for DigiPin 2TF-3FT-J825?"

Assistant: [Uses reverse_geocode tool]
The DigiPin 2TF-3FT-J825 corresponds to:
- Address: FE Block, Sector III, Bidhannagar, North 24 Parganas, West Bengal, 700106, India
- Coordinates: 22.580587°N, 88.419001°E
```

## Troubleshooting

### Claude Desktop Issues

1. **Server not appearing in Claude Desktop:**
   - Verify the config file path is correct for your OS
   - Check that the JSON syntax is valid
   - Restart Claude Desktop completely

2. **"Command not found" errors:**
   - Ensure Node.js 18+ is installed: `node --version`
   - Verify `npx` is available: `which npx`

3. **API authentication errors:**
   - Check that `QUANTAROUTE_API_KEY` is set correctly in the config
   - Verify the API key is valid at https://api.quantaroute.com

### Cursor Issues

1. **MCP server not loading:**
   - Check `~/.cursor/mcp.json` exists and has valid JSON
   - Restart Cursor completely
   - Check Cursor's MCP logs for errors

2. **Tools not available:**
   - Verify the server is running (check Cursor's MCP status)
   - Ensure API key is configured correctly

