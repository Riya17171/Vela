import { Link } from 'react-router-dom'

export default function PhilosophyStatement() {
    return (
        <section className="w-full py-32 px-8 max-w-4xl mx-auto text-center flex flex-col items-center">
            <blockquote className="font-display text-3xl md:text-5xl font-light text-charcoal leading-relaxed">
                "Vela is not a fashion brand.<br />
                It is an argument for restraint."
            </blockquote>
            <p className="font-sans text-sm text-warmgray leading-relaxed max-w-xl mx-auto mt-8">
                Founded on the belief that the most powerful thing
                a garment can do is disappear into the person wearing it.
                Every piece is built to last, designed to say nothing,
                and made to be worn until it becomes part of you.
            </p>
            <Link to="/about" className="mt-12 text-[10px] tracking-luxury uppercase text-charcoal border-b border-charcoal/30 pb-1 hover:border-charcoal transition-colors">
                Our Philosophy
            </Link>
        </section>
    )
}
