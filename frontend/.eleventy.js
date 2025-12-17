require("dotenv").config();

module.exports = function (eleventyConfig) {
    // Get the site ID from environment (default to bauturbo)
    const siteId = process.env.SITE_ID || "bauturbo";
    
    // Load site configuration to get output directory
    const fs = require("fs");
    const path = require("path");
    const yaml = require("js-yaml");
    
    // Add markdown filter for rendering markdown in templates
    const markdownIt = require("markdown-it");
    const md = markdownIt({
        html: true,
        linkify: true,
        typographer: true
    });
    
    eleventyConfig.addFilter("markdown", (content) => {
        return md.render(content);
    });
    
    // Add helper filter to check if string contains substring
    eleventyConfig.addFilter("contains", (str, substring) => {
        if (!str) return false;
        return String(str).indexOf(substring) !== -1;
    });
    
    // Add helper filter to split and join comma-separated values
    eleventyConfig.addFilter("cleanCommaList", (str) => {
        if (!str) return '';
        return String(str).split(',').map(v => v.trim()).join(', ');
    });
    
    // For dev server, output to _site directly instead of subdirectory
    // For production builds, use site-specific directory
    const isDev = process.argv.includes("--serve");
    let outputDir = "_site";
    
    if (!isDev) {
        try {
            const siteConfigPath = path.join(__dirname, "sites/site-config.yml");
            const siteConfigFile = yaml.load(fs.readFileSync(siteConfigPath, "utf8"));
            const siteConfig = siteConfigFile.sites.find(site => site.id === siteId);
            if (siteConfig && siteConfig.output_dir) {
                outputDir = siteConfig.output_dir;
            }
        } catch (e) {
            console.warn("Could not load site config, using default output directory");
        }
    }
    
    console.log(`Building site: ${siteId} -> ${outputDir}`);
    
    // Pass through static assets
    eleventyConfig.addPassthroughCopy("src/assets");

    return {
        dir: {
            input: "src",
            output: outputDir,
        },
    };
};
