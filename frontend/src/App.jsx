import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import ErrorBoundary from './components/layout/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { CompareProvider } from './context/CompareContext.jsx'
import { ConfigProvider } from './context/ConfigContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import AppRoutes from './routes/routes.jsx'

export default function App() {
  return (
    <ConfigProvider>
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
    </ConfigProvider>
  )
}
