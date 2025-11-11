# Vercel Deployment Configuration

## Framework

This project is a **Node.js/TypeScript serverless function** project deployed on Vercel. It is NOT a static site framework.

## Project Structure

- **MCP Server**: `src/index.ts` - MCP server for AI assistants (Claude Desktop, Cursor)
- **REST API Wrapper**: `api/[...path].ts` - Serverless function for REST API endpoints
- **Client Library**: `src/client.ts` - QuantaRoute API client used by both MCP and REST API

## Vercel Configuration

The `vercel.json` configures this as a serverless function project:

```json
{
  "version": 2,
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.0.0"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/[...path]"
    }
  ]
}
```

## Important Notes

1. **No Static Site**: This is NOT a static site. There is NO `public` directory.
2. **No Build Output**: Vercel compiles TypeScript automatically. The `dist/` directory is only for MCP server distribution via npx.
3. **Serverless Functions**: All API endpoints are serverless functions in the `api/` directory.
4. **TypeScript Compilation**: Vercel automatically compiles TypeScript files in `api/` directory.

## Deployment

1. **Install Dependencies**: Vercel runs `npm install` automatically
2. **Compile TypeScript**: Vercel compiles `api/[...path].ts` and `src/client.ts` automatically
3. **Deploy Functions**: Vercel deploys the serverless function to `/api/*` routes

## Troubleshooting

If you see the error: "No Output Directory named 'public' found"

**Solution**: Make sure `vercel.json` is configured correctly with `functions` configuration. Vercel should NOT look for a `public` directory because this is a serverless function project, not a static site.

## Build Script

The `build` script in `package.json` is ONLY for building the MCP server (`dist/` directory) for distribution via npx. It is NOT used by Vercel for deployment.

Vercel automatically compiles TypeScript for serverless functions and does NOT use the `build` script.

