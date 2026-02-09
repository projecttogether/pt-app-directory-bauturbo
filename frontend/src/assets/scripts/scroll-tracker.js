/**
 * Scroll Tracker
 * Tracks vertical scroll position and sets data-near-top attribute on body
 */

(function () {
    "use strict";

    const THRESHOLD = 100; // pixels from top

    function updt_attr_nearTop() {
        const scroll_y = window.scrollY || window.pageYOffset;
        const is_nearTop = scroll_y < THRESHOLD;

        document.body.setAttribute("data-near-top", is_nearTop);
    }

    // Initialize on page load
    document.addEventListener("DOMContentLoaded", updt_attr_nearTop);

    // Update on scroll with throttling for better performance
    let ticking = false;
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updt_attr_nearTop);
            ticking = true;
        }
    }

    function hdl_scroll() {
        ticking = false;
        requestTick();
    }

    // Listen for scroll events
    window.addEventListener("scroll", hdl_scroll, { passive: true });

    // Handle initial state
    updt_attr_nearTop();
})();
