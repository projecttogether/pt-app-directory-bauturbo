// This script migrates files from Google Drive to NocoDB

// Usage: node scripts/migrate-gdrive-files.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const yaml = require('js-yaml');

const NOCODB_URL = process.env.NOCODB_BASE_URL;
const PROJECT_ID = process.env.NOCODB_PROJECT_ID;
const API_TOKEN = process.env.NOCODB_API_TOKEN;

// Quick helper to fetch all records from a NocoDB view
async function fetchRecords(tableId, viewId) {
    const records = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const url = `${NOCODB_URL}/api/v1/db/data/noco/${PROJECT_ID}/${tableId}/views/${viewId}?offset=${offset}&limit=${limit}`;
        const res = await fetch(url, { headers: { 'xc-token': API_TOKEN } });
        if (!res.ok) throw new Error(`Failed to fetch records: ${await res.text()}`);
        
        const data = await res.json();
        const list = data.list || [];
        records.push(...list);
        
        if (list.length < limit) break;
        offset += limit;
    }
    return records;
}

// Extract Google Drive ID
function extractDriveId(url) {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('id');
}

// Download file from Google Drive
async function downloadFromDrive(fileId) {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`Google Drive download failed: ${res.statusText}`);
    
    // Sometimes Google returns an HTML warning page for large files.
    // We'll check the content-type.
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
        console.warn(`Warning: Google Drive returned HTML for file ${fileId}. It might be a large file virus warning.`);
    }

    const buffer = await res.arrayBuffer();
    return { buffer: Buffer.from(buffer), contentType };
}

// Upload to NocoDB Storage
async function uploadToNocoDB(buffer, filename, contentType) {
    const form = new FormData();
    const blob = new Blob([buffer], { type: contentType || 'application/octet-stream' });
    form.append('file', blob, filename);

    // Try v1 storage upload first, this usually works for older setups or noco specific endpoints
    const url = `${NOCODB_URL}/api/v1/db/storage/upload`;
    
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'xc-token': API_TOKEN },
        body: form
    });
    
    // if 404, we could try: /api/v2/storage/upload
    if (!res.ok) {
        const urlV2 = `${NOCODB_URL}/api/v2/storage/upload`;
        const resV2 = await fetch(urlV2, {
            method: 'POST',
            headers: { 'xc-token': API_TOKEN },
            body: form
        });
        if (!resV2.ok) {
            throw new Error(`Failed to upload to NocoDB: ${await resV2.text()}`);
        }
        return await resV2.json();
    }
    
    return await res.json();
}

// Update the record with the file metadata
async function updateRecord(tableId, recordId, fileData) {
    const payload = {};
    // NocoDB sometimes requires 'Id' (capitalized) in its API payload even if the frontend key is 'id'
    // but increasingly newer versions accept 'id'. We send both to be safe or rely on what works.
    payload.Id = recordId;
    payload.id = recordId;
    payload.file_1 = fileData;
    
    // NocoDB V2 update records endpoint
    const urlV2 = `${NOCODB_URL}/api/v2/tables/${tableId}/records`;
    console.log(`updateData v2: ${urlV2}`, { id: recordId, file_1: "..." });
    let res = await fetch(urlV2, {
        method: 'PATCH',
        headers: {
            'xc-token': API_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        // Fallback to bulk update format for V2
        res = await fetch(urlV2, {
            method: 'PATCH',
            headers: {
                'xc-token': API_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([payload])
        });
    }

    if (!res.ok) {
        throw new Error(`Failed to update record: ${await res.text()}`);
    }
    
    return await res.json();
}


async function run() {
    console.log("Starting Google Drive to NocoDB migration script...");
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');
    
    if (isDryRun) {
        console.log("⚡ DRY RUN MODE ENABLED. No changes will be saved to NocoDB. ⚡");
    }

    const configPath = require('path').join(__dirname, '../config.yml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

    for (const dir of config.directories) {
        console.log(`\n=== Processing table for directory: ${dir.name} ===`);
        const { table_id, view_id } = dir.nocodb;
        
        try {
            const records = await fetchRecords(table_id, view_id);
            console.log(`Found ${records.length} records in view.`);
            
            let processed = 0;
            let skipped = 0;
            let errors = 0;

            for (const record of records) {
                const fileUrl = record.file_url;
                const file1 = record.file_1;
                const recId = record.id || record.Id;

                // Check if file_url exists, is from google drive, and file_1 is empty
                if (fileUrl && fileUrl.includes('drive.google.com')) {
                    const isFile1Empty = !file1 || (Array.isArray(file1) && file1.length === 0) || file1 === "";
                    
                    if (isFile1Empty) {
                        console.log(`Record ${recId} (${record.title}): Needs migration (${fileUrl})`);
                        try {
                            const driveId = extractDriveId(fileUrl);
                            if (!driveId) {
                                console.log(`  -> Invalid Google Drive URL structure. Skipping.`);
                                skipped++;
                                continue;
                            }
                            
                            console.log(`  -> Downloading file ID: ${driveId}...`);
                            if (!isDryRun) {
                                const { buffer, contentType } = await downloadFromDrive(driveId);
                                console.log(`  -> Downloaded ${buffer.length} bytes. Uploading to NocoDB...`);
                                
                                const filename = `imported_${driveId}.pdf`; 
                                const uploadResult = await uploadToNocoDB(buffer, filename, contentType);
                                
                                console.log(`  -> Uploaded successfully. Updating record ${recId}...`);
                                
                                const attachmentData = Array.isArray(uploadResult) ? uploadResult : [uploadResult];
                                await updateRecord(table_id, recId, attachmentData);
                                
                                console.log(`  -> Record updated!`);
                                processed++;
                            } else {
                                console.log(`  -> [Dry Run] Would download and upload Drive ID: ${driveId}`);
                                processed++;
                            }
                        } catch (err) {
                            console.error(`  -> ❌ Error processing record ${recId}:`, err.message);
                            if (err.message.includes('413')) {
                                console.log(`     (This is likely a NocoDB server file size limit issue on ~25MB files. You might need to compress the file and upload manually).`);
                            }
                            errors++;
                        }
                    } else {
                        // file_1 already has data
                        skipped++;
                    }
                } else {
                    skipped++;
                }
            }
            
            console.log(`Done with ${dir.name}. Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);

        } catch (err) {
            console.error(`Error processing directory ${dir.name}:`, err.message);
        }
    }
    
    console.log("\nMigration completed!");
}

run();
