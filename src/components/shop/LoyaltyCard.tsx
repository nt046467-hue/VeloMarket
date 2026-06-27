'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Gift, Star, TrendingUp, ArrowRight, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth, usePromo } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const POINTS_PER_DOLLAR = 100 // matches /api/loyalty
const TIERS = [
  { name: 'Bronze', min: 0, color: 'from-amber-600 to-orange-700', perk: '1 pt / $1' },
  { name: 'Silver', min: 1000, color: 'from-zinc-400 to-zinc-600', perk: '1.25 pt / $1' },
  { name: 'Gold', min: 5000, color: 'from-amber-300 to-yellow-500', perk: '1.5 pt / $1 · free shipping' },
  { name: 'Platinum', min: 15000, color: 'from-violet-400 to-fuchsia-500', perk: '2 pt / $1 · priority support' },
]

export function LoyaltyCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()
  const [data, setData] = useState<{ points: number; value: number } | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const formatCurrency = useCurrencyFormatter()
  const applyLoyalty = usePromo((s) => s.applyLoyalty)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetcher<{ points: number; value: number }>('/api/loyalty')
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user])

  if (!user) return null

  const points = data?.points ?? user.loyaltyPoints ?? 0
  const valueUsd = data?.value ?? +(points / POINTS_PER_DOLLAR).toFixed(2)

  // Determine tier
  const tier = [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0]
  const nextTier = TIERS.find((t) => t.min > points)
  const progress = nextTier ? ((points - tier.min) / (nextTier.min - tier.min)) * 100 : 100

  async function redeem() {
    if (points < POINTS_PER_DOLLAR) {
      toast.error(`Need at least ${POINTS_PER_DOLLAR} points to redeem`)
      return
    }
    setRedeeming(true)
    try {
      const res = await fetcher<{ code: string; points: number; valueUsd: number; message: string }>('/api/loyalty', {
        method: 'POST',
        body: JSON.stringify({ action: 'redeem' }),
      })
      if (res?.code) {
        // Apply directly to the cart promo system
        applyLoyalty(res.code, res.valueUsd, res.points)
        toast.success(`${res.message}. Discount applied to your cart!`)
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to redeem')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <Card className={cn(
      'relative overflow-hidden bg-gradient-to-br p-5 text-white shadow-lg',
      tier.color
    )}>
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-black/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/80">Velo Rewards</div>
              <div className="text-base font-bold">{tier.name} Member</div>
            </div>
          </div>
          <Badge className="bg-white/20 text-white hover:bg-white/30">
            <Star size={10} className="mr-1 fill-white" /> {points.toLocaleString()} pts
          </Badge>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black">{formatCurrency(valueUsd)}</span>
            <span className="text-xs text-white/80">in rewards</span>
          </div>
          <p className="mt-1 text-xs text-white/90">
            Earn 1 point per $1 spent. Redeem 100 pts = $1 off.
          </p>
        </div>

        {/* Tier progress */}
        {nextTier ? (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] text-white/90">
              <span>Progress to {nextTier.name}</span>
              <span>{(nextTier.min - points).toLocaleString()} pts to go</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-md bg-white/15 px-2 py-1 text-[10px] font-medium backdrop-blur">
            <Check size={10} className="mr-1 inline" /> You&apos;re at the highest tier — enjoy your perks!
          </div>
        )}

        {!compact && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="bg-white text-zinc-900 hover:bg-white/90"
              onClick={redeem}
              disabled={redeeming || points < POINTS_PER_DOLLAR}
            >
              <Gift size={13} className="mr-1" />
              {points >= POINTS_PER_DOLLAR ? `Redeem (${formatCurrency(valueUsd)})` : `Need ${POINTS_PER_DOLLAR - points} more pts`}
            </Button>
            <a className="text-[10px] text-white/80 underline hover:text-white">View perks</a>
          </div>
        )}
      </div>
    </Card>
  )
}

// Smaller badge for header dropdowns etc
export function LoyaltyMini() {
  const { user } = useAuth()
  if (!user) return null
  const points = user.loyaltyPoints ?? 0
  return (
    <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700 dark:text-amber-300">
      <TrendingUp size={10} /> {points.toLocaleString()} pts
    </Badge>
  )
}
