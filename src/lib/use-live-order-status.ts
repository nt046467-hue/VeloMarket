'use client'

import { useEffect, useState } from 'react'

/**
 * Simulates live order status progression for the demo.
 * Real e-commerce sites update via server cron + shipping webhooks.
 * For this demo, we compute the displayed status from elapsed time:
 *
 *  - 0–20s after order placed:        "paid"
 *  - 20s–90s:                          "shipped"
 *  - 90s+:                             "delivered"
 *
 * For older orders (placed >1 hour ago), assume delivered.
 *
 * Also returns live "estimated delivery" countdown and per-step timestamps.
 */

export type LiveStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

const TRANSITIONS = [
  { afterMs: 0, status: 'paid' as LiveStatus, label: 'Order placed' },
  { afterMs: 20_000, status: 'shipped' as LiveStatus, label: 'Shipped' },
  { afterMs: 90_000, status: 'delivered' as LiveStatus, label: 'Delivered' },
]

export function useLiveOrderStatus(orderCreatedAt: string | Date, serverStatus: string): {
  status: LiveStatus
  stepIndex: number // 0..3 (-1 if cancelled)
  stepTimestamps: { label: string; reachedAt: Date | null; status: LiveStatus }[]
  nextTransitionIn: number | null // ms until next status change, null if delivered/cancelled
} {
  const createdMs = new Date(orderCreatedAt).getTime()
  const isFinalServerStatus = serverStatus === 'delivered' || serverStatus === 'cancelled'

  const [, force] = useState(0)
  useEffect(() => {
    if (isFinalServerStatus) return
    const id = setInterval(() => force((n) => n + 1), 5000)
    return () => clearInterval(id)
  }, [isFinalServerStatus])

  if (serverStatus === 'cancelled') {
    return { status: 'cancelled', stepIndex: -1, stepTimestamps: [], nextTransitionIn: null }
  }

  const elapsed = Date.now() - createdMs

  // Find current status
  let currentStatus: LiveStatus = 'paid'
  if (serverStatus === 'delivered') currentStatus = 'delivered'
  else {
    for (const t of TRANSITIONS) {
      if (elapsed >= t.afterMs) currentStatus = t.status
    }
    // Hard fallback: anything >1h is delivered
    if (elapsed > 3_600_000) currentStatus = 'delivered'
  }

  const stepIndex = currentStatus === 'pending' ? 0 :
                    currentStatus === 'paid' ? 1 :
                    currentStatus === 'shipped' ? 2 :
                    currentStatus === 'delivered' ? 3 : -1

  // Compute timestamps for each step
  const stepTimestamps = [
    { label: 'Order placed', reachedAt: new Date(createdMs), status: 'pending' as LiveStatus },
    { label: 'Payment confirmed', reachedAt: new Date(createdMs + 2_000), status: 'paid' as LiveStatus },
    { label: 'Shipped', reachedAt: elapsed >= 20_000 ? new Date(createdMs + 20_000) : null, status: 'shipped' as LiveStatus },
    { label: 'Delivered', reachedAt: elapsed >= 90_000 ? new Date(createdMs + 90_000) : null, status: 'delivered' as LiveStatus },
  ]

  // Find next transition
  let nextTransitionIn: number | null = null
  if (currentStatus !== 'delivered') {
    const nextT = TRANSITIONS.find((t) => t.status !== currentStatus && elapsed < t.afterMs)
    if (nextT) nextTransitionIn = nextT.afterMs - elapsed
  }

  return { status: currentStatus, stepIndex, stepTimestamps, nextTransitionIn }
}

export function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}
