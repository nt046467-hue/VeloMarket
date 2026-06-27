'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronRight, ShieldCheck, Truck, CreditCard, Check, Lock, Home as HomeIcon, Loader2, Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCart, useView, useAuth, useUI, usePromo, PROMOS } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { getCardBrand } from '@/lib/format'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { toast } from 'sonner'
import type { Order, Address } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Tag, X } from 'lucide-react'
import { AddressBook } from './AddressBook'

const STEPS = ['Shipping', 'Payment', 'Review'] as const

export function CheckoutView() {
  const { items, subtotal, clear, closeCart } = useCart()
  const navigate = useView((s) => s.navigate)
  const { user } = useAuth()
  const { openAuth } = useUI()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)

  const [addr, setAddr] = useState({
    fullName: user?.name ?? '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  })
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'priority'>('standard')
  const [pay, setPay] = useState({
    cardName: user?.name ?? '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  })
  const [promoInput, setPromoInput] = useState('')
  const promoCode = usePromo((s) => s.code)
  const promoRate = usePromo((s) => s.rate)
  const promoFlat = usePromo((s) => s.flatAmountUsd)
  const isLoyalty = usePromo((s) => s.isLoyalty)
  const applyPromo = usePromo((s) => s.apply)
  const clearPromo = usePromo((s) => s.clear)
  const formatCurrency = useCurrencyFormatter()

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<(Address & { id: string; isDefault?: boolean })[]>([])
  const [useSavedAddress, setUseSavedAddress] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  // Load saved addresses for the signed-in user
  useEffect(() => {
    if (!user) return
    fetcher<{ addresses: (Address & { id: string; isDefault?: boolean })[] }>('/api/addresses')
      .then((d) => {
        const list = d?.addresses ?? []
        setSavedAddresses(list)
        const def = list.find((a) => a.isDefault) ?? list[0]
        if (def) {
          setSelectedAddressId(def.id)
          setAddr({
            fullName: def.fullName,
            phone: def.phone,
            line1: def.line1,
            line2: def.line2 || '',
            city: def.city,
            state: def.state,
            zip: def.zip,
            country: def.country,
          })
          setUseSavedAddress(true)
        }
      })
      .catch(() => {})
  }, [user])

  function selectSaved(a: Address & { id?: string }) {
    if (a.id) setSelectedAddressId(a.id)
    setAddr({
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 || '',
      city: a.city,
      state: a.state,
      zip: a.zip,
      country: a.country,
    })
  }

  const subtotalVal = subtotal()
  const discount = isLoyalty ? Math.min(promoFlat, subtotalVal) : subtotalVal * promoRate
  const discounted = subtotalVal - discount
  const hasFreeShippingCode = promoCode === 'FREESHIP'
  const baseShipping = hasFreeShippingCode || discounted > 99 ? 0 : shippingMethod === 'express' ? 14.99 : shippingMethod === 'priority' ? 24.99 : 9.99
  const shippingCost = discounted === 0 ? 0 : baseShipping
  const tax = discounted * 0.08
  const total = discounted + shippingCost + tax

  function handleApplyPromo() {
    if (!promoInput.trim()) return
    const ok = applyPromo(promoInput)
    if (ok) {
      const upper = promoInput.trim().toUpperCase()
      const rate = PROMOS[upper]
      if (rate === 0) {
        toast.success(`Code "${upper}" applied — Free shipping!`)
      } else {
        toast.success(`Code "${upper}" applied — ${Math.round(rate * 100)}% off`)
      }
      setPromoInput('')
    } else {
      toast.error('Invalid promo code')
    }
  }

  if (items.length === 0 && !completedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="grid mx-auto h-20 w-20 place-items-center rounded-full bg-amber-50">
          <Truck size={36} className="text-amber-500" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">Add some items before checking out.</p>
        <Button className="mt-4 bg-amber-400 text-zinc-900 hover:bg-amber-500" onClick={() => navigate({ name: 'shop' })}>
          Continue shopping
        </Button>
      </div>
    )
  }

  if (completedOrder) {
    return <OrderConfirmation order={completedOrder} />
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="grid mx-auto h-20 w-20 place-items-center rounded-full bg-amber-50">
          <ShieldCheck size={36} className="text-amber-500" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Please sign in to checkout</h2>
        <p className="mt-2 text-sm text-muted-foreground">A secure account keeps your orders safe.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => navigate({ name: 'shop' })}>Keep browsing</Button>
          <Button className="bg-amber-400 text-zinc-900 hover:bg-amber-500" onClick={() => openAuth('login')}>Sign in / Register</Button>
        </div>
      </div>
    )
  }

  function next() {
    // Validate current step
    if (step === 0) {
      if (!addr.fullName || !addr.phone || !addr.line1 || !addr.city || !addr.state || !addr.zip) {
        toast.error('Please complete all required shipping fields')
        return
      }
      if (!/^\d{10,}$/.test(addr.phone.replace(/\D/g, ''))) {
        toast.error('Please enter a valid phone number')
        return
      }
    }
    if (step === 1) {
      if (!pay.cardName || !pay.cardNumber || !pay.expiry || !pay.cvv) {
        toast.error('Please complete all payment fields')
        return
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function placeOrder() {
    setSubmitting(true)
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          image: i.image,
          brand: i.brand,
          unitPrice: i.price,
          quantity: i.quantity,
        })),
        shippingAddress: addr,
        payment: pay,
        promoCode,
      }
      const res = await fetcher<{ order: Order }>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (res?.order) {
        // Save the address for next time if user opted in (checkbox defaultChecked) & it's new
        if (user && !useSavedAddress) {
          // Avoid saving if it duplicates an existing one
          const exists = savedAddresses.some(
            (a) => a.line1 === addr.line1 && a.city === addr.city && a.zip === addr.zip
          )
          if (!exists) {
            await fetcher('/api/addresses', {
              method: 'POST',
              body: JSON.stringify({ ...addr, action: 'save' }),
            }).catch(() => {})
          }
        }
        clear()
        clearPromo() // reset promo after order so it doesn't apply to next order
        // Clear server-side cart too
        if (user) {
          fetcher('/api/cart', { method: 'POST', body: JSON.stringify({ action: 'clear' }) }).catch(() => {})
        }
        setCompletedOrder(res.order)
        toast.success('Order placed successfully!')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        throw new Error('No order returned')
      }
    } catch (e: any) {
      toast.error(e.message || 'Checkout failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Breadcrumb + steps */}
      <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center hover:text-foreground">
          <HomeIcon size={12} className="mr-1" /> Home
        </button>
        <ChevronRight size={12} />
        <span className="font-medium text-foreground">Checkout</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Secure checkout</h1>
        <div className="flex items-center gap-1 text-xs text-emerald-700">
          <Lock size={12} /> 256-bit SSL encrypted
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                'flex items-center gap-2 text-sm transition',
                i === step ? 'text-amber-700 font-semibold' :
                i < step ? 'text-emerald-600 hover:underline' : 'text-muted-foreground'
              )}
            >
              <span className={cn(
                'grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-semibold',
                i < step ? 'border-emerald-500 bg-emerald-500 text-white' :
                i === step ? 'border-amber-500 bg-amber-400 text-zinc-900' : 'border-muted bg-background'
              )}>
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-2 h-0.5 flex-1 rounded', i < step ? 'bg-emerald-500' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Step 0: Shipping */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Truck size={18} className="text-amber-600" />
                  <h2 className="font-semibold">Shipping address</h2>
                </div>

                {/* Saved addresses selector */}
                {user && savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Saved addresses ({savedAddresses.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setUseSavedAddress((v) => !v)}
                        className="text-[11px] text-amber-700 hover:underline dark:text-amber-400"
                      >
                        {useSavedAddress ? '+ Enter new address' : '← Use saved'}
                      </button>
                    </div>
                    {useSavedAddress && (
                      <AddressBook selectable selectedId={selectedAddressId} onSelect={selectSaved} compact />
                    )}
                  </div>
                )}

                {(!useSavedAddress || savedAddresses.length === 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Full name *" value={addr.fullName} onChange={(v) => setAddr({ ...addr, fullName: v })} />
                    <Field label="Phone *" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} placeholder="+1 (555) 000-0000" />
                    <div className="sm:col-span-2">
                      <Field label="Address line 1 *" value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} placeholder="Street address, P.O. box" />
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Address line 2" value={addr.line2 || ''} onChange={(v) => setAddr({ ...addr, line2: v })} placeholder="Apartment, suite, unit (optional)" />
                    </div>
                    <Field label="City *" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} />
                    <Field label="State / Province *" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v })} />
                    <Field label="ZIP / Postal code *" value={addr.zip} onChange={(v) => setAddr({ ...addr, zip: v })} />
                    <Field label="Country" value={addr.country} onChange={(v) => setAddr({ ...addr, country: v })} />
                  </div>
                )}

                {/* Option to save the new address for next time */}
                {user && !useSavedAddress && (
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-3.5 w-3.5 rounded border-input accent-amber-500"
                      // Bound to a data attribute read on submit; for simplicity, always save new
                    />
                    Save this address for faster checkout next time
                  </label>
                )}

                <Separator className="my-5" />
                <h3 className="mb-3 text-sm font-semibold">Delivery method</h3>
                <RadioGroup value={shippingMethod} onValueChange={(v) => setShippingMethod(v as any)}>
                  <div className="space-y-2">
                    <ShipOption
                      value="standard" title="Standard" desc="3-5 business days" price={subtotalVal > 99 ? 0 : 9.99}
                      selected={shippingMethod === 'standard'}
                    />
                    <ShipOption
                      value="express" title="Express" desc="2-3 business days" price={14.99}
                      selected={shippingMethod === 'express'}
                    />
                    <ShipOption
                      value="priority" title="Priority" desc="Next business day" price={24.99}
                      selected={shippingMethod === 'priority'}
                    />
                  </div>
                </RadioGroup>
              </Card>
            </motion.div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-amber-600" />
                  <h2 className="font-semibold">Payment method</h2>
                </div>
                <div className="mb-4 flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="gap-1"><Lock size={10} /> Encrypted</Badge>
                  <Badge variant="outline">We never store your CVV</Badge>
                  <Badge variant="outline">{getCardBrand(pay.cardNumber) || 'Card'} accepted</Badge>
                </div>
                <div className="grid gap-3">
                  <Field label="Name on card *" value={pay.cardName} onChange={(v) => setPay({ ...pay, cardName: v })} />
                  <Field
                    label="Card number *"
                    value={pay.cardNumber}
                    onChange={(v) => setPay({ ...pay, cardNumber: formatCardNumber(v) })}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Expiry (MM/YY) *"
                      value={pay.expiry}
                      onChange={(v) => setPay({ ...pay, expiry: formatExpiry(v) })}
                      placeholder="08/29"
                      maxLength={5}
                    />
                    <Field
                      label="CVV *"
                      value={pay.cvv}
                      onChange={(v) => setPay({ ...pay, cvv: v.replace(/\D/g, '').slice(0, 4) })}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-800">
                  <ShieldCheck size={14} className="mr-1 inline" />
                  This is a demo store. Please <b>do not use real card numbers</b>. Try test card <b>4242 4242 4242 4242</b>, any future date, any CVV.
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold"><Truck size={14} className="text-amber-600" /> Shipping to</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(0)}>Edit</Button>
                </div>
                <div className="text-sm">
                  <div className="font-medium">{addr.fullName}</div>
                  <div className="text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</div>
                  <div className="text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</div>
                  <div className="text-muted-foreground">{addr.country} · {addr.phone}</div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold"><CreditCard size={14} className="text-amber-600" /> Payment</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Edit</Button>
                </div>
                <div className="text-sm">
                  <div className="font-medium">{getCardBrand(pay.cardNumber)} •••• {pay.cardNumber.replace(/\D/g, '').slice(-4)}</div>
                  <div className="text-muted-foreground">Expires {pay.expiry}</div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 text-sm font-semibold">Items in this order</h3>
                <div className="space-y-3">
                  {items.map((i) => (
                    <div key={i.productId} className="flex gap-3">
                      <img src={i.image} alt={i.name} className="h-14 w-14 rounded-md object-cover" />
                      <div className="flex-1 text-sm">
                        <div className="text-[11px] uppercase font-semibold text-amber-700">{i.brand}</div>
                        <div className="font-medium line-clamp-1">{i.name}</div>
                        <div className="text-xs text-muted-foreground">Qty: {i.quantity} × {formatCurrency(i.price)}</div>
                      </div>
                      <div className="text-sm font-bold">{formatCurrency(i.price * i.quantity)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step nav */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => step === 0 ? navigate({ name: 'shop' }) : setStep((s) => Math.max(0, s - 1))}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button className="bg-amber-400 text-zinc-900 hover:bg-amber-500" onClick={next}>
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                className="bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={placeOrder}
                disabled={submitting}
              >
                {submitting ? <><Loader2 size={16} className="mr-2 animate-spin" /> Processing payment...</> : <><Lock size={14} className="mr-2" /> Place order · {formatCurrency(total)}</>}
              </Button>
            )}
          </div>
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-1">
          <Card className="sticky top-36 overflow-hidden">
            <div className="border-b bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
              <h3 className="font-semibold">Order summary</h3>
            </div>
            <div className="p-4">
              {/* Promo code (shared with cart drawer) */}
              {promoCode ? (
                <div className="mb-3 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs dark:border-emerald-500/30 dark:bg-emerald-900/20">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    {isLoyalty ? <Sparkles size={12} /> : <Tag size={12} />}
                    <b>{promoCode}</b> applied
                    {isLoyalty && <span className="ml-1">— Loyalty redemption</span>}
                    {!isLoyalty && promoRate > 0 && <span className="ml-1">— {Math.round(promoRate * 100)}% off</span>}
                    {!isLoyalty && promoRate === 0 && <span className="ml-1">— Free shipping</span>}
                  </span>
                  <button
                    onClick={() => { clearPromo(); toast.success('Promo removed') }}
                    className="flex items-center gap-1 rounded text-emerald-700 hover:underline dark:text-emerald-300"
                  >
                    <X size={11} /> Remove
                  </button>
                </div>
              ) : (
                <div className="mb-3 flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo() } }}
                      placeholder="Promo code (try WELCOME15)"
                      className="h-9 pl-8 text-xs uppercase"
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={handleApplyPromo} disabled={!promoInput.trim()}>
                    Apply
                  </Button>
                </div>
              )}
              <div className="space-y-1.5 text-sm">
                <Row label={`Subtotal (${items.length} items)`} value={formatCurrency(subtotalVal)} />
                {discount > 0 && (
                  <Row label="Discount" value={`-${formatCurrency(discount)}`} className="text-emerald-700 dark:text-emerald-300" />
                )}
                <Row label="Shipping" value={shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)} highlight={shippingCost === 0} />
                <Row label="Estimated tax" value={formatCurrency(tax)} />
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> Buyer protection guaranteed</div>
                <div className="flex items-center gap-2"><Truck size={14} className="text-amber-500" /> Track every shipment</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> 30-day easy returns</div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1 h-9 text-sm"
      />
    </div>
  )
}

function ShipOption({ value, title, desc, price, selected }: { value: string; title: string; desc: string; price: number; selected: boolean }) {
  const formatCurrency = useCurrencyFormatter()
  return (
    <Label htmlFor={`ship-${value}`} className={cn(
      'flex cursor-pointer items-center justify-between rounded-lg border-2 p-3 transition',
      selected ? 'border-amber-400 bg-amber-50/50' : 'border-border hover:border-amber-200'
    )}>
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`ship-${value}`} value={value} />
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div className="text-sm font-bold">{price === 0 ? 'FREE' : formatCurrency(price)}</div>
    </Label>
  )
}

function Row({ label, value, className = '', highlight }: { label: string; value: string; className?: string; highlight?: boolean }) {
  return (
    <div className={cn("flex justify-between items-center", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', highlight && 'text-emerald-600')}>{value}</span>
    </div>
  )
}

function OrderConfirmation({ order }: { order: Order }) {
  const navigate = useView((s) => s.navigate)
  const formatCurrency = useCurrencyFormatter()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl px-4 py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}
        className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-100"
      >
        <Check size={48} className="text-emerald-600" strokeWidth={3} />
      </motion.div>
      <h1 className="mt-6 text-3xl font-black text-emerald-700">Order confirmed!</h1>
      <p className="mt-2 text-muted-foreground">Thank you for your purchase. We&apos;ve sent a confirmation email with the details.</p>

      <Card className="mt-6 p-5 text-left">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Order number</div>
            <div className="font-mono font-bold">{order.orderNumber}</div>
          </div>
          <Badge className="bg-emerald-500 text-white">Paid</Badge>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="font-bold">{formatCurrency(order.grandTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Payment</div>
            <div className="font-medium">{order.paymentMethod}</div>
          </div>
          {(order as any).pointsEarned ? (
            <div className="sm:col-span-2 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
              <Sparkles size={14} className="shrink-0" />
              <span><b>{(order as any).pointsEarned.toLocaleString()} reward points</b> earned from this order</span>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground">Shipping to</div>
            <div className="font-medium">{order.shippingAddress.fullName}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          {order.items.map((i) => (
            <div key={i.id} className="flex items-center gap-3">
              <img src={i.image} alt={i.name} className="h-12 w-12 rounded object-cover" />
              <div className="flex-1 text-sm">
                <div className="font-medium line-clamp-1">{i.name}</div>
                <div className="text-xs text-muted-foreground">Qty {i.quantity} × {formatCurrency(i.unitPrice)}</div>
              </div>
              <div className="text-sm font-bold">{formatCurrency(i.lineTotal)}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button variant="outline" onClick={() => navigate({ name: 'shop' })}>Continue shopping</Button>
        <Button className="bg-amber-400 text-zinc-900 hover:bg-amber-500" onClick={() => navigate({ name: 'orders' })}>
          View your orders <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  if (d.length <= 2) return d
  return d.slice(0, 2) + '/' + d.slice(2)
}
