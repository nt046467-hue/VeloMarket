'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellRing, TrendingDown, Trash2, X, Check, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { usePriceAlerts } from '@/lib/store'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { fetcher } from '@/lib/api-client'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/** Compact button used on product detail page */
export function PriceAlertButton({ product }: { product: Product }) {
  const [open, setOpen] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')
  const hasAlert = usePriceAlerts((s) => s.alerts.some((a) => a.productId === product.id))
  const addAlert = usePriceAlerts((s) => s.add)
  const removeAlert = usePriceAlerts((s) => s.remove)

  useEffect(() => {
    // Pre-fill with 10% below current price
    if (open && !targetPrice) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetPrice((product.price * 0.9).toFixed(2))
    }
  }, [open, targetPrice, product.price])

  function saveAlert() {
    const target = parseFloat(targetPrice)
    if (isNaN(target) || target <= 0) {
      toast.error('Please enter a valid price')
      return
    }
    if (target >= product.price) {
      toast.error('Target price must be below current price')
      return
    }
    addAlert({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] ?? '',
      targetPrice: target,
      originalPrice: product.price,
      createdAt: new Date().toISOString(),
    })
    toast.success(`We'll notify you when "${product.name}" drops below your target price`)
    setOpen(false)
  }

  function removeExisting() {
    removeAlert(product.id)
    toast.success('Price alert removed')
  }

  if (hasAlert) {
    return (
      <Button variant="outline" size="sm" className="border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300" onClick={removeExisting}>
        <BellRing size={14} className="mr-1.5" />
        Alert set — click to remove
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Bell size={14} className="mr-1.5" />
        Price alert
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing size={16} className="text-violet-600" />
              Set price alert
            </DialogTitle>
            <DialogDescription>
              We&apos;ll notify you when this product drops to or below your target price.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Card className="flex items-center gap-3 bg-muted/40 p-3">
              <img src={product.images[0]} alt={product.name} className="h-12 w-12 rounded-md object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-500">{product.brand}</div>
                <div className="text-sm font-medium line-clamp-1">{product.name}</div>
                <div className="text-sm font-bold">Currently {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}</div>
              </div>
            </Card>

            <div>
              <Label className="text-xs">Notify me when price drops to</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  { label: '−5%', val: product.price * 0.95 },
                  { label: '−10%', val: product.price * 0.9 },
                  { label: '−15%', val: product.price * 0.85 },
                  { label: '−20%', val: product.price * 0.8 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setTargetPrice(preset.val.toFixed(2))}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] transition',
                      parseFloat(targetPrice).toFixed(2) === preset.val.toFixed(2)
                        ? 'border-violet-400 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                        : 'border-border hover:border-violet-300 hover:text-violet-700'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={saveAlert}>
                <Bell size={13} className="mr-1" /> Create alert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Full list shown in account settings */
export function PriceAlertsList() {
  const alerts = usePriceAlerts((s) => s.alerts)
  const removeAlert = usePriceAlerts((s) => s.remove)
  const clearAlerts = usePriceAlerts((s) => s.clear)
  const formatCurrency = useCurrencyFormatter()
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})

  // Fetch current prices for all alerted products
  useEffect(() => {
    if (alerts.length === 0) return
    let cancelled = false
    Promise.all(
      alerts.map((a) =>
        fetcher<{ product: Product }>(`/api/products?id=${a.productId}`)
          .then((d) => [a.productId, d?.product?.price ?? null] as const)
          .catch(() => [a.productId, null] as const)
      )
    ).then((results) => {
      if (cancelled) return
      const map: Record<string, number> = {}
      results.forEach(([id, price]) => {
        if (price !== null) map[id] = price as number
      })
      setCurrentPrices(map)
    })
    return () => { cancelled = true }
  }, [alerts])

  if (alerts.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
        No price alerts set. Open any product and tap &quot;Price alert&quot; to be notified when it drops.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const current = currentPrices[alert.productId] ?? alert.originalPrice
        const change = current - alert.originalPrice
        const targetMet = current <= alert.targetPrice
        const progressPct = Math.min(100, Math.max(0, ((alert.originalPrice - current) / (alert.originalPrice - alert.targetPrice)) * 100))
        return (
          <Card key={alert.productId} className={cn('flex items-center gap-3 p-3 transition-colors', targetMet && 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20')}>
            <img src={alert.productImage} alt={alert.productName} className="h-12 w-12 rounded-md object-cover" />
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{alert.productName}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground line-through">{formatCurrency(alert.originalPrice)}</span>
                <span className="font-bold">{formatCurrency(current)}</span>
                {change < 0 && (
                  <Badge variant="outline" className="border-emerald-300 text-[10px] text-emerald-700 dark:text-emerald-300">
                    <TrendingDown size={9} className="mr-0.5" /> {formatCurrency(Math.abs(change))}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>Target: {formatCurrency(alert.targetPrice)}</span>
                {!targetMet && (
                  <div className="flex-1 max-w-[100px] h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-violet-500 transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                )}
              </div>
            </div>
            {targetMet ? (
              <Badge className="bg-emerald-500 text-white">
                <Sparkles size={10} className="mr-0.5" /> Target met!
              </Badge>
            ) : null}
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-rose-600" onClick={() => removeAlert(alert.productId)}>
              <Trash2 size={12} />
            </Button>
          </Card>
        )
      })}
      <Button variant="ghost" size="sm" className="text-xs" onClick={clearAlerts}>
        Clear all alerts
      </Button>
    </div>
  )
}
