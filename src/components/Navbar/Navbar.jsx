import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiSearch, FiHeart, FiShoppingCart, FiUser, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { useWishlistContext } from '../../context/WishlistContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, loading, isAdmin } = useAuth()
  const { count: cartCount } = useCartContext()
  const { count: wishlistCount } = useWishlistContext()
  const { theme, toggleTheme } = useTheme()

  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setIsSearchOpen(false)
  }, [location.pathname])

  const navLinks = [
    { label: 'Shop', path: '/products' },
    { label: 'Editorial', path: '/editorial' },
    { label: 'About', path: '/about' },
  ]

  const isActive = (path) => location.pathname.startsWith(path)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full h-16 z-50 transition-all duration-300 border-b border-silk ${scrolled ? 'bg-cream/90 backdrop-blur-sm shadow-sm' : 'bg-cream'
          }`}
      >
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          {/* Left: Logo & Subtext */}
          <div className="flex items-center gap-3">
            <Link to="/" className="font-display text-3xl font-light tracking-tight text-charcoal focus:outline-none">
              Vela
            </Link>
            <span className="hidden md:block text-[10px] tracking-luxury text-warmgray lowercase truncate mt-1">a luxury house</span>
          </div>

          {/* Center: Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`text-xs tracking-luxury uppercase transition-colors duration-300 pb-[2px] border-b ${isActive(link.path)
                  ? 'text-charcoal border-charcoal'
                  : 'text-warmgray border-transparent hover:text-charcoal hover:border-charcoal'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-6">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center border-b border-charcoal pb-1">
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent text-sm text-charcoal outline-none w-32 focus:w-48 transition-all duration-300 placeholder:text-warmgray font-sans"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button type="button" onClick={() => setIsSearchOpen(false)} className="text-charcoal ml-2 focus:outline-none">
                  <FiX size={16} strokeWidth={1.5} />
                </button>
              </form>
            ) : (
              <button
                className="hidden md:block text-charcoal hover:opacity-70 transition-opacity focus:outline-none"
                onClick={() => setIsSearchOpen(true)}
              >
                <FiSearch size={18} strokeWidth={1.5} />
              </button>
            )}

            <Link to="/wishlist" className="relative text-charcoal hover:opacity-70 transition-opacity focus:outline-none">
              <FiHeart size={18} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-obsidian text-cream text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-sans">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative text-charcoal hover:opacity-70 transition-opacity focus:outline-none">
              <FiShoppingCart size={18} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-obsidian text-cream text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-sans">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="hidden md:flex items-center gap-6 border-l border-silk pl-6 ml-2">
              <button
                onClick={toggleTheme}
                className="text-warmgray hover:text-charcoal transition-colors focus:outline-none"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? <FiSun size={18} strokeWidth={1.5} /> : <FiMoon size={18} strokeWidth={1.5} />}
              </button>

              {loading ? (
                <div className="w-8 h-8 rounded-full border border-silk bg-parchment animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <Link to="/admin" className="text-[10px] tracking-luxury uppercase text-charcoal hover:opacity-70 transition-opacity">
                      Admin
                    </Link>
                  )}
                  <Link to="/orders" className="w-8 h-8 rounded-full border border-silk overflow-hidden flex items-center justify-center bg-parchment hover:border-charcoal transition-colors focus:outline-none" title="My Orders">
                    <FiUser size={16} strokeWidth={1.5} className="text-charcoal" />
                  </Link>
                  <button onClick={signOut} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors focus:outline-none">
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-xs tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors focus:outline-none">
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden text-charcoal focus:outline-none ml-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <FiMenu size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full Screen Overlay Nav */}
      <div
        className={`fixed inset-0 z-[100] bg-cream flex flex-col transition-transform duration-500 ease-in-out ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
      >
        <div className="h-16 border-b border-silk px-8 flex items-center justify-between shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl font-light tracking-tight text-charcoal">Vela</span>
            <span className="text-xs tracking-luxury text-warmgray lowercase truncate">a luxury house</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-charcoal focus:outline-none hover:opacity-70 transition-opacity">
            <FiX size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-10 p-8 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className="font-display text-4xl font-light text-charcoal hover:opacity-70 transition-opacity"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-12 flex items-center gap-8 border-t border-silk pt-8 w-full max-w-sm justify-center flex-wrap">
            {!user && (
              <Link to="/login" className="text-xs tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors">
                Login
              </Link>
            )}
            {user && (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-xs tracking-luxury uppercase text-charcoal hover:opacity-70 transition-opacity">
                    Admin
                  </Link>
                )}
                <Link to="/orders" className="text-xs tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors">
                  My Account
                </Link>
                <button onClick={signOut} className="text-xs tracking-luxury uppercase text-warmgray hover:text-[#C53030] transition-colors focus:outline-none">
                  Sign Out
                </button>
              </>
            )}
            <button onClick={toggleTheme} className="text-warmgray hover:text-charcoal transition-colors focus:outline-none">
              {theme === 'dark' ? <FiSun size={20} strokeWidth={1.5} /> : <FiMoon size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
