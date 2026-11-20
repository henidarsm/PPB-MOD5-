import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import gunService from '../services/gunService'
import GUNS_LOCAL from '../data/guns'

// ---------------------------------------------------------------------------
// Query caching — every list/detail request goes through TanStack Query, so
// repeated visits, back navigation and shared links reuse cached data.
// Keys:  ['guns', params]  → paginated list     ['gun', id] → one product
// ---------------------------------------------------------------------------

export const GUNS_KEY = ['guns']
export const gunKey = (id) => ['gun', String(id)]

export function useGuns(params = {}) {
  const query = useQuery({
    queryKey: [...GUNS_KEY, params],
    queryFn: async () => {
      const response = await gunService.getGuns(params)
      if (!response.success) throw new Error(response.message || 'Failed to fetch products.')
      return response
    },
    placeholderData: keepPreviousData, // keep the old page visible while the next loads
  })

  return {
    guns: query.data?.data || [],
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error ? query.error.message || 'An error occurred while fetching products.' : null,
    pagination: query.data?.pagination || null,
    refetch: query.refetch,
  }
}

export function useGunById(id) {
  const query = useQuery({
    queryKey: gunKey(id),
    enabled: Boolean(id),
    queryFn: async () => {
      // Offline/dummy items have synthetic ids like "local-2".
      if (String(id).startsWith('local-')) {
        const item = GUNS_LOCAL[Number(String(id).slice(6))]
        if (!item) throw new Error('Hardware item not found.')
        return { ...item, id }
      }
      const response = await gunService.getGunById(id)
      if (!response.success) throw new Error(response.message || 'Product not found.')
      return response.data
    },
  })

  return {
    gun: query.data || null,
    loading: query.isLoading,
    error: query.error ? query.error.message || 'Failed to load product details.' : null,
    refetch: query.refetch,
  }
}

/** Invalidate list + detail caches after a create / edit / archive / restore / purge. */
export function useInvalidateGuns() {
  const qc = useQueryClient()
  return (id) => {
    qc.invalidateQueries({ queryKey: GUNS_KEY })
    if (id !== undefined) qc.invalidateQueries({ queryKey: gunKey(id) })
  }
}
