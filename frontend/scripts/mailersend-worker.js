/**
 * Cloudflare Worker — MailerSend email proxy
 *
 * Deployment:
 *   1. Install Wrangler: npm i -g wrangler
 *   2. Log in:          wrangler login
 *   3. Deploy:          wrangler deploy frontend/scripts/mailersend-worker.js --name mailersend-proxy
 *
 * Required Worker secrets (set via Wrangler or the Cloudflare dashboard):
 *   wrangler secret put MAILERSEND_API_KEY
 *   wrangler secret put MAILERSEND_FROM_EMAIL    (e.g. noreply@yourdomain.de)
 *   wrangler secret put MAILERSEND_FROM_NAME     (e.g. Bauturbo Umsetzungslabor)
 *   wrangler secret put MAILERSEND_TO_EMAIL      (recipient address)
 *   wrangler secret put ALLOWED_ORIGIN           (e.g. https://praxiswissen.umsetzungslabor-bauturbo.de)
 *
 * After deployment, copy the Worker URL into WORKER_ENDPOINT inside contact-form.js.
 */

const MAILERSEND_API = "https://api.mailersend.com/v1/email";

export default {
    async fetch(request, env) {
        const origin = request.headers.get("Origin") || "";

        // ALLOWED_ORIGIN may be a comma-separated list, e.g.:
        //   "https://praxiswissen.umsetzungslabor-bauturbo.de,http://localhost:8080"
        const allowedOrigins = (env.ALLOWED_ORIGIN || "")
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean);

        const originAllowed = allowedOrigins.includes(origin);

        // ── CORS pre-flight ──────────────────────────────────────────────────────
        // Reflect the requesting origin back only if it is in the allow-list.
        const corsHeaders = {
            "Access-Control-Allow-Origin": originAllowed ? origin : allowedOrigins[0],
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // ── Origin guard ─────────────────────────────────────────────────────────
        if (!originAllowed) {
            return json({ error: "Forbidden" }, 403, corsHeaders);
        }

        // ── Only POST allowed beyond this point ──────────────────────────────────
        if (request.method !== "POST") {
            return json({ error: "Method not allowed" }, 405, corsHeaders);
        }

        // ── Parse body ───────────────────────────────────────────────────────────
        let body;
        try {
            body = await request.json();
        } catch {
            return json({ error: "Invalid JSON body" }, 400, corsHeaders);
        }

        // ── Validate required fields ─────────────────────────────────────────────
        const { name, email, subject, message } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return json({ error: "Pflichtfeld fehlt: Name" }, 422, corsHeaders);
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return json({ error: "Ungültige E-Mail-Adresse" }, 422, corsHeaders);
        }
        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return json({ error: "Pflichtfeld fehlt: Nachricht" }, 422, corsHeaders);
        }

        // ── Build MailerSend payload ──────────────────────────────────────────────
        const subjectLine = subject?.trim() ? subject.trim() : `Kontaktanfrage von ${name.trim()}`;

        const textBody = [
            `Name:    ${name.trim()}`,
            `E-Mail:  ${email.trim()}`,
            `Betreff: ${subjectLine}`,
            "",
            message.trim(),
        ].join("\n");

        const htmlBody = `
            <p><strong>Name:</strong> ${escHtml(name)}</p>
            <p><strong>E-Mail:</strong> ${escHtml(email)}</p>
            <p><strong>Betreff:</strong> ${escHtml(subjectLine)}</p>
            <hr>
            <p>${escHtml(message).replace(/\n/g, "<br>")}</p>
        `.trim();

        const payload = {
            from: {
                email: env.MAILERSEND_FROM_EMAIL,
                name: env.MAILERSEND_FROM_NAME,
            },
            to: [{ email: env.MAILERSEND_TO_EMAIL }],
            reply_to: { email: email.trim(), name: name.trim() },
            subject: subjectLine,
            text: textBody,
            html: htmlBody,
        };

        // ── Call MailerSend ───────────────────────────────────────────────────────
        let msResponse;
        try {
            msResponse = await fetch(MAILERSEND_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${env.MAILERSEND_API_KEY}`,
                },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error("MailerSend fetch failed:", err);
            return json({ error: "E-Mail konnte nicht gesendet werden." }, 502, corsHeaders);
        }

        // MailerSend returns 202 Accepted on success with an empty body
        if (msResponse.status === 202) {
            return json({ success: true }, 200, corsHeaders);
        }

        // Pass back MailerSend error details for debugging (never expose keys)
        const msError = await msResponse.text().catch(() => "");
        console.error("MailerSend error:", msResponse.status, msError);
        return json({ error: "E-Mail konnte nicht gesendet werden." }, 502, corsHeaders);
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...extraHeaders },
    });
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
