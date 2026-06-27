'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ThumbsUp, ThumbsDown, UserCheck, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/api-client'
import { cn } from '@/lib/utils'

type Summary = {
  verdict: string
  pros: string[]
  cons: string[]
  bestFor: string
  sentiment: 'positive' | 'mixed' | 'negative'
}

const SENTIMENT_META = {
  positive: { color: 'from-emerald-500 to-teal-600', icon: '🟢', label: 'Mostly positive' },
  mixed: { color: 'from-amber-400 to-orange-500', icon: '🟡', label: 'Mixed reviews' },
  negative: { color: 'from-rose-500 to-red-600', icon: '🔴', label: 'Needs attention' },
}

export function ReviewSummary({ productId, reviewCount }: { productId: string; reviewCount: number }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(false)
    fetcher<{ summary: Summary | null }>(`/api/review-summary?productId=${productId}`)
      .then((d) => {
        if (cancelled) return
        setSummary(d?.summary ?? null)
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [productId])

  if (reviewCount === 0) return null

  const meta = summary ? SENTIMENT_META[summary.sentiment] : null

  return (
    <Card className="relative overflow-hidden">
      {meta && (
        <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', meta.color)} />
      )}
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold">
            <Sparkles size={15} className="text-violet-600" />
            AI Review Summary
          </h3>
          {summary && meta && (
            <Badge className={cn('bg-gradient-to-r text-white', meta.color)}>
              {meta.icon} {meta.label}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin text-violet-500" />
              Analyzing {reviewCount} reviews with AI...
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle size={12} /> Summary temporarily unavailable
          </div>
        ) : !summary ? (
          <div className="text-xs text-muted-foreground">No reviews to summarize yet.</div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Verdict */}
            <p className="text-sm font-medium leading-snug">"{summary.verdict}"</p>

            {/* Pros & Cons */}
            <div className="grid gap-2 sm:grid-cols-2">
              {summary.pros.length > 0 && (
                <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/15">
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                    <ThumbsUp size={10} /> Pros
                  </div>
                  <ul className="space-y-0.5">
                    {summary.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-1 text-xs text-emerald-800 dark:text-emerald-200">
                        <span className="mt-0.5">✓</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.cons.length > 0 && (
                <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-900/15">
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                    <ThumbsDown size={10} /> Cons
                  </div>
                  <ul className="space-y-0.5">
                    {summary.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-1 text-xs text-rose-800 dark:text-rose-200">
                        <span className="mt-0.5">✗</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Best for */}
            {summary.bestFor && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserCheck size={12} className="text-violet-500" />
                <span>Best for: <b className="text-foreground">{summary.bestFor}</b></span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  )
}
