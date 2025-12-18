---
status: active
last_review: 18.12.2025
type: app
owner: IT

app_id: directory_multisites_1
servers: 
  - pt-general-1 (bauturbo site)
  - pt-web-1 (pt_directory site)
description: Multi-tenant directory platform with 11ty static site generation and NocoDB CMS 
---

# Directory Multisites – Multi-Tenant Directory Platform

## Overview

A unified codebase for managing multiple directory websites, each with their own NocoDB data source, domain, and branding. Built with 11ty for static site generation and NocoDB as a headless CMS.

**Live Sites:**
- Bauturbo: https://directory.umsetzungslabor-bauturbo.de (deployed on pt-general-1)
- PT Directory: https://directory.projecttogether.net (deployed on pt-web-1) ✨ NEW

**NocoDB Admin:** https://nocodb.projecttogether.org

**Key Features:**
- ✅ **Multi-site architecture** - Single codebase, multiple branded websites
- ✅ **Per-site theming** - Custom colors, fonts, logos per site
- ✅ **Multi-directory support** - Multiple directory pages per site with YAML configuration
- ✅ **Dynamic navigation** - Automatic menu generation
- ✅ **Per-directory filters** - Configurable filter fields
- ✅ **Static site generation** - Fast, secure, CDN-ready
- ✅ **Separate data sources** - Each site connects to its own NocoDB base

## Architecture

```
Single Codebase
├── Shared Templates & Logic (src/)
├── Site-Specific Configurations (sites/)
└── Separate Build Outputs per Site (_site/)
    ├── bauturbo/ → directory.umsetzungslabor-bauturbo.de (pt-general-1)
    ├── pt_directory/ → directory.projecttogether.net (pt-web-1)
    └── [future sites]
```

### Data Flow

```
┌─────────────┐
│   Visitors  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  Nginx (server) │
│  /var/www/      │
│  directory_sites│
│  ├── bauturbo/ │
│  └── site2/    │
└────────┬────────┘
         │ serves static files
         ▼
    ┌────────────┐
    │  11ty      │
    │  Build     │
    │  (local)   │
    └─────┬──────┘
          │ build-time API calls
          ▼
    ┌──────────────┐
    │   NocoDB     │
    │   (Docker)   │
    │   Multiple   │
    │   Bases      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  PostgreSQL  │
    │  (Host)      │
    └──────────────┘
```

## Components

### 1. Database (PostgreSQL)
- **Location:** Host system (not Docker)
- **Database:** `directory` (and others per site)
- **User:** `directory_user`
- **Binding:** `127.0.0.1:5432`

### 2. NocoDB
- **Container:** `nocodb`
- **Network:** `host` mode (to access host PostgreSQL)
- **Port:** 8080
- **Data Sources:** Multiple PostgreSQL databases (one per site or shared)
- **Projects & Tables:** Configured per site in `sites/{site-id}/directories.yml`

### 3. Frontend (11ty)
- **Location:** `frontend/`
- **Framework:** Eleventy v3.1.2
- **Build Output:** `_site/{site-id}/` per site
- **Deployment:** `/var/www/directory_sites/{site-id}/` on server
- **Environment:** Per-site `.env` files in `sites/{site-id}/.env`

## Quick Start

### Development

```bash
cd frontend

# Install dependencies
npm install

# Work on specific site
npm run dev:bauturbo      # http://localhost:8080/

# Build specific site
npm run build:bauturbo

# Build all sites
npm run build
```

## Project Structure

```
frontend/
├── sites/
│   ├── site-config.yml           # Master site configuration
│   ├── bauturbo/
│   │   ├── directories.yml       # Bauturbo directories config
│   │   └── .env                  # Bauturbo NocoDB credentials
│   └── my-site/                  # Template for new sites
│       ├── directories.yml
│       └── .env
├── src/
│   ├── _data/
│   │   ├── siteConfig.js         # Loads site-specific config
│   │   ├── directoryConfig.js    # Loads site directories
│   │   ├── directories.js        # Fetches NocoDB data
│   │   └── allItems.js           # Flattens items for detail pages
│   ├── _includes/
│   │   └── layouts/
│   │       └── base.njk          # Base template with theming
│   ├── assets/
│   │   └── logos/                # Site logos
│   ├── directory.njk             # Directory listing page
│   ├── item-detail.njk           # Item detail page
│   └── index.njk                 # Home page (redirects)
├── scripts/
│   ├── build-all-sites.js        # Builds all sites sequentially
│   └── rebuild-and-deploy.sh     # Deployment automation
├── _site/                        # Generated static files (gitignored)
│   ├── bauturbo/                 # Built bauturbo site
│   └── my-site/                  # Built my-site
├── .eleventy.js                  # 11ty configuration
├── package.json
└── MULTI-SITE.md                 # Detailed multi-site docs
```

## Configuration

### Master Site Configuration (`sites/site-config.yml`)

Defines all directory sites managed by this codebase:

```yaml
# Default theme settings (inherited by all sites unless overridden)
default_theme:
  colors:
    primary: "#4F46E5"        # indigo-600
    secondary: "#7C3AED"      # violet-600
    background: "#F9FAFB"     # gray-50
    text: "#111827"           # gray-900
  fonts:
    heading: "Inter, system-ui, sans-serif"
    body: "Inter, system-ui, sans-serif"

# Site definitions
sites:
  - id: bauturbo              # Unique site identifier
    name: "Bauturbo Directory"
    domain: "directory.umsetzungslabor-bauturbo.de"
    
    # File paths (relative to frontend root)
    directories_config: "sites/bauturbo/directories.yml"
    env_file: "sites/bauturbo/.env"
    output_dir: "_site/bauturbo"
    
    # Theme customization (overrides defaults)
    theme:
      colors:
        primary: "#FF1E55"    # Custom pink
        secondary: "#0284C7"  # Custom blue
    
    # Branding
    branding:
      logo: "/assets/logos/logo_bauwende.png"
      favicon: "/assets/favicons/logo_bauwende.png"
    
    # Header navigation
    header_menu:
      - label: "About"
        url: "https://umsetzungslabor-bauturbo.de/about"
        external: true
    
    # Footer configuration
    footer:
      text: "© 2025 Umsetzungslabor Bauturbo"
      menu:
        - label: "Impressum"
          url: "https://umsetzungslabor-bauturbo.de/impressum"
```

### Directory Configuration (`sites/{site-id}/directories.yml`)

Each site can have multiple directory pages:

```yaml
directories:
  - id: projekte              # Unique identifier
    name: Projekte            # Display name in menu
    path: /projekte           # URL path for this directory
    description: Browse all projects
    
    # NocoDB connection
    nocodb:
      table_id: m1upwxd94s5tx1q # NocoDB table ID
      view_id: vw0efitq0kedrj5l # NocoDB view ID
    
    # Display configuration
    display:
      title_field: Title         # Field to use as item title
      description_field: Beschreibung  # Field for description
      status_field: Status       # Field for status badge
    
    # Filter configuration
    filters:
      - field: Status            # NocoDB field name
        label: Status            # Display label
        type: single             # 'single' or 'multi_select'
      - field: Tag_2
        label: Additional Tags
        type: multi_select       # Handles comma-separated values
  
  - id: praxis
    name: Kommunale Praxis
    path: /praxis
    # ... similar configuration
```

### Environment Variables (`sites/{site-id}/.env`)

Each site has its own NocoDB credentials:

```bash
NOCODB_BASE_URL=https://nocodb.projecttogether.org
NOCODB_API_TOKEN=your-site-specific-token-here
NOCODB_PROJECT_ID=px8pby5vdjxwo13
```

## Features

### Implemented ✅
- **Multi-site architecture** - Single codebase, unlimited sites
- **Per-site theming** - Colors, fonts, logos, favicons
- **Per-site branding** - Custom header/footer menus
- **Multi-directory support** - Multiple directory pages per site
- **Dynamic navigation** - Auto-generated from configuration
- **Per-directory filtering** - Configurable filter fields (single/multi-select)
- **Static site generation** - Fast, secure, CDN-ready
- **Separate data sources** - Each site connects to its own NocoDB base
- Client-side filtering by tags/properties
- Individual detail pages for each item
- Responsive design with Tailwind CSS
- HTTPS deployment with Nginx

### Planned Enhancements ⏳
- Rebuild webhook from NocoDB on data changes
- Enhanced UI/UX improvements
- Search functionality across all fields
- Image support in item cards
- Pagination for large directories
- SEO optimization (meta tags, sitemaps)
- Support for multiple sites with separate domains

## Adding a New Site

1. **Create site directory:**
   ```bash
   cd frontend
   mkdir -p sites/my-site
   ```

2. **Add site configuration** to `sites/site-config.yml`:
   ```yaml
   - id: my-site
     name: "My Site Directory"
     domain: "directory.example.org"
     directories_config: "sites/my-site/directories.yml"
     env_file: "sites/my-site/.env"
     output_dir: "_site/my-site"
     theme:
       colors:
         primary: "#DC2626"
         secondary: "#EA580C"
     branding:
       logo: "/assets/logos/my-site.svg"
     header_menu:
       - label: "About"
         url: "https://example.org/about"
         external: true
     footer:
       text: "© 2025 Example Organization"
       menu:
         - label: "Privacy"
           url: "https://example.org/privacy"
   ```

3. **Create `.env` file** at `sites/my-site/.env`:
   ```bash
   NOCODB_BASE_URL=https://nocodb.example.org
   NOCODB_API_TOKEN=your-token-here
   NOCODB_PROJECT_ID=your-project-id
   ```

4. **Create `directories.yml`** at `sites/my-site/directories.yml`:
   ```yaml
   directories:
     - id: projects
       name: Projects
       path: /projects
       nocodb:
         table_id: your-table-id
         view_id: your-view-id
       display:
         title_field: Title
         description_field: Description
         status_field: Status
       filters:
         - field: Category
           label: Category
           type: single
   ```

5. **Add build scripts** to `package.json`:
   ```json
   "build:my-site": "SITE_ID=my-site eleventy",
   "dev:my-site": "SITE_ID=my-site eleventy --serve"
   ```

6. **Test locally:**
   ```bash
   cd /Users/simon/Library/Mobile\ Documents/com\~apple\~CloudDocs/Dev/ProjectTogether/pt_open_source/server_pt-primary/apps/directory_multisites/frontend && npm run dev:bauturbo
   # Visit: http://localhost:8080/
   ```

## Deployment

### Deployment Locations

**pt-general-1 (138.199.175.147):**
- Bauturbo site: `directory.umsetzungslabor-bauturbo.de`
- Deployment: `/var/www/directory/`
- Uses automated rsync deployment script

**pt-web-1 (188.245.90.198):**
- PT Directory: `directory.projecttogether.net`
- Location: `/srv/projects/pt-app-directory_multisites_1/frontend/_site/pt_directory/`
- Nginx serves static files directly from this location

### Deployment Workflow

**For pt-general-1 (bauturbo):**
```bash
cd frontend

# Deploy specific site (recommended)
./scripts/rebuild-and-deploy.sh bauturbo

# Deploy all sites
./scripts/rebuild-and-deploy.sh
```

**What happens:**
- ✅ Cache cleared - Always fetches fresh data from NocoDB
- ✅ Site built - Generates latest HTML/CSS/JS
- ✅ Files deployed - Synced directly to `/var/www/directory/` via rsync
- ✅ No sudo required - Uses group permissions (www-data)

**For pt-web-1 (pt_directory):**
```bash
# SSH to pt-web-1
ssh simon@188.245.90.198

# Navigate to project
cd /srv/projects/pt-app-directory_multisites_1/frontend

# Pull latest code (if changes)
git pull

# Rebuild site
npm run build

# Site updates automatically (nginx serves from _site/pt_directory/)
```

### Prerequisites

**pt-general-1 server setup (one-time):**

```bash
# Add deployment user to www-data group
sudo usermod -a -G www-data simon

# Make directory group-writable with setgid
sudo chmod -R g+w /var/www/directory
sudo find /var/www/directory -type d -exec chmod g+s {} \;

# Verify permissions
ls -la /var/www/directory
# Should show: drwxrwsr-x www-data www-data
```

**pt-web-1 server setup (complete):**
- ✅ Node.js and npm installed
- ✅ Project cloned to `/srv/projects/pt-app-directory_multisites_1/`
- ✅ Nginx configured to serve from `_site/pt_directory/`
- ✅ SSL certificate configured for `directory.projecttogether.net`
- ✅ Simon user has git access and can rebuild sites

**SSH configuration:**

Add to `~/.ssh/config`:
```
Host primary
    HostName 138.199.175.147
    User simon
    IdentityFile ~/.ssh/id_rsa
```

### Manual Deployment (if needed)

```bash
# Build specific site
npm run build:bauturbo

# Deploy manually
rsync -rlpgoDvz --delete --no-perms --no-times -e ssh _site/bauturbo/ primary:/var/www/directory/
```

### Automated Rebuilds

**Daily rebuild cron job:**

```bash
# SSH into the server and add to crontab
ssh primary
crontab -e

# Rebuild and deploy daily at 2 AM (adjust path to your frontend directory)
0 2 * * * cd /home/simon/pt_open_source/server_pt-primary/apps/directory_multisites/frontend && ./scripts/rebuild-and-deploy.sh bauturbo >> /var/log/directory-deploy.log 2>&1
```

**View deployment logs:**
```bash
tail -f /var/log/directory-deploy.log
```

## Nginx Configuration

### pt-general-1 (Bauturbo)

**Bauturbo Site** (`/etc/nginx/sites-available/directory.umsetzungslabor-bauturbo.de`):
```nginx
server {
    listen 80;
    server_name directory.umsetzungslabor-bauturbo.de;

    root /var/www/directory;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
}
```

**HTTPS:** Managed by Certbot
```bash
sudo certbot --nginx -d directory.umsetzungslabor-bauturbo.de
```

**File Permissions:**
- Directory: `/var/www/directory/`
- Owner: `www-data:www-data`
- Permissions: `drwxrwsr-x` (group-writable with setgid)
- Deployment user: Member of `www-data` group

### pt-web-1 (PT Directory)

**PT Directory Site** (`/etc/nginx/sites-available/directory.projecttogether.net`):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name directory.projecttogether.net;

    root /srv/projects/pt-app-directory_multisites_1/frontend/_site/pt_directory;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name directory.projecttogether.net;

    root /srv/projects/pt-app-directory_multisites_1/frontend/_site/pt_directory;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/directory.projecttogether.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/directory.projecttogether.net/privkey.pem;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

**HTTPS:** Managed by Certbot
```bash
sudo certbot --nginx -d directory.projecttogether.net
```

**File Access:**
- Location: `/srv/projects/pt-app-directory_multisites_1/frontend/_site/pt_directory/`
- Owner: `simon:simon`
- Nginx serves files directly (no rsync needed)
- Updates apply immediately after rebuild

## NocoDB Setup

### Creating a New Directory

1. **Create your data structure in NocoDB:**
   - Create a new table or use an existing one
   - Create a view with the records you want to display
   - Note the table ID and view ID from the URL

2. **Add to site's directories configuration:**
   Edit `sites/{site-id}/directories.yml` and add your directory:
   ```yaml
   - id: my-directory
     name: My Directory
     path: /my-directory
     nocodb:
       table_id: your_table_id
       view_id: your_view_id
     display:
       title_field: Name
       description_field: Description
       status_field: Status
     filters:
       - field: Category
         label: Category
         type: single
   ```

3. **Rebuild and deploy:**
   ```bash
   npm run build:sitename
   # Deploy as usual
   ```

### Filter Configuration

Filters are defined per-directory in `directories.yml`:

- **`type: single`** - Regular field (exact match filtering)
- **`type: multi_select`** - Comma-separated values (checks if value is in list)

The system automatically extracts unique values from your data to populate filter options.

## Troubleshooting

### Build Failures
- Verify `SITE_ID` matches a site in `sites/site-config.yml`
- Check site's `.env` file exists with correct NocoDB credentials
- Verify table and view IDs in site's `directories.yml` are correct
- Check YAML syntax: `npx js-yaml sites/site-config.yml`
- Clear 11ty cache: `rm -rf .cache _site`

### Deployment Issues
- **Permission denied:** Verify user is in `www-data` group: `groups` (should show www-data)
- **Can't write files:** Check directory permissions: `ls -la /var/www/directory` (should be `drwxrwsr-x www-data www-data`)
- **Sudo password required:** Run setup commands again (see Deployment Prerequisites)
- **Rsync errors:** Add `--verbose` flag to see detailed errors
- **Site not updating:** Clear cache: `rm -rf .cache _site` then rebuild

### Cache Issues
- **Old data showing:** Cache is automatically cleared by deployment script
- **Manual cache clear:** `rm -rf .cache _site`
- **Force fresh build:** Delete `.cache` before running `npm run build:sitename`

### Data Not Showing
- Verify NocoDB credentials in site's `.env` file
- Check NocoDB API token validity
- Verify table/view IDs are correct
- Clear cache and rebuild: `rm -rf .cache _site && npm run build:bauturbo`
- Check NocoDB API is accessible: `curl $NOCODB_BASE_URL`

## How It Works

1. **Site Selection:** `SITE_ID` environment variable selects which site to build
2. **Configuration Loading:** `siteConfig.js` loads site-specific settings from `site-config.yml`
3. **Environment Variables:** Each site's `.env` file is loaded for NocoDB credentials
4. **Directory Configuration:** Each site's `directories.yml` defines its directory pages
5. **Data Fetching:** `directories.js` fetches data from site-specific NocoDB tables
6. **Theming:** CSS variables apply site-specific colors and fonts at build time
7. **Output:** Each site builds to its own directory in `_site/{site-id}/`
8. **Deployment:** Each site's directory is deployed to its own Nginx server block

## Benefits

✅ **Single Codebase:** One source of truth, easier maintenance  
✅ **Centralized Updates:** Bug fixes and features benefit all sites  
✅ **Isolated Data:** Each site has its own NocoDB base  
✅ **Custom Branding:** Per-site colors, fonts, logos  
✅ **Flexible Configuration:** Easy to add new sites  
✅ **Separate Deployments:** Can deploy sites individually  
✅ **Static Output:** Fast, secure, CDN-ready  
✅ **No Runtime Dependencies:** Pure HTML/CSS/JS, no server needed  

## Documentation

- **MULTI-SITE.md** - Detailed multi-site architecture documentation
- **README.md** (this file) - Quick reference and setup guide
