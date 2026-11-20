import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings.
// Supports both Supabase (public.reviews) and university API (/api/v1/recipes/:id/reviews).
// ---------------------------------------------------------------------------

class ReviewService {
  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId, currentUserId) {
    if (IS_SUPABASE) {
      const data = await apiClient.get(
        `/rest/v1/reviews?product_id=eq.${gunId}&select=*&order=created_at.desc`,
      )
      const rows = Array.isArray(data) ? data : []
      const votes = await this.getVotes(rows.map((r) => r.id))

      const list = rows.map((r) => {
        const mine = votes.filter((v) => String(v.review_id) === String(r.id))
        return {
          id: r.id,
          product_id: r.product_id,
          user_id: r.user_id,
          user_identifier: r.user_id ? `Operator ${String(r.user_id).substring(0, 8)}` : 'Anonymous',
          rating: r.rating,
          comment: r.comment || '',
          created_at: r.created_at,
          up: mine.filter((v) => v.vote === 1).length,
          down: mine.filter((v) => v.vote === -1).length,
          myVote: mine.find((v) => v.user_id === currentUserId)?.vote || 0,
        }
      })

      return { success: true, data: list }
    }

    return apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
  }

  /**
   * Fetch thumbs up/down rows for a set of reviews. Fails soft (returns [])
   * so reviews still render if the `review_votes` table hasn't been created.
   */
  async getVotes(reviewIds) {
    if (!IS_SUPABASE || reviewIds.length === 0) return []
    try {
      const ids = reviewIds.map((id) => encodeURIComponent(String(id))).join(',')
      const data = await apiClient.get(
        `/rest/v1/review_votes?review_id=in.(${ids})&select=review_id,user_id,vote`,
      )
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  /**
   * Set (or clear) the current user's vote on a review.
   * @param {number} vote  1 = thumbs up, -1 = thumbs down, 0 = remove vote
   */
  async setVote(reviewId, userId, vote) {
    if (!IS_SUPABASE) throw new Error('Voting requires the Supabase backend.')
    if (vote === 0) {
      await apiClient.delete(
        `/rest/v1/review_votes?review_id=eq.${encodeURIComponent(String(reviewId))}&user_id=eq.${userId}`,
      )
      return { success: true }
    }
    await apiClient.post(
      '/rest/v1/review_votes?on_conflict=review_id,user_id',
      { review_id: String(reviewId), user_id: userId, vote },
      { headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } },
    )
    return { success: true }
  }

  /**
   * Submit a new review.
   * @param {string|number} gunId
   * @param {Object} reviewData  { user_identifier, rating, comment }
   */
  async createReview(gunId, reviewData) {
    if (IS_SUPABASE) {
      const payload = {
        product_id: Number(gunId),
        user_id: reviewData.user_id || reviewData.user_identifier,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      const res = await apiClient.post('/rest/v1/reviews', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: created }
    }

    return apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
  }

  /**
   * Edit an existing review.
   */
  async updateReview(reviewId, reviewData) {
    if (IS_SUPABASE) {
      const res = await apiClient.patch(
        `/rest/v1/reviews?id=eq.${reviewId}`,
        {
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
        },
        { headers: { Prefer: 'return=representation' } },
      )
      return { success: true, data: Array.isArray(res) ? res[0] : res }
    }

    return apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData)
  }

  /**
   * Delete a review.
   */
  async deleteReview(reviewId) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
      return { success: true }
    }

    return apiClient.delete(`/api/v1/reviews/${reviewId}`)
  }
}

export default new ReviewService()
