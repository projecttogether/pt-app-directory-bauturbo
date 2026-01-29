require("dotenv").config();
const { fetchAllRows } = require("./nocodbFetch");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

function isPublished(value) {
    if (value === true) return true;
    if (value === 1) return true;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "true" || normalized === "1" || normalized === "yes";
    }
    return false;
}

function normalizePermalink(value) {
    if (!value) return "";
    const trimmed = String(value).trim();
    if (trimmed === "") return "";
    const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    if (withLeading === "/") {
        return withLeading;
    }
    if (withLeading.endsWith("/")) {
        return withLeading;
    }
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(withLeading);
    return hasExtension ? withLeading : `${withLeading}/`;
}

function warnMissingFields(keys, fields, context) {
    const missing = fields.filter((field) => !keys.has(field));
    if (missing.length > 0) {
        console.warn(`[pages] Missing fields in NocoDB view (${context}): ${missing.join(", ")}`);
    }
}

module.exports = async function () {
    try {
        const configPath = path.join(__dirname, "../../config.yml");
        const fileContents = fs.readFileSync(configPath, "utf8");
        const config = yaml.load(fileContents);

        const pagesConfig = config.pages || {};
        const pagesNocodb = pagesConfig.nocodb || {};

        const nocodb = {
            base_url: process.env.NOCODB_BASE_URL,
            project_id: process.env.NOCODB_PROJECT_ID,
            api_token: process.env.NOCODB_API_TOKEN
        };

        if (!nocodb.base_url || !nocodb.project_id || !nocodb.api_token) {
            console.warn("Missing NocoDB configuration, returning empty pages.");
            return {};
        }

        if (!pagesNocodb.table_id || !pagesNocodb.view_id) {
            console.warn("Missing NocoDB pages table/view configuration.");
            return {};
        }

        const baseUrl = `${nocodb.base_url}/api/v1/db/data/noco/${nocodb.project_id}/${pagesNocodb.table_id}/views/${pagesNocodb.view_id}`;
        const items = await fetchAllRows(baseUrl, {
            headers: {
                "xc-token": nocodb.api_token
            }
        });
        const fieldMap = pagesConfig.nocodb_fields || {};
        const pageIdField = fieldMap.page_id || "page_id";
        const titleField = fieldMap.title || "title";
        const permalinkField = fieldMap.permalink || "permalink";
        const publishField = fieldMap.publish || "publish";
        const maxSections = pagesConfig.max_sections || 8;

        if (items.length > 0) {
            const keys = new Set(Object.keys(items[0]));
            const sectionFields = [];
            for (let i = 1; i <= maxSections; i += 1) {
                sectionFields.push(
                    `section_${i}_type`,
                    `section_${i}_tag`,
                    `section_${i}_headline`,
                    `section_${i}_subheadline`,
                    `section_${i}_text`,
                    `section_${i}_cta_label`,
                    `section_${i}_cta_url`,
                    `section_${i}_image`
                );
            }
            warnMissingFields(keys, [pageIdField, titleField, permalinkField, publishField, ...sectionFields], "pages");
        }

        const publishedItems = items.filter((item) => isPublished(item[publishField]));
        if (items.length > 0 && publishedItems.length === 0) {
            console.warn("All pages were filtered out by publish. Ensure the 'publish' field is in the NocoDB view and set to true.");
        }

        const pagesById = {};

        publishedItems.forEach(item => {
            const pageId = item[pageIdField];
            const title = item[titleField];
            const permalink = normalizePermalink(item[permalinkField]);

            if (!pageId || !title || !permalink) {
                return;
            }

            const sections = [];
            for (let i = 1; i <= maxSections; i += 1) {
                const type = item[`section_${i}_type`];
                if (!type || String(type).trim() === "" || String(type).trim() === "none") {
                    continue;
                }
                sections.push({
                    type: String(type).trim(),
                    tag: item[`section_${i}_tag`],
                    headline: item[`section_${i}_headline`],
                    subheadline: item[`section_${i}_subheadline`],
                    text: item[`section_${i}_text`],
                    cta_label: item[`section_${i}_cta_label`],
                    cta_url: item[`section_${i}_cta_url`],
                    image: item[`section_${i}_image`]
                });
            }

            pagesById[pageId] = {
                page_id: pageId,
                title,
                permalink,
                sections
            };
        });

        console.log(`[build] pages rendered: ${Object.keys(pagesById).length}`);
        return pagesById;
    } catch (e) {
        console.error("Error loading pages:", e);
        return {};
    }
};
