/**
 * Eleventy Data File: Directories
 *
 * This module fetches and processes directory data from NocoDB for use in Eleventy templates.
 * It reads directory configurations from config.yml and fetches corresponding data from
 * NocoDB tables/views, applying publish filters and extracting filter options for the frontend.
 *
 * @returns {Promise<Array>} Array of directory objects with items and filter options
 */

// Imports
require("dotenv").config();
const { fetchAllRows } = require("./nocodbFetch");
const { isPublished } = require("./publish");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * Validates that all required fields are present in the NocoDB response
 * and warns about any missing fields that are expected based on configuration.
 *
 * @param {Set} keys - Set of available field names from NocoDB response
 * @param {Array} fields - Array of expected field names from configuration
 * @param {string} context - Context identifier for the warning message
 */
function warnMissingFields(keys, fields, context) {
    const missing = fields.filter((field) => field && !keys.has(field));
    if (missing.length > 0) {
        console.warn(
            `[directories] Missing fields in NocoDB view (${context}): ${missing.join(", ")}`,
        );
    }
}

/**
 * Main export function that fetches and processes all directory data.
 * This function is automatically called by Eleventy during the build process.
 */
module.exports = async function () {
    try {
        // Load directory configuration from YAML config file
        const configPath = path.join(__dirname, "../../config.yml");
        const fileContents = fs.readFileSync(configPath, "utf8");
        const config = yaml.load(fileContents);

        const { directories } = config;

        // Extract NocoDB connection credentials from environment variables
        const nocodb = {
            base_url: process.env.NOCODB_BASE_URL,
            project_id: process.env.NOCODB_PROJECT_ID,
            api_token: process.env.NOCODB_API_TOKEN,
        };

        // Validate NocoDB configuration - return empty array if missing
        if (!nocodb.base_url || !nocodb.project_id || !nocodb.api_token) {
            console.warn("Missing NocoDB configuration, returning empty directories.");
            return [];
        }

        const results = [];
        const publishField = "publish"; // Field name that controls item visibility
        let totalItems = 0;

        // Process each directory configuration from config.yml
        for (const dir of directories) {
            const { id, name, path, description, nocodb: dirNocodb, display, filters } = dir;

            // Skip directories without proper NocoDB table/view configuration
            if (!dirNocodb.table_id || !dirNocodb.view_id) {
                console.warn(`Missing table/view config for directory: ${id}`);
                continue;
            }

            // Construct NocoDB API URL for this specific table/view
            const baseUrl = `${nocodb.base_url}/api/v1/db/data/noco/${nocodb.project_id}/${dirNocodb.table_id}/views/${dirNocodb.view_id}`;

            try {
                // Fetch all items from NocoDB table/view
                const allItems = await fetchAllRows(baseUrl, {
                    headers: { "xc-token": nocodb.api_token },
                });

                // Filter items based on publish status
                // const publishedItems = allItems.filter((item) => isPublished(item[publishField]));
                const publishedItems = allItems; // temporary disabling publish filter as field is not being included

                // Warn if all items were filtered out (likely configuration issue)
                if (allItems.length > 0 && publishedItems.length === 0) {
                    console.warn(
                        `All items were filtered out by publish for directory: ${id}. Ensure the 'publish' field is in the NocoDB view and set to true.`,
                    );
                }

                // Clean items by removing the publish field (not needed in frontend)
                const items = publishedItems.map((item) => {
                    const cleaned = { ...item };
                    delete cleaned[publishField];
                    return cleaned;
                });

                // Validate that all expected fields are present in the data
                if (allItems.length > 0) {
                    const keys = new Set(Object.keys(allItems[0]));
                    const displayFields = [
                        display && display.title_field,
                        display && display.excerpt_field,
                        display && display.status_field,
                        display && display.start_date_field,
                    ];
                    const detailFields =
                        display && display.detail_fields
                            ? display.detail_fields.map((field) => field.field)
                            : [];
                    const filterFields = (filters || []).map((filter) => filter.field);
                    warnMissingFields(
                        keys,
                        [publishField, ...displayFields, ...detailFields, ...filterFields],
                        `directory:${id}`,
                    );
                }

                // Sort items by start_date + start_time (ascending) for event directories
                if (display && display.start_date_field) {
                    const dateField = display.start_date_field;
                    items.sort((a, b) => {
                        const aDate = a[dateField] || "";
                        const bDate = b[dateField] || "";
                        const aTime = a.start_time || "00:00";
                        const bTime = b.start_time || "00:00";
                        const aMs = aDate ? new Date(`${aDate}T${aTime}`).getTime() : -Infinity;
                        const bMs = bDate ? new Date(`${bDate}T${bTime}`).getTime() : -Infinity;
                        return bMs - aMs;
                    });
                }

                // Process filter configurations and extract unique options from data
                const filterOptions = (filters || []).map((filter) => {
                    // Handle date range filters specially
                    if (filter.type === "date_range") {
                        // Extract unique years from date field values
                        const years = new Set();
                        items.forEach((item) => {
                            const dateValue = item[filter.field];
                            if (dateValue) {
                                const date = new Date(dateValue);
                                // Only add valid years to the set
                                if (!isNaN(date.getTime())) {
                                    years.add(date.getFullYear());
                                }
                            }
                        });
                        // Return date range filter with predefined periods and extracted years
                        return {
                            ...filter,
                            periods: ["upcoming", "past", "all"], // Predefined time periods
                            years: Array.from(years).sort((a, b) => b - a), // Years in descending order
                        };
                    }

                    // Handle other filter types (select, multi_select, etc.)
                    const options = new Set();
                    items.forEach((item) => {
                        const value = item[filter.field];
                        if (value) {
                            if (filter.type === "multi_select") {
                                // Split comma-separated values for multi-select fields
                                const values = String(value).split(",");
                                values.forEach((v) => options.add(v.trim()));
                            } else {
                                // Add single value for regular select fields
                                options.add(String(value).trim());
                            }
                        }
                    });
                    // Return filter with extracted and sorted options
                    return {
                        ...filter,
                        options: Array.from(options).sort(),
                    };
                });

                // Add processed directory data to results
                results.push({
                    id,
                    name,
                    path,
                    description,
                    display,
                    items,
                    filters: filterOptions,
                });
                totalItems += items.length;
            } catch (e) {
                console.error(`Error fetching data for directory ${id}:`, e);
            }
        }

        // Log summary of processed data
        console.log(`[build] directories: ${results.length}, items: ${totalItems}`);
        return results;
    } catch (e) {
        console.error("Error loading directories:", e);
        return [];
    }
};
