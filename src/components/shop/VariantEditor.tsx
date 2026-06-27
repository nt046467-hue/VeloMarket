'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette, Plus, X, ChevronDown, ChevronUp, Save, Loader2, Shirt, Box,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { fetcher } from '@/lib/api-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ColorVariant = { name: string; hex: string; stock: number; priceDelta?: number }
type SizeVariant = { name: string; stock: number; priceDelta?: number }
type VariantData = { colors?: ColorVariant[]; sizes?: SizeVariant[] }

export function VariantEditor({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false)
  const [variants, setVariants] = useState<VariantData>({ colors: [], sizes: [] })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetcher<{ product: { variants: VariantData | null } }>(`/api/products?id=${productId}`)
      .then((d) => {
        const v = d?.product?.variants
        setVariants({ colors: v?.colors || [], sizes: v?.sizes || [] })
      })
      .catch(() => setVariants({ colors: [], sizes: [] }))
      .finally(() => setLoading(false))
  }, [open, productId])

  function addColor() {
    setVariants((v) => ({
      ...v,
      colors: [...(v.colors || []), { name: '', hex: '#000000', stock: 10, priceDelta: 0 }],
    }))
  }
  function addSize() {
    setVariants((v) => ({
      ...v,
      sizes: [...(v.sizes || []), { name: '', stock: 10, priceDelta: 0 }],
    }))
  }
  function removeColor(i: number) {
    setVariants((v) => ({ ...v, colors: v.colors?.filter((_, idx) => idx !== i) }))
  }
  function removeSize(i: number) {
    setVariants((v) => ({ ...v, sizes: v.sizes?.filter((_, idx) => idx !== i) }))
  }
  function updateColor(i: number, field: keyof ColorVariant, value: string | number) {
    setVariants((v) => ({
      ...v,
      colors: v.colors?.map((c, idx) => idx === i ? { ...c, [field]: value } : c),
    }))
  }
  function updateSize(i: number, field: keyof SizeVariant, value: string | number) {
    setVariants((v) => ({
      ...v,
      sizes: v.sizes?.map((s, idx) => idx === i ? { ...s, [field]: value } : s),
    }))
  }

  async function save() {
    setSaving(true)
    try {
      // Save via admin products endpoint (upsert with variants field)
      await fetcher('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          id: productId,
          action: 'updateVariants',
          variants: {
            colors: variants.colors?.filter((c) => c.name.trim()) || [],
            sizes: variants.sizes?.filter((s) => s.name.trim()) || [],
          },
        }),
      })
      toast.success('Variants updated')
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save variants')
    } finally {
      setSaving(false)
    }
  }

  const hasColors = (variants.colors?.length || 0) > 0
  const hasSizes = (variants.sizes?.length || 0) > 0

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Palette size={12} className="mr-1" /> Variants
        {(hasColors || hasSizes) && (
          <Badge className="ml-1 bg-violet-500 text-white text-[9px]">
            {(variants.colors?.length || 0) + (variants.sizes?.length || 0)}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette size={16} className="text-violet-600" /> Variant Editor
            </DialogTitle>
            <DialogDescription>
              Manage colors and sizes for "{productName}". Changes are live immediately.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="grid place-items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Colors */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="flex items-center gap-1 text-xs font-semibold">
                    <Shirt size={13} className="text-violet-500" /> Colors ({variants.colors?.length || 0})
                  </Label>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={addColor}>
                    <Plus size={11} className="mr-0.5" /> Add color
                  </Button>
                </div>
                <AnimatePresence>
                  {variants.colors?.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-1.5 flex items-center gap-1.5"
                    >
                      <input
                        type="color"
                        value={c.hex}
                        onChange={(e) => updateColor(i, 'hex', e.target.value)}
                        className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border"
                      />
                      <Input
                        value={c.name}
                        onChange={(e) => updateColor(i, 'name', e.target.value)}
                        placeholder="Color name"
                        className="h-8 flex-1 text-xs"
                      />
                      <Input
                        type="number"
                        value={c.stock}
                        onChange={(e) => updateColor(i, 'stock', parseInt(e.target.value) || 0)}
                        placeholder="Stock"
                        className="h-8 w-16 text-xs"
                      />
                      <Input
                        type="number"
                        value={c.priceDelta || 0}
                        onChange={(e) => updateColor(i, 'priceDelta', parseFloat(e.target.value) || 0)}
                        placeholder="+$0"
                        className="h-8 w-14 text-xs"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => removeColor(i)}>
                        <X size={12} />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!hasColors && (
                  <p className="text-[10px] text-muted-foreground">No colors configured. Click "Add color" to start.</p>
                )}
              </div>

              <Separator />

              {/* Sizes */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="flex items-center gap-1 text-xs font-semibold">
                    <Box size={13} className="text-violet-500" /> Sizes ({variants.sizes?.length || 0})
                  </Label>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={addSize}>
                    <Plus size={11} className="mr-0.5" /> Add size
                  </Button>
                </div>
                <AnimatePresence>
                  {variants.sizes?.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-1.5 flex items-center gap-1.5"
                    >
                      <Input
                        value={s.name}
                        onChange={(e) => updateSize(i, 'name', e.target.value)}
                        placeholder="Size (e.g., M, 10, XL)"
                        className="h-8 flex-1 text-xs"
                      />
                      <Input
                        type="number"
                        value={s.stock}
                        onChange={(e) => updateSize(i, 'stock', parseInt(e.target.value) || 0)}
                        placeholder="Stock"
                        className="h-8 w-16 text-xs"
                      />
                      <Input
                        type="number"
                        value={s.priceDelta || 0}
                        onChange={(e) => updateSize(i, 'priceDelta', parseFloat(e.target.value) || 0)}
                        placeholder="+$0"
                        className="h-8 w-14 text-xs"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => removeSize(i)}>
                        <X size={12} />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!hasSizes && (
                  <p className="text-[10px] text-muted-foreground">No sizes configured. Click "Add size" to start.</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white">
                  {saving ? <><Loader2 size={13} className="mr-1 animate-spin" /> Saving...</> : <><Save size={13} className="mr-1" /> Save variants</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
