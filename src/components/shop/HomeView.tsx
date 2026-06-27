'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Truck, ShieldCheck, Headphones, CreditCard, Sparkles, ChevronRight, Flame, Star, Tag,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from './ProductCard'
import { ProductImage } from './ProductImage'
import { RecentlyViewedStrip } from './RecentlyViewedStrip'
import { PersonalizedRecommendations } from './PersonalizedRecommendations'
import { useView, useFilters } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { discountPercent } from '@/lib/format'
import { useCurrencyFormatter } from '@/lib/use-currency'
import type { Product, Category } from '@/lib/types'

const HERO_SLIDES = [
  {
    badge: 'Mega Tech Sale',
    title: 'Next-gen gadgets, today',
    subtitle: 'Save up to 40% on flagship laptops, phones & audio gear',
    cta: 'Shop Electronics',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&q=80',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    badge: 'Sound Stage',
    title: 'Feel every beat',
    subtitle: 'Premium headphones & speakers with immersive audio',
    cta: 'Explore Audio',
    category: 'audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80',
    accent: 'from-rose-500 to-pink-500',
  },
  {
    badge: 'Home Makeover',
    title: 'Upgrade your space',
    subtitle: 'Smart home, kitchen essentials & comfort picks',
    cta: 'Shop Home',
    category: 'home-kitchen',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1400&q=80',
    accent: 'from-emerald-500 to-teal-500',
  },
]

export function HomeView() {
  const navigate = useView((s) => s.navigate)
  const setCategory = useFilters((s) => s.setCategory)
  const setSearch = useFilters((s) => s.setSearch)
  const [featured, setFeatured] = useState<Product[] | null>(null)
  const [deals, setDeals] = useState<Product[] | null>(null)
  const [newArrivals, setNewArrivals] = useState<Product[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    fetcher<{ products: Product[] }>('/api/products?featured=true&limit=8').then((d) => setFeatured(d?.products ?? []))
    fetcher<{ products: Product[] }>('/api/products?sort=popular&limit=10').then((d) => {
      const ds = (d?.products ?? []).filter((p) => p.compareAt && p.compareAt > p.price).slice(0, 5)
      setDeals(ds)
    })
    fetcher<{ products: Product[] }>('/api/products?sort=newest&limit=8').then((d) => setNewArrivals(d?.products ?? []))
    fetcher<{ categories: Category[] }>('/api/categories').then((d) => setCategories(d?.categories ?? []))
  }, [])

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 5500)
    return () => clearInterval(id)
  }, [])

  function shopCategory(slug: string) {
    setCategory(slug)
    setSearch('')
    navigate({ name: 'shop', categorySlug: slug })
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Trust badges */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[
          { icon: Truck, label: 'Free Shipping', sub: 'On orders over $99' },
          { icon: ShieldCheck, label: 'Secure Payment', sub: '256-bit encryption' },
          { icon: Headphones, label: '24/7 Support', sub: 'Always here for you' },
          { icon: CreditCard, label: 'Easy Returns', sub: '30-day money back' },
        ].map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="flex h-full items-center gap-2.5 border-border/60 bg-gradient-to-br from-card to-amber-50/30 p-2.5 transition-colors hover:border-amber-300/60 dark:to-amber-950/10 sm:p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                <t.icon size={16} />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold sm:text-sm">{t.label}</div>
                <div className="hidden text-[10px] text-muted-foreground sm:block">{t.sub}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Hero carousel */}
      <div className="relative mb-6 overflow-hidden rounded-2xl shadow-md">
        <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {HERO_SLIDES.map((h, i) => (
            <div key={i} className="relative min-w-full">
              <div className={`relative flex min-h-[260px] flex-col justify-end overflow-hidden bg-gradient-to-br ${h.accent} p-6 sm:min-h-[340px] sm:p-10 md:flex-row md:items-center md:justify-between`}>
                <div className="relative z-10 max-w-md text-white">
                  <Badge className="mb-2 w-fit bg-white/20 text-white hover:bg-white/30 backdrop-blur">
                    <Sparkles size={12} className="mr-1" /> {h.badge}
                  </Badge>
                  <h1 className="mb-2 text-2xl font-black leading-tight drop-shadow sm:text-4xl">
                    {h.title}
                  </h1>
                  <p className="mb-4 text-sm text-white/90 sm:text-base">{h.subtitle}</p>
                  <Button
                    onClick={() => shopCategory(h.category)}
                    className="bg-white text-zinc-900 hover:bg-zinc-100 shadow-md"
                  >
                    {h.cta} <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
                <div className="relative mt-4 hidden h-56 w-56 overflow-hidden rounded-2xl shadow-2xl ring-4 ring-white/20 sm:block md:h-72 md:w-72">
                  <ProductImage src={h.image} alt={h.title} sizes="400px" priority={i === 0} />
                </div>
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute right-1/3 top-1/2 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              </div>
            </div>
          ))}
        </div>
        {/* Slide dots */}
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Category tiles */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">Shop by category</h2>
          <Button variant="ghost" size="sm" onClick={() => shopCategory('')}>
            View all <ChevronRight size={14} />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-10">
          {categories.slice(0, 10).map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              whileHover={{ y: -2 }}
              onClick={() => shopCategory(c.slug)}
              className="group flex flex-col items-center gap-1.5"
            >
              <div className="grid aspect-square w-full place-items-center rounded-xl border border-border/60 bg-gradient-to-br from-amber-50 to-white p-2 transition-all hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-zinc-900 dark:hover:border-amber-400/50 dark:hover:shadow-amber-900/20">
                <CategoryIcon name={c.icon} />
              </div>
              <span className="text-center text-[10px] font-medium leading-tight sm:text-xs">{c.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Today's deals strip */}
      <Card className="mb-6 overflow-hidden border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 dark:border-rose-500/30 dark:from-rose-950/30 dark:to-orange-950/30">
        <div className="flex items-center justify-between border-b border-rose-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Flame className="text-rose-500" size={20} />
            <h2 className="text-base font-bold text-rose-900 sm:text-lg">Today&apos;s Deals</h2>
            <Badge className="bg-rose-500 text-white">Limited time</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-rose-300 text-rose-700 hover:bg-rose-100"
            onClick={() => navigate({ name: 'deals' })}
          >
            See all deals <ChevronRight size={14} />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
          {deals === null
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)
            : deals.map((p, i) => <DealTile key={p.id} product={p} index={i} />)}
        </div>
      </Card>

      {/* Personalized recommendations */}
      <PersonalizedRecommendations />

      {/* Featured products */}
      <SectionHeader title="Featured products" subtitle="Handpicked for you" onMore={() => shopCategory('')} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {featured === null
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)
          : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>

      {/* Promo banners */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white">
          <div className="relative z-10">
            <Badge className="mb-2 bg-white/20 text-white hover:bg-white/30">Membership</Badge>
            <h3 className="text-xl font-bold">Join Velo Prime</h3>
            <p className="mt-1 text-sm text-white/90">Free same-day delivery, exclusive deals, and more.</p>
            <Button className="mt-3 bg-white text-violet-700 hover:bg-white/90" size="sm" onClick={() => useView.getState().navigate({ name: 'account' })}>
              Try free for 30 days
            </Button>
          </div>
          <Sparkles className="absolute -right-4 -top-4 text-white/10" size={120} />
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white">
          <div className="relative z-10">
            <Badge className="mb-2 bg-white/20 text-white hover:bg-white/30">Trade-in</Badge>
            <h3 className="text-xl font-bold">Trade & Save</h3>
            <p className="mt-1 text-sm text-white/90">Get up to 50% back when you trade in eligible devices.</p>
            <Button className="mt-3 bg-white text-emerald-700 hover:bg-white/90" size="sm" onClick={() => shopCategory('electronics')}>
              See trade-in offers
            </Button>
          </div>
          <Tag className="absolute -right-4 -top-4 text-white/10" size={120} />
        </Card>
      </div>

      {/* New arrivals */}
      <SectionHeader title="New arrivals" subtitle="Fresh in stock" onMore={() => shopCategory('')} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {newArrivals === null
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)
          : newArrivals.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>

      {/* Recently viewed */}
      <RecentlyViewedStrip />
    </div>
  )
}

function SectionHeader({ title, subtitle, onMore }: { title: string; subtitle?: string; onMore?: () => void }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
      </div>
      {onMore && (
        <Button variant="ghost" size="sm" onClick={onMore}>
          See more <ChevronRight size={14} />
        </Button>
      )}
    </div>
  )
}

function DealTile({ product, index }: { product: Product; index: number }) {
  const navigate = useView((s) => s.navigate)
  const formatCurrency = useCurrencyFormatter()
  const pct = discountPercent(product.price, product.compareAt)
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      onClick={() => navigate({ name: 'product', productId: product.id })}
      className="group flex flex-col gap-1.5 text-left"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
        <ProductImage src={product.images[0]} alt={product.name} />
        <span className="absolute left-1.5 top-1.5 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          -{pct}%
        </span>
      </div>
      <div className="text-xs font-semibold text-rose-700 line-clamp-1">{product.brand}</div>
      <div className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground">{product.name}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-bold text-rose-700">{formatCurrency(product.price)}</span>
        <span className="text-[10px] text-muted-foreground line-through">{formatCurrency(product.compareAt!)}</span>
      </div>
    </motion.button>
  )
}

function CategoryIcon({ name }: { name?: string | null }) {
  const map: Record<string, any> = {
    Smartphone: '📱', Laptop: '💻', Headphones: '🎧', Home: '🏠', Shirt: '👕',
    BookOpen: '📚', Dumbbell: '🏋️', Sparkles: '✨', Gamepad2: '🎮', ShoppingBasket: '🛒',
  }
  const emoji = name ? map[name] : '🛍️'
  return <span className="text-3xl sm:text-4xl transition-transform group-hover:scale-110">{emoji ?? '🛍️'}</span>
}
