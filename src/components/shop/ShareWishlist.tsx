'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2, Copy, Check, Link2, Mail, MessageCircle, X, Sparkles, Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { useWishlist } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { toast } from 'sonner'

/**
 * Generates a shareable link to the current user's wishlist.
 * The link encodes the product IDs as a URL hash so it works without a backend.
 * Format: /?wishlist=product1,product2,...
 */
export function ShareWishlistButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const productIds = useWishlist((s) => s.productIds)

  function generateLink() {
    if (typeof window === 'undefined') return ''
    const ids = productIds.join(',')
    return `${window.location.origin}/?wishlist=${encodeURIComponent(ids)}`
  }

  function copyLink() {
    const link = generateLink()
    navigator.clipboard?.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Wishlist link copied to clipboard!')
  }

  function shareNative() {
    const link = generateLink()
    if (navigator.share) {
      navigator.share({
        title: 'My VeloMarket Wishlist',
        text: `Check out my wishlist on VeloMarket!`,
        url: link,
      }).catch(() => {})
    } else {
      copyLink()
    }
  }

  if (productIds.length === 0) return null

  const link = generateLink()

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Share2 size={13} className="mr-1.5" /> Share wishlist
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 size={18} className="text-violet-600" /> Share your wishlist
            </DialogTitle>
            <DialogDescription>
              Anyone with this link can view your {productIds.length} saved item{productIds.length === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Link preview */}
            <div className="flex gap-1.5">
              <Input
                readOnly
                value={link}
                className="h-9 text-xs font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
                {copied ? <><Check size={13} className="mr-1 text-emerald-600" /> Copied!</> : <><Copy size={13} className="mr-1" /> Copy</>}
              </Button>
            </div>

            <div className="text-[10px] text-muted-foreground">
              <Sparkles size={10} className="mr-0.5 inline text-violet-500" />
              Link encodes product IDs in the URL — works even without an account.
            </div>

            {/* Share options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={shareNative}
                className="flex flex-col items-center gap-1 rounded-lg border-2 border-border p-3 transition hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  <Link2 size={16} />
                </div>
                <span className="text-[10px] font-medium">More...</span>
              </button>
              <a
                href={`mailto:?subject=My VeloMarket Wishlist&body=Check out my wishlist: ${encodeURIComponent(link)}`}
                className="flex flex-col items-center gap-1 rounded-lg border-2 border-border p-3 transition hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <Mail size={16} />
                </div>
                <span className="text-[10px] font-medium">Email</span>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out my VeloMarket wishlist: ${link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg border-2 border-border p-3 transition hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <MessageCircle size={16} />
                </div>
                <span className="text-[10px] font-medium">WhatsApp</span>
              </a>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
              <Heart size={12} className="text-rose-500" />
              {productIds.length} item{productIds.length === 1 ? '' : 's'} in wishlist
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Hook to parse shared wishlist from URL on initial load
export function useSharedWishlist() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const shared = params.get('wishlist')
    if (!shared) return

    const ids = shared.split(',').filter(Boolean)
    if (ids.length === 0) return

    // Add all shared product IDs to the local wishlist
    const store = useWishlist.getState()
    ids.forEach((id) => {
      if (!store.productIds.includes(id)) {
        store.toggle(id)
      }
    })

    // Clean the URL
    const url = new URL(window.location.href)
    url.searchParams.delete('wishlist')
    window.history.replaceState({}, '', url.toString())

    toast.success(`Added ${ids.length} item${ids.length === 1 ? '' : 's'} from shared wishlist!`)
  }, [])
}
