'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Gift, CheckCircle2 } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { cn } from '@/lib/utils'

/**
 * Bundle Deals engine (client-side).
 * Detects automatic discounts based on cart contents:
 *   - "Buy 2 Get 1 50% off" — when 3+ items from same brand, cheapest one gets 50% off
 *   - "Spend $200+ save 10%" — automatically applied when subtotal exceeds threshold
 *   - "Mix & Match: 3+ items, 5% off"
 *
 * Returns active offers and a banner component.
 */

export type BundleOffer = {
  id: string
  title: string
  description: string
  discountUsd: number
  achieved: boolean
  progressPct?: number
  remainingHint?: string
}

export function useBundleDeals(): BundleOffer[] {
  const items = useCart((s) => s.items)
  const format = useCurrencyFormatter() // for currency-aware display values
  void format // unused for the math; offers are pre-discount USD

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // Offer 1: Buy 2 Get 1 50% off (same brand)
  const byBrand = new Map<string, { name: string; items: typeof items; minPrice: number; totalQty: number }>()
  items.forEach((i) => {
    const b = byBrand.get(i.brand) ?? { name: i.brand, items: [], minPrice: i.price, totalQty: 0 }
    b.items.push(i)
    b.minPrice = Math.min(b.minPrice, i.price)
    b.totalQty += i.quantity
    byBrand.set(i.brand, b)
  })

  const brandOffers: BundleOffer[] = []
  byBrand.forEach((b) => {
    if (b.totalQty >= 3) {
      const discount = +(b.minPrice * 0.5).toFixed(2)
      brandOffers.push({
        id: `brand-${b.name}`,
        title: `${b.name} bundle`,
        description: `3+ ${b.name} items — cheapest 50% off!`,
        discountUsd: discount,
        achieved: true,
      })
    } else if (b.totalQty > 0) {
      const remaining = 3 - b.totalQty
      brandOffers.push({
        id: `brand-${b.name}`,
        title: `${b.name} bundle`,
        description: `Add ${remaining} more ${b.name} item${remaining === 1 ? '' : 's'} for 50% off cheapest`,
        discountUsd: 0,
        achieved: false,
        progressPct: (b.totalQty / 3) * 100,
        remainingHint: `${remaining} more`,
      })
    }
  })

  // Offer 2: Spend $200+ save 10% on entire order
  const spendThreshold = 200
  const spendAchieved = subtotal >= spendThreshold
  const spendOffer: BundleOffer = {
    id: 'spend-200',
    title: 'Spend more, save more',
    description: spendAchieved
      ? `You unlocked 10% off your entire order!`
      : `Spend ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(spendThreshold - subtotal)} more for 10% off`,
    discountUsd: spendAchieved ? +(subtotal * 0.1).toFixed(2) : 0,
    achieved: spendAchieved,
    progressPct: Math.min(100, (subtotal / spendThreshold) * 100),
    remainingHint: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.max(0, spendThreshold - subtotal)),
  }

  // Offer 3: Mix & Match — 3+ different products, 5% off
  const distinctProducts = items.length
  const mixAchieved = distinctProducts >= 3
  const mixOffer: BundleOffer = {
    id: 'mix-match',
    title: 'Mix & Match 5% off',
    description: mixAchieved
      ? `3+ different products — 5% off your cart!`
      : `Add ${3 - distinctProducts} more different product${3 - distinctProducts === 1 ? '' : 's'} for 5% off`,
    discountUsd: mixAchieved ? +(subtotal * 0.05).toFixed(2) : 0,
    achieved: mixAchieved,
    progressPct: Math.min(100, (distinctProducts / 3) * 100),
    remainingHint: `${Math.max(0, 3 - distinctProducts)} more`,
  }

  // Prioritize achieved offers first, then in-progress ones
  const all = [...brandOffers, spendOffer, mixOffer]
  return all.sort((a, b) => {
    if (a.achieved !== b.achieved) return a.achieved ? -1 : 1
    return (b.discountUsd || (b.progressPct ?? 0)) - (a.discountUsd || (a.progressPct ?? 0))
  })
}

export function totalBundleSavings(offers: BundleOffer[]): number {
  return offers.filter((o) => o.achieved).reduce((sum, o) => sum + o.discountUsd, 0)
}

export function BundleDealsBanner() {
  const offers = useBundleDeals()
  const savings = totalBundleSavings(offers)
  const formatCurrency = useCurrencyFormatter()
  const items = useCart((s) => s.items)

  if (items.length === 0 || offers.length === 0) return null
  const achieved = offers.filter((o) => o.achieved)
  const inProgress = offers.filter((o) => !o.achieved).slice(0, 1) // show at most 1 hint

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {achieved.map((offer) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2 dark:border-emerald-500/30 dark:from-emerald-950/30 dark:to-teal-950/30"
          >
            <div className="flex items-center gap-2 text-xs">
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {offer.title} — you saved {formatCurrency(offer.discountUsd)}!
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300/80 truncate">
                  {offer.description}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {inProgress.map((offer) => (
        <motion.div
          key={offer.id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 dark:border-amber-500/30 dark:from-amber-950/30 dark:to-orange-950/30"
        >
          <div className="flex items-center gap-2 text-xs">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-400 text-zinc-900">
              <Gift size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-amber-900 dark:text-amber-200">{offer.title}</div>
              <div className="text-[10px] text-amber-700 dark:text-amber-300/80">{offer.description}</div>
              {typeof offer.progressPct === 'number' && (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-500/20">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${offer.progressPct}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {savings > 0 && (
        <div className="flex items-center justify-end gap-1 pt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
          <Sparkles size={11} /> Total bundle savings: {formatCurrency(savings)}
        </div>
      )}
    </div>
  )
}
