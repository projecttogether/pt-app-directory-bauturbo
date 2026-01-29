require("dotenv").config();
const { fetchAllRows } = require("./nocodbFetch");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

function warnMissingFields(keys, fields, context) {
    const missing = fields.filter((field) => field && !keys.has(field));
    if (missing.length > 0) {
        console.warn(`[directories] Missing fields in NocoDB view (${context}): ${missing.join(", ")}`);
    }
}

module.exports = async function () {
    try {
        // Load config from frontend root
        const configPath = path.join(__dirname, "../../config.yml");
        const fileContents = fs.readFileSync(configPath, "utf8");
        const config = yaml.load(fileContents);
        
        const { directories } = config;
        
        // Get NocoDB credentials from environment
        const nocodb = {
            base_url: process.env.NOCODB_BASE_URL,
            project_id: process.env.NOCODB_PROJECT_ID,
            api_token: process.env.NOCODB_API_TOKEN
        };

        if (!nocodb.base_url || !nocodb.project_id || !nocodb.api_token) {
            console.warn("Missing NocoDB configuration, returning empty directories.");
            return [];
        }

        const results = [];
        const publishField = "publish";

        const isPublished = (value) => {
            if (value === true) return true;
            if (value === 1) return true;
            if (typeof value === "string") {
                const normalized = value.trim().toLowerCase();
                return normalized === "true" || normalized === "1" || normalized === "yes";
            }
            return false;
        };

        let totalItems = 0;
        // Fetch data for each configured directory
        for (const directory of directories) {
            const { id, name, path, description, nocodb: dirNocodb, display, filters } = directory;

            if (!dirNocodb.table_id || !dirNocodb.view_id) {
                console.warn(`Missing table/view config for directory: ${id}`);
                continue;
            }

            const baseUrl = `${nocodb.base_url}/api/v1/db/data/noco/${nocodb.project_id}/${dirNocodb.table_id}/views/${dirNocodb.view_id}`;

            try {
                const allItems = await fetchAllRows(baseUrl, {
                    headers: {
                        "xc-token": nocodb.api_token,
                    }
                });
                const publishedItems = allItems.filter((item) => isPublished(item[publishField]));
                if (allItems.length > 0 && publishedItems.length === 0) {
                    console.warn(`All items were filtered out by publish for directory: ${id}. Ensure the 'publish' field is in the NocoDB view and set to true.`);
                }

                const items = publishedItems.map((item) => {
                    const cleaned = { ...item };
                    delete cleaned[publishField];
                    return cleaned;
                });

                if (allItems.length > 0) {
                    const keys = new Set(Object.keys(allItems[0]));
                    const displayFields = [
                        display && display.title_field,
                        display && display.excerpt_field,
                        display && display.status_field,
                        display && display.start_date_field
                    ];
                    const detailFields = (display && display.detail_fields ? display.detail_fields.map((field) => field.field) : []);
                    const filterFields = (filters || []).map((filter) => filter.field);
                    warnMissingFields(keys, [publishField, ...displayFields, ...detailFields, ...filterFields], `directory:${id}`);
                }

                // Extract filter options from the actual data
                const filterOptions = (filters || []).map(filter => {
                    if (filter.type === "date_range") {
                        // Extract years from date field
                        const years = new Set();
                        items.forEach(item => {
                            const dateValue = item[filter.field];
                            if (dateValue) {
                                const date = new Date(dateValue);
                                if (!isNaN(date.getTime())) {
                                    years.add(date.getFullYear());
                                }
                            }
                        });
                        return {
                            ...filter,
                            periods: ["upcoming", "past", "all"],
                            years: Array.from(years).sort((a, b) => b - a) // Sort descending
                        };
                    }
                    
                    const options = new Set();
                    items.forEach(item => {
                        const value = item[filter.field];
                        if (value) {
                            if (filter.type === "multi_select") {
                                // Handle comma-separated values
                                const values = String(value).split(",");
                                values.forEach(v => options.add(v.trim()));
                            } else {
                                options.add(String(value).trim());
                            }
                        }
                    });
                    return {
                        ...filter,
                        options: Array.from(options).sort()
                    };
                });

                results.push({
                    id,
                    name,
                    path,
                    description,
                    display,
                    items,
                    filters: filterOptions
                });
                totalItems += items.length;

            } catch (e) {
                console.error(`Error fetching data for directory ${id}:`, e);
            }
        }

        console.log(`[build] directories: ${results.length}, items: ${totalItems}`);
        return results;
    } catch (e) {
        console.error("Error loading directories:", e);
        return [];
    }
};
