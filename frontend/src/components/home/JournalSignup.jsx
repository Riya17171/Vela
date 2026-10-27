import { useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'

import { subscribeToJournal } from '../../services/meta.js'

export default function JournalSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus({ state: 'loading', message: '' })
    try {
      const result = await subscribeToJournal(email)
      setStatus({ state: 'done', message: result.message })
      setEmail('')
    } catch (err) {
      setStatus({ state: 'error', message: err.message })
    }
  }

  return (
    <section className="w-full bg-parchment py-24 px-4 sm:px-8 border-t border-silk">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="font-display text-4xl font-light text-charcoal m-0">The Vela Journal</h2>
          <p className="text-sm text-warmgray font-light mt-4 leading-relaxed max-w-sm">Quarterly dispatches on craft, material, and the idea of dressing well.</p>
        </div>
        <div className="flex flex-col items-start w-full max-w-md md:justify-self-end">
          <form className="w-full flex items-center border-b border-charcoal pb-2 group" onSubmit={handleSubmit}>
            <label htmlFor="journal-email" className="sr-only">Email address</label>
            <input
              id="journal-email"
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent text-sm text-charcoal font-sans w-full focus:outline-none placeholder:text-warmgray"
            />
            <button type="submit" aria-label="Subscribe" disabled={status.state === 'loading'} className="text-charcoal opacity-50 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:opacity-100 p-2 disabled:opacity-30">
              <FiArrowRight size={16} strokeWidth={1.5} />
            </button>
          </form>
          <p role="status" className={`text-[10px] tracking-luxury uppercase mt-4 ${status.state === 'error' ? 'text-[#e53e3e]' : 'text-warmgray'}`}>
            {status.message || 'No noise. No promotions. Four times a year.'}
          </p>
        </div>
      </div>
    </section>
  )
}
