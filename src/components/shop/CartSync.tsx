'use client'

import { useEffect, useRef } from 'react'
import { useCart, useAuth } from '@/lib/store'
import { fetcher } from '@/lib/api-client'

// Module-level tracking
let lastSyncedUserId: string | null = null
let shadowItems: { variantKey: string; productId: string; quantity: number; unitPrice: number; variantData?: any }[] | null = null
let isInitialLoad = true
let pushEnabled = true

type ServerItem = {
  productId: string
  name: string
  slug: string
  brand: string
  price: number
  image: string
  quantity: number
  stock: number
  variantKey: string
  variantSelection?: { color?: { name: string; hex: string }; size?: { name: string } }
}

/**
 * Syncs local cart with server-side cart for logged-in users.
 * - On login: loads server cart and merges with local (local wins on conflict for recency)
 * - On local cart change: pushes entire cart to server (replace strategy)
 * - Cross-device persistence
 */
export function CartSync() {
  const { user } = useAuth()
  const items = useCart((s) => s.items)

  // On user login: load server cart and merge
  useEffect(() => {
    if (!user) {
      lastSyncedUserId = null
      shadowItems = null
      isInitialLoad = true
      return
    }
    if (lastSyncedUserId === user.id) return
    lastSyncedUserId = user.id

    let cancelled = false
    pushEnabled = false
    fetcher<{ items: ServerItem[] }>('/api/cart')
      .then((d) => {
        if (cancelled || !d?.items) return
        // Merge: keep local items as-is, but ADD server-only items
        const localState = useCart.getState()
        const localKeys = new Set(localState.items.map((i) => i.variantKey ?? i.productId))
        const newItems: any[] = [...localState.items]
        d.items.forEach((srv) => {
          if (!localKeys.has(srv.variantKey)) {
            newItems.push({
              productId: srv.productId,
              name: srv.name,
              slug: srv.slug,
              brand: srv.brand,
              price: srv.price,
              image: srv.image,
              quantity: srv.quantity,
              stock: srv.stock,
              variantKey: srv.variantKey,
              variantSelection: srv.variantSelection,
            })
          }
        })
        if (newItems.length !== localState.items.length) {
          useCart.setState({ items: newItems })
        }
        shadowItems = useCart.getState().items.map((i) => ({
          variantKey: i.variantKey ?? i.productId,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.price,
          variantData: i.variantSelection,
        }))
        pushEnabled = true
        // Force-push local items to server (in case local has items from previous session)
        const currentItems = useCart.getState().items
        if (currentItems.length > 0) {
          fetcher('/api/cart', {
            method: 'POST',
            body: JSON.stringify({
              action: 'sync',
              items: currentItems.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.price,
                variantKey: i.variantKey ?? i.productId,
                variantData: i.variantSelection,
              })),
            }),
          }).catch(() => {})
        }
      })
      .catch(() => {
        shadowItems = useCart.getState().items.map((i) => ({
          variantKey: i.variantKey ?? i.productId,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.price,
          variantData: i.variantSelection,
        }))
        pushEnabled = true
      })
    return () => { cancelled = true }
  }, [user])

  // On local cart change: push to server (debounced)
  useEffect(() => {
    if (!user || !shadowItems || !pushEnabled) return
    if (isInitialLoad) {
      isInitialLoad = false
      shadowItems = items.map((i) => ({
        variantKey: i.variantKey ?? i.productId,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.price,
        variantData: i.variantSelection,
      }))
      // On first load with items present, push them to server (in case cart was loaded from localStorage)
      if (items.length > 0) {
        fetcher('/api/cart', {
          method: 'POST',
          body: JSON.stringify({
            action: 'sync',
            items: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.price,
              variantKey: i.variantKey ?? i.productId,
              variantData: i.variantSelection,
            })),
          }),
        }).catch(() => {})
      }
      return
    }

    const currentSerialized = items.map((i) => ({
      variantKey: i.variantKey ?? i.productId,
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.price,
      variantData: i.variantSelection,
    }))
    const shadowStr = JSON.stringify(shadowItems)
    const currentStr = JSON.stringify(currentSerialized)
    if (shadowStr === currentStr) return

    shadowItems = currentSerialized
    // Debounce push
    const t = setTimeout(() => {
      fetcher('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          action: 'sync',
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.price,
            variantKey: i.variantKey ?? i.productId,
            variantData: i.variantSelection,
          })),
        }),
      }).catch(() => {})
    }, 800)
    return () => clearTimeout(t)
  }, [items, user])

  return null
}
