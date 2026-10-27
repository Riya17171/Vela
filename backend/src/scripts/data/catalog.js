/**
 * Development catalogue for Vela, migrated from the original Supabase seed
 * (docs/legacy-supabase/seeds/supabase_seed_luxury_expanded.sql).
 *
 * Prices were USD in the original; they are converted at a fixed ₹85/USD and
 * rounded to the nearest ₹500 because Razorpay test mode settles in INR.
 * Stock levels are deterministic and include low-stock and sold-out pieces so
 * those states can be demonstrated.
 */

export const categories = [
  { slug: 'womens-rtw', name: 'Womenswear', sortOrder: 1, sizeLabel: 'Size', colorLabel: 'Colour', description: "Women's ready-to-wear: tailoring, knitwear and evening pieces.", imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800' },
  { slug: 'mens-rtw', name: 'Menswear', sortOrder: 2, sizeLabel: 'Size', colorLabel: 'Colour', description: "Men's ready-to-wear cut from cashmere, wool and silk.", imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800' },
  { slug: 'handbags', name: 'Leather Goods', sortOrder: 3, colorLabel: 'Leather', description: 'Handbags and small leather goods.', imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800' },
  { slug: 'accessories', name: 'Fine Accessories', sortOrder: 4, colorLabel: 'Finish', description: 'Jewellery, eyewear, scarves and belts.', imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800' },
  { slug: 'fragrances', name: 'Fragrances', sortOrder: 5, description: 'Eaux de parfum and extraits composed in Grasse.', imageUrl: 'https://images.unsplash.com/photo-1523293182086-5fbfc27dccfc?q=80&w=800' },
  { slug: 'footwear', name: 'Footwear', sortOrder: 6, sizeLabel: 'EU Size', colorLabel: 'Colour', description: 'Boots, loafers and mules.', imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=800' },
]

const NEUTRALS = [
  { name: 'Obsidian', hex: '#1A1916' },
  { name: 'Ivory', hex: '#EFECE5' },
  { name: 'Stone', hex: '#8A877F' },
  { name: 'Umber', hex: '#5B4B38' },
]
const METALS = [
  { name: 'Gold', hex: '#C9A86A' },
  { name: 'Silver', hex: '#C4C4C0' },
]

/** Variant options per category (fragrances are sold as a single volume). */
export const categoryVariants = {
  'womens-rtw': { sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: NEUTRALS.slice(0, 3), care: 'Dry clean only. Store folded, away from direct sunlight.' },
  'mens-rtw': { sizes: ['S', 'M', 'L', 'XL'], colors: [NEUTRALS[0], NEUTRALS[2], NEUTRALS[3]], care: 'Dry clean only. Rest the garment for a day between wears.' },
  handbags: { sizes: [], colors: [NEUTRALS[0], NEUTRALS[3]], care: 'Wipe with a soft dry cloth. Store stuffed in the dust bag provided.' },
  accessories: { sizes: [], colors: METALS, care: 'Keep away from perfume and moisture. Polish with the cloth provided.' },
  fragrances: { sizes: [], colors: [], care: 'Store upright, away from heat and light.', volume: '100 ml' },
  footwear: { sizes: ['38', '39', '40', '41', '42', '43', '44'], colors: [NEUTRALS[0], NEUTRALS[3]], care: 'Use shoe trees. Condition leather monthly.' },
}

export const products = [
  { sku: 'VL-WRTW-01', category: 'womens-rtw', title: "Oversized Cashmere Turtleneck", priceRupees: 106500, stock: 14, isFeatured: true, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1500&auto=format&fit=crop',
    description: "Spun from heavyweight Mongolian cashmere, this oversized knit features a dramatic exaggerated neckline and drop shoulders. Wraps the body in an architectural cocoon of pure warmth. Hand-finished in Italy." },
  { sku: 'VL-WRTW-02', category: 'womens-rtw', title: "Silk Georgette Evening Gown", priceRupees: 348500, stock: 9, isFeatured: true, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1500&auto=format&fit=crop',
    description: "A masterwork of fluid draping. Bias-cut from heavy silk georgette, designed to move like liquid. Features an asymmetrical neckline and a deep open back. Crafted in France." },
  { sku: 'VL-WRTW-03', category: 'womens-rtw', title: "Tailored Wool Crepe Trousers", priceRupees: 81000, stock: 22, isFeatured: false, image: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?q=80&w=1500&auto=format&fit=crop',
    description: "Impeccably sharp trousers crafted from heavy wool crepe. High waist, wide leg silhouette that pools elegantly at the floor. Tonal silk lining throughout." },
  { sku: 'VL-WRTW-04', category: 'womens-rtw', title: "Structured Camel Wool Coat", priceRupees: 289000, stock: 4, isFeatured: true, image: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?q=80&w=1500&auto=format&fit=crop',
    description: "The quintessential luxury layering piece. Completely hand-finished, double-faced wool with a generous tie belt and exaggerated storm flaps. A timeless silhouette." },
  { sku: 'VL-WRTW-05', category: 'womens-rtw', title: "Pleated Silk Habotai Midi Skirt", priceRupees: 89500, stock: 11, isFeatured: false, image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1500&auto=format&fit=crop',
    description: "Fluid and airy, crafted from pure silk habotai. Knife pleats offer rigid structure to an otherwise weightless garment, producing brilliant kinetic movement when walking." },
  { sku: 'VL-WRTW-06', category: 'womens-rtw', title: "Asymmetric Mohair Knit Sweater", priceRupees: 93500, stock: 18, isFeatured: false, image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1500&auto=format&fit=crop',
    description: "A delightfully textured offering of brushed silk and mohair blend. The ribbed construction is warped asymmetrically, exposing a single shoulder in a raw but elegant drape." },
  { sku: 'VL-WRTW-07', category: 'womens-rtw', title: "Column Sheath Dress in Matte Crepe", priceRupees: 187000, stock: 6, isFeatured: false, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1500&auto=format&fit=crop',
    description: "Engineered to the body with mathematical precision. Crafted from a dense Japanese matte crepe that creates a perfectly smooth surface. A single invisible zip runs the full length of the spine." },
  { sku: 'VL-WRTW-08', category: 'womens-rtw', title: "Wide-Leg Linen Trousers", priceRupees: 66500, stock: 25, isFeatured: false, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1500&auto=format&fit=crop',
    description: "Woven from a heavyweight Belgian linen blend that softens dramatically with wear. Features a cinched drawstring waistband and a dramatically wide leg. Naturally breathable and increasingly beautiful over time." },
  { sku: 'VL-MRTW-01', category: 'mens-rtw', title: "Structured Wool Gabardine Blazer", priceRupees: 245500, stock: 3, isFeatured: false, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1500&auto=format&fit=crop',
    description: "A masterclass in sharp tailoring. Woven from dense virgin wool gabardine. Sculpted shoulders, defined waist, tonal silk lining. An authoritative silhouette rooted in minimalist tradition." },
  { sku: 'VL-MRTW-02', category: 'mens-rtw', title: "Double-Breasted Cashmere Overcoat", priceRupees: 476000, stock: 12, isFeatured: true, image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1500&auto=format&fit=crop',
    description: "The ultimate outerwear statement. Constructed from double-faced cashmere — unparalleled warmth without excessive weight. Peak lapels, horn buttons, elegant trailing hem. Tailored in London." },
  { sku: 'VL-MRTW-03', category: 'mens-rtw', title: "Heavyweight Silk Camp-Collar Shirt", priceRupees: 83500, stock: 16, isFeatured: false, image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1500&auto=format&fit=crop',
    description: "Cut from exceptionally heavy 30mm silk twill. Short-sleeve camp collar that drapes luxuriously against the body. A relaxed but undeniably opulent summer aesthetic." },
  { sku: 'VL-MRTW-04', category: 'mens-rtw', title: "Chunky Alpaca Blend Cardigan", priceRupees: 119000, stock: 0, isFeatured: false, image: 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=1500&auto=format&fit=crop',
    description: "Deeply plunged V-neck and oversized horn buttons. Woven from raw alpaca hair and virgin wool for an intentionally distressed luxury finish. A powerful but vulnerable garment." },
  { sku: 'VL-MRTW-05', category: 'mens-rtw', title: "Technical Silk Bomber Jacket", priceRupees: 204000, stock: 8, isFeatured: true, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1500&auto=format&fit=crop',
    description: "Bridges utilitarian function and absolute luxury. Water-repellent technical silk exterior packed with lightweight down. Finished with heavy ruthenium hardware throughout." },
  { sku: 'VL-MRTW-06', category: 'mens-rtw', title: "Slim Tapered Wool Flannel Trousers", priceRupees: 75500, stock: 20, isFeatured: false, image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1500&auto=format&fit=crop',
    description: "Woven from a heavy, warm mid-grey flannel in Yorkshire. The slim, tapered cut is architectural without being restrictive. A wardrobe cornerstone." },
  { sku: 'VL-MRTW-07', category: 'mens-rtw', title: "Relaxed Linen Overshirt", priceRupees: 64000, stock: 7, isFeatured: false, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1500&auto=format&fit=crop',
    description: "A generous, architecturally oversized overshirt woven from enzyme-washed linen. Finished with mother-of-pearl buttons and a single chest pocket. Exceptional layering utility." },
  { sku: 'VL-MRTW-08', category: 'mens-rtw', title: "Cashmere Rollneck Sweater", priceRupees: 93500, stock: 13, isFeatured: true, image: 'https://images.unsplash.com/photo-1614975059251-992f11792b9f?q=80&w=1500&auto=format&fit=crop',
    description: "The definitive cold-weather essential. Woven from Scottish 2-ply cashmere with a generous fit and a perfectly proportioned roll collar. Comes in three quiet, authoritative colorways." },
  { sku: 'VL-MRTW-09', category: 'mens-rtw', title: "Merino Wool Crewneck Knit", priceRupees: 58000, stock: 10, isFeatured: false, image: 'https://images.unsplash.com/photo-1609873814058-a8928924184a?q=80&w=1500&auto=format&fit=crop',
    description: "A lean, refined crewneck knit in superfine merino wool. Exceptionally lightweight for its warmth level. The ideal foundation layer beneath tailoring." },
  { sku: 'VL-LGDS-01', category: 'handbags', title: "The Obsidian Minimalist Tote", priceRupees: 272000, stock: 14, isFeatured: true, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1500&auto=format&fit=crop',
    description: "Full-grain calfskin leather with zero visible hardware or branding. Interior lined with suede, single floating pocket. The embodiment of quiet luxury and utilitarian elegance." },
  { sku: 'VL-LGDS-02', category: 'handbags', title: "Woven Leather Envelope Clutch", priceRupees: 157500, stock: 9, isFeatured: false, image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=1500&auto=format&fit=crop',
    description: "Complex intrecciato weave over supple lambskin. Slim, entirely unbranded, perfectly sized for evening essentials. A supreme display of artisanal craftsmanship." },
  { sku: 'VL-LGDS-03', category: 'handbags', title: "Structured Top-Handle Calfskin Bag", priceRupees: 348500, stock: 22, isFeatured: true, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1500&auto=format&fit=crop',
    description: "Architecturally rigid and aggressively elegant. French calfskin with a single geometric brass clasp. Operates equally as a sharp daytime carry or strict evening piece." },
  { sku: 'VL-LGDS-04', category: 'handbags', title: "Suede Slouchy Hobo Bag", priceRupees: 238000, stock: 4, isFeatured: false, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1500&auto=format&fit=crop',
    description: "Buttery tobacco suede with an extra-wide strap designed to fuse seamlessly onto the shoulder. Unlined interior showcases the leather purity. Juxtaposition of soft structure and cavernous utility." },
  { sku: 'VL-LGDS-05', category: 'handbags', title: "Grained Leather Crossbody Pouch", priceRupees: 102000, stock: 11, isFeatured: false, image: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?q=80&w=1500&auto=format&fit=crop',
    description: "Deeply textured grained leather forged into a razor-thin rectangular pouch. Accommodates only the absolute essentials. The ultimate hands-free luxury accessory." },
  { sku: 'VL-LGDS-06', category: 'handbags', title: "Sculptural Mirrored Minaudière", priceRupees: 251000, stock: 18, isFeatured: true, image: 'https://images.unsplash.com/photo-1601924921557-45e6dea0a157?q=80&w=1500&auto=format&fit=crop',
    description: "Part evening bag, part contemporary art. Forged from crushed mirrored brass that reflects its surroundings beautifully. Fastens with an invisible magnetic snap." },
  { sku: 'VL-ACCS-01', category: 'accessories', title: "Tortoiseshell Acetate Sunglasses", priceRupees: 38500, stock: 6, isFeatured: false, image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?q=80&w=1500&auto=format&fit=crop',
    description: "Sculpted from a single block of premium Italian acetate, hand-polished for 72 hours. Perfectly flat dark lenses with 100% UV protection. A heavy, satisfying architectural weight." },
  { sku: 'VL-ACCS-02', category: 'accessories', title: "Brushed Silver Cuff Bracelet", priceRupees: 75500, stock: 25, isFeatured: false, image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1500&auto=format&fit=crop',
    description: "Forged from heavy solid 925 sterling silver with a brutally raw, brushed industrial finish. Ergonomically asymmetrical to rest perfectly on the wrist bone." },
  { sku: 'VL-ACCS-03', category: 'accessories', title: "Heavy Gold Link Chain Necklace", priceRupees: 272000, stock: 3, isFeatured: true, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1500&auto=format&fit=crop',
    description: "Solid 18k yellow gold heavy link chain. Interlocking rings flattened manually to sit flush against the collarbone. Secured via a hidden cylindrical latch." },
  { sku: 'VL-ACCS-04', category: 'accessories', title: "Ribbed Cashmere Fringe Scarf", priceRupees: 55500, stock: 12, isFeatured: false, image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=1500&auto=format&fit=crop',
    description: "Woven in Scotland from double-ply cashmere. Finished with elongated, hand-knotted fringing. Incomparable insulation and soft editorial volume." },
  { sku: 'VL-ACCS-05', category: 'accessories', title: "Classic Leather Dress Belt", priceRupees: 41000, stock: 16, isFeatured: false, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1500&auto=format&fit=crop',
    description: "French box calfskin detailed with a palladium-plated square-edged buckle. Reverse side lined in warm nubuck for structural longevity. Understated perfection." },
  { sku: 'VL-ACCS-06', category: 'accessories', title: "Sculptural Brass Drop Earrings", priceRupees: 61000, stock: 0, isFeatured: false, image: 'https://images.unsplash.com/photo-1630018548696-e1a1e3b47b68?q=80&w=1500&auto=format&fit=crop',
    description: "Organically formed hollow brass drops mimicking the erratic flow of molten metal. Surprisingly lightweight despite their dominating visual presence. Plated in 24k gold." },
  { sku: 'VL-FRAG-01', category: 'fragrances', title: "Silence No. 1 — Eau de Parfum", priceRupees: 32500, stock: 8, isFeatured: true, image: 'https://images.unsplash.com/photo-1523293182086-5fbfc27dccfc?q=80&w=1500&auto=format&fit=crop',
    description: "The house signature. An austere composition of white cedar, black iris, and vetiver root. Dry, linear, and hauntingly persistent. Nothing is added unless it is necessary." },
  { sku: 'VL-FRAG-02', category: 'fragrances', title: "Parchment — Extrait de Parfum", priceRupees: 44000, stock: 20, isFeatured: true, image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?q=80&w=1500&auto=format&fit=crop',
    description: "The smell of an old library at dawn. A complex accord of orris butter, papyrus absolute, and aged sandalwood. Dense, warm, and intellectually intoxicating." },
  { sku: 'VL-FRAG-03', category: 'fragrances', title: "Obsidian — Eau de Parfum", priceRupees: 35500, stock: 7, isFeatured: false, image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1500&auto=format&fit=crop',
    description: "A dark, smoky composition built around oud resin, smoked birch tar, and a single note of cold stone. An aggressive and deeply confident fragrance architecture." },
  { sku: 'VL-FRAG-04', category: 'fragrances', title: "Linen — Eau de Toilette", priceRupees: 24000, stock: 13, isFeatured: false, image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1500&auto=format&fit=crop',
    description: "The lightest expression in the Vela fragrance line. A clean, almost imperceptible veil of white musk, morning air, and sun-dried cotton. For those who prefer to leave no trace." },
  { sku: 'VL-FTWR-01', category: 'footwear', title: "Leather Chelsea Boot", priceRupees: 119000, stock: 10, isFeatured: true, image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=1500&auto=format&fit=crop',
    description: "Pulled from a single piece of full-grain calf leather using a Goodyear welt construction. The elastic side panels are hidden beneath a seamless outer. Resoleable and built to last decades." },
  { sku: 'VL-FTWR-02', category: 'footwear', title: "Minimalist Derby Shoe", priceRupees: 93500, stock: 14, isFeatured: false, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1500&auto=format&fit=crop',
    description: "A study in restraint. Smooth calf leather upper, single-piece toecap, storm welt construction. The lining is vegetable-tanned cowhide. Finished with a lightweight leather sole." },
  { sku: 'VL-FTWR-03', category: 'footwear', title: "Suede Pointed Mule", priceRupees: 83500, stock: 9, isFeatured: false, image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1500&auto=format&fit=crop',
    description: "Impossibly elegant. A paper-thin suede upper sits on an architectural stiletto heel constructed from solid brass. No lining. No padding. The shoe is the experience." },
  { sku: 'VL-FTWR-04', category: 'footwear', title: "Leather Slip-On Loafer", priceRupees: 78000, stock: 22, isFeatured: false, image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=1500&auto=format&fit=crop',
    description: "Constructed on a historically proportioned last with a broad, comfortable toe. Unlined to allow the full-grain leather to form perfectly to the foot over months of wear." },
]

/** Per-piece overrides where the category default does not fit. */
export const productOverrides = {
  'VL-ACCS-01': { colors: [{ name: 'Tortoise', hex: '#6B4A2B' }, NEUTRALS[0]] },
  'VL-ACCS-04': { colors: [NEUTRALS[1], NEUTRALS[2]] },
  'VL-ACCS-05': { colors: [NEUTRALS[0], NEUTRALS[3]] },
  'VL-ACCS-06': { colors: [METALS[0]] },
}
