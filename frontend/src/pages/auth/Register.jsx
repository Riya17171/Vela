import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import FormField from '../../components/common/FormField.jsx'
import { FormAlert } from '../../components/common/StatusViews.jsx'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { registerSchema } from '../../validators/auth.js'

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [error, setError] = useState(null)
  const { register, handleSubmit, setError: setFieldError, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(registerSchema) })

  async function onSubmit(values) {
    setError(null)
    try {
      await signUp(values)
      toast.success('Welcome to Vela.')
      navigate('/', { replace: true })
    } catch (err) {
      Object.entries(err.fieldErrors?.() ?? {}).forEach(([field, message]) => setFieldError(field, { message }))
      setError(err.message)
    }
  }

  return (
    <AuthLayout
      image="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2000&auto=format&fit=crop"
      imageAlt="Luxury Editorial Registration"
      title="Client Registration"
      subtitle="Establish your profile"
      footer={
        <span className="text-[10px] tracking-luxury uppercase text-warmgray">
          Already established? <Link to="/login" className="text-charcoal hover:opacity-70 transition-opacity ml-2">Sign In</Link>
        </span>
      }
    >
      <FormAlert message={error} />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10" noValidate>
        <FormField label="Full Identity" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <FormField label="Email Address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <FormField label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <p className="text-[10px] tracking-luxury uppercase text-warmgray -mt-6">8+ characters, with upper &amp; lower case and a number</p>
        <button type="submit" className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-4 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal disabled:opacity-50 mt-4" disabled={isSubmitting}>
          {isSubmitting ? 'Establishing...' : 'Create Profile'}
        </button>
      </form>
    </AuthLayout>
  )
}
