import { useState } from 'react'
import { ArrowLeft, Shield, Camera, Save, Check } from 'lucide-react'
import userService from '../services/userService'
import { navigate, goBack } from '../router'

/** Edit profile — avatar, callsign and bio (own page, reached from Profile). */
export default function ProfileEditPage() {
  const profile = userService.getUserProfile()
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [feedback, setFeedback] = useState({ type: '', text: '' })

  const flash = (type, text) => {
    setFeedback({ type, text })
    setTimeout(() => setFeedback({ type: '', text: '' }), 3000)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      flash('error', 'Avatar image must be under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => setAvatar(event.target.result) // saved with the form
    reader.readAsDataURL(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    const result = userService.saveUserProfile({
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      avatar,
    })
    if (result.success) navigate('/profile')
    else flash('error', result.message || 'Failed to save profile.')
  }

  return (
    <div className="profile-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={() => goBack('/profile')}>
          <ArrowLeft size={18} /> Back to Profile
        </button>
      </div>

      <section className="masthead">
        <h1 className="display">Edit Profile</h1>
        <p className="lede">Update your callsign, bio and avatar.</p>
      </section>

      {feedback.text && (
        <div className={`toast toast--${feedback.type === 'error' ? 'error' : 'success'}`}>
          <Check size={18} /> {feedback.text}
        </div>
      )}

      <form onSubmit={handleSave} className="profile-form">
        <div className="avatar-wrap" style={{ marginBottom: 16 }}>
          {avatar ? (
            <img src={avatar} alt="Avatar preview" className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">
              <Shield size={36} stroke="var(--brass)" />
            </div>
          )}
          <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
            <Camera size={14} />
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden-file-input"
            />
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="prof-name" className="form-label">Callsign / Operator Alias</label>
          <input
            id="prof-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Operator Delta, Master Gunsmith"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="prof-bio" className="form-label">Armory Notes / Station Bio</label>
          <textarea
            id="prof-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Qualifications, preferred calibers, unit assignment..."
            rows={3}
            className="form-textarea"
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn--primary">
            <Save size={16} /> Save Profile
          </button>
          <button type="button" className="btn btn--outline" onClick={() => goBack('/profile')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
