# Multi-Site Removal - Changes Summary

## Date: January 9, 2026

## Overview
Removed multi-site architecture and simplified the codebase to focus exclusively on the Bauturbo directory.

## What Was Removed

### Files Deleted
- `sites/` directory (entire multi-site configuration structure)
  - `sites/site-config.yml` (master site configuration)
  - `sites/bauturbo/` (Bauturbo-specific configs)
  - `sites/test_directory/` (test site)
- `scripts/build-all-sites.js` (multi-site build orchestrator)
- `src/_data/directoryConfig.js` (intermediate config loader)

### Code Removed
- `SITE_ID` environment variable logic throughout codebase
- Multi-site output directory logic (`_site/{site-id}/`)
- Site-specific build commands in package.json
- Default theme inheritance logic

## What Was Changed

### New Files Created
- `frontend/config.yml` - Single configuration file containing:
  - Site information
  - Theme customization
  - Branding
  - Navigation menus
  - Directory configurations
- `frontend/.env` - Copied from `sites/bauturbo/.env`

### Files Modified

**`src/_data/siteConfig.js`**
- Simplified to load from `config.yml` instead of `sites/site-config.yml`
- Removed SITE_ID logic
- Returns flattened config structure for easy template access

**`src/_data/directories.js`**
- Loads config directly from `config.yml`
- Removed dependency on `directoryConfig.js`
- Reads NocoDB credentials from environment variables

**`.eleventy.js`**
- Removed SITE_ID environment variable handling
- Removed multi-site output directory logic
- Always outputs to `_site/` directly
- Simplified build logging

**`package.json`**
- Renamed to `bauturbo-directory`
- Simplified scripts:
  - `build` → `eleventy`
  - `dev` → `eleventy --serve`
- Removed site-specific build commands

**`scripts/rebuild-on-server.sh`**
- Updated comments and messaging
- Changed from "all sites" to single site
- Simplified output paths

**`scripts/rebuild-and-deploy.sh`**
- Removed site-specific deployment logic
- Simplified to deploy single site
- Removed SITE_ID parameter handling

**`README.md`**
- Complete rewrite focusing on single directory
- Removed multi-site concepts and examples
- Simplified configuration examples
- Updated deployment documentation
- Old version backed up to `README_OLD.md`

## Configuration Structure

### Before (Multi-Site)
```
sites/
├── site-config.yml (master config with default theme)
├── bauturbo/
│   ├── directories.yml
│   └── .env
└── test_directory/
    ├── directories.yml
    └── .env
```

### After (Single Site)
```
frontend/
├── config.yml (all configuration)
└── .env (NocoDB credentials)
```

## Build Commands

### Before
```bash
npm run build              # Build all sites
npm run build:bauturbo     # Build specific site
npm run dev:bauturbo       # Dev server for specific site
```

### After
```bash
npm run build              # Build site
npm run dev                # Dev server
```

## Output Structure

### Before
```
_site/
├── bauturbo/
│   ├── index.html
│   └── ...
└── test_directory/
    ├── index.html
    └── ...
```

### After
```
_site/
├── index.html
└── ...
```

## Benefits of Simplification

1. **Easier to understand** - Single configuration file instead of nested hierarchy
2. **Simpler maintenance** - No SITE_ID juggling or multi-site orchestration
3. **Clearer documentation** - README reduced from ~500 to ~150 lines
4. **Faster builds** - No overhead from multi-site logic
5. **Easier onboarding** - New developers can understand the structure immediately
6. **Reduced complexity** - Removed theme inheritance, output directory logic, build orchestration

## Server Deployment Impact

### Nginx Configuration Update Needed
The Nginx configuration on pt-web-1 needs to be updated:

**Current:** Serves from `/srv/projects/pt-app-directory_multisites_1/frontend/_site/bauturbo/`
**New:** Should serve from `/srv/projects/pt-app-directory_multisites_1/frontend/_site/`

Update `/etc/nginx/sites-available/leitfaden.umsetzungslabor-bauturbo.de`:
```nginx
root /srv/projects/pt-app-directory_multisites_1/frontend/_site;
```

### Cron Job
The existing cron job will continue to work as-is since it runs `./frontend/scripts/rebuild-on-server.sh`.

## Testing

✅ Build tested locally and completed successfully
✅ Generated 22 files (pages and items)
✅ No errors or warnings during build

## Next Steps

1. Update Nginx configuration on pt-web-1
2. Deploy to server and test
3. Verify automated rebuild cron job works
4. Delete old backup file `README_OLD.md` once confirmed working
5. Update project_plan.md if needed
