# GitHub Setup Guide for QuantaRoute Geocoder MCP Server

This guide will help you set up the MCP server repository on GitHub so it can be used via `npx`.

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `quantaroute-geocoder`
3. Description: "MCP server for QuantaRoute Geocoding API"
4. Set to **Public** (required for npx to work)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push Code to GitHub

```bash
# Navigate to mcp-server directory
cd mcp-server

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: QuantaRoute Geocoder MCP Server"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/quantaroute-geocoder.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 3: Verify Package.json Configuration

Make sure your `package.json` has:
- ✅ `"bin"` field pointing to `./dist/index.js`
- ✅ `"type": "module"` for ES modules
- ✅ `"main"` pointing to `dist/index.js`
- ✅ Repository URL matches your GitHub repo

## Step 4: Test Locally Before Pushing

```bash
# Build the project
npm run build

# Test the binary
node dist/index.js
```

## Step 5: Configure MCP Client

Once pushed to GitHub, users can configure it in their MCP config:

**For Cursor (`~/.cursor/mcp.json`):**
```json
{
  "mcpServers": {
    "quantaroute-geocoder": {
      "command": "npx",
      "args": [
        "-y",
        "git+https://github.com/YOUR_USERNAME/quantaroute-geocoder.git"
      ],
      "env": {
        "QUANTAROUTE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**For Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):**
```json
{
  "mcpServers": {
    "quantaroute-geocoder": {
      "command": "npx",
      "args": [
        "-y",
        "git+https://github.com/YOUR_USERNAME/quantaroute-geocoder.git"
      ],
      "env": {
        "QUANTAROUTE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Step 6: Update README with Your Repository URL

Update the README.md to replace:
- `mapdevsaikat/quantaroute-geocoder` with your actual GitHub username/repo

## Important Notes

1. **Public Repository Required**: npx with git URLs only works with public repositories
2. **Main Branch**: Make sure your code is on the `main` branch
3. **Build Files**: The `dist/` folder must be committed to Git (it's in `.gitignore` by default, but you need it for npx)
4. **Version Updates**: When you update the code, users will get the latest version automatically via `-y` flag

## Troubleshooting

### npx can't find the package
- Make sure the repository is **public**
- Check that the repository URL is correct
- Verify `package.json` has the correct `bin` entry

### Module not found errors
- Ensure `dist/` folder is committed to Git
- Check that `package.json` has `"type": "module"` for ES modules
- Verify all dependencies are listed in `package.json`

### Build errors
- Run `npm install` first
- Check Node.js version (requires 18+)
- Verify TypeScript is installed: `npm install -D typescript`

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Test with `npx -y git+https://github.com/YOUR_USERNAME/quantaroute-geocoder.git`
3. ✅ Update MCP config
4. ✅ Test in Cursor/Claude Desktop
5. ✅ Share with users!

