import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import FormField from '../../components/common/FormField.jsx'
import { FormAlert } from '../../components/common/StatusViews.jsx'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import { resetPassword } from '../../services/auth.js'
import { resetPasswordSchema } from '../../validators/auth.js'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [error, setError] = useState(token ? null : 'This reset link is incomplete. Request a new one.')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(resetPasswordSchema) })

  async function onSubmit({ password }) {
    setError(null)
    try {
      await resetPassword({ token, password })
      toast.success('Password updated. Please sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthLayout
      image="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2000&auto=format&fit=crop"
      imageAlt="Vela editorial"
      title="New password"
      subtitle="Choose a password for your account"
      footer={<Link to="/forgot-password" className="text-[10px] tracking-luxury uppercase text-charcoal hover:opacity-70 transition-opacity">Request a new link</Link>}
    >
      <FormAlert message={error} />
      {token && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10" noValidate>
          <FormField label="New Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
          <FormField label="Confirm Password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <button type="submit" className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-4 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Update password'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
