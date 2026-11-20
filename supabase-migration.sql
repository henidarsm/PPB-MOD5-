-- ============================================================================
-- Bore & Barrel — Day 2 schema changes.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================================

-- 6. Soft delete / archive: a row with deleted_at set is hidden from the catalog.
alter table public.products add column if not exists deleted_at timestamptz;

-- 8. "Hubungi Penjual": per-product seller WhatsApp number.
alter table public.products add column if not exists seller_phone text;

-- 9. Multiple images per product. `image_url` stays as the cover image.
alter table public.products add column if not exists images text[] not null default '{}';
update public.products set images = array[image_url]
  where image_url is not null and cardinality(images) = 0;

-- 7. Thumbs up / down on reviews (one vote per user per review).
-- review_id is text so it works whether reviews.id is bigint or uuid.
create table if not exists public.review_votes (
  id         bigint generated always as identity primary key,
  review_id  text        not null,
  user_id    uuid        not null,
  vote       smallint    not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);
create index if not exists review_votes_review_idx on public.review_votes (review_id);

-- The app has no login (users are anonymous client-side UUIDs), so these
-- policies are open, like the existing tables. Tighten them if you add auth.
alter table public.review_votes enable row level security;

drop policy if exists "review_votes read"   on public.review_votes;
drop policy if exists "review_votes insert" on public.review_votes;
drop policy if exists "review_votes update" on public.review_votes;
drop policy if exists "review_votes delete" on public.review_votes;
create policy "review_votes read"   on public.review_votes for select using (true);
create policy "review_votes insert" on public.review_votes for insert with check (true);
create policy "review_votes update" on public.review_votes for update using (true) with check (true);
create policy "review_votes delete" on public.review_votes for delete using (true);

-- Existing `products` policies must already allow UPDATE (archive/restore are
-- UPDATEs of deleted_at) and DELETE (permanent delete) for the anon role.
