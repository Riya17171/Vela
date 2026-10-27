import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import FormField from '../../components/common/FormField.jsx'
import { FormAlert } from '../../components/common/StatusViews.jsx'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import { forgotPassword } from '../../services/auth.js'
import { forgotPasswordSchema } from '../../validators/auth.js'

export default function ForgotPassword() {
  const [sent, setSent] = useState(null)
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(forgotPasswordSchema) })

  async function onSubmit({ email }) {
    setError(null)
    try {
      const result = await forgotPassword(email)
      setSent(result.message)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthLayout
      image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop"
      imageAlt="Vela atelier"
      title="Reset access"
      subtitle="We will email you a reset link"
      footer={<Link to="/login" className="text-[10px] tracking-luxury uppercase text-charcoal hover:opacity-70 transition-opacity">← Back to sign in</Link>}
    >
      <FormAlert message={error} />
      {sent ? (
        <FormAlert tone="info" message={sent} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10" noValidate>
          <FormField label="Email Address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <button type="submit" className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-4 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
