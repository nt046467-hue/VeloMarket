'use client'

import { Heart, ShoppingCart, Check, GitCompare, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from './StarRating'
import { Price } from './Price'
import { ProductImage } from './ProductImage'
import { useCart, useWishlist, useView, useCompare, useQuickView, MAX_COMPARE } from '@/lib/store'
import { discountPercent, truncate } from '@/lib/format'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const addItem = useCart((s) => s.addItem)
  const wishlistHas = useWishlist((s) => s.productIds.includes(product.id))
  const toggleWishlist = useWishlist((s) => s.toggle)
  const navigate = useView((s) => s.navigate)
  const compareHas = useCompare((s) => s.productIds.includes(product.id))
  const compareIds = useCompare((s) => s.productIds)
  const toggleCompare = useCompare((s) => s.toggle)
  const openQuickView = useQuickView((s) => s.open)

  const pct = discountPercent(product.price, product.compareAt)
  const isDeal = pct >= 10
  const lowStock = product.stock > 0 && product.stock <= 10
  const soldOut = product.stock === 0

  function handleCompare(e: React.MouseEvent) {
    e.stopPropagation()
    if (compareHas) {
      toggleCompare(product.id)
      toast.success(`Removed "${product.name}" from comparison`)
      return
    }
    if (compareIds.length >= MAX_COMPARE) {
      toast.error(`You can compare up to ${MAX_COMPARE} products at a time`)
      return
    }
    toggleCompare(product.id)
    toast.success(`Added "${product.name}" to comparison (${compareIds.length + 1}/${MAX_COMPARE})`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.4) }}
      whileHover={{ y: -2 }}
    >
      <Card className="group relative flex h-full flex-col overflow-hidden border-border/60 transition-all hover:shadow-xl hover:shadow-amber-100/40 dark:hover:shadow-amber-900/20 hover:border-amber-300/60 dark:hover:border-amber-500/40">
        <div
          className="relative aspect-square cursor-pointer overflow-hidden bg-muted/30"
          onClick={() => navigate({ name: 'product', productId: product.id })}
        >
          <ProductImage src={product.images[0]} alt={product.name} priority={index < 4} />

          {/* Top-left badges */}
          <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1">
            {product.isFeatured && (
              <Badge className="bg-amber-500 text-white hover:bg-amber-500 shadow-sm">
                Featured
              </Badge>
            )}
            {isDeal && (
              <Badge className="bg-rose-500 text-white hover:bg-rose-500 shadow-sm">
                -{pct}%
              </Badge>
            )}
            {soldOut && (
              <Badge variant="secondary" className="bg-zinc-800 text-white">
                Sold out
              </Badge>
            )}
            {lowStock && !soldOut && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Only {product.stock} left
              </Badge>
            )}
          </div>

          {/* Top-right wishlist */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleWishlist(product.id)
            }}
            aria-label="Toggle wishlist"
            className={cn(
              'absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur transition-all hover:scale-110 hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-900',
              wishlistHas ? 'text-rose-500' : 'text-zinc-500 dark:text-zinc-400'
            )}
          >
            <Heart size={16} fill={wishlistHas ? 'currentColor' : 'none'} />
          </button>

          {/* Hover quick actions */}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 flex translate-y-3 gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openQuickView(product.id) }}
              aria-label="Quick view"
              className="pointer-events-auto flex h-9 flex-1 items-center justify-center gap-1 rounded-md bg-white/95 text-xs font-semibold text-zinc-900 shadow-md backdrop-blur transition hover:bg-white dark:bg-zinc-900/90 dark:text-white dark:hover:bg-zinc-900"
            >
              <Eye size={13} /> Quick view
            </button>
            <button
              type="button"
              onClick={handleCompare}
              aria-label="Add to compare"
              className={cn(
                'pointer-events-auto grid h-9 w-9 place-items-center rounded-md shadow-md backdrop-blur transition',
                compareHas
                  ? 'bg-amber-500 text-zinc-900 hover:bg-amber-400'
                  : 'bg-white/95 text-zinc-700 hover:bg-white dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:bg-zinc-900'
              )}
            >
              <GitCompare size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-500">
              {product.brand}
            </span>
            <StarRating rating={product.rating} count={product.ratingCount} />
          </div>
          <h3
            onClick={() => navigate({ name: 'product', productId: product.id })}
            className="cursor-pointer text-sm font-medium leading-snug line-clamp-2 hover:text-amber-700 dark:hover:text-amber-400"
            title={product.name}
          >
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncate(product.description, 100)}
          </p>

          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <Price price={product.price} compareAt={product.compareAt} size="lg" />
          </div>

          <Button
            type="button"
            size="sm"
            className={cn(
              'mt-1 w-full bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400',
              soldOut && 'pointer-events-none opacity-50'
            )}
            disabled={soldOut}
            onClick={() => addItem(product, 1)}
          >
            <ShoppingCart size={14} className="mr-1.5" />
            {soldOut ? 'Sold out' : 'Add to cart'}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="aspect-square shimmer" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/3 shimmer rounded" />
        <div className="h-4 w-full shimmer rounded" />
        <div className="h-4 w-2/3 shimmer rounded" />
        <div className="h-6 w-1/2 shimmer rounded" />
        <div className="h-8 w-full shimmer rounded" />
      </div>
    </Card>
  )
}

export function ProductRow({ product, index = 0 }: { product: Product; index?: number }) {
  const addItem = useCart((s) => s.addItem)
  const navigate = useView((s) => s.navigate)
  const wishlistHas = useWishlist((s) => s.productIds.includes(product.id))
  const toggleWishlist = useWishlist((s) => s.toggle)
  const pct = discountPercent(product.price, product.compareAt)

  return (
    <Card className="flex gap-3 p-3 hover:border-amber-300/60 dark:hover:border-amber-500/40 transition-colors">
      <div
        className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-md bg-muted/30"
        onClick={() => navigate({ name: 'product', productId: product.id })}
      >
        <ProductImage src={product.images[0]} alt={product.name} sizes="100px" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="text-[11px] uppercase font-semibold text-amber-700 dark:text-amber-500">{product.brand}</div>
        <h3
          onClick={() => navigate({ name: 'product', productId: product.id })}
          className="cursor-pointer text-sm font-medium hover:text-amber-700 dark:hover:text-amber-400 line-clamp-2"
        >
          {product.name}
        </h3>
        <div className="mt-1">
          <StarRating rating={product.rating} count={product.ratingCount} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <Price price={product.price} compareAt={product.compareAt} size="md" showDiscount />
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn('h-8 w-8', wishlistHas && 'text-rose-500')}
              onClick={() => toggleWishlist(product.id)}
              aria-label="Wishlist"
            >
              <Heart size={14} fill={wishlistHas ? 'currentColor' : 'none'} />
            </Button>
            <Button
              size="sm"
              className="h-8 bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500"
              onClick={() => addItem(product, 1)}
            >
              <Check size={14} className="mr-1" /> Add
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Compact horizontal tile used for recently-viewed strips
export function ProductTile({ product, onClick }: { product: Product; onClick?: () => void }) {
  const navigate = useView((s) => s.navigate)
  const pct = discountPercent(product.price, product.compareAt)
  return (
    <button
      onClick={() => { onClick?.(); navigate({ name: 'product', productId: product.id }) }}
      className="group flex w-40 shrink-0 flex-col gap-1.5 rounded-lg border border-border/60 bg-card p-2 text-left transition-all hover:border-amber-300/60 hover:shadow-md dark:hover:border-amber-500/40"
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted/30">
        <ProductImage src={product.images[0]} alt={product.name} sizes="160px" />
        {pct > 0 && (
          <span className="absolute left-1 top-1 rounded bg-rose-500 px-1 py-0.5 text-[9px] font-bold text-white">-{pct}%</span>
        )}
      </div>
      <div className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-500">{product.brand}</div>
      <div className="text-xs font-medium leading-tight line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400">{product.name}</div>
      <div className="text-sm font-bold"><Price price={product.price} size="sm" /></div>
    </button>
  )
}
