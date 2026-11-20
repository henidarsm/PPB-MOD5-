import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { gunUrl } from '../../router'

/**
 * Share a product through its unique link (#/gun/<id>).
 * Uses the native share sheet when available, otherwise copies to clipboard.
 *
 * @param {'icon'|'button'} [variant='icon']
 */
export default function ShareButton({ gun, variant = 'icon' }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (e) => {
    e.stopPropagation()
    const url = gunUrl(gun.id)
    const data = { title: `${gun.name} — Bore & Barrel`, text: `Check out ${gun.name}`, url }

    try {
      if (navigator.share && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) {
        await navigator.share(data)
        return
      }
      await navigator.clipboard.writeText(url)
    } catch (err) {
      if (err?.name === 'AbortError') return // user closed the share sheet
      // Clipboard blocked — last resort so the link is still obtainable.
      window.prompt('Copy this link:', url)
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (variant === 'button') {
    return (
      <button type="button" className="btn btn--outline" onClick={handleShare}>
        {copied ? <><Check size={16} /> Link copied</> : <><Share2 size={16} /> Share link</>}
      </button>
    )
  }

  return (
    <button
      type="button"
      className="card-act-btn"
      onClick={handleShare}
      aria-label={`Share ${gun.name}`}
      title={copied ? 'Link copied' : 'Share link'}
    >
      {copied ? <Check size={15} /> : <Share2 size={15} />}
    </button>
  )
}
