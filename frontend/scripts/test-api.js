const { fetchAllRows } = require("../src/_data/nocodbFetch");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

async function testFetch() {
    console.log("Fetching test data...");
    
    // Test the first directory (umsetzungslabor) which reported missing fields
    const nocodb = {
        base_url: process.env.NOCODB_BASE_URL,
        project_id: process.env.NOCODB_PROJECT_ID,
        api_token: process.env.NOCODB_API_TOKEN,
    };
    
    // Read the view IDs from config.yml manually (we'll just use the first one from the warning)
    const fs = require("fs");
    const yaml = require("js-yaml");
    const configPath = require("path").join(__dirname, "../config.yml");
    const config = yaml.load(fs.readFileSync(configPath, "utf8"));
    
    const dir = config.directories.find(d => d.id === 'umsetzungslabor');
    
    if (!dir) {
        console.error("Directory not found in config");
        return;
    }

    const baseUrl = `${nocodb.base_url}/api/v1/db/data/noco/${nocodb.project_id}/${dir.nocodb.table_id}/views/${dir.nocodb.view_id}`;
    
    console.log(`URL: ${baseUrl}`);
    
    try {
        const rows = await fetchAllRows(baseUrl, {
            headers: { "xc-token": nocodb.api_token },
        });
        
        if (rows.length > 0) {
            console.log("\n--- Keys in the first row ---");
            console.log(Object.keys(rows[0]));
            
            console.log("\n--- Full first row data ---");
            console.log(JSON.stringify(rows[0], null, 2));
        } else {
            console.log("No rows returned!");
        }
    } catch (e) {
        console.error("Error fetching:", e.message);
    }
}

testFetch();
