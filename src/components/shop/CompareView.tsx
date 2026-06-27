'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check, X, ShoppingCart, Trash2, ChevronRight, Home as HomeIcon, GitCompare, Star, Award, TrendingDown,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductImage } from './ProductImage'
import { StarRating } from './StarRating'
import { useCompare, useView, useCart } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { discountPercent } from '@/lib/format'
import { useCurrencyFormatter } from '@/lib/use-currency'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CompareView() {
  const productIds = useCompare((s) => s.productIds)
  const remove = useCompare((s) => s.remove)
  const clear = useCompare((s) => s.clear)
  const navigate = useView((s) => s.navigate)
  const addItem = useCart((s) => s.addItem)
  const [products, setProducts] = useState<Product[] | null>(null)
  const formatCurrency = useCurrencyFormatter()

  useEffect(() => {
    if (productIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([])
      return
    }
    setProducts(null)
    let cancelled = false
    Promise.all(
      productIds.map((id) =>
        fetcher<{ product: Product }>(`/api/products?id=${id}`)
          .then((d) => d?.product).catch(() => null)
      )
    ).then((ps) => { if (!cancelled) setProducts(ps.filter(Boolean) as Product[]) })
    return () => { cancelled = true }
  }, [productIds])

  // Collect all spec keys for the comparison table
  const allSpecKeys: string[] = []
  if (products) {
    products.forEach((p) => {
      if (p.specs) Object.keys(p.specs).forEach((k) => { if (!allSpecKeys.includes(k)) allSpecKeys.push(k) })
    })
  }

  // Find best values for highlighting
  const lowestPrice = products ? Math.min(...products.map((p) => p.price)) : 0
  const highestRating = products ? Math.max(...products.map((p) => p.rating)) : 0
  const biggestDiscount = products ? Math.max(...products.map((p) => discountPercent(p.price, p.compareAt))) : 0

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center hover:text-foreground">
          <HomeIcon size={12} className="mr-1" /> Home
        </button>
        <ChevronRight size={12} />
        <span className="font-medium text-foreground">Compare</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <GitCompare className="text-amber-600" /> Product Comparison
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Compare {products?.length ?? 0} products side-by-side</p>
        </div>
        {products && products.length > 0 && (
          <Button variant="outline" size="sm" onClick={clear}>
            <Trash2 size={14} className="mr-1.5" /> Clear all
          </Button>
        )}
      </div>

      {products === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-xl" />)}
        </div>
      ) : products.length === 0 ? (
        <Card className="p-10 text-center">
          <GitCompare size={40} className="mx-auto text-muted-foreground" />
          <h3 className="mt-3 text-lg font-semibold">Nothing to compare yet</h3>
          <p className="text-sm text-muted-foreground">
            Tap the <GitCompare size={12} className="inline" /> icon on products to add them here. You can compare up to 3 products.
          </p>
          <Button className="mt-4 bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500" onClick={() => navigate({ name: 'shop' })}>
            Browse products
          </Button>
        </Card>
      ) : products.length === 1 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Add at least one more product to start comparing.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate({ name: 'shop' })}>
            Add more products
          </Button>
        </Card>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="mb-6 grid gap-3 md:hidden">
            {products.map((p) => (
              <CompareCard key={p.id} product={p} onRemove={() => remove(p.id)} lowestPrice={lowestPrice} highestRating={highestRating} biggestDiscount={biggestDiscount} onAdd={() => addItem(p, 1)} />
            ))}
          </div>

          {/* Desktop: comparison table */}
          <div className="hidden overflow-hidden rounded-xl border md:block">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-muted/40">
                  <th className="w-40 p-3 text-left align-top text-xs font-semibold uppercase text-muted-foreground">
                    Products ({products.length})
                  </th>
                  {products.map((p) => (
                    <th key={p.id} className="relative p-3 text-left align-top">
                      <button
                        onClick={() => remove(p.id)}
                        aria-label="Remove"
                        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30"
                      >
                        <X size={14} />
                      </button>
                      <div className="relative mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-lg bg-muted/30">
                        <ProductImage src={p.images[0]} alt={p.name} sizes="200px" />
                      </div>
                      <div className="mt-2 text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-500">{p.brand}</div>
                      <button
                        onClick={() => navigate({ name: 'product', productId: p.id })}
                        className="block w-full text-left text-sm font-bold leading-tight hover:text-amber-700 dark:hover:text-amber-400 line-clamp-2"
                      >
                        {p.name}
                      </button>
                      <div className="mt-1"><StarRating rating={p.rating} count={p.ratingCount} size={12} /></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price */}
                <Row label="Price" products={products}>
                  {(p) => (
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span className={cn('text-base font-bold', p.price === lowestPrice && 'rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300')}>
                        {formatCurrency(p.price)}
                      </span>
                      {p.compareAt && p.compareAt > p.price && (
                        <span className="text-xs text-muted-foreground line-through">{formatCurrency(p.compareAt)}</span>
                      )}
                      {p.price === lowestPrice && (
                        <Badge variant="outline" className="ml-1 gap-0.5 border-emerald-300 text-[10px] text-emerald-700 dark:text-emerald-300">
                          <TrendingDown size={10} /> Lowest
                        </Badge>
                      )}
                    </div>
                  )}
                </Row>

                {/* Discount */}
                <Row label="Discount" products={products}>
                  {(p) => {
                    const pct = discountPercent(p.price, p.compareAt)
                    return pct > 0 ? (
                      <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold', pct === biggestDiscount ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'text-rose-600 dark:text-rose-400')}>
                        -{pct}%
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>
                  }}
                </Row>

                {/* Rating */}
                <Row label="Rating" products={products}>
                  {(p) => (
                    <div className="flex items-center gap-1">
                      <StarRating rating={p.rating} showValue size={12} />
                      {p.rating === highestRating && (
                        <Badge variant="outline" className="ml-1 gap-0.5 border-amber-300 text-[10px] text-amber-700 dark:text-amber-300">
                          <Award size={10} /> Top
                        </Badge>
                      )}
                    </div>
                  )}
                </Row>

                {/* Stock */}
                <Row label="Availability" products={products}>
                  {(p) => p.stock > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <Check size={12} /> In stock ({p.stock})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
                      <X size={12} /> Sold out
                    </span>
                  )}
                </Row>

                {/* Category */}
                <Row label="Category" products={products}>
                  {(p) => <span className="text-xs">{p.category?.name ?? '—'}</span>}
                </Row>

                {/* Brand */}
                <Row label="Brand" products={products}>
                  {(p) => <span className="text-xs font-medium">{p.brand}</span>}
                </Row>

                {/* Spec rows */}
                {allSpecKeys.map((key) => (
                  <Row key={key} label={key} products={products}>
                    {(p) => <span className="text-xs">{p.specs?.[key] ?? '—'}</span>}
                  </Row>
                ))}

                {/* Action row */}
                <Row label="" products={products} last>
                  {(p) => (
                    <div className="flex flex-col gap-1.5">
                      <Button
                        size="sm"
                        className="bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500"
                        onClick={() => { addItem(p, 1); toast.success(`Added ${p.name} to cart`) }}
                        disabled={p.stock === 0}
                      >
                        <ShoppingCart size={13} className="mr-1" /> Add to cart
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate({ name: 'product', productId: p.id })}>
                        View details
                      </Button>
                    </div>
                  )}
                </Row>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <Card className="mt-4 p-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><TrendingDown size={12} className="text-emerald-600" /> Lowest price</span>
              <span className="flex items-center gap-1"><Award size={12} className="text-amber-600" /> Highest rated</span>
              <span>Compare up to 3 products at once.</span>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function Row({
  label, products, children, last = false,
}: {
  label: string
  products: Product[]
  children: (p: Product) => React.ReactNode
  last?: boolean
}) {
  return (
    <tr className={cn('border-t border-border/60 hover:bg-muted/20', last && 'border-t-2')}>
      <td className="p-3 align-top text-xs font-semibold uppercase text-muted-foreground">{label}</td>
      {products.map((p) => (
        <td key={p.id} className={cn('p-3 align-top', !last && 'border-l border-border/40')}>
          {children(p)}
        </td>
      ))}
    </tr>
  )
}

function CompareCard({
  product, onRemove, lowestPrice, highestRating, biggestDiscount, onAdd,
}: {
  product: Product
  onRemove: () => void
  lowestPrice: number
  highestRating: number
  biggestDiscount: number
  onAdd: () => void
}) {
  const navigate = useView((s) => s.navigate)
  const formatCurrency = useCurrencyFormatter()
  const pct = discountPercent(product.price, product.compareAt)
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <button onClick={() => navigate({ name: 'product', productId: product.id })} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted/30">
          <ProductImage src={product.images[0]} alt={product.name} sizes="100px" />
        </button>
        <div className="flex-1">
          <div className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-500">{product.brand}</div>
          <button onClick={() => navigate({ name: 'product', productId: product.id })} className="block text-left text-sm font-bold hover:text-amber-700 dark:hover:text-amber-400 line-clamp-2">
            {product.name}
          </button>
          <div className="mt-1"><StarRating rating={product.rating} count={product.ratingCount} size={12} /></div>
          <div className="mt-1 flex flex-wrap items-baseline gap-1">
            <span className="text-base font-bold">{formatCurrency(product.price)}</span>
            {product.compareAt && <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.compareAt)}</span>}
            {product.price === lowestPrice && <Badge variant="outline" className="text-[9px] text-emerald-700">Lowest</Badge>}
            {product.rating === highestRating && <Badge variant="outline" className="text-[9px] text-amber-700">Top rated</Badge>}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}><X size={14} /></Button>
      </div>
      <Separator />
      {product.specs && (
        <dl className="grid grid-cols-2 gap-1 p-3 text-xs">
          {Object.entries(product.specs).slice(0, 6).map(([k, v]) => (
            <div key={k} className="border-b border-border/40 py-1 last:border-0">
              <dt className="text-[10px] uppercase text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="p-3 pt-0">
        <Button size="sm" className="w-full bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500" onClick={onAdd} disabled={product.stock === 0}>
          <ShoppingCart size={13} className="mr-1.5" /> Add to cart
        </Button>
      </div>
    </Card>
  )
}
