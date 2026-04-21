import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full bg-obsidian text-cream border-t border-silk/20">
      <div className="max-w-7xl mx-auto px-8">

        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 py-24">

          {/* Brand Col */}
          <div className="flex flex-col gap-6">
            <Link to="/" className="font-display text-4xl font-light tracking-tight text-cream focus:outline-none">
              Vela
            </Link>
            <p className="font-sans text-xs text-cream/70 leading-relaxed font-light pr-4 mt-2">
              A premium digital storefront experience curating a refined aesthetic designed entirely in silence.
            </p>
            <div className="flex items-center gap-6 mt-4">
              <span className="text-[10px] tracking-luxury uppercase text-cream/50 hover:text-cream cursor-pointer transition-colors">Instagram</span>
              <span className="text-[10px] tracking-luxury uppercase text-cream/50 hover:text-cream cursor-pointer transition-colors">X</span>
              <span className="text-[10px] tracking-luxury uppercase text-cream/50 hover:text-cream cursor-pointer transition-colors">Tiktok</span>
            </div>
          </div>

          {/* Shop */}
          <div className="flex flex-col gap-6 lg:pl-8">
            <h4 className="text-[10px] tracking-luxury uppercase text-cream/50 mb-2">Shop</h4>
            <Link to="/products?category=women" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">Women</Link>
            <Link to="/products?category=men" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">Men</Link>
            <Link to="/products?category=new" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">New Arrivals</Link>
            <Link to="/products?category=sale" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">Sale Archive</Link>
          </div>

          {/* House */}
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] tracking-luxury uppercase text-cream/50 mb-2">House</h4>
            <Link to="/about" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">About Vela</Link>
            <Link to="/editorial" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">Digital Editorial</Link>
            <Link to="/about" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">Sustainability Guarantee</Link>
            <Link to="/about" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">Careers</Link>
          </div>

          {/* Support / Newsletter */}
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] tracking-luxury uppercase text-cream/50 mb-2">Support Services</h4>
            <Link to="/about" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">Clients Contact</Link>
            <Link to="/about" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">Complimentary Shipping</Link>
            <Link to="/about" className="text-xs font-sans text-cream hover:text-cream/70 transition-colors">Questions</Link>

            <div className="mt-8 flex flex-col gap-4">
              <label className="text-[10px] tracking-luxury uppercase text-cream/50">Journal Pass</label>
              <form className="flex border-b border-cream/20 pb-2 group focus-within:border-cream transition-colors">
                <input type="email" placeholder="Email Address" className="bg-transparent text-xs text-cream outline-none w-full placeholder:text-cream/30" />
                <button type="button" className="text-[10px] tracking-luxury uppercase text-cream hover:text-cream/70 transition-colors focus:outline-none">Send</button>
              </form>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cream/10 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[10px] tracking-luxury uppercase text-cream/50">© 2026 Vela. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/about" className="text-[10px] tracking-luxury uppercase text-cream/50 hover:text-cream transition-colors">Terms of Service</Link>
            <Link to="/about" className="text-[10px] tracking-luxury uppercase text-cream/50 hover:text-cream transition-colors">Privacy Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
