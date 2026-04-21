-- VELA V2: Corrected & Expanded Luxury Catalog
-- Run in Supabase SQL Editor
-- WARNING: Purges all existing products and categories

TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE products CASCADE;

-- ─── Categories ───────────────────────────────────────────────
INSERT INTO categories (name, slug) VALUES
  ('Women''s Ready-to-Wear', 'womens-rtw'),
  ('Men''s Ready-to-Wear',   'mens-rtw'),
  ('Leather Goods',          'handbags'),
  ('Fine Accessories',       'accessories'),
  ('Fragrances',             'fragrances'),
  ('Footwear',               'footwear');

-- ─── Women's Ready-to-Wear ────────────────────────────────────
INSERT INTO products (title, description, price, category, image_url, rating, rating_count, is_featured) VALUES

(
  'Oversized Cashmere Turtleneck',
  'Spun from heavyweight Mongolian cashmere, this oversized knit features a dramatic exaggerated neckline and drop shoulders. Wraps the body in an architectural cocoon of pure warmth. Hand-finished in Italy.',
  1250.00, 'womens-rtw',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1500&auto=format&fit=crop',
  4.9, 14, true
),
(
  'Silk Georgette Evening Gown',
  'A masterwork of fluid draping. Bias-cut from heavy silk georgette, designed to move like liquid. Features an asymmetrical neckline and a deep open back. Crafted in France.',
  4100.00, 'womens-rtw',
  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1500&auto=format&fit=crop',
  5.0, 5, true
),
(
  'Tailored Wool Crepe Trousers',
  'Impeccably sharp trousers crafted from heavy wool crepe. High waist, wide leg silhouette that pools elegantly at the floor. Tonal silk lining throughout.',
  950.00, 'womens-rtw',
  'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?q=80&w=1500&auto=format&fit=crop',
  4.8, 32, false
),
(
  'Structured Camel Wool Coat',
  'The quintessential luxury layering piece. Completely hand-finished, double-faced wool with a generous tie belt and exaggerated storm flaps. A timeless silhouette.',
  3400.00, 'womens-rtw',
  'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?q=80&w=1500&auto=format&fit=crop',
  4.9, 27, true
),
(
  'Pleated Silk Habotai Midi Skirt',
  'Fluid and airy, crafted from pure silk habotai. Knife pleats offer rigid structure to an otherwise weightless garment, producing brilliant kinetic movement when walking.',
  1050.00, 'womens-rtw',
  'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1500&auto=format&fit=crop',
  4.5, 11, false
),
(
  'Asymmetric Mohair Knit Sweater',
  'A delightfully textured offering of brushed silk and mohair blend. The ribbed construction is warped asymmetrically, exposing a single shoulder in a raw but elegant drape.',
  1100.00, 'womens-rtw',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1500&auto=format&fit=crop',
  4.7, 18, false
),
(
  'Column Sheath Dress in Matte Crepe',
  'Engineered to the body with mathematical precision. Crafted from a dense Japanese matte crepe that creates a perfectly smooth surface. A single invisible zip runs the full length of the spine.',
  2200.00, 'womens-rtw',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1500&auto=format&fit=crop',
  4.8, 23, false
),
(
  'Wide-Leg Linen Trousers',
  'Woven from a heavyweight Belgian linen blend that softens dramatically with wear. Features a cinched drawstring waistband and a dramatically wide leg. Naturally breathable and increasingly beautiful over time.',
  780.00, 'womens-rtw',
  'https://images.unsplash.com/photo-1594938298603-c8148c4b4357?q=80&w=1500&auto=format&fit=crop',
  4.6, 44, false
),

-- ─── Men's Ready-to-Wear ──────────────────────────────────────
(
  'Structured Wool Gabardine Blazer',
  'A masterclass in sharp tailoring. Woven from dense virgin wool gabardine. Sculpted shoulders, defined waist, tonal silk lining. An authoritative silhouette rooted in minimalist tradition.',
  2890.00, 'mens-rtw',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1500&auto=format&fit=crop',
  5.0, 8, false
),
(
  'Double-Breasted Cashmere Overcoat',
  'The ultimate outerwear statement. Constructed from double-faced cashmere — unparalleled warmth without excessive weight. Peak lapels, horn buttons, elegant trailing hem. Tailored in London.',
  5600.00, 'mens-rtw',
  'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1500&auto=format&fit=crop',
  4.9, 11, true
),
(
  'Heavyweight Silk Camp-Collar Shirt',
  'Cut from exceptionally heavy 30mm silk twill. Short-sleeve camp collar that drapes luxuriously against the body. A relaxed but undeniably opulent summer aesthetic.',
  980.00, 'mens-rtw',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1500&auto=format&fit=crop',
  4.8, 44, false
),
(
  'Chunky Alpaca Blend Cardigan',
  'Deeply plunged V-neck and oversized horn buttons. Woven from raw alpaca hair and virgin wool for an intentionally distressed luxury finish. A powerful but vulnerable garment.',
  1400.00, 'mens-rtw',
  'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=1500&auto=format&fit=crop',
  4.6, 21, false
),
(
  'Technical Silk Bomber Jacket',
  'Bridges utilitarian function and absolute luxury. Water-repellent technical silk exterior packed with lightweight down. Finished with heavy ruthenium hardware throughout.',
  2400.00, 'mens-rtw',
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1500&auto=format&fit=crop',
  4.9, 19, true
),
(
  'Slim Tapered Wool Flannel Trousers',
  'Woven from a heavy, warm mid-grey flannel in Yorkshire. The slim, tapered cut is architectural without being restrictive. A wardrobe cornerstone.',
  890.00, 'mens-rtw',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1500&auto=format&fit=crop',
  4.7, 36, false
),
(
  'Relaxed Linen Overshirt',
  'A generous, architecturally oversized overshirt woven from enzyme-washed linen. Finished with mother-of-pearl buttons and a single chest pocket. Exceptional layering utility.',
  750.00, 'mens-rtw',
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1500&auto=format&fit=crop',
  4.5, 52, false
),
(
  'Cashmere Rollneck Sweater',
  'The definitive cold-weather essential. Woven from Scottish 2-ply cashmere with a generous fit and a perfectly proportioned roll collar. Comes in three quiet, authoritative colorways.',
  1100.00, 'mens-rtw',
  'https://images.unsplash.com/photo-1614975059251-992f11792b9f?q=80&w=1500&auto=format&fit=crop',
  4.8, 67, true
),
(
  'Merino Wool Crewneck Knit',
  'A lean, refined crewneck knit in superfine merino wool. Exceptionally lightweight for its warmth level. The ideal foundation layer beneath tailoring.',
  680.00, 'mens-rtw',
  'https://images.unsplash.com/photo-1609873814058-a8928924184a?q=80&w=1500&auto=format&fit=crop',
  4.6, 41, false
),

-- ─── Leather Goods & Handbags ─────────────────────────────────
(
  'The Obsidian Minimalist Tote',
  'Full-grain calfskin leather with zero visible hardware or branding. Interior lined with suede, single floating pocket. The embodiment of quiet luxury and utilitarian elegance.',
  3200.00, 'handbags',
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1500&auto=format&fit=crop',
  4.8, 22, true
),
(
  'Woven Leather Envelope Clutch',
  'Complex intrecciato weave over supple lambskin. Slim, entirely unbranded, perfectly sized for evening essentials. A supreme display of artisanal craftsmanship.',
  1850.00, 'handbags',
  'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=1500&auto=format&fit=crop',
  4.7, 19, false
),
(
  'Structured Top-Handle Calfskin Bag',
  'Architecturally rigid and aggressively elegant. French calfskin with a single geometric brass clasp. Operates equally as a sharp daytime carry or strict evening piece.',
  4100.00, 'handbags',
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1500&auto=format&fit=crop',
  5.0, 33, true
),
(
  'Suede Slouchy Hobo Bag',
  'Buttery tobacco suede with an extra-wide strap designed to fuse seamlessly onto the shoulder. Unlined interior showcases the leather purity. Juxtaposition of soft structure and cavernous utility.',
  2800.00, 'handbags',
  'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1500&auto=format&fit=crop',
  4.8, 41, false
),
(
  'Grained Leather Crossbody Pouch',
  'Deeply textured grained leather forged into a razor-thin rectangular pouch. Accommodates only the absolute essentials. The ultimate hands-free luxury accessory.',
  1200.00, 'handbags',
  'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?q=80&w=1500&auto=format&fit=crop',
  4.6, 55, false
),
(
  'Sculptural Mirrored Minaudière',
  'Part evening bag, part contemporary art. Forged from crushed mirrored brass that reflects its surroundings beautifully. Fastens with an invisible magnetic snap.',
  2950.00, 'handbags',
  'https://images.unsplash.com/photo-1601924921557-45e6dea0a157?q=80&w=1500&auto=format&fit=crop',
  4.9, 14, true
),

-- ─── Fine Accessories ─────────────────────────────────────────
(
  'Tortoiseshell Acetate Sunglasses',
  'Sculpted from a single block of premium Italian acetate, hand-polished for 72 hours. Perfectly flat dark lenses with 100% UV protection. A heavy, satisfying architectural weight.',
  450.00, 'accessories',
  'https://images.unsplash.com/photo-1577803645773-f96470509666?q=80&w=1500&auto=format&fit=crop',
  4.6, 31, false
),
(
  'Brushed Silver Cuff Bracelet',
  'Forged from heavy solid 925 sterling silver with a brutally raw, brushed industrial finish. Ergonomically asymmetrical to rest perfectly on the wrist bone.',
  890.00, 'accessories',
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1500&auto=format&fit=crop',
  4.8, 42, false
),
(
  'Heavy Gold Link Chain Necklace',
  'Solid 18k yellow gold heavy link chain. Interlocking rings flattened manually to sit flush against the collarbone. Secured via a hidden cylindrical latch.',
  3200.00, 'accessories',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1500&auto=format&fit=crop',
  4.9, 18, true
),
(
  'Ribbed Cashmere Fringe Scarf',
  'Woven in Scotland from double-ply cashmere. Finished with elongated, hand-knotted fringing. Incomparable insulation and soft editorial volume.',
  650.00, 'accessories',
  'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=1500&auto=format&fit=crop',
  4.7, 63, false
),
(
  'Classic Leather Dress Belt',
  'French box calfskin detailed with a palladium-plated square-edged buckle. Reverse side lined in warm nubuck for structural longevity. Understated perfection.',
  480.00, 'accessories',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1500&auto=format&fit=crop',
  4.5, 88, false
),
(
  'Sculptural Brass Drop Earrings',
  'Organically formed hollow brass drops mimicking the erratic flow of molten metal. Surprisingly lightweight despite their dominating visual presence. Plated in 24k gold.',
  720.00, 'accessories',
  'https://images.unsplash.com/photo-1630018548696-e1a1e3b47b68?q=80&w=1500&auto=format&fit=crop',
  4.8, 49, false
),

-- ─── Fragrances ───────────────────────────────────────────────
(
  'Silence No. 1 — Eau de Parfum',
  'The house signature. An austere composition of white cedar, black iris, and vetiver root. Dry, linear, and hauntingly persistent. Nothing is added unless it is necessary.',
  380.00, 'fragrances',
  'https://images.unsplash.com/photo-1523293182086-5fbfc27dccfc?q=80&w=1500&auto=format&fit=crop',
  4.9, 87, true
),
(
  'Parchment — Extrait de Parfum',
  'The smell of an old library at dawn. A complex accord of orris butter, papyrus absolute, and aged sandalwood. Dense, warm, and intellectually intoxicating.',
  520.00, 'fragrances',
  'https://images.unsplash.com/photo-1541643600914-78b084683702?q=80&w=1500&auto=format&fit=crop',
  5.0, 44, true
),
(
  'Obsidian — Eau de Parfum',
  'A dark, smoky composition built around oud resin, smoked birch tar, and a single note of cold stone. An aggressive and deeply confident fragrance architecture.',
  420.00, 'fragrances',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1500&auto=format&fit=crop',
  4.8, 61, false
),
(
  'Linen — Eau de Toilette',
  'The lightest expression in the Vela fragrance line. A clean, almost imperceptible veil of white musk, morning air, and sun-dried cotton. For those who prefer to leave no trace.',
  280.00, 'fragrances',
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1500&auto=format&fit=crop',
  4.7, 55, false
),

-- ─── Footwear ─────────────────────────────────────────────────
(
  'Leather Chelsea Boot',
  'Pulled from a single piece of full-grain calf leather using a Goodyear welt construction. The elastic side panels are hidden beneath a seamless outer. Resoleable and built to last decades.',
  1400.00, 'footwear',
  'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=1500&auto=format&fit=crop',
  4.9, 38, true
),
(
  'Minimalist Derby Shoe',
  'A study in restraint. Smooth calf leather upper, single-piece toecap, storm welt construction. The lining is vegetable-tanned cowhide. Finished with a lightweight leather sole.',
  1100.00, 'footwear',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1500&auto=format&fit=crop',
  4.7, 29, false
),
(
  'Suede Pointed Mule',
  'Impossibly elegant. A paper-thin suede upper sits on an architectural stiletto heel constructed from solid brass. No lining. No padding. The shoe is the experience.',
  980.00, 'footwear',
  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1500&auto=format&fit=crop',
  4.8, 51, false
),
(
  'Leather Slip-On Loafer',
  'Constructed on a historically proportioned last with a broad, comfortable toe. Unlined to allow the full-grain leather to form perfectly to the foot over months of wear.',
  920.00, 'footwear',
  'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=1500&auto=format&fit=crop',
  4.6, 73, false
);
