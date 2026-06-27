'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { History, ChevronRight, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProductTile } from './ProductCard'
import { useRecent, useView } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import type { Product } from '@/lib/types'

export function RecentlyViewedStrip({ excludeId }: { excludeId?: string }) {
  const ids = useRecent((s) => s.productIds)
  const clear = useRecent((s) => s.clear)
  const navigate = useView((s) => s.navigate)
  const [products, setProducts] = useState<Product[] | null>(null)

  useEffect(() => {
    const filtered = excludeId ? ids.filter((id) => id !== excludeId) : ids
    /* eslint-disable react-hooks/set-state-in-effect */
    if (filtered.length === 0) {
      setProducts([])
      return
    }
    setProducts(null)
    /* eslint-enable react-hooks/set-state-in-effect */
    let cancelled = false
    Promise.all(
      filtered.map((id) =>
        fetcher<{ product: Product }>(`/api/products?id=${id}`)
          .then((d) => d?.product).catch(() => null)
      )
    ).then((ps) => { if (!cancelled) setProducts(ps.filter(Boolean) as Product[]) })
    return () => { cancelled = true }
  }, [ids, excludeId])

  if (!products || products.length === 0) return null

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            <History size={20} className="text-amber-600" /> Recently viewed
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">Pick up where you left off</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={clear} className="text-xs">
            <Trash2 size={12} className="mr-1" /> Clear
          </Button>
        </div>
      </div>
      <Card className="p-3">
        <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <ProductTile product={p} />
            </motion.div>
          ))}
          <button
            onClick={() => navigate({ name: 'shop' })}
            className="flex w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 p-4 text-xs text-muted-foreground transition hover:border-amber-300 hover:text-amber-700 dark:hover:border-amber-500/40"
          >
            <ChevronRight size={20} />
            <span>Browse all</span>
          </button>
        </div>
      </Card>
    </section>
  )
}
