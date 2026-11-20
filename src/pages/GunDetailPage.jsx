import { useState } from 'react'
import { Loader, AlertCircle } from 'lucide-react'
import GunDetail from '../components/gun/GunDetail'
import ArchiveModal from '../components/modals/ArchiveModal'
import { useGunById } from '../hooks/useGuns'
import { navigate, goBack } from '../router'

/**
 * Route wrapper for #/gun/:id. Loads the product itself, so a shared link
 * opens straight to the right piece — no catalog state required.
 */
export default function GunDetailPage({ id }) {
  const { gun, loading, error, refetch } = useGunById(id)
  const [archiveTarget, setArchiveTarget] = useState(null)

  if (loading) {
    return (
      <div className="state-box">
        <Loader size={28} className="spin" />
        <p>Loading product…</p>
      </div>
    )
  }

  if (error || !gun) {
    return (
      <div className="state-box state-box--error">
        <AlertCircle size={28} />
        <p>{error || 'Product not found.'}</p>
        <div className="state-box__actions">
          <button type="button" className="btn btn--outline" onClick={refetch}>Retry</button>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
            Back to catalog
          </button>
        </div>
      </div>
    )
  }

  const archived = Boolean(gun.deleted_at)

  return (
    <>
      {archived && (
        <div className="toast toast--error">
          This piece is archived.{' '}
          <button type="button" className="link-btn" onClick={() => navigate('/archive')}>
            Open archive
          </button>
        </div>
      )}
      <GunDetail
        gun={gun}
        onBack={() => goBack('/')}
        onEdit={(g) => navigate(`/gun/${g.id}/edit`)}
        onDelete={archived ? undefined : setArchiveTarget}
      />
      <ArchiveModal
        gun={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onDone={() => { setArchiveTarget(null); navigate('/') }}
      />
    </>
  )
}
