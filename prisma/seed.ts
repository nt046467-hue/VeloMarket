import { db } from '../src/lib/db'

// Helper to encode arrays as JSON
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: 'Smartphone', description: 'Phones, laptops, audio, cameras and more' },
  { name: 'Computers', slug: 'computers', icon: 'Laptop', description: 'Laptops, desktops, monitors and accessories' },
  { name: 'Audio', slug: 'audio', icon: 'Headphones', description: 'Headphones, speakers and audio gear' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'Home', description: 'Everything for your home' },
  { name: 'Fashion', slug: 'fashion', icon: 'Shirt', description: 'Clothing, shoes and accessories' },
  { name: 'Books', slug: 'books', icon: 'BookOpen', description: 'Best sellers and new releases' },
  { name: 'Sports & Outdoors', slug: 'sports', icon: 'Dumbbell', description: 'Gear for every activity' },
  { name: 'Beauty', slug: 'beauty', icon: 'Sparkles', description: 'Skincare, makeup and fragrance' },
  { name: 'Toys & Games', slug: 'toys', icon: 'Gamepad2', description: 'For kids of all ages' },
  { name: 'Grocery', slug: 'grocery', icon: 'ShoppingBasket', description: 'Everyday essentials' },
]

type ProductSeed = {
  name: string
  description: string
  brand: string
  price: number
  compareAt?: number
  images: string[]
  rating: number
  ratingCount: number
  stock: number
  isFeatured?: boolean
  tags?: string[]
  specs?: Record<string, string>
  categorySlug: string
}

const products: ProductSeed[] = [
  // ===== ELECTRONICS / COMPUTERS =====
  {
    name: 'ZenBook Pro 14 OLED Laptop',
    description: '14-inch OLED 3K display, Intel Core Ultra 9, 32GB RAM, 1TB SSD, NVIDIA RTX 4060. Designed for creators and professionals who demand performance and style in a lightweight aluminum chassis.',
    brand: 'AsusROG',
    price: 1899.99,
    compareAt: 2199.99,
    images: [img('photo-1517336714731-489689fd1ca8'), img('photo-1496181133206-80ce9b88a853'), img('photo-1593642632559-0c6d3fc62b89')],
    rating: 4.7, ratingCount: 1284, stock: 42, isFeatured: true,
    tags: ['laptop', 'oled', 'creator', 'rtx'],
    specs: { 'CPU': 'Intel Core Ultra 9 185H', 'RAM': '32GB DDR5', 'Storage': '1TB NVMe SSD', 'Display': '14" OLED 3K 120Hz', 'GPU': 'NVIDIA RTX 4060 8GB' },
    categorySlug: 'computers',
  },
  {
    name: 'PixelBook Go Ultra-Slim Laptop',
    description: '13.3" FHD, 16GB RAM, 256GB SSD, 12-hour battery life. The perfect everyday laptop for productivity on the go.',
    brand: 'Pacific',
    price: 899.0,
    compareAt: 1099.0,
    images: [img('photo-1496181133206-80ce9b88a853'), img('photo-1517336714731-489689fd1ca8')],
    rating: 4.4, ratingCount: 632, stock: 78,
    tags: ['laptop', 'ultrabook', 'office'],
    specs: { 'CPU': 'Intel Core i7', 'RAM': '16GB', 'Storage': '256GB SSD', 'Display': '13.3" FHD' },
    categorySlug: 'computers',
  },
  {
    name: 'AuraView 27" 4K UHD Monitor',
    description: '27-inch 4K UHD IPS panel with 99% sRGB, USB-C 90W charging, height adjustable stand. Professional-grade color accuracy.',
    brand: 'Dell',
    price: 449.99,
    compareAt: 599.99,
    images: [img('photo-1527443224154-c4a3942d3acf'), img('photo-1561154464-82e9adf32764')],
    rating: 4.6, ratingCount: 2103, stock: 156, isFeatured: true,
    tags: ['monitor', '4k', 'usb-c'],
    specs: { 'Resolution': '3840 x 2160', 'Refresh': '60Hz', 'Ports': 'USB-C, HDMI, DP', 'Panel': 'IPS' },
    categorySlug: 'computers',
  },
  {
    name: 'MagicKeys 75% Mechanical Keyboard',
    description: 'Hot-swappable 75% mechanical keyboard with gasket mount, PBT keycaps, RGB backlight, and tri-mode wireless.',
    brand: 'Keychron',
    price: 119.99,
    compareAt: 149.99,
    images: [img('photo-1587829741301-dc798b83add3'), img('photo-1595225476474-87563907a212')],
    rating: 4.8, ratingCount: 3142, stock: 240,
    tags: ['keyboard', 'mechanical', 'rgb'],
    specs: { 'Layout': '75%', 'Switches': 'Hot-swap', 'Connectivity': 'BT 5.1 / 2.4G / USB-C' },
    categorySlug: 'computers',
  },
  {
    name: 'GlideTech Wireless Mouse Pro',
    description: 'Ergonomic wireless mouse with 8K polling rate, 60-day battery, programmable buttons, and silent clicks.',
    brand: 'Logi',
    price: 79.99,
    images: [img('photo-1527864550417-7fd91fc51a46'), img('photo-1544244015-0df4b3ffc6b0')],
    rating: 4.5, ratingCount: 1876, stock: 312,
    tags: ['mouse', 'wireless', 'ergonomic'],
    specs: { 'Polling': '8000Hz', 'Battery': '60 days', 'Sensor': 'HERO 25K' },
    categorySlug: 'computers',
  },

  // ===== ELECTRONICS =====
  {
    name: 'Galaxy S24 Ultra Smartphone',
    description: '6.8" QHD+ AMOLED, Snapdragon 8 Gen 3, 12GB RAM, 512GB storage, 200MP camera with AI-powered features and S-Pen.',
    brand: 'Samsong',
    price: 1299.0,
    compareAt: 1499.0,
    images: [img('photo-1511707171634-5f897ff02aa9'), img('photo-1592750475338-74b7b21085ab')],
    rating: 4.7, ratingCount: 5432, stock: 89, isFeatured: true,
    tags: ['phone', 'android', '5g'],
    specs: { 'Display': '6.8" QHD+ AMOLED', 'RAM': '12GB', 'Storage': '512GB', 'Camera': '200MP Quad' },
    categorySlug: 'electronics',
  },
  {
    name: 'iPad Air 11" M2',
    description: '11-inch Liquid Retina display, M2 chip, 256GB, supports Apple Pencil Pro. Perfect for note-taking, drawing, and entertainment.',
    brand: 'Apricot',
    price: 599.0,
    images: [img('photo-1561154464-82e9adf32764'), img('photo-1544244015-0df4b3ffc6b0')],
    rating: 4.8, ratingCount: 4121, stock: 124,
    tags: ['tablet', 'ipad', 'm2'],
    specs: { 'Chip': 'Apple M2', 'Storage': '256GB', 'Display': '11" Liquid Retina' },
    categorySlug: 'electronics',
  },
  {
    name: 'Pixel Watch 3 Smartwatch',
    description: '41mm AMOLED display, GPS, heart rate, ECG, sleep tracking, 24-hour battery. Sleek circular design.',
    brand: 'Pacific',
    price: 349.99,
    compareAt: 399.99,
    images: [img('photo-1546868871-7041f2a55e12'), img('photo-1579586337278-3befd40fd17a')],
    rating: 4.4, ratingCount: 891, stock: 67, isFeatured: true,
    tags: ['watch', 'wearable', 'fitness'],
    specs: { 'Display': '1.2" AMOLED', 'Battery': '24h', 'Water': '5ATM' },
    categorySlug: 'electronics',
  },
  {
    name: 'SmartHub Pro 4K Action Camera',
    description: '4K60 action cam with image stabilization, waterproof case, 10-bit color, dual screens for vlogging.',
    brand: 'GoForge',
    price: 329.0,
    images: [img('photo-1502920917128-1aa500764cbd'), img('photo-1526170375885-4d8ecf77b99f')],
    rating: 4.5, ratingCount: 712, stock: 95,
    tags: ['camera', 'action', '4k'],
    specs: { 'Video': '4K60 / 5.3K30', 'Stabilization': 'HyperSmooth 6.0', 'Waterproof': '10m' },
    categorySlug: 'electronics',
  },
  {
    name: 'HomeCinema 4K Laser Projector',
    description: '3000 lumens tri-color laser projector, 4K UHD, HDR10+, 200-inch projection. Cinema-quality at home.',
    brand: 'Xgimi',
    price: 1499.0,
    compareAt: 1799.0,
    images: [img('photo-1626379953822-baec19c3accd'), img('photo-1574267432553-4b4628081c31')],
    rating: 4.6, ratingCount: 487, stock: 38,
    tags: ['projector', '4k', 'home-theater'],
    specs: { 'Resolution': '3840x2160', 'Brightness': '3000 ANSI lm', 'Source': 'Tri-color laser' },
    categorySlug: 'electronics',
  },

  // ===== AUDIO =====
  {
    name: 'AirSound Pro Max Wireless Headphones',
    description: 'Active noise cancellation, 40-hour battery, spatial audio, lossless audio via USB-C. Studio-grade sound.',
    brand: 'Soundwave',
    price: 349.0,
    compareAt: 449.0,
    images: [img('photo-1505740420928-5e560c06d30e'), img('photo-1583394838336-acd977736f90')],
    rating: 4.7, ratingCount: 8231, stock: 432, isFeatured: true,
    tags: ['headphones', 'anc', 'wireless'],
    specs: { 'Driver': '40mm', 'Battery': '40h', 'ANC': 'Adaptive Hybrid', 'Codecs': 'LDAC, AAC' },
    categorySlug: 'audio',
  },
  {
    name: 'Earbuds X3 Pro Wireless Earbuds',
    description: 'True wireless earbuds with adaptive ANC, wireless charging case, 30-hour total battery, IPX5 water resistance.',
    brand: 'Soundwave',
    price: 129.99,
    compareAt: 179.99,
    images: [img('photo-1606220588913-b3aacb4d2f46'), img('photo-1572569511254-d8f925fe2cbb')],
    rating: 4.5, ratingCount: 5634, stock: 678, isFeatured: true,
    tags: ['earbuds', 'anc', 'wireless'],
    specs: { 'Driver': '11mm', 'Battery': '8h + 22h case', 'Water': 'IPX5' },
    categorySlug: 'audio',
  },
  {
    name: 'BoomBox 360 Bluetooth Speaker',
    description: '360-degree sound, deep bass, IP67 waterproof, 24-hour battery. The ultimate portable party speaker.',
    brand: 'JBLab',
    price: 199.99,
    images: [img('photo-1608043152269-423dbba4e7e1'), img('photo-1589003077984-894e133dabab')],
    rating: 4.6, ratingCount: 3421, stock: 287,
    tags: ['speaker', 'bluetooth', 'portable'],
    specs: { 'Power': '40W', 'Battery': '24h', 'Waterproof': 'IP67' },
    categorySlug: 'audio',
  },
  {
    name: 'Studio Monitor Speakers Pair',
    description: 'Active studio monitors with silk dome tweeter, 5-inch woofer, balanced XLR/TRS inputs. Pro audio accuracy.',
    brand: 'Presonus',
    price: 299.0,
    images: [img('photo-1545454675-3531b543be5d'), img('photo-1610465299996-30f240ac2b1c')],
    rating: 4.5, ratingCount: 521, stock: 73,
    tags: ['speakers', 'studio', 'monitor'],
    specs: { 'Woofer': '5.25"', 'Tweeter': '1" silk dome', 'Power': '80W' },
    categorySlug: 'audio',
  },

  // ===== HOME & KITCHEN =====
  {
    name: 'SmartBrew 12-Cup Coffee Maker',
    description: 'Programmable coffee maker with thermal carafe, built-in grinder, app control. Wake up to fresh coffee.',
    brand: 'BrewMaster',
    price: 189.0,
    compareAt: 249.0,
    images: [img('photo-1517668808822-9ebb02f2a0e6'), img('photo-1447933601403-0c6688de566e')],
    rating: 4.4, ratingCount: 1247, stock: 134, isFeatured: true,
    tags: ['coffee', 'kitchen', 'smart'],
    specs: { 'Capacity': '12 cups', 'Carafe': 'Thermal', 'Smart': 'App + voice' },
    categorySlug: 'home-kitchen',
  },
  {
    name: 'AirFry Max XL Air Fryer',
    description: '6-quart digital air fryer with 8 presets, dual-fan technology, dishwasher-safe basket. Healthier fried food.',
    brand: 'Ninja',
    price: 119.99,
    compareAt: 159.99,
    images: [img('photo-1626806787461-102c1bfaaea1'), img('photo-1585515320310-259814833e62')],
    rating: 4.7, ratingCount: 8901, stock: 245, isFeatured: true,
    tags: ['air-fryer', 'kitchen'],
    specs: { 'Capacity': '6 qt', 'Presets': '8', 'Power': '1700W' },
    categorySlug: 'home-kitchen',
  },
  {
    name: 'PureVac Robot Vacuum Pro',
    description: 'LiDAR navigation, multi-floor mapping, mop combo, 60-day self-empty base. Set and forget.',
    brand: 'RoboClean',
    price: 499.0,
    compareAt: 649.0,
    images: [img('photo-1567690187548-f07b1d7bf5a9'), img('photo-1581578731548-c64695cc6952')],
    rating: 4.5, ratingCount: 2103, stock: 87,
    tags: ['vacuum', 'robot', 'smart-home'],
    specs: { 'Navigation': 'LiDAR', 'Suction': '5000Pa', 'Runtime': '180 min' },
    categorySlug: 'home-kitchen',
  },
  {
    name: 'Comfort Cloud Memory Foam Mattress Queen',
    description: '12-inch gel-infused memory foam mattress with cooling cover, 10-year warranty. Wake up refreshed.',
    brand: 'Casper',
    price: 799.0,
    compareAt: 1099.0,
    images: [img('photo-1505693416388-ac5ce068fe85'), img('photo-1631049307264-da0ec9d70304')],
    rating: 4.6, ratingCount: 4127, stock: 56,
    tags: ['mattress', 'bedding', 'memory-foam'],
    specs: { 'Size': 'Queen 60"x80"', 'Thickness': '12"', 'Warranty': '10 years' },
    categorySlug: 'home-kitchen',
  },
  {
    name: 'Smart LED Light Strip 16ft',
    description: 'RGBIC LED strip with music sync, app control, voice assistant compatible. Transform any room.',
    brand: 'Govee',
    price: 39.99,
    compareAt: 59.99,
    images: [img('photo-1558002038-1055907df827'), img('photo-1565814329452-e1efa11c5b89')],
    rating: 4.5, ratingCount: 6789, stock: 542,
    tags: ['lighting', 'smart-home', 'rgb'],
    specs: { 'Length': '16.4 ft', 'Colors': '16M', 'Control': 'App + Voice' },
    categorySlug: 'home-kitchen',
  },

  // ===== FASHION =====
  {
    name: 'Classic Leather Sneakers',
    description: 'Full-grain leather sneakers with cushioned insole, breathable lining, durable rubber outsole. Goes with everything.',
    brand: 'Feather',
    price: 89.99,
    compareAt: 129.99,
    images: [img('photo-1542291026-7eec264c27ff'), img('photo-1460353581641-37baddab0fa2')],
    rating: 4.5, ratingCount: 3421, stock: 678, isFeatured: true,
    tags: ['shoes', 'sneakers', 'leather'],
    specs: { 'Material': 'Full-grain leather', 'Sizes': '7-13 US' },
    categorySlug: 'fashion',
  },
  {
    name: 'Premium Cotton Hoodie',
    description: 'Heavyweight 100% cotton fleece hoodie with brushed interior, ribbed cuffs, kangaroo pocket. Cozy meets style.',
    brand: 'Champion',
    price: 59.99,
    images: [img('photo-1556821840-3a63f95609a7'), img('photo-1620799140408-edc6dcb6d633')],
    rating: 4.7, ratingCount: 5210, stock: 892,
    tags: ['clothing', 'hoodie', 'cotton'],
    specs: { 'Material': '100% cotton', 'Weight': '12 oz' },
    categorySlug: 'fashion',
  },
  {
    name: 'Aviator Polarized Sunglasses',
    description: 'UV400 polarized lenses, lightweight metal frame, includes case and cleaning cloth. Timeless style.',
    brand: 'RayBon',
    price: 49.99,
    compareAt: 79.99,
    images: [img('photo-1572635196237-14b3f281503f'), img('photo-1577803645773-f96470509666')],
    rating: 4.4, ratingCount: 2876, stock: 423, isFeatured: true,
    tags: ['sunglasses', 'accessories'],
    specs: { 'UV': 'UV400', 'Lens': 'Polarized' },
    categorySlug: 'fashion',
  },
  {
    name: 'Heritage Leather Backpack',
    description: 'Hand-crafted full-grain leather backpack with laptop compartment, water-resistant, lifetime warranty.',
    brand: 'Bellroy',
    price: 219.0,
    compareAt: 289.0,
    images: [img('photo-1553062407-98eeb64c6a62'), img('photo-1622560480605-d83c853bc5c3')],
    rating: 4.7, ratingCount: 1432, stock: 145,
    tags: ['bag', 'backpack', 'leather'],
    specs: { 'Material': 'Full-grain leather', 'Laptop': 'Up to 15"' },
    categorySlug: 'fashion',
  },

  // ===== BOOKS =====
  {
    name: 'Atomic Habits Hardcover',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. The #1 New York Times bestseller by James Clear.',
    brand: 'Penguin',
    price: 14.99,
    compareAt: 27.0,
    images: [img('photo-1544947950-fa07a98d237f'), img('photo-1532012197267-da84d127e765')],
    rating: 4.8, ratingCount: 28743, stock: 1234, isFeatured: true,
    tags: ['book', 'self-help', 'bestseller'],
    specs: { 'Pages': '320', 'Format': 'Hardcover' },
    categorySlug: 'books',
  },
  {
    name: 'The Pragmatic Programmer',
    description: '20th Anniversary Edition. Classic guide to software craftsmanship by David Thomas and Andrew Hunt.',
    brand: 'Addison-Wesley',
    price: 39.99,
    images: [img('photo-1532012197267-da84d127e765'), img('photo-1543002588-bfa74002ed7e')],
    rating: 4.7, ratingCount: 8901, stock: 678,
    tags: ['book', 'programming', 'tech'],
    specs: { 'Pages': '352', 'Format': 'Paperback' },
    categorySlug: 'books',
  },
  {
    name: 'Sapiens: A Brief History of Humankind',
    description: 'Exploring the history of humanity from the emergence of archaic humans to the 21st century by Yuval Noah Harari.',
    brand: 'Harper',
    price: 19.99,
    compareAt: 29.99,
    images: [img('photo-1543002588-bfa74002ed7e'), img('photo-1495446815901-a7297e633e8d')],
    rating: 4.6, ratingCount: 12456, stock: 892,
    tags: ['book', 'history', 'bestseller'],
    specs: { 'Pages': '464', 'Format': 'Paperback' },
    categorySlug: 'books',
  },

  // ===== SPORTS =====
  {
    name: 'ProForm Smart Treadmill X',
    description: '3.5HP motor, 0-12% incline, 22" touchscreen, iFit integration. Run the world from your living room.',
    brand: 'ProForm',
    price: 1499.0,
    compareAt: 1999.0,
    images: [img('photo-1571902943202-507ec2618e8f'), img('photo-1576678927484-cc907957088c')],
    rating: 4.5, ratingCount: 892, stock: 47,
    tags: ['fitness', 'treadmill', 'cardio'],
    specs: { 'Motor': '3.5HP', 'Screen': '22" HD', 'Incline': '0-12%' },
    categorySlug: 'sports',
  },
  {
    name: 'Adjustable Dumbbell Set 5-52.5 lbs',
    description: 'Space-saving adjustable dumbbells, replaces 15 sets. Quick-select weight dial system.',
    brand: 'Bowflex',
    price: 429.0,
    images: [img('photo-1638536532686-d610adfc8e5c'), img('photo-1517836357463-d25dfeac3438')],
    rating: 4.7, ratingCount: 3421, stock: 234, isFeatured: true,
    tags: ['fitness', 'dumbbell', 'strength'],
    specs: { 'Weight': '5-52.5 lbs', 'Adjustments': '2.5 lb increments' },
    categorySlug: 'sports',
  },
  {
    name: 'TrailBlazer Hydration Backpack 18L',
    description: 'Lightweight hydration pack with 2L bladder, rain cover, multiple pockets. Perfect for hiking and trail running.',
    brand: 'Osprey',
    price: 89.99,
    compareAt: 119.99,
    images: [img('photo-1553062407-98eeb64c6a62'), img('photo-1551632811-561732d1e306')],
    rating: 4.6, ratingCount: 1234, stock: 312,
    tags: ['outdoor', 'backpack', 'hydration'],
    specs: { 'Capacity': '18L', 'Hydration': '2L bladder', 'Weight': '1.2 lbs' },
    categorySlug: 'sports',
  },
  {
    name: 'Yoga Mat Premium Eco 6mm',
    description: 'Eco-friendly TPE yoga mat, 6mm cushioning, non-slip surface, alignment lines. Includes carrying strap.',
    brand: 'Manduka',
    price: 49.99,
    images: [img('photo-1601925260368-ae2f83cf8b7f'), img('photo-1599058917212-d750089bc07e')],
    rating: 4.5, ratingCount: 2341, stock: 423,
    tags: ['yoga', 'fitness', 'eco'],
    specs: { 'Thickness': '6mm', 'Material': 'TPE', 'Size': '72"x26"' },
    categorySlug: 'sports',
  },

  // ===== BEAUTY =====
  {
    name: 'HydraBoost Vitamin C Serum',
    description: '20% Vitamin C with Hyaluronic Acid and Vitamin E. Brightens, hydrates, and reduces fine lines.',
    brand: 'TruSkin',
    price: 24.99,
    compareAt: 39.99,
    images: [img('photo-1556228720-195a672e8a03'), img('photo-1620916566398-39f1143ab7be')],
    rating: 4.5, ratingCount: 18734, stock: 678, isFeatured: true,
    tags: ['skincare', 'serum', 'vitamin-c'],
    specs: { 'Volume': '30ml', 'Key': 'Vit C 20%, HA, Vit E' },
    categorySlug: 'beauty',
  },
  {
    name: 'Luxe Matte Lipstick Set (6 shades)',
    description: 'Long-lasting matte finish, hydrating formula, six everyday shades. Cruelty-free and vegan.',
    brand: 'Maybelline',
    price: 34.99,
    compareAt: 49.99,
    images: [img('photo-1586495777744-4413f21062fa'), img('photo-1522335789203-aabd1fc54bc9')],
    rating: 4.4, ratingCount: 5432, stock: 289,
    tags: ['makeup', 'lipstick', 'set'],
    specs: { 'Shades': '6', 'Finish': 'Matte' },
    categorySlug: 'beauty',
  },
  {
    name: 'AquaFresh Sonic Toothbrush',
    description: 'Sonic technology, 5 modes, 30-day battery, smart timer. Includes 4 brush heads and travel case.',
    brand: 'Philips',
    price: 79.99,
    compareAt: 99.99,
    images: [img('photo-1609840114035-3c981b782dfe'), img('photo-1526045612212-70caf35c14df')],
    rating: 4.6, ratingCount: 3421, stock: 412,
    tags: ['oral-care', 'electric', 'sonic'],
    specs: { 'Modes': '5', 'Battery': '30 days', 'Speed': '62000 strokes/min' },
    categorySlug: 'beauty',
  },

  // ===== TOYS =====
  {
    name: 'BuildBlox Space Station 1200pc',
    description: 'Build an epic space station with 1200 pieces, 6 minifigures, motorized parts. Hours of creative play.',
    brand: 'Lego',
    price: 99.99,
    compareAt: 129.99,
    images: [img('photo-1587654780291-39c9404d746b'), img('photo-1530325553241-4f6e7690cf36')],
    rating: 4.8, ratingCount: 2341, stock: 178, isFeatured: true,
    tags: ['building', 'lego', 'space'],
    specs: { 'Pieces': '1200', 'Age': '9+' },
    categorySlug: 'toys',
  },
  {
    name: 'RC Drone Pro 4K with GPS',
    description: '4K camera drone with 3-axis gimbal, 30-min flight, GPS return-to-home, foldable design.',
    brand: 'DJI',
    price: 449.0,
    compareAt: 599.0,
    images: [img('photo-1507582020474-9a35b7d455d9'), img('photo-1591370874773-6702e8f12fd8')],
    rating: 4.5, ratingCount: 892, stock: 92,
    tags: ['drone', 'rc', 'camera'],
    specs: { 'Camera': '4K 60fps', 'Flight': '30 min', 'Range': '10km' },
    categorySlug: 'toys',
  },
  {
    name: 'BrainBoost STEM Robot Kit',
    description: 'Build and code your own robot with 50+ parts, sensors, and app-based programming in Scratch and Python.',
    brand: 'Makeblock',
    price: 89.99,
    images: [img('photo-1565514020179-026b92b84bb6'), img('photo-1531746790731-6c087fecd65a')],
    rating: 4.4, ratingCount: 567, stock: 134,
    tags: ['stem', 'robotics', 'educational'],
    specs: { 'Parts': '50+', 'Programming': 'Scratch, Python' },
    categorySlug: 'toys',
  },

  // ===== GROCERY =====
  {
    name: 'Organic Cold Brew Coffee Concentrate 32oz',
    description: 'Smooth, low-acid cold brew concentrate. Just add water or milk. Makes 16 servings.',
    brand: 'Grady\'s',
    price: 24.99,
    images: [img('photo-1447933601403-0c6688de566e'), img('photo-1497935586351-b67a49e012bf')],
    rating: 4.6, ratingCount: 3421, stock: 543,
    tags: ['coffee', 'organic', 'cold-brew'],
    specs: { 'Volume': '32oz', 'Servings': '16' },
    categorySlug: 'grocery',
  },
  {
    name: 'Premium Matcha Green Tea Powder 100g',
    description: 'Ceremonial-grade Japanese matcha from Uji. Stone-ground, vibrant green, smooth flavor.',
    brand: 'Encha',
    price: 39.0,
    compareAt: 49.0,
    images: [img('photo-1515823662972-da6a2e4d3002'), img('photo-1571934811356-5cc061b6821f')],
    rating: 4.7, ratingCount: 1876, stock: 234,
    tags: ['tea', 'matcha', 'organic'],
    specs: { 'Weight': '100g', 'Grade': 'Ceremonial' },
    categorySlug: 'grocery',
  },
  {
    name: 'Artisan Olive Oil Trio Gift Set',
    description: 'Three premium extra-virgin olive oils from California, Italy, and Spain. Beautifully packaged.',
    brand: 'Brightland',
    price: 79.0,
    images: [img('photo-1474979266404-7eaacbcd87c5'), img('photo-1596040033229-a9821ebd058d')],
    rating: 4.5, ratingCount: 432, stock: 87, isFeatured: true,
    tags: ['oil', 'gift', 'gourmet'],
    specs: { 'Bottles': '3 x 200ml' },
    categorySlug: 'grocery',
  },
]

async function main() {
  console.log('Clearing existing data...')
  await db.wishlist.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.review.deleteMany()
  await db.address.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.user.deleteMany()

  console.log('Creating categories...')
  const categoryMap = new Map<string, string>()
  for (const cat of categories) {
    const created = await db.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
      },
    })
    categoryMap.set(cat.slug, created.id)
  }

  console.log('Creating products...')
  let count = 0
  for (const p of products) {
    const categoryId = categoryMap.get(p.categorySlug)
    if (!categoryId) continue
    const baseSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    await db.product.create({
      data: {
        name: p.name,
        slug: `${baseSlug}-${count + 1}`,
        description: p.description,
        brand: p.brand,
        price: p.price,
        compareAt: p.compareAt ?? null,
        images: JSON.stringify(p.images),
        rating: p.rating,
        ratingCount: p.ratingCount,
        stock: p.stock,
        isFeatured: !!p.isFeatured,
        tags: p.tags ? JSON.stringify(p.tags) : null,
        specs: p.specs ? JSON.stringify(p.specs) : null,
        categoryId,
      },
    })
    count++
  }

  console.log('Creating demo user...')
  await db.user.create({
    data: {
      email: 'demo@zshop.com',
      name: 'Demo User',
      password: '$2a$10$placeholder', // demo only, real hashing in API
    },
  })

  console.log(`✓ Seeded ${categories.length} categories and ${count} products`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
