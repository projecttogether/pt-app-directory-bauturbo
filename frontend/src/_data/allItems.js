module.exports = async function () {
    const directories = require("./directories")();
    const allDirectories = await directories;
    
    const allItems = [];
    
    allDirectories.forEach(dir => {
        dir.items.forEach(item => {
            allItems.push({
                item: item,
                directory: {
                    id: dir.id,
                    name: dir.name,
                    path: dir.path,
                    display: dir.display
                }
            });
        });
    });
    
    return allItems;
};
