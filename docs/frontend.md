# Frontend Architecture Guide

The Bauturbo Directory frontend is a static site built with **Eleventy (11ty)**, customized with **TailwindCSS**, and populated by data from **NocoDB**. 

This document explains the core architecture to help new developers navigate and expand the codebase.

## 1. The Build Lifecycle
When `npm run build` is executed, the following sequence occurs:

1. **TailwindCSS Generation**: `build:tailwind` processes `src/assets/styles/tailwind.css` and generates the final CSS bundle into the `_site/` directory based on the utility classes found in the `.njk` templates.
2. **Eleventy Data Fetch**:
   - 11ty runs the asynchronous JavaScript files in `src/_data/`.
   - `directories.js` calls the NocoDB API to fetch all database records for the configured directories, applies publish filters, extracts unique filter options (like categories and dates), and exposes this structured array globally as `directories`.
   - `pages.js` makes similar API calls to fetch modular page configurations, sorting them into a nested object structure by `page_id`.
3. **Template Compilation**:
   - The main `.njk` (Nunjucks) templates digest this global data.
   - 11ty outputs static HTML files into `_site/`.

## 2. Directory Structure

```text
frontend/
├── .eleventy.js              # Global 11ty config (filters, plugins, layouts)
├── config.yml                # Master configuration (colors, paths, nocoDB mappings)
├── src/
│   ├── _data/                # Build-time API calls (Node.js)
│   │   ├── directories.js    # Transforms raw NocoDB data into the `directories` object
│   │   ├── pages.js          # Transforms raw NocoDB data into the `pages` object
│   │   └── siteConfig.js     # Exposes config.yml to the templates
│   ├── _includes/
│   │   ├── components/       # UI building blocks
│   │   │   ├── directories-tabs/ # Complex client-side filtering logic
│   │   │   └── sections/     # Modular layout blocks driven by `pages.js`
│   │   └── layouts/          # The base HTML wrappers (base.njk)
│   ├── assets/               # Raw CSS, Fonts, Images
│   ├── item-detail.njk       # Template generating `/directory-path/item-slug/` pages
│   └── pages.njk             # Template generating modular root pages (`/`, `/about/`)
```

## 3. Core Concepts

### Nunjucks (`.njk`) and 11ty Filters
We primarily use [Nunjucks](https://mozilla.github.io/nunjucks/) for templating. Reusable UI chunks live in `_includes/components/` and are included like this:
```njk
{% include "components/navbar.njk" %}
```
Specific data parsing (like trimming strings or formatting dates) is heavily reliant on **11ty custom filters** defined in `.eleventy.js`. E.g., `{{ item.date | formatDate }}`.

### Modular Pages Structure
The file `pages.njk` uses 11ty pagination to iterate over every page defined in NocoDB.
It wraps the content in `base.njk` and iterates through the `section_i_type` variables. It delegates the actual rendering to `src/_includes/components/sections/page-sections.njk`, which acts as a switch-board, including components like `hero.njk` or `text_image_split.njk` based on the NocoDB configuration.

### Directory Detail Pages
Similarly, `item-detail.njk` iterates over all items inside all directories, creating unique landing pages based on the mappings defined in `config.yml` (e.g. interpreting markdown blobs or rendering download buttons based on the `display` config).

### Client-Side JavaScript
Because 11ty generates static HTML, dynamic interactions like filtering the directory grids are handled client-side via Vanilla JS. 
This logic is generally embedded directly at the bottom of the relevant Nunjucks components (look inside `src/_includes/components/directories-tabs/`). It works by reading HTML `data-*` attributes injected during the build step.

## 4. Styling & Tailwind
The application uses **TailwindCSS (v4)**.
- Base configurations like brand colors are defined in `config.yml` and injected into the `<head>` as CSS variables (e.g., `--color-primary-accent`) in `base.njk`.
- The main CSS entry point is `src/assets/styles/tailwind.css`. It heavily imports specific component styles from `src/assets/styles/content.css`.
- While Tailwind utilities are used extensively, custom classes are sometimes used for complex animations or legacy elements. Always run `npm run dev` to ensure the Tailwind watcher runs concurrently with 11ty.
