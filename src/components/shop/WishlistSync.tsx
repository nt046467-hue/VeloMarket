'use client'

import { useEffect, useRef } from 'react'
import { useWishlist, useAuth } from '@/lib/store'
import { fetcher } from '@/lib/api-client'

// Module-level tracking to avoid re-syncing
let lastSyncedUserId: string | null = null
let shadowSet: Set<string> | null = null
let isInitialLoad = true

/**
 * Syncs local wishlist with server-side wishlist for logged-in users.
 * - On login: loads server wishlist and merges with local
 * - When local wishlist changes (and user is logged in): pushes delta to server
 * - Cross-device persistence
 */
export function WishlistSync() {
  const { user } = useAuth()
  const productIds = useWishlist((s) => s.productIds)
  const pushToServer = useRef(true)

  // On user login: load server wishlist and merge
  useEffect(() => {
    if (!user) {
      lastSyncedUserId = null
      shadowSet = null
      return
    }
    if (lastSyncedUserId === user.id) return
    lastSyncedUserId = user.id

    let cancelled = false
    fetcher<{ items: Array<{ productId: string }> }>('/api/wishlist')
      .then((d) => {
        if (cancelled || !d?.items) return
        const serverIds = d.items.map((i) => i.productId)
        shadowSet = new Set(serverIds)
        // Merge: add any server items not already in local
        const current = new Set(useWishlist.getState().productIds)
        const store = useWishlist.getState()
        pushToServer.current = false // temporarily disable push
        serverIds.forEach((id) => {
          if (!current.has(id)) {
            store.toggle(id) // this adds since not present
          }
        })
        // After merge, update shadow to match current state
        shadowSet = new Set(useWishlist.getState().productIds)
        pushToServer.current = true
      })
      .catch(() => {
        shadowSet = new Set(useWishlist.getState().productIds)
      })
    return () => { cancelled = true }
  }, [user])

  // When local wishlist changes, push delta to server
  useEffect(() => {
    if (!user || !shadowSet || !pushToServer.current) return
    if (isInitialLoad) {
      isInitialLoad = false
      shadowSet = new Set(productIds)
      return
    }
    const current = new Set(productIds)
    const added = [...current].filter((id) => !shadowSet!.has(id))
    const removed = [...shadowSet!].filter((id) => !current.has(id))
    if (added.length === 0 && removed.length === 0) return

    added.forEach((id) => {
      fetcher('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId: id, action: 'add' }),
      }).catch(() => {})
    })
    removed.forEach((id) => {
      fetcher('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId: id, action: 'remove' }),
      }).catch(() => {})
    })
    shadowSet = current
  }, [productIds, user])

  return null
}
