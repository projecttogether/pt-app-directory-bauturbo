# Strapi Migration for Directory Bauturbo

## Overview

This document tracks the migration from NocoDB to Strapi as the CMS backend for the directory_bauturbo project.

**Goal**: Replace NocoDB with Strapi as the headless CMS for managing directory content.

**Target Domain**: `cms.umsetzungslabor-bauturbo.de`

## Current Status: 🔴 Blocked

Strapi is deployed via Coolify but the production setup is not stable. The current container loops during bootstrap and `/admin` is not reachable.

---

## Recent Work Summary (2026-01-23)

### What we tried

1. **Fixed Traefik routing and health checks**
   - Added `traefik.docker.network=coolify`.
   - Removed custom router labels, then briefly added a `/admin` router to port `5173` for the Vite dev server.
   - Switched Strapi healthcheck to `/_health` so Traefik stops returning `503`.

2. **Got Strapi dev image working internally**
   - `elestio/strapi-development:latest` started.
   - `/admin` returned 403 due to Vite `allowedHosts`, then 404 because the dev admin server was on `5173`.
   - Verified `/_health` returns `204`.

3. **Attempted production build**
   - Tried `strapi/strapi` and `ghcr.io/strapi/strapi`; registry access failed or tags not found.
   - Switched to a production build using `node:20-bullseye` and a persistent volume at `/srv/app`.
   - `create-strapi` failed due to missing DB args, then continued to fail because `/srv/app` is not empty, leaving the container in a restart loop.

### Current behavior

- Strapi container loops on startup:
  - `Error: You can only create a Strapi app in an empty directory`
  - `error Couldn't find a package.json file in "/srv/app"`
- `https://cms.umsetzungslabor-bauturbo.de/admin` returns `no available server` because the app never becomes healthy.

---

## Assumptions About the Root Issue

1. **Bootstrap loop caused by persistent volume state**
   - `/srv/app` contains partial files from failed `create-strapi` runs.
   - The container boot command retries endlessly and never reaches `yarn build` or `yarn start`.

2. **Production setup needs a single source of truth**
   - We need a clean app directory (volume) and a deterministic bootstrap flow.
   - The dev image (`elestio/strapi-development`) will always serve `/admin` on a Vite port, which is not production-ready.

---

## Proposed Next Steps (Production Fix)

1. **Wipe the app volume and re-bootstrap cleanly**
   - Stop container, remove the `strapi-app` volume, redeploy.
   - Ensure the command includes DB args:
     - `--dbhost`, `--dbport`, `--dbname`, `--dbusername`, `--dbpassword`.

2. **Pin the Strapi version**
   - Use `create-strapi@5.33.4` so the generated app matches the runtime dependencies.

3. **Verify boot flow**
   - Watch logs for `Strapi started successfully`.
   - Confirm health: `/_health` returns `204`.
   - Access admin: `https://cms.umsetzungslabor-bauturbo.de/admin`.

---

## Deployment Details

### Coolify Service Configuration

- **Service ID**: `mcgkcskgk4ck08kokkc80cg0`
- **Container Name**: `strapi-mcgkcskgk4ck08kokkc80cg0`
- **Image**: `elestio/strapi-development:latest`
- **Database**: PostgreSQL (`postgresql-mcgkcskgk4ck08kokkc80cg0`)
- **Compose File**: `/data/coolify/services/mcgkcskgk4ck08kokkc80cg0/docker-compose.yml`

### Network Configuration

| Container | Network | IP Address |
|-----------|---------|------------|
| coolify-proxy (Traefik) | coolify | 10.0.1.6 |
| strapi-mcgkcskgk4ck08kokkc80cg0 | coolify | 10.0.1.9 |
| strapi-mcgkcskgk4ck08kokkc80cg0 | mcgkcskgk4ck08kokkc80cg0 | 10.0.2.3 |
| strapi-mcgkcskgk4ck08kokkc80cg0 | mcgkcskgk4ck08kokkc80cg0_default | 10.0.3.2 |

### Traefik Labels on Strapi Container

```
traefik.enable=true
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https

# HTTP Router (redirect to HTTPS)
traefik.http.routers.http-0-mcgkcskgk4ck08kokkc80cg0-strapi.entryPoints=http
traefik.http.routers.http-0-mcgkcskgk4ck08kokkc80cg0-strapi.middlewares=redirect-to-https
traefik.http.routers.http-0-mcgkcskgk4ck08kokkc80cg0-strapi.rule=Host(`cms.umsetzungslabor-bauturbo.de`) && PathPrefix(`/`)
traefik.http.routers.http-0-mcgkcskgk4ck08kokkc80cg0-strapi.service=http-0-mcgkcskgk4ck08kokkc80cg0-strapi

# HTTPS Router
traefik.http.routers.https-0-mcgkcskgk4ck08kokkc80cg0-strapi.entryPoints=https
traefik.http.routers.https-0-mcgkcskgk4ck08kokkc80cg0-strapi.middlewares=gzip
traefik.http.routers.https-0-mcgkcskgk4ck08kokkc80cg0-strapi.rule=Host(`cms.umsetzungslabor-bauturbo.de`) && PathPrefix(`/`)
traefik.http.routers.https-0-mcgkcskgk4ck08kokkc80cg0-strapi.service=https-0-mcgkcskgk4ck08kokkc80cg0-strapi
traefik.http.routers.https-0-mcgkcskgk4ck08kokkc80cg0-strapi.tls=true
traefik.http.routers.https-0-mcgkcskgk4ck08kokkc80cg0-strapi.tls.certresolver=letsencrypt

# Custom labels (added manually)
traefik.http.routers.strapi-bauturbo.entrypoints=https
traefik.http.routers.strapi-bauturbo.rule=Host(`cms.umsetzungslabor-bauturbo.de`)
traefik.http.routers.strapi-bauturbo.tls=true
traefik.http.routers.strapi-bauturbo.tls.certresolver=letsencrypt

# Services
traefik.http.services.http-0-mcgkcskgk4ck08kokkc80cg0-strapi.loadbalancer.server.port=1337
traefik.http.services.https-0-mcgkcskgk4ck08kokkc80cg0-strapi.loadbalancer.server.port=1337
traefik.http.services.strapi-bauturbo.loadbalancer.server.port=1337
```

---

## Troubleshooting Performed

### ✅ Verified Working

1. **Strapi container is running and healthy**
   ```bash
   sudo docker ps | grep strapi
   # Shows: strapi-mcgkcskgk4ck08kokkc80cg0 (healthy)
   ```

2. **Strapi responds internally**
   ```bash
   sudo docker exec strapi-mcgkcskgk4ck08kokkc80cg0 curl -s http://127.0.0.1:1337/admin
   # Returns: 200 OK with HTML content
   ```

3. **Direct IP access from Traefik container works**
   ```bash
   sudo docker exec coolify-proxy wget -qO- http://10.0.1.9:1337/admin | head -5
   # Returns: HTML content (Strapi admin page)
   ```

4. **Both containers are on the same network (coolify)**
   - coolify-proxy: 10.0.1.6
   - strapi: 10.0.1.9

5. **Traefik labels are present on the container**
   ```bash
   sudo docker inspect strapi-mcgkcskgk4ck08kokkc80cg0 --format '...' | grep traefik
   # Shows all expected labels
   ```

### ❌ Not Working

1. **External access via domain returns 503**
   ```bash
   curl -sI https://cms.umsetzungslabor-bauturbo.de/admin
   # HTTP/2 503
   # content-type: text/plain; charset=utf-8
   # (body: "no available server")
   ```

2. **Traefik API returns empty/no response**
   ```bash
   sudo docker exec coolify-proxy wget -qO- http://localhost:8080/api/http/routers
   # Returns nothing (empty)
   
   sudo docker exec coolify-proxy wget -qO- http://localhost:8080/api/http/services | grep strapi
   # Returns nothing
   ```

3. **No Strapi-related entries in Traefik logs**
   ```bash
   sudo docker logs coolify-proxy 2>&1 | grep strapi
   # No output
   ```

### Traefik Configuration

Traefik is started with these flags:
```
--providers.docker=true
--providers.docker.exposedbydefault=false
--providers.file.directory=/traefik/dynamic/
--providers.file.watch=true
--api.dashboard=true
--api.insecure=false
```

The `/traefik/dynamic/` directory is empty (no `.yaml` files).

---

## Suspected Issues

1. **Traefik not discovering Strapi container labels**
   - Labels are on the container but Traefik API shows no routers/services for Strapi
   - Other containers (like directory_bauturbo frontend) work fine
   - Possible Docker provider issue with this specific container

2. **Conflicting router definitions**
   - There are multiple routers for the same domain (Coolify-generated + custom)
   - The `strapi-bauturbo` router doesn't explicitly link to its service

3. **Traefik API not accessible**
   - API endpoint returns empty despite `--api.dashboard=true`
   - Might need `--api.insecure=true` for local access

---

## Next Steps to Try

1. **Restart the Strapi service from Coolify UI**
   - May regenerate labels correctly

2. **Remove custom labels and rely on Coolify-generated ones**
   - Edit docker-compose.yml to remove `strapi-bauturbo` labels

3. **Check Traefik's Docker provider socket access**
   ```bash
   sudo docker exec coolify-proxy ls -la /var/run/docker.sock
   ```

4. **Enable Traefik debug logging**
   ```bash
   # Add to Traefik command or docker-compose
   --log.level=DEBUG
   ```

5. **Verify Traefik sees the container**
   ```bash
   sudo docker exec coolify-proxy traefik healthcheck
   ```

6. **Try restarting coolify-proxy after Strapi is fully up**
   ```bash
   sudo docker restart coolify-proxy
   ```

---

## Related Files

- **Coolify Compose**: `/data/coolify/services/mcgkcskgk4ck08kokkc80cg0/docker-compose.yml`
- **Traefik Config**: `/data/coolify/proxy/` (mounted to `/traefik/` in container)
- **Migration Plan**: `docs/strapi-migration-plan.md`

## Migration Plan (Once Routing Fixed)

1. Access Strapi admin at `https://cms.umsetzungslabor-bauturbo.de/admin`
2. Create admin user
3. Configure content types:
   - Directory (name, description, slug)
   - DirectoryItem (title, description, link, category, tags)
   - Category (name, slug)
   - Tag (name, slug)
4. Migrate data from NocoDB
5. Update 11ty `directories.js` to fetch from Strapi API
6. Test and redeploy frontend
