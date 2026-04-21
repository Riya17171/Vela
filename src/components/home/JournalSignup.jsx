import { FiArrowRight } from 'react-icons/fi'

export default function JournalSignup() {
    return (
        <section className="w-full bg-parchment py-24 px-8 border-t border-silk">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="font-display text-4xl font-light text-charcoal m-0">The Vela Journal</h2>
                    <p className="text-sm text-warmgray font-light mt-4 leading-relaxed max-w-sm">
                        Quarterly dispatches on craft, material, and the idea of dressing well.
                    </p>
                </div>
                <div className="flex flex-col items-start w-full max-w-md md:justify-self-end">
                    <form className="w-full flex items-center border-b border-charcoal pb-2 group" onSubmit={e => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="Email address"
                            required
                            className="bg-transparent text-sm text-charcoal font-sans w-full focus:outline-none placeholder:text-warmgray"
                        />
                        <button type="submit" className="text-charcoal opacity-50 group-hover:opacity-100 transition-opacity focus:outline-none p-2">
                            <FiArrowRight size={16} strokeWidth={1.5} />
                        </button>
                    </form>
                    <p className="text-[10px] tracking-luxury uppercase text-warmgray mt-4">
                        No noise. No promotions. Four times a year.
                    </p>
                </div>
            </div>
        </section>
    )
}
