# NocoDB Configuration & Authoring Guide

Bauturbo Directory uses **NocoDB** as a headless CMS. Pages and directory entries are authored in NocoDB, and then the 11ty static site generator fetches this data via the NocoDB API during the build process to generate the static website.

## Page Authoring (NocoDB-driven)

Pages are managed centrally through NocoDB:
- **Pages**: Defined in NocoDB (one row per page) and rendered by `frontend/src/pages.njk`.
- **Sections**: Described via `section_*` fields and rendered through `frontend/src/_includes/components/sections/page-sections.njk`. 
- **Data Flow**: Page data is loaded in `frontend/src/_data/pages.js` and exposed as a list in `frontend/src/_data/pagesList.js`.
- **Styles**: Shared content and component styles live in `frontend/src/assets/styles/content.css`.

### Legacy Markdown Authoring (Deprecated)
Older Markdown-based pages under `frontend/src/pages/` are no longer used in this branch and should be considered deprecated.

---

## Adding a New Directory Section

If you need to create a completely new directory listing (e.g., adding a "News" directory or a "Resources" section), follow these steps:

1. **Create table/view in NocoDB**
   - Create a new table in your NocoDB base.
   - Set up the necessary columns (Title, Description, Date, Category filters, etc.).
   - Create a specific **View** (e.g., a Grid View) that you want the frontend to pull data from.
   - Note down the `table_id` and the `view_id`.

2. **Edit `config.yml` in the Frontend**
   Add your new directory to the `directories` array in `frontend/config.yml`:

   ```yaml
   directories:
       - id: new-directory
         name: New Directory
         path: /new
         nocodb:
             table_id: your_table_id_here
             view_id: your_view_id_here
         display:
             title_field: Title
             excerpt_field: Description
         filters:
             - field: Category
               type: single
   ```

3. **Rebuild the Frontend**
   Run the build script to fetch the new data and generate the pages:
   ```bash
   npm run build
   ```

---

## Troubleshooting NocoDB Data

If your data is not showing up or the build is failing, check the following:

- **Missing Data on the Live Site**:
  Since the site is completely static, changes made inside NocoDB will not be reflected on the live site until the frontend container/site is rebuilt. You must trigger a redeploy (e.g., in Coolify or run locally).

- **Data Fetch Failures**:
  - Verify your `NOCODB_API_TOKEN` in the `.env` file or hosting environment variables.
  - Check that the `table_id` and `view_id` in `config.yml` match the IDs in your NocoDB URL exactly.
  - Clear the local cache to force a fresh fetch: `rm -rf .cache _site`, then rebuild.
