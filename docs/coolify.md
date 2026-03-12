# Coolify Deployment Guide

The Bauturbo Directory platform is designed to be easily deployed using **Coolify**. Since it relies on a static site generator (11ty) pulling data from a headless CMS (NocoDB), the deployment is configured as a **Dockerfile-based** build.

## How the Architecture Works in Coolify

When an update is pushed or a rebuild is triggered, Coolify builds the Docker image. 
During the `docker build` phase, 11ty makes API requests to NocoDB using the provided credentials, bakes the content into static HTML files, and then serves them using a lightweight Nginx image.

## Step-by-Step Setup

1. **Create a New Project/Environment**
   - Log into your Coolify instance.
   - Go to your Project and Environment.
   - Click **Add Resource** -> **Public Repository**.

2. **Configure Repository Source**
   - Enter the GitHub repository URL (`https://github.com/projecttogether/pt-app-directory-bauturbo` or your fork).
   - Alternatively, you can connect your GitHub App if you want automatic deployments on every commit.

3. **Deployment Method**
   - Select **Docker Compose** or **Dockerfile**. For just the frontend, **Dockerfile** deployment is standard as there is a `Dockerfile` at the root.

4. **Environment Variables & Build Arguments**
   This is the most critical step. Since NocoDB data is gathered _during the build_, credentials must be set as **Build Arguments**.
   
   | Variable | Description |
   |---|---|
   | `NOCODB_BASE_URL` | NocoDB instance URL (e.g. `https://nocodb.umsetzungslabor-bauturbo.de`) |
   | `NOCODB_API_TOKEN` | NocoDB API token |
   | `NOCODB_PROJECT_ID` | NocoDB project ID |

   > **Important:** In the Coolify Dashboard, add these to the **Build variables** section, ensuring that they are loaded correctly during the container build process. Normal runtime Environment Variables will not work!

5. **Network / Domain Configuration**
   - Under the resource **Settings**, define your expected public-facing domain (e.g. `https://praxiswissen.umsetzungslabor-bauturbo.de`).
   - Coolify will automatically provision TLS certificates using Let's Encrypt and proxy requests to the container's exposed port 80.

6. **Health Checks**
   The underlying Nginx configuration provides a lightweight health check endpoint.
   - Configure the **Health Check Path** in Coolify to `/-/healthz`.
   - The platform will verify the container is alive (it reports `200 OK` with a JSON timestamp).

## Keeping Data Up-To-Date

Since the site is completely static, changes made inside NocoDB will not be reflected on the live site until the container is rebuilt.

- **Manual Rebuild:** You can click the **"Redeploy"** button in the Coolify UI at any point.
- **Scheduled Rebuilds:** It is highly recommended to configure a **scheduled redeploy** (e.g. via a Webhook or Coolify's built-in cron scheduler) to run nightly (e.g., at 5:00 AM) to naturally catch up with any content changes. If available, you can also trigger a Coolify webhook dynamically when a NocoDB row changes.
