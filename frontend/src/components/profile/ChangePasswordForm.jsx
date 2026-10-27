import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

import { useAuth } from '../../context/AuthContext.jsx'
import { changePasswordSchema } from '../../validators/auth.js'
import FormField from '../common/FormField.jsx'

export default function ChangePasswordForm() {
  const { changePassword } = useAuth()
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(changePasswordSchema) })

  async function onSubmit({ currentPassword, newPassword }) {
    try {
      await changePassword({ currentPassword, newPassword })
      reset()
      toast.success('Password changed. Other devices have been signed out.')
    } catch (err) {
      const fields = err.fieldErrors?.() ?? {}
      if (Object.keys(fields).length) Object.entries(fields).forEach(([field, message]) => setError(field, { message }))
      else toast.error(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <FormField label="Current Password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
      <FormField label="New Password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
      <FormField label="Confirm New Password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <button type="submit" disabled={isSubmitting} className="bg-obsidian text-cream text-xs tracking-luxury uppercase px-8 py-3.5 hover:bg-charcoal transition-colors disabled:opacity-40">
        {isSubmitting ? 'Updating...' : 'Change Password'}
      </button>
    </form>
  )
}
