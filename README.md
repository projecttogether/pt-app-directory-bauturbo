<div align="center">
  <h1>Bauturbo Directory</h1>
  <p>
    <strong>A high-performance, static directory platform built with 11ty and powered by NocoDB.</strong>
  </p>
  <p>
    <a href="https://praxiswissen.umsetzungslabor-bauturbo.de">Live Site</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>
  <p>
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
    <img alt="Node Version" src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" />
    <img alt="11ty" src="https://img.shields.io/badge/11ty-Static_Site_Generator-black.svg" />
    <img alt="TailwindCSS" src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css" />
  </p>
</div>

---

## 📖 Overview

The **Bauturbo Directory** is a customizable, high-performance static website originally designed for the "Umsetzungslabor Bau-Turbo" project. It leverages **Eleventy (11ty)** for lightning-fast static site generation and uses **NocoDB** as a headless CMS for seamless content management.

Whether you're hosting resources, publications, or event listings, this platform is designed to be fully configurable via YAML, enabling deep customization without writing code.

---

## ✨ Key Features

- 🎨 **Custom Theming:** Easily configure colors, fonts, and branding via a central `config.yml`.
- 🧩 **Component-Driven Architecture:** Build rich, modular pages using reusable Nunjucks components fed directly from NocoDB sections.
- 🔍 **Dynamic Filtering:** Configurable, client-side filters (by category, date, etc.) that adapt automatically to your NocoDB columns.
- ⚡ **Static Site Generation:** Outputs pure HTML/CSS/JS for blazing-fast performance, maximum security, and easy CDN hosting.
- 🗄️ **Headless CMS integration:** Content authors can manage everything in a familiar spreadsheet-like interface via NocoDB.
- 📬 **Contact Form with Email Delivery:** A static-site-compatible contact form that securely submits messages via a locally hosted Node.js microservice to the MailerSend API — keeping everything within your own infrastructure.

---

## 🛠️ Tech Stack

- **Frontend:** [Eleventy (11ty)](https://www.11ty.dev/), [Nunjucks](https://mozilla.github.io/nunjucks/), Vanilla JS
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend/CMS:** [NocoDB](https://nocodb.com/), PostgreSQL
- **Deployment:** Docker, [Coolify](https://coolify.io/)

---

## 🚀 Quick Start

The fastest way to get the entire stack—including the CMS, Database, and Frontend—running locally is by using Docker Compose.

### 1. Start the Stack

Spin up NocoDB, PostgreSQL, and the 11ty frontend in the background:

```bash
docker-compose up -d
```

### 2. Setup the CMS

1. Navigate to **[http://localhost:8080](http://localhost:8080)** to access the NocoDB Admin UI.
2. Complete the setup wizard to create an admin account and a new project/base.
3. Import the initial project schema and data from the `docs/nocodb-data/` folder (via _Settings -> Import Base_).
4. Generate an **API token** in your NocoDB profile settings (you will need the token and the base **Project ID**).

### 3. Connect the Frontend

1. Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2. Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
3. Update `.env` with your newly created `NOCODB_API_TOKEN` and `NOCODB_PROJECT_ID`.

### 4. Build and Run the Frontend

If you prefer running the frontend natively (outside of Docker for development):

```bash
npm install
npm run dev
```

The frontend will be accessible at **[http://localhost:8080/](http://localhost:8080/)** (or whichever port Eleventy assigns, since 8080 might be in use by NocoDB, it usually falls back to `8081`).

_Alternatively, you can build the frontend via Docker Compose using `docker-compose --profile frontend up --build` which will expose it on port 8081._

---

## 📚 Documentation

For developers looking to maintain, configure, or extend the platform, please review our comprehensive guides located in the `docs/` directory:

- **[Frontend Architecture Guide](docs/frontend.md):** Deep dive into the 11ty build lifecycle, Nunjucks components, and client-side logic.
- **[Configuration Guide](docs/config.md):** Learn how to edit `config.yml` to change themes, setup navigation, and map NocoDB directories.
- **[NocoDB Authoring Guide](docs/nocodb.md):** Instructions for content authors on creating pages and troubleshooting the CMS.
- **[NocoDB Schema Requirements](docs/schema.md):** Detailed breakdown of mandatory and optional database columns necessary to prevent build failures.
- **[Coolify Deployment Guide](docs/coolify.md):** Step-by-step instructions for deploying the platform into production.
- **[Scripts & Utilities](docs/scripts.md):** Overview of the helper scripts bundled in this repository.
- **[Contact Form Guide](docs/contact-form.md):** How the static-compatible contact form works, how to deploy and configure the Node.js microservice in Coolify, and how to manage MailerSend secrets.

---

## 🗂️ Project Structure

```text
.
├── docker-compose.yml        # Local full-stack orchestration
├── docs/                     # Developer documentation and guides
│   └── nocodb-data/          # JSON schema and CSV data dumps for NocoDB
└── frontend/                 # 11ty Static Site Source
    ├── config.yml            # Main application configuration
    ├── .env.example          # Sample environment variables
    ├── src/
    │   ├── _data/            # Build-time API calls (Node.js)
    │   ├── _includes/        # Reusable UI components & layouts (Nunjucks)
    │   ├── assets/           # CSS, Fonts, Images
    │   ├── pages.njk         # CMS-driven root pages renderer
    │   └── item-detail.njk   # Directory detail pages renderer
    └── package.json          # Node dependencies and build scripts
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
