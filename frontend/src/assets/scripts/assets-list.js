(function () {
    ("use strict");

    ///// Assets list collapsible items init. //////
    ////////////////////////////////////////////////

    function init_assetsList() {
        const els_assetsList = document.querySelectorAll("[data-comp='assets-list']");
        if (!els_assetsList) return;

        els_assetsList.forEach((el_assetsList) => {
            const els_items = el_assetsList.querySelectorAll("[data-ref='item']");
            if (!els_items) return;

            els_items.forEach((el_item) => {
                const el_hdr = el_item.querySelector("[data-ref='header']");
                if (!el_hdr) return;

                el_hdr.addEventListener("click", () => {
                    const el_cont = el_item.querySelector("[data-ref='content']");
                    if (!el_cont) return;

                    // Toggle data-hidden attribute
                    el_cont.dataset.hidden = el_cont.dataset.hidden === "true" ? "false" : "true";

                    // Toggle data-active attribute on header
                    el_hdr.dataset.active = el_hdr.dataset.active === "true" ? "false" : "true";
                });
            });
        });
    }

    // Wait for resources to load
    window.addEventListener("load", init_assetsList);
})();
