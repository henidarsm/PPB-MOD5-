import { useState } from 'react'
import { Upload, X, Loader, Star } from 'lucide-react'
import uploadService from '../../services/uploadService'

const PRESETS = [
  { label: 'Pistol Vector', url: '/guns/pistol.svg' },
  { label: 'Rifle Vector', url: '/guns/rifle.svg' },
  { label: 'Shotgun Vector', url: '/guns/shotgun.svg' },
]

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const isValidationError = (err) =>
  /Invalid file type|File size|No file/i.test(err?.message || '')

/**
 * Manage several images for one product. The first image is the cover.
 *
 * @param {string[]}  images
 * @param {Function}  onChange  (nextImages: string[]) => void
 * @param {number}    [max=8]
 */
export default function MultiImagePicker({ images, onChange, max = 8 }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = '' // allow re-selecting the same file
    if (files.length === 0) return

    const room = max - images.length
    if (room <= 0) {
      setError(`You can add up to ${max} images.`)
      return
    }

    setUploading(true)
    setError('')
    const added = []
    const problems = []

    for (const file of files.slice(0, room)) {
      try {
        const res = await uploadService.uploadImage(file)
        if (res.success && res.data?.url) added.push(res.data.url)
        else throw new Error(res.message || 'Upload failed.')
      } catch (err) {
        if (isValidationError(err)) {
          problems.push(`${file.name}: ${err.message}`)
        } else {
          // Server unreachable — keep the image locally so the user can continue.
          try {
            added.push(await fileToDataUrl(file))
          } catch {
            problems.push(`${file.name}: could not be read.`)
          }
        }
      }
    }

    if (files.length > room) problems.push(`Only ${room} more image(s) fit; the rest were skipped.`)
    if (added.length) onChange([...images, ...added])
    if (problems.length) setError(problems.join(' '))
    setUploading(false)
  }

  const remove = (i) => onChange(images.filter((_, idx) => idx !== i))
  const makeCover = (i) => onChange([images[i], ...images.filter((_, idx) => idx !== i)])
  const addPreset = (url) => {
    if (images.length >= max) return setError(`You can add up to ${max} images.`)
    if (images.includes(url)) return
    setError('')
    onChange([...images, url])
  }

  return (
    <div className="multi-img">
      {images.length > 0 && (
        <ul className="multi-img__grid">
          {images.map((src, i) => (
            <li key={src.slice(-40) + i} className="multi-img__item">
              <img src={src} alt={`Image ${i + 1}`} loading="lazy" decoding="async" />
              {i === 0 && <span className="multi-img__cover">Cover</span>}
              <div className="multi-img__tools">
                {i !== 0 && (
                  <button type="button" onClick={() => makeCover(i)} title="Make cover image">
                    <Star size={14} />
                  </button>
                )}
                <button type="button" onClick={() => remove(i)} title="Remove image">
                  <X size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="multi-img__controls">
        <label className="btn btn--outline btn--sm" htmlFor="multi-image-input">
          {uploading ? <><Loader size={14} className="spin" /> Uploading…</> : <><Upload size={14} /> Add images</>}
        </label>
        <input
          id="multi-image-input"
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFiles}
          disabled={uploading}
          className="hidden-file-input"
        />
        <span className="multi-img__count">{images.length}/{max}</span>
      </div>

      <div className="preset-selector">
        <span className="preset-title">Or add a stock preset:</span>
        <div className="preset-pills">
          {PRESETS.map((p) => (
            <button key={p.url} type="button" className="pill" onClick={() => addPreset(p.url)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
