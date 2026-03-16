# Contact Form Guide

This document explains the complete contact form implementation: how it is architected, what each file does, how the infrastructure is set up, and how to maintain or reconfigure it.

---

## Why a special architecture?

The Bauturbo Directory is a **fully static site** (plain HTML/CSS/JS served by Nginx). There is no application server running to handle form submissions. This means you cannot simply `POST` form data to a local endpoint.

At the same time, calling the MailerSend API directly from the browser is not possible either — it would require embedding an API key in the JavaScript source, where any visitor could read it.

The solution is a **Cloudflare Worker**: a tiny serverless function that runs at Cloudflare's edge. The browser sends form data to the Worker; the Worker holds the MailerSend API key as an encrypted secret and forwards the send request to MailerSend on the server side.

```
User fills form in browser
  → contact-form.js validates input client-side
  → fetch() POSTs JSON to the Cloudflare Worker
    → Worker validates origin (blocks requests from unknown domains)
    → Worker validates required fields
    → Worker builds and signs the MailerSend API request (using secret key)
    → MailerSend sends the email
  → Worker returns { success: true } or { error: "…" }
→ contact-form.js shows success/error banner to the user
```

---

## File overview

| File                                                              | Purpose                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| `frontend/src/_includes/components/forms/contact-form.njk`        | The HTML form markup (Nunjucks component)                 |
| `frontend/src/_includes/components/forms/form-field-input.njk`    | Reusable text/email/etc. input field snippet              |
| `frontend/src/_includes/components/forms/form-field-textarea.njk` | Reusable textarea field snippet                           |
| `frontend/src/_includes/components/forms/form-field-select.njk`   | Reusable select/dropdown field snippet                    |
| `frontend/src/_includes/components/forms/form-field-checkbox.njk` | Reusable checkbox field snippet                           |
| `frontend/src/assets/scripts/contact-form.js`                     | Client-side JS: validation, submission, UI feedback       |
| `frontend/scripts/mailersend-worker.js`                           | The Cloudflare Worker (server-side proxy)                 |
| `frontend/scripts/wrangler.toml`                                  | Wrangler (Cloudflare CLI) config for deploying the Worker |

---

## 1. The Nunjucks components

### `contact-form.njk`

The top-level form component. It is included inside a page section template (e.g. `page-section-contact-form.njk`) and receives its configuration via the `section` context object passed down from NocoDB page data.

Three `data-*` attributes are critical for the JavaScript to work:

| Attribute                  | Where                    | Purpose                                                                       |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `data-contact-form`        | `<form>`                 | Tells `contact-form.js` to bind to this form                                  |
| `data-contact-form-submit` | `<button type="submit">` | Used to manage loading state                                                  |
| `data-label-default`       | `<button type="submit">` | Stores the original button label so it can be restored after "Wird gesendet…" |
| `data-contact-form-status` | `<div hidden>`           | The container where success/error messages are injected                       |

The component also includes the script tag for `contact-form.js` at its own bottom, so it is only loaded on pages that actually use the form.

**Label and placeholder overrides via NocoDB**

All user-facing strings have defaults but can be overridden by passing the corresponding fields in a `section` object from NocoDB:

| `section` key                                    | Default value                                        |
| ------------------------------------------------ | ---------------------------------------------------- |
| `section.label_name`                             | `Name`                                               |
| `section.label_email`                            | `E-Mail`                                             |
| `section.label_subject`                          | `Betreff`                                            |
| `section.label_message`                          | `Nachricht`                                          |
| `section.label_consent`                          | German consent statement with link to `/datenschutz` |
| `section.cta_label`                              | `Nachricht senden`                                   |
| `section.placeholder_name/email/subject/message` | _(empty)_                                            |

### Field snippets (`form-field-*.njk`)

Each field is a self-contained snippet included via `{% include %}`. They communicate with the parent via Nunjucks `{% set %}` variables set before the include:

**`form-field-input.njk`**

```njk
{% set field_name = "email" %}       {# maps to name="" and id="" attributes #}
{% set field_label = "E-Mail" %}
{% set field_type = "email" %}       {# any valid HTML input type #}
{% set field_required = true %}
{% set field_placeholder = "…" %}
{% set field_value = "" %}           {# optional pre-fill #}
{% set color_border = "…" %}         {# CSS custom property, defaults to bauturbo-blau #}
{% set color_border_focus = "…" %}   {# CSS custom property, defaults to bauturbo-rot #}
{% include "components/forms/form-field-input.njk" %}
```

**`form-field-textarea.njk`** — same as input, plus `field_rows` (default: 5).

**`form-field-select.njk`** — same as input, plus `field_options` (array of `{ value, label }` objects).

**`form-field-checkbox.njk`** — uses `field_checked` (boolean), `field_value` (submitted value string, default `"1"`), and `color_accent`. The `field_label` is rendered with `| safe` so it can contain HTML (e.g. a link to the privacy policy).

---

## 2. `contact-form.js` — client-side script

The script follows the same IIFE (Immediately Invoked Function Expression) pattern as the other scripts in this project (`site-nav.js`, `toggle-extended-content.js`). All logic is self-contained and does not depend on any library.

### Key constant to configure

```js
var WORKER_ENDPOINT = "https://mailersend-proxy.bauturbo.workers.dev";
```

This is the only value that must be updated if the Worker is ever redeployed under a different name or Cloudflare account. It is located at the very top of the script.

### How the functions connect

```
page load
  └─ init()
       └─ finds all [data-contact-form] elements
            └─ bindForm(form)
                 └─ attaches submit listener
                      │
                      ▼ on submit
                 validateForm(form) ──── fails ──► showFieldError() per field
                      │ passes
                      ▼
                 collectPayload(form)
                      │
                      ▼
                 submitForm(payload, form, btn, statusEl)
                      ├─ setLoading(btn, true)     disables button, shows "Wird gesendet…"
                      ├─ clearStatus(statusEl)     hides any previous status banner
                      ├─ fetch(WORKER_ENDPOINT)
                      │     ├─ success  ──► showStatus(statusEl, "success", …)
                      │     │               form.reset()
                      │     └─ error    ──► showStatus(statusEl, "error", …)
                      └─ setLoading(btn, false)    re-enables button
```

**Validation** runs twice: once client-side (instant feedback, no network round-trip) and once inside the Worker (authoritative). The client-side pass adds inline `<span role="alert">` error elements below failing fields, coloured with `text-bauturbo-rot`, and adds `border-bauturbo-rot` to the field itself.

**`collectPayload`** reads values by `name` attribute, not by position. The object it returns maps directly to what the Worker expects: `{ name, email, subject, message }`. The consent checkbox is validated client-side but intentionally not forwarded to the Worker (it is a UI-only gate).

---

## 3. `mailersend-worker.js` — the Cloudflare Worker

This is the only piece of the stack that runs outside the static site. It is deployed once to Cloudflare and operates independently of the site's build/deploy cycle.

### What it does on each request

1. **CORS pre-flight** (`OPTIONS`): Returns appropriate headers so the browser allows the cross-origin `fetch()`. Only origins in the `ALLOWED_ORIGIN` secret receive a permissive response.
2. **Origin guard**: Checks the `Origin` request header against the allow-list. Returns `403 Forbidden` for unknown origins. This prevents the Worker from being abused by other sites.
3. **Method guard**: Rejects everything except `POST`.
4. **Input validation**: Checks that `name`, `email`, and `message` are present and non-empty. Returns `422 Unprocessable Entity` with a German error string if any field fails.
5. **Email construction**: Builds both a plain-text and an HTML version of the email body. All user-supplied strings are HTML-escaped before insertion into the HTML body.
6. **MailerSend API call**: POSTs to `https://api.mailersend.com/v1/email` with the API key from the `MAILERSEND_API_KEY` secret. The user's email address is set as `reply_to` so replies land in their inbox automatically.
7. **Response**: Returns `{ success: true }` on HTTP 202 from MailerSend, or `{ error: "…" }` with a 502 status for any upstream failure.

### Secrets

All sensitive values are stored as **Cloudflare Worker secrets** — encrypted at rest and never visible in logs, the dashboard, or source control.

| Secret                  | Description                                                                |
| ----------------------- | -------------------------------------------------------------------------- |
| `MAILERSEND_API_KEY`    | MailerSend API token with **Sending access** only (not Full access)        |
| `MAILERSEND_FROM_EMAIL` | The `From` address — must be on a **verified sender domain** in MailerSend |
| `MAILERSEND_FROM_NAME`  | Display name in the From field (e.g. `Umsetzungslabor Bau-Turbo`)          |
| `MAILERSEND_TO_EMAIL`   | Recipient — the inbox where contact messages land                          |
| `ALLOWED_ORIGIN`        | Comma-separated list of permitted origins (see section below)              |

### The `ALLOWED_ORIGIN` secret

This secret accepts a **comma-separated list** of origins, which allows local development without a separate Worker deployment:

```
https://praxiswissen.umsetzungslabor-bauturbo.de,http://localhost:8080
```

The Worker splits this on `,`, trims whitespace, and checks exact membership. CORS response headers reflect back the requesting origin only if it is in the list, which is the correct pattern for multi-origin CORS support.

---

## 4. `wrangler.toml` — deployment config

```toml
name = "mailersend-proxy"
main = "mailersend-worker.js"
compatibility_date = "2024-01-01"
```

This is the minimum Wrangler configuration. It is safe to commit — it contains no secrets.

---

## 5. First-time setup (for a new environment)

### Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
- A [MailerSend account](https://app.mailersend.com) with a **verified sender domain**
- Node.js ≥ 18

### Step 1 — Install Wrangler

```bash
npm install -g wrangler
```

### Step 2 — Log in to Cloudflare

```bash
wrangler login
```

This opens a browser window. Authorise Wrangler to access your account.

### Step 3 — Deploy the Worker

```bash
cd frontend/scripts
wrangler deploy
```

Wrangler will print the live Worker URL:

```
https://mailersend-proxy.<your-account-subdomain>.workers.dev
```

### Step 4 — Set secrets

Run each command below and type (or paste) the value when prompted. Values are never echoed to the terminal.

```bash
wrangler secret put MAILERSEND_API_KEY
wrangler secret put MAILERSEND_FROM_EMAIL
wrangler secret put MAILERSEND_FROM_NAME
wrangler secret put MAILERSEND_TO_EMAIL
wrangler secret put ALLOWED_ORIGIN
```

For `ALLOWED_ORIGIN`, enter the comma-separated list:

```
https://your-live-domain.de,http://localhost:8080
```

Secrets take effect immediately — no redeployment needed after changing them.

### Step 5 — Update the Worker URL in the client script

Open `frontend/src/assets/scripts/contact-form.js` and set `WORKER_ENDPOINT` to the URL printed in Step 3:

```js
var WORKER_ENDPOINT =
    "https://mailersend-proxy.<your-account-subdomain>.workers.dev";
```

### Step 6 — Verify MailerSend sender domain

In the MailerSend dashboard, navigate to **Domains** and confirm the domain used in `MAILERSEND_FROM_EMAIL` shows a green verified status. Without domain verification, MailerSend will reject the API call with a 422 error.

---

## 6. Day-to-day operations

### Changing the recipient address

```bash
cd frontend/scripts
wrangler secret put MAILERSEND_TO_EMAIL
```

No redeployment required.

### Adding a new allowed origin (e.g. a staging domain)

```bash
cd frontend/scripts
printf 'https://live.domain.de,https://staging.domain.de,http://localhost:8080' | wrangler secret put ALLOWED_ORIGIN
```

### Rotating the MailerSend API key

1. Generate a new token in MailerSend (Email API → API Tokens → Add token, **Sending access**).
2. Update the secret: `wrangler secret put MAILERSEND_API_KEY`
3. Delete the old token in MailerSend once confirmed working.

### Redeploying the Worker after code changes

```bash
cd frontend/scripts
wrangler deploy
```

Secrets persist across redeployments — you do not need to re-enter them.

### Viewing Worker logs (real-time)

```bash
cd frontend/scripts
wrangler tail
```

This streams live logs from the Worker, including any `console.error` calls triggered by MailerSend failures. Useful for debugging production issues without touching the static site.

---

## 7. Troubleshooting

| Symptom                                     | Likely cause                                         | Fix                                                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ERR_NAME_NOT_RESOLVED` in console          | `WORKER_ENDPOINT` still contains the placeholder URL | Update `WORKER_ENDPOINT` in `contact-form.js`                                                                                                         |
| `403 Forbidden` from Worker                 | Requesting origin is not in `ALLOWED_ORIGIN`         | Add the origin to the secret (see above)                                                                                                              |
| `502` error after form submit               | MailerSend rejected the request                      | Run `wrangler tail` and check the logged MailerSend status code. Usually a 422 means the sender domain is unverified or a required field is malformed |
| Form submits but no email arrives           | Wrong `MAILERSEND_TO_EMAIL`, or email in spam        | Check the secret value; check the MailerSend activity log in the dashboard                                                                            |
| Button stuck on "Wird gesendet…"            | JS error before `.finally()` fires                   | Open browser DevTools → Console for errors                                                                                                            |
| `MAILERSEND_FROM_EMAIL` domain not verified | MailerSend returns 422 on send                       | Verify the domain in MailerSend dashboard → Domains                                                                                                   |
