(function () {
    "use strict";

    console.log("Contact form script loaded.");

    ///////////////////////////////////////////////////////////
    // CONFIG
    ///////////////////////////////////////////////////////////

    var WORKER_ENDPOINT = "https://mailersend-proxy.bauturbo.workers.dev";

    ///////////////////////////////////////////////////////////
    // INIT
    ///////////////////////////////////////////////////////////

    function init() {
        var forms = document.querySelectorAll("[data-contact-form]");
        forms.forEach(function (form) {
            bindForm(form);
        });
    }

    ///////////////////////////////////////////////////////////
    // FORM BINDING
    ///////////////////////////////////////////////////////////

    function bindForm(form) {
        if (form.dataset.isBound) return;
        form.dataset.isBound = "true";

        var btn = form.querySelector("[data-contact-form-submit]");
        var statusEl = form.querySelector("[data-contact-form-status]");

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            if (!validateForm(form)) return;

            var payload = collectPayload(form);
            submitForm(payload, form, btn, statusEl);
        });
    }

    ///////////////////////////////////////////////////////////
    // COLLECT
    ///////////////////////////////////////////////////////////

    function collectPayload(form) {
        return {
            name: form.querySelector('[name="name"]').value.trim(),
            email: form.querySelector('[name="email"]').value.trim(),
            subject: (form.querySelector('[name="subject"]') || {}).value
                ? form.querySelector('[name="subject"]').value.trim()
                : "",
            message: form.querySelector('[name="message"]').value.trim(),
        };
    }

    ///////////////////////////////////////////////////////////
    // CLIENT-SIDE VALIDATION (redundant with Worker, but gives
    // instant feedback without a round-trip)
    ///////////////////////////////////////////////////////////

    function validateForm(form) {
        var valid = true;

        form.querySelectorAll("[required]").forEach(function (field) {
            clearFieldError(field);

            var isEmpty = field.type === "checkbox" ? !field.checked : field.value.trim() === "";

            if (isEmpty) {
                showFieldError(field, "Dieses Feld ist erforderlich.");
                valid = false;
            }
        });

        var emailField = form.querySelector('[name="email"]');
        if (emailField && emailField.value.trim() !== "") {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim())) {
                showFieldError(emailField, "Bitte geben Sie eine gültige E-Mail-Adresse ein.");
                valid = false;
            }
        }

        return valid;
    }

    function showFieldError(field, message) {
        var errorId = field.id + "-error";
        var existing = document.getElementById(errorId);
        if (!existing) {
            var el = document.createElement("span");
            el.id = errorId;
            el.className = "block mt-1.5 text-xs text-bauturbo-rot";
            el.setAttribute("role", "alert");
            el.textContent = message;
            
            var wrapper = field.closest(".form-field-wrapper");
            if (wrapper) {
                wrapper.appendChild(el);
            } else {
                field.parentNode.appendChild(el);
            }
        }
        field.setAttribute("aria-describedby", errorId);
        field.classList.add("border-bauturbo-rot");
    }

    function clearFieldError(field) {
        var errorId = field.id + "-error";
        var existing = document.getElementById(errorId);
        if (existing) existing.remove();
        field.removeAttribute("aria-describedby");
        field.classList.remove("border-bauturbo-rot");
    }

    ///////////////////////////////////////////////////////////
    // SUBMIT
    ///////////////////////////////////////////////////////////

    function submitForm(payload, form, btn, statusEl) {
        setLoading(btn, true);
        clearStatus(statusEl);

        fetch(WORKER_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(function (res) {
                return res.json().then(function (data) {
                    return { ok: res.ok, data: data };
                });
            })
            .then(function (result) {
                if (result.ok && result.data.success) {
                    showStatus(
                        statusEl,
                        "success",
                        "Ihre Nachricht wurde erfolgreich gesendet. Wir melden uns so bald wie möglich bei Ihnen.",
                    );
                    form.reset();
                } else {
                    var msg =
                        result.data && result.data.error
                            ? result.data.error
                            : "Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.";
                    showStatus(statusEl, "error", msg);
                }
            })
            .catch(function () {
                showStatus(
                    statusEl,
                    "error",
                    "Die Nachricht konnte nicht gesendet werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
                );
            })
            .finally(function () {
                setLoading(btn, false);
            });
    }

    ///////////////////////////////////////////////////////////
    // UI HELPERS
    ///////////////////////////////////////////////////////////

    function setLoading(btn, isLoading) {
        if (!btn) return;
        btn.disabled = isLoading;
        btn.dataset.loading = isLoading ? "true" : "false";
        btn.textContent = isLoading ? "Wird gesendet…" : btn.dataset.labelDefault;
    }

    function clearStatus(statusEl) {
        if (!statusEl) return;
        statusEl.hidden = true;
        statusEl.textContent = "";
        statusEl.className = statusEl.dataset.baseClass || "";
    }

    function showStatus(statusEl, type, message) {
        if (!statusEl) return;
        statusEl.hidden = false;
        statusEl.textContent = message;
        statusEl.setAttribute("role", "alert");

        var isSuccess = type === "success";
        statusEl.className = [
            statusEl.dataset.baseClass || "",
            "mt-6 px-4 py-3 text-sm border",
            isSuccess
                ? "text-bauturbo-blau border-bauturbo-blau bg-bauturbo-blau/5"
                : "text-bauturbo-rot border-bauturbo-rot bg-bauturbo-rot/5",
        ].join(" ");
    }

    ///////////////////////////////////////////////////////////
    // BOOTSTRAP
    ///////////////////////////////////////////////////////////

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
