'use client'

import { User, Mail, Crown, Gift, CreditCard, MapPin, Bell, LogOut, Shield, ChevronRight, Sparkles, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAuth, useUI, useView } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { AddressBook } from './AddressBook'
import { LoyaltyCard } from './LoyaltyCard'
import { PriceAlertsList } from './PriceAlerts'
import { GiftCardManager } from './GiftCardManager'
import { toast } from 'sonner'
import { useState } from 'react'

export function AccountView() {
  const { user, logout } = useAuth()
  const { openAuth } = useUI()
  const navigate = useView((s) => s.navigate)
  const [notifications, setNotifications] = useState({ orders: true, deals: true, newsletter: false })

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-50">
          <User size={36} className="text-amber-500" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Sign in to your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Manage your profile, orders and preferences.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => navigate({ name: 'home' })}>Back home</Button>
          <Button className="bg-amber-400 text-zinc-900 hover:bg-amber-500" onClick={() => openAuth('login')}>Sign in</Button>
        </div>
      </div>
    )
  }

  async function handleLogout() {
    try { await fetcher('/api/auth/logout', { method: 'POST' }) } catch {}
    logout()
    navigate({ name: 'home' })
    toast.success('Signed out')
  }

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Account</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut size={14} className="mr-1" /> Sign out
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Profile card */}
        <Card className="md:col-span-1 overflow-hidden">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-2xl font-black text-amber-700 shadow-md">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <h2 className="mt-3 text-lg font-bold text-zinc-900">{user.name}</h2>
            <p className="text-xs text-zinc-800/80">{user.email}</p>
            <Badge className="mt-2 bg-zinc-900 text-amber-300 hover:bg-zinc-900">
              <Crown size={10} className="mr-1" /> Velo Prime Member
            </Badge>
          </div>
          <div className="p-4 text-sm">
            <Stat label="Member since" value="Oct 2024" />
            <Stat label="Total orders" value="3" />
            <Stat label="Reward points" value={(user.loyaltyPoints ?? 0).toLocaleString()} />
          </div>
        </Card>

        {/* Loyalty rewards card */}
        <LoyaltyCard />

        {/* Quick links */}
        <div className="md:col-span-2 space-y-3">
          <Card className="overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <Sparkles size={32} className="shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold">Unlock Velo Prime benefits</h3>
                <p className="text-xs text-white/90">Free same-day delivery · Exclusive deals · Streaming included</p>
              </div>
              <Button size="sm" variant="secondary" className="bg-white text-violet-700 hover:bg-white/90">Try free</Button>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <QuickLink icon={CreditCard} title="Payment methods" sub="•••• 4242" onClick={() => toast.info('Coming soon')} />
            <QuickLink icon={Gift} title="Gift cards" sub="$0.00 balance" onClick={() => toast.info('Coming soon')} />
            <QuickLink icon={Shield} title="Privacy & security" sub="Manage settings" onClick={() => toast.info('Coming soon')} />
          </div>

          {/* Address book */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-amber-600" />
              <h3 className="font-semibold text-sm">My addresses</h3>
            </div>
            <Separator className="mb-3" />
            <AddressBook />
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="text-violet-600" />
              <h3 className="font-semibold text-sm">Price drop alerts</h3>
            </div>
            <Separator className="mb-3" />
            <PriceAlertsList />
          </Card>

          <Card className="p-4">
            <GiftCardManager />
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell size={16} className="text-amber-600" />
              <h3 className="font-semibold text-sm">Notification preferences</h3>
            </div>
            <Separator className="mb-3" />
            <div className="space-y-3 text-sm">
              <NotifRow label="Order updates" desc="Shipping, delivery & status" checked={notifications.orders} onChange={(v) => setNotifications({ ...notifications, orders: v })} />
              <NotifRow label="Deals & promotions" desc="Personalized offers and discounts" checked={notifications.deals} onChange={(v) => setNotifications({ ...notifications, deals: v })} />
              <NotifRow label="Weekly newsletter" desc="Product news and inspiration" checked={notifications.newsletter} onChange={(v) => setNotifications({ ...notifications, newsletter: v })} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1.5 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function QuickLink({ icon: Icon, title, sub, onClick }: { icon: any; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left">
      <Card className="flex items-center gap-3 p-4 transition hover:border-amber-300 hover:shadow-sm">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </Card>
    </button>
  )
}

function NotifRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
