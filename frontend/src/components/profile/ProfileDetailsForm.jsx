import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

import { useAuth } from '../../context/AuthContext.jsx'
import { updateProfile } from '../../services/users.js'
import { profileSchema } from '../../validators/address.js'
import FormField from '../common/FormField.jsx'

export default function ProfileDetailsForm() {
  const { user, updateUser } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: { fullName: user.fullName, phone: user.phone ?? '' },
  })

  async function onSubmit(values) {
    try {
      const updated = await updateProfile({ fullName: values.fullName, phone: values.phone ?? '' })
      updateUser(updated)
      reset({ fullName: updated.fullName, phone: updated.phone ?? '' })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <FormField label="Full Name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
      <div className="flex flex-col gap-2">
        <span className="text-[10px] tracking-luxury uppercase text-warmgray">Email</span>
        <span className="text-sm text-charcoal py-2 border-b border-silk">{user.email}</span>
      </div>
      <FormField label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <button type="submit" disabled={isSubmitting || !isDirty} className="bg-obsidian text-cream text-xs tracking-luxury uppercase px-8 py-3.5 hover:bg-charcoal transition-colors disabled:opacity-40">
        {isSubmitting ? 'Saving...' : 'Save Details'}
      </button>
    </form>
  )
}
