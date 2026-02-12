---
name: "directory-bauturbo"
description: "directory platform with 11ty static site generation and NocoDB CMS"

type: app
owner: IT
server: pt-web-1
frontend_path: /var/www/directory
project_path: /srv/projects/pt-app-directory-bauturbo/
github_repository: https://github.com/projecttogether/pt-app-directory-bauturbo
URL: https://praxiswissen.umsetzungslabor-bauturbo.de
---

# Bauturbo Directory – Directory Platform

## Overview

A directory website for Umsetzungslabor Bau-Turbo, built with 11ty for static site generation and NocoDB as a headless CMS.

**Live Site:** https://praxiswissen.umsetzungslabor-bauturbo.de
**NocoDB Admin:** https://nocodb.projecttogether.org

**Key Features:**

- ✅ **Custom theming** - Colors, fonts, logos configured in YAML
- ✅ **Component-driven pages** - Reusable Nunjucks components fed by NocoDB sections
- ✅ **Per-directory filters** - Configurable filter fields
- ✅ **Static site generation** - Fast, secure, CDN-ready
- ✅ **NocoDB CMS** - Content managed via NocoDB interface

## Architecture

<details>
<summary>View system architecture</summary>

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

</details>

## Quick Start

<details>
<summary>Development setup and commands</summary>

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

</details>

## Project Structure

<details>
<summary>Explore project file organization</summary>

```
frontend/
├── config.yml                # Main configuration (site, theme, directories)
├── .env                      # NocoDB credentials (not in git)
├── src/
│   ├── _data/
│   │   ├── siteConfig.js     # Loads site config
│   │   ├── directories.js    # Fetches NocoDB data
│   │   ├── pages.js          # Fetches NocoDB pages
│   │   └── pagesList.js      # Pages array for pagination
│   ├── _includes/
│   │   ├── components/       # Reusable UI components
│   │   └── layouts/          # Page layouts
│   ├── pages.njk             # CMS-driven page rendering (pagination)
│   └── assets/               # Static assets
│       └── content.css/      # Shared CSS
├── scripts/
│   ├── rebuild-and-deploy.sh # Local build & deploy
│   └── rebuild-on-server.sh  # Server rebuild
└── _site/                    # Build output (gitignored)
```

</details>

## Page Authoring (NocoDB-driven)

<details>
<summary>How to create and manage content</summary>

- Pages are defined in NocoDB (one row per page) and rendered by `frontend/src/pages.njk`.
- Sections are described via `section_*` fields and rendered through `frontend/src/_includes/components/sections/page-sections.njk`.
- Page data is loaded in `frontend/src/_data/pages.js` and exposed as a list in `frontend/src/_data/pagesList.js`.
- Shared content and component styles live in `frontend/src/assets/styles/content.css`.

### Legacy Markdown Authoring (Deprecated)

Older Markdown-based pages under `frontend/src/pages/` are no longer used in this branch and should be considered deprecated.

</details>

## Configuration

<details>
<summary>Configuration options and settings</summary>

- Main Configuration via `config.yml`
- Environment Variables via `.env`

</details>

## Deployment

<details>
<summary>Deployment via Coolify (recommended)</summary>

### Coolify / Docker Deployment

The site is deployed as a **Dockerfile-based** resource in Coolify.

**How it works:** Every deployment triggers a Docker build that fetches fresh data from NocoDB and produces a new static site served by Nginx.

#### Required Build Arguments (set in Coolify)

| Variable | Description |
|---|---|
| `NOCODB_BASE_URL` | NocoDB instance URL (e.g. `https://nocodb.projecttogether.org`) |
| `NOCODB_API_TOKEN` | NocoDB API token |
| `NOCODB_PROJECT_ID` | NocoDB project ID |

> **Important:** These must be configured as **Build Arguments** (not just runtime env vars) in Coolify, since the data is fetched during `npm run build`.

#### Scheduled Rebuilds

To keep NocoDB content up to date, configure a **scheduled redeploy** in Coolify (e.g. daily at 5:00 AM). Each redeploy re-runs the Docker build and fetches fresh data.

#### Manual Rebuild

Click **"Redeploy"** in the Coolify UI to trigger an immediate rebuild with the latest NocoDB data.

#### Health Check

The Nginx config includes a liveness endpoint at `/-/healthz` that returns `200 OK` with a JSON body:

```json
{ "status": "OK", "timestamp": "2026-02-12T08:00:00+01:00" }
```

Configure the **Health Check Path** in Coolify to `/-/healthz` so the platform can verify the container is alive.

</details>

<details>
<summary>Legacy deployment (bare-metal, deprecated)</summary>

### Local Build & Deploy

```bash
# Build locally and deploy to server
./frontend/scripts/rebuild-and-deploy.sh
```

### Server Setup

**Project location:** `/srv/projects/pt-app-directory-bauturbo/`
**Site served from:** `/var/www/directory`

**Automated rebuilds:** Daily at 5 AM via cron

### Nginx Configuration

Site served from: `/var/www/directory`

SSL: Managed by Certbot

</details>

## Adding a New Directory

<details>
<summary>Steps to create a new directory section</summary>

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

</details>

## Troubleshooting

<details>
<summary>Common issues and solutions</summary>

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
- View rebuild logs (server): `tail -f /srv/projects/pt-app-directory-bauturbo/rebuild.log`

</details>

## Branch Naming Conventions

<details>
<summary>Git branch naming guidelines</summary>

To maintain consistency and clarity in the development workflow, please follow these branch naming patterns:

### New Features

```bash
feature/name-of-new-feature
```

Use this pattern when implementing a completely new feature or functionality.

**Example:** `feature/search-functionality`

### Feature Revisions

```bash
revision/name-of-existing-feature
```

Use this pattern when making significant changes or improvements to an existing feature.

**Example:** `revision/directory-tabs`

### Bug Fixes

```bash
fix/name-of-existing-feature
```

Use this pattern when fixing bugs or issues in existing functionality.

**Example:** `fix/pagination-navigation`

### Guidelines

- Use lowercase letters with hyphens to separate words
- Keep branch names descriptive but concise
- Reference the feature/component being worked on, not the specific technical implementation

</details>
