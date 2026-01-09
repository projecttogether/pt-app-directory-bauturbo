const EleventyFetch = require("@11ty/eleventy-fetch");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

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

        // Fetch data for each configured directory
        for (const directory of directories) {
            const { id, name, path, description, nocodb: dirNocodb, display, filters } = directory;

            if (!dirNocodb.table_id || !dirNocodb.view_id) {
                console.warn(`Missing table/view config for directory: ${id}`);
                continue;
            }

            const url = `${nocodb.base_url}/api/v1/db/data/noco/${nocodb.project_id}/${dirNocodb.table_id}/views/${dirNocodb.view_id}?limit=1000`;

            try {
                const json = await EleventyFetch(url, {
                    duration: "1h",
                    type: "json",
                    fetchOptions: {
                        headers: {
                            "xc-token": nocodb.api_token,
                        },
                    },
                });

                const items = json.list || [];

                // Extract filter options from the actual data
                const filterOptions = filters.map(filter => {
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

            } catch (e) {
                console.error(`Error fetching data for directory ${id}:`, e);
            }
        }

        return results;
    } catch (e) {
        console.error("Error loading directories:", e);
        return [];
    }
};
