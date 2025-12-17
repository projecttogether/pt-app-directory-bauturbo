const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const dotenv = require("dotenv");

module.exports = function () {
    try {
        // Get site configuration first
        const siteConfig = require("./siteConfig")();
        
        // Load site-specific .env file
        const envPath = path.join(__dirname, "../../", siteConfig.env_file);
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
        }
        
        // Load site-specific directories config
        const configPath = path.join(__dirname, "../../", siteConfig.directories_config);
        const fileContents = fs.readFileSync(configPath, "utf8");
        let config = yaml.load(fileContents);

        // Replace environment variable placeholders in nocodb config
        if (config.nocodb) {
            config.nocodb.base_url = process.env.NOCODB_BASE_URL || config.nocodb.base_url;
            config.nocodb.project_id = process.env.NOCODB_PROJECT_ID || config.nocodb.project_id;
            config.nocodb.api_token = process.env.NOCODB_API_TOKEN || config.nocodb.api_token;
        }

        return config;
    } catch (e) {
        console.error("Error loading directory config:", e);
        return {
            directories: [],
            nocodb: {}
        };
    }
};
