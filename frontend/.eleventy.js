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
    
    // Add date formatting filter (DD.MM.YYYY)
    eleventyConfig.addFilter("formatDate", (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
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
