import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import gunService from '../../services/gunService'
import { useInvalidateGuns } from '../../hooks/useGuns'

/**
 * Soft-delete confirmation. Moves a product to the archive (restorable).
 * Renders nothing when `gun` is null.
 */
export default function ArchiveModal({ gun, onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const invalidate = useInvalidateGuns()

  const confirm = async () => {
    try {
      setBusy(true)
      setError('')
      await gunService.deleteGun(gun.id)
      invalidate(gun.id)
      onDone?.(gun)
    } catch (err) {
      setError(err.message || 'Failed to archive.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ConfirmModal
        open={Boolean(gun)}
        title="Move to Archive"
        message={`"${gun?.name}" will be hidden from the catalog. You can restore it or delete it permanently from the Archive page.`}
        confirmLabel="Archive"
        loading={busy}
        onConfirm={confirm}
        onCancel={() => { setError(''); onClose?.() }}
      />
      {error && <div className="toast toast--error toast--floating">{error}</div>}
    </>
  )
}
