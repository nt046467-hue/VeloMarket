'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronRight, Home as HomeIcon, Package, Truck, CheckCircle2, Clock, MapPin,
  CreditCard, Printer, RotateCcw, MessageSquare, ShoppingBag,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useView, useAuth, useUI } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { formatDateTime } from '@/lib/format'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { useLiveOrderStatus, formatCountdown } from '@/lib/use-live-order-status'
import { InvoiceDownload } from './InvoiceDownload'
import type { Order } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-amber-100 text-amber-800',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

export function OrderDetailView({ orderId }: { orderId: string }) {
  const navigate = useView((s) => s.navigate)
  const { user } = useAuth()
  const { openAuth } = useUI()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    let cancelled = false
    fetcher<{ orders: Order[] }>('/api/orders')
      .then((d) => {
        if (cancelled) return
        const found = (d?.orders ?? []).find((o) => o.id === orderId)
        setOrder(found ?? null)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [orderId])

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Package size={36} className="mx-auto text-amber-500" />
        <h2 className="mt-4 text-2xl font-bold">Sign in to view this order</h2>
        <Button className="mt-4 bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500" onClick={() => openAuth('login')}>Sign in</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
        <Skeleton className="mt-3 h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Order not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t find this order. It may have been removed.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate({ name: 'orders' })}>Back to orders</Button>
      </div>
    )
  }

  return <OrderDetailContent order={order} />
}

function OrderDetailContent({ order }: { order: Order }) {
  const navigate = useView((s) => s.navigate)
  const formatCurrency = useCurrencyFormatter()
  const { status, stepTimestamps, nextTransitionIn } = useLiveOrderStatus(order.createdAt, order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center hover:text-foreground">
          <HomeIcon size={12} className="mr-1" /> Home
        </button>
        <ChevronRight size={12} />
        <button onClick={() => navigate({ name: 'orders' })} className="hover:text-foreground">Orders</button>
        <ChevronRight size={12} />
        <span className="truncate font-mono text-foreground">{order.orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">Order details</h1>
            <Badge className={cn('hover:opacity-90', STATUS_COLOR[status])}>{status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Placed on {formatDateTime(order.createdAt)} · <span className="font-mono">{order.orderNumber}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <InvoiceDownload order={order} />
          <Button variant="outline" size="sm" onClick={() => navigate({ name: 'orders' })}>
            <ChevronRight size={13} className="mr-1 rotate-180" /> All orders
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Tracking timeline */}
          {!isCancelled ? (
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Truck size={16} className="text-amber-600" /> Tracking
                </h2>
                {nextTransitionIn !== null && nextTransitionIn > 0 && (
                  <Badge variant="outline" className="gap-1 border-amber-300 text-[10px] text-amber-700 dark:text-amber-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    {status === 'paid' ? `Ships in ${formatCountdown(nextTransitionIn)}` : `Arrives in ${formatCountdown(nextTransitionIn)}`}
                  </Badge>
                )}
              </div>
              <Timeline stepTimestamps={stepTimestamps} />
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs dark:bg-amber-500/10">
                <p className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                  <MessageSquare size={12} /> Updates in real time
                </p>
                <p className="mt-0.5 text-amber-700 dark:text-amber-400/80">
                  Tracking info updates automatically as your order progresses through delivery.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="border-rose-200 bg-rose-50 p-5 dark:border-rose-500/30 dark:bg-rose-900/20">
              <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Order cancelled</h2>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80">This order was cancelled. Any charges will be refunded within 3-5 business days.</p>
            </Card>
          )}

          {/* Items */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Package size={16} className="text-amber-600" /> Items in this order ({order.items.length})
              </h2>
              <Button size="sm" variant="outline" onClick={() => {
                order.items.forEach(() => {})
                navigate({ name: 'shop' })
                toast.info('Browse more products')
              }}>
                <ShoppingBag size={12} className="mr-1" /> Buy again
              </Button>
            </div>
            <div className="space-y-3">
              {order.items.map((i) => (
                <div key={i.id} className="flex gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <button onClick={() => navigate({ name: 'product', productId: i.productId })} className="shrink-0">
                    <img src={i.image} alt={i.name} className="h-20 w-20 rounded-lg object-cover" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase font-semibold text-amber-700 dark:text-amber-500">{i.brand}</div>
                    <button
                      onClick={() => navigate({ name: 'product', productId: i.productId })}
                      className="block text-left text-sm font-medium hover:text-amber-700 dark:hover:text-amber-400 line-clamp-2"
                    >
                      {i.name}
                    </button>
                    <div className="mt-1 text-xs text-muted-foreground">Qty: {i.quantity} × {formatCurrency(i.unitPrice)}</div>
                    {status === 'delivered' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1 h-7 px-2 text-[11px]"
                        onClick={() => navigate({ name: 'product', productId: i.productId })}
                      >
                        <RotateCcw size={11} className="mr-1" /> Return item
                      </Button>
                    )}
                  </div>
                  <div className="text-sm font-bold">{formatCurrency(i.lineTotal)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Summary */}
          <Card className="overflow-hidden">
            <div className="border-b bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 dark:from-amber-500/10 dark:to-orange-500/10">
              <h3 className="text-sm font-semibold">Payment summary</h3>
            </div>
            <div className="space-y-1.5 p-4 text-sm">
              <Row label={`Items (${order.items.length})`} value={formatCurrency(order.itemsTotal)} />
              {order.discountTotal > 0 && (
                <Row label="Discounts" value={`-${formatCurrency(order.discountTotal)}`} className="text-emerald-700 dark:text-emerald-300" />
              )}
              <Row label="Shipping" value={order.shippingTotal === 0 ? 'FREE' : formatCurrency(order.shippingTotal)} />
              <Row label="Tax" value={formatCurrency(order.taxTotal)} />
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </Card>

          {/* Payment method */}
          <Card className="p-4">
            <div className="flex items-start gap-2.5">
              <CreditCard size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="text-xs">
                <div className="font-semibold">Payment method</div>
                <div className="text-muted-foreground">{order.paymentMethod}</div>
                <Badge variant="outline" className="mt-1 border-emerald-300 text-[10px] text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={9} className="mr-0.5" /> {order.paymentStatus}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Shipping address */}
          <Card className="p-4">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="text-xs">
                <div className="font-semibold">Shipping address</div>
                <div className="mt-0.5 text-muted-foreground">
                  <div className="font-medium text-foreground">{order.shippingAddress.fullName}</div>
                  <div>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</div>
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
                  <div>{order.shippingAddress.country}</div>
                  <div className="mt-1">📞 {order.shippingAddress.phone}</div>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Timeline({ stepTimestamps }: {
  stepTimestamps: { label: string; reachedAt: Date | null; status: string }[]
}) {
  const statuses = stepTimestamps.filter((s) => s.label !== 'Order placed') // collapse paid into ordered
  return (
    <div className="relative pl-4">
      <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-border" />
      {statuses.map((s, i) => {
        const reached = s.reachedAt !== null
        const isCurrent = reached && (i === statuses.length - 1 || statuses[i + 1].reachedAt === null)
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative pb-4 last:pb-0"
          >
            <div className={cn(
              'absolute -left-4 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full ring-4 ring-background',
              reached ? (isCurrent ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-muted-foreground/30'
            )}>
              {reached && !isCurrent && <CheckCircle2 size={10} className="text-white" />}
              {isCurrent && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-200" />}
            </div>
            <div className={cn('text-sm font-medium', !reached && 'text-muted-foreground')}>
              {s.label}
              {isCurrent && (
                <Badge variant="outline" className="ml-2 border-amber-300 text-[9px] text-amber-700 dark:text-amber-300">
                  Current
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {reached ? formatDateTime(s.reachedAt!) : 'Pending'}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function Row({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
