'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gift, Copy, Check, Plus, Sparkles, Wallet, Clock, ChevronRight, Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { useAuth, usePromo } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const PRESET_AMOUNTS = [25, 50, 100, 200, 500]

type GiftCardData = {
  id: string
  code: string
  amount: number
  balance: number
  status: string
  recipientEmail: string | null
  message: string | null
  createdAt: string
  expiresAt: string | null
  transactions: Array<{ id: string; amount: number; orderId: string | null; createdAt: string }>
}

export function GiftCardManager() {
  const { user } = useAuth()
  const [cards, setCards] = useState<GiftCardData[] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [amount, setAmount] = useState(50)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const formatCurrency = useCurrencyFormatter()

  const load = useCallback(() => {
    setCards(null)
    fetcher<{ cards: GiftCardData[] }>('/api/gift-cards')
      .then((d) => setCards(d?.cards ?? []))
      .catch(() => setCards([]))
  }, [])

  useEffect(() => { load() }, [load])

  async function purchase() {
    if (!user) return
    setPurchasing(true)
    try {
      const res = await fetcher<{ card: GiftCardData }>('/api/gift-cards', {
        method: 'POST',
        body: JSON.stringify({
          action: 'purchase',
          amount,
          recipientEmail: recipientEmail || undefined,
          message: message || undefined,
        }),
      })
      if (res?.card) {
        toast.success(`Gift card purchased! Code: ${res.card.code}`)
        setDialogOpen(false)
        setRecipientEmail('')
        setMessage('')
        load()
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to purchase')
    } finally {
      setPurchasing(false)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success('Code copied to clipboard')
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Gift size={14} className="text-violet-600" /> My Gift Cards
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {cards?.length ?? '...'} card{(cards?.length ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
        <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setDialogOpen(true)}>
          <Plus size={13} className="mr-1" /> Buy gift card
        </Button>
      </div>
      <Separator className="mb-3" />

      {cards === null ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          <Gift size={20} className="mx-auto mb-1 text-muted-foreground/60" />
          No gift cards yet. Purchase one to gift to friends or use yourself!
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card className={cn(
                'relative overflow-hidden p-3',
                c.status === 'active' && c.balance > 0
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white'
                  : 'bg-muted/40 opacity-70'
              )}>
                {c.status === 'active' && (
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                )}
                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Gift size={14} />
                      <span className="font-mono text-sm font-bold tracking-wider">{c.code}</span>
                      <button
                        onClick={() => copyCode(c.code)}
                        className="ml-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/20 hover:bg-white/30"
                        aria-label="Copy code"
                      >
                        {copiedCode === c.code ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-black">{formatCurrency(c.balance)}</span>
                      <span className="text-[10px] opacity-80">balance</span>
                    </div>
                    <div className="text-[10px] opacity-70">
                      Original: {formatCurrency(c.amount)}
                      {c.recipientEmail && ` · For: ${c.recipientEmail}`}
                    </div>
                    {c.expiresAt && (
                      <div className="mt-0.5 flex items-center gap-0.5 text-[9px] opacity-60">
                        <Clock size={9} /> Expires {formatDate(c.expiresAt)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {c.status === 'active' && c.balance > 0 ? (
                      <Badge className="bg-white/20 text-white">Active</Badge>
                    ) : c.status === 'redeemed' ? (
                      <Badge variant="outline" className="border-white/30 text-white/70">Redeemed</Badge>
                    ) : (
                      <Badge variant="outline">{c.status}</Badge>
                    )}
                    {c.balance < c.amount && c.balance > 0 && (
                      <span className="text-[9px] opacity-70">{formatCurrency(c.amount - c.balance)} used</span>
                    )}
                  </div>
                </div>
                {c.message && (
                  <div className="relative mt-2 border-t border-white/20 pt-2 text-[10px] italic opacity-80">
                    "{c.message}"
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Purchase dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift size={18} className="text-violet-600" /> Purchase a Gift Card
            </DialogTitle>
            <DialogDescription>Perfect for birthdays, holidays, or just because. Redeemable store-wide.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Select amount</Label>
              <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={cn(
                      'rounded-lg border-2 py-2 text-sm font-bold transition',
                      amount === amt
                        ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                        : 'border-border hover:border-violet-300'
                    )}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Recipient email <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="friend@example.com"
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Personal message <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Happy birthday! Enjoy shopping at VeloMarket 🎁"
                maxLength={300}
                className="mt-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-amber-50 p-2 text-[10px] text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <Sparkles size={11} className="shrink-0" />
              This is a demo — no payment required. Card is generated instantly and active immediately.
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={purchase} disabled={purchasing} className="bg-violet-600 hover:bg-violet-700 text-white">
                {purchasing ? <><Loader2 size={13} className="mr-1 animate-spin" /> Creating...</> : <>Purchase ${amount}</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Compact widget for the checkout/cart drawer to apply gift card
export function GiftCardRedeemer() {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const applyGiftCard = usePromo((s) => s.applyGiftCard)
  const formatCurrency = useCurrencyFormatter()

  async function check() {
    if (!code.trim()) return
    setChecking(true)
    try {
      const res = await fetcher<{ card: { code: string; balance: number }; message: string }>('/api/gift-cards', {
        method: 'POST',
        body: JSON.stringify({ action: 'redeem', code: code.trim() }),
      })
      if (res?.card) {
        applyGiftCard(res.card.code, res.card.balance)
        toast.success(`Gift card applied: ${formatCurrency(res.card.balance)} available`)
        setCode('')
      }
    } catch (e: any) {
      toast.error(e.message || 'Invalid gift card')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex gap-1.5">
      <div className="relative flex-1">
        <Gift size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-violet-500" />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); check() } }}
          placeholder="Gift card code"
          className="h-9 pl-8 text-xs font-mono"
        />
      </div>
      <Button size="sm" variant="outline" onClick={check} disabled={!code.trim() || checking}>
        {checking ? <Loader2 size={13} className="animate-spin" /> : <Wallet size={13} />}
      </Button>
    </div>
  )
}
