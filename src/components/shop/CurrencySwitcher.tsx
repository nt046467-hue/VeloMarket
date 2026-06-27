'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useCurrency, CURRENCIES, getCurrency } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CurrencySwitcher() {
  const code = useCurrency((s) => s.code)
  const setCode = useCurrency((s) => s.setCode)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const current = getCurrency(code)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Switch currency"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-amber-300/40 dark:text-amber-100 dark:hover:bg-amber-500/20"
        >
          <DollarSign size={12} />
          <span>{mounted ? current.code : 'USD'}</span>
          <ChevronDown size={10} className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs">Display currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CURRENCIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => {
              setCode(c.code)
              toast.success(`Currency switched to ${c.name} (${c.code})`)
            }}
            className="gap-2"
          >
            <span className="grid h-6 w-6 place-items-center rounded bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              {c.symbol}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium">{c.code}</div>
              <div className="text-[10px] text-muted-foreground">{c.name}</div>
            </div>
            {mounted && code === c.code && <Check size={14} className="text-amber-600" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
          Rates are illustrative for demo only. Prices update instantly across the site.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
