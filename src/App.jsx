import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { CompareProvider } from './context/CompareContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ErrorBoundary from './components/layout/ErrorBoundary.jsx'
import AppRoutes from './routes/routes.jsx'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            <ThemeProvider>
              <BrowserRouter>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
                <ToastContainer position="bottom-right" theme="dark" />
              </BrowserRouter>
            </ThemeProvider>
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}
