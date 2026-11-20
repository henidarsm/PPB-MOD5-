# Bore & Barrel

A dummy gunshop storefront built as a Progressive Web App (React + Vite +
vite-plugin-pwa), backed by Supabase. Works offline with an app shell, a web
app manifest and a service worker.

## Setup

```bash
npm install
cp .env.example .env     # then fill in your Supabase URL + publishable key
npm run dev              # dev server with HMR
```

**Database:** run `supabase-migration.sql` once in the Supabase SQL Editor
(adds `deleted_at`, `seller_phone`, `images` and the `review_votes` table).

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Day 2 features

| # | Feature | Where |
|---|---------|-------|
| 1 | Catalog pagination (server-side limit/offset + exact total) | `pages/Catalog.jsx`, `services/gunService.js`, `components/common/Pagination.jsx` |
| 2 | Share link — every product has a unique URL `#/gun/<id>` | `router.js`, `components/common/ShareButton.jsx`, `pages/GunDetailPage.jsx` |
| 3 | Lazy loading — route code-splitting (`React.lazy`), lazy images, reviews fetched on scroll | `App.jsx`, `hooks/useInView.js` |
| 4 | Query caching — TanStack Query (1 min fresh, 10 min in memory), invalidated on create/edit/archive | `main.jsx`, `hooks/*` |
| 5 | Profile: About, Contact, Drafts list, separate Edit Profile page | `pages/ProfilePage.jsx`, `pages/ProfileEditPage.jsx` |
| 6 | Soft delete / archive with restore and permanent delete | `pages/ArchivePage.jsx`, `components/modals/ArchiveModal.jsx` |
| 7 | Review CRUD (own reviews) + thumbs up/down | `components/gun/ReviewsSection.jsx`, `services/reviewService.js` |
| 8 | "Hubungi Penjual" → WhatsApp (`wa.me`), per-product number or `VITE_DEFAULT_SELLER_PHONE` | `components/common/ContactSellerButton.jsx` |
| 9 | Multiple images per product, first = cover, gallery on detail | `components/common/MultiImagePicker.jsx`, `components/gun/ImageGallery.jsx` |

Routes (hash-based): `#/` catalog, `#/gun/:id`, `#/gun/:id/edit`, `#/create`,
`#/favorites`, `#/archive`, `#/profile`, `#/profile/edit`.

## Structure

```
src/
├── main.jsx / App.jsx / router.js     # entry, route switch, hash router
├── config/api.js                      # axios + Supabase headers
├── services/                          # gun, review, favorite, upload, user
├── hooks/                             # TanStack Query hooks, useInView, useDebounced
├── components/ (common, gun, modals)  # cards, detail, reviews, pickers, modals
├── pages/                             # Catalog, GunDetailPage, Create/Edit, Archive,
│                                      # Favorites, Profile, ProfileEdit, About, Contact
└── utils/                             # helpers, draftStorage
```
