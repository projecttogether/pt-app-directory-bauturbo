const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

module.exports = function () {
    // Get the target site from environment variable (default to bauturbo)
    const siteId = process.env.SITE_ID || "bauturbo";
    
    try {
        // Load master site config
        const masterConfigPath = path.join(__dirname, "../../sites/site-config.yml");
        const masterConfig = yaml.load(fs.readFileSync(masterConfigPath, "utf8"));
        
        // Find the specific site configuration
        const siteConfig = masterConfig.sites.find(site => site.id === siteId);
        
        if (!siteConfig) {
            console.error(`Site "${siteId}" not found in site-config.yml`);
            return {
                id: siteId,
                name: "Unknown Site",
                error: "Site not found"
            };
        }
        
        // Merge with default theme if site doesn't override everything
        const defaultTheme = masterConfig.default_theme || {};
        const siteTheme = siteConfig.theme || {};
        
        return {
            ...siteConfig,
            theme: {
                colors: {
                    ...(defaultTheme.colors || {}),
                    ...(siteTheme.colors || {})
                },
                fonts: {
                    ...(defaultTheme.fonts || {}),
                    ...(siteTheme.fonts || {})
                }
            }
        };
    } catch (e) {
        console.error("Error loading site config:", e);
        return {
            id: siteId,
            name: "Error",
            error: e.message
        };
    }
};
