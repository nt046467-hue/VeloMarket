'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Plus, Check, Trash2, Star, Home as HomeIcon, Building2, Briefcase, Edit3, X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { fetcher } from '@/lib/api-client'
import { toast } from 'sonner'
import type { Address } from '@/lib/types'
import { cn } from '@/lib/utils'

type FullAddress = Address & { id?: string; isDefault?: boolean; createdAt?: string }

export function AddressBook({
  selectable = false,
  selectedId,
  onSelect,
  compact = false,
}: {
  selectable?: boolean
  selectedId?: string | null
  onSelect?: (addr: FullAddress) => void
  compact?: boolean
}) {
  const [addresses, setAddresses] = useState<FullAddress[] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FullAddress | null>(null)
  const [form, setForm] = useState<FullAddress>(emptyAddress())

  const loadAddresses = useCallback(() => {
    setAddresses(null)
    fetcher<{ addresses: FullAddress[] }>('/api/addresses')
      .then((d) => setAddresses(d?.addresses ?? []))
      .catch(() => setAddresses([]))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAddresses()
  }, [loadAddresses])

  function openAdd() {
    setEditing(null)
    setForm(emptyAddress())
    setDialogOpen(true)
  }

  function openEdit(addr: FullAddress) {
    setEditing(addr)
    setForm({ ...addr })
    setDialogOpen(true)
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName || !form.phone || !form.line1 || !form.city || !form.state || !form.zip) {
      toast.error('Please complete all required fields')
      return
    }
    try {
      await fetcher('/api/addresses', {
        method: 'POST',
        body: JSON.stringify({ ...form, action: 'save' }),
      })
      toast.success(editing ? 'Address updated' : 'Address saved')
      setDialogOpen(false)
      loadAddresses()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save address')
    }
  }

  async function deleteAddress(id: string) {
    try {
      await fetcher('/api/addresses', {
        method: 'POST',
        body: JSON.stringify({ id, action: 'delete' }),
      })
      toast.success('Address deleted')
      loadAddresses()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  async function setDefault(id: string) {
    try {
      await fetcher('/api/addresses', {
        method: 'POST',
        body: JSON.stringify({ id, action: 'setDefault' }),
      })
      toast.success('Default address updated')
      loadAddresses()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  if (addresses === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div>
      {addresses.length === 0 ? (
        <Card className="border-dashed bg-muted/20 p-6 text-center">
          <MapPin size={28} className="mx-auto text-muted-foreground/60" />
          <h3 className="mt-2 text-sm font-semibold">No saved addresses yet</h3>
          <p className="text-xs text-muted-foreground">Save addresses to speed up checkout next time.</p>
          <Button size="sm" className="mt-3 bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500" onClick={openAdd}>
            <Plus size={14} className="mr-1" /> Add address
          </Button>
        </Card>
      ) : (
        <>
          <div className={cn('grid gap-3', compact ? 'sm:grid-cols-1' : 'sm:grid-cols-2')}>
            {addresses.map((addr, i) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <Card
                  className={cn(
                    'relative cursor-pointer p-3 transition-all',
                    selectable && selectedId === addr.id
                      ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/40 dark:bg-amber-500/10'
                      : 'hover:border-amber-300/60 dark:hover:border-amber-500/40'
                  )}
                  onClick={() => selectable && onSelect?.(addr)}
                >
                  {selectable && (
                    <div className={cn(
                      'absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border-2',
                      selectedId === addr.id ? 'border-amber-500 bg-amber-500 text-white' : 'border-muted'
                    )}>
                      {selectedId === addr.id && <Check size={11} />}
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      {guessIcon(addr)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{addr.fullName}</span>
                        {addr.isDefault && (
                          <Badge variant="outline" className="gap-0.5 border-amber-300 text-[10px] text-amber-700 dark:text-amber-300">
                            <Star size={9} className="fill-amber-400 text-amber-400" /> Default
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                        {addr.city}, {addr.state} {addr.zip}<br />
                        {addr.country} · {addr.phone}
                      </p>
                      {!selectable && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {!addr.isDefault && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={(e) => { e.stopPropagation(); setDefault(addr.id!) }}>
                              <Star size={10} className="mr-0.5" /> Set default
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={(e) => { e.stopPropagation(); openEdit(addr) }}>
                            <Edit3 size={10} className="mr-0.5" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-rose-600 hover:text-rose-700" onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id!) }}>
                            <Trash2 size={10} className="mr-0.5" /> Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          {!compact && (
            <Button variant="outline" size="sm" className="mt-3" onClick={openAdd}>
              <Plus size={14} className="mr-1.5" /> Add new address
            </Button>
          )}
        </>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit address' : 'Add a new address'}</DialogTitle>
            <DialogDescription className="sr-only">Address form</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveAddress} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Full name *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
              <FormField label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+1 (555) 000-0000" />
            </div>
            <FormField label="Address line 1 *" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} />
            <FormField label="Address line 2" value={form.line2 || ''} onChange={(v) => setForm({ ...form, line2: v })} placeholder="Apt, suite (optional)" />
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="City *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <FormField label="State *" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              <FormField label="ZIP *" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
            </div>
            <FormField label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-input accent-amber-500"
              />
              Set as default address
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500">
                {editing ? 'Save changes' : 'Save address'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function emptyAddress(): FullAddress {
  return {
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    isDefault: false,
  }
}

function guessIcon(addr: FullAddress) {
  const s = `${addr.line1} ${addr.line2 || ''}`.toLowerCase()
  if (/apt|apartment|suite|unit/.test(s)) return <Building2 size={16} />
  if (/office|corp|building|tower/.test(s)) return <Briefcase size={16} />
  return <HomeIcon size={16} />
}

function FormField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-9 text-sm"
      />
    </div>
  )
}
