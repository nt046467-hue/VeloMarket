'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, Product, View, User } from '@/lib/types'

// ---------- Cart Store ----------
type CartVariantSel = {
  color?: { name: string; hex: string }
  size?: { name: string }
}

type CartState = {
  items: CartItem[]
  isOpen: boolean
  addItem: (p: Product, qty?: number, variantSel?: CartVariantSel) => void
  removeItem: (lineKey: string) => void
  updateQuantity: (lineKey: string, qty: number) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  totalItems: () => number
  subtotal: () => number
}

function variantKeyFor(productId: string, variantSel?: { color?: { name: string }; size?: { name: string } }): string {
  if (!variantSel) return productId
  const parts = [productId]
  if (variantSel.color?.name) parts.push(`c:${variantSel.color.name}`)
  if (variantSel.size?.name) parts.push(`s:${variantSel.size.name}`)
  return parts.join('|')
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (p, qty = 1, variantSel) =>
        set((s) => {
          const vKey = variantKeyFor(p.id, variantSel)
          const existing = s.items.find((i) => (i.variantKey ?? i.productId) === vKey)
          if (existing) {
            return {
              items: s.items.map((i) =>
                (i.variantKey ?? i.productId) === vKey
                  ? { ...i, quantity: Math.min(i.quantity + qty, p.stock || 99) }
                  : i
              ),
              isOpen: true,
            }
          }
          return {
            items: [
              ...s.items,
              {
                productId: p.id,
                name: p.name,
                slug: p.slug,
                brand: p.brand,
                price: p.price,
                image: p.images[0] ?? '',
                quantity: Math.min(qty, p.stock || 99),
                stock: p.stock || 99,
                variantSelection: variantSel,
                variantKey: vKey,
              },
            ],
            isOpen: true,
          }
        }),
      removeItem: (lineKey) =>
        set((s) => ({ items: s.items.filter((i) => (i.variantKey ?? i.productId) !== lineKey) })),
      updateQuantity: (lineKey, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            (i.variantKey ?? i.productId) === lineKey
              ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock || 99)) }
              : i
          ),
        })),
      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'zshop-cart', storage: createJSONStorage(() => localStorage) }
  )
)

// ---------- Wishlist Store ----------
type WishlistState = {
  productIds: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
  clear: () => void
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (id) =>
        set((s) => ({
          productIds: s.productIds.includes(id)
            ? s.productIds.filter((p) => p !== id)
            : [...s.productIds, id],
        })),
      has: (id) => get().productIds.includes(id),
      clear: () => set({ productIds: [] }),
    }),
    { name: 'zshop-wishlist', storage: createJSONStorage(() => localStorage) }
  )
)

// ---------- View Store (SPA navigation) ----------
type ViewState = {
  view: View
  history: View[]
  navigate: (v: View) => void
  back: () => void
}

export const useView = create<ViewState>((set) => ({
  view: { name: 'home' },
  history: [],
  navigate: (v) =>
    set((s) => ({ view: v, history: [...s.history, s.view].slice(-30) })),
  back: () =>
    set((s) => {
      if (s.history.length === 0) return { view: { name: 'home' }, history: [] }
      const prev = s.history[s.history.length - 1]
      return { view: prev, history: s.history.slice(0, -1) }
    }),
}))

// ---------- Auth Store ----------
type AuthState = {
  user: User | null
  setUser: (u: User | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  logout: () => set({ user: null }),
}))

// ---------- UI Store ----------
type UIState = {
  authModalOpen: boolean
  authMode: 'login' | 'register'
  openAuth: (mode?: 'login' | 'register') => void
  closeAuth: () => void
  mobileMenuOpen: boolean
  setMobileMenu: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

export const useUI = create<UIState>((set) => ({
  authModalOpen: false,
  authMode: 'login',
  openAuth: (mode = 'login') => set({ authModalOpen: true, authMode: mode }),
  closeAuth: () => set({ authModalOpen: false }),
  mobileMenuOpen: false,
  setMobileMenu: (open) => set({ mobileMenuOpen: open }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
}))

// ---------- Filters Store ----------
type FilterState = {
  categorySlug: string | null
  searchQuery: string
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular'
  minPrice: number
  maxPrice: number
  brands: string[]
  onlyDeals: boolean
  minRating: number
  setCategory: (slug: string | null) => void
  setSearch: (q: string) => void
  setSort: (s: FilterState['sortBy']) => void
  setPriceRange: (min: number, max: number) => void
  toggleBrand: (b: string) => void
  setOnlyDeals: (v: boolean) => void
  setMinRating: (r: number) => void
  resetFilters: () => void
}

export const useFilters = create<FilterState>((set) => ({
  categorySlug: null,
  searchQuery: '',
  sortBy: 'relevance',
  minPrice: 0,
  maxPrice: 5000,
  brands: [],
  onlyDeals: false,
  minRating: 0,
  setCategory: (slug) => set({ categorySlug: slug }),
  setSearch: (q) => set({ searchQuery: q }),
  setSort: (s) => set({ sortBy: s }),
  setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max }),
  toggleBrand: (b) =>
    set((s) => ({
      brands: s.brands.includes(b) ? s.brands.filter((x) => x !== b) : [...s.brands, b],
    })),
  setOnlyDeals: (v) => set({ onlyDeals: v }),
  setMinRating: (r) => set({ minRating: r }),
  resetFilters: () =>
    set({
      categorySlug: null,
      searchQuery: '',
      sortBy: 'relevance',
      minPrice: 0,
      maxPrice: 5000,
      brands: [],
      onlyDeals: false,
      minRating: 0,
    }),
}))

// ---------- Recently Viewed Store ----------
type RecentState = {
  productIds: string[]
  push: (id: string) => void
  clear: () => void
}

export const useRecent = create<RecentState>()(
  persist(
    (set) => ({
      productIds: [],
      push: (id) =>
        set((s) => ({
          productIds: [id, ...s.productIds.filter((p) => p !== id)].slice(0, 12),
        })),
      clear: () => set({ productIds: [] }),
    }),
    { name: 'zshop-recent', storage: createJSONStorage(() => localStorage) }
  )
)

// ---------- Compare Store ----------
type CompareState = {
  productIds: string[]
  isOpen: boolean
  toggle: (id: string) => boolean // returns true if added, false if removed
  has: (id: string) => boolean
  remove: (id: string) => void
  clear: () => void
  openCompare: () => void
  closeCompare: () => void
}

export const MAX_COMPARE = 3

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      productIds: [],
      isOpen: false,
      toggle: (id) => {
        let added = false
        set((s) => {
          if (s.productIds.includes(id)) {
            return { productIds: s.productIds.filter((p) => p !== id) }
          }
          if (s.productIds.length >= MAX_COMPARE) {
            return s // do nothing — caller should handle max limit
          }
          added = true
          return { productIds: [...s.productIds, id] }
        })
        return added
      },
      has: (id) => get().productIds.includes(id),
      remove: (id) => set((s) => ({ productIds: s.productIds.filter((p) => p !== id) })),
      clear: () => set({ productIds: [] }),
      openCompare: () => set({ isOpen: true }),
      closeCompare: () => set({ isOpen: false }),
    }),
    {
      name: 'zshop-compare',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ productIds: s.productIds }) as any,
    }
  )
)

// ---------- Quick View Store ----------
type QuickViewState = {
  productId: string | null
  open: (id: string) => void
  close: () => void
}

export const useQuickView = create<QuickViewState>((set) => ({
  productId: null,
  open: (id) => set({ productId: id }),
  close: () => set({ productId: null }),
}))

// ---------- Promo Code Store (shared between cart drawer & checkout) ----------
export const PROMOS: Record<string, number> = {
  SAVE10: 0.1,
  WELCOME15: 0.15,
  FESTIVE20: 0.2,
  VELOPRIME25: 0.25,
  FREESHIP: 0,
}

type PromoState = {
  code: string | null
  rate: number
  // For fixed-amount-off codes (like loyalty redemption)
  flatAmountUsd: number
  isLoyalty: boolean
  loyaltyPointsUsed: number
  // Gift card
  isGiftCard: boolean
  giftCardBalance: number
  apply: (code: string) => boolean
  applyLoyalty: (code: string, amountUsd: number, pointsUsed: number) => void
  applyGiftCard: (code: string, balance: number) => void
  clear: () => void
}

export const usePromo = create<PromoState>()(
  persist(
    (set) => ({
      code: null,
      rate: 0,
      flatAmountUsd: 0,
      isLoyalty: false,
      loyaltyPointsUsed: 0,
      isGiftCard: false,
      giftCardBalance: 0,
      apply: (code) => {
        const upper = code.trim().toUpperCase()
        if (PROMOS[upper] !== undefined) {
          set({ code: upper, rate: PROMOS[upper], flatAmountUsd: 0, isLoyalty: false, loyaltyPointsUsed: 0, isGiftCard: false, giftCardBalance: 0 })
          return true
        }
        return false
      },
      applyLoyalty: (code, amountUsd, pointsUsed) =>
        set({ code, rate: 0, flatAmountUsd: amountUsd, isLoyalty: true, loyaltyPointsUsed: pointsUsed, isGiftCard: false, giftCardBalance: 0 }),
      applyGiftCard: (code, balance) =>
        set({ code, rate: 0, flatAmountUsd: balance, isLoyalty: false, loyaltyPointsUsed: 0, isGiftCard: true, giftCardBalance: balance }),
      clear: () => set({ code: null, rate: 0, flatAmountUsd: 0, isLoyalty: false, loyaltyPointsUsed: 0, isGiftCard: false, giftCardBalance: 0 }),
    }),
    { name: 'zshop-promo', storage: createJSONStorage(() => localStorage) }
  )
)

// ---------- Currency Store ----------
export type Currency = {
  code: string
  symbol: string
  name: string
  rate: number // multiplier from USD
  locale: string
}

// Static exchange rates relative to USD (sandbox-safe; no live API needed)
export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, locale: 'en-GB' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24, locale: 'zh-CN' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.5, locale: 'ja-JP' },
]

type CurrencyState = {
  code: string
  setCode: (code: string) => void
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set) => ({
      code: 'USD',
      setCode: (code) => set({ code }),
    }),
    { name: 'zshop-currency', storage: createJSONStorage(() => localStorage) }
  )
)

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]
}

// ---------- Price Alert Store (localStorage) ----------
type PriceAlert = {
  productId: string
  productName: string
  productImage: string
  targetPrice: number
  originalPrice: number
  createdAt: string // ISO
}

type PriceAlertState = {
  alerts: PriceAlert[]
  add: (alert: PriceAlert) => void
  remove: (productId: string) => void
  has: (productId: string) => boolean
  clear: () => void
}

export const usePriceAlerts = create<PriceAlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      add: (alert) =>
        set((s) => ({
          alerts: [alert, ...s.alerts.filter((a) => a.productId !== alert.productId)],
        })),
      remove: (productId) =>
        set((s) => ({ alerts: s.alerts.filter((a) => a.productId !== productId) })),
      has: (productId) => get().alerts.some((a) => a.productId === productId),
      clear: () => set({ alerts: [] }),
    }),
    { name: 'zshop-price-alerts', storage: createJSONStorage(() => localStorage) }
  )
)

// ---------- Recent Searches Store (shared) ----------
type RecentSearchStore = {
  recent: string[]
  push: (q: string) => void
  clear: () => void
}

export const useRecentSearches = create<RecentSearchStore>()(
  persist(
    (set) => ({
      recent: [],
      push: (q) =>
        set((s) => ({
          recent: [q, ...s.recent.filter((r) => r !== q)].slice(0, 12),
        })),
      clear: () => set({ recent: [] }),
    }),
    { name: 'zshop-recent-searches', storage: createJSONStorage(() => localStorage) }
  )
)
