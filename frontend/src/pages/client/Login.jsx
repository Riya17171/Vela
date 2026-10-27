import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabaseClient.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: signInData, error: signInError } = await signIn({ email, password })
    if (signInError) {
      setError(signInError.message)
    } else {
      if (signInData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', signInData.user.id)
          .maybeSingle()

        if (profile?.role === 'admin') {
          navigate('/admin', { replace: true })
          setLoading(false)
          return
        }
      }
      navigate(from, { replace: true })
    }
    setLoading(false)
  }

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-ivory">
      {/* Left: Editorial Image split */}
      <div className="hidden lg:block relative overflow-hidden h-screen bg-charcoal">
        <motion.img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2000&auto=format&fit=crop"
          alt="Luxury Editorial"
          className="w-full h-full object-cover mix-blend-luminosity opacity-80"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 12, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-charcoal/20" />
      </div>

      {/* Right: Authentication Interface */}
      <div className="flex flex-col justify-center items-center w-full min-h-screen px-4 p-8 bg-bg">
        <div className="w-full max-w-xs mx-auto flex flex-col">
          <Link to="/" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors mb-16 inline-block w-max">← Return to House</Link>

          <h1 className="font-display text-4xl font-light text-charcoal mb-2 m-0 tracking-tight">Welcome back</h1>
          <p className="text-[10px] tracking-luxury uppercase text-warmgray mb-12">Authenticate your account</p>

          {error && <div className="text-[10px] tracking-luxury uppercase text-[#e53e3e] mb-8 border border-[#e53e3e]/30 px-4 py-3 bg-[#e53e3e]/5">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            <div className="flex flex-col relative w-full">
              <label className="text-[10px] tracking-luxury uppercase text-warmgray">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 border-silk rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 focus:border-charcoal transition-colors"
              />
            </div>

            <div className="flex flex-col relative w-full">
              <label className="text-[10px] tracking-luxury uppercase text-warmgray">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 border-silk rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 focus:border-charcoal transition-colors"
              />
            </div>

            <button type="submit" className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-4 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none disabled:opacity-50 mt-4" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>



          <div className="mt-12 text-center">
            <span className="text-[10px] tracking-luxury uppercase text-warmgray">
              New to Vela? <Link to="/register" className="text-charcoal hover:opacity-70 transition-opacity ml-2">Create Account</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
