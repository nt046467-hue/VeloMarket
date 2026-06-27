'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, Clock, X, CornerDownLeft, ArrowRight, Sparkles } from 'lucide-react'
import { ProductImage } from './ProductImage'
import { Price } from './Price'
import { useView, useFilters, useRecentSearches } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { formatCurrency, discountPercent, truncate } from '@/lib/format'
import type { Product, Category } from '@/lib/types'
import { cn } from '@/lib/utils'

const TRENDING_TERMS = ['headphones', 'laptop', 'air fryer', 'sneakers', 'vitamin c', 'lego']

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  inputRef,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (q: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}) {
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [suggestions, setSuggestions] = useState<{ products: Product[]; categories: Category[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const recent = useRecentSearches((s) => s.recent)
  const pushRecent = useRecentSearches((s) => s.push)
  const clearRecent = useRecentSearches((s) => s.clear)
  const navigate = useView((s) => s.navigate)
  const setCategory = useFilters((s) => s.setCategory)
  const setSearch = useFilters((s) => s.setSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch suggestions as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = value.trim()
    if (q.length < 2) {
      setSuggestions(null)
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      Promise.all([
        fetcher<{ products: Product[] }>(`/api/products?q=${encodeURIComponent(q)}&limit=6`).catch(() => null),
        fetcher<{ categories: Category[] }>(`/api/categories`).catch(() => null),
      ]).then(([p, c]) => {
        const matchedCats = (c?.categories ?? []).filter((cat) =>
          cat.name.toLowerCase().includes(q.toLowerCase()) ||
          cat.slug.includes(q.toLowerCase())
        ).slice(0, 3)
        setSuggestions({
          products: (p?.products ?? []).slice(0, 6),
          categories: matchedCats,
        })
        setLoading(false)
      })
    }, 180)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const open = focused && (value.trim().length > 0 || recent.length > 0 || TRENDING_TERMS.length > 0)
  const q = value.trim()
  const lowerQ = q.toLowerCase()
  const filteredRecent = q
    ? recent.filter((r) => r.toLowerCase().includes(lowerQ))
    : recent
  const filteredTrending = q
    ? TRENDING_TERMS.filter((t) => t.includes(lowerQ))
    : TRENDING_TERMS
  const totalItems = (suggestions?.products.length ?? 0) + filteredRecent.length + filteredTrending.length + (suggestions?.categories.length ?? 0)

  function chooseProduct(p: Product) {
    setFocused(false)
    onChange('')
    onSubmit('')
    pushRecent(p.name.toLowerCase())
    navigate({ name: 'product', productId: p.id })
  }

  function chooseCategory(c: Category) {
    setFocused(false)
    setCategory(c.slug)
    setSearch('')
    onChange('')
    navigate({ name: 'shop', categorySlug: c.slug })
  }

  function chooseTerm(term: string) {
    setFocused(false)
    onChange(term)
    onSubmit(term)
    pushRecent(term.toLowerCase())
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (activeIdx >= 0 && suggestions?.products[activeIdx]) {
      chooseProduct(suggestions.products[activeIdx])
      return
    }
    onSubmit(q)
    if (q) pushRecent(q.toLowerCase())
    setFocused(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setFocused(false)
    }
  }

  let runningIdx = -1
  const idx = () => ++runningIdx

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={submitForm}>
        <div className="flex items-stretch overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-amber-200/60 focus-within:ring-2 focus-within:ring-amber-500 dark:bg-zinc-900 dark:ring-amber-500/20 dark:focus-within:ring-amber-400">
          <input
            ref={inputRef as any}
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); setActiveIdx(-1) }}
            onFocus={() => setFocused(true)}
            onKeyDown={onKeyDown}
            placeholder="Search products, brands and categories..."
            className="h-10 w-full border-0 bg-transparent px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-amber-50 dark:placeholder:text-zinc-500"
            aria-label="Search VeloMarket"
            autoComplete="off"
          />
          <button
            type="submit"
            className="h-10 bg-amber-400 px-3 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400"
            aria-label="Search"
          >
            <Search size={18} className="text-zinc-900" />
          </button>
        </div>
      </form>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-amber-200/50 bg-white p-2 shadow-2xl scrollbar-thin dark:border-amber-500/20 dark:bg-zinc-900"
          >
            {/* Loading indicator */}
            {loading && q.length >= 2 && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                Searching...
              </div>
            )}

            {/* No results */}
            {!loading && q.length >= 2 && totalItems === 0 && (
              <div className="py-6 text-center">
                <Search size={28} className="mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No matches for &quot;<b className="text-foreground">{q}</b>&quot;</p>
                <button
                  onClick={() => chooseTerm(q)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
                >
                  Search all products for &quot;{q}&quot; <ArrowRight size={11} />
                </button>
              </div>
            )}

            {/* Categories */}
            {!loading && suggestions && suggestions.categories.length > 0 && (
              <Section title="Categories">
                {suggestions.categories.map((c) => {
                  const i = idx()
                  return (
                    <Item key={c.id} active={activeIdx === i} onMouseEnter={() => setActiveIdx(i)} onClick={() => chooseCategory(c)}>
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-amber-100 text-xs dark:bg-amber-500/20">📁</span>
                      <span className="flex-1 text-sm font-medium">{c.name}</span>
                      <ArrowRight size={12} className="text-muted-foreground" />
                    </Item>
                  )
                })}
              </Section>
            )}

            {/* Products */}
            {!loading && suggestions && suggestions.products.length > 0 && (
              <Section title="Products">
                {suggestions.products.map((p) => {
                  const i = idx()
                  const pct = discountPercent(p.price, p.compareAt)
                  return (
                    <Item key={p.id} active={activeIdx === i} onMouseEnter={() => setActiveIdx(i)} onClick={() => chooseProduct(p)}>
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted/30">
                        <ProductImage src={p.images[0]} alt={p.name} sizes="40px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-500">{p.brand}</div>
                        <div className="truncate text-sm font-medium">{highlightMatch(p.name, q)}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {pct > 0 && <span className="rounded bg-rose-500 px-1 py-0.5 text-[10px] font-bold text-white">-{pct}%</span>}
                        <span className="text-sm font-bold">{formatCurrency(p.price)}</span>
                      </div>
                    </Item>
                  )
                })}
              </Section>
            )}

            {/* Recent searches */}
            {filteredRecent.length > 0 && (
              <Section title="Recent searches" action={
                <button onClick={clearRecent} className="text-[10px] uppercase text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              }>
                {filteredRecent.map((r) => {
                  const i = idx()
                  return (
                    <Item key={r} active={activeIdx === i} onMouseEnter={() => setActiveIdx(i)} onClick={() => chooseTerm(r)}>
                      <Clock size={14} className="text-muted-foreground" />
                      <span className="flex-1 text-sm">{r}</span>
                      <CornerDownLeft size={11} className="text-muted-foreground/50" />
                    </Item>
                  )
                })}
              </Section>
            )}

            {/* Trending */}
            {filteredTrending.length > 0 && (
              <Section title="Trending searches">
                <div className="flex flex-wrap gap-1.5 p-2">
                  {filteredTrending.map((t) => (
                    <button
                      key={t}
                      onClick={() => chooseTerm(t)}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                    >
                      <TrendingUp size={11} /> {t}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* Footer hint */}
            {!loading && totalItems > 0 && (
              <div className="mt-1 flex items-center justify-between border-t px-2 pt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-muted px-1 py-0.5">↑</kbd>
                  <kbd className="rounded border bg-muted px-1 py-0.5">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-muted px-1 py-0.5">↵</kbd>
                  to select
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({
  title, children, action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-2 py-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h4>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function Item({
  children, active, onClick, onMouseEnter,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
  onMouseEnter?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md p-2 text-left transition',
        active ? 'bg-amber-50 dark:bg-amber-500/15' : 'hover:bg-muted/60'
      )}
    >
      {children}
    </button>
  )
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-200 px-0.5 text-zinc-900 dark:bg-amber-500/40 dark:text-amber-50">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
