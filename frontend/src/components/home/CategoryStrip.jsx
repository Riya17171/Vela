import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient.js'

const CATEGORY_DATA = [
    { slug: 'womens-rtw', title: 'Womenswear', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800' },
    { slug: 'mens-rtw', title: 'Menswear', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800' },
    { slug: 'handbags', title: 'Handbags', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800' },
    { slug: 'accessories', title: 'Accessories', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800' },
    { slug: 'fragrances', title: 'Fragrances', image: 'https://images.unsplash.com/photo-1523293182086-5fbfc27dccfc?q=80&w=800' },
    { slug: 'footwear', title: 'Footwear', image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=800' },
]

export default function CategoryStrip() {
    const [counts, setCounts] = useState({})

    useEffect(() => {
        async function loadCounts() {
            if (!supabase) return
            const { data } = await supabase.from('products').select('category')
            if (data) {
                const c = data.reduce((acc, p) => {
                    acc[p.category] = (acc[p.category] || 0) + 1
                    return acc
                }, {})
                setCounts(c)
            }
        }
        loadCounts()
    }, [])

    return (
        <div className="w-full overflow-x-auto hide-scrollbar py-16 px-8 flex gap-4 max-w-[100vw]">
            {CATEGORY_DATA.map((cat, i) => (
                <Link to={`/products?category=${cat.slug}`} key={cat.slug} className="shrink-0">
                    <motion.div
                        className="w-72 aspect-square relative overflow-hidden group cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                    >
                        <img
                            src={cat.image}
                            alt={cat.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-charcoal/20 group-hover:bg-charcoal/40 transition-colors duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <h3 className="font-display text-2xl font-light text-cream">{cat.title}</h3>
                            <p className="text-[10px] tracking-luxury uppercase text-cream/70 mt-1">
                                {counts[cat.slug] || 0} Items
                            </p>
                        </div>
                    </motion.div>
                </Link>
            ))}
        </div>
    )
}
