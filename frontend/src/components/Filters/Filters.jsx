import { useState } from 'react'

import { fromMinorUnits, toMinorUnits } from '../../utils/format.js'

const SORT_OPTIONS = [
  { val: 'newest', label: 'New Arrivals' },
  { val: 'price_asc', label: 'Price: Low-High' },
  { val: 'price_desc', label: 'Price: High-Low' },
  { val: 'rating', label: 'Highest Rated' },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '38', '39', '40', '41', '42', '43', '44']
const COLOURS = [
  { name: 'Obsidian', hex: '#1A1916' },
  { name: 'Ivory', hex: '#EFECE5' },
  { name: 'Stone', hex: '#8A877F' },
  { name: 'Umber', hex: '#5B4B38' },
  { name: 'Gold', hex: '#C9A86A' },
  { name: 'Silver', hex: '#C4C4C0' },
]

export { SORT_OPTIONS }

/**
 * Price inputs commit on blur/Enter so typing doesn't fire a request per keystroke.
 * The parent keys this component on the URL values, so external changes reset it.
 */
function PriceRange({ filters, setFilter }) {
  const [min, setMin] = useState(fromMinorUnits(filters.minPrice))
  const [max, setMax] = useState(fromMinorUnits(filters.maxPrice))

  const commit = () => {
    const minValue = min === '' ? undefined : toMinorUnits(min)
    const maxValue = max === '' ? undefined : toMinorUnits(max)
    setFilter('minPrice', Number.isFinite(minValue) && minValue >= 0 ? String(minValue) : undefined)
    setFilter('maxPrice', Number.isFinite(maxValue) && maxValue >= 0 ? String(maxValue) : undefined)
  }

  const inputClass = 'w-full bg-transparent border-b border-silk focus:border-charcoal py-1 text-sm text-charcoal outline-none'
  return (
    <form className="flex items-end gap-3" onSubmit={(e) => { e.preventDefault(); commit() }}>
      <label className="flex-1 text-[10px] tracking-luxury uppercase text-warmgray">
        Min ₹
        <input type="number" min="0" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} onBlur={commit} className={inputClass} />
      </label>
      <label className="flex-1 text-[10px] tracking-luxury uppercase text-warmgray">
        Max ₹
        <input type="number" min="0" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} onBlur={commit} className={inputClass} />
      </label>
    </form>
  )
}

export default function Filters({ filters, setFilter, resetFilters, categories = [], activeCount = 0, className = '' }) {
  const toggle = (key, value) => setFilter(key, filters[key] === value ? undefined : value)

  return (
    <aside className={`w-full lg:w-64 shrink-0 lg:border-r lg:border-silk lg:pr-8 space-y-12 lg:space-y-14 ${className}`} aria-label="Filters">
      <div>
        <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">Category</h3>
        <ul className="space-y-4">
          <li>
            <button type="button" className={`text-sm font-sans transition-colors duration-300 w-full text-left focus:outline-none focus-visible:underline ${!filters.category ? 'text-charcoal font-medium' : 'text-warmgray hover:text-charcoal'}`} onClick={() => setFilter('category', undefined)}>
              All
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                aria-pressed={filters.category === cat.slug}
                className={`text-sm font-sans transition-colors duration-300 w-full text-left flex justify-between focus:outline-none focus-visible:underline ${filters.category === cat.slug ? 'text-charcoal font-medium' : 'text-warmgray hover:text-charcoal'}`}
                onClick={() => setFilter('category', cat.slug)}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] text-warmgray">{cat.productCount}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">Size</h3>
        <div className="flex flex-wrap gap-3">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={filters.size === size}
              onClick={() => toggle('size', size)}
              className={`w-10 h-10 flex items-center justify-center border rounded-none text-xs font-sans transition-colors duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal ${filters.size === size ? 'bg-obsidian text-cream border-obsidian' : 'border-silk text-warmgray hover:border-charcoal hover:text-charcoal'}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">Colour{filters.colour ? `: ${filters.colour}` : ''}</h3>
        <div className="flex flex-wrap gap-4">
          {COLOURS.map((colour) => (
            <button
              key={colour.name}
              type="button"
              title={colour.name}
              aria-label={colour.name}
              aria-pressed={filters.colour === colour.name}
              onClick={() => toggle('colour', colour.name)}
              style={{ backgroundColor: colour.hex }}
              className={`w-5 h-5 rounded-full border border-silk focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-charcoal transition-transform ${filters.colour === colour.name ? 'ring-1 ring-offset-2 ring-charcoal' : 'hover:scale-110'}`}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">Price</h3>
        <PriceRange key={`${filters.minPrice}-${filters.maxPrice}`} filters={filters} setFilter={setFilter} />
        <label className="flex items-center gap-3 mt-6 cursor-pointer text-sm text-warmgray hover:text-charcoal">
          <input type="checkbox" checked={filters.inStock === 'true'} onChange={(e) => setFilter('inStock', e.target.checked ? 'true' : undefined)} className="accent-charcoal" />
          In stock only
        </label>
      </div>

      <div>
        <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">Sort By</h3>
        <div className="space-y-5 flex flex-col">
          {SORT_OPTIONS.map((option) => (
            <label key={option.val} className="flex items-center gap-4 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                value={option.val}
                checked={filters.sort === option.val}
                onChange={(e) => setFilter('sort', e.target.value)}
                className="appearance-none w-3.5 h-3.5 border border-silk rounded-full checked:bg-obsidian checked:border-obsidian transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal cursor-pointer"
              />
              <span className="text-sm font-sans text-warmgray group-hover:text-charcoal transition-colors duration-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <button type="button" onClick={resetFilters} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none">
          Clear filters ({activeCount})
        </button>
      )}
    </aside>
  )
}
