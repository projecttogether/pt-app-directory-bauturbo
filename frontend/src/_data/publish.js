function isPublished(value) {
    if (value === true) return true;
    if (value === 1) return true;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "true" || normalized === "1" || normalized === "yes";
    }
    return false;
}

module.exports = {
    isPublished
};
