import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiUser, FiSun, FiMoon } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const NAV_ITEMS = [
    {
        label: 'Dashboard',
        path: '/admin',
        end: true,
        icon: <FiGrid size={15} strokeWidth={1.5} />
    },
    {
        label: 'Products',
        path: '/admin/products',
        icon: <FiPackage size={15} strokeWidth={1.5} />
    },
    {
        label: 'Orders',
        path: '/admin/orders',
        icon: <FiShoppingBag size={15} strokeWidth={1.5} />
    },
    {
        label: 'Customers',
        path: '/admin/customers',
        icon: <FiUsers size={15} strokeWidth={1.5} />
    },
    {
        label: 'Categories',
        path: '/admin/categories',
        icon: <FiTag size={15} strokeWidth={1.5} />
    },
]

function Breadcrumb() {
    const location = useLocation()
    const parts = location.pathname
        .split('/')
        .filter(Boolean)

    return (
        <div className="flex items-center gap-2 text-xs font-sans text-warmgray">
            {parts.map((part, i) => (
                <span key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-silk">/</span>}
                    <span className={i === parts.length - 1
                        ? 'text-charcoal font-medium capitalize'
                        : 'capitalize'
                    }>
                        {part}
                    </span>
                </span>
            ))}
        </div>
    )
}

export default function AdminLayout() {
    const { user, signOut } = useAuth()
    const { theme, toggleTheme } = useTheme()

    return (
        <div className="min-h-screen flex bg-bg">
            <aside className="w-64 shrink-0 bg-[#0F0E0C] flex flex-col fixed h-full z-40">
                <div className="h-14 flex items-center px-6 border-b border-[#F0EDE6]/10">
                    <Link to="/admin" className="font-sans text-sm font-medium text-[#F0EDE6] tracking-wide">
                        Vela
                    </Link>
                    <span className="ml-2 text-[9px] tracking-luxury uppercase text-[#F0EDE6]/40 mt-px">
                        Admin
                    </span>
                </div>

                <nav className="flex-1 py-6 px-4 flex flex-col gap-1">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-none text-xs
                 tracking-wide font-sans transition-colors duration-200
                 ${isActive
                                    ? 'bg-[#F0EDE6]/10 text-[#F0EDE6]'
                                    : 'text-[#F0EDE6]/50 hover:text-[#F0EDE6] hover:bg-[#F0EDE6]/5'
                                }`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#F0EDE6]/10 flex flex-col gap-3">
                    <Link
                        to="/"
                        className="text-[10px] tracking-luxury uppercase text-[#F0EDE6]/40
                       hover:text-[#F0EDE6] transition-colors"
                    >
                        ← View Storefront
                    </Link>
                    <button
                        onClick={signOut}
                        className="text-[10px] tracking-luxury uppercase text-[#F0EDE6]/40
                       hover:text-[#F0EDE6] transition-colors text-left focus:outline-none"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="h-14 border-b border-silk bg-bg flex items-center
                           justify-between px-8 sticky top-0 z-30">
                    <Breadcrumb />
                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleTheme}
                            className="text-warmgray hover:text-charcoal transition-colors focus:outline-none"
                            aria-label="Toggle Dark Mode"
                        >
                            {theme === 'dark' ? <FiSun size={15} strokeWidth={1.5} /> : <FiMoon size={15} strokeWidth={1.5} />}
                        </button>
                        <div className="flex items-center gap-4 border-l border-silk pl-6">
                            <span className="text-xs text-warmgray font-sans hidden sm:block">{user?.email}</span>
                            <div className="w-7 h-7 rounded-full bg-parchment border border-silk flex items-center justify-center shrink-0">
                                <FiUser size={13} strokeWidth={1.5} className="text-charcoal" />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
