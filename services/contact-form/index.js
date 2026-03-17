import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const MAILERSEND_API = "https://api.mailersend.com/v1/email";

app.use(express.json());

// CORS configuration based on ALLOWED_ORIGIN env var
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

if (allowedOrigins.length > 0) {
    app.use(cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    }));
} else {
    // If not set, allow all for easier local testing.
    app.use(cors());
}

// Healthcheck endpoint
app.get('/-/healthz', (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(422).json({ error: "Pflichtfeld fehlt: Name" });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(422).json({ error: "Ungültige E-Mail-Adresse" });
        }
        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(422).json({ error: "Pflichtfeld fehlt: Nachricht" });
        }

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
                email: process.env.MAILERSEND_FROM_EMAIL,
                name: process.env.MAILERSEND_FROM_NAME,
            },
            to: [{ email: process.env.MAILERSEND_TO_EMAIL }],
            reply_to: { email: email.trim(), name: name.trim() },
            subject: subjectLine,
            text: textBody,
            html: htmlBody,
        };

        const msResponse = await fetch(MAILERSEND_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        if (msResponse.status === 202) {
            return res.status(200).json({ success: true });
        }

        const msError = await msResponse.text().catch(() => "");
        console.error("MailerSend error:", msResponse.status, msError);
        return res.status(502).json({ error: "E-Mail konnte nicht gesendet werden." });
    } catch (err) {
        console.error("Internal Server Error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

function escHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

app.listen(port, () => {
    console.log(`Contact form microservice listening on port ${port}`);
});
