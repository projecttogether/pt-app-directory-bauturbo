const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

module.exports = function () {
    try {
        // Load config from frontend root
        const configPath = path.join(__dirname, "../../config.yml");
        const fileContents = fs.readFileSync(configPath, "utf8");
        const config = yaml.load(fileContents);

        // Return full config with all properties flattened for easier template access
        return {
            name: config.site.name,
            domain: config.site.domain,
            theme: config.theme,
            branding: config.branding,
            header_menu: config.header_menu,
            footer: config.footer,

            // Temp. workaround to include hardcoded section IDs for home page
            section_ids_home: config.section_ids_home,
        };
    } catch (e) {
        console.error("Error loading site config:", e);
        return {
            name: "Directory",
            error: e.message,
        };
    }
};
