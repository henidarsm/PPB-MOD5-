// ---------------------------------------------------------------------------
// One-off maintenance script (NOT part of the app build).
//
// Re-uploads every product image in the Supabase `guns` bucket with
// `cache-control: max-age=31536000`, so the browser keeps them in its disk
// cache. Images uploaded by the app already get this header (uploadService);
// this only fixes images uploaded before that change.
//
// Run manually:
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=sb_publishable_xxx \
//     node scripts/reupload-images.mjs
// ---------------------------------------------------------------------------

const URL_ = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_KEY

if (!URL_ || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY first.')
  process.exit(1)
}

const h = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const rows = await (
  await fetch(`${URL_}/rest/v1/products?select=image_url,images`, { headers: h })
).json()

const urls = new Set()
rows.forEach((r) =>
  [r.image_url, ...(r.images || [])].forEach((u) => {
    if (u && u.includes('/storage/v1/object/public/guns/')) urls.add(u)
  }),
)
console.log(`Ditemukan ${urls.size} gambar`)

for (const u of urls) {
  const name = u.split('/guns/')[1].split('?')[0]
  try {
    const blob = await (await fetch(u, { cache: 'no-store' })).blob()
    const res = await fetch(`${URL_}/storage/v1/object/guns/${name}`, {
      method: 'POST',
      headers: {
        ...h,
        'Content-Type': blob.type,
        'cache-control': 'max-age=31536000',
        'x-upsert': 'true',
      },
      body: blob,
    })
    console.log(res.ok ? '✅' : `❌ ${res.status}`, name)
  } catch (e) {
    console.log('❌', name, e.message)
  }
}
console.log('Selesai')
