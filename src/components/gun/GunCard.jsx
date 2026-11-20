import { Images } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareButton from '../common/ShareButton'
import ContactSellerButton from '../common/ContactSellerButton'
import { formatPrice, truncate } from '../../utils/helpers'
import { useInView } from '../../hooks/useInView'

/**
 * Product card used in the catalog grid.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onSelect  — called with the gun when clicked
 * @param {Function} [props.onEdit]  — called when Edit is clicked (admin)
 * @param {Function} [props.onDelete]— called when Archive is clicked (admin)
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const imageCount = Array.isArray(gun.images) ? gun.images.length : 1
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Lazy loading: gambar baru dipasang saat kartu mendekati layar.
  const [imgRef, inView] = useInView('100px')

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <span className="card-img-wrap" ref={imgRef}>
          {inView ? (
            <img
              className="card-img"
              src={imgSrc}
              alt={gun.name}
              width="240"
              height="180"
              decoding="async"
            />
          ) : (
            <span
              className="card-img"
              style={{
                display: 'block',
                width: '100%',
                aspectRatio: '4 / 3',
                background: '#e5e8ea',
              }}
            />
          )}
          {imageCount > 1 && (
            <span className="card-img-count">
              <Images size={12} /> {imageCount}
            </span>
          )}
        </span>

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <span className="price">{formatPrice(price)}</span>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        <FavoriteButton gunId={gun.id || gun.name} />
        <ShareButton gun={gun} />

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(gun) }}
            aria-label={`Archive ${gun.name}`}
            title="Move to archive"
          >
            📦
          </button>
        )}
      </div>

      <div className="card-foot">
        <ContactSellerButton gun={gun} variant="compact" />
      </div>
    </li>
  )
}