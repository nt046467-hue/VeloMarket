'use client'

import { ChevronRight, Mail, Phone, MapPin, Twitter, Facebook, Instagram, Youtube, ShieldCheck, Truck, RotateCcw, CreditCard, Loader2 } from 'lucide-react'
import { useView, useFilters } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetcher } from '@/lib/api-client'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', view: { name: 'shop' as const } },
      { label: "Today's Deals", view: { name: 'deals' as const } },
      { label: 'Electronics', view: { name: 'shop' as const, categorySlug: 'electronics' } },
      { label: 'Computers', view: { name: 'shop' as const, categorySlug: 'computers' } },
      { label: 'Audio', view: { name: 'shop' as const, categorySlug: 'audio' } },
      { label: 'Fashion', view: { name: 'shop' as const, categorySlug: 'fashion' } },
    ],
  },
  {
    title: 'Help & Settings',
    links: [
      { label: 'Your orders', view: { name: 'orders' as const } },
      { label: 'Your wishlist', view: { name: 'wishlist' as const } },
      { label: 'Your account', view: { name: 'account' as const } },
      { label: 'Customer service', view: null },
      { label: 'Returns & refunds', view: null },
      { label: 'Privacy policy', view: null },
    ],
  },
  {
    title: 'About VeloMarket',
    links: [
      { label: 'Our story', view: null },
      { label: 'Careers', view: null },
      { label: 'Press', view: null },
      { label: 'Sustainability', view: null },
      { label: 'Affiliate program', view: null },
      { label: 'Terms of service', view: null },
    ],
  },
]

export function Footer() {
  const navigate = useView((s) => s.navigate)
  const setCategory = useFilters((s) => s.setCategory)
  const setSearch = useFilters((s) => s.setSearch)
  const [email, setEmail] = useState('')

  function go(view: any) {
    if (!view) { toast.info('Coming soon'); return }
    if ('categorySlug' in view) {
      setCategory(view.categorySlug ?? null)
      setSearch('')
    }
    navigate(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const [subscribing, setSubscribing] = useState(false)

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribing(true)
    try {
      const res = await fetcher<{ ok: boolean; alreadySubscribed?: boolean; reactivated?: boolean; subscribed?: boolean; error?: string }>('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), source: 'footer' }),
      })
      if (res?.alreadySubscribed) {
        toast.info(`You're already subscribed — thanks for your loyalty!`)
      } else if (res?.reactivated) {
        toast.success(`Welcome back! Your subscription is reactivated.`)
      } else {
        toast.success(`🎉 You're subscribed! Check your inbox for a welcome email.`)
      }
      setEmail('')
    } catch (e: any) {
      toast.error(e.message || 'Failed to subscribe')
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <footer className="mt-auto bg-zinc-900 text-zinc-300">
      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="w-full bg-zinc-800 py-3 text-center text-xs font-medium text-white transition hover:bg-zinc-700"
      >
        Back to top
      </button>

      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 md:grid-cols-4">
          {[
            { icon: Truck, label: 'Free Shipping', sub: 'On orders $99+' },
            { icon: RotateCcw, label: '30-Day Returns', sub: 'No questions asked' },
            { icon: ShieldCheck, label: 'Secure Payment', sub: '256-bit encryption' },
            { icon: CreditCard, label: 'Flexible Payment', sub: 'Cards, wallets & more' },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-2">
              <t.icon size={24} className="text-amber-400" />
              <div className="leading-tight">
                <div className="text-xs font-semibold text-white">{t.label}</div>
                <div className="text-[11px] text-zinc-400">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">VeloMarket</h3>
          <p className="text-xs text-zinc-400">Your one-stop shop for everything you love. Shop smarter, live better.</p>
          <div className="mt-3 flex gap-2">
            <SocialIcon icon={Twitter} label="Twitter" />
            <SocialIcon icon={Facebook} label="Facebook" />
            <SocialIcon icon={Instagram} label="Instagram" />
            <SocialIcon icon={Youtube} label="YouTube" />
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-semibold text-white">{col.title}</h3>
            <ul className="space-y-2 text-xs">
              {col.links.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => go(l.view)}
                    className="flex items-center gap-1 text-zinc-400 transition hover:text-amber-400"
                  >
                    <ChevronRight size={10} className="opacity-50" />
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <div className="border-t border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
          <div>
            <h3 className="text-base font-bold text-white">Get exclusive deals in your inbox</h3>
            <p className="text-xs text-zinc-400">Sign up and be the first to know about new arrivals, sales and more.</p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-md gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500"
            />
            <Button type="submit" disabled={subscribing} className="bg-amber-400 text-zinc-900 hover:bg-amber-500">
              {subscribing ? <><Loader2 size={13} className="mr-1 animate-spin" /> Joining...</> : 'Subscribe'}
            </Button>
          </form>
        </div>
      </div>

      {/* Contact */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-zinc-400 sm:flex-row">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1"><Phone size={12} className="text-amber-400" /> 1-800-ZSHOP-01</span>
            <span className="flex items-center gap-1"><Mail size={12} className="text-amber-400" /> support@zshop.com</span>
            <span className="hidden items-center gap-1 sm:flex"><MapPin size={12} className="text-amber-400" /> 123 Commerce St, San Francisco, CA</span>
          </div>
          <div className="flex items-center gap-3">
            <span>We accept:</span>
            <div className="flex gap-1">
              {['VISA', 'MC', 'AMEX', 'PYPL'].map((m) => (
                <span key={m} className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 bg-zinc-950 py-3 text-center text-[11px] text-zinc-500">
        © {new Date().getFullYear()} VeloMarket. All rights reserved. · Built with Next.js · Demo project.
      </div>
    </footer>
  )
}

function SocialIcon({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); toast.info('Coming soon') }}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-zinc-300 transition hover:bg-amber-400 hover:text-zinc-900"
    >
      <Icon size={14} />
    </a>
  )
}
