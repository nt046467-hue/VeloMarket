'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRating({
  rating,
  size = 14,
  className,
  showValue = false,
  count,
}: {
  rating: number
  size?: number
  className?: string
  showValue?: boolean
  count?: number
}) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="inline-flex items-center">
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = i < full
          const half = i === full && hasHalf
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star
                size={size}
                className="absolute inset-0 text-amber-300"
                strokeWidth={1.5}
                fill="none"
              />
              {(filled || half) && (
                <Star
                  size={size}
                  className="absolute inset-0 text-amber-400"
                  fill="currentColor"
                  strokeWidth={0}
                  style={half ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
                />
              )}
            </span>
          )
        })}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-amber-700">
          {rating.toFixed(1)}
        </span>
      )}
      {typeof count === 'number' && (
        <span className="text-xs text-muted-foreground">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  )
}
