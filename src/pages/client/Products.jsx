import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSliders, FiChevronDown, FiX } from 'react-icons/fi'

import { useProducts } from '../../hooks/useProducts.js'
import { useFilter } from '../../hooks/useFilter.js'
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx'
import ProductCard from '../../components/ProductCard/ProductCard.jsx'
import Filters from '../../components/Filters/Filters.jsx'



export default function Products() {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { filters, setCategoryId, setSort } = useFilter()
  const { categoryId, minPrice, maxPrice, sort, search } = filters;

  const { products, loading, loadingMore, total, loadMore } = useProducts({
    categoryId,
    minPrice,
    maxPrice,
    sort,
    search,
    limit: 12
  })

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-16 md:py-24 min-h-screen flex flex-col lg:flex-row gap-8 lg:gap-16">

      {/* Sidebar Filters - Desktop */}
      <div className="hidden lg:block py-8">
        <Filters filters={filters} setCategoryId={setCategoryId} setSort={setSort} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pt-8">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-silk pb-6">
          <div>
            <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal m-0 tracking-tight">The Collection</h1>
            <p className="text-[10px] tracking-luxury uppercase text-warmgray mt-4">{total} items pieces</p>
          </div>

          <div className="flex items-center gap-6 lg:hidden">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 text-xs tracking-luxury uppercase text-charcoal focus:outline-none"
            >
              <FiSliders size={14} strokeWidth={1.5} /> Filters
            </button>

            {/* Minimal Mobile Sort */}
            <div className="relative">
              <select
                className="appearance-none bg-transparent text-xs tracking-luxury uppercase text-charcoal pr-6 outline-none cursor-pointer border-b border-charcoal/30 pb-1"
                value={filters.sort}
                onChange={e => setSort(e.target.value)}
              >
                <option value="newest">New Arrivals</option>
                <option value="price-low">Price Low-High</option>
                <option value="price-high">Price High-Low</option>
                <option value="rating">Best Rated</option>
              </select>
              <FiChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Product Grid Rendering */}
        {loading && products.length === 0 ? (
          <div className="w-full flex-1 flex items-center justify-center font-sans text-xs tracking-luxury uppercase text-warmgray min-h-[300px]">
            Curating collection...
          </div>
        ) : products?.length === 0 ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[300px] text-center">
            <p className="font-display text-3xl font-light text-charcoal mb-6">No pieces correspond to this selection.</p>
            <button onClick={() => setCategoryId(null)} className="text-xs tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors">
              Reset Selections
            </button>
          </div>
        ) : (
          <>
            <ProductGrid>
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </ProductGrid>

            {products.length < total && (
              <div className="w-full flex justify-center mt-16 pb-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="border border-charcoal text-charcoal bg-transparent px-8 py-3.5 rounded-none text-xs tracking-luxury uppercase hover:bg-charcoal hover:text-cream transition-colors duration-300 focus:outline-none disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>)}
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-charcoal/50 z-40 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
              className="fixed top-0 left-0 h-full w-[85vw] max-w-sm bg-bg z-50 p-8 overflow-y-auto lg:hidden"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="font-display text-2xl text-charcoal">Filters</span>
                <button onClick={() => setShowMobileFilters(false)} className="text-charcoal hover:opacity-50"><FiX size={24} /></button>
              </div>
              <Filters
                filters={filters}
                setCategoryId={(id) => {
                  setCategoryId(id);
                  setShowMobileFilters(false);
                }}
                setSort={(v) => {
                  setSort(v);
                  setShowMobileFilters(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
