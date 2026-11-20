import { useState, useMemo, useRef } from 'react'
import { RefreshCw, Plus, Loader, AlertCircle, PackageOpen } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import { useDebounced } from '../hooks/useDebounced'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import AdvancedFilter from '../components/common/AdvancedFilter'
import Pagination from '../components/common/Pagination'
import ArchiveModal from '../components/modals/ArchiveModal'
import { navigate } from '../router'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  CATEGORIES,
} from '../utils/helpers'

const PAGE_SIZE = 8

/**
 * Catalog page — the main product listing.
 *
 * Search, category, sort and pagination are all done on the server
 * (Supabase), and every page is cached by TanStack Query. When the server
 * is unreachable the user can switch to the bundled local catalog, which is
 * filtered and paginated on the client with the same UI.
 */
export default function Catalog() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [useLocal, setUseLocal] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const listTop = useRef(null)

  const debouncedSearch = useDebounced(search)

  const { guns, loading, fetching, error, pagination, refetch } = useGuns({
    search: debouncedSearch,
    category: activeCategory,
    sort_by: sortKey,
    order: sortOrder,
    page,
    limit: PAGE_SIZE,
  })

  // Offline / local catalog (client-side filter + paginate)
  const offline = useLocal || (Boolean(error) && guns.length === 0)
  const localAll = useMemo(() => {
    const all = GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    const filtered = all.filter(
      (g) => matchesSearch(g, debouncedSearch) && matchesCategory(g, activeCategory),
    )
    return sortItems(filtered, sortKey, sortOrder)
  }, [debouncedSearch, activeCategory, sortKey, sortOrder])

  const items = offline ? localAll.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : guns
  const total = offline ? localAll.length : pagination?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Reset to page 1 whenever the filters change.
  const resetPage = () => setPage(1)

  const goToPage = (p) => {
    setPage(p)
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      <section ref={listTop}>
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {total} piece{total !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => navigate('/create')}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <AdvancedFilter
          search={search}
          onSearch={(v) => { setSearch(v); resetPage() }}
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategory={(c) => { setActiveCategory(c); resetPage() }}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => { setSortKey(key); setSortOrder(order); resetPage() }}
        />

        {loading && !offline && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button type="button" className="btn btn--outline" onClick={() => setUseLocal(true)}>
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search.</p>
          </div>
        )}

        {items.length > 0 && (
          <ul className={`stock${fetching && !offline ? ' stock--fetching' : ''}`}>
            {items.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={(g) => navigate(`/gun/${g.id}`)}
                onEdit={(g) => navigate(`/gun/${g.id}/edit`)}
                onDelete={setArchiveTarget}
              />
            ))}
          </ul>
        )}

        <Pagination page={page} totalPages={totalPages} onPage={goToPage} />

        {offline && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); refetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      <ArchiveModal
        gun={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onDone={() => {
          // Archiving the last item on a page → step back so we don't land on an empty page.
          if (items.length === 1 && page > 1) setPage(page - 1)
          setArchiveTarget(null)
        }}
      />
    </>
  )
}
