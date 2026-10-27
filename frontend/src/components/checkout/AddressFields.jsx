import FormField from '../common/FormField.jsx'

/** Shipping address inputs bound to a react-hook-form instance (field names match the API). */
export default function AddressFields({ register, errors, prefix = '' }) {
  const field = (name) => `${prefix}${name}`
  const error = (name) => (prefix ? errors?.[prefix.replace('.', '')]?.[name] : errors?.[name])?.message
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <FormField label="Full Name" autoComplete="name" error={error('fullName')} {...register(field('fullName'))} />
        <FormField label="Phone" type="tel" autoComplete="tel" error={error('phone')} {...register(field('phone'))} />
      </div>
      <FormField label="Address" autoComplete="address-line1" error={error('line1')} {...register(field('line1'))} />
      <FormField label="Apartment, suite (optional)" autoComplete="address-line2" error={error('line2')} {...register(field('line2'))} />
      <div className="flex flex-col md:flex-row gap-8">
        <FormField label="City" autoComplete="address-level2" error={error('city')} {...register(field('city'))} />
        <FormField label="State" autoComplete="address-level1" error={error('state')} {...register(field('state'))} />
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <FormField label="Postal Code" autoComplete="postal-code" error={error('postalCode')} {...register(field('postalCode'))} />
        <FormField label="Country (code)" autoComplete="country" maxLength={2} error={error('country')} {...register(field('country'))} />
      </div>
    </div>
  )
}
