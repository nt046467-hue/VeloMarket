'use client'

import Link from 'next/link'
import {
  ShoppingCart, Heart, User, Menu, Package, LogOut, ChevronDown,
  Sparkles, MapPin, X, ShieldCheck, Truck, Tag, GitCompare, Search,
  Smartphone, Laptop, Headphones, Home, Shirt, BookOpen, Dumbbell,
  Gamepad2, ShoppingBasket,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCart, useWishlist, useAuth, useUI, useView, useFilters, useCompare } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ThemeToggle } from './ThemeToggle'
import { SearchAutocomplete } from './SearchAutocomplete'
import { CurrencySwitcher } from './CurrencySwitcher'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { fetcher } from '@/lib/api-client'

const FALLBACK_CATS = [
  { name: 'Electronics', slug: 'electronics', icon: 'Smartphone' },
  { name: 'Computers', slug: 'computers', icon: 'Laptop' },
  { name: 'Audio', slug: 'audio', icon: 'Headphones' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'Home' },
  { name: 'Fashion', slug: 'fashion', icon: 'Shirt' },
  { name: 'Books', slug: 'books', icon: 'BookOpen' },
  { name: 'Sports', slug: 'sports', icon: 'Dumbbell' },
  { name: 'Beauty', slug: 'beauty', icon: 'Sparkles' },
  { name: 'Toys & Games', slug: 'toys', icon: 'Gamepad2' },
  { name: 'Grocery', slug: 'grocery', icon: 'ShoppingBasket' },
]

const ICONS: Record<string, any> = {
  Smartphone, Laptop, Headphones, Home, Shirt, BookOpen, Dumbbell,
  Sparkles, Gamepad2, ShoppingBasket, Tag, Truck, ShieldCheck,
}

export function Header() {
  const totalItems = useCart((s) => s.items.reduce((a, i) => a + i.quantity, 0))
  const openCart = useCart((s) => s.openCart)
  const wishlistCount = useWishlist((s) => s.productIds.length)
  const { user, logout } = useAuth()
  const { openAuth } = useUI()
  const navigate = useView((s) => s.navigate)
  const setSearch = useFilters((s) => s.setSearch)
  const setCategory = useFilters((s) => s.setCategory)
  const searchQuery = useFilters((s) => s.searchQuery)
  const compareCount = useCompare((s) => s.productIds.length)

  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cats, setCats] = useState(FALLBACK_CATS)

  useEffect(() => { setLocalSearch(searchQuery) }, [searchQuery])

  useEffect(() => {
    fetcher<{ categories: typeof FALLBACK_CATS }>('/api/categories')
      .then((d) => d?.categories?.length && setCats(d.categories))
      .catch(() => {})
  }, [])

  function submitSearch(q: string) {
    const query = q ?? localSearch.trim()
    setLocalSearch(query)
    setSearch(query)
    setCategory(null) // clear category filter when searching
    navigate({ name: 'shop', query })
  }

  // Kept for compat — also used by mobile search button if needed
  function submitSearchInline(q: string) {
    submitSearch(q)
  }

  function goCategory(slug: string | null) {
    setCategory(slug)
    setSearch('')
    setLocalSearch('')
    navigate({ name: 'shop', categorySlug: slug || undefined })
  }

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top promo strip */}
      <div className="bg-zinc-900 text-zinc-100 text-[11px] sm:text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-1 sm:px-6">
          <div className="flex items-center gap-1.5">
            <Truck size={12} className="text-amber-400" />
            <span className="hidden sm:inline">Free shipping on orders over $99</span>
            <span className="sm:hidden">Free shipping $99+</span>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-400" />Secure payment</span>
            <span className="flex items-center gap-1"><Tag size={12} className="text-amber-400" />Use code <b className="text-amber-300">WELCOME15</b> for 15% off</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span>Ship to: <b className="text-white">US</b></span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-zinc-900 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-zinc-900 hover:bg-amber-300/40">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-white">
              <SheetHeader>
                <SheetTitle className="text-left">Browse VeloMarket</SheetTitle>
              </SheetHeader>
              <ScrollArea className="mt-4 h-[calc(100vh-7rem)] pr-3">
                <div className="space-y-1">
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-amber-50 hover:text-amber-700"
                    onClick={() => { navigate({ name: 'home' }); setMobileMenuOpen(false) }}
                  >
                    <Sparkles size={16} /> Home
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-amber-50 hover:text-amber-700"
                    onClick={() => { goCategory(null); setMobileMenuOpen(false) }}
                  >
                    <Tag size={16} /> All products
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-amber-50 hover:text-amber-700"
                    onClick={() => { navigate({ name: 'deals' }); setMobileMenuOpen(false) }}
                  >
                    <Sparkles size={16} /> Today&apos;s Deals
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-amber-50 hover:text-amber-700"
                    onClick={() => { navigate({ name: 'compare' }); setMobileMenuOpen(false) }}
                  >
                    <GitCompare size={16} /> Compare ({compareCount})
                  </button>
                  <div className="my-2 border-t" />
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </div>
                  {cats.map((c) => {
                    const Icon = ICONS[c.icon || ''] ?? Tag
                    return (
                      <button
                        key={c.slug}
                        onClick={() => { goCategory(c.slug); setMobileMenuOpen(false) }}
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm hover:bg-amber-50 hover:text-amber-700"
                      >
                        <Icon size={16} className="text-amber-600" />
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <button
            onClick={() => navigate({ name: 'home' })}
            className="flex shrink-0 items-center gap-1.5 transition-transform hover:scale-[1.02]"
            aria-label="VeloMarket home"
          >
            <img src="/logo.svg" alt="VeloMarket Logo" className="h-9 w-auto dark:invert" />
          </button>

          {/* Deliver to (desktop) */}
          <div className="hidden lg:flex items-center gap-1 rounded-md px-2 py-1 text-zinc-900 hover:bg-amber-300/40 cursor-default dark:text-amber-100 dark:hover:bg-amber-500/20">
            <MapPin size={16} />
            <div className="leading-tight">
              <div className="text-[10px] text-zinc-700 dark:text-amber-200/70">Deliver to</div>
              <div className="text-xs font-semibold">United States</div>
            </div>
          </div>

          {/* Currency switcher (desktop) */}
          <div className="hidden md:block">
            <CurrencySwitcher />
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <SearchAutocomplete
              value={localSearch}
              onChange={setLocalSearch}
              onSubmit={submitSearchInline}
            />
          </div>

          {/* Account */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex flex-col items-start rounded-md px-2 py-1 text-zinc-900 hover:bg-amber-300/40">
                <span className="text-[10px] leading-none">
                  Hello, {user ? user.name.split(' ')[0] : 'Sign in'}
                </span>
                <span className="flex items-center gap-0.5 text-xs font-semibold">
                  Account <ChevronDown size={12} />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Signed in as</span>
                      <span className="text-sm font-semibold">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ name: 'orders' })}>
                    <Package size={14} className="mr-2" /> Your Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ name: 'wishlist' })}>
                    <Heart size={14} className="mr-2" /> Your Wishlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ name: 'recent-searches' })}>
                    <Search size={14} className="mr-2" /> Recent Searches
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ name: 'account' })}>
                    <User size={14} className="mr-2" /> Account Settings
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate({ name: 'admin' })} className="text-amber-700 focus:text-amber-700 dark:text-amber-400">
                      <ShieldCheck size={14} className="mr-2" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-rose-600 focus:text-rose-700"
                    onClick={() => { logout(); navigate({ name: 'home' }) }}
                  >
                    <LogOut size={14} className="mr-2" /> Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => openAuth('login')}>
                    <User size={14} className="mr-2" /> Sign in
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openAuth('register')}>
                    <User size={14} className="mr-2" /> Create account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ name: 'orders' })}>
                    <Package size={14} className="mr-2" /> Your Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ name: 'wishlist' })}>
                    <Heart size={14} className="mr-2" /> Your Wishlist
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Compare */}
          <button
            onClick={() => navigate({ name: 'compare' })}
            className="relative hidden sm:grid h-10 w-10 place-items-center rounded-md text-zinc-900 hover:bg-amber-300/40 dark:text-amber-100 dark:hover:bg-amber-500/20"
            aria-label={`Compare ${compareCount} products`}
          >
            <GitCompare size={20} />
            {compareCount > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
                {compareCount}
              </span>
            )}
          </button>

          {/* Wishlist */}
          <button
            onClick={() => user ? navigate({ name: 'wishlist' }) : openAuth('login')}
            className="relative hidden sm:grid h-10 w-10 place-items-center rounded-md text-zinc-900 hover:bg-amber-300/40 dark:text-amber-100 dark:hover:bg-amber-500/20"
            aria-label="Wishlist"
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-1.5 rounded-md px-2 py-1 text-zinc-900 hover:bg-amber-300/40 dark:text-amber-100 dark:hover:bg-amber-500/20"
            aria-label={`Cart with ${totalItems} items`}
          >
            <div className="relative">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow"
                >
                  {totalItems}
                </motion.span>
              )}
            </div>
            <span className="hidden text-xs font-semibold sm:block">Cart</span>
          </button>
        </div>

        {/* Category nav (desktop) */}
        <div className="border-t border-amber-300/40 bg-amber-500/95">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-1.5 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => navigate({ name: 'deals' })}
              className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-zinc-900 hover:bg-amber-300/50"
            >
              <Sparkles size={12} /> Today&apos;s Deals
            </button>
            <button
              onClick={() => goCategory(null)}
              className={cn(
                'shrink-0 rounded px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-amber-300/50',
                !useFilters.getState().categorySlug && useView.getState().view.name === 'shop' && 'font-bold'
              )}
            >
              All
            </button>
            {cats.map((c) => (
              <button
                key={c.slug}
                onClick={() => goCategory(c.slug)}
                className="shrink-0 rounded px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-amber-300/50"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
