'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from './ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/api-client'
import type { Product } from '@/lib/types'

export function CustomersAlsoBought({ productId }: { productId: string }) {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [source, setSource] = useState<'co-purchase' | 'category'>('category')

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(null)
    fetcher<{ products: Product[]; source: 'co-purchase' | 'category' }>(`/api/recommendations?productId=${productId}`)
      .then((d) => {
        if (cancelled) return
        setProducts(d?.products ?? [])
        setSource(d?.source ?? 'category')
      })
      .catch(() => { if (!cancelled) setProducts([]) })
    return () => { cancelled = true }
  }, [productId])

  if (products !== null && products.length === 0) return null

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            {source === 'co-purchase' ? (
              <>
                <Users size={20} className="text-violet-600" />
                Customers also bought
              </>
            ) : (
              <>
                <TrendingUp size={20} className="text-amber-600" />
                Popular in this category
              </>
            )}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {source === 'co-purchase'
              ? 'Based on what other shoppers purchased together'
              : 'Top-rated picks shoppers love'}
          </p>
        </div>
        {source === 'co-purchase' && (
          <Badge variant="outline" className="border-violet-300 text-[10px] text-violet-700 dark:text-violet-300">
            <Sparkles size={9} className="mr-0.5" /> AI picks
          </Badge>
        )}
      </div>

      {products === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-violet-50/40 to-amber-50/30 p-3 dark:from-violet-900/10 dark:to-amber-900/10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </Card>
      )}
    </section>
  )
}
