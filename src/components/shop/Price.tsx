'use client'

import { cn } from '@/lib/utils'
import { discountPercent } from '@/lib/format'
import { useCurrencyFormatter } from '@/lib/use-currency'

export function Price({
  price,
  compareAt,
  size = 'md',
  className,
  showDiscount = false,
}: {
  price: number
  compareAt?: number | null
  currency?: string // accepted for backwards compat but ignored
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showDiscount?: boolean
}) {
  const format = useCurrencyFormatter()
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  }
  const pct = discountPercent(price, compareAt)
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-semibold tracking-tight', sizes[size])}>
        {format(price)}
      </span>
      {compareAt && compareAt > price && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {format(compareAt)}
          </span>
          {showDiscount && pct > 0 && (
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              -{pct}%
            </span>
          )}
        </>
      )}
    </div>
  )
}
