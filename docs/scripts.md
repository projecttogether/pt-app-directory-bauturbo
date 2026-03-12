# Scripts and Utilities Guide

The Bauturbo Directory includes several utility scripts to assist with data migration, testing, and historically, server deployment.

## Frontend Scripts (`frontend/scripts/`)

### `migrate-gdrive-files.js`
This script was historically used to migrate or sync attachments hosted on Google Drive down to a format usable directly or handled by NocoDB. 
- **Usage Context**: Typically a one-time operation or a fallback tool. Ensure you check the internal logic before running it with live production keys.

### `test-api.js`
A lightweight debugging script to verify the connection between the frontend and NocoDB without running the entire 11ty build process. 
- **Usage**:
  ```bash
  cd frontend
  node scripts/test-api.js
  ```
- **Purpose**: Validates that your `.env` tokens are correct and that the NocoDB IDs in `config.yml` actually return a successful payload.

### `test-local.sh`
A bash script to spin up a quick local build and test environment natively.

