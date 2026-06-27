'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Send, Bot, User as UserIcon, Sparkles, Loader2,
  ChevronDown, Trash2, ShoppingCart, Truck, RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetcher } from '@/lib/api-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Msg = { role: 'user' | 'assistant'; content: string }

const WELCOME: Msg = {
  role: 'assistant',
  content: "Hi there! 👋 I'm Zoe, your VeloMarket assistant. How can I help you today? You can ask me about products, orders, shipping, returns, or anything else!",
}

const SUGGESTIONS = [
  { icon: ShoppingCart, label: 'Track my order', message: 'How can I track my order?' },
  { icon: Truck, label: 'Shipping info', message: 'What are your shipping options and costs?' },
  { icon: RotateCcw, label: 'Return policy', message: 'What is your return policy?' },
  { icon: Sparkles, label: 'Recommend a product', message: 'Can you recommend a good gift under $100?' },
]

export function LiveChatWidget() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [messages, setMessages] = useState<Msg[]>([WELCOME])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const sessionIdRef = useRef<string>(`chat-${Date.now()}`)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dismissed, setDismissed] = useState(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Auto-show after 12s if not opened or dismissed
  useEffect(() => {
    if (dismissed) return
    const t = setTimeout(() => {
      if (!open && unread === 0) {
        // Just a visual hint via pulse — don't auto-open
      }
    }, 12000)
    return () => clearTimeout(t)
  }, [dismissed, open, unread])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || sending) return
    setShowSuggestions(false)
    const userMsg: Msg = { role: 'user', content }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    try {
      const res = await fetcher<{ response: string }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: content,
          sessionId: sessionIdRef.current,
          history: nextMessages.slice(1, -1), // exclude welcome + current
        }),
      })
      if (res?.response) {
        setMessages((m) => [...m, { role: 'assistant', content: res.response }])
        if (!open) setUnread((u) => u + 1)
      } else {
        throw new Error('No response')
      }
    } catch (e: any) {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: "I'm having trouble responding right now. Please try again or email support@velomarket.com.",
      }])
    } finally {
      setSending(false)
    }
  }

  function clearChat() {
    setMessages([WELCOME])
    setShowSuggestions(true)
    sessionIdRef.current = `chat-${Date.now()}`
    fetcher(`/api/chat?sessionId=${sessionIdRef.current}`, { method: 'DELETE' }).catch(() => {})
    toast.success('Chat cleared')
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && !dismissed && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            aria-label="Open chat support"
            className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-white shadow-xl ring-2 ring-violet-300/40 transition hover:shadow-2xl sm:bottom-6"
          >
            <MessageCircle size={20} className="shrink-0" />
            <span className="hidden text-sm font-semibold sm:inline">Ask Zoe</span>
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold">
                {unread}
              </span>
            )}
            <span className="absolute right-0 top-0 -z-10 h-full w-full animate-ping rounded-full bg-violet-500 opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="fixed bottom-4 right-4 z-50 flex h-[560px] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl sm:w-[400px] dark:border-violet-500/30 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-fuchsia-600 p-3 text-white">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur">
                    <Bot size={18} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-violet-600 bg-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    Zoe <Badge className="bg-white/20 px-1 py-0 text-[9px] font-medium hover:bg-white/30">AI</Badge>
                  </div>
                  <div className="text-[10px] text-white/80">Online · replies instantly</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={clearChat} className="grid h-7 w-7 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" aria-label="Clear chat">
                  <Trash2 size={13} />
                </button>
                <button onClick={() => { setOpen(false); setDismissed(false) }} className="grid h-7 w-7 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" aria-label="Minimize">
                  <ChevronDown size={16} />
                </button>
                <button onClick={() => { setOpen(false); setDismissed(true) }} className="grid h-7 w-7 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-violet-50/30 to-amber-50/20 p-3 scrollbar-thin dark:from-violet-950/10 dark:to-zinc-900">
              {messages.map((m, i) => (
                <Bubble key={i} msg={m} animate={i > 0} />
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BotAvatar />
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border/60 bg-white px-3 py-2.5 dark:bg-zinc-800">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" style={{ animationDelay: '120ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" style={{ animationDelay: '240ms' }} />
                  </div>
                </div>
              )}

              {/* Suggestion chips */}
              {showSuggestions && messages.length <= 1 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">Quick questions</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => send(s.message)}
                        className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-left text-[11px] font-medium text-violet-800 transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-500/30 dark:bg-zinc-800 dark:text-violet-300 dark:hover:bg-violet-900/20"
                      >
                        <s.icon size={11} className="shrink-0" /> {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/60 bg-white p-2 dark:bg-zinc-900">
              <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="h-9 flex-1 rounded-full border border-input bg-muted/40 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-zinc-800"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white hover:opacity-90"
                  disabled={!input.trim() || sending}
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </Button>
              </form>
              <p className="mt-1 text-center text-[9px] text-muted-foreground">
                Powered by Velo AI · Responses are AI-generated
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Bubble({ msg, animate }: { msg: Msg; animate?: boolean }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex items-end gap-2', isUser && 'flex-row-reverse')}
    >
      {isUser ? (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-400 text-zinc-900">
          <UserIcon size={13} />
        </div>
      ) : (
        <BotAvatar />
      )}
      <div
        className={cn(
          'max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm',
          isUser
            ? 'rounded-br-sm bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-900'
            : 'rounded-bl-sm border border-border/60 bg-white text-foreground dark:bg-zinc-800'
        )}
      >
        {msg.content}
      </div>
    </motion.div>
  )
}

function BotAvatar() {
  return (
    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
      <Bot size={13} />
    </div>
  )
}
