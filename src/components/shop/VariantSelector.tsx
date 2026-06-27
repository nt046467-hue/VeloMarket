'use client'

import { useMemo } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { ProductVariant } from '@/lib/types'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { cn } from '@/lib/utils'

export type VariantSelection = {
  color?: { name: string; hex: string; stock: number; priceDelta?: number }
  size?: { name: string; stock: number; priceDelta?: number }
}

export function VariantSelector({
  variants,
  value,
  onChange,
}: {
  variants: ProductVariant
  value: VariantSelection
  onChange: (v: VariantSelection) => void
}) {
  const formatCurrency = useCurrencyFormatter()

  // Combined stock for selected color+size (consider out-of-stock combinations)
  const selectedColor = value.color
  const selectedSize = value.size
  const isColorOutOfStock = selectedColor && selectedColor.stock === 0
  const isSizeOutOfStock = selectedSize && selectedSize.stock === 0
  const combinedStock = useMemo(() => {
    if (selectedColor && selectedSize) {
      // Conservative: use the lower of the two stocks
      return Math.min(selectedColor.stock, selectedSize.stock)
    }
    return selectedColor?.stock ?? selectedSize?.stock ?? 0
  }, [selectedColor, selectedSize])

  return (
    <div className="space-y-3">
      {/* Colors */}
      {variants.colors && variants.colors.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs">
              Color: <span className="font-semibold text-foreground">{value.color?.name ?? 'Select'}</span>
            </Label>
            {value.color && <span className="text-[10px] text-muted-foreground">{value.color.stock} in stock</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {variants.colors.map((c) => {
              const isSelected = value.color?.name === c.name
              const isOutOfStock = c.stock === 0
              const hasDelta = (c.priceDelta ?? 0) > 0
              return (
                <button
                  key={c.name}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onChange({ ...value, color: c })}
                  title={`${c.name}${hasDelta ? ` (+${formatCurrency(c.priceDelta!)})` : ''}${isOutOfStock ? ' — Out of stock' : ''}`}
                  className={cn(
                    'group relative flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs transition',
                    isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/15' : 'border-border hover:border-amber-300',
                    isOutOfStock && 'opacity-40 cursor-not-allowed hover:border-border'
                  )}
                >
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full ring-1 ring-black/10 dark:ring-white/20"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <Check
                        size={11}
                        className={isLight(c.hex) ? 'text-zinc-900' : 'text-white'}
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  <span className="font-medium">{c.name}</span>
                  {hasDelta && (
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">
                      +{formatCurrency(c.priceDelta!)}
                    </span>
                  )}
                  {isOutOfStock && (
                    <Badge variant="outline" className="text-[9px] text-rose-700">Out</Badge>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Sizes */}
      {variants.sizes && variants.sizes.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs">
              Size: <span className="font-semibold text-foreground">{value.size?.name ?? 'Select'}</span>
            </Label>
            <button className="text-[10px] text-blue-600 hover:underline dark:text-blue-400">Size guide</button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {variants.sizes.map((s) => {
              const isSelected = value.size?.name === s.name
              const isOutOfStock = s.stock === 0
              const hasDelta = (s.priceDelta ?? 0) > 0
              return (
                <button
                  key={s.name}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onChange({ ...value, size: s })}
                  className={cn(
                    'relative rounded-md border-2 px-2 py-1.5 text-xs font-semibold transition',
                    isSelected ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200' : 'border-border hover:border-amber-300',
                    isOutOfStock && 'opacity-40 cursor-not-allowed hover:border-border line-through'
                  )}
                >
                  {s.name}
                  {hasDelta && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1 text-[8px] font-bold text-white">
                      +{s.priceDelta}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Stock availability banner */}
      {(selectedColor || selectedSize) && (
        <div className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px]',
          combinedStock === 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300' :
          combinedStock <= 5 ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
        )}>
          {combinedStock === 0 ? (
            <><AlertCircle size={11} /> This combination is out of stock</>
          ) : combinedStock <= 5 ? (
            <><AlertCircle size={11} /> Only {combinedStock} left — order soon!</>
          ) : (
            <><Check size={11} /> In stock — ships within 24h</>
          )}
        </div>
      )}
    </div>
  )
}

// Compute relative luminance to decide check mark color
function isLight(hex: string): boolean {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16) / 255
  const g = parseInt(m.slice(2, 4), 16) / 255
  const b = parseInt(m.slice(4, 6), 16) / 255
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 0.6
}

export function computeVariantPrice(basePrice: number, selection: VariantSelection): number {
  const colorDelta = selection.color?.priceDelta ?? 0
  const sizeDelta = selection.size?.priceDelta ?? 0
  return basePrice + colorDelta + sizeDelta
}

export function isVariantSelectionComplete(variants: ProductVariant | null, selection: VariantSelection): boolean {
  if (!variants) return true
  if (variants.colors?.length && !selection.color) return false
  if (variants.sizes?.length && !selection.size) return false
  return true
}

export function getVariantStock(selection: VariantSelection): number {
  if (selection.color && selection.size) {
    return Math.min(selection.color.stock, selection.size.stock)
  }
  return selection.color?.stock ?? selection.size?.stock ?? 0
}
