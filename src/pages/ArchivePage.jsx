import { useState } from 'react'
import { Archive, RotateCcw, Trash2, Loader, AlertCircle } from 'lucide-react'
import { useGuns, useInvalidateGuns } from '../hooks/useGuns'
import gunService from '../services/gunService'
import { IS_SUPABASE } from '../config/api'
import Pagination from '../components/common/Pagination'
import ConfirmModal from '../components/modals/ConfirmModal'
import { formatPrice } from '../utils/helpers'

const PAGE_SIZE = 8

/**
 * Archive — soft-deleted products. Each can be restored to the catalog or
 * deleted permanently.
 */
export default function ArchivePage() {
  const [page, setPage] = useState(1)
  const { guns, loading, error, pagination, refetch } = useGuns({
    archived: true,
    page,
    limit: PAGE_SIZE,
  })
  const invalidate = useInvalidateGuns()

  const [busyId, setBusyId] = useState(null)
  const [purgeTarget, setPurgeTarget] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const total = pagination?.total ?? guns.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const flash = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3500)
  }

  const handleRestore = async (gun) => {
    try {
      setBusyId(gun.id)
      await gunService.restoreGun(gun.id)
      invalidate(gun.id)
      flash('success', `"${gun.name}" restored to the catalog.`)
      if (guns.length === 1 && page > 1) setPage(page - 1)
    } catch (err) {
      flash('error', err.message || 'Failed to restore.')
    } finally {
      setBusyId(null)
    }
  }

  const handlePurge = async () => {
    const gun = purgeTarget
    try {
      setBusyId(gun.id)
      await gunService.purgeGun(gun.id)
      invalidate(gun.id)
      flash('success', `"${gun.name}" deleted permanently.`)
      if (guns.length === 1 && page > 1) setPage(page - 1)
    } catch (err) {
      flash('error', err.message || 'Failed to delete.')
    } finally {
      setBusyId(null)
      setPurgeTarget(null)
    }
  }

  return (
    <div className="archive-page">
      <section className="masthead">
        <h1 className="display">Archive</h1>
        <p className="lede">
          Archived hardware is hidden from the catalog. Restore a piece to put it
          back on the shelf, or delete it permanently.
        </p>
      </section>

      {message.text && (
        <div className={`toast toast--${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="list-head">
        <h2>Archived pieces</h2>
        <span className="count">{total} archived</span>
      </div>

      {!IS_SUPABASE && (
        <div className="state-box">
          <Archive size={28} />
          <p>The archive requires the Supabase backend.</p>
        </div>
      )}

      {IS_SUPABASE && loading && (
        <div className="state-box">
          <Loader size={28} className="spin" />
          <p>Loading archive…</p>
        </div>
      )}

      {IS_SUPABASE && !loading && error && (
        <div className="state-box state-box--error">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button type="button" className="btn btn--outline" onClick={refetch}>Retry</button>
        </div>
      )}

      {IS_SUPABASE && !loading && !error && guns.length === 0 && (
        <div className="state-box">
          <Archive size={28} />
          <p>The archive is empty.</p>
        </div>
      )}

      {IS_SUPABASE && guns.length > 0 && (
        <ul className="archive-list">
          {guns.map((gun) => (
            <li key={gun.id} className="archive-item">
              <img src={gun.image_url} alt="" loading="lazy" decoding="async" />
              <div className="archive-item__info">
                <strong className="display">{gun.name}</strong>
                <span className="type">
                  {gun.type} · {gun.caliber} · {formatPrice(gun.price)}
                </span>
                {gun.deleted_at && (
                  <span className="archive-item__date">
                    Archived {new Date(gun.deleted_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="archive-item__actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => handleRestore(gun)}
                  disabled={busyId === gun.id}
                >
                  <RotateCcw size={14} /> Restore
                </button>
                <button
                  type="button"
                  className="btn btn--danger-ghost btn--sm"
                  onClick={() => setPurgeTarget(gun)}
                  disabled={busyId === gun.id}
                >
                  <Trash2 size={14} /> Delete permanently
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      <ConfirmModal
        open={Boolean(purgeTarget)}
        title="Delete Permanently"
        message={`Permanently delete "${purgeTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete permanently"
        danger
        loading={busyId === purgeTarget?.id}
        onConfirm={handlePurge}
        onCancel={() => setPurgeTarget(null)}
      />
    </div>
  )
}
