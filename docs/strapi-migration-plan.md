# Strapi Migration Plan

## Overview

This document outlines the migration from NocoDB to Strapi as the headless CMS for the Bauturbo Directory platform.

**Branch:** `feature/strapi-migration`  
**Created:** 2026-01-23

---

## Current Architecture

```
NocoDB (CMS) ──API──> 11ty Build ──> Static Files ──> Nginx ──> Public Website
```

### Current Stack
- **CMS:** NocoDB (self-hosted at nocodb.projecttogether.org)
- **Static Site Generator:** 11ty (Eleventy)
- **Data Fetching:** @11ty/eleventy-fetch with NocoDB REST API
- **Hosting:** Nginx on pt-web-1

### Current Content Types (4 directories)
| Directory | NocoDB Table ID | Fields |
|-----------|----------------|--------|
| Umsetzungsprojekte | m1upwxd94s5tx1q | Title, Excerpt, Status, Kategorie, Tag |
| Grundsatzbeschlüsse | mk0mt3yqjbo3o5h | Title, Excerpt, Status, Kategorie |
| Entscheidungshilfen | m7qvtyirlntl70e | Title, Excerpt, Kategorie |
| Veranstaltungen | m8jasn9y31wte9c | Title, Excerpt, Datum, Kategorie |

---

## Target Architecture

```
Strapi (CMS) ──REST/GraphQL──> 11ty Build ──> Static Files ──> Nginx ──> Public Website
```

### Why Strapi?
- ✅ **Better content modeling** - Custom fields, relations, components
- ✅ **Built-in admin UI** - More polished editor experience
- ✅ **Media library** - Built-in image/file management
- ✅ **Role-based access** - Granular permissions
- ✅ **REST & GraphQL APIs** - Flexible data fetching
- ✅ **Webhooks** - Trigger rebuilds on content changes
- ✅ **Active community** - Regular updates, plugins ecosystem

---

## Implementation Phases

### Phase 1: Strapi Setup & Configuration
**Estimated time:** 2-3 hours

#### 1.1 Create Strapi Project
```bash
# Create new Strapi project in repository
npx create-strapi@latest strapi --quickstart --no-run

# Or for production with PostgreSQL:
npx create-strapi@latest strapi --dbclient=postgres
```

#### 1.2 Content Types to Create

**Collection Type: `Directory`**
| Field | Type | Notes |
|-------|------|-------|
| name | Text (Short) | e.g., "Umsetzungsprojekte" |
| slug | UID | Auto-generated from name |
| path | Text (Short) | URL path, e.g., "/projekte" |
| description | Text (Long) | Directory description |

**Collection Type: `DirectoryItem`**
| Field | Type | Notes |
|-------|------|-------|
| title | Text (Short) | Required |
| excerpt | Text (Long) | Short description |
| content | Rich Text | Full content (Markdown) |
| status | Enumeration | Draft, Published, Archived |
| categories | Relation | Many-to-many with Category |
| tags | Relation | Many-to-many with Tag |
| date | Date | For events |
| directory | Relation | Many-to-one with Directory |
| featuredImage | Media | Optional image |

**Collection Type: `Category`**
| Field | Type | Notes |
|-------|------|-------|
| name | Text (Short) | Category name |
| slug | UID | Auto-generated |

**Collection Type: `Tag`**
| Field | Type | Notes |
|-------|------|-------|
| name | Text (Short) | Tag name |
| slug | UID | Auto-generated |

#### 1.3 Configure API Permissions
- Set public read access for all content types
- Configure admin roles for content editors

---

### Phase 2: Data Migration
**Estimated time:** 1-2 hours

#### 2.1 Export Data from NocoDB
```bash
# Create migration script
node scripts/export-nocodb-data.js
```

#### 2.2 Import Data to Strapi
- Use Strapi Import/Export plugin or custom script
- Verify all 4 directories and their items are migrated
- Map NocoDB fields to Strapi fields

#### 2.3 Migration Script Structure
```javascript
// scripts/migrate-to-strapi.js
// 1. Fetch all data from NocoDB
// 2. Create directories in Strapi
// 3. Create categories and tags
// 4. Create directory items with relations
```

---

### Phase 3: Update 11ty Data Layer
**Estimated time:** 2-3 hours

#### 3.1 Update Environment Variables
```dotenv
# .env (new)
STRAPI_BASE_URL=https://strapi.projecttogether.org
STRAPI_API_TOKEN=your_strapi_api_token
```

#### 3.2 Update `directories.js`
Replace NocoDB API calls with Strapi REST API:

```javascript
// Before (NocoDB)
const url = `${nocodb.base_url}/api/v1/db/data/noco/${project_id}/${table_id}/views/${view_id}`;

// After (Strapi)
const url = `${strapi.base_url}/api/directory-items?filters[directory][slug][$eq]=${directorySlug}&populate=*`;
```

#### 3.3 Update `config.yml`
```yaml
# Before
directories:
  - id: umsetzungsprojekte
    nocodb:
      table_id: m1upwxd94s5tx1q
      view_id: vw0efitq0kedrj5l

# After
directories:
  - id: umsetzungsprojekte
    strapi:
      slug: umsetzungsprojekte
```

#### 3.4 Create Strapi Data Fetcher
```javascript
// src/_data/strapi.js
const EleventyFetch = require("@11ty/eleventy-fetch");

async function fetchFromStrapi(endpoint) {
  const url = `${process.env.STRAPI_BASE_URL}/api/${endpoint}`;
  return EleventyFetch(url, {
    duration: "1h",
    type: "json",
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
    },
  });
}
```

---

### Phase 4: Deployment Setup
**Estimated time:** 2-3 hours

#### 4.1 Strapi Hosting Options

**Option A: Same Server (pt-web-1)** ✅ Recommended
- Add Strapi as Docker container or PM2 process
- PostgreSQL or SQLite database
- Nginx reverse proxy

**Option B: Separate Server**
- Dedicated Strapi server
- More resources for admin panel

#### 4.2 Docker Compose for Strapi
```yaml
# docker-compose.yml
version: '3'
services:
  strapi:
    image: strapi/strapi
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: db
      DATABASE_PORT: 5432
      DATABASE_NAME: strapi
      DATABASE_USERNAME: strapi
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - ./strapi:/srv/app
    ports:
      - "1337:1337"
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: strapi
      POSTGRES_USER: strapi
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - strapi-data:/var/lib/postgresql/data

volumes:
  strapi-data:
```

#### 4.3 Nginx Configuration
```nginx
# Strapi admin and API
server {
    server_name strapi.projecttogether.org;
    
    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4.4 Webhook for Auto-Rebuild
Configure Strapi webhook to trigger 11ty rebuild on content changes:
- Webhook URL: `https://pt-web-1/api/rebuild-directory`
- Events: Create, Update, Delete on DirectoryItem

---

### Phase 5: Testing & Validation
**Estimated time:** 1-2 hours

#### 5.1 Testing Checklist
- [ ] All 4 directories display correctly
- [ ] Filters work (Status, Kategorie, Tags, Date)
- [ ] Detail pages render properly
- [ ] Images/media load correctly
- [ ] Build time is acceptable (<30s)
- [ ] Webhook triggers rebuild

#### 5.2 Content Comparison
- Export both NocoDB and Strapi data
- Compare item counts and content

---

### Phase 6: Go Live & Cleanup
**Estimated time:** 1 hour

#### 6.1 Cutover Steps
1. Final data sync from NocoDB to Strapi
2. Update production `.env` with Strapi credentials
3. Run production build
4. Verify site works correctly
5. Update deployment scripts

#### 6.2 Cleanup
- Remove NocoDB references from code
- Update README.md
- Archive old configuration

---

## File Changes Summary

### New Files
| File | Description |
|------|-------------|
| `strapi/` | Strapi CMS project directory |
| `docker-compose.yml` | Docker setup for Strapi + PostgreSQL |
| `scripts/migrate-to-strapi.js` | Data migration script |
| `frontend/src/_data/strapi.js` | Strapi API helper |

### Modified Files
| File | Changes |
|------|---------|
| `frontend/.env.example` | Replace NocoDB vars with Strapi vars |
| `frontend/config.yml` | Replace `nocodb:` with `strapi:` config |
| `frontend/src/_data/directories.js` | Use Strapi API instead of NocoDB |
| `frontend/package.json` | Update description |
| `README.md` | Update documentation |
| `nginx.conf` | Add Strapi reverse proxy |

### Removed Files
| File | Reason |
|------|--------|
| NocoDB table/view IDs in config | Replaced with Strapi slugs |

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Strapi Setup | 2-3 hours | None |
| Phase 2: Data Migration | 1-2 hours | Phase 1 |
| Phase 3: 11ty Update | 2-3 hours | Phase 1 |
| Phase 4: Deployment | 2-3 hours | Phase 1-3 |
| Phase 5: Testing | 1-2 hours | Phase 1-4 |
| Phase 6: Go Live | 1 hour | Phase 5 |

**Total: 9-14 hours**

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Full NocoDB backup before migration |
| Strapi API response format differs | Medium | Create abstraction layer in 11ty |
| Performance issues | Medium | Use caching, optimize queries |
| Editor learning curve | Low | Provide Strapi training/docs |

---

## Rollback Plan

If issues arise:
1. Revert to `main` branch
2. Restore NocoDB credentials in `.env`
3. Run 11ty build with original code
4. Continue using NocoDB until issues resolved

---

## Next Steps

1. [ ] Review and approve this plan
2. [ ] Set up local Strapi instance for development
3. [ ] Create content types in Strapi
4. [ ] Write migration script
5. [ ] Update 11ty data layer
6. [ ] Test locally
7. [ ] Deploy to staging
8. [ ] Final testing and go-live
