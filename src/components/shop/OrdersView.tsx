'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package, Truck, CheckCircle2, Clock, XCircle, ChevronRight, Home as HomeIcon, MapPin, CreditCard,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useView, useAuth, useUI } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { formatDateTime } from '@/lib/format'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { useLiveOrderStatus, formatCountdown } from '@/lib/use-live-order-status'
import type { Order } from '@/lib/types'
import { toast } from 'sonner'

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-zinc-100 text-zinc-700', icon: Clock },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  shipped: { label: 'Shipped', color: 'bg-amber-100 text-amber-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700', icon: XCircle },
}

export function OrdersView() {
  const navigate = useView((s) => s.navigate)
  const { user } = useAuth()
  const { openAuth } = useUI()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all')

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrders([])
      return
    }
    let cancelled = false
    fetcher<{ orders: Order[] }>('/api/orders').then((d) => {
      if (!cancelled) setOrders(d?.orders ?? [])
    })
    return () => { cancelled = true }
  }, [user])

  if (!user) {
    return (
      <CenterPrompt
        icon={<Package size={36} className="text-amber-500" />}
        title="Sign in to see your orders"
        sub="Your full order history and tracking will appear here."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ name: 'home' })}>Back home</Button>
            <Button className="bg-amber-400 text-zinc-900 hover:bg-amber-500" onClick={() => openAuth('login')}>Sign in</Button>
          </>
        }
      />
    )
  }

  const filtered = (orders ?? []).filter((o) => {
    if (filter === 'all') return true
    if (filter === 'active') return ['pending', 'paid', 'shipped'].includes(o.status)
    return o.status === filter
  })

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center hover:text-foreground">
          <HomeIcon size={12} className="mr-1" /> Home
        </button>
        <ChevronRight size={12} />
        <span className="font-medium text-foreground">Your Orders</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Your Orders</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Track, return, or buy again</p>
        </div>
        <div className="flex gap-1 rounded-full border bg-muted/40 p-1 text-xs">
          {(['all', 'active', 'delivered', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 font-medium capitalize transition ${filter === f ? 'bg-white text-amber-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {orders === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Package size={36} className="mx-auto text-muted-foreground" />
          <h3 className="mt-3 text-lg font-semibold">No orders found</h3>
          <p className="text-sm text-muted-foreground">When you place an order, it will appear here.</p>
          <Button className="mt-4 bg-amber-400 text-zinc-900 hover:bg-amber-500" onClick={() => navigate({ name: 'shop' })}>
            Start shopping
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o, idx) => (
            <OrderCard key={o.id} order={o} index={idx} onChanged={() => {
              fetcher<{ orders: Order[] }>('/api/orders').then((d) => setOrders(d?.orders ?? []))
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, index, onChanged }: { order: Order; index: number; onChanged: () => void }) {
  const navigate = useView((s) => s.navigate)
  const formatCurrency = useCurrencyFormatter()
  const { status: liveStatus, stepIndex, nextTransitionIn } = useLiveOrderStatus(order.createdAt, order.status)
  const meta = STATUS_META[liveStatus] ?? STATUS_META.pending
  const Icon = meta.icon
  const canCancel = ['pending', 'paid'].includes(liveStatus)

  async function cancel() {
    try {
      await fetcher('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ orderId: order.id, action: 'cancel' }),
      })
      toast.success('Order cancelled')
      onChanged()
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel')
    }
  }

  const step = stepIndex
  const stepLabels = ['Ordered', 'Paid', 'Shipped', 'Delivered']

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.3) }}>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Order placed</div>
              <div className="font-medium">{formatDateTime(order.createdAt)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Total</div>
              <div className="font-bold">{formatCurrency(order.grandTotal)}</div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase text-muted-foreground">Order #</div>
              <button
                onClick={() => navigate({ name: 'order', orderId: order.id })}
                className="font-mono text-xs text-amber-700 hover:underline dark:text-amber-400"
              >
                {order.orderNumber}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {nextTransitionIn !== null && nextTransitionIn > 0 && (
              <Badge variant="outline" className="gap-1 border-amber-300 text-[10px] text-amber-700 dark:text-amber-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                {liveStatus === 'paid' ? `Ships in ${formatCountdown(nextTransitionIn)}` : `Arrives in ${formatCountdown(nextTransitionIn)}`}
              </Badge>
            )}
            <Badge className={`${meta.color} hover:${meta.color}`}>
              <Icon size={12} className="mr-1" /> {meta.label}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        {liveStatus !== 'cancelled' && (
          <div className="border-b px-4 py-3">
            <div className="flex items-center">
              {stepLabels.map((l, i) => (
                <div key={l} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-bold transition-all ${
                      i < step ? 'bg-emerald-500 border-emerald-500 text-white' :
                      i === step ? 'bg-amber-400 border-amber-500 text-zinc-900 dark:bg-amber-500' :
                      'border-muted text-muted-foreground'
                    }`}>
                      {i < step ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <span className={`text-[10px] ${i <= step ? 'text-amber-700 font-medium dark:text-amber-300' : 'text-muted-foreground'}`}>{l}</span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 rounded transition-colors ${i < step ? 'bg-emerald-500' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
            {liveStatus === 'shipped' && (
              <p className="mt-2 text-center text-xs text-amber-700 dark:text-amber-300">
                <Truck size={12} className="mr-1 inline" />
                {nextTransitionIn !== null ? `Estimated arrival in ${formatCountdown(nextTransitionIn)}` : 'Out for delivery'}
              </p>
            )}
            {liveStatus === 'paid' && (
              <p className="mt-2 text-center text-xs text-blue-700 dark:text-blue-300">
                <Clock size={12} className="mr-1 inline" />
                {nextTransitionIn !== null ? `Preparing your order — ships in ${formatCountdown(nextTransitionIn)}` : 'Preparing'}
              </p>
            )}
            {liveStatus === 'delivered' && (
              <p className="mt-2 text-center text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={12} className="mr-1 inline" />
                Delivered — enjoy your purchase!
              </p>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="space-y-3">
            {order.items.map((i) => (
              <div key={i.id} className="flex gap-3">
                <button onClick={() => navigate({ name: 'product', productId: i.productId })}>
                  <img src={i.image} alt={i.name} className="h-16 w-16 rounded-md object-cover" />
                </button>
                <div className="flex-1 text-sm">
                  <button onClick={() => navigate({ name: 'product', productId: i.productId })} className="font-medium text-left hover:text-amber-700 line-clamp-2">
                    {i.name}
                  </button>
                  <div className="text-[11px] uppercase font-semibold text-amber-700">{i.brand}</div>
                  <div className="text-xs text-muted-foreground">Qty {i.quantity} × {formatCurrency(i.unitPrice)}</div>
                </div>
                <div className="text-sm font-bold">{formatCurrency(i.lineTotal)}</div>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          <div className="grid gap-2 sm:grid-cols-3 text-xs">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <div className="font-semibold">Shipping</div>
                <div className="text-muted-foreground">{order.shippingAddress.fullName}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <div className="font-semibold">Payment</div>
                <div className="text-muted-foreground">{order.paymentMethod}</div>
                <div className="text-emerald-700 font-medium">{order.paymentStatus}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-end justify-end gap-2 sm:justify-end">
              {canCancel && (
                <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50" onClick={cancel}>
                  Cancel order
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate({ name: 'product', productId: order.items[0]?.productId })}>
                Buy again
              </Button>
              <Button size="sm" className="bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500" onClick={() => navigate({ name: 'order', orderId: order.id })}>
                View details <ChevronRight size={12} className="ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function CenterPrompt({
  icon, title, sub, actions,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-50">{icon}</div>
      <h2 className="mt-4 text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
      <div className="mt-4 flex justify-center gap-2">{actions}</div>
    </div>
  )
}
