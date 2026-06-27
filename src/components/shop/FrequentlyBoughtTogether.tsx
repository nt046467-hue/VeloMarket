'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ShoppingCart, Check, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProductImage } from './ProductImage'
import { Price } from './Price'
import { useCart, useView } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { useCurrencyFormatter } from '@/lib/use-currency'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Picks a stable "frequently bought together" set:
// - 2 items from the same category as the main product
// - deterministic by hash so it doesn't flicker on re-renders
function pickCompanions(all: Product[], main: Product, count: number): Product[] {
  const same = all.filter((p) => p.id !== main.id && p.categoryId === main.categoryId)
  // Simple deterministic shuffle
  const seed = main.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return same
    .sort((a, b) => {
      const ha = (a.id.charCodeAt(0) + seed) % 7
      const hb = (b.id.charCodeAt(0) + seed) % 7
      return hb - ha
    })
    .slice(0, count)
}

export function FrequentlyBoughtTogether({ product }: { product: Product }) {
  const navigate = useView((s) => s.navigate)
  const addItem = useCart((s) => s.addItem)
  const formatCurrency = useCurrencyFormatter()
  const [companions, setCompanions] = useState<Product[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    let cancelled = false
    fetcher<{ products: Product[] }>(`/api/products?category=${product.category?.slug}&limit=20`)
      .then((d) => {
        if (cancelled) return
        const picked = pickCompanions(d?.products ?? [], product, 2)
        setCompanions(picked)
        setSelected(new Set(picked.map((p) => p.id))) // all selected by default
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [product.id, product.category?.slug])

  if (loading || companions.length === 0) return null

  const allItems = [product, ...companions.filter((c) => selected.has(c.id))]
  const total = allItems.reduce((sum, p) => sum + p.price, 0)
  const totalCompare = allItems.reduce((sum, p) => sum + (p.compareAt ?? p.price), 0)
  const savings = totalCompare - total

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addAllToCart() {
    allItems.forEach((p) => addItem(p, 1))
    toast.success(`Added ${allItems.length} items to your cart`)
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold sm:text-xl">
        <Badge className="bg-violet-500 text-white hover:bg-violet-500">Bundle</Badge>
        Frequently bought together
      </h2>
      <Card className="overflow-hidden">
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_280px]">
          {/* Items visual */}
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <BundleTile product={product} checked onToggle={() => { /* main always checked */ }} onClick={() => navigate({ name: 'product', productId: product.id })} />
            {companions.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <Plus size={20} className="shrink-0 text-muted-foreground" />
                <BundleTile
                  product={c}
                  checked={selected.has(c.id)}
                  onToggle={() => toggle(c.id)}
                  onClick={() => navigate({ name: 'product', productId: c.id })}
                />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex flex-col justify-center gap-2 rounded-lg bg-muted/40 p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Bundle total</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">{formatCurrency(total)}</span>
              {savings > 0 && <span className="text-sm text-muted-foreground line-through">{formatCurrency(totalCompare)}</span>}
            </div>
            {savings > 0 && (
              <Badge className="w-fit gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                Save {formatCurrency(savings)}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">{allItems.length} items selected</p>
            <Button
              className="mt-1 bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500"
              onClick={addAllToCart}
            >
              <ShoppingCart size={14} className="mr-1.5" /> Add all to cart
            </Button>
          </div>
        </div>
      </Card>
    </section>
  )
}

function BundleTile({
  product, checked, onToggle, onClick,
}: {
  product: Product
  checked: boolean
  onToggle: () => void
  onClick: () => void
}) {
  return (
    <div className={cn('relative w-32 shrink-0 transition', !checked && 'opacity-40')}>
      <button onClick={onClick} className="block w-full">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted/30">
          <ProductImage src={product.images[0]} alt={product.name} sizes="120px" />
        </div>
      </button>
      <button
        onClick={onToggle}
        aria-label={checked ? 'Remove from bundle' : 'Add to bundle'}
        className={cn(
          'absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full ring-2 ring-white transition dark:ring-zinc-900',
          checked ? 'bg-emerald-500 text-white' : 'bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
        )}
      >
        {checked ? <Check size={12} /> : <Plus size={12} />}
      </button>
      <div className="mt-1 text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-500">{product.brand}</div>
      <button onClick={onClick} className="block w-full text-left text-xs font-medium leading-tight line-clamp-2 hover:text-amber-700 dark:hover:text-amber-400">
        {product.name}
      </button>
      <div className="mt-0.5"><Price price={product.price} size="sm" /></div>
    </div>
  )
}
