(function () {
    ("use strict");

    ///// Dyn. site nav right padding adjustm. /////
    ////////////////////////////////////////////////

    function set_siteNavPadd() {
        // Dyn. set site nav. right padding to match logo el. width
        const el_siteNav = document.getElementById("site-nav");
        const el_logo = document.getElementById("site-logo");
        if (!el_siteNav || !el_logo) return;

        const rect_logo = el_logo.getBoundingClientRect();
        const w_logo = rect_logo.width;
        el_siteNav.style.setProperty("--pr", `${w_logo - 1}px`);
    }

    // Wait for resources to load
    window.addEventListener("load", set_siteNavPadd);

    // Re-adjust on viewport width change
    window.addEventListener("resize", set_siteNavPadd);

    ////////////// Mobile menu init. ///////////////
    ////////////////////////////////////////////////

    function init_mobileMenu() {
        const el_mobileMenuBtn = document.getElementById("mobile-menu-btn");
        const el_siteNav = document.getElementById("site-nav");
        if (el_mobileMenuBtn) {
            el_mobileMenuBtn.addEventListener("click", () => {
                el_siteNav.dataset.hiddenMobile =
                    el_siteNav.dataset.hiddenMobile === "true" ? "false" : "true";
                el_mobileMenuBtn.dataset.active =
                    el_mobileMenuBtn.dataset.active === "true" ? "false" : "true";
            });
        }

        // Hide mobile menu on nav. link click
        const els_navLinks = document.querySelectorAll("[data-ref='nav-link']");
        if (els_navLinks)
            els_navLinks.forEach((el) => {
                el.addEventListener("click", () => {
                    el_siteNav.dataset.hiddenMobile = "true";
                    el_mobileMenuBtn.dataset.active = "false";
                });
            });
    }

    // Wait for resources to load
    window.addEventListener("load", init_mobileMenu);
})();
