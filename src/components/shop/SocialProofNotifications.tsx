'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, MapPin, Clock } from 'lucide-react'

type Notif = {
  id: string
  text: string
  location: string
  time: string
}

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'San Francisco', 'Seattle', 'Boston', 'Miami', 'Denver',
  'Atlanta', 'Portland', 'Austin', 'Dallas', 'Nashville',
]

const ACTIONS = [
  'purchased this',
  'added this to cart',
  'just ordered',
  'bought',
]

/**
 * Shows social proof notifications like "Sarah from New York purchased this 5 minutes ago"
 * on the product detail page.
 */
export function SocialProofNotifications({ productName }: { productName: string }) {
  const [current, setCurrent] = useState<Notif | null>(null)

  useEffect(() => {
    const names = ['Sarah', 'Mike', 'Emily', 'David', 'Jessica', 'Kevin', 'Amanda', 'Chris', 'Lauren', 'Brian']
    
    function generate(): Notif {
      const name = names[Math.floor(Math.random() * names.length)]
      const city = CITIES[Math.floor(Math.random() * CITIES.length)]
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]
      const minutes = Math.floor(Math.random() * 45) + 2
      return {
        id: `${Date.now()}`,
        text: `${name} from ${city} ${action}`,
        location: city,
        time: minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)}h ago`,
      }
    }

    // First notification after 5 seconds
    const firstTimer = setTimeout(() => {
      setCurrent(generate())
    }, 5000)

    return () => clearTimeout(firstTimer)
  }, [productName])

  // Auto-dismiss after 5 seconds, then show next after 15-25s gap
  useEffect(() => {
    if (!current) return
    const dismissTimer = setTimeout(() => setCurrent(null), 5000)
    const nextTimer = setTimeout(() => {
      const names = ['Sarah', 'Mike', 'Emily', 'David', 'Jessica', 'Kevin', 'Amanda', 'Chris', 'Lauren', 'Brian']
      const city = CITIES[Math.floor(Math.random() * CITIES.length)]
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]
      const minutes = Math.floor(Math.random() * 45) + 2
      setCurrent({
        id: `${Date.now()}`,
        text: `${names[Math.floor(Math.random() * names.length)]} from ${city} ${action}`,
        location: city,
        time: minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)}h ago`,
      })
    }, 20000) // next after 20s

    return () => { clearTimeout(dismissTimer); clearTimeout(nextTimer) }
  }, [current])

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: -40, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-4 z-30 flex items-center gap-2.5 rounded-xl border border-emerald-200/60 bg-white/95 p-2.5 shadow-lg backdrop-blur-md dark:border-emerald-500/30 dark:bg-zinc-900/95 sm:bottom-6"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Check size={16} strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold leading-tight">
              {current.text}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin size={9} /> {current.location}
              <span className="mx-0.5">·</span>
              <Clock size={9} /> {current.time}
            </div>
          </div>
          <button
            onClick={() => setCurrent(null)}
            className="ml-1 grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Dismiss"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
