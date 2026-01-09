require("dotenv").config();

module.exports = function (eleventyConfig) {
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
    
    // Add date formatting filter (DD.MM.YYYY or DD.MM.YYYY HH:mm for detail pages)
    eleventyConfig.addFilter("formatDate", (dateString, includeTime = false) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        // If includeTime is true, check if the date includes time (not midnight UTC)
        if (includeTime) {
            const hours = date.getUTCHours();
            const minutes = date.getUTCMinutes();
            const seconds = date.getUTCSeconds();
            
            // If time is present (not 00:00:00), include it in the format
            if (hours !== 0 || minutes !== 0 || seconds !== 0) {
                const localHours = String(date.getHours()).padStart(2, '0');
                const localMinutes = String(date.getMinutes()).padStart(2, '0');
                return `${day}.${month}.${year} ${localHours}:${localMinutes}`;
            }
        }
        
        return `${day}.${month}.${year}`;
    });
    
    // Add helper to check if a value is a date string
    eleventyConfig.addFilter("isDate", (value) => {
        if (!value || typeof value !== 'string') return false;
        // Check if it matches common date formats
        const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
        const postgresDatePattern = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2})?$/;
        const trimmedValue = value.trim();
        return isoDatePattern.test(trimmedValue) || postgresDatePattern.test(trimmedValue);
    });
    
    console.log('Building Bauturbo Directory -> _site/');
    
    // Pass through static assets
    eleventyConfig.addPassthroughCopy("src/assets");

    return {
        dir: {
            input: "src",
            output: "_site",
        },
    };
};
