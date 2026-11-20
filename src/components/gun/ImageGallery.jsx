import { useState } from 'react'

/** Main image + clickable thumbnails for products with more than one image. */
export default function ImageGallery({ images, alt }) {
  const list = images && images.length > 0 ? images : ['/guns/pistol.svg']
  const [active, setActive] = useState(0)
  const current = list[Math.min(active, list.length - 1)]

  return (
    <div className="gallery">
      <img className="detail-img" src={current} alt={alt} decoding="async" />
      {list.length > 1 && (
        <ul className="gallery-thumbs">
          {list.map((src, i) => (
            <li key={src.slice(-40) + i}>
              <button
                type="button"
                className={`gallery-thumb${i === active ? ' gallery-thumb--active' : ''}`}
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${list.length}`}
              >
                <img src={src} alt="" loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
