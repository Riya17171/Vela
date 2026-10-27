import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import FormField from '../../components/common/FormField.jsx'
import { FormAlert } from '../../components/common/StatusViews.jsx'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { loginSchema } from '../../validators/auth.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, sessionExpired, clearSessionExpired } = useAuth()
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(loginSchema) })

  const from = location.state?.from?.pathname

  async function onSubmit(values) {
    setError(null)
    try {
      const user = await signIn(values)
      clearSessionExpired()
      navigate(from || (user.role === 'admin' ? '/admin' : '/'), { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthLayout
      image="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2000&auto=format&fit=crop"
      imageAlt="Luxury Editorial"
      title="Welcome back"
      subtitle="Authenticate your account"
      footer={
        <span className="text-[10px] tracking-luxury uppercase text-warmgray">
          New to Vela? <Link to="/register" className="text-charcoal hover:opacity-70 transition-opacity ml-2">Create Account</Link>
        </span>
      }
    >
      {sessionExpired && !error && <FormAlert tone="info" message="Your session ended. Please sign in again." />}
      <FormAlert message={error} />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10" noValidate>
        <FormField label="Email Address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <FormField label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Link to="/forgot-password" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors -mt-6 self-end">
          Forgot password?
        </Link>
        <button type="submit" className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-4 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal disabled:opacity-50" disabled={isSubmitting}>
          {isSubmitting ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  )
}
