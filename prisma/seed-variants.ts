import { db } from '../src/lib/db'

async function main() {
  // Add variants to fashion products
  const fashion = await db.product.findMany({
    where: { category: { slug: 'fashion' } },
  })

  const shoes = fashion.find((p) => p.name.toLowerCase().includes('sneaker'))
  if (shoes) {
    await db.product.update({
      where: { id: shoes.id },
      data: {
        variants: JSON.stringify({
          colors: [
            { name: 'White', hex: '#f5f5f5', stock: 20, priceDelta: 0 },
            { name: 'Black', hex: '#1a1a1a', stock: 15, priceDelta: 0 },
            { name: 'Tan', hex: '#c19a6b', stock: 8, priceDelta: 5 },
          ],
          sizes: [
            { name: '7', stock: 5, priceDelta: 0 },
            { name: '8', stock: 8, priceDelta: 0 },
            { name: '9', stock: 10, priceDelta: 0 },
            { name: '10', stock: 12, priceDelta: 0 },
            { name: '11', stock: 7, priceDelta: 0 },
            { name: '12', stock: 4, priceDelta: 0 },
          ],
        }),
      },
    })
    console.log('Added variants to:', shoes.name)
  }

  const hoodie = fashion.find((p) => p.name.toLowerCase().includes('hoodie'))
  if (hoodie) {
    await db.product.update({
      where: { id: hoodie.id },
      data: {
        variants: JSON.stringify({
          colors: [
            { name: 'Black', hex: '#1a1a1a', stock: 30, priceDelta: 0 },
            { name: 'Gray', hex: '#808080', stock: 25, priceDelta: 0 },
            { name: 'Navy', hex: '#1e3a5f', stock: 18, priceDelta: 0 },
            { name: 'Burgundy', hex: '#800020', stock: 12, priceDelta: 2 },
          ],
          sizes: [
            { name: 'XS', stock: 8, priceDelta: 0 },
            { name: 'S', stock: 15, priceDelta: 0 },
            { name: 'M', stock: 20, priceDelta: 0 },
            { name: 'L', stock: 18, priceDelta: 0 },
            { name: 'XL', stock: 12, priceDelta: 2 },
            { name: 'XXL', stock: 6, priceDelta: 4 },
          ],
        }),
      },
    })
    console.log('Added variants to:', hoodie.name)
  }

  const backpack = fashion.find((p) => p.name.toLowerCase().includes('backpack'))
  if (backpack) {
    await db.product.update({
      where: { id: backpack.id },
      data: {
        variants: JSON.stringify({
          colors: [
            { name: 'Brown', hex: '#6b4423', stock: 40, priceDelta: 0 },
            { name: 'Black', hex: '#1a1a1a', stock: 35, priceDelta: 0 },
            { name: 'Cognac', hex: '#946c3b', stock: 22, priceDelta: 10 },
          ],
        }),
      },
    })
    console.log('Added variants to:', backpack.name)
  }

  // Add color variants to a few electronics
  const earbuds = await db.product.findFirst({ where: { name: { contains: 'Earbuds' } } })
  if (earbuds) {
    await db.product.update({
      where: { id: earbuds.id },
      data: {
        variants: JSON.stringify({
          colors: [
            { name: 'White', hex: '#f5f5f5', stock: 100, priceDelta: 0 },
            { name: 'Black', hex: '#1a1a1a', stock: 80, priceDelta: 0 },
            { name: 'Blue', hex: '#1e3a8a', stock: 30, priceDelta: 5 },
          ],
        }),
      },
    })
    console.log('Added variants to:', earbuds.name)
  }

  const headphones = await db.product.findFirst({ where: { name: { contains: 'Headphones' } } })
  if (headphones) {
    await db.product.update({
      where: { id: headphones.id },
      data: {
        variants: JSON.stringify({
          colors: [
            { name: 'Space Gray', hex: '#43454b', stock: 60, priceDelta: 0 },
            { name: 'Silver', hex: '#c0c0c0', stock: 50, priceDelta: 0 },
            { name: 'Midnight', hex: '#1c1c2e', stock: 35, priceDelta: 10 },
            { name: 'Rose Gold', hex: '#b76e79', stock: 20, priceDelta: 15 },
          ],
        }),
      },
    })
    console.log('Added variants to:', headphones.name)
  }

  console.log('✓ Variant seeding complete')
}

main().catch(console.error).finally(() => db.$disconnect())
