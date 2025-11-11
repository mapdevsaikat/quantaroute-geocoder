# Vercel Deployment Checklist

## ✅ Pre-Deployment Checks

- [x] `lib/client.ts` exists and is identical to `src/client.ts`
- [x] `api/[...path].ts` imports from `../lib/client.js` (with .js extension)
- [x] `vercel.json` is configured correctly
- [x] `package.json` has all dependencies
- [x] TypeScript compiles without errors
- [ ] `QUANTAROUTE_API_KEY` is set in Vercel environment variables
- [ ] All changes are committed to Git
- [ ] Repository is pushed to GitHub

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "installCommand": "npm install",
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

### api/[...path].ts
- ✅ Imports from `../lib/client.js`
- ✅ Uses ES module syntax
- ✅ Handles CORS correctly
- ✅ Error handling implemented

### lib/client.ts
- ✅ Exists in repository
- ✅ Exported `QuantaRouteClient` class
- ✅ Compatible with Vercel serverless functions

## 🚀 Deployment Steps

### 1. Commit Changes
```bash
git add lib/ api/ vercel.json package.json .gitignore docs/
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### 2. Set Environment Variable in Vercel

**Via Vercel Dashboard**:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add `QUANTAROUTE_API_KEY` with your API key
5. Select all environments (Production, Preview, Development)
6. Save

**Via Vercel CLI**:
```bash
vercel env add QUANTAROUTE_API_KEY
# Enter your API key when prompted
```

### 3. Deploy

**Automatic (if connected to GitHub)**:
- Push to main branch
- Vercel will auto-deploy

**Manual**:
```bash
vercel --prod
```

### 4. Verify Deployment

```bash
# Test health endpoint
curl https://your-project.vercel.app/api/health

# Test geocode endpoint
curl -X POST https://your-project.vercel.app/api/geocode \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"address": "123 Main Street, New Delhi"}'
```

## 🔍 Common Issues & Solutions

### Issue: Module Not Found
**Error**: `Cannot find module '../lib/client.js'`

**Solution**:
- Ensure `lib/client.ts` is committed to Git
- Verify the file exists: `ls -la lib/client.ts`
- Run sync script: `npm run sync-client`

### Issue: Authentication Error
**Error**: `API key is required`

**Solution**:
- Set `QUANTAROUTE_API_KEY` in Vercel environment variables
- Verify it's set for the correct environment
- Re-deploy after adding environment variable

### Issue: Build Failures
**Error**: TypeScript compilation errors

**Solution**:
- Test locally: `npm run build`
- Check for TypeScript errors: `npx tsc --noEmit`
- Verify all imports are correct

## 📝 Notes

- Vercel compiles TypeScript automatically - no build step needed
- The `lib/client.ts` file must be in the repository for Vercel to access it
- Run `npm run sync-client` before committing if you update `src/client.ts`
- The `dist/` directory is for MCP server distribution, not Vercel deployment

## 🔗 Resources

- Vercel Documentation: https://vercel.com/docs
- Troubleshooting Guide: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- Deployment Guide: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

