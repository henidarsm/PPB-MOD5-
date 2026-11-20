import { useState } from 'react'
import { Shield, Copy, Check, Heart, FileText, Play, Pencil, Trash2 } from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { navigate } from '../router'
import {
  getAllDraftIds,
  loadDraft,
  deleteDraft,
  formatDraftTime,
} from '../utils/draftStorage'
import About from './About'
import Contact from './Contact'

/** Read every saved form draft into a displayable list (newest first). */
const readDrafts = () =>
  getAllDraftIds()
    .map((id) => {
      const draft = loadDraft(id) || {}
      return {
        id,
        kind: id === 'create' ? 'New hardware' : 'Edit',
        name: draft.formData?.name?.trim() || 'Untitled draft',
        savedAt: draft.savedAt || null,
      }
    })
    .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)))

/**
 * ProfilePage — operator identity plus About, Contact and Drafts sections.
 * Editing the profile happens on its own page (#/profile/edit).
 */
export default function ProfilePage({ onReplaySplash }) {
  const profile = userService.getUserProfile()
  const [copied, setCopied] = useState(false)
  const [drafts, setDrafts] = useState(readDrafts)
  const { favorites } = useFavorites()

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resumeDraft = (d) => navigate(d.id === 'create' ? '/create' : `/gun/${d.id}/edit`)

  const removeDraft = (d) => {
    deleteDraft(d.id)
    setDrafts(readDrafts())
  }

  return (
    <div className="profile-page">
      <section
        className="masthead"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}
      >
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Operator credentials, saved drafts, and shop information.
          </p>
        </div>
        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay introductory splash animation"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button type="button" className="icon-btn" onClick={handleCopyId} title="Copy User ID to clipboard">
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn btn--primary btn--sm profile-edit-btn"
            onClick={() => navigate('/profile/edit')}
          >
            <Pencil size={14} /> Edit Profile
          </button>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Drafts</div>
          </div>
        </div>
      </div>

      {/* Drafts */}
      <section className="profile-section" id="drafts">
        <h2 className="section-title">Drafts</h2>
        {drafts.length === 0 ? (
          <p className="detail-empty">
            No drafts yet. Use “Save Draft” on the Add or Edit form and it will show up here.
          </p>
        ) : (
          <ul className="draft-list">
            {drafts.map((d) => (
              <li key={d.id} className="draft-item">
                <div className="draft-item__info">
                  <strong>{d.name}</strong>
                  <span className="type">
                    {d.kind}
                    {d.savedAt ? ` · saved ${formatDraftTime(d.savedAt)}` : ''}
                  </span>
                </div>
                <div className="draft-item__actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => resumeDraft(d)}>
                    <Pencil size={14} /> Resume
                  </button>
                  <button type="button" className="btn btn--danger-ghost btn--sm" onClick={() => removeDraft(d)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <About />
      <Contact />
    </div>
  )
}
