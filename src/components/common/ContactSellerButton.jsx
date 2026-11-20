import { MessageCircle } from 'lucide-react'
import { gunUrl } from '../../router'
import { formatPrice, getSellerPhone } from '../../utils/helpers'

/**
 * "Hubungi Penjual" — opens WhatsApp (wa.me) with a prefilled message about
 * this product. Uses the product's own seller number, or the shop default
 * (VITE_DEFAULT_SELLER_PHONE) when none is set.
 *
 * @param {'full'|'compact'} [variant='full']
 */
export default function ContactSellerButton({ gun, variant = 'full' }) {
  const phone = getSellerPhone(gun)
  const compact = variant === 'compact'
  const className = compact ? 'btn btn--wa btn--sm btn--block' : 'btn btn--wa'

  if (!phone) {
    return (
      <button type="button" className={className} disabled title="Nomor penjual belum diisi">
        <MessageCircle size={compact ? 14 : 16} /> Hubungi Penjual
      </button>
    )
  }

  const text =
    `Halo, saya tertarik dengan "${gun.name}" (${formatPrice(gun.price)}) ` +
    `di Bore & Barrel. Apakah masih tersedia?\n${gunUrl(gun.id)}`

  return (
    <a
      className={className}
      href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      <MessageCircle size={compact ? 14 : 16} /> Hubungi Penjual
    </a>
  )
}
