'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, User, Check, ShieldCheck, Sparkles } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useUI, useAuth } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { toast } from 'sonner'

export function AuthModal() {
  const { authModalOpen, closeAuth, authMode, openAuth } = useUI()
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  function close() {
    closeAuth()
    setForm({ name: '', email: '', password: '' })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = authMode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }
      const res = await fetcher<{ user: any; error?: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (res?.user) {
        setUser(res.user)
        toast.success(authMode === 'login' ? `Welcome back, ${res.user.name}!` : `Account created — welcome, ${res.user.name}!`)
        close()
      } else {
        throw new Error(res?.error || 'Authentication failed')
      }
    } catch (e: any) {
      toast.error(e.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo() {
    setForm({ name: 'Demo User', email: 'demo@velomarket.com', password: 'demo1234' })
    toast.info('Demo credentials filled — click Sign in')
  }

  return (
    <Dialog open={authModalOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        {/* Top banner */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-6 pb-5 pt-6 text-zinc-900">
          <DialogHeader className="space-y-1 p-0">
            <div className="mb-2 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900 text-amber-400">
                <span className="text-base font-black">V</span>
              </div>
              <span className="text-sm font-bold">VeloMarket</span>
            </div>
            <DialogTitle className="text-2xl font-black">
              {authMode === 'login' ? 'Welcome back' : 'Create your account'}
            </DialogTitle>
            <DialogDescription className="text-zinc-800/80">
              {authMode === 'login'
                ? 'Sign in to continue shopping your favorite products.'
                : 'Join VeloMarket for a faster checkout and exclusive perks.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-2">
          <form onSubmit={submit} className="space-y-3">
            <AnimatePresence mode="wait">
              {authMode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label htmlFor="auth-name" className="text-xs">Full name</Label>
                  <div className="relative mt-1">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="auth-name" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="pl-9"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="auth-email" className="text-xs">Email address</Label>
              <div className="relative mt-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="auth-password" className="text-xs">Password</Label>
              <div className="relative mt-1">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-password" type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={authMode === 'login' ? 'Your password' : 'At least 6 characters'}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {authMode === 'login' && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-amber-400 text-zinc-900 hover:bg-amber-500">
              {loading
                ? <><Loader2 size={16} className="mr-2 animate-spin" /> Please wait...</>
                : authMode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={fillDemo}>
            Try with demo account
          </Button>


          <div className="text-center text-xs text-muted-foreground">
            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => openAuth(authMode === 'login' ? 'register' : 'login')}
              className="font-semibold text-amber-700 hover:underline"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck size={12} className="text-emerald-500" />
            Secured with 256-bit encryption
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
