// Shared domain types used across the client

export type ProductVariant = {
  colors?: Array<{ name: string; hex: string; stock: number; priceDelta?: number }>
  sizes?: Array<{ name: string; stock: number; priceDelta?: number }>
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string
  brand: string
  price: number
  compareAt: number | null
  currency: string
  images: string[]
  rating: number
  ratingCount: number
  stock: number
  isFeatured: boolean
  tags: string[]
  specs: Record<string, string> | null
  variants: ProductVariant | null
  categoryId: string
  category?: Category
}

export type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  image?: string | null
}

export type Review = {
  id: string
  author: string
  rating: number
  title: string
  comment: string
  images?: string[]
  verified: boolean
  helpful?: number
  createdAt: string
}

export type CartItem = {
  productId: string
  name: string
  slug: string
  brand: string
  price: number
  image: string
  quantity: number
  stock: number
  variantSelection?: {
    color?: { name: string; hex: string }
    size?: { name: string }
  }
  variantKey?: string // unique key per variant combo for cart line uniqueness
}

export type User = {
  id: string
  email: string
  name: string
  role: string
  loyaltyPoints?: number
}

export type Address = {
  id?: string
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
}

export type Order = {
  id: string
  orderNumber: string
  status: string
  itemsTotal: number
  shippingTotal: number
  taxTotal: number
  discountTotal: number
  grandTotal: number
  currency: string
  shippingAddress: Address
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  items: OrderItem[]
}

export type OrderItem = {
  id: string
  productId: string
  name: string
  image: string
  brand: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export type View =
  | { name: 'home' }
  | { name: 'shop'; categorySlug?: string; query?: string }
  | { name: 'product'; productId: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'orders' }
  | { name: 'order'; orderId: string }
  | { name: 'wishlist' }
  | { name: 'deals' }
  | { name: 'compare' }
  | { name: 'account' }
  | { name: 'admin'; tab?: 'overview' | 'products' | 'orders' | 'customers' | 'reviews' }
  | { name: 'recent-searches' }
