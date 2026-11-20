import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import reviewService from '../services/reviewService'
import { getUserIdentifier } from '../services/userService'

const reviewsKey = (gunId) => ['reviews', String(gunId)]

// ---------------------------------------------------------------------------
// useReviews — cached reviews (with vote counts) for one product.
// Pass `enabled=false` to defer the request (used for lazy-loading on scroll).
// ---------------------------------------------------------------------------

export function useReviews(gunId, enabled = true) {
  const query = useQuery({
    queryKey: reviewsKey(gunId),
    enabled: Boolean(gunId) && enabled,
    queryFn: async () => {
      const response = await reviewService.getReviews(gunId, getUserIdentifier())
      if (!response.success) throw new Error(response.message || 'Failed to fetch reviews.')
      return response.data || []
    },
  })

  return {
    reviews: query.data || [],
    loading: query.isLoading && enabled,
    error: query.error ? query.error.message || 'An error occurred while fetching reviews.' : null,
    refetch: query.refetch,
  }
}

/**
 * Create / update / delete reviews and cast thumbs up/down votes.
 * Every mutation refreshes the cached review list for the product.
 */
export function useReviewActions(gunId) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: reviewsKey(gunId) })
  const userId = getUserIdentifier()

  const create = useMutation({
    mutationFn: (data) =>
      reviewService.createReview(gunId, { user_identifier: userId, ...data }),
    onSuccess: refresh,
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }) => reviewService.updateReview(id, data),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: (id) => reviewService.deleteReview(id),
    onSuccess: refresh,
  })

  const vote = useMutation({
    mutationFn: ({ review, value }) => {
      // Clicking the active vote again clears it.
      const next = review.myVote === value ? 0 : value
      return reviewService.setVote(review.id, userId, next)
    },
    onSuccess: refresh,
  })

  return { create, update, remove, vote, userId }
}
