import { db } from '../src/lib/db'

const REVIEW_TEMPLATES = [
  { rating: 5, title: 'Absolutely love it!', comment: 'Exceeded all my expectations. The build quality is incredible and it works flawlessly. Would buy again in a heartbeat.' },
  { rating: 5, title: 'Best purchase this year', comment: 'Fantastic value for money. Fast shipping and the product is exactly as described. Highly recommend to anyone considering it.' },
  { rating: 4, title: 'Great product, minor issues', comment: 'Overall really happy with this. Works well and looks great. Only complaint is the setup took a bit longer than expected.' },
  { rating: 5, title: 'Perfect gift', comment: 'Bought this as a gift and they absolutely loved it. Premium quality, beautiful packaging, and arrived right on time.' },
  { rating: 4, title: 'Solid quality', comment: 'Well-made and durable. Has held up great over the past month. The only downside is it is a bit pricey, but you get what you pay for.' },
  { rating: 3, title: 'Decent but overpriced', comment: 'The product works fine and does what it says. However, for the price I expected better materials. It is just OK, nothing special.' },
  { rating: 5, title: 'Incredible value', comment: 'I was skeptical at first but this has been a game changer. The quality rivals products twice the price. Cannot recommend enough.' },
  { rating: 2, title: 'Disappointed with quality', comment: 'The product arrived with a small defect and the materials feel cheap. Returning it. Expected much better from this brand.' },
  { rating: 5, title: 'Better than described', comment: 'The photos do not do it justice. In person this is stunning. The attention to detail is remarkable. Five stars all the way.' },
  { rating: 4, title: 'Really good, would recommend', comment: 'Been using it daily for a few weeks now. Solid performance, no issues. Took off one star because the instructions were confusing.' },
  { rating: 5, title: 'Worth every penny', comment: 'I was hesitant about the price but after using it for a month I can say it is absolutely worth it. Premium feel, great performance.' },
  { rating: 1, title: 'Complete waste of money', comment: 'Terrible product. Broke after two days. Customer service was no help either. Avoid at all costs.' },
  { rating: 5, title: 'My family loves it', comment: 'Bought this for the whole family and everyone is happy. Easy to use, great quality, and arrived quickly. Will be buying more.' },
  { rating: 4, title: 'Good but takes getting used to', comment: 'The learning curve is a bit steep but once you figure it out, it is great. Quality is top-notch. Would buy again.' },
  { rating: 3, title: 'It is OK', comment: 'Does the job but nothing special. The design could be better and the color is slightly different from the photos. Average product.' },
]

const AUTHORS = [
  'Sarah M.', 'John D.', 'Emily R.', 'Michael B.', 'Jessica L.',
  'David K.', 'Amanda W.', 'Chris T.', 'Nicole P.', 'James H.',
  'Rachel S.', 'Kevin O.', 'Lauren F.', 'Brian C.', 'Megan V.',
]

async function main() {
  console.log('Seeding reviews...')
  
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, ratingCount: true },
  })

  let totalSeeded = 0
  for (const product of products) {
    // Check if product already has reviews
    const existing = await db.review.count({ where: { productId: product.id } })
    if (existing > 0) continue

    // Add 3-8 reviews per product based on ratingCount
    const reviewCount = Math.min(Math.max(3, Math.floor(product.ratingCount / 500)), 8)
    
    for (let i = 0; i < reviewCount; i++) {
      const template = REVIEW_TEMPLATES[(product.id.charCodeAt(0) + i) % REVIEW_TEMPLATES.length]
      const author = AUTHORS[(product.id.charCodeAt(1) + i * 3) % AUTHORS.length]
      const daysAgo = Math.floor(Math.random() * 90) + 1
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      
      await db.review.create({
        data: {
          productId: product.id,
          author,
          rating: template.rating,
          title: template.title,
          comment: template.comment,
          verified: true,
          helpful: Math.floor(Math.random() * 50),
          createdAt,
        },
      })
      totalSeeded++
    }
  }

  console.log(`✓ Seeded ${totalSeeded} reviews across ${products.length} products`)
}

main().catch(console.error).finally(() => db.$disconnect())
