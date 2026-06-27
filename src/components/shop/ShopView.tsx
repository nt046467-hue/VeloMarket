'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X, Star, Check, Home } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { ProductCard, ProductCardSkeleton } from './ProductCard'
import { useFilters, useView } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import type { Product, Category } from '@/lib/types'

const SORTS = [
  { value: 'relevance', label: 'Featured first' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export function ShopView({ initialCategorySlug, initialQuery }: { initialCategorySlug?: string; initialQuery?: string }) {
  const filters = useFilters()
  const navigate = useView((s) => s.navigate)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  // Sync incoming initial state. Only re-run when the actual initial values change.
  const setCategory = useFilters((s) => s.setCategory)
  const setSearch = useFilters((s) => s.setSearch)
  useEffect(() => {
    if (initialCategorySlug !== undefined) setCategory(initialCategorySlug)
    if (initialQuery !== undefined) setSearch(initialQuery)
  }, [initialCategorySlug, initialQuery, setCategory, setSearch])

  // Load categories once
  useEffect(() => {
    fetcher<{ categories: Category[] }>('/api/categories').then((d) => setCategories(d?.categories ?? []))
  }, [])

  // Build query & fetch products on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(null)
    const params = new URLSearchParams()
    if (filters.categorySlug) params.set('category', filters.categorySlug)
    if (filters.searchQuery) params.set('q', filters.searchQuery)
    if (filters.sortBy) params.set('sort', filters.sortBy)
    params.set('minPrice', String(filters.minPrice))
    params.set('maxPrice', String(filters.maxPrice))
    params.set('minRating', String(filters.minRating))
    if (filters.brands.length) filters.brands.forEach((b) => params.append('brand', b))
    if (filters.onlyDeals) params.set('onlyDeals', 'true')

    let cancelled = false
    fetcher<{ products: Product[]; total: number; brands: string[] }>(`/api/products?${params.toString()}`)
      .then((d) => {
        if (cancelled) return
        setProducts(d?.products ?? [])
        setTotalCount(d?.total ?? 0)
        if (d?.brands?.length) setBrands(d.brands)
      })
      .catch(() => !cancelled && setProducts([]))
    return () => { cancelled = true }
  }, [filters.categorySlug, filters.searchQuery, filters.sortBy, filters.minPrice, filters.maxPrice, filters.minRating, filters.brands, filters.onlyDeals])

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === filters.categorySlug),
    [categories, filters.categorySlug]
  )

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Breadcrumb */}
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center hover:text-foreground">
          <Home size={12} className="mr-1" /> Home
        </button>
        <span>/</span>
        {filters.categorySlug ? (
          <>
            <button onClick={() => { filters.setCategory(null); navigate({ name: 'shop' }) }} className="hover:text-foreground">Shop</button>
            <span>/</span>
            <span className="font-medium text-foreground">{activeCategory?.name ?? 'Category'}</span>
          </>
        ) : (
          <span className="font-medium text-foreground">
            {filters.searchQuery ? `Results for "${filters.searchQuery}"` : 'All products'}
          </span>
        )}
      </nav>

      {/* Title + sort */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">
            {activeCategory?.name ?? (filters.searchQuery ? 'Search results' : 'All products')}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {products?.length ?? '...'}{totalCount > 0 ? ` of ${totalCount}` : ''} products
            {activeCategory?.description && <span className="ml-1 hidden sm:inline">· {activeCategory.description}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile filter button */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal size={14} className="mr-1" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto bg-white">
              <SheetHeader>
                <SheetTitle className="text-left">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4 pb-10">
                <FilterPanel brands={brands} categories={categories} />
              </div>
            </SheetContent>
          </Sheet>
          <Select value={filters.sortBy} onValueChange={(v) => filters.setSort(v as any)}>
            <SelectTrigger className="h-9 w-[180px] sm:w-[220px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter chips */}
      {(filters.brands.length > 0 || filters.onlyDeals || filters.minRating > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {filters.onlyDeals && (
            <Chip onClear={() => filters.setOnlyDeals(false)}>On sale</Chip>
          )}
          {filters.minRating > 0 && (
            <Chip onClear={() => filters.setMinRating(0)}>{filters.minRating}★ & up</Chip>
          )}
          {filters.brands.map((b) => (
            <Chip key={b} onClear={() => filters.toggleBrand(b)}>{b}</Chip>
          ))}
          <Button variant="ghost" size="sm" onClick={() => filters.resetFilters()} className="h-7 text-xs">
            Clear all
          </Button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar filter (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-36 space-y-4">
            <FilterPanel brands={brands} categories={categories} />
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {products === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
                <SlidersHorizontal className="text-muted-foreground" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No products found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search.</p>
              </div>
              <Button variant="outline" onClick={() => filters.resetFilters()}>Reset filters</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <Badge variant="outline" className="gap-1 rounded-full border-amber-300 bg-amber-50 py-1 pl-2.5 pr-1 text-amber-800">
      {children}
      <button onClick={onClear} className="ml-0.5 rounded-full p-0.5 hover:bg-amber-200/50" aria-label="Remove">
        <X size={10} />
      </button>
    </Badge>
  )
}

function FilterPanel({ brands, categories }: { brands: string[]; categories: Category[] }) {
  const filters = useFilters()
  const navigate = useView((s) => s.navigate)
  const [priceRange, setPriceRange] = useState<[number, number]>([filters.minPrice, filters.maxPrice])

  // Sync local slider state when filters reset/changed elsewhere
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPriceRange([filters.minPrice, filters.maxPrice])
  }, [filters.minPrice, filters.maxPrice])

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Category</h3>
          {filters.categorySlug && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { filters.setCategory(null); navigate({ name: 'shop' }) }}>
              Clear
            </Button>
          )}
        </div>
        <div className="space-y-1">
          <button
            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${!filters.categorySlug ? 'bg-amber-50 font-medium text-amber-800' : 'hover:bg-muted'}`}
            onClick={() => { filters.setCategory(null); navigate({ name: 'shop' }) }}
          >
            All categories
            {!filters.categorySlug && <Check size={14} />}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${filters.categorySlug === c.slug ? 'bg-amber-50 font-medium text-amber-800' : 'hover:bg-muted'}`}
              onClick={() => { filters.setCategory(c.slug); navigate({ name: 'shop', categorySlug: c.slug }) }}
            >
              {c.name}
              {filters.categorySlug === c.slug && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Price range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            min={0}
            max={3000}
            step={50}
            onValueChange={(v) => setPriceRange(v as [number, number])}
            onValueCommit={(v) => filters.setPriceRange(v[0], v[1])}
            className="my-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}{priceRange[1] >= 3000 ? '+' : ''}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Rating</h3>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${filters.minRating === r ? 'bg-amber-50 font-medium' : 'hover:bg-muted'}`}
              onClick={() => filters.setMinRating(filters.minRating === r ? 0 : r)}
            >
              <span className="flex">{Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} className={i < r ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground'} />
              ))}</span>
              <span className="text-xs text-muted-foreground">& up</span>
              {filters.minRating === r && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">On sale</h3>
        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
          <Checkbox checked={filters.onlyDeals} onCheckedChange={(v) => filters.setOnlyDeals(v === true)} />
          Show only deals
        </label>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Brands</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {brands.map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <Checkbox
                  checked={filters.brands.includes(b)}
                  onCheckedChange={() => filters.toggleBrand(b)}
                />
                <span className="truncate">{b}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
