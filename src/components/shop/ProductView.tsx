'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Heart, Share2, ChevronRight, Check, Truck, ShieldCheck,
  RotateCcw, Minus, Plus, Star, Package, Home as HomeIcon, MessageSquare, GitCompare,
  ThumbsUp, X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductImage } from './ProductImage'
import { StarRating } from './StarRating'
import { Price } from './Price'
import { ProductCard } from './ProductCard'
import { FrequentlyBoughtTogether } from './FrequentlyBoughtTogether'
import { CustomersAlsoBought } from './CustomersAlsoBought'
import { ProductQA } from './ProductQA'
import { ReviewSummary } from './ReviewSummary'
import { SocialProofNotifications } from './SocialProofNotifications'
import { RecentlyViewedStrip } from './RecentlyViewedStrip'
import { PriceAlertButton } from './PriceAlerts'
import { VariantSelector, type VariantSelection, computeVariantPrice, isVariantSelectionComplete, getVariantStock } from './VariantSelector'
import { useCart, useWishlist, useView, useUI, useAuth, useRecent, useCompare, MAX_COMPARE } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { formatDate, discountPercent, truncate } from '@/lib/format'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { toast } from 'sonner'
import type { Product, Review } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProductView({ productId }: { productId: string }) {
  const navigate = useView((s) => s.navigate)
  const addItem = useCart((s) => s.addItem)
  const wishlistHas = useWishlist((s) => s.productIds.includes(productId))
  const toggleWishlist = useWishlist((s) => s.toggle)
  const openCart = useCart((s) => s.openCart)
  const { user } = useAuth()
  const { openAuth } = useUI()
  const pushRecent = useRecent((s) => s.push)
  const compareHas = useCompare((s) => s.productIds.includes(productId))
  const compareIds = useCompare((s) => s.productIds)
  const toggleCompare = useCompare((s) => s.toggle)
  // Currency-aware formatter (overrides static formatCurrency from import)
  const formatCurrency = useCurrencyFormatter()

  const [data, setData] = useState<{ product: Product; reviews: Review[] } | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [variantSel, setVariantSel] = useState<VariantSelection>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setData(null)
    setActiveImage(0)
    setQty(1)
    setError(null)
    /* eslint-enable react-hooks/set-state-in-effect */
    window.scrollTo({ top: 0, behavior: 'smooth' })
    let cancelled = false
    fetcher<{ product: Product; reviews: Review[] }>(`/api/products?id=${encodeURIComponent(productId)}`)
      .then((d) => {
        if (cancelled) return
        if (!d?.product) { setError('Product not found'); return }
        setData(d)
        // Track recently viewed
        pushRecent(d.product.id)
        fetcher<{ products: Product[] }>(`/api/products?category=${d.product.category?.slug || ''}&limit=8`)
          .then((r) => { if (!cancelled) setRelated((r?.products ?? []).filter((p) => p.id !== d.product.id).slice(0, 5)) })
      })
      .catch(() => { if (!cancelled) setError('Failed to load product') })
    return () => { cancelled = true }
  }, [productId, pushRecent])

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-rose-600">{error}</p>
        <Button className="mt-4" onClick={() => navigate({ name: 'home' })}>Back to home</Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  const { product, reviews } = data
  const pct = discountPercent(product.price, product.compareAt)
  const lowStock = product.stock > 0 && product.stock <= 10
  const soldOut = product.stock === 0

  // Variant-aware computed values
  const hasVariants = !!(product.variants && (product.variants.colors?.length || product.variants.sizes?.length))
  const variantComplete = isVariantSelectionComplete(product.variants, variantSel)
  const effectivePrice = hasVariants ? computeVariantPrice(product.price, variantSel) : product.price
  const effectiveStock = hasVariants && variantComplete
    ? getVariantStock(variantSel)
    : product.stock
  const variantSelectionName = hasVariants && variantComplete
    ? [variantSel.color?.name, variantSel.size?.name].filter(Boolean).join(' / ')
    : ''

  function handleAdd() {
    if (hasVariants && !variantComplete) {
      toast.error('Please select ' + [
        product.variants!.colors?.length && !variantSel.color ? 'a color' : null,
        product.variants!.sizes?.length && !variantSel.size ? 'a size' : null,
      ].filter(Boolean).join(' and '))
      return
    }
    if (effectiveStock === 0) {
      toast.error('This combination is out of stock')
      return
    }
    const variantArg = hasVariants ? {
      color: variantSel.color ? { name: variantSel.color.name, hex: variantSel.color.hex } : undefined,
      size: variantSel.size ? { name: variantSel.size.name } : undefined,
    } : undefined
    addItem({ ...product, price: effectivePrice, stock: effectiveStock }, qty, variantArg)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    toast.success(`${qty} × ${product.name}${variantSelectionName ? ` (${variantSelectionName})` : ''} added to cart`)
  }

  function handleBuyNow() {
    if (hasVariants && !variantComplete) {
      toast.error('Please select your variant options first')
      return
    }
    const variantArg = hasVariants ? {
      color: variantSel.color ? { name: variantSel.color.name, hex: variantSel.color.hex } : undefined,
      size: variantSel.size ? { name: variantSel.size.name } : undefined,
    } : undefined
    addItem({ ...product, price: effectivePrice, stock: effectiveStock }, qty, variantArg)
    openCart()
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Breadcrumb */}
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center hover:text-foreground">
          <HomeIcon size={12} className="mr-1" /> Home
        </button>
        <ChevronRight size={12} />
        <button onClick={() => navigate({ name: 'shop', categorySlug: product.category?.slug })} className="hover:text-foreground">
          {product.category?.name}
        </button>
        <ChevronRight size={12} />
        <span className="truncate font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-6 md:grid-cols-12 md:gap-8 lg:gap-10">
        {/* Gallery */}
        <div className="md:col-span-5 lg:col-span-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="relative aspect-square overflow-hidden bg-muted/20">
              <ProductImage src={product.images[activeImage] ?? product.images[0]} alt={product.name} sizes="(max-width: 768px) 100vw, 40vw" priority />
              {pct > 0 && (
                <Badge className="absolute left-3 top-3 bg-rose-500 text-white hover:bg-rose-500">-{pct}%</Badge>
              )}
              {product.isFeatured && (
                <Badge className="absolute right-3 top-3 bg-amber-500 text-white hover:bg-amber-500">Featured</Badge>
              )}
            </Card>
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setActiveImage(i)}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-md ring-2 transition',
                      i === activeImage ? 'ring-amber-500' : 'ring-transparent hover:ring-amber-200'
                    )}
                  >
                    <ProductImage src={img} alt={`${product.name} ${i + 1}`} sizes="100px" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Trust strip */}
          <Card className="mt-4 hidden gap-2 p-4 md:grid md:grid-cols-2">
            <div className="flex items-center gap-2 text-xs">
              <Truck size={16} className="text-amber-600" />
              <span><b>Free delivery</b> over $99</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <RotateCcw size={16} className="text-amber-600" />
              <span><b>30-day</b> returns</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck size={16} className="text-amber-600" />
              <span><b>2-year</b> warranty</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Package size={16} className="text-amber-600" />
              <span><b>In stock</b> ships today</span>
            </div>
          </Card>
        </div>

        {/* Main info */}
        <div className="md:col-span-7 lg:col-span-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            {product.brand}
          </div>
          <h1 className="mt-1 text-xl font-bold leading-tight sm:text-2xl lg:text-3xl">{product.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const el = document.getElementById('reviews')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex items-center gap-1.5"
            >
              <StarRating rating={product.rating} showValue />
              <span className="text-xs text-blue-600 hover:underline">{product.ratingCount} ratings</span>
            </button>
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 3).map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px] font-normal text-muted-foreground">#{t}</Badge>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap items-end gap-3">
            <Price price={effectivePrice} compareAt={product.compareAt ? product.compareAt + (effectivePrice - product.price) : null} size="xl" showDiscount />
            {pct > 0 && (
              <div className="text-sm font-medium text-rose-700">
                You save {formatCurrency((product.compareAt ?? 0) - product.price)}
              </div>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</div>

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {/* Variants (color/size) */}
          {product.variants && (product.variants.colors?.length || product.variants.sizes?.length) ? (
            <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3">
              <VariantSelector
                variants={product.variants}
                value={variantSel}
                onChange={setVariantSel}
              />
            </div>
          ) : null}

          {/* Stock */}
          <div className="mt-4 text-sm">
            {effectiveStock === 0 ? (
              <span className="font-medium text-rose-600">Currently sold out</span>
            ) : effectiveStock <= 10 ? (
              <span className="font-medium text-orange-600">Only {effectiveStock} left in stock — order soon!</span>
            ) : (
              <span className="font-medium text-emerald-600">In stock</span>
            )}
          </div>

          {/* Quantity + add to cart */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center overflow-hidden rounded-lg border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                <Minus size={14} />
              </Button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => setQty((q) => Math.min(effectiveStock || 99, q + 1))}
                disabled={qty >= (effectiveStock || 99) || (hasVariants && !variantComplete)}
              >
                <Plus size={14} />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              Subtotal: <b className="text-foreground">{formatCurrency(effectivePrice * qty)}</b>
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button
              size="lg"
              className="h-12 bg-amber-400 text-zinc-900 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAdd}
              disabled={soldOut || effectiveStock === 0 || (hasVariants && !variantComplete)}
            >
              {added ? <><Check size={16} className="mr-1.5" /> Added!</> : hasVariants && !variantComplete ? <><ShoppingCart size={16} className="mr-1.5" /> Select options</> : <><ShoppingCart size={16} className="mr-1.5" /> Add to cart</>}
            </Button>
            <Button
              size="lg"
              className="h-12 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleBuyNow}
              disabled={soldOut || effectiveStock === 0 || (hasVariants && !variantComplete)}
            >
              Buy now
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(wishlistHas && 'border-rose-300 text-rose-600')}
              onClick={() => {
                toggleWishlist(product.id)
                toast.success(wishlistHas ? 'Removed from wishlist' : 'Added to wishlist')
              }}
            >
              <Heart size={14} className="mr-1.5" fill={wishlistHas ? 'currentColor' : 'none'} />
              {wishlistHas ? 'In wishlist' : 'Add to wishlist'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(compareHas && 'border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300')}
              onClick={() => {
                if (compareHas) {
                  toggleCompare(product.id)
                  toast.success('Removed from comparison')
                  return
                }
                if (compareIds.length >= MAX_COMPARE) {
                  toast.error(`You can compare up to ${MAX_COMPARE} products`)
                  return
                }
                toggleCompare(product.id)
                toast.success(`Added to comparison (${compareIds.length + 1}/${MAX_COMPARE})`)
              }}
            >
              <GitCompare size={14} className="mr-1.5" />
              {compareHas ? 'In comparison' : 'Compare'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: product.name, text: product.description }).catch(() => {})
                } else {
                  navigator.clipboard?.writeText(window.location.href)
                  toast.success('Link copied to clipboard')
                }
              }}
            >
              <Share2 size={14} className="mr-1.5" /> Share
            </Button>
            <PriceAlertButton product={product} />
          </div>

          {/* Shipping calculator teaser */}
          <Card className="mt-4 bg-amber-50/60 p-3 text-xs">
            <div className="flex items-start gap-2">
              <Truck size={16} className="mt-0.5 text-amber-700" />
              <div>
                <div className="font-semibold text-amber-900">Free express delivery</div>
                <div className="text-amber-800/80">Order in the next <b>4 hours</b> to get it by tomorrow.</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Specs panel */}
        <aside className="md:col-span-12 lg:col-span-3">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Specifications</h3>
            {product.specs ? (
              <dl className="space-y-2">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-border/40 py-1.5 text-xs last:border-0">
                    <dt className="font-medium text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">No specifications available.</p>
            )}
          </Card>

          <Card className="mt-3 bg-gradient-to-br from-violet-50 to-pink-50 p-4">
            <div className="text-xs font-semibold text-violet-900">Need help deciding?</div>
            <p className="mt-1 text-xs text-violet-700">Our 24/7 shopping concierge can help you choose.</p>
            <Button size="sm" variant="outline" className="mt-2 w-full border-violet-300 text-violet-700 hover:bg-violet-100">
              Chat with expert
            </Button>
          </Card>
        </aside>
      </div>

      {/* Frequently bought together */}
      <FrequentlyBoughtTogether product={product} />

      {/* Customers also bought (real co-purchase data) */}
      <CustomersAlsoBought productId={product.id} />

      {/* Reviews */}
      <ReviewsSection productId={product.id} productName={product.name} initialReviews={reviews} ratingAvg={product.rating} ratingCount={product.ratingCount}>
        <ReviewSummary productId={product.id} reviewCount={product.ratingCount} />
      </ReviewsSection>

      {/* Customer Q&A */}
      <ProductQA productId={product.id} />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold sm:text-xl">Customers also viewed</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'shop', categorySlug: product.category?.slug })}>
              See all <ChevronRight size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      <RecentlyViewedStrip excludeId={product.id} />

      {/* Social proof notifications */}
      <SocialProofNotifications productName={product.name} />
    </div>
  )
}

function ReviewsSection({
  productId, productName, initialReviews, ratingAvg, ratingCount, children,
}: {
  productId: string
  productName: string
  initialReviews: Review[]
  ratingAvg: number
  ratingCount: number
  children?: React.ReactNode
}) {
  const { user } = useAuth()
  const { openAuth } = useUI()
  const [reviews, setReviews] = useState(initialReviews)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [imageInput, setImageInput] = useState('')
  const [reviewImages, setReviewImages] = useState<string[]>([])

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length
    return { star, count, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 }
  })

  function addImage() {
    const url = imageInput.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      toast.error('Please enter a valid image URL (starting with http)')
      return
    }
    if (reviewImages.length >= 5) {
      toast.error('Maximum 5 images per review')
      return
    }
    setReviewImages((arr) => [...arr, url])
    setImageInput('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { openAuth('login'); return }
    if (!title.trim() || !comment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetcher<{ review: Review }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId, rating, title: title.trim(), comment: comment.trim(), images: reviewImages }),
      })
      if (res?.review) {
        setReviews((r) => [res.review, ...r])
        setTitle(''); setComment(''); setRating(5); setReviewImages([])
        toast.success('Review submitted — thank you!')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="reviews" className="mt-12 scroll-mt-32">
      <h2 className="mb-4 text-lg font-bold sm:text-xl">Ratings & Reviews</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black">{ratingAvg.toFixed(1)}</div>
            <div>
              <StarRating rating={ratingAvg} size={16} />
              <div className="mt-1 text-xs text-muted-foreground">{ratingCount.toLocaleString()} ratings</div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {dist.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-right">{d.star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-amber-400" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-8 text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Review Summary (injected from parent) */}
        {children && <div className="lg:col-span-3">{children}</div>}

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MessageSquare size={14} /> Write a review
          </h3>
          {user ? (
            <form onSubmit={submit} className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Your rating:</Label>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setRating(s)}>
                      <Star size={20} className={s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="title" className="text-xs">Title</Label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Summarize your experience"
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="comment" className="text-xs">Your review</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder={`What did you think about ${truncate(productName, 40)}?`}
                  maxLength={2000}
                />
              </div>
              {/* Photo URLs (max 5) */}
              <div>
                <Label className="text-xs">Add photos <span className="text-muted-foreground">(optional, up to 5)</span></Label>
                <div className="mt-1 flex gap-1.5">
                  <Input
                    type="url"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }}
                    placeholder="https://example.com/photo.jpg"
                    className="h-9 text-xs"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addImage} disabled={!imageInput.trim() || reviewImages.length >= 5}>
                    <Plus size={13} className="mr-1" /> Add
                  </Button>
                </div>
                {reviewImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {reviewImages.map((img, i) => (
                      <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-md ring-1 ring-border/40">
                        <img src={img} alt={`To upload ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setReviewImages((arr) => arr.filter((_, idx) => idx !== i))}
                          className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-zinc-900/70 text-white opacity-0 transition group-hover:opacity-100"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={submitting || !title.trim() || !comment.trim()}>
                {submitting ? 'Submitting...' : 'Submit review'}
              </Button>
            </form>
          ) : (
            <div className="rounded-md bg-muted/40 p-4 text-center text-sm text-muted-foreground">
              Please <Button variant="link" className="h-auto p-0" onClick={() => openAuth('login')}>sign in</Button> to write a review.
            </div>
          )}

          <Separator className="my-4" />
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">No reviews yet — be the first!</div>
            ) : (
              reviews.map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}

function ReviewItem({ review }: { review: Review }) {
  const [helpful, setHelpful] = useState(review.helpful ?? 0)
  const [voted, setVoted] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState<string | null>(null)
  const images = review.images ?? []

  async function voteHelpful() {
    if (voted) return
    setVoted(true)
    setHelpful((h) => h + 1)
    try {
      await fetcher('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ action: 'helpful', reviewId: review.id }),
      })
    } catch {
      setVoted(false)
      setHelpful((h) => Math.max(0, h - 1))
    }
  }

  return (
    <div className="border-b border-border/40 pb-4 last:border-0">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          {review.author.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            {review.author}
            {review.verified && (
              <Badge variant="outline" className="gap-1 text-[10px] font-normal text-emerald-700">
                <Check size={10} /> Verified purchase
              </Badge>
            )}
          </div>
          <StarRating rating={review.rating} size={12} />
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
      </div>
      <div className="mt-2 text-sm font-medium">{review.title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>

      {/* Review images */}
      {images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setGalleryOpen(img)}
              className="relative h-16 w-16 overflow-hidden rounded-md ring-1 ring-border/40 transition hover:ring-2 hover:ring-amber-400"
            >
              <img src={img} alt={`Review photo ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Helpful vote */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <button
          onClick={voteHelpful}
          className={cn(
            'flex items-center gap-1 rounded-full border px-2.5 py-0.5 transition',
            voted ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'border-border hover:border-amber-300 hover:text-amber-700'
          )}
        >
          <ThumbsUp size={11} /> Helpful {helpful > 0 && <span className="font-semibold">({helpful})</span>}
        </button>
      </div>

      {/* Image lightbox */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setGalleryOpen(null)}
        >
          <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X size={18} />
          </button>
          <img
            src={galleryOpen}
            alt="Review photo enlarged"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  )
}
