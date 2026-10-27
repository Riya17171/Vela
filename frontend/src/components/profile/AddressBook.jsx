import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

import { useAsync } from '../../hooks/useAsync.js'
import { createAddress, deleteAddress, listAddresses, updateAddress } from '../../services/users.js'
import { addressSchema, compactAddress } from '../../validators/address.js'
import AddressFields from '../checkout/AddressFields.jsx'
import { ErrorState, LoadingState } from '../common/StatusViews.jsx'

const MAX_ADDRESSES = 5

function AddressForm({ initial, onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(addressSchema),
    defaultValues: { country: 'IN', ...initial },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 border border-silk p-6" noValidate>
      <AddressFields register={register} errors={errors} />
      <div className="flex gap-6">
        <button type="submit" disabled={isSubmitting} className="bg-obsidian text-cream text-xs tracking-luxury uppercase px-8 py-3 hover:bg-charcoal transition-colors disabled:opacity-40">
          {isSubmitting ? 'Saving...' : 'Save Address'}
        </button>
        <button type="button" onClick={onCancel} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal">Cancel</button>
      </div>
    </form>
  )
}

export default function AddressBook() {
  const { data: addresses, loading, error, reload, setData } = useAsync(listAddresses, [], { initialData: [] })
  const [editing, setEditing] = useState(null) // address id, 'new', or null

  async function run(operation, message) {
    try {
      setData(await operation())
      setEditing(null)
      toast.success(message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading && !addresses.length) return <LoadingState className="min-h-[10rem]" />
  if (error) return <ErrorState error={error} onRetry={reload} className="min-h-[10rem]" />

  return (
    <div className="space-y-6">
      {addresses.length === 0 && editing !== 'new' && <p className="text-sm text-warmgray font-light">No saved addresses yet.</p>}

      {addresses.map((address) =>
        editing === address.id ? (
          <AddressForm
            key={address.id}
            initial={address}
            onCancel={() => setEditing(null)}
            onSubmit={(values) => run(() => updateAddress(address.id, compactAddress(values)), 'Address updated')}
          />
        ) : (
          <div key={address.id} className="border border-silk p-6 flex flex-col sm:flex-row justify-between gap-4">
            <address className="not-italic text-sm text-charcoal font-light leading-relaxed">
              <span className="font-medium">{address.fullName}</span>
              {address.isDefault && <span className="ml-3 text-[9px] tracking-luxury uppercase text-warmgray">Default</span>}<br />
              {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
              {address.city}, {address.state} {address.postalCode}, {address.country}<br />
              <span className="text-warmgray">{address.phone}</span>
            </address>
            <div className="flex sm:flex-col gap-4 items-start text-[10px] tracking-luxury uppercase">
              <button type="button" onClick={() => setEditing(address.id)} className="text-warmgray hover:text-charcoal">Edit</button>
              {!address.isDefault && (
                <button type="button" onClick={() => run(() => updateAddress(address.id, { isDefault: true }), 'Default address updated')} className="text-warmgray hover:text-charcoal">Make default</button>
              )}
              <button type="button" onClick={() => run(() => deleteAddress(address.id), 'Address removed')} className="text-warmgray hover:text-[#C53030]">Remove</button>
            </div>
          </div>
        ),
      )}

      {editing === 'new' ? (
        <AddressForm onCancel={() => setEditing(null)} onSubmit={(values) => run(() => createAddress(compactAddress(values)), 'Address saved')} />
      ) : (
        addresses.length < MAX_ADDRESSES && (
          <button type="button" onClick={() => setEditing('new')} className="border border-charcoal text-charcoal text-xs tracking-luxury uppercase px-8 py-3 hover:bg-parchment transition-colors">
            + Add Address
          </button>
        )
      )}
    </div>
  )
}
