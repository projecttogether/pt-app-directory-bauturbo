# Contact Form Guide

This document explains the complete contact form implementation: how it is architected, what each file does, how the infrastructure is set up, and how to maintain or reconfigure it.

---

## Why a special architecture?

The Bauturbo Directory is a **fully static site** (plain HTML/CSS/JS served by Nginx). There is no back-end logic directly integrated into the 11ty static site to handle form submissions.

At the same time, calling the MailerSend API directly from the browser is not possible either — it would require embedding an API key in the JavaScript source, where any visitor could read it.

The solution is a **Node.js Microservice**: a tiny, self-hosted Express server deployed separately within your Coolify project. The browser sends form data to this microservice; the microservice holds the MailerSend API key as an encrypted secret and forwards the send request securely to MailerSend.

```
User fills form in browser
  → contact-form.js validates input client-side
  → fetch() POSTs JSON to the Node.js Microservice API (/api/contact)
    → Microservice validates origin (CORS) against ALLOWED_ORIGIN env var
    → Microservice validates required fields
    → Microservice builds and signs the MailerSend API request (using secret key)
    → MailerSend sends the email
  → Microservice returns { success: true } or { error: "…" }
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
| `services/contact-form/index.js`                                  | The Node.js Express microservice (server-side proxy)      |
| `services/contact-form/Dockerfile`                                | Dockerfile to deploy the microservice easily via Coolify  |

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

The component also injects the environment variable `CONTACT_API_URL` onto the global `window` object and includes the script tag for `contact-form.js` at its own bottom, so it is only loaded on pages that actually use the form.

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

Each field is a self-contained snippet included via `{% include %}`. They communicate with the parent via Nunjucks `{% set %}` variables set before the include.

---

## 2. `contact-form.js` — client-side script

The script follows the same IIFE pattern as the other scripts in this project. All logic is self-contained.

### How it connects to the Microservice

```js
var WORKER_ENDPOINT = window.CONTACT_API_URL || "https://mailersend-proxy.bauturbo.workers.dev";
```
The script will use `CONTACT_API_URL` injected by the 11ty build process (which reads your local `.env` or Coolify environment variables).

**Validation** runs twice: once client-side (instant feedback, no network round-trip) and once inside the Node.js Microservice (server-authoritative).

---

## 3. `services/contact-form/index.js` — the Node.js Microservice

This self-hosted Express server operates independently of the main static site.

### What it does on each request

1. **CORS validation**: Only origins specified in the `ALLOWED_ORIGIN` environment variable receive a permissive CORS response (trailing slashes are stripped automatically).
2. **Input validation**: Checks that `name`, `email`, and `message` are present and non-empty. Returns `422 Unprocessable Entity` with a German error string if any field fails.
3. **Email construction**: Builds both a plain-text and an HTML version of the email body. All strings are HTML-escaped.
4. **MailerSend API call**: POSTs to `https://api.mailersend.com/v1/email` using `MAILERSEND_API_KEY`.
5. **Response**: Returns `{ success: true }` on HTTP 202 from MailerSend.

### Environment Variables

All sensitive values are stored securely as **environment variables**. In Coolify, add them directly to your `contact-form` application resource.

| Secret                  | Description                                                                |
| ----------------------- | -------------------------------------------------------------------------- |
| `MAILERSEND_API_KEY`    | MailerSend API token with **Sending access** only                          |
| `MAILERSEND_FROM_EMAIL` | The `From` address — must be on a **verified sender domain** in MailerSend |
| `MAILERSEND_FROM_NAME`  | Display name in the From field (e.g. `Umsetzungslabor Bau-Turbo`)          |
| `MAILERSEND_TO_EMAIL`   | Recipient — the inbox where contact messages land                          |
| `ALLOWED_ORIGIN`        | Comma-separated list of permitted origins (e.g. `https://directory-bauturbo.de,http://localhost:8080`) |
| `PORT`                  | (Optional) Defaults to 3000                                                |

---

## 4. Setup and Deployment via Coolify

### Step 1 — Verify MailerSend Domain Add a Token
1. Make sure your MailerSend domain is verified.
2. Generate an API Token with **Sending Access** only.

### Step 2 — Deploy the Microservice to Coolify
Deploy the microservice separately from your frontend app.
1. In Coolify, create a new Resource from your existing repository.
2. Set the Base Directory to `/services/contact-form/`.
3. Choose Nixpacks or Dockerfile for the build.
4. Assign a production URL, e.g. `https://contact.directory-bauturbo.de`.
5. In the Coolify environment variables tab, add all required secrets (listed above).

### Step 3 — Tell the Frontend about the Microservice
1. Go to your **Main Frontend** Coolify application settings.
2. Add a new environment variable: `CONTACT_API_URL`
3. Set its value to the URL of the microservice you deployed in Step 2: `https://contact.directory-bauturbo.de/api/contact`
4. Rebuild the Main Frontend application so that Eleventy can inject this URL into the HTML.

### Local Development
To test locally, both the frontend and `contact-api` are pre-configured in `docker-compose.yml`. You can spin them up easily:
```bash
docker-compose --profile frontend up -d
```
All MailerSend variables should be copied into a `services/contact-form/.env` or exported in your shell.

---

## 5. Troubleshooting

| Symptom                                     | Likely cause                                         | Fix                                                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[CORS BLOCKED]` logged on microservice     | Requesting Origin does not match `ALLOWED_ORIGIN`    | Check the Coolify logs of the microservice. It will output exactly what origin was blocked. Add it to `ALLOWED_ORIGIN`.                               |
| `502` error after form submit               | MailerSend rejected the request                      | Check the Coolify logs for the microservice. Usually a 422 means the sender domain is unverified or a required field is malformed.                    |
| Form submits but no email arrives           | Wrong `MAILERSEND_TO_EMAIL`, or email in spam        | Check the environment variables; check the MailerSend activity log in the MailerSend dashboard.                                                       |
| `MAILERSEND_FROM_EMAIL` domain not verified | MailerSend returns 422 on send                       | Verify the domain in MailerSend dashboard → Domains                                                                                                   |
