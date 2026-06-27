'use client'

import { useMemo } from 'react'
import { Printer, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrencyFormatter } from '@/lib/use-currency'
import type { Order } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

/**
 * Generates a printable invoice HTML in a new window for the given order.
 * Works without server-side PDF rendering — uses browser's native print-to-PDF.
 */
export function InvoiceDownload({ order }: { order: Order }) {
  const formatCurrency = useCurrencyFormatter()

  function openInvoice() {
    const html = generateInvoiceHTML(order, formatCurrency)
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    w.document.write(html)
    w.document.close()
    // Auto-trigger print dialog after images load
    w.onload = () => setTimeout(() => w.print(), 300)
  }

  return (
    <Button variant="outline" size="sm" onClick={openInvoice}>
      <Printer size={13} className="mr-1.5" /> Invoice (PDF)
    </Button>
  )
}

function generateInvoiceHTML(order: Order, format: (n: number) => string): string {
  const subtotal = order.itemsTotal
  const tax = order.taxTotal
  const shipping = order.shippingTotal
  const discount = order.discountTotal
  const total = order.grandTotal

  const itemsHTML = order.items.map((i, idx) => `
    <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
      <td class="img"><img src="${i.image}" alt="" /></td>
      <td>
        <div class="name">${escapeHTML(i.name)}</div>
        <div class="brand">${escapeHTML(i.brand)}</div>
      </td>
      <td class="num">${i.quantity}</td>
      <td class="num">${format(i.unitPrice)}</td>
      <td class="num total">${format(i.lineTotal)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHTML(order.orderNumber)}</title>
  <style>
    @page { margin: 1.5cm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; color: #18181b; margin: 0; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #f59e0b; }
    .logo { font-size: 32px; font-weight: 900; letter-spacing: -1px; }
    .logo .z { display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; background: #18181b; color: #f59e0b; border-radius: 8px; margin-right: 6px; }
    .logo .tagline { font-size: 11px; font-weight: 500; color: #71717a; margin-top: -3px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h1 { font-size: 22px; margin: 0; color: #f59e0b; }
    .invoice-meta .num { font-family: monospace; font-size: 13px; color: #52525b; }
    .meta-row { font-size: 12px; color: #52525b; margin-top: 2px; }

    .section-title { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #71717a; margin-bottom: 8px; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-box { padding: 16px; background: #fafafa; border-radius: 8px; border-left: 3px solid #f59e0b; }
    .info-box p { margin: 2px 0; font-size: 12px; }
    .info-box .name { font-weight: 600; font-size: 13px; color: #18181b; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 10px; background: #18181b; color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    th.num { text-align: right; }
    td { padding: 10px; border-bottom: 1px solid #e4e4e7; vertical-align: middle; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.total { font-weight: 700; }
    td.img { width: 50px; }
    td.img img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
    td .name { font-size: 12px; font-weight: 600; }
    td .brand { font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; }
    tr.odd { background: #fafafa; }

    .totals { float: right; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .totals .grand { border-top: 2px solid #18181b; padding-top: 8px; margin-top: 8px; font-size: 16px; font-weight: 800; }

    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${order.status === 'delivered' ? '#dcfce7' : order.status === 'cancelled' ? '#fee2e2' : '#fef3c7'}; color: ${order.status === 'delivered' ? '#15803d' : order.status === 'cancelled' ? '#b91c1c' : '#92400e'}; }

    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e4e4e7; text-align: center; color: #71717a; font-size: 11px; }
    .footer a { color: #f59e0b; text-decoration: none; }
    .clear { clear: both; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div><span class="z">V</span>VeloMarket</div>
      <div class="tagline">Shop smarter, live better</div>
    </div>
    <div class="invoice-meta">
      <h1>Invoice</h1>
      <div class="num">${escapeHTML(order.orderNumber)}</div>
      <div class="meta-row">${formatDateTime(order.createdAt)}</div>
      <div class="meta-row">Status: <span class="status-badge">${escapeHTML(order.status)}</span></div>
      <div class="meta-row">Payment: ${escapeHTML(order.paymentMethod)} · ${escapeHTML(order.paymentStatus)}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="section-title">Billed to</div>
      <p class="name">${escapeHTML(order.shippingAddress.fullName)}</p>
      <p>${escapeHTML(order.shippingAddress.line1)}</p>
      ${order.shippingAddress.line2 ? `<p>${escapeHTML(order.shippingAddress.line2)}</p>` : ''}
      <p>${escapeHTML(order.shippingAddress.city)}, ${escapeHTML(order.shippingAddress.state)} ${escapeHTML(order.shippingAddress.zip)}</p>
      <p>${escapeHTML(order.shippingAddress.country)}</p>
      <p>${escapeHTML(order.shippingAddress.phone)}</p>
    </div>
    <div class="info-box">
      <div class="section-title">From</div>
      <p class="name">VeloMarket Inc.</p>
      <p>123 Commerce Street</p>
      <p>San Francisco, CA 94103</p>
      <p>United States</p>
      <p>support@velomarket.com · 1-800-VELO-01</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th colspan="2">Item</th>
        <th class="num">Qty</th>
        <th class="num">Unit price</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${format(subtotal)}</span></div>
    ${discount > 0 ? `<div class="row" style="color:#15803d"><span>Discounts</span><span>-${format(discount)}</span></div>` : ''}
    <div class="row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : format(shipping)}</span></div>
    <div class="row"><span>Estimated tax</span><span>${format(tax)}</span></div>
    <div class="row grand"><span>Total paid</span><span>${format(total)}</span></div>
  </div>
  <div class="clear"></div>

  <div class="footer">
    <p>Thank you for shopping with VeloMarket! Need help? Contact <a href="mailto:support@velomarket.com">support@velomarket.com</a></p>
    <p>This is a computer-generated invoice and does not require a signature.</p>
    <p>© ${new Date().getFullYear()} VeloMarket Inc. · All rights reserved.</p>
  </div>

  <script>
    // Print on load
    window.onload = function() { setTimeout(function() { window.print(); }, 300); };
  </script>
</body>
</html>`
}

function escapeHTML(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
