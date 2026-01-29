require("dotenv").config();
const EleventyFetch = require("@11ty/eleventy-fetch");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

let cachedPages = null;

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

module.exports = async function () {
    if (cachedPages) {
        return cachedPages;
    }

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
            cachedPages = {};
            return cachedPages;
        }

        if (!pagesNocodb.table_id || !pagesNocodb.view_id) {
            console.warn("Missing NocoDB pages table/view configuration.");
            cachedPages = {};
            return cachedPages;
        }

        const url = `${nocodb.base_url}/api/v1/db/data/noco/${nocodb.project_id}/${pagesNocodb.table_id}/views/${pagesNocodb.view_id}?limit=1000`;
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
        const fieldMap = pagesConfig.nocodb_fields || {};
        const pageIdField = fieldMap.page_id || "page_id";
        const titleField = fieldMap.title || "title";
        const permalinkField = fieldMap.permalink || "permalink";
        const publishField = fieldMap.publish || "publish";
        const maxSections = pagesConfig.max_sections || 8;

        const pagesById = {};

        items.forEach(item => {
            const publishValue = item[publishField];
            if (!isPublished(publishValue)) {
                return;
            }

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

        cachedPages = pagesById;
        return cachedPages;
    } catch (e) {
        console.error("Error loading pages:", e);
        cachedPages = {};
        return cachedPages;
    }
};
