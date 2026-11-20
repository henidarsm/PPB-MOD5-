import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// Normalizer — standardizes product shape whether received from Supabase
// (public.products) or from the university API (/api/v1/recipes).
// ---------------------------------------------------------------------------
export const normalizeProduct = (item) => {
  if (!item) return null

  // Resolve specifications from Supabase `specs` (text array) or API `ingredients`
  let specsList = []
  if (Array.isArray(item.specs)) {
    specsList = item.specs.map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Specification',
          quantity: s.trim(),
        }
      }
      return s
    })
  } else if (Array.isArray(item.ingredients)) {
    specsList = item.ingredients
  }

  // Resolve steps
  const stepsList =
    Array.isArray(item.steps) && item.steps.length > 0
      ? item.steps
      : ['Verify firearm is completely unloaded and point in safe direction.', 'Inspect receiver and mechanism for maintenance.']

  // Gallery: `images` (text[]) with `image_url` as the cover fallback.
  const cover = item.image_url || item.image || '/guns/pistol.svg'
  const gallery =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images.filter(Boolean)
      : [cover]

  return {
    ...item,
    id: item.id,
    name: item.name || 'Hardware Piece',
    type: item.type || item.category || 'Hardware',
    category: item.type || item.category || 'Hardware',
    caliber: item.caliber || 'Standard',
    price: Number(item.price ?? item.cook_time ?? 0),
    description: item.description || '',
    image_url: gallery[0] || cover,
    image: gallery[0] || cover,
    images: gallery,
    seller_phone: item.seller_phone || '',
    deleted_at: item.deleted_at || null,
    ingredients: specsList,
    steps: stepsList,
  }
}

// ---------------------------------------------------------------------------
// GunService — wraps backend CRUD endpoints.
// Supports both Supabase PostgREST table (/rest/v1/products) and
// standard REST API (/api/v1/recipes).
// ---------------------------------------------------------------------------
// Cover image = first gallery image; keeps `image_url` working for old rows.
const imageFields = (data) => {
  const images = (Array.isArray(data.images) ? data.images : []).filter(Boolean)
  if (images.length === 0 && data.image_url) images.push(data.image_url)
  return { images, image_url: images[0] || null }
}

class GunService {
  /**
   * Fetch a paginated, filterable list of products.
   */
  async getGuns(params = {}) {
    if (IS_SUPABASE) {
      const queryParts = ['select=*']

      // Soft delete: active list hides archived rows, archive list shows only them.
      queryParts.push(params.archived ? 'deleted_at=not.is.null' : 'deleted_at=is.null')

      if (params.search) {
        // Strip characters that have meaning inside a PostgREST `or=(...)` filter.
        const term = String(params.search).replace(/[,()*%]/g, ' ').trim()
        if (term) {
          const enc = encodeURIComponent(term)
          queryParts.push(`or=(name.ilike.*${enc}*,description.ilike.*${enc}*)`)
        }
      }

      if (params.category && params.category !== 'All') {
        queryParts.push(`type=eq.${encodeURIComponent(params.category)}`)
      }

      if (params.sort_by) {
        const order = params.order === 'desc' ? 'desc' : 'asc'
        queryParts.push(`order=${encodeURIComponent(params.sort_by)}.${order}`)
      } else {
        queryParts.push(params.archived ? 'order=deleted_at.desc' : 'order=created_at.desc')
      }

      // Server-side pagination (limit/offset) + exact total from Content-Range.
      const limit = Number(params.limit) || 12
      const page = Math.max(1, Number(params.page) || 1)
      queryParts.push(`limit=${limit}`)
      queryParts.push(`offset=${(page - 1) * limit}`)

      const res = await apiClient.get(`/rest/v1/products?${queryParts.join('&')}`, {
        headers: { Prefer: 'count=exact' },
        rawResponse: true,
      })
      const data = res.data
      const list = Array.isArray(data) ? data.map(normalizeProduct) : []
      const range = res.headers?.['content-range'] || ''
      const total = Number(range.split('/')[1])

      return {
        success: true,
        data: list,
        pagination: {
          total: Number.isFinite(total) ? total : (page - 1) * limit + list.length,
          page,
          limit,
        },
      }
    }

    // Fallback: university REST API
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    )
    return apiClient.get('/api/v1/recipes', { params: clean })
  }

  /**
   * Fetch a single product by ID.
   */
  async getGunById(id) {
    if (IS_SUPABASE) {
      const data = await apiClient.get(`/rest/v1/products?id=eq.${id}&select=*`)
      if (Array.isArray(data) && data.length > 0) {
        return { success: true, data: normalizeProduct(data[0]) }
      }
      throw new Error('Hardware item not found.')
    }
    return apiClient.get(`/api/v1/recipes/${id}`)
  }

  /**
   * Create a new product.
   */
  async createGun(data) {
    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : []

      const payload = {
        name: data.name,
        type: data.type || (data.category === 'minuman' ? 'Rifle' : 'Pistol'),
        caliber: data.caliber || '9mm',
        price: Number(data.price ?? data.cook_time ?? 0),
        description: data.description || '',
        specs: specsArray,
        ...imageFields(data),
        seller_phone: data.seller_phone || null,
      }

      const res = await apiClient.post('/rest/v1/products', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: normalizeProduct(created) }
    }
    return apiClient.post('/api/v1/recipes', data)
  }

  /**
   * Update existing product.
   */
  async updateGun(id, data) {
    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : undefined

      const payload = {
        updated_at: new Date().toISOString(),
      }
      if (data.name !== undefined) payload.name = data.name
      if (data.type !== undefined) payload.type = data.type
      if (data.caliber !== undefined) payload.caliber = data.caliber
      if (data.price !== undefined || data.cook_time !== undefined) {
        payload.price = Number(data.price ?? data.cook_time ?? 0)
      }
      if (data.description !== undefined) payload.description = data.description
      if (specsArray !== undefined) payload.specs = specsArray
      if (data.images !== undefined || data.image_url !== undefined) {
        Object.assign(payload, imageFields(data))
      }
      if (data.seller_phone !== undefined) payload.seller_phone = data.seller_phone || null

      const res = await apiClient.patch(`/rest/v1/products?id=eq.${id}`, payload, {
        headers: { Prefer: 'return=representation' },
      })
      const updated = Array.isArray(res) ? res[0] : res
      return { success: true, data: normalizeProduct(updated) }
    }
    return apiClient.put(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Partial update (PATCH).
   */
  async patchGun(id, data) {
    if (IS_SUPABASE) {
      return this.updateGun(id, data)
    }
    return apiClient.patch(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Archive (soft delete) a product. The row stays in the database with a
   * `deleted_at` timestamp and can be restored.
   */
  async deleteGun(id) {
    if (IS_SUPABASE) {
      await apiClient.patch(`/rest/v1/products?id=eq.${id}`, {
        deleted_at: new Date().toISOString(),
      })
      return { success: true }
    }
    return apiClient.delete(`/api/v1/recipes/${id}`)
  }

  /** Bring an archived product back into the catalog. */
  async restoreGun(id) {
    if (IS_SUPABASE) {
      await apiClient.patch(`/rest/v1/products?id=eq.${id}`, { deleted_at: null })
      return { success: true }
    }
    throw new Error('Restore is only supported by the Supabase backend.')
  }

  /** Permanently remove a product (used from the archive). */
  async purgeGun(id) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/products?id=eq.${id}`)
      return { success: true }
    }
    return apiClient.delete(`/api/v1/recipes/${id}`)
  }
}

export default new GunService()
