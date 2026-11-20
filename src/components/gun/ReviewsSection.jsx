import { useState } from 'react'
import { Star, Send, Loader, Pencil, Trash2, ThumbsUp, ThumbsDown, X } from 'lucide-react'
import ConfirmModal from '../modals/ConfirmModal'
import { useReviews, useReviewActions } from '../../hooks/useReviews'
import { useInView } from '../../hooks/useInView'
import { averageRating } from '../../utils/helpers'

const StarPicker = ({ value, onChange }) => (
  <div className="review-stars">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        className="star-btn"
        onClick={() => onChange(n)}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
      >
        <Star
          size={22}
          fill={n <= value ? 'var(--brass)' : 'none'}
          stroke={n <= value ? 'var(--brass)' : 'var(--steel)'}
        />
      </button>
    ))}
  </div>
)

/**
 * Reviews for one product: create, edit and delete your own reviews, and
 * thumbs up / down on anyone's review. Reviews are fetched lazily — only
 * once the section scrolls near the viewport.
 */
export default function ReviewsSection({ gun }) {
  const [ref, inView] = useInView()
  const { reviews, loading } = useReviews(gun.id, inView)
  const { create, update, remove, vote, userId } = useReviewActions(gun.id)

  const [editingId, setEditingId] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const submitting = create.isPending || update.isPending
  const isEditing = editingId !== null

  const resetForm = () => {
    setEditingId(null)
    setRating(5)
    setComment('')
  }

  const startEdit = (rev) => {
    setEditingId(rev.id)
    setRating(Number(rev.rating) || 5)
    setComment(rev.comment || '')
    setMessage({ type: '', text: '' })
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    const data = { rating, comment: comment.trim() }

    try {
      if (isEditing) await update.mutateAsync({ id: editingId, ...data })
      else await create.mutateAsync(data)
      setMessage({ type: 'success', text: isEditing ? 'Review updated.' : 'Review submitted!' })
      resetForm()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.message || 'Could not save review. The server may be unavailable.',
      })
    }
  }

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(deleteTarget.id)
      if (editingId === deleteTarget.id) resetForm()
      setMessage({ type: 'success', text: 'Review deleted.' })
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Could not delete review.' })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <section className="detail-section" ref={ref}>
      <h2>
        Reviews
        {reviews.length > 0 && (
          <span className="review-summary">
            <Star size={15} fill="var(--brass)" stroke="var(--brass)" />
            {averageRating(reviews).toFixed(1)} ({reviews.length})
          </span>
        )}
      </h2>

      <form className="review-form" onSubmit={handleSubmit}>
        {isEditing && (
          <p className="review-editing">
            Editing your review
            <button type="button" className="link-btn" onClick={resetForm}>
              <X size={14} /> Cancel
            </button>
          </p>
        )}

        <StarPicker value={rating} onChange={setRating} />

        <textarea
          className="review-input"
          rows="3"
          placeholder="Write a short review (optional)…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />

        <button type="submit" className="btn btn--primary" disabled={submitting || !gun.id}>
          {submitting ? (
            <><Loader size={16} className="spin" /> Saving…</>
          ) : (
            <><Send size={16} /> {isEditing ? 'Save Changes' : 'Submit Review'}</>
          )}
        </button>

        {message.text && (
          <p className={message.type === 'error' ? 'form-error' : 'form-success'}>{message.text}</p>
        )}
        {String(gun.id).startsWith('local-') && (
          <p className="form-hint">
            Reviews require a server-generated product ID. This product is local-only.
          </p>
        )}
      </form>

      {!inView || loading ? (
        <p className="detail-loading">Loading reviews…</p>
      ) : reviews.length > 0 ? (
        <ul className="review-list">
          {reviews.map((rev) => {
            const mine = rev.user_id && rev.user_id === userId
            return (
              <li key={rev.id} className="review-item">
                <div className="review-head">
                  <span className="review-user">
                    {mine ? 'You' : rev.user_identifier || 'Anonymous'}
                  </span>
                  <span className="review-stars-display">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? 'var(--brass)' : 'none'}
                        stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                      />
                    ))}
                  </span>
                </div>

                {rev.comment && <p className="review-comment">{rev.comment}</p>}

                <div className="review-actions">
                  <button
                    type="button"
                    className={`vote-btn${rev.myVote === 1 ? ' vote-btn--up' : ''}`}
                    onClick={() => vote.mutate({ review: rev, value: 1 })}
                    disabled={mine || vote.isPending}
                    title={mine ? 'You cannot vote on your own review' : 'Thumbs up'}
                    aria-pressed={rev.myVote === 1}
                    aria-label="Thumbs up"
                  >
                    <ThumbsUp size={14} /> {rev.up || 0}
                  </button>
                  <button
                    type="button"
                    className={`vote-btn${rev.myVote === -1 ? ' vote-btn--down' : ''}`}
                    onClick={() => vote.mutate({ review: rev, value: -1 })}
                    disabled={mine || vote.isPending}
                    title={mine ? 'You cannot vote on your own review' : 'Thumbs down'}
                    aria-pressed={rev.myVote === -1}
                    aria-label="Thumbs down"
                  >
                    <ThumbsDown size={14} /> {rev.down || 0}
                  </button>

                  {mine && (
                    <span className="review-owner-actions">
                      <button type="button" className="link-btn" onClick={() => startEdit(rev)}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        onClick={() => setDeleteTarget(rev)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="detail-empty">No reviews yet. Be the first!</p>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Review"
        message="Delete your review? This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
