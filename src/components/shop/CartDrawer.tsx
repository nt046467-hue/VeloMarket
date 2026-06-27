'use client'

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useCart, useView, usePromo, PROMOS } from '@/lib/store'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { ShoppingCart, Minus, Plus, Trash2, ShieldCheck, ChevronRight, Tag, BadgePercent, Sparkles, Gift } from 'lucide-react'
import { ProductImage } from './ProductImage'
import { BundleDealsBanner, useBundleDeals, totalBundleSavings } from './BundleDeals'
import { GiftCardRedeemer } from './GiftCardManager'
import { useState } from 'react'
import { toast } from 'sonner'

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCart()
  const navigate = useView((s) => s.navigate)
  const promoCode = usePromo((s) => s.code)
  const promoRate = usePromo((s) => s.rate)
  const promoFlat = usePromo((s) => s.flatAmountUsd)
  const isLoyalty = usePromo((s) => s.isLoyalty)
  const isGiftCard = usePromo((s) => s.isGiftCard)
  const applyPromoStore = usePromo((s) => s.apply)
  const clearPromo = usePromo((s) => s.clear)
  const [promo, setPromo] = useState('')
  const formatCurrency = useCurrencyFormatter()
  const bundleOffers = useBundleDeals()
  const bundleSavings = totalBundleSavings(bundleOffers)

  const subtotalVal = subtotal()
  // Discount is the max of percentage-based OR flat loyalty amount (not both)
  const percentageDiscount = subtotalVal * promoRate
  const discount = isLoyalty ? Math.min(promoFlat, subtotalVal) : percentageDiscount
  const discounted = subtotalVal - discount
  const hasFreeShippingCode = promoCode === 'FREESHIP'
  const shipping = hasFreeShippingCode || discounted - bundleSavings > 99 || subtotalVal === 0 ? 0 : 9.99
  const tax = Math.max(0, (discounted - bundleSavings)) * 0.08
  const total = Math.max(0, discounted - bundleSavings) + shipping + tax

  function applyPromo() {
    if (!promo.trim()) return
    const ok = applyPromoStore(promo)
    if (ok) {
      const upper = promo.trim().toUpperCase()
      const rate = PROMOS[upper]
      if (rate === 0) {
        toast.success(`Code "${upper}" applied — Free shipping unlocked!`)
      } else {
        toast.success(`Code "${upper}" applied — ${Math.round(rate * 100)}% off`)
      }
      setPromo('')
    } else {
      toast.error('Invalid promo code')
    }
  }

  function removePromo() {
    clearPromo()
    toast.success('Promo code removed')
  }

  function goToCheckout() {
    if (items.length === 0) return
    closeCart()
    navigate({ name: 'checkout', })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && closeCart()}>
      <SheetContent className="flex w-full flex-col bg-white p-0 sm:max-w-md md:max-w-lg">
        <SheetHeader className="border-b bg-gradient-to-r from-amber-50 to-white px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-left">
            <ShoppingCart size={18} className="text-amber-600" />
            Your Cart
            <span className="text-sm font-normal text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-amber-50">
              <ShoppingCart size={36} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">Browse our catalog and add your favorite items.</p>
            </div>
            <Button
              className="bg-amber-400 text-zinc-900 hover:bg-amber-500"
              onClick={() => { closeCart(); navigate({ name: 'shop' }) }}
            >
              Start shopping <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                {/* Free shipping progress */}
                <FreeShippingBanner subtotal={subtotalVal - discount} />
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 rounded-lg border border-border/60 bg-white p-2.5">
                    <button
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted/30"
                      onClick={() => { closeCart(); navigate({ name: 'product', productId: item.productId }) }}
                    >
                      <ProductImage src={item.image} alt={item.name} sizes="80px" />
                    </button>
                    <div className="flex flex-1 flex-col">
                      <div className="text-[11px] font-semibold uppercase text-amber-700">{item.brand}</div>
                      <button
                        className="text-left text-sm font-medium leading-tight hover:text-amber-700 line-clamp-2"
                        onClick={() => { closeCart(); navigate({ name: 'product', productId: item.productId }) }}
                      >
                        {item.name}
                      </button>
                      {item.variantSelection && (item.variantSelection.color || item.variantSelection.size) && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                          {item.variantSelection.color && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-muted/60 px-1.5 py-0.5">
                              <span className="h-2 w-2 rounded-full ring-1 ring-black/10" style={{ backgroundColor: item.variantSelection.color.hex }} />
                              {item.variantSelection.color.name}
                            </span>
                          )}
                          {item.variantSelection.size && (
                            <span className="rounded bg-muted/60 px-1.5 py-0.5">Size: {item.variantSelection.size.name}</span>
                          )}
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="flex items-center overflow-hidden rounded-md border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-none"
                            onClick={() => updateQuantity(item.variantKey ?? item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={12} />
                          </Button>
                          <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-none"
                            onClick={() => updateQuantity(item.variantKey ?? item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                        <div className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                      onClick={() => { removeItem(item.variantKey ?? item.productId); toast.success('Removed from cart') }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="border-t bg-white">
              {/* Promo */}
              <div className="mb-2 flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={applyPromo} disabled={!promo.trim()}>
                  Apply
                </Button>
              </div>
              {/* Gift card redeemer */}
              {!promoCode && <GiftCardRedeemer />}
              {promoCode && (
                <div className="mb-2 flex items-center justify-between rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    {isLoyalty ? <Sparkles size={12} /> : isGiftCard ? <Gift size={12} /> : <BadgePercent size={12} />}
                    {isLoyalty ? <>Loyalty: <b>{promoCode}</b></> : isGiftCard ? <>Gift card <b>{promoCode}</b></> : <>Promo <b>{promoCode}</b> applied</>}
                  </span>
                  <button onClick={removePromo} className="hover:underline">Remove</button>
                </div>
              )}

              <BundleDealsBanner />

              <div className="space-y-1 text-sm">
                <Row label="Subtotal" value={formatCurrency(subtotalVal)} />
                {discount > 0 && (
                  <Row label="Promo discount" value={`-${formatCurrency(discount)}`} className="text-emerald-700 dark:text-emerald-300" />
                )}
                {bundleSavings > 0 && (
                  <Row label="Bundle savings" value={`-${formatCurrency(bundleSavings)}`} className="text-emerald-700 dark:text-emerald-300" />
                )}
                <Row label="Shipping" value={shipping === 0 ? 'FREE' : formatCurrency(shipping)} highlight={shipping === 0} />
                <Row label="Tax (8%)" value={formatCurrency(tax)} />
                <Separator className="my-1.5" />
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {(discount + bundleSavings) > 0 && (
                  <div className="flex items-center justify-end gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    <Sparkles size={11} /> You&apos;re saving {formatCurrency(discount + bundleSavings)} total
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="mt-3 h-12 w-full bg-amber-400 text-zinc-900 hover:bg-amber-500"
                onClick={goToCheckout}
              >
                Proceed to checkout <ChevronRight size={16} className="ml-1" />
              </Button>
              <div className="flex items-center justify-center gap-1 pt-1 text-[11px] text-muted-foreground">
                <ShieldCheck size={12} className="text-emerald-500" />
                Secure SSL encrypted checkout
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value, className = '', highlight }: { label: string; value: string; className?: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${className} ${highlight ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function FreeShippingBanner({ subtotal }: { subtotal: number }) {
  const formatCurrency = useCurrencyFormatter()
  const remaining = Math.max(0, 99 - subtotal)
  const pct = Math.min(100, (subtotal / 99) * 100)
  return (
    <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-amber-50 p-2.5">
      {remaining > 0 ? (
        <>
          <div className="text-xs font-medium text-emerald-800">
            Add <b>{formatCurrency(remaining)}</b> more for FREE shipping! 🚚
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : (
        <div className="text-xs font-medium text-emerald-700">🎉 You unlocked FREE shipping!</div>
      )}
    </div>
  )
}
