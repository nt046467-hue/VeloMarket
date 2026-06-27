'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Heart, Minus, Plus, Check, ChevronRight, Loader2, Truck, ShieldCheck, RotateCcw } from 'lucide-react'
import { ProductImage } from './ProductImage'
import { StarRating } from './StarRating'
import { Price } from './Price'
import { useQuickView, useView, useCart, useWishlist } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { discountPercent, truncate } from '@/lib/format'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function QuickViewModal() {
  const { productId, close } = useQuickView()
  const navigate = useView((s) => s.navigate)
  const addItem = useCart((s) => s.addItem)
  const wishlistHas = useWishlist((s) => (productId ? s.productIds.includes(productId) : false))
  const toggleWishlist = useWishlist((s) => s.toggle)
  const [data, setData] = useState<{ product: Product } | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (!productId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null)
      return
    }
    setLoading(true)
    setActiveImage(0)
    setQty(1)
    let cancelled = false
    fetcher<{ product: Product }>(`/api/products?id=${productId}`)
      .then((d) => { if (!cancelled) setData(d?.product ? { product: d.product } : null) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [productId])

  function openFull() {
    if (!productId) return
    const id = productId
    close()
    navigate({ name: 'product', productId: id })
  }

  return (
    <Dialog open={!!productId} onOpenChange={(o) => !o && close()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
        {productId && (
          <>
            <DialogTitle className="sr-only">Quick view</DialogTitle>
            <DialogDescription className="sr-only">Product quick view with details and add-to-cart</DialogDescription>
            {loading || !data ? (
              <div className="grid min-h-[360px] place-items-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2">
                {/* Image */}
                <div className="relative aspect-square bg-muted/20">
                  <ProductImage src={data.product.images[activeImage] ?? data.product.images[0]} alt={data.product.name} sizes="(max-width: 768px) 100vw, 50vw" />
                  {data.product.images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {data.product.images.slice(0, 5).map((img, i) => (
                        <button
                          key={i}
                          onMouseEnter={() => setActiveImage(i)}
                          onClick={() => setActiveImage(i)}
                          className={cn(
                            'relative h-12 w-12 overflow-hidden rounded-md ring-2 transition',
                            i === activeImage ? 'ring-amber-500' : 'ring-white/50 hover:ring-amber-300'
                          )}
                        >
                          <ProductImage src={img} alt={`${data.product.name} ${i}`} sizes="48px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Details */}
                <div className="flex max-h-[80vh] flex-col overflow-y-auto p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-500">{data.product.brand}</div>
                  <h2 className="mt-1 text-lg font-bold leading-tight sm:text-xl">{data.product.name}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <StarRating rating={data.product.rating} showValue size={14} />
                    <span className="text-xs text-muted-foreground">{data.product.ratingCount.toLocaleString()} ratings</span>
                  </div>
                  <Separator className="my-3" />
                  <Price price={data.product.price} compareAt={data.product.compareAt} size="xl" showDiscount />
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-4">{data.product.description}</p>

                  {/* Key specs preview */}
                  {data.product.specs && (
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {Object.entries(data.product.specs).slice(0, 4).map(([k, v]) => (
                        <div key={k} className="rounded-md bg-muted/40 p-2">
                          <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                          <div className="text-xs font-semibold truncate">{v}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {data.product.stock > 0 ? 'In stock' : 'Sold out'}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center overflow-hidden rounded-lg border">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                        <Minus size={12} />
                      </Button>
                      <span className="w-9 text-center text-sm font-semibold">{qty}</span>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => setQty((q) => Math.min(data.product.stock || 99, q + 1))}>
                        <Plus size={12} />
                      </Button>
                    </div>
                    <Button
                      className="flex-1 bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500"
                      onClick={() => { addItem(data.product, qty); toast.success(`Added ${qty} × ${data.product.name} to cart`) }}
                      disabled={data.product.stock === 0}
                    >
                      <ShoppingCart size={14} className="mr-1.5" /> Add to cart
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn('flex-1', wishlistHas && 'border-rose-300 text-rose-600')}
                      onClick={() => { toggleWishlist(data.product.id); toast.success(wishlistHas ? 'Removed from wishlist' : 'Added to wishlist') }}
                    >
                      <Heart size={13} className="mr-1.5" fill={wishlistHas ? 'currentColor' : 'none'} />
                      {wishlistHas ? 'In wishlist' : 'Wishlist'}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={openFull}>
                      View details <ChevronRight size={13} className="ml-1" />
                    </Button>
                  </div>

                  <Separator className="my-3" />
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                      <Truck size={14} className="text-amber-600" />
                      <span>Free over $99</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                      <RotateCcw size={14} className="text-amber-600" />
                      <span>30-day returns</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                      <ShieldCheck size={14} className="text-amber-600" />
                      <span>2-yr warranty</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
