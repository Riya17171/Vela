
import { Link } from 'react-router-dom'
import { FiX, FiShoppingCart, FiInfo, FiTrash2 } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useCompare } from '../../context/CompareContext.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Compare() {
  const { items, removeFromCompare, clearCompare } = useCompare()
  const { add } = useCartContext()
  const { user } = useAuth()

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-4">Compare Matrix Empty</h2>
        <p className="font-sans text-sm text-charcoal font-light mb-8">Select artifacts from the shop to analyze side-by-side.</p>
        <Link to="/products" className="bg-transparent border border-charcoal text-charcoal text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-parchment transition-colors focus:outline-none">
          Browse Collection
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-16 md:py-24 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-silk pb-6 gap-4">
        <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal m-0 tracking-tight">Compare Pieces</h1>
        <button className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors" onClick={clearCompare}>
          Clear Matrix
        </button>
      </div>

      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="w-48 p-4 align-top font-sans text-[10px] tracking-luxury uppercase text-warmgray border-b border-silk">Attributes</th>
              {items.map(product => (
                <th key={product.id} className="p-4 align-top border-b border-silk w-64 font-normal">
                  <div className="flex flex-col items-start gap-4 h-full relative">
                    <button className="absolute -top-2 right-0 text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors flex items-center gap-1 focus:outline-none" onClick={() => removeFromCompare(product.id)}>
                      <FiTrash2 size={12} /> Remove
                    </button>
                    <div className="w-full aspect-[3/4] bg-ivory dark:bg-white border border-silk mb-2 flex shrink-0 items-center justify-center p-4">
                      <img src={product.image_url} alt={product.title} className="w-full h-full object-cover object-top mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-700 ease-out" />
                    </div>
                    <Link to={`/products/${product.id}`} className="font-display text-xl text-charcoal font-light m-0 line-clamp-1 hover:opacity-70 transition-opacity">
                      {product.title || 'Archive Collection Piece'}
                    </Link>
                    <div className="font-sans text-sm text-charcoal font-medium">
                      ${Number(product.price || 120.00).toFixed(2)}
                    </div>
                    <button
                      className="w-full mt-auto bg-obsidian text-cream text-[10px] tracking-luxury uppercase py-3 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none flex justify-center items-center gap-2"
                      onClick={() => user ? add(product.id, 1) : toast.error("Please authenticate to reserve pieces.")}
                    >
                      <FiShoppingCart size={12} /> Add to Bag
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-silk group">
              <td className="p-4 align-top font-sans text-[10px] tracking-luxury uppercase text-warmgray">Category</td>
              {items.map(product => (
                <td key={product.id} className="p-4 align-top text-sm text-charcoal font-light">
                  {product.category || 'House Selection'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-silk group">
              <td className="p-4 align-top font-sans text-[10px] tracking-luxury uppercase text-warmgray">Rating</td>
              {items.map(product => (
                <td key={product.id} className="p-4 align-top text-sm text-charcoal font-light">
                  {product.rating} / 5 <span className="text-warmgray ml-1">({product.rating_count} insights)</span>
                </td>
              ))}
            </tr>
            <tr className="group">
              <td className="p-4 align-top font-sans text-[10px] tracking-luxury uppercase text-warmgray">Description</td>
              {items.map(product => (
                <td key={product.id} className="p-4 align-top text-sm text-charcoal font-light leading-relaxed">
                  {product.description || 'Crafted with precision. Engineered for an exceptional lifestyle.'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
