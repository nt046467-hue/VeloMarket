'use client'

import { motion } from 'framer-motion'
import {
  Clock, X, Search, TrendingUp, ArrowRight, Trash2, History, ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useView, useFilters, useRecentSearches } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { useEffect, useState } from 'react'
import type { Product } from '@/lib/types'
import { ProductImage } from './ProductImage'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TRENDING = ['headphones', 'laptop', 'air fryer', 'sneakers', 'vitamin c', 'lego', 'coffee', 'drone']

export function RecentlySearchedView() {
  const navigate = useView((s) => s.navigate)
  const setSearch = useFilters((s) => s.setSearch)
  const setCategory = useFilters((s) => s.setCategory)
  const recent = useRecentSearches((s) => s.recent)
  const pushRecent = useRecentSearches((s) => s.push)
  const clearRecent = useRecentSearches((s) => s.clear)
  const formatCurrency = useCurrencyFormatter()
  const [trendingProducts, setTrendingProducts] = useState<Product[] | null>(null)

  useEffect(() => {
    fetcher<{ products: Product[] }>('/api/products?sort=popular&limit=8')
      .then((d) => setTrendingProducts(d?.products ?? []))
      .catch(() => setTrendingProducts([]))
  }, [])

  function runSearch(q: string) {
    pushRecent(q)
    setSearch(q)
    setCategory(null)
    navigate({ name: 'shop', query: q })
  }

  function removeOne(q: string) {
    // Re-push all except this one (workaround for store lacking remove)
    const remaining = recent.filter((r) => r !== q)
    clearRecent()
    remaining.reverse().forEach((r) => pushRecent(r))
    toast.success(`Removed "${q}"`)
  }

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-6">
      <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <button onClick={() => navigate({ name: 'home' })} className="hover:text-foreground">
          Home
        </button>
        <ChevronRight size={12} />
        <span className="font-medium text-foreground">Recent searches</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <History size={22} className="text-amber-600" />
            Search History
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {recent.length === 0 ? 'No searches yet — start exploring!' : `${recent.length} recent searches`}
          </p>
        </div>
        {recent.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => { clearRecent(); toast.success('Search history cleared') }}>
            <Trash2 size={13} className="mr-1.5" /> Clear all
          </Button>
        )}
      </div>

      {/* Recent searches */}
      <Card className="mb-6 p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Clock size={14} className="text-amber-600" /> Recent
        </h2>
        {recent.length === 0 ? (
          <div className="py-6 text-center">
            <Search size={28} className="mx-auto text-muted-foreground/60" />
            <p className="mt-2 text-sm text-muted-foreground">Your search history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recent.map((q, i) => (
              <motion.div
                key={q + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="group flex items-center gap-2 rounded-lg border border-border/60 p-2 transition hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-500/10"
              >
                <button
                  onClick={() => runSearch(q)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground">
                    <Clock size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{q}</div>
                    <div className="text-[10px] text-muted-foreground">Tap to search again</div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                  onClick={() => removeOne(q)}
                  aria-label="Remove"
                >
                  <X size={12} />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Trending searches */}
      <Card className="mb-6 border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-4 dark:border-amber-500/20 dark:from-amber-950/20 dark:to-orange-950/10">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <TrendingUp size={14} className="text-rose-500" /> Trending now
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {TRENDING.map((term, i) => (
            <motion.button
              key={term}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => runSearch(term)}
              className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-white px-3 py-1 text-xs font-medium text-amber-800 shadow-sm transition hover:border-amber-500 hover:bg-amber-100 dark:bg-zinc-900 dark:text-amber-300 dark:hover:bg-amber-900/20"
            >
              <TrendingUp size={11} /> {term}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Popular products */}
      {trendingProducts && trendingProducts.length > 0 && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <TrendingUp size={14} className="text-amber-600" /> Most popular products
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'shop' })}>
              View all <ChevronRight size={12} className="ml-0.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {trendingProducts.slice(0, 4).map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate({ name: 'product', productId: p.id })}
                className="group flex flex-col gap-1.5 rounded-lg border border-border/60 p-2 text-left transition hover:border-amber-300 hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted/30">
                  <ProductImage src={p.images[0]} alt={p.name} sizes="200px" />
                  <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <div className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-500">{p.brand}</div>
                <div className="text-xs font-medium line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400">{p.name}</div>
                <div className="text-sm font-bold">{formatCurrency(p.price)}</div>
              </motion.button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
