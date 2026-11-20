import { useSyncExternalStore } from 'react'

// ---------------------------------------------------------------------------
// Tiny hash router. Hash URLs (e.g. https://app/#/gun/12) work on any static
// host and inside the PWA shell without server rewrites, and give every
// product a unique, shareable link plus a working browser back button.
// ---------------------------------------------------------------------------

const subscribe = (cb) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const getSnapshot = () => window.location.hash || '#/'

export function parseHash(hash) {
  const raw = (hash || '#/').replace(/^#/, '') || '/'
  const [pathPart, queryPart = ''] = raw.split('?')
  const segments = pathPart.split('/').filter(Boolean).map(decodeURIComponent)
  return { path: '/' + segments.join('/'), segments, query: new URLSearchParams(queryPart) }
}

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => '#/')
  return parseHash(hash)
}

export const navigate = (path) => {
  const next = `#${path.startsWith('/') ? path : '/' + path}`
  if (window.location.hash === next) window.scrollTo({ top: 0 })
  else window.location.hash = next
}

export const goBack = (fallback = '/') => {
  if (window.history.length > 1) window.history.back()
  else navigate(fallback)
}

/** Absolute, shareable URL of a product. */
export const gunUrl = (id) =>
  `${window.location.origin}${window.location.pathname}#/gun/${encodeURIComponent(id)}`
