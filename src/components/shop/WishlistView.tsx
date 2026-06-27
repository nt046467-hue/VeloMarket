'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Home as HomeIcon, ChevronRight, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductRow } from './ProductCard'
import { CenterPrompt } from './OrdersView'
import { ShareWishlistButton } from './ShareWishlist'
import { useView, useWishlist, useAuth } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'

export function WishlistView() {
  const navigate = useView((s) => s.navigate)
  const wishlistIds = useWishlist((s) => s.productIds)
  const toggle = useWishlist((s) => s.toggle)
  const { user } = useAuth()
  const [items, setItems] = useState<Product[] | null>(null)

  useEffect(() => {
    if (wishlistIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([])
      return
    }
    setItems(null)
    let cancelled = false
    Promise.all(
      wishlistIds.map((id) =>
        fetcher<{ product: Product }>(`/api/products?id=${id}`).then((d) => d?.product).catch(() => null)
      )
    ).then((ps) => {
      if (!cancelled) setItems(ps.filter(Boolean) as Product[])
    })
    return () => { cancelled = true }
  }, [wishlistIds])

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center hover:text-foreground">
          <HomeIcon size={12} className="mr-1" /> Home
        </button>
        <ChevronRight size={12} />
        <span className="font-medium text-foreground">Wishlist</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Heart className="text-rose-500" /> Your Wishlist
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {wishlistIds.length} saved {wishlistIds.length === 1 ? 'item' : 'items'}{!user && ' · sign in to sync across devices'}
          </p>
        </div>
        <ShareWishlistButton />
      </div>

      {items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <CenterPrompt
          icon={<Heart size={36} className="text-rose-400" />}
          title="Your wishlist is empty"
          sub="Save items you love by tapping the heart icon."
          actions={<Button className="bg-amber-400 text-zinc-900 hover:bg-amber-500" onClick={() => navigate({ name: 'shop' })}>Discover products</Button>}
        />
      ) : (
        <motion.div initial="hidden" animate="visible" className="grid gap-3 sm:grid-cols-2">
          {items.map((p) => (
            <div key={p.id} className="relative">
              <ProductRow product={p} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-rose-600"
                onClick={() => { toggle(p.id); toast.success('Removed from wishlist') }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
