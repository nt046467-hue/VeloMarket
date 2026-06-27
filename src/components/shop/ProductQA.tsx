'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircleQuestion, Send, ThumbsUp, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, HelpCircle, Inbox,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth, useUI } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { formatDate, truncate } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Question = {
  id: string
  author: string
  question: string
  answer: string | null
  answerAuthor: string | null
  answeredAt: string | null
  helpfulQ: number
  helpfulA: number
  createdAt: string
}

export function ProductQA({ productId }: { productId: string }) {
  const { user } = useAuth()
  const { openAuth } = useUI()
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [asking, setAsking] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [votedQ, setVotedQ] = useState<Set<string>>(new Set())
  const [votedA, setVotedA] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setQuestions(null)
    fetcher<{ questions: Question[] }>(`/api/questions?productId=${productId}`)
      .then((d) => { if (!cancelled) setQuestions(d?.questions ?? []) })
      .catch(() => { if (!cancelled) setQuestions([]) })
    return () => { cancelled = true }
  }, [productId])

  async function ask() {
    if (!user) { openAuth('login'); return }
    if (!questionText.trim()) return
    setAsking(true)
    try {
      const res = await fetcher<{ question: Question }>('/api/questions', {
        method: 'POST',
        body: JSON.stringify({ action: 'ask', productId, question: questionText.trim() }),
      })
      if (res?.question) {
        setQuestions((arr) => [res.question, ...(arr ?? [])])
        setQuestionText('')
        toast.success('Question posted!')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to post')
    } finally {
      setAsking(false)
    }
  }

  async function answer(qId: string) {
    if (!user) { openAuth('login'); return }
    if (!answerText.trim()) return
    setSubmittingId(qId)
    try {
      const res = await fetcher<{ question: Partial<Question> }>('/api/questions', {
        method: 'POST',
        body: JSON.stringify({ action: 'answer', questionId: qId, answer: answerText.trim() }),
      })
      if (res?.question) {
        setQuestions((arr) => (arr ?? []).map((q) =>
          q.id === qId ? { ...q, ...res.question } : q
        ))
        setAnswerText('')
        setExpandedId(null)
        toast.success('Answer posted — thanks for helping!')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to post')
    } finally {
      setSubmittingId(null)
    }
  }

  async function vote(qId: string, type: 'helpfulQ' | 'helpfulA') {
    const votedSet = type === 'helpfulQ' ? votedQ : votedA
    if (votedSet.has(qId)) return
    if (type === 'helpfulQ') setVotedQ((s) => new Set([...s, qId]))
    else setVotedA((s) => new Set([...s, qId]))
    setQuestions((arr) => (arr ?? []).map((q) =>
      q.id === qId ? { ...q, [type]: q[type] + 1 } : q
    ))
    try {
      await fetcher('/api/questions', {
        method: 'POST',
        body: JSON.stringify({ action: type, questionId: qId }),
      })
    } catch {
      // revert on error
      setQuestions((arr) => (arr ?? []).map((q) =>
        q.id === qId ? { ...q, [type]: q[type] - 1 } : q
      ))
    }
  }

  const answeredCount = (questions ?? []).filter((q) => q.answer).length

  return (
    <section id="qa" className="mt-12 scroll-mt-32">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
        <MessageCircleQuestion size={20} className="text-violet-600" />
        Customer Questions & Answers
        {questions && questions.length > 0 && (
          <Badge variant="outline" className="ml-1 text-[10px]">
            {answeredCount}/{questions.length} answered
          </Badge>
        )}
      </h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ask form */}
        <Card className="lg:col-span-1 h-fit p-4 bg-gradient-to-br from-violet-50 to-amber-50 dark:from-violet-900/20 dark:to-amber-900/10">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <HelpCircle size={14} className="text-violet-600" /> Have a question?
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Get answers from the community and VeloMarket experts.
          </p>
          <Textarea
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g., Is this product compatible with...?"
            maxLength={500}
            className="mt-3 bg-white text-sm dark:bg-zinc-900"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{questionText.length}/500</span>
            <Button size="sm" onClick={ask} disabled={asking || !questionText.trim()} className="bg-violet-600 hover:bg-violet-700 text-white">
              {asking ? <><Loader2 size={12} className="mr-1 animate-spin" /> Posting...</> : <><Send size={12} className="mr-1" /> Ask</>}
            </Button>
          </div>
          {!user && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              <button onClick={() => openAuth('login')} className="text-violet-700 hover:underline dark:text-violet-400">Sign in</button> to ask or answer
            </p>
          )}
        </Card>

        {/* Questions list */}
        <div className="lg:col-span-2 space-y-3">
          {questions === null ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : questions.length === 0 ? (
            <Card className="p-8 text-center">
              <Inbox size={28} className="mx-auto text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium">No questions yet</p>
              <p className="text-xs text-muted-foreground">Be the first to ask about this product!</p>
            </Card>
          ) : (
            <AnimatePresence>
              {questions.map((q, i) => {
                const isExpanded = expandedId === q.id
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  >
                    <Card className={cn('overflow-hidden transition-all', q.answer && 'border-l-4 border-l-emerald-400')}>
                      <div className="p-4">
                        {/* Question */}
                        <div className="flex items-start gap-2.5">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                            <HelpCircle size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xs font-medium text-violet-700 dark:text-violet-300">{q.author}</span>
                              <span className="text-[10px] text-muted-foreground">{formatDate(q.createdAt)}</span>
                            </div>
                            <p className="mt-0.5 text-sm">{q.question}</p>
                          </div>
                        </div>

                        {/* Helpful Q */}
                        <div className="mt-2 flex items-center gap-2 pl-9">
                          <button
                            onClick={() => vote(q.id, 'helpfulQ')}
                            className={cn(
                              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition',
                              votedQ.has(q.id) ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300' : 'border-border hover:border-violet-300 hover:text-violet-700'
                            )}
                          >
                            <ThumbsUp size={9} /> Helpful {q.helpfulQ > 0 && <span className="font-semibold">({q.helpfulQ})</span>}
                          </button>
                          {!q.answer && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : q.id)}
                              className="text-[10px] text-violet-700 hover:underline dark:text-violet-400"
                            >
                              {isExpanded ? 'Cancel' : 'Answer this'}
                            </button>
                          )}
                        </div>

                        {/* Answer */}
                        {q.answer && (
                          <div className="mt-3 flex items-start gap-2.5 border-t border-border/40 pt-3 pl-2">
                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              <CheckCircle2 size={13} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                  {q.answerAuthor} <span className="text-muted-foreground">· answered</span>
                                </span>
                                {q.answeredAt && <span className="text-[10px] text-muted-foreground">{formatDate(q.answeredAt)}</span>}
                              </div>
                              <p className="mt-0.5 text-sm">{q.answer}</p>
                              <button
                                onClick={() => vote(q.id, 'helpfulA')}
                                className={cn(
                                  'mt-2 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition',
                                  votedA.has(q.id) ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-border hover:border-emerald-300 hover:text-emerald-700'
                                )}
                              >
                                <ThumbsUp size={9} /> Helpful {q.helpfulA > 0 && <span className="font-semibold">({q.helpfulA})</span>}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline answer form */}
                        <AnimatePresence>
                          {isExpanded && !q.answer && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 border-t border-border/40 pt-3">
                                <Textarea
                                  rows={2}
                                  value={answerText}
                                  onChange={(e) => setAnswerText(e.target.value)}
                                  placeholder="Share your knowledge..."
                                  maxLength={1000}
                                  className="text-sm"
                                />
                                <div className="mt-1.5 flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => { setExpandedId(null); setAnswerText('') }}>Cancel</Button>
                                  <Button
                                    size="sm"
                                    onClick={() => answer(q.id)}
                                    disabled={submittingId === q.id || !answerText.trim()}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                  >
                                    {submittingId === q.id ? <Loader2 size={11} className="mr-1 animate-spin" /> : <Send size={11} className="mr-1" />}
                                    Post answer
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  )
}
