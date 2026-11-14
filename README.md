# @quantaroute/mcp-server

MCP server and REST wrapper for the [QuantaRoute](https://quantaroute.com) geocoding API (India). Geocode addresses, reverse-geocode DigiPin, and look up administrative boundaries.

## First step: Get an `API key` at [developers.quantaroute.com](https://developers.quantaroute.com).

| | |
|---|---|
| npm | [`@quantaroute/mcp-server`](https://www.npmjs.com/package/@quantaroute/mcp-server) **1.2.0** |
| MCP Registry | [`io.github.mapdevsaikat/quantaroute-geocoder`](https://registry.modelcontextprotocol.io/?q=quantaroute) |


## MCP (Claude Desktop, Cursor)

Add to Claude Desktop (`claude_desktop_config.json`) or Cursor (`~/.cursor/mcp.json`), then restart. Requires Node.js 18+ and `npx`.

**Local process** (MCP stdio):

```json
{
  "mcpServers": {
    "quantaroute": {
      "command": "npx",
      "args": ["-y", "@quantaroute/mcp-server"],
      "env": {
        "QUANTAROUTE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Tools

| Tool | What it does |
|---|---|
| `geocode` | Address → DigiPin + coordinates. Optional `latitude` + `longitude` bias local results and enable “near me” queries (`hospital near me`). |
| `autocomplete` | Address suggestions (`query` ≥ 3 chars). Same optional point as `lat`/`lng` on REST. |
| `reverse_geocode` | DigiPin → address + coordinates |
| `coordinates_to_digipin` | Lat/lng → DigiPin |
| `validate_digipin` | Check DigiPin format / existence |
| `batch_geocode` | Up to 100 addresses |
| `lookup_location_from_coordinates` | Lat/lng → pincode, state, division, locality |
| `lookup_location_from_digipin` | DigiPin → the same |
| `batch_location_lookup` | Up to 100 locations (each coords **or** DigiPin) |
| `get_usage` / `get_location_statistics` / `get_health` | Quota, coverage stats, health |

`find_nearby_boundaries` is listed but **not implemented**. Use `geocode` or `autocomplete` with a point for category nearby.

## REST

Same host: `https://mcp-gc.quantaroute.com/api`. Header `x-api-key`, or `QUANTAROUTE_API_KEY` on the server. Paths match the tools (`POST /api/geocode`, `GET /api/autocomplete?q=…&lat=&lng=`, …). Missing key → **401**. Full list: [docs/API.md](docs/API.md).

## Develop

```bash
npm install
npm run build
QUANTAROUTE_API_KEY=your-key npm start
```

Upstream API: [api.quantaroute.com](https://api.quantaroute.com/v1/digipin/docs) · Issues: [GitHub](https://github.com/mapdevsaikat/quantaroute-geocoder/issues) · License: MIT
