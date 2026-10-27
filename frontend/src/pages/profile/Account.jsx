import { Link } from 'react-router-dom'

import AddressBook from '../../components/profile/AddressBook.jsx'
import ChangePasswordForm from '../../components/profile/ChangePasswordForm.jsx'
import ProfileDetailsForm from '../../components/profile/ProfileDetailsForm.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate } from '../../utils/format.js'

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16 py-12 border-b border-silk">
      <h2 id={id} className="font-display text-2xl font-light text-charcoal">{title}</h2>
      <div className="lg:col-span-2 max-w-xl">{children}</div>
    </section>
  )
}

export default function Account() {
  const { user, signOut } = useAuth()

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-silk">
        <div>
          <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal tracking-tight m-0">My Account</h1>
          <p className="text-[10px] tracking-luxury uppercase text-warmgray mt-4">Client since {formatDate(user.createdAt, { year: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-8 text-[10px] tracking-luxury uppercase">
          <Link to="/orders" className="text-charcoal hover:opacity-70">Order History</Link>
          <Link to="/wishlist" className="text-charcoal hover:opacity-70">Wishlist</Link>
          <button type="button" onClick={signOut} className="text-warmgray hover:text-charcoal">Sign Out</button>
        </div>
      </div>

      <Section id="details-heading" title="Personal Details"><ProfileDetailsForm /></Section>
      <Section id="addresses-heading" title="Address Book"><AddressBook /></Section>
      <Section id="password-heading" title="Password"><ChangePasswordForm /></Section>
    </div>
  )
}
