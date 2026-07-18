# Foodiq Cloud Storage

Production media uploads via **Cloudinary** (primary) with **AWS S3–compatible** architecture and a local **mock** provider for development.

## Architecture

```
Client (MediaUploader)
    │  multipart/form-data
    ▼
POST /api/media/upload  (+ JWT)
    │
    ├─ validate MIME / size / purpose
    ├─ storage.uploadFile()  →  Cloudinary | S3 | mock
    ├─ media_assets row
    └─ optional link to users / restaurants / menu / delivery_partners
```

| Piece | Path |
|-------|------|
| Facade | `services/storage/index.js` |
| Cloudinary | `services/storage/providers/cloudinary.js` |
| S3 / R2 / MinIO | `services/storage/providers/s3.js` |
| Local mock | `services/storage/providers/mock.js` |
| Validation | `services/storage/validate.js` |
| Multer | `middleware/uploadMiddleware.js` |
| APIs | `/api/media/*` |
| DB | `media_assets` |

## Environment

```env
# auto | cloudinary | s3 | mock
STORAGE_PROVIDER=auto

# Public API URL (used for mock file URLs)
API_PUBLIC_URL=http://localhost:4000

# --- Cloudinary ---
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# --- AWS S3 / compatible ---
S3_BUCKET=
S3_REGION=ap-south-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
# Optional CDN / custom endpoint (R2, MinIO)
# S3_CDN_URL=https://cdn.example.com
# S3_ENDPOINT=
# S3_FORCE_PATH_STYLE=true
# S3_ACL=public-read
# S3_SIGNED_URL_TTL=300
```

With `STORAGE_PROVIDER=auto`, Cloudinary is preferred if configured, then S3, else mock.

## Upload purposes

| Purpose | Allowed | Max | Auto-links |
|---------|---------|-----|------------|
| `restaurant_logo` | images | 5MB | `restaurants.logo_url` |
| `restaurant_banner` / `restaurant_cover` | images | 5MB | `banner_url` / `image_url` |
| `food` | images | 5MB | `menu_items.image_url` if `entity_id` |
| `category` | images | 3MB | category `image_url` |
| `user_profile` | images | 3MB | `users.profile_image_url` |
| `delivery_profile` | images | 3MB | `delivery_partners.profile_photo_url` |
| `vehicle` | images | 5MB | `vehicle_photo_url` |
| `license` / `vehicle_rc` / `insurance` | image+PDF | 8MB | partner doc columns (`pending` review) |
| `document` | PDF | 10MB | — |

Allowed types: **JPG, PNG, WEBP, PDF**. Executables and HTML/JS are blocked.

## APIs

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/media/upload` | field `file`, body `purpose`, optional `entity_id`, `link` |
| POST | `/api/media/upload/bulk` | field `files` |
| GET | `/api/media` | library (admin: `?scope=all`) |
| GET | `/api/media/:id` | |
| DELETE | `/api/media/:id` | deletes cloud object + DB row |
| POST | `/api/media/bulk-delete` | `{ ids: [] }` |
| PUT | `/api/media/:id/approve` | admin |
| PUT | `/api/media/:id/reject` | admin |
| GET/POST | `/api/media/signed` | signed upload params |
| GET | `/api/media/info` | active provider |

## UI

| Role | Page |
|------|------|
| Customer | Settings → Profile (cloud upload) |
| Restaurant | Settings → logo/banner; Add Dish image |
| Delivery | `/delivery/documents` |
| Admin | `/admin/media` — search, filter, preview, approve, bulk delete |

Reusable component: `components/media/MediaUploader.tsx`  
Client API: `services/mediaApi.ts` (progress + retry)

## Optimization & CDN

- Cloudinary: `quality:auto`, `fetch_format:auto`, variant URLs (`thumb` / `card` / `banner`)
- S3: `Cache-Control: public, max-age=31536000`
- Frontend: `loading="lazy"` on media previews
- Mock files served at `/media-files/*` with 7-day cache

## Database (`media_assets`)

Stores: `url`, `public_id`, `provider`, `mime_type`, `file_type`, `file_size`, `width`/`height`, `purpose`, `status`, `user_id`, `entity_*`, `variants`, timestamps.

Delivery partner columns added: `profile_photo_url`, `vehicle_photo_url`, `license_photo_url`, `vehicle_rc_url`, `insurance_doc_url`.

## Deployment checklist

1. Set Cloudinary **or** S3 credentials (never commit secrets).
2. Set `STORAGE_PROVIDER=cloudinary` (or `s3`) in production.
3. Add your CDN hostname to Next.js `images.remotePatterns` if needed.
4. Restart API so `ensureSchema` creates `media_assets` + delivery columns.
5. Confirm `/api/media/info` reports the expected provider.
6. Smoke-test profile photo + dish image upload.

## Security notes

- JWT required on all media routes
- MIME + extension consistency checks
- Purpose-based size limits
- Document uploads (`license`, `rc`, `insurance`) start as `pending` for admin review
- Users can only delete their own assets (admins: any)
- Prefer Cloudinary signed params / S3 presigned PUT for direct-to-cloud uploads at scale
