---
name: "Umsetzungsbabor Leitfaden"
description: "directory platform with 11ty static site generation and NocoDB CMS "

status: active
last_review: 09.01.2026
type: app
owner: IT

app_id: directory_bauturbo
server: pt-web-1
path: 
URL: https://leitfaden.umsetzungslabor-bauturbo.de
---

# Bauturbo Directory – Directory Platform

## Overview

A directory website for Bauturbo initiatives, built with 11ty for static site generation and NocoDB as a headless CMS.

**Live Site:** https://leitfaden.umsetzungslabor-bauturbo.de
**NocoDB Admin:** https://nocodb.projecttogether.org

**Key Features:**
- ✅ **Custom theming** - Colors, fonts, logos configured in YAML
- ✅ **Dynamic navigation** - Automatic menu generation
- ✅ **Per-directory filters** - Configurable filter fields
- ✅ **Static site generation** - Fast, secure, CDN-ready
- ✅ **NocoDB CMS** - Content managed via NocoDB interface

## Architecture

```
NocoDB (CMS)
    ↓
11ty Build (local/server)
    ↓
Static Files (_site/)
    ↓
Nginx (pt-web-1)
    ↓
Public Website
```

## Quick Start

### Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev      # http://localhost:8080/

# Build for production
npm run build
```

## Project Structure

```
frontend/
├── config.yml                # Main configuration (site, theme, directories)
├── .env                      # NocoDB credentials (not in git)
├── src/
│   ├── _data/
│   │   ├── siteConfig.js     # Loads site config
│   │   └── directories.js    # Fetches NocoDB data
│   ├── _includes/layouts/    # Templates
│   └── assets/               # Static assets
├── scripts/
│   ├── rebuild-and-deploy.sh # Local build & deploy
│   └── rebuild-on-server.sh  # Server rebuild
└── _site/                    # Build output (gitignored)
```

## Configuration

- Main Configuration via `config.yml`
- Environment Variables via `.env`

## Deployment

### Server Setup (pt-web-1)

**Location:** `/srv/projects/pt-app-directory_multisites_1/frontend/`

**Manual rebuild:**
```bash
ssh simon@188.245.90.198
cd /srv/projects/pt-app-directory_multisites_1
./frontend/scripts/rebuild-on-server.sh
```

**Automated rebuilds:** Daily at 5 AM via cron

### Nginx Configuration

Site served from: `/srv/projects/pt-app-directory_multisites_1/frontend/_site`


SSL: Managed by Certbot

## Adding a New Directory

1. **Create table/view in NocoDB**
2. **Edit `config.yml`:**
   ```yaml
   directories:
     - id: new-directory
       name: New Directory
       path: /new
       nocodb:
         table_id: your_table_id
         view_id: your_view_id
       display:
         title_field: Title
         description_field: Description
       filters:
         - field: Category
           type: single
   ```
3. **Rebuild:** `npm run build`

## Troubleshooting

**Build failures:**
- Check YAML syntax: `npx js-yaml config.yml`
- Verify `.env` credentials
- Clear cache: `rm -rf .cache _site`

**Data not showing:**
- Verify NocoDB token in `.env`
- Check table/view IDs in `config.yml`
- Clear cache and rebuild

**Deployment issues:**
- Check file permissions on server
- View rebuild logs: `tail -f /srv/projects/pt-app-directory_multisites_1/rebuild.log`

## Documentation

For detailed information, see `project_plan.md` for the original project plan.
