---
name: "directory-bauturbo"
description: "directory platform with 11ty static site generation and NocoDB CMS "

type: app
owner: IT
server: pt-web-1
frontend_path: /var/www/directory
project_path: /srv/projects/pt-app-directory_bauturbo/
github_repository: https://github.com/projecttogether/pt-app-directory_bauturbo
URL: https://praxiswissen.umsetzungslabor-bauturbo.de
---

# Bauturbo Directory – Directory Platform

## Overview

A directory website for Bauturbo initiatives, built with 11ty for static site generation and NocoDB as a headless CMS.

**Live Site:** https://praxiswissen.umsetzungslabor-bauturbo.de
**NocoDB Admin:** https://nocodb.projecttogether.org

**Key Features:**
- ✅ **Custom theming** - Colors, fonts, logos configured in YAML
- ✅ **Component-driven pages** - Reusable Nunjucks components included in Markdown
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
│   ├── _includes/
│   │   ├── components/       # Reusable UI components
│   │   └── layouts/          # Page layouts
│   ├── pages/                # Markdown pages (content + Tailwind)
│   └── assets/               # Static assets
│       └── content.css/      # Shared CSS
├── scripts/
│   ├── rebuild-and-deploy.sh # Local build & deploy
│   └── rebuild-on-server.sh  # Server rebuild
└── _site/                    # Build output (gitignored)
```

## Page Authoring (Option A)

- Pages live in `frontend/src/pages/` as Markdown with Tailwind classes.
- Complex UI sections are included via Nunjucks components:
  ```md
  {% include "components/directories-tabs.njk" %}
  ```
- Shared content and component styles live in `frontend/src/assets/styles/content.css`.
- Headings default to the theme primary color in `frontend/src/_includes/layouts/base.njk`.

## Configuration

- Main Configuration via `config.yml`
- Environment Variables via `.env`

## Deployment

### Local Build & Deploy

```bash
# Build locally and deploy to server
./frontend/scripts/rebuild-and-deploy.sh
```

### Server Setup

**Project location:** `/srv/projects/pt-app-directory_bauturbo/`
**Site served from:** `/var/www/directory`

**Automated rebuilds:** Daily at 5 AM via cron

### Nginx Configuration

Site served from: `/var/www/directory`

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
         excerpt_field: Description
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
- Check file permissions: `ls -la /var/www/directory`
- Verify nginx config: `sudo nginx -t`
- View rebuild logs (server): `tail -f /srv/projects/pt-app-directory_bauturbo/rebuild.log`
