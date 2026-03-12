# NocoDB Schema Requirements

For the Bauturbo Directory platform to successfully build, the underlying NocoDB tables (`directories` and `pages`) must adhere to specific schemas. The 11ty static site generator expects certain column names and data types to render the content correctly.

## 1. Directory Items Table Schema

This schema applies to any table acting as a "Directory" (e.g., *Umsetzungslabor*, *Veranstaltungen*, *Publikationen*).

### Mandatory Core Fields
These fields are required by the main build pipeline in `directories.js`:

| Field Name | Expected Type | Description |
|---|---|---|
| `publish` | Checkbox (Boolean) | **Crucial:** Determines if the item is visible on the site. If this column is missing or unchecked, the item will not be built. |
| `title`* | Single Line Text | The main title of the directory item. |
| `excerpt`* | Long Text | A short summary shown on the preview cards. |

*\* Note: `title` and `excerpt` are configurable via `title_field` and `excerpt_field` in `config.yml`. The table displays the default configuration.*

### Common Detail Fields
These fields map to the `detail_fields` array in `config.yml`. Their presence depends on your configuration, but common types include:

| Common Field Name | Expected Type | Purpose | Layout Section |
|---|---|---|---|
| `from` | Single Line Text | The publisher or author. | `meta` |
| `published_date` | Date / Single Line | The release date. | `meta` |
| `description` | Markdown / Long Text | The main body content. | `body` |
| `file_1` | Attachment | A downloadable file. | `files` |
| `url_1`, `url_2` | URL | External resource links. | `links` |

### Filter Fields
If a field is declared in the `filters` array in `config.yml`, it **must** exist in the table. 
- For `multi_select` filters, NocoDB should provide a comma-separated string (e.g., `Option A, Option B`).
- For `date_range` filters, the field should output valid date strings (e.g., `YYYY-MM-DD`).

---

## 2. Pages Table Schema

This schema applies to the centralized `Pages` table used to build modular landing pages (like the Homepage or Imprint). 
The connection parameters (`table_id` and `view_id`) are defined in `config.yml` under `pages: nocodb:`.

### Mandatory Page Fields
These fields outline the basic page routing and visibility:

| Field Name | Expected Type | Description |
|---|---|---|
| `page_id` | Single Line Text | A unique identifier (e.g., `home`, `about`). |
| `title` | Single Line Text | The browser tab title and default H1. |
| `permalink` | Single Line Text | The URL path (e.g., `/` or `/about/`). |
| `publish` | Checkbox (Boolean) | **Crucial:** Must be checked for the page to build. |

### Modular Section Fields
Pages are built using horizontal structural "sections." The build system (`pages.js`) looks for sequentially numbered section columns (up to the limit defined by `max_sections` in `config.yml`, which defaults to 8).

For *each* section index `i` (from 1 to 8), the following fields can be defined:

| Field Pattern | Expected Type | Description |
|---|---|---|
| `section_i_type` | Single Line / Select | The UI component to render (e.g., `hero`, `text_image_split`, `directories_grid`). If empty or `none`, the section is skipped. |
| `section_i_tag` | Single Line Text | A small overarching tag or kicker above the headline. |
| `section_i_headline` | Single Line Text | The main H2 headline for the section. |
| `section_i_subheadline` | Single Line Text | A secondary subtitle. |
| `section_i_text` | Long Text | Brief introductory text. |
| `section_i_text_extended`| Markdown | Extensive body copy. |
| `section_i_cta_label` | Single Line Text | Button text for a Call to Action. |
| `section_i_cta_url` | URL | Link destination for the Call to Action. |
| `section_i_image` | Attachment | Primary image for the section. |

*Example for Section 1:* `section_1_type`, `section_1_headline`, `section_1_image`, etc.

## Troubleshooting Missing Fields
During the `npm run build` process, the 11ty build scripts (`directories.js` and `pages.js`) will log warnings to the console if configured fields are missing from the NocoDB API response:

```text
[pages] Missing fields in NocoDB view (pages): section_8_image, section_8_cta_label
```
These warnings highlight discrepancies between your `config.yml` expectations and the actual NocoDB view output. Ensure the missing columns are created in NocoDB and are visible in the specific View you are querying.
