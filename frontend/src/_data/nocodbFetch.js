const EleventyFetch = require("@11ty/eleventy-fetch");

const DEFAULT_LIMIT = 1000;

function getCacheSeconds() {
    const raw = process.env.NOCODB_CACHE_SECONDS;
    if (raw === undefined || raw === null || raw === "") {
        return 3600;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
        return 3600;
    }
    return parsed;
}

function getTimeoutMs() {
    const raw = process.env.NOCODB_TIMEOUT_MS;
    if (raw === undefined || raw === null || raw === "") {
        return 10000;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return 10000;
    }
    return parsed;
}

function getRetries() {
    const raw = process.env.NOCODB_RETRIES;
    if (raw === undefined || raw === null || raw === "") {
        return 2;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
        return 2;
    }
    return parsed;
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, { headers }) {
    const cacheSeconds = getCacheSeconds();
    const timeoutMs = getTimeoutMs();
    const retries = getRetries();

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const json = await EleventyFetch(url, {
                duration: `${cacheSeconds}s`,
                type: "json",
                fetchOptions: {
                    headers,
                    signal: controller.signal
                }
            });
            clearTimeout(timeout);
            return json;
        } catch (error) {
            clearTimeout(timeout);
            if (attempt >= retries) {
                throw error;
            }
            const backoff = 300 * Math.pow(2, attempt);
            await delay(backoff);
        }
    }
    return null;
}

async function fetchAllRows(baseUrl, { headers, limit = DEFAULT_LIMIT }) {
    const rows = [];
    let offset = 0;

    while (true) {
        const url = `${baseUrl}?limit=${limit}&offset=${offset}`;
        const json = await fetchJson(url, { headers });
        const list = (json && json.list) || [];
        rows.push(...list);
        if (list.length < limit) {
            break;
        }
        offset += limit;
    }

    return rows;
}

module.exports = {
    fetchAllRows
};
