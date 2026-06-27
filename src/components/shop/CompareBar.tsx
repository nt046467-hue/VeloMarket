'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCompare, useView } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import type { Product } from '@/lib/types'
import { ProductImage } from './ProductImage'
import { useCurrencyFormatter } from '@/lib/use-currency'

export function CompareBar() {
  const productIds = useCompare((s) => s.productIds)
  const remove = useCompare((s) => s.remove)
  const clear = useCompare((s) => s.clear)
  const navigate = useView((s) => s.navigate)
  const [products, setProducts] = useState<Product[]>([])
  const formatCurrency = useCurrencyFormatter()

  useEffect(() => {
    if (productIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([])
      return
    }
    let cancelled = false
    Promise.all(
      productIds.map((id) =>
        fetcher<{ product: Product }>(`/api/products?id=${id}`)
          .then((d) => d?.product).catch(() => null)
      )
    ).then((ps) => { if (!cancelled) setProducts(ps.filter(Boolean) as Product[]) })
    return () => { cancelled = true }
  }, [productIds])

  return (
    <AnimatePresence>
      {products.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="fixed inset-x-2 bottom-2 z-30 mx-auto max-w-5xl sm:inset-x-4 sm:bottom-4"
        >
          <div className="rounded-xl border border-amber-200/60 bg-white/95 p-3 shadow-2xl backdrop-blur-md dark:border-amber-500/30 dark:bg-zinc-900/95">
            <div className="flex items-center gap-3">
              <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  <GitCompare size={18} />
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-bold">Compare</div>
                  <div className="text-[10px] text-muted-foreground">{products.length}/3 selected</div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="group relative flex shrink-0 items-center gap-2 rounded-lg border border-border/60 bg-muted/40 p-1.5 pr-7"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-muted/30">
                      <ProductImage src={p.images[0]} alt={p.name} sizes="40px" />
                    </div>
                    <div className="leading-tight">
                      <div className="max-w-[120px] truncate text-xs font-medium">{p.name}</div>
                      <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-500">{formatCurrency(p.price)}</div>
                    </div>
                    <button
                      onClick={() => remove(p.id)}
                      aria-label="Remove from compare"
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-zinc-200/70 text-zinc-700 hover:bg-rose-100 hover:text-rose-600 dark:bg-zinc-700 dark:text-zinc-200"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={clear} className="hidden sm:inline-flex text-xs">
                  Clear
                </Button>
                <Button
                  size="sm"
                  disabled={products.length < 2}
                  onClick={() => navigate({ name: 'compare' })}
                  className="bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500"
                >
                  Compare <ArrowRight size={13} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
