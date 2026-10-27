const CATEGORIES = [
    { id: null, name: 'All' },
    { id: 'womens-rtw', name: 'Womenswear' },
    { id: 'mens-rtw', name: 'Menswear' },
    { id: 'handbags', name: 'Leather Goods' },
    { id: 'accessories', name: 'Fine Accessories' },
    { id: 'fragrances', name: 'Fragrances' },
    { id: 'footwear', name: 'Footwear' }
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const COLORS = ['#1A1916', '#EFECE5', '#8A877F', '#5B4B38']

export default function Filters({ filters, setCategoryId, setSort, className = "" }) {
    return (
        <aside className={`w-full lg:w-64 shrink-0 lg:border-r lg:border-silk lg:pr-8 space-y-12 lg:space-y-16 ${className}`}>

            {/* Categories */}
            <div>
                <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">Category</h3>
                <ul className="space-y-4">
                    {CATEGORIES.map(cat => (
                        <li key={cat.id || 'all'}>
                            <button
                                className={`text-sm font-sans transition-colors duration-300 w-full text-left focus:outline-none ${filters.categoryId === cat.id ? 'text-charcoal font-medium' : 'text-warmgray hover:text-charcoal'}`}
                                onClick={() => setCategoryId(cat.id)}
                            >
                                {cat.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Size (UI Representation for spec alignment) */}
            <div>
                <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">Size</h3>
                <div className="flex flex-wrap gap-3">
                    {SIZES.map((size, idx) => (
                        <button
                            key={size}
                            className={`w-10 h-10 flex items-center justify-center border rounded-none text-xs font-sans transition-colors duration-300 focus:outline-none ${idx === 2 ? 'bg-obsidian text-cream border-obsidian' : 'border-silk text-warmgray hover:border-charcoal hover:text-charcoal'}`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color (UI Representation) */}
            <div>
                <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">Color</h3>
                <div className="flex gap-4">
                    {COLORS.map(hex => (
                        <button
                            key={hex}
                            style={{ backgroundColor: hex }}
                            className="w-5 h-5 rounded-full border border-silk focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-charcoal hover:scale-110 transition-transform"
                            aria-label={`Select Color`}
                        />
                    ))}
                </div>
            </div>

            {/* Sort */}
            <div>
                <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">Sort By</h3>
                <div className="space-y-5 flex flex-col">
                    {[
                        { val: 'newest', label: 'New Arrivals' },
                        { val: 'price-low', label: 'Price: Low-High' },
                        { val: 'price-high', label: 'Price: High-Low' },
                        { val: 'rating', label: 'Highest Rated' }
                    ].map(sortOption => (
                        <label key={sortOption.val} className="flex items-center gap-4 cursor-pointer group">
                            <input
                                type="radio"
                                name="sort"
                                value={sortOption.val}
                                checked={filters.sort === sortOption.val}
                                onChange={(e) => setSort(e.target.value)}
                                className="appearance-none w-3.5 h-3.5 border border-silk rounded-full checked:bg-obsidian checked:border-obsidian transition-colors focus:outline-none cursor-pointer"
                            />
                            <span className="text-sm font-sans text-warmgray group-hover:text-charcoal transition-colors duration-300">
                                {sortOption.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    )
}
