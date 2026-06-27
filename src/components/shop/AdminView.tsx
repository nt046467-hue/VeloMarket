'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle,
  Search, Plus, Edit3, Trash2, Star, Eye, EyeOff, RefreshCw, Loader2,
  LayoutDashboard, ChevronRight, X, Check, Crown, Truck, Clock, Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useAuth, useView } from '@/lib/store'
import { fetcher } from '@/lib/api-client'
import { useCurrencyFormatter } from '@/lib/use-currency'
import { formatCurrency, formatDateTime, truncate } from '@/lib/format'
import { VariantEditor } from './VariantEditor'
import { toast } from 'sonner'
import type { Category, Order } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'products' | 'orders' | 'customers' | 'reviews'

type Stats = {
  totals: {
    products: number
    activeProducts: number
    lowStockProducts: number
    orders: number
    users: number
    revenue: number
  }
  ordersByStatus: Record<string, number>
  recentOrders: Array<{
    id: string
    orderNumber: string
    status: string
    grandTotal: number
    userName: string
    itemCount: number
    createdAt: string
  }>
  topProducts: Array<{
    productId: string
    name: string
    image: string
    brand: string
    totalSold: number
  }>
}

type AdminProduct = {
  id: string
  name: string
  slug: string
  brand: string
  price: number
  compareAt: number | null
  stock: number
  rating: number
  ratingCount: number
  isFeatured: boolean
  isActive: boolean
  category: string
  categoryId: string
  images: string[]
  createdAt: string
}

type AdminOrder = {
  id: string
  orderNumber: string
  userName: string
  userEmail: string
  status: string
  paymentStatus: string
  paymentMethod: string
  grandTotal: number
  itemCount: number
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-amber-100 text-amber-800',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

export function AdminView({ initialTab = 'overview' }: { initialTab?: Tab }) {
  const { user } = useAuth()
  const navigate = useView((s) => s.navigate)
  const [tab, setTab] = useState<Tab>(initialTab)

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Crown size={36} className="mx-auto text-amber-500" />
        <h2 className="mt-4 text-2xl font-bold">Sign in required</h2>
        <p className="text-sm text-muted-foreground">Please sign in to access the admin dashboard.</p>
      </div>
    )
  }
  if (user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertTriangle size={36} className="mx-auto text-rose-500" />
        <h2 className="mt-4 text-2xl font-bold">Access denied</h2>
        <p className="text-sm text-muted-foreground">Your account ({user.email}) does not have admin privileges.</p>
        <p className="mt-2 text-xs text-muted-foreground">Tip: the demo account is now an admin — sign out and back in.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <LayoutDashboard size={22} className="text-amber-600" />
            Admin Dashboard
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage products, orders, and view store insights
          </p>
        </div>
        <Badge className="bg-amber-500 text-white">Admin mode</Badge>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border bg-muted/40 p-1 text-sm">
        {([
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'orders', label: 'Orders', icon: ShoppingCart },
          { id: 'customers', label: 'Customers', icon: Users },
          { id: 'reviews', label: 'Reviews', icon: Star },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 font-medium transition',
              tab === t.id ? 'bg-background text-amber-700 shadow-sm dark:text-amber-400' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon size={14} /> <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'overview' && <OverviewTab />}
          {tab === 'products' && <ProductsTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'customers' && <CustomersTab />}
          {tab === 'reviews' && <ReviewsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ---------- Overview Tab ----------
function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const formatCurrencyLocal = useCurrencyFormatter()

  useEffect(() => {
    let cancelled = false
    fetcher<Stats>('/api/admin/stats')
      .then((d) => { if (!cancelled) setStats(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const kpiCards = [
    { label: 'Total Revenue', value: formatCurrencyLocal(stats.totals.revenue), icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
    { label: 'Orders', value: stats.totals.orders.toLocaleString(), icon: ShoppingCart, color: 'from-amber-500 to-orange-600' },
    { label: 'Products', value: stats.totals.products.toLocaleString(), sub: `${stats.totals.activeProducts} active`, icon: Package, color: 'from-violet-500 to-fuchsia-600' },
    { label: 'Customers', value: stats.totals.users.toLocaleString(), icon: Users, color: 'from-blue-500 to-cyan-600' },
  ]

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="relative overflow-hidden">
              <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', kpi.color)} />
              <div className="flex items-start justify-between p-4">
                <div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                  <div className="mt-1 text-2xl font-black">{kpi.value}</div>
                  {kpi.sub && <div className="text-[10px] text-muted-foreground">{kpi.sub}</div>}
                </div>
                <div className={cn('grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br text-white', kpi.color)}>
                  <kpi.icon size={18} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {stats.totals.lowStockProducts > 0 && (
        <Card className="flex items-center gap-3 border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-900/20">
          <AlertTriangle size={18} className="text-amber-600" />
          <div className="text-sm">
            <b>{stats.totals.lowStockProducts}</b> product{stats.totals.lowStockProducts === 1 ? '' : 's'} with low stock (≤ 10 units). <button className="text-amber-700 hover:underline dark:text-amber-400">Review inventory →</button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Orders by status */}
        <Card className="p-4 lg:col-span-1">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <ShoppingCart size={14} className="text-amber-600" /> Orders by status
          </h3>
          <div className="space-y-2">
            {[
              { status: 'pending', label: 'Pending', icon: Clock, color: 'bg-zinc-100 text-zinc-700' },
              { status: 'paid', label: 'Paid', icon: Check, color: 'bg-blue-100 text-blue-700' },
              { status: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-amber-100 text-amber-800' },
              { status: 'delivered', label: 'Delivered', icon: Check, color: 'bg-emerald-100 text-emerald-700' },
              { status: 'cancelled', label: 'Cancelled', icon: X, color: 'bg-rose-100 text-rose-700' },
            ].map((s) => {
              const count = stats.ordersByStatus[s.status] ?? 0
              const pct = stats.totals.orders > 0 ? (count / stats.totals.orders) * 100 : 0
              return (
                <div key={s.status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Badge className={cn('h-4 px-1.5 text-[9px]', s.color)}>{s.label}</Badge>
                    </span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-amber-500"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent orders */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Clock size={14} className="text-amber-600" /> Recent orders
          </h3>
          {stats.recentOrders.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No orders yet</div>
          ) : (
            <div className="space-y-1.5">
              {stats.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-2 rounded-md border border-border/40 p-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-mono font-semibold">{o.orderNumber}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {o.userName} · {o.itemCount} items · {formatDateTime(o.createdAt)}
                    </div>
                  </div>
                  <Badge className={cn('h-5 px-1.5 text-[10px]', STATUS_COLORS[o.status])}>{o.status}</Badge>
                  <span className="text-xs font-bold">{formatCurrencyLocal(o.grandTotal)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top products */}
      {stats.topProducts.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles size={14} className="text-amber-600" /> Best sellers
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {stats.topProducts.map((p, i) => (
              <motion.div
                key={p.productId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-border/40 p-2 text-center"
              >
                <div className="relative mx-auto mb-2 h-16 w-16 overflow-hidden rounded-md bg-muted/30">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  <span className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <div className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-500">{p.brand}</div>
                <div className="truncate text-xs font-medium" title={p.name}>{truncate(p.name, 28)}</div>
                <div className="mt-1 text-sm font-bold">{p.totalSold} sold</div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ---------- Products Tab ----------
function ProductsTab() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low-stock' | 'featured' | 'inactive'>('all')
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(() => {
    setProducts(null)
    fetcher<{ products: AdminProduct[] }>('/api/admin/products')
      .then((d) => setProducts(d?.products ?? []))
      .catch(() => setProducts([]))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])
  useEffect(() => {
    fetcher<{ categories: Category[] }>('/api/categories').then((d) => setCategories(d?.categories ?? []))
  }, [])

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(p: AdminProduct) {
    setEditing(p)
    setDialogOpen(true)
  }

  const filtered = (products ?? []).filter((p) => {
    if (filter === 'low-stock' && p.stock > 10) return false
    if (filter === 'featured' && !p.isFeatured) return false
    if (filter === 'inactive' && p.isActive) return false
    if (search && !`${p.name} ${p.brand} ${p.slug}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function toggleField(p: AdminProduct, field: 'isFeatured' | 'isActive') {
    try {
      await fetcher('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ id: p.id, action: field === 'isFeatured' ? 'toggleFeatured' : 'toggleActive' }),
      })
      toast.success(`${field === 'isFeatured' ? 'Featured' : 'Active'} status updated`)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  async function deleteProduct(p: AdminProduct) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    try {
      const res = await fetcher<{ ok: boolean; softDeleted?: boolean }>('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ id: p.id, action: 'delete' }),
      })
      toast.success(res?.softDeleted ? 'Marked inactive (has order history)' : 'Product deleted')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            <SelectItem value="low-stock">Low stock</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { load(); toast.success('Refreshed') }} variant="outline" size="sm" className="h-9">
          <RefreshCw size={13} className="mr-1" /> Refresh
        </Button>
        <Button onClick={openNew} size="sm" className="h-9 bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500">
          <Plus size={13} className="mr-1" /> New product
        </Button>
      </div>

      {products === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No products match your filters.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-center">Stock</th>
                  <th className="p-2 text-center">Rating</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                        <div className="min-w-0">
                          <div className="truncate font-medium" title={p.name}>{p.name}</div>
                          <div className="text-[10px] text-muted-foreground">{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-xs">{p.category ?? '—'}</td>
                    <td className="p-2 text-right font-bold">{formatCurrency(p.price)}</td>
                    <td className="p-2 text-center">
                      <span className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-semibold',
                        p.stock === 0 ? 'bg-rose-100 text-rose-700' :
                        p.stock <= 10 ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      )}>{p.stock}</span>
                    </td>
                    <td className="p-2 text-center text-xs">
                      <span className="flex items-center justify-center gap-0.5">
                        <Star size={11} className="fill-amber-400 text-amber-400" /> {p.rating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">({p.ratingCount})</span>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        {p.isFeatured && <Badge className="bg-amber-500 text-white text-[9px]">Featured</Badge>}
                        {!p.isActive && <Badge variant="outline" className="text-[9px]">Inactive</Badge>}
                        {p.isActive && !p.isFeatured && <Badge variant="outline" className="border-emerald-300 text-[9px] text-emerald-700">Active</Badge>}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleField(p, 'isFeatured')} title={p.isFeatured ? 'Unfeature' : 'Feature'}>
                          <Star size={12} className={cn(p.isFeatured && 'fill-amber-400 text-amber-400')} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleField(p, 'isActive')} title={p.isActive ? 'Hide' : 'Show'}>
                          {p.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)} title="Edit">
                          <Edit3 size={12} />
                        </Button>
                        <VariantEditor productId={p.id} productName={p.name} />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => deleteProduct(p)} title="Delete">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ProductEditor
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories}
        onSaved={() => { load(); setDialogOpen(false) }}
      />
    </div>
  )
}

function ProductEditor({
  open, onOpenChange, product, categories, onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  product: AdminProduct | null
  categories: Category[]
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (open) {
      setForm({
        id: product?.id || '',
        name: product?.name || '',
        brand: product?.brand || '',
        description: product?.slug || '', // we'll keep simple: use existing description from API if editing; for new keep blank
        price: product?.price ?? '',
        compareAt: product?.compareAt ?? '',
        stock: product?.stock ?? 0,
        categoryId: product?.categoryId || categories[0]?.id || '',
        images: product?.images?.join('\n') || '',
        isFeatured: product?.isFeatured ?? false,
        isActive: product?.isActive ?? true,
      })
    }
  }, [open, product, categories])

  async function save() {
    setSaving(true)
    try {
      const body = {
        id: form.id || undefined,
        name: form.name,
        brand: form.brand,
        description: form.description || 'A great product from VeloMarket.',
        price: parseFloat(form.price),
        compareAt: form.compareAt ? parseFloat(form.compareAt) : null,
        stock: parseInt(form.stock),
        categoryId: form.categoryId,
        images: form.images.split('\n').map((s: string) => s.trim()).filter(Boolean),
        isFeatured: !!form.isFeatured,
        isActive: form.isActive,
      }
      if (!body.name || !body.brand || isNaN(body.price)) {
        toast.error('Name, brand, and price are required')
        setSaving(false)
        return
      }
      await fetcher('/api/admin/products', { method: 'POST', body: JSON.stringify(body) })
      toast.success(form.id ? 'Product updated' : 'Product created')
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Edit product' : 'Create new product'}</DialogTitle>
          <DialogDescription>Fill in the product details below. Required fields marked with *.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">Name *</Label>
            <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Brand *</Label>
            <Input value={form.brand || ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Price ($) *</Label>
            <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Compare-at ($)</Label>
            <Input type="number" step="0.01" value={form.compareAt} onChange={(e) => setForm({ ...form, compareAt: e.target.value })} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Stock</Label>
            <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 h-9 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Image URLs (one per line)</Label>
            <Textarea
              rows={3}
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
              placeholder="https://..."
              className="mt-1 text-xs"
            />
          </div>
          <label className="flex items-center gap-2 text-xs sm:col-span-2">
            <input type="checkbox" className="h-3.5 w-3.5 accent-amber-500" checked={!!form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            Featured product
          </label>
          <label className="flex items-center gap-2 text-xs sm:col-span-2">
            <input type="checkbox" className="h-3.5 w-3.5 accent-amber-500" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active (visible to customers)
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-amber-400 text-zinc-900 hover:bg-amber-500 dark:bg-amber-500">
            {saving ? <><Loader2 size={13} className="mr-1 animate-spin" /> Saving...</> : form.id ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Orders Tab ----------
function OrdersTab() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const formatCurrencyLocal = useCurrencyFormatter()
  const navigate = useView((s) => s.navigate)

  const load = useCallback(() => {
    setOrders(null)
    fetcher<{ orders: AdminOrder[] }>(`/api/admin/orders${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)
      .then((d) => setOrders(d?.orders ?? []))
      .catch(() => setOrders([]))
  }, [statusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function updateStatus(o: AdminOrder, status: string) {
    try {
      await fetcher('/api/admin/orders', {
        method: 'POST',
        body: JSON.stringify({ id: o.id, action: 'updateStatus', status }),
      })
      toast.success(`Order ${o.orderNumber} marked ${status}`)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  async function refund(o: AdminOrder) {
    if (!confirm(`Refund order ${o.orderNumber}? This will mark payment as refunded.`)) return
    try {
      await fetcher('/api/admin/orders', { method: 'POST', body: JSON.stringify({ id: o.id, action: 'refund' }) })
      toast.success('Refund processed')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium capitalize transition',
                statusFilter === s ? 'bg-amber-400 text-zinc-900 dark:bg-amber-500' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => { load(); toast.success('Refreshed') }} className="h-9">
          <RefreshCw size={13} className="mr-1" /> Refresh
        </Button>
      </div>

      {orders === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No orders found.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Order</th>
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-center">Items</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2 text-center">Payment</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                    <td className="p-2">
                      <button onClick={() => navigate({ name: 'order', orderId: o.id })} className="font-mono text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400">
                        {o.orderNumber}
                      </button>
                      <div className="text-[10px] text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                    </td>
                    <td className="p-2 text-xs">
                      <div className="font-medium">{o.userName}</div>
                      <div className="text-[10px] text-muted-foreground">{o.userEmail}</div>
                    </td>
                    <td className="p-2 text-center text-xs">{o.itemCount}</td>
                    <td className="p-2 text-right font-bold">{formatCurrencyLocal(o.grandTotal)}</td>
                    <td className="p-2 text-center">
                      <Badge className={cn('h-5 text-[10px]', STATUS_COLORS[o.status])}>{o.status}</Badge>
                    </td>
                    <td className="p-2 text-center text-[10px]">
                      <span className={cn(
                        o.paymentStatus === 'paid' && 'text-emerald-700 dark:text-emerald-300',
                        o.paymentStatus === 'refunded' && 'text-amber-700 dark:text-amber-300',
                        o.paymentStatus === 'failed' && 'text-rose-700',
                      )}>{o.paymentStatus}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              Update <ChevronRight size={11} className="ml-0.5 rotate-90" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[10px] uppercase">Status</DropdownMenuLabel>
                            {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => (
                              <DropdownMenuItem key={s} onClick={() => updateStatus(o, s)} className="text-xs capitalize">
                                {s === o.status && <Check size={11} className="mr-1.5" />}
                                Mark as {s}
                              </DropdownMenuItem>
                            ))}
                            <div className="my-1 border-t border-border/40" />
                            <DropdownMenuItem className="text-xs text-amber-700" onClick={() => refund(o)}>
                              Issue refund
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}


// ---------- Customers Tab ----------
type AdminCustomer = {
  id: string
  email: string
  name: string
  role: string
  loyaltyPoints: number
  banned: boolean
  createdAt: string
  orderCount: number
  reviewCount: number
  wishlistCount: number
  totalSpent: number
}

function CustomersTab() {
  const [customers, setCustomers] = useState<AdminCustomer[] | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'admin' | 'banned' | 'vip'>('all')
  const formatCurrencyLocal = useCurrencyFormatter()

  const load = useCallback(() => {
    setCustomers(null)
    fetcher<{ customers: AdminCustomer[] }>(`/api/admin/customers${search ? `?q=${encodeURIComponent(search)}` : ''}`)
      .then((d) => setCustomers(d?.customers ?? []))
      .catch(() => setCustomers([]))
  }, [search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function toggleBan(c: AdminCustomer) {
    if (c.role === 'admin') {
      toast.error('Cannot ban admin accounts')
      return
    }
    if (!confirm(`${c.banned ? 'Unban' : 'Ban'} ${c.name} (${c.email})?`)) return
    try {
      await fetcher('/api/admin/customers', {
        method: 'POST',
        body: JSON.stringify({ userId: c.id, action: 'toggleBan' }),
      })
      toast.success(c.banned ? 'Account unbanned' : 'Account banned')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  async function adjustPoints(c: AdminCustomer) {
    const input = prompt(`Adjust loyalty points for ${c.name} (current: ${c.loyaltyPoints}).\nUse negative number to subtract.`)
    if (!input) return
    const delta = parseInt(input)
    if (isNaN(delta)) return toast.error('Invalid number')
    try {
      await fetcher('/api/admin/customers', {
        method: 'POST',
        body: JSON.stringify({ userId: c.id, action: 'adjustPoints', delta }),
      })
      toast.success(`${delta > 0 ? 'Added' : 'Subtracted'} ${Math.abs(delta)} points`)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  async function toggleRole(c: AdminCustomer) {
    const newRole = c.role === 'admin' ? 'customer' : 'admin'
    if (!confirm(`${newRole === 'admin' ? 'Promote' : 'Demote'} ${c.name} to ${newRole}?`)) return
    try {
      await fetcher('/api/admin/customers', {
        method: 'POST',
        body: JSON.stringify({ userId: c.id, action: 'setRole', role: newRole }),
      })
      toast.success(`Role updated to ${newRole}`)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  const filtered = (customers ?? []).filter((c) => {
    if (filter === 'admin' && c.role !== 'admin') return false
    if (filter === 'banned' && !c.banned) return false
    if (filter === 'vip' && c.loyaltyPoints < 1000) return false
    return true
  })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="vip">VIP (1000+ pts)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { load(); toast.success('Refreshed') }} variant="outline" size="sm" className="h-9">
          <RefreshCw size={13} className="mr-1" /> Refresh
        </Button>
      </div>

      {customers === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No customers match your filters.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-right">Orders</th>
                  <th className="p-2 text-right">Spent</th>
                  <th className="p-2 text-center">Points</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {c.name}
                            {c.role === 'admin' && <Badge className="ml-1 bg-amber-500 text-white text-[9px]">Admin</Badge>}
                          </div>
                          <div className="truncate text-[10px] text-muted-foreground">{c.email}</div>
                          <div className="text-[9px] text-muted-foreground">
                            Joined {formatDateTime(c.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-right text-xs font-semibold">{c.orderCount}</td>
                    <td className="p-2 text-right font-bold">{formatCurrencyLocal(c.totalSpent)}</td>
                    <td className="p-2 text-center">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{c.loyaltyPoints.toLocaleString()}</span>
                    </td>
                    <td className="p-2 text-center">
                      {c.banned ? (
                        <Badge variant="outline" className="border-rose-300 text-[10px] text-rose-700">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-300 text-[10px] text-emerald-700">Active</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustPoints(c)} title="Adjust points">
                          <Sparkles size={12} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleRole(c)} title="Toggle admin role" disabled={c.email === 'demo@zshop.com'}>
                          <Crown size={12} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleBan(c)} title={c.banned ? 'Unban' : 'Ban'} disabled={c.role === 'admin'}>
                          {c.banned ? <Check size={12} /> : <X size={12} className="text-rose-600" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ---------- Reviews Tab ----------
type AdminReview = {
  id: string
  productId: string
  productName: string
  productImage: string
  author: string
  rating: number
  title: string
  comment: string
  images: string[]
  verified: boolean
  helpful: number
  sentiment: 'positive' | 'neutral' | 'negative' | 'flagged'
  createdAt: string
}

const SENTIMENT_META: Record<string, { label: string; color: string; icon: string }> = {
  positive: { label: 'Positive', color: 'bg-emerald-100 text-emerald-700', icon: '😊' },
  neutral: { label: 'Neutral', color: 'bg-zinc-100 text-zinc-700', icon: '😐' },
  negative: { label: 'Negative', color: 'bg-amber-100 text-amber-700', icon: '⚠️' },
  flagged: { label: 'Flagged', color: 'bg-rose-100 text-rose-700', icon: '🚩' },
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<AdminReview[] | null>(null)
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'flagged'>('all')

  const load = useCallback(() => {
    setReviews(null)
    fetcher<{ reviews: AdminReview[] }>(`/api/admin/reviews${filter !== 'all' ? `?filter=${filter}` : ''}`)
      .then((d) => setReviews(d?.reviews ?? []))
      .catch(() => setReviews([]))
  }, [filter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function deleteReview(r: AdminReview) {
    if (!confirm(`Delete review "${r.title}" by ${r.author}?`)) return
    try {
      await fetcher('/api/admin/reviews', {
        method: 'POST',
        body: JSON.stringify({ id: r.id, action: 'delete' }),
      })
      toast.success('Review deleted')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  // Sentiment summary
  const summary = (reviews ?? []).reduce(
    (acc, r) => { acc[r.sentiment] = (acc[r.sentiment] || 0) + 1; return acc },
    {} as Record<string, number>
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'positive', label: '😊 Positive' },
            { id: 'negative', label: '⚠️ Negative' },
            { id: 'flagged', label: '🚩 Flagged' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                filter === f.id ? 'bg-amber-400 text-zinc-900 dark:bg-amber-500' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              )}
            >
              {f.label}{f.id !== 'all' && summary[f.id] ? ` (${summary[f.id]})` : ''}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => { load(); toast.success('Refreshed') }} className="h-9">
          <RefreshCw size={13} className="mr-1" /> Refresh
        </Button>
      </div>

      {reviews === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <Star size={28} className="mx-auto text-muted-foreground/60" />
          <p className="mt-2">No reviews match your filter.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => {
            const meta = SENTIMENT_META[r.sentiment]
            return (
              <Card key={r.id} className={cn(
                'p-3 transition-colors',
                r.sentiment === 'flagged' && 'border-rose-300 bg-rose-50/50 dark:border-rose-500/30 dark:bg-rose-900/10',
                r.sentiment === 'negative' && 'border-amber-200 dark:border-amber-500/20'
              )}>
                <div className="flex items-start gap-3">
                  <img src={r.productImage || '/placeholder.svg'} alt={r.productName} className="h-12 w-12 shrink-0 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-sm font-semibold">{r.title}</span>
                      <Badge className={cn('text-[9px]', meta.color)}>{meta.icon} {meta.label}</Badge>
                      <span className="flex items-center gap-0.5 text-[10px]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={9} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground'} />
                        ))}
                      </span>
                      {r.verified && (
                        <Badge variant="outline" className="border-emerald-300 text-[9px] text-emerald-700">Verified</Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      By <b>{r.author}</b> on {r.productName} · {formatDateTime(r.createdAt)}
                      {r.helpful > 0 && <span> · 👍 {r.helpful} helpful</span>}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{r.comment}</p>
                    {r.images.length > 0 && (
                      <div className="mt-1.5 flex gap-1">
                        {r.images.slice(0, 4).map((img, i) => (
                          <img key={i} src={img} alt="" className="h-8 w-8 rounded object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-rose-600 hover:bg-rose-50"
                    onClick={() => deleteReview(r)}
                    title="Delete review"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
