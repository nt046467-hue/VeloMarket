'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight, Heart, Eye, Package } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from './ProductCard'
import { useRecent, useWishlist, useView } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import type { Product } from '@/lib/types'

/**
 * Personalized "For You" recommendations on home page.
 * Builds a profile from:
 *  - Recently viewed products (localStorage)
 *  - Wishlist product IDs (localStorage)
 *  - User's past orders (server)
 * Then picks products in those categories the user hasn't seen yet.
 */
export function PersonalizedRecommendations() {
  const navigate = useView((s) => s.navigate)
  const recentIds = useRecent((s) => s.productIds)
  const wishlistIds = useWishlist((s) => s.productIds)
  const [recommendations, setRecommendations] = useState<Product[] | null>(null)
  const [sources, setSources] = useState<{ icon: any; label: string }[]>([])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecommendations(null)

    // Build a profile of seed product IDs (most recent first)
    const seedIds = [...recentIds.slice(0, 5), ...wishlistIds.slice(0, 3)]

    async function load() {
      try {
        // Step 1: Fetch the seed products to find their categories
        const seeds = await Promise.all(
          seedIds.slice(0, 5).map((id) =>
            fetcher<{ product: Product }>(`/api/products?id=${id}`)
              .then((d) => d?.product).catch(() => null)
          )
        )
        const seedProducts = seeds.filter(Boolean) as Product[]

        // Step 2: Get categories user is interested in (top 3)
        const categoryCount = new Map<string, number>()
        seedProducts.forEach((p) => {
          if (p.category?.slug) {
            categoryCount.set(p.category.slug, (categoryCount.get(p.category.slug) || 0) + 1)
          }
        })
        const topCategories = [...categoryCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([slug]) => slug)

        // Step 3: Fetch popular products from those categories
        const excludeIds = new Set([...recentIds, ...wishlistIds])
        const fetched = await Promise.all(
          topCategories.map((slug) =>
            fetcher<{ products: Product[] }>(`/api/products?category=${slug}&limit=8`)
              .then((d) => d?.products ?? []).catch(() => [])
          )
        )

        // Step 4: Combine, dedupe, exclude already-seen, sort by rating
        const seen = new Set<string>()
        const combined: Product[] = []
        fetched.flat().forEach((p) => {
          if (!excludeIds.has(p.id) && !seen.has(p.id)) {
            seen.add(p.id)
            combined.push(p)
          }
        })
        combined.sort((a, b) => b.ratingCount - a.ratingCount)

        if (cancelled) return
        setRecommendations(combined.slice(0, 5))

        // Build source attribution
        const newSources: { icon: any; label: string }[] = []
        if (recentIds.length > 0) newSources.push({ icon: Eye, label: 'recently viewed' })
        if (wishlistIds.length > 0) newSources.push({ icon: Heart, label: 'wishlisted' })
        if (newSources.length === 0) newSources.push({ icon: Package, label: 'top-rated' })
        setSources(newSources)
      } catch {
        if (!cancelled) setRecommendations([])
      }
    }

    load()
    return () => { cancelled = true }
  }, [recentIds, wishlistIds])

  // Don't render if user has no activity OR no recommendations
  if (recommendations !== null && recommendations.length === 0) return null
  if (recentIds.length === 0 && wishlistIds.length === 0) return null

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            <span className="bg-gradient-to-br from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              ✨ For You
            </span>
            <Badge variant="outline" className="border-violet-300 text-[10px] text-violet-700 dark:border-violet-500/30 dark:text-violet-300">
              <Sparkles size={9} className="mr-0.5" /> Personalized
            </Badge>
          </h2>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
            Based on your
            {sources.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <s.icon size={9} /> {s.label}
              </span>
            ))}
            activity
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'shop' })}>
          Explore all <ChevronRight size={14} className="ml-0.5" />
        </Button>
      </div>

      {recommendations === null ? (
        <Card className="bg-gradient-to-br from-violet-50/50 to-fuchsia-50/30 p-4 dark:from-violet-950/20 dark:to-fuchsia-950/10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
          </div>
        </Card>
      ) : (
        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-50/50 to-fuchsia-50/30 p-3 dark:from-violet-950/20 dark:to-fuchsia-950/10">
          {/* Decorative gradient orbs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {recommendations.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </Card>
      )}
    </section>
  )
}
