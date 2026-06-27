export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function discountPercent(price: number, compareAt?: number | null): number {
  if (!compareAt || compareAt <= price) return 0
  return Math.round((1 - price / compareAt) * 100)
}

export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function generateOrderNumber(): string {
  const d = new Date()
  const y = d.getFullYear().toString().slice(-2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `ZS-${y}${m}-${rand}`
}

export function truncate(s: string | null | undefined, len: number): string {
  if (!s) return ''
  return s.length > len ? s.slice(0, len - 1) + '…' : s
}

// Luhn checksum validation for credit card numbers (real e-commerce safety check)
export function isValidCardNumber(num: string): boolean {
  const digits = num.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function isValidExpiry(mmdd: string): boolean {
  const m = mmdd.match(/^(\d{2})\s*\/\s*(\d{2})$/)
  if (!m) return false
  const month = parseInt(m[1], 10)
  const year = 2000 + parseInt(m[2], 10)
  if (month < 1 || month > 12) return false
  const exp = new Date(year, month, 0, 23, 59, 59)
  return exp.getTime() > Date.now()
}

export function isValidCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv)
}

export function getCardBrand(num: string): string {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^6(?:011|5)/.test(n)) return 'Discover'
  if (/^35/.test(n)) return 'JCB'
  return 'Card'
}
