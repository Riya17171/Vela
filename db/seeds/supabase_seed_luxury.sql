-- VELA V2: Luxury Catalog DB Reset & Seed
-- Run this deeply inside your Supabase SQL Editor.
-- WARNING: This will violently purge all existing products, categories, cart_items, and order_items!

-- 1. Wipe all existing data (Cascade handles foreign keys gracefully)
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE products CASCADE;

-- 2. Establish Luxury Categories
INSERT INTO categories (name, slug) VALUES
  ('Women''s Ready-to-Wear', 'womens-rtw'),
  ('Men''s Ready-to-Wear', 'mens-rtw'),
  ('Leather Goods & Handbags', 'handbags'),
  ('Fine Accessories', 'accessories');

-- 3. Seed Luxury Product Catalog
INSERT INTO products (title, description, price, category, image_url, rating, rating_count, is_featured)
VALUES
  (
    'Oversized Cashmere Turtleneck Knit',
    'Spun from exceptionally soft, heavyweight Mongolian cashmere. This oversized knit features a dramatic exaggerated neckline and drop shoulders, wrapping the body in an architectural cocoon of pure comfort. Hand-finished in Italy. Dry clean only.',
    1250.00,
    'womens-rtw',
    'https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?q=80&w=1500&auto=format&fit=crop',
    4.9,
    14,
    true
  ),
  (
    'Structured Wool Gabardine Blazer',
    'A masterclass in sharp tailoring. Woven from dense virgin wool gabardine, this blazer features sculpted shoulders, a defined waist, and tonal silk lining. An authoritative silhouette rooted in minimalist tradition.',
    2890.00,
    'mens-rtw',
    'https://images.unsplash.com/photo-1593030103066-0093718efce9?q=80&w=1500&auto=format&fit=crop',
    5.0,
    8,
    false
  ),
  (
    'The Obsidian Minimalist Tote',
    'Crafted from seamless full-grain calfskin leather with absolutely zero visible hardware or branding. The interior is lined with suede and features a single floating pocket. It embodies quiet luxury and utilitarian elegance.',
    3200.00,
    'handbags',
    'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1500&auto=format&fit=crop',
    4.8,
    22,
    true
  ),
  (
    'Tortoiseshell Acetate Sunglasses',
    'Sculpted from a single block of premium Italian acetate and hand-polished for 72 hours. Features perfectly flat dark lenses offering 100% UV protection and a heavy, satisfying architectural weight.',
    450.00,
    'accessories',
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1500&auto=format&fit=crop',
    4.6,
    31,
    false
  ),
  (
    'Silk Georgette Evening Gown',
    'A masterwork of fluid draping. This floor-sweeping gown is bias-cut from heavy silk georgette, designed to move like liquid around the body. Features an asymmetrical neckline and a deep, open back.',
    4100.00,
    'womens-rtw',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1500&auto=format&fit=crop',
    5.0,
    5,
    true
  ),
  (
    'Double-Breasted Cashmere Overcoat',
    'The ultimate outerwear statement piece. Constructed from double-faced cashmere offering unparalleled warmth without excessive weight. Features peak lapels, horn buttons, and an elegant trailing hem. Tailored in London.',
    5600.00,
    'mens-rtw',
    'https://images.unsplash.com/photo-1507680434267-db7e89104033?q=80&w=1500&auto=format&fit=crop',
    4.9,
    11,
    true
  ),
  (
    'Woven Leather Envelope Clutch',
    'An intricate display of artisanal craftsmanship. Constructed using a complex intrecciato woven technique over supple lambskin. Slim, entirely unbranded, and perfectly sized for evening essentials.',
    1850.00,
    'handbags',
    'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1500&auto=format&fit=crop',
    4.7,
    19,
    false
  ),
  (
    'Brushed Silver Cuff Bracelet',
    'Forged from heavy solid 925 sterling silver with a brutally raw, brushed industrial finish. The cuff is ergonomically asymmetrical to rest perfectly on the wrist bone. A quiet but heavy statement.',
    890.00,
    'accessories',
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1500&auto=format&fit=crop',
    4.8,
    42,
    false
  );
