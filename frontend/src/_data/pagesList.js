module.exports = async function () {
    const pages = await require("./pages")();
    return Object.values(pages);
};
