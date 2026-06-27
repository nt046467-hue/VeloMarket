'use client'

import { useCurrency, getCurrency } from '@/lib/store'

/**
 * Returns a function that converts a USD amount to the active currency and formats it.
 * Usage: const format = useCurrencyFormatter(); format(99.99) -> "€91.99"
 */
export function useCurrencyFormatter() {
  const code = useCurrency((s) => s.code)
  const currency = getCurrency(code)

  return (usdAmount: number, opts?: { showCode?: boolean; compact?: boolean }) => {
    const converted = usdAmount * currency.rate
    // JPY has no decimal
    const maximumFractionDigits = currency.code === 'JPY' ? 0 : 2
    const minimumFractionDigits = currency.code === 'JPY' ? 0 : (converted < 10 ? 2 : 0)

    const formatted = new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: opts?.compact ? 0 : minimumFractionDigits,
      maximumFractionDigits: opts?.compact ? 0 : maximumFractionDigits,
    }).format(converted)

    return formatted
  }
}

export function useActiveCurrency() {
  const code = useCurrency((s) => s.code)
  return getCurrency(code)
}
