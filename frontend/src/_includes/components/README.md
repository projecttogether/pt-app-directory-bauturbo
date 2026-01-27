# Components

Reusable Nunjucks components for pages. Components are included inside Markdown pages and are responsible for complex UI sections.

## Usage in Markdown pages

```md
{% include "components/directories-tabs.njk" %}
```

## Guidelines
- Keep layout and typography in shared CSS (`/assets/styles/content.css`).
- Keep interactive sections (filters, tabs, forms) inside components.
- Prefer theme variables from `config.yml` (via CSS vars) for colors.
- Components should be self-contained and not depend on page-specific markup.
- Use `content-container` inside components to match site width.

## Available components
- `directories-tabs.njk` — Tabs + filters + cards for directory content.
- `four-box-links.njk` — 2x2 grid of link cards with title + description.

## Example: directories-tabs

```md
{% include "components/directories-tabs.njk" %}
```

## Example: four-box-links

```njk
{% set boxes = [
  { title: "Checklisten", url: "/checklisten", description: "Kurzbeschreibung..." },
  { title: "Regeln, Verfahren und Ablaeufe", url: "/regeln", description: "Kurzbeschreibung..." },
  { title: "Best Practices", url: "/best-practices", description: "Kurzbeschreibung..." },
  { title: "Argumentationsgrundlagen", url: "/argumente", description: "Kurzbeschreibung..." }
] %}

{% include "components/four-box-links.njk" %}
```
