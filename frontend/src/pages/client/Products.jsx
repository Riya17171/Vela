import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { FiChevronDown, FiSliders, FiX } from 'react-icons/fi'

import { ErrorState, LoadingState } from '../../components/common/StatusViews.jsx'
import Filters, { SORT_OPTIONS } from '../../components/Filters/Filters.jsx'
import ProductCard from '../../components/ProductCard/ProductCard.jsx'
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useFilter } from '../../hooks/useFilter.js'
import { useProducts } from '../../hooks/useProducts.js'
import { fetchCategories } from '../../services/products.js'

export default function Products() {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { filters, setFilter, resetFilters, activeCount } = useFilter()
  const { data: categories } = useAsync(fetchCategories, [], { initialData: [] })
  const { products, total, loading, loadingMore, error, reload, loadMore, meta } = useProducts({ ...filters, limit: 12 })

  const activeCategory = categories?.find((category) => category.slug === filters.category)
  const filterProps = { filters, setFilter, resetFilters, categories: categories ?? [], activeCount }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 min-h-screen flex flex-col lg:flex-row gap-8 lg:gap-16">
      <div className="hidden lg:block py-8">
        <Filters {...filterProps} />
      </div>

      <div className="flex-1 flex flex-col lg:pt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-silk pb-6">
          <div>
            <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal m-0 tracking-tight">{activeCategory?.name ?? 'The Collection'}</h1>
            <p className="text-[10px] tracking-luxury uppercase text-warmgray mt-4" aria-live="polite">
              {loading ? 'Curating…' : `${total} ${total === 1 ? 'piece' : 'pieces'}`}
              {filters.search ? ` for “${filters.search}”` : ''}
            </p>
          </div>

          <div className="flex items-center gap-6 lg:hidden">
            <button type="button" onClick={() => setShowMobileFilters(true)} className="flex items-center gap-2 text-xs tracking-luxury uppercase text-charcoal focus:outline-none">
              <FiSliders size={14} strokeWidth={1.5} /> Filters{activeCount ? ` (${activeCount})` : ''}
            </button>
            <div className="relative">
              <select
                aria-label="Sort by"
                className="appearance-none bg-transparent text-xs tracking-luxury uppercase text-charcoal pr-6 outline-none cursor-pointer border-b border-charcoal/30 pb-1"
                value={filters.sort}
                onChange={(e) => setFilter('sort', e.target.value)}
              >
                {SORT_OPTIONS.map((option) => <option key={option.val} value={option.val}>{option.label}</option>)}
              </select>
              <FiChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {error && !products.length ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && products.length === 0 ? (
          <LoadingState label="Curating collection..." className="min-h-[300px] flex-1" />
        ) : products.length === 0 ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[300px] text-center">
            <p className="font-display text-3xl font-light text-charcoal mb-6">No pieces correspond to this selection.</p>
            <button type="button" onClick={resetFilters} className="text-xs tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors">
              Reset Selections
            </button>
          </div>
        ) : (
          <>
            <ProductGrid>
              {products.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: (i % 12) * 0.06, ease: 'easeOut' }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </ProductGrid>

            {meta.hasNextPage && (
              <div className="w-full flex flex-col items-center gap-4 mt-16 pb-8">
                <span className="text-[10px] tracking-luxury uppercase text-warmgray">Showing {products.length} of {total}</span>
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="border border-charcoal text-charcoal bg-transparent px-8 py-3.5 rounded-none text-xs tracking-luxury uppercase hover:bg-charcoal hover:text-cream transition-colors duration-300 focus:outline-none disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
            {error && products.length > 0 && <p role="alert" className="text-center text-xs text-[#e53e3e] mt-4">{error.message}</p>}
          </>
        )}
      </div>

      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-charcoal/50 z-40 lg:hidden" onClick={() => setShowMobileFilters(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
              className="fixed top-0 left-0 h-full w-[85vw] max-w-sm bg-bg z-50 p-8 overflow-y-auto lg:hidden"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="font-display text-2xl text-charcoal">Filters</span>
                <button type="button" aria-label="Close filters" onClick={() => setShowMobileFilters(false)} className="text-charcoal hover:opacity-50"><FiX size={24} /></button>
              </div>
              <Filters {...filterProps} />
              <button type="button" onClick={() => setShowMobileFilters(false)} className="w-full mt-12 bg-obsidian text-cream text-xs tracking-luxury uppercase py-3.5">
                Show {total} pieces
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
