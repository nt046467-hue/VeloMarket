'use client'

import { useEffect } from 'react'
import { Header } from '@/components/shop/Header'
import { Footer } from '@/components/shop/Footer'
import { CartDrawer } from '@/components/shop/CartDrawer'
import { AuthModal } from '@/components/shop/AuthModal'
import { HomeView } from '@/components/shop/HomeView'
import { ShopView } from '@/components/shop/ShopView'
import { ProductView } from '@/components/shop/ProductView'
import { CheckoutView } from '@/components/shop/CheckoutView'
import { OrdersView } from '@/components/shop/OrdersView'
import { OrderDetailView } from '@/components/shop/OrderDetailView'
import { WishlistView } from '@/components/shop/WishlistView'
import { DealsView } from '@/components/shop/DealsView'
import { AccountView } from '@/components/shop/AccountView'
import { AdminView } from '@/components/shop/AdminView'
import { RecentlySearchedView } from '@/components/shop/RecentlySearchedView'
import { CompareView } from '@/components/shop/CompareView'
import { CompareBar } from '@/components/shop/CompareBar'
import { QuickViewModal } from '@/components/shop/QuickViewModal'
import { BackToTopButton } from '@/components/shop/BackToTopButton'
import { WishlistSync } from '@/components/shop/WishlistSync'
import { CartSync } from '@/components/shop/CartSync'
import { LiveChatWidget } from '@/components/shop/LiveChatWidget'
import { useSharedWishlist } from '@/components/shop/ShareWishlist'
import { useView, useAuth } from '@/lib/store'
import { fetcher } from '@/lib/api-client'

export default function Home() {
  const view = useView((s) => s.view)
  const setUser = useAuth((s) => s.setUser)
  useSharedWishlist()

  // Restore session on mount
  useEffect(() => {
    fetcher<{ user: any }>('/api/auth/me')
      .then((d) => d?.user && setUser(d.user))
      .catch(() => {})
  }, [setUser])

  // Scroll to top on view change (except product view which handles its own scroll)
  useEffect(() => {
    if (view.name === 'product') return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50/40 via-background to-background dark:from-amber-950/10 dark:via-background dark:to-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-0">
        {view.name === 'home' && <HomeView />}
        {view.name === 'shop' && (
          <ShopView
            initialCategorySlug={view.categorySlug}
            initialQuery={view.query}
          />
        )}
        {view.name === 'product' && <ProductView key={view.productId} productId={view.productId} />}
        {view.name === 'cart' && <CartPageRedirect />}
        {view.name === 'checkout' && <CheckoutView />}
        {view.name === 'orders' && <OrdersView />}
        {view.name === 'order' && <OrderDetailView orderId={view.orderId} />}
        {view.name === 'wishlist' && <WishlistView />}
        {view.name === 'deals' && <DealsView />}
        {view.name === 'compare' && <CompareView />}
        {view.name === 'account' && <AccountView />}
        {view.name === 'admin' && <AdminView initialTab={view.tab} />}
        {view.name === 'recent-searches' && <RecentlySearchedView />}
      </main>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <QuickViewModal />
      <CompareBar />
      <BackToTopButton />
      <WishlistSync />
      <CartSync />
      <LiveChatWidget />
    </div>
  )
}

function CartPageRedirect() {
  useEffect(() => {
    useView.getState().navigate({ name: 'shop' })
  }, [])
  return null
}
