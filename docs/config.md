# Frontend Configuration Guide (`config.yml`)

The Bauturbo Directory platform is highly customizable through a central configuration file located at `frontend/config.yml`. This file controls the site's global metadata, theme settings, navigation, and how NocoDB data is mapped to directory pages.

## Table of Contents
1. [Site Information](#1-site-information)
2. [Theme Customization](#2-theme-customization)
3. [Branding](#3-branding)
4. [Navigation & Footer](#4-navigation--footer)
5. [Pages Configuration](#5-pages-configuration)
6. [Directories Configuration](#6-directories-configuration)

---

## 1. Site Information
Basic metadata used for SEO, browser titles, and global site identifiers.

```yaml
site:
    name: "Umsetzungslabor Praxiswissen"
    domain: "praxiswissen.umsetzungslabor-bauturbo.de"
```

## 2. Theme Customization
The application’s styling uses CSS variables that are generated dynamically based on these settings.

```yaml
theme:
    colors:
        primary_accent: "#007194"     # Main brand color
        primary_accent_light: "#87bccd" # Lighter variant for hover states
        secondary_accent: "#cd5038"   # Highlighting color
        background: "#ffffff"         # Global background
        text: "#3c3c3c"               # Primary text color
        gray_light: "#e0e0e0"         # Borders and subtle backgrounds
        gray_dark: "#ACACAC"          # Muted text
    fonts:
        heading: "Inter, system-ui, sans-serif"
        body: "Inter, system-ui, sans-serif"
```
*Note: The platform is built with Tailwind CSS, but these specific tokens are injected globally to configure the base theme.*

## 3. Branding
Paths to the logo and favicon assets. These should be placed in `frontend/src/assets/logos/` and `frontend/src/assets/favicons/`.

```yaml
branding:
    logo: "/assets/logos/logo_bauturbo.png"
    favicon: "/assets/favicons/logo_bauwende.png"
```

## 4. Navigation & Footer

### Header Menu
Controls the links appearing in the top navigation bar.

```yaml
header_menu:
    - label: "Arbeitshilfen"
      url: "#arbeitshilfen"     # Internal anchor
      external: false
    - label: "Wissen einbringen"
      url: "https://forms.projecttogether.org/r/bau-turbo-praxiswissen"
      external: true            # Opens in a new tab
      is_btn: true              # Styles the link as a prominent button
```

### Footer
Configures the copyright text and the secondary navigation menu at the bottom of the page.

```yaml
footer:
    text: "© Bauwende Allianz, 2026"
    menu:
        - label: "Impressum"
          url: "https://bauwende-allianz.org/impressum"
        - label: "Datenschutz"
          url: "https://bauwende-allianz.org/datenschutzerklaerung"
```

---

## 5. Pages Configuration
Controls how the static pages are fetched from NocoDB.

```yaml
pages:
    nocodb:
        table_id: m6bsb0bhilydrdd
        view_id: vw52xovvwfpl9ewq
    max_sections: 8                   # Maximum number of modular sections a page can have
    nocodb_fields:
        page_id: page_id              # Field mappings
        title: title
        permalink: permalink
        publish: publish
```

---

## 6. Directories Configuration
This is the most powerful section of the configuration. It dictates how distinct databases (directories) in NocoDB are fetched, displayed, and filtered on the frontend.

Each directory is an object in the `directories` array:

```yaml
directories:
    - id: umsetzungslabor
      name: "Umsetzungslabor"
      path: /umsetzungslabor   # URL path where this directory lives
      description: "Welche Erkenntnisse..."
      nocodb:
          table_id: muzi9nd3952dvly   # NocoDB Table ID
          view_id: vwshwh1ilh9k9p1c   # NocoDB View ID
```

### Display & Field Mapping
You must map NocoDB columns to frontend layout areas.

```yaml
      display:
          title_field: title          # NocoDB column for item title
          excerpt_field: excerpt      # NocoDB column for short description
          detail_fields:              # Array mapping remaining fields to layout sections
              - field: published_date
                label: "Veröffentlichungsdatum"
                type: month_year      # Formatter type
                section: meta         # Placement: 'meta', 'body', 'files', or 'links'
              - field: file_1
                label: "Datei"
                type: file
                section: files
```
*Available Placement Sections:*
- `meta`: Displayed as small tags/metadata on the item card and detail view.
- `body`: The main descriptive content (supports `type: markdown`).
- `files`: Downloadable attachment links.
- `links`: External URL references.

### Filters
Defines how users can filter the directory on the frontend. `11ty` automatically extracts the unique available options based on the data directly from NocoDB.

```yaml
      filters:
          - field: zielgruppe         # Exactly matches the NocoDB column name
            label: "Zielgruppe"       # User-facing label
            type: multi_select        # Filter behavior (e.g. multi_select, date_range)
          - field: published_date
            label: "Zeitraum"
            type: date_range
```
