import { ChevronLeft, ChevronRight } from 'lucide-react'

// Build a compact page list like: 1 … 4 5 [6] 7 8 … 20
const buildPages = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, page, page - 1, page + 1])
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (page >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…' + p)
    out.push(p)
  })
  return out
}

/**
 * Page navigation for the catalog.
 * @param {number}   page       current page (1-based)
 * @param {number}   totalPages
 * @param {Function} onPage     (page) => void
 */
export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Catalog pages">
      <button
        type="button"
        className="page-btn"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {buildPages(page, totalPages).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="page-gap" aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`page-btn${p === page ? ' page-btn--active' : ''}`}
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className="page-btn"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
