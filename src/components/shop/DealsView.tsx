'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Flame, ChevronRight, Home as HomeIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from './ProductCard'
import { useView } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import type { Product } from '@/lib/types'

export function DealsView() {
  const navigate = useView((s) => s.navigate)
  const [deals, setDeals] = useState<Product[] | null>(null)

  useEffect(() => {
    fetcher<{ products: Product[] }>('/api/products?sort=popular&limit=50')
      .then((d) => setDeals((d?.products ?? []).filter((p) => p.compareAt && p.compareAt > p.price)))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center hover:text-foreground">
          <HomeIcon size={12} className="mr-1" /> Home
        </button>
        <ChevronRight size={12} />
        <span className="font-medium text-foreground">Today&apos;s Deals</span>
      </nav>

      <Card className="mb-6 overflow-hidden bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white">
        <div className="flex items-center justify-between p-6">
          <div>
            <Badge className="mb-2 bg-white/20 text-white hover:bg-white/30">
              <Flame size={12} className="mr-1" /> Hot deals
            </Badge>
            <h1 className="text-2xl font-black sm:text-3xl">Today&apos;s Deals</h1>
            <p className="text-sm text-white/90">Save big on the products you love. Limited time only.</p>
          </div>
          <Sparkles size={48} className="hidden text-white/30 sm:block" />
        </div>
      </Card>

      {deals === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
        </div>
      ) : deals.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No active deals at the moment. Check back soon!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {deals.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  )
}
