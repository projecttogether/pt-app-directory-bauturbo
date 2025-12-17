# Migration Guide: Single to Multi-Directory

## What Changed

The directory system has been refactored to support multiple directory pages with a centralized YAML configuration.

### Key Changes:

1. **New Configuration File**: `config/directories.yml`
   - Central configuration for all directories
   - Replaces hardcoded environment variables for table/view IDs
   - Defines filters per directory

2. **Simplified Environment Variables**: `.env`
   - Now only contains: `NOCODB_BASE_URL`, `NOCODB_API_TOKEN`, `NOCODB_PROJECT_ID`
   - Removed: `NOCODB_INITIATIVES_TABLE_ID`, `NOCODB_INITIATIVES_VIEW_ID`, `NOCODB_FILTER_VIEW_ID`

3. **New Templates**:
   - `directory.njk` - Dynamic directory pages (replaces `index.njk`)
   - `item-detail.njk` - Generic detail pages (replaces `initiatives/initiative.njk`)

4. **Updated Data Files**:
   - `_data/directoryConfig.js` - Loads YAML configuration
   - `_data/directories.js` - Fetches all directory data
   - Removed: `_data/initiatives.js`, `_data/filters.js`

5. **Dynamic Navigation**:
   - Header menu now automatically generated from `directories.yml`

## Migration Steps

### 1. Install New Dependencies
```bash
cd frontend
npm install
```

### 2. Update `.env`
Remove the old table/view IDs:
```bash
# OLD (remove these)
NOCODB_INITIATIVES_TABLE_ID=m1upwxd94s5tx1q
NOCODB_INITIATIVES_VIEW_ID=vw0efitq0kedrj5l
NOCODB_FILTER_VIEW_ID=vwgtng3527tq1qsx

# NEW (keep only these)
NOCODB_BASE_URL=https://nocodb.projecttogether.org
NOCODB_API_TOKEN=<your-token>
NOCODB_PROJECT_ID=px8pby5vdjxwo13
```

### 3. Configure Directories
The existing "Initiatives" directory is already configured in `config/directories.yml`.

To add more directories, edit the file following the examples.

### 3a. clear 11ty chache
```bash
rm -rf .cache && echo "Cache cleared"
```

### 4. Test Locally
```bash
npm run dev
```

Navigate to:
- http://localhost:8080/ - Main directory (Initiatives)
- Check the header menu for directory links

### 5. Build and Deploy
```bash
npm run build
rsync -avz -e ssh _site/ hetzner-1:~/directory_temp/
ssh hetzner-1 "sudo cp -r ~/directory_temp/* /var/www/directory/"
```

## Backwards Compatibility

The current "Initiatives" directory configuration matches your existing setup:
- Path: `/` (same as before)
- Table ID: `m1upwxd94s5tx1q`
- View ID: `vw0efitq0kedrj5l`
- Same filters: Status, Tag_1, Tag_2

**URLs remain unchanged:**
- Main page: `/`
- Detail pages: `/items/{id}/` (formerly `/initiatives/{id}/`)

⚠️ **Note**: Detail page URLs have changed from `/initiatives/{id}/` to `/items/{id}/`. 
To maintain old URLs, you can add nginx redirects or adjust the permalink in `item-detail.njk`.

## Cleanup (Optional)

After verifying everything works, you can remove:
- `src/index.njk`
- `src/initiatives/initiative.njk`
- `src/_data/initiatives.js`
- `src/_data/filters.js`

## Adding a Second Directory

Example: Organizations directory

1. **Create table in NocoDB**
2. **Add to `config/directories.yml`:**
   ```yaml
   - id: organizations
     name: Organizations
     path: /organizations
     nocodb:
       table_id: <your-table-id>
       view_id: <your-view-id>
     display:
       title_field: Name
       description_field: Description
       status_field: Type
     filters:
       - field: Category
         label: Category
         type: single
   ```
3. **Rebuild**: `npm run build`
4. **Deploy**

The new directory will automatically appear in the navigation menu!
