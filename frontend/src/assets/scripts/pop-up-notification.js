(function () {
    ("use strict");

    ///// Pop-up notification functionality //////
    //////////////////////////////////////////////

    function closePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            // Animate out
            popup.classList.add("translate-y-[120%]");
        }
    }

    function init_popupNotification() {
        // Check if current date is 28.04.2026
        const today = new Date();
        const targetDate = new Date(2026, 3, 28); // Month is 0-indexed, so April is 3
        const isTargetDate =
            today.getFullYear() === targetDate.getFullYear() &&
            today.getMonth() === targetDate.getMonth() &&
            today.getDate() === targetDate.getDate();

        if (!isTargetDate) return;

        const els_popups = document.querySelectorAll("[data-comp='pop-up-notification']");
        if (!els_popups) return;

        els_popups.forEach((popup) => {
            const popupId = popup.id;
            if (!popupId) return;

            // Add event listeners for close buttons
            const closeButtons = popup.querySelectorAll('[onclick*="closePopup"]');
            closeButtons.forEach((button) => {
                // Remove inline onclick and add proper event listener
                button.removeAttribute("onclick");
                button.addEventListener("click", () => closePopup(popupId));
            });

            // Animate in after 1 second
            setTimeout(() => popup.classList.remove("translate-y-[120%]"), 1000);
        });
    }

    // Make closePopup globally available for any remaining inline onclick handlers
    window.closePopup = closePopup;

    // Wait for DOM to load
    document.addEventListener("DOMContentLoaded", init_popupNotification);
})();
