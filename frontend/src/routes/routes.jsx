import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from '../components/layout/AppLayout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import RequireAdmin from './RequireAdmin.jsx'

// Client pages
const Home = React.lazy(() => import('../pages/client/Home.jsx'))
const Products = React.lazy(() => import('../pages/client/Products.jsx'))
const ProductDetail = React.lazy(() => import('../pages/client/ProductDetail.jsx'))
const Cart = React.lazy(() => import('../pages/client/Cart.jsx'))
const Wishlist = React.lazy(() => import('../pages/client/Wishlist.jsx'))
const Checkout = React.lazy(() => import('../pages/client/Checkout.jsx'))
const Compare = React.lazy(() => import('../pages/client/Compare.jsx'))
const Orders = React.lazy(() => import('../pages/client/Orders.jsx'))
const OrderDetail = React.lazy(() => import('../pages/client/OrderDetail.jsx'))
const Login = React.lazy(() => import('../pages/client/Login.jsx'))
const Register = React.lazy(() => import('../pages/client/Register.jsx'))
const About = React.lazy(() => import('../pages/client/About.jsx'))
const Editorial = React.lazy(() => import('../pages/client/Editorial.jsx'))
const EditorialArticle = React.lazy(() => import('../pages/client/EditorialArticle.jsx'))

const AdminLayout = React.lazy(() => import('../components/layout/AdminLayout.jsx'))
const Dashboard = React.lazy(() => import('../pages/admin/Dashboard.jsx'))
const ProductsAdmin = React.lazy(() => import('../pages/admin/ProductsAdmin.jsx'))
const AddProduct = React.lazy(() => import('../pages/admin/AddProduct.jsx'))
const EditProduct = React.lazy(() => import('../pages/admin/EditProduct.jsx'))
const OrdersAdmin = React.lazy(() => import('../pages/admin/OrdersAdmin.jsx'))
const CustomersAdmin = React.lazy(() => import('../pages/admin/CustomersAdmin.jsx'))
const CategoriesAdmin = React.lazy(() => import('../pages/admin/CategoriesAdmin.jsx'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg w-full flex items-center justify-center font-sans uppercase tracking-luxury text-xs text-warmgray">Loading...</div>}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="compare" element={<Compare />} />
          <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="about" element={<About />} />
          <Route path="editorial" element={<Editorial />} />
          <Route path="editorial/:slug" element={<EditorialArticle />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="products/new" element={<AddProduct />} />
          <Route path="products/:id/edit" element={<EditProduct />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="customers" element={<CustomersAdmin />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

