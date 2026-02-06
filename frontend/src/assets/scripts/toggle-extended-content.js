/**
 * Toggle Extended Content Functionality
 * Handles showing/hiding extended content sections with data attributes
 */

document.addEventListener("DOMContentLoaded", function () {
    const btns_toggleExtended = document.querySelectorAll('[data-ref="btn-toggle-extended"]');
    btns_toggleExtended.forEach((btn) => {
        btn.addEventListener("click", function () {
            // Find extended content wrapper
            const wrpr_extendedContent = document.querySelector('[data-ref="extended-content"]');
            if (!wrpr_extendedContent) {
                console.warn("Extended content div not found");
                return;
            }

            // Get current state
            const is_hidden = wrpr_extendedContent.getAttribute("data-hidden") === "true";

            // Toggle states
            wrpr_extendedContent.setAttribute("data-hidden", is_hidden ? "false" : "true");
            btn.setAttribute("data-active", is_hidden ? "true" : "false");
            // btn.textContent = is_hidden ? "Weniger anzeigen" : "Mehr erfahren";
        });
    });
});
