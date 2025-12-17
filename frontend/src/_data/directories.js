const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function () {
    const config = require("./directoryConfig")();
    const { directories, nocodb } = config;

    if (!nocodb.base_url || !nocodb.project_id || !nocodb.api_token) {
        console.warn("Missing NocoDB configuration, returning empty directories.");
        return [];
    }

    const results = [];

    // Fetch data for each configured directory
    for (const directory of directories) {
        const { id, name, path, nocodb: dirNocodb, display, filters } = directory;

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
                display,
                items,
                filters: filterOptions
            });

        } catch (e) {
            console.error(`Error fetching data for directory ${id}:`, e);
        }
    }

    return results;
};
