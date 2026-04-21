import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Hero from '../../components/home/Hero.jsx'
import CategoryStrip from '../../components/home/CategoryStrip.jsx'
import RecommendationsRow from '../../components/home/RecommendationsRow.jsx'
import EditorialTeaser from '../../components/home/EditorialTeaser.jsx'
import PhilosophyStatement from '../../components/home/PhilosophyStatement.jsx'
import JournalSignup from '../../components/home/JournalSignup.jsx'
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx'
import ProductCard from '../../components/ProductCard/ProductCard.jsx'
import { useProducts } from '../../hooks/useProducts.js'

export default function Home() {
  const { products, loading } = useProducts({ limit: 6, isFeatured: true })

  return (
    <div className="w-full flex flex-col pt-0 pb-0">
      <Hero />

      {/* Marquee Strip */}
      <section className="w-full py-4 border-b border-silk overflow-hidden bg-bg flex">
        <div className="whitespace-nowrap animate-marquee flex items-center">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-[10px] md:text-xs tracking-luxury uppercase text-warmgray font-sans mx-4">
              New Collection — SS25 — Vela — Luxury Apparel —
            </span>
          ))}
        </div>
      </section>

      <CategoryStrip />

      {/* Featured Products */}
      <section className="w-full max-w-7xl mx-auto px-8 py-24 border-t border-silk">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-silk pb-4">
          <h2 className="font-display text-4xl font-light text-charcoal m-0">The Collection</h2>
          <Link to="/products" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors focus:outline-none">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="w-full h-64 flex items-center justify-center font-sans text-xs text-warmgray uppercase tracking-luxury">Loading curations...</div>
        ) : (
          <>
            <ProductGrid>
              {products?.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </ProductGrid>
            <div className="mt-24 flex justify-center">
              <Link to="/products" className="border border-charcoal text-charcoal px-8 py-4 rounded-none text-xs tracking-luxury uppercase hover:bg-charcoal hover:text-cream transition-colors duration-300 focus:outline-none">
                View Full Collection
              </Link>
            </div>
          </>
        )}
      </section>

      <RecommendationsRow />
      <EditorialTeaser />
      <PhilosophyStatement />
      <JournalSignup />
    </div>
  )
}
