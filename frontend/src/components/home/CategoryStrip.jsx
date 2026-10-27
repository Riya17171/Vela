import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { useAsync } from '../../hooks/useAsync.js'
import { fetchCategories } from '../../services/products.js'

export default function CategoryStrip() {
  const { data: categories, error } = useAsync(fetchCategories, [], { initialData: [] })

  // The strip is decorative navigation; if the API is unreachable the rest of the page still renders.
  if (error || !categories.length) return null

  return (
    <div className="w-full overflow-x-auto hide-scrollbar py-16 px-4 sm:px-8 flex gap-4 max-w-[100vw]">
      {categories.map((cat, i) => (
        <Link to={`/products?category=${cat.slug}`} key={cat.id} className="shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal">
          <motion.div
            className="w-64 sm:w-72 aspect-square relative overflow-hidden group cursor-pointer bg-charcoal"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
          >
            {cat.imageUrl && <img src={cat.imageUrl} alt={cat.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />}
            <div className="absolute inset-0 bg-charcoal/20 group-hover:bg-charcoal/40 transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="font-display text-2xl font-light text-cream">{cat.name}</h3>
              <p className="text-[10px] tracking-luxury uppercase text-cream/70 mt-1">{cat.productCount} {cat.productCount === 1 ? 'Piece' : 'Pieces'}</p>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  )
}
