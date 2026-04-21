import { Outlet, useLocation } from 'react-router-dom'

import Navbar from '../Navbar/Navbar.jsx'
import Footer from '../Footer/Footer.jsx'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      <Navbar />
      <main className="flex-1 w-full flex flex-col pt-16" data-route={location.pathname}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
