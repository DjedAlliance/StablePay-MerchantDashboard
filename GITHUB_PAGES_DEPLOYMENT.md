# GitHub Pages Deployment Guide

This guide explains how to deploy the StablePay Merchant Dashboard to GitHub Pages.

## 📋 Overview

The dashboard is configured to deploy automatically to GitHub Pages using GitHub Actions. The deployment is triggered on every push to the `main` branch.

## ✅ Configuration Status

### Already Configured

- ✅ **Static Export**: Next.js is configured with `output: 'export'`
- ✅ **Base Path**: Set to `/StablePay-MerchantDashboard` for production
- ✅ **Asset Prefix**: Configured for GitHub Pages URLs
- ✅ **GitHub Actions Workflow**: `.github/workflows/nextjs.yml` is ready
- ✅ **Image Optimization**: Disabled (required for static export)
- ✅ **Jekyll Bypass**: `.nojekyll` file added to public directory

## 🚀 Deployment Steps

### For Your Fork (manishyad375375/StablePay-MerchantDashboard)

1. **Enable GitHub Pages**
   - Go to your repository settings: `https://github.com/manishyad375375/StablePay-MerchantDashboard/settings/pages`
   - Under "Build and deployment":
     - Source: Select **GitHub Actions**
   - Save the settings

2. **Trigger Deployment**
   - The workflow will run automatically on the next push to `main`
   - Or manually trigger it from: `Actions` → `Deploy Next.js site to Pages` → `Run workflow`

3. **Verify Deployment**
   - After the workflow completes, your site will be available at:
   - `https://manishyad375375.github.io/StablePay-MerchantDashboard/`

### For the Original Repository (DjedAlliance/StablePay-MerchantDashboard)

Once your PR is merged:

1. **Enable GitHub Pages in the main repository**
   - Repository maintainer needs to:
   - Go to Settings → Pages
   - Set Source to **GitHub Actions**

2. **Access the Deployed Site**
   - The site will be available at:
   - `https://djedalliance.github.io/StablePay-MerchantDashboard/`

## 📝 Configuration Details

### next.config.ts

```typescript
import type { NextConfig } from "next"

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: 'export',                                      // Enable static export
  basePath: isProd ? '/StablePay-MerchantDashboard' : '', // Base path for GitHub Pages
  assetPrefix: isProd ? '/StablePay-MerchantDashboard/' : '', // Asset prefix
  trailingSlash: true,                                   // Add trailing slashes to URLs
  eslint: {
    ignoreDuringBuilds: true,                           // Skip ESLint during build
  },
  typescript: {
    ignoreBuildErrors: true,                            // Skip TypeScript errors during build
  },
  images: {
    unoptimized: true,                                  // Disable image optimization (required for export)
  },
}

export default nextConfig
```

### GitHub Actions Workflow

Location: `.github/workflows/nextjs.yml`

**Key Features:**
- Builds the Next.js application in the `dashboard` directory
- Uses npm for package management
- Caches dependencies and Next.js build artifacts
- Deploys to GitHub Pages automatically
- Runs on push to `main` branch
- Can be manually triggered via workflow_dispatch

## 🔧 Troubleshooting

### Assets Not Loading

**Problem**: CSS, JS, or images return 404 errors

**Solution**:
- Verify `basePath` and `assetPrefix` are set correctly in `next.config.ts`
- Check that the repository name matches the base path
- Ensure `.nojekyll` file exists in the `public` directory

### 404 on Page Refresh

**Problem**: Direct navigation to routes returns 404

**Solution**:
- This is expected behavior for GitHub Pages with client-side routing
- The homepage loads correctly, and navigation works within the app
- For production deployments, consider using a custom domain with proper routing

### Build Fails

**Problem**: GitHub Actions workflow fails during build

**Solution**:
1. Check the Actions tab for error logs
2. Verify all dependencies are correctly listed in `package.json`
3. Test the build locally:
   ```bash
   cd dashboard
   npm install
   npm run build
   ```
4. Check for TypeScript or ESLint errors if the ignores are removed

### Workflow Permissions Error

**Problem**: Deployment fails with permissions error

**Solution**:
- Go to Settings → Actions → General
- Under "Workflow permissions":
  - Select "Read and write permissions"
  - Check "Allow GitHub Actions to create and approve pull requests"
- Save changes and re-run the workflow

## 🧪 Testing Before PR

### Test Your Fork Deployment

1. **Local Build Test**:
   ```bash
   cd dashboard
   npm install
   NODE_ENV=production npm run build
   ```

2. **Serve Locally** (optional):
   ```bash
   npx serve out
   ```
   - Open `http://localhost:3000/StablePay-MerchantDashboard/`

3. **Push to Your Fork**:
   ```bash
   git push origin main
   ```

4. **Check GitHub Actions**:
   - Go to Actions tab in your fork
   - Verify the workflow runs successfully
   - Check the deployed site at your GitHub Pages URL

5. **Verify Functionality**:
   - [ ] Homepage loads correctly
   - [ ] All CSS and styling applied
   - [ ] Images load properly
   - [ ] Navigation between pages works
   - [ ] Wallet connection functions (if applicable)
   - [ ] Overview tab displays correctly
   - [ ] Transactions tab loads

## 📊 Deployment Status

### Your Fork
- **Repository**: manishyad375375/StablePay-MerchantDashboard
- **URL**: https://manishyad375375.github.io/StablePay-MerchantDashboard/
- **Status**: Ready to deploy (enable GitHub Pages)

### Original Repository  
- **Repository**: DjedAlliance/StablePay-MerchantDashboard
- **URL**: https://djedalliance.github.io/StablePay-MerchantDashboard/
- **Status**: Pending PR merge and Pages enablement

## 🎯 Acceptance Criteria Checklist

- [x] Static export enabled (`output: 'export'`)
- [x] Correct `basePath` and `assetPrefix` configured
- [x] GitHub Actions workflow for Pages deployment added
- [x] `.nojekyll` file added to prevent Jekyll processing
- [x] Build configuration optimized for static export
- [x] Documentation provided
- [ ] Tested in fork (requires enabling Pages)
- [ ] PR opened with deployment changes

## 📚 Additional Resources

- [Next.js Static Exports Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Deploying Next.js to GitHub Pages](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports#github-pages)

## 🔄 Continuous Deployment

Once GitHub Pages is enabled:

1. Every push to `main` triggers automatic deployment
2. Build takes approximately 2-5 minutes
3. Changes are live within minutes after successful deployment
4. No manual intervention required

## ⚠️ Important Notes

1. **First Deployment**: May take 5-10 minutes for DNS propagation
2. **Cache**: Browser caching may affect immediate visibility of updates
3. **Custom Domain**: Can be configured in repository settings → Pages
4. **HTTPS**: Automatically enabled by GitHub Pages
5. **Build Time**: Typical build takes 2-3 minutes

---

**Last Updated**: December 13, 2025  
**Status**: ✅ Ready for Deployment
