import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'

function AnimatedNumber({ value }) {
    const count = useMotionValue(0)
    const display = useTransform(count, (v) => Math.round(v))

    useEffect(() => {
        const animation = animate(count, value, { duration: 2, ease: "easeOut" })
        return animation.stop
    }, [value, count])

    return <motion.span>{display}</motion.span>
}

export default function About() {
    return (
        <div className="w-full flex flex-col pt-0 pb-0">

            {/* Section 1 — Full-Screen Opening Statement */}
            <section className="relative w-full h-[calc(100vh-4rem)] overflow-hidden flex items-end pb-16 px-8 bg-charcoal">
                <motion.div
                    className="absolute inset-0 z-0 origin-center"
                    initial={{ scale: 1.05 }}
                    animate={{ scale: [1.05, 1.0] }}
                    transition={{ duration: 12, ease: "easeOut" }}
                >
                    <img
                        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop"
                        alt="Editorial black and white"
                        className="w-full h-full object-cover grayscale"
                    />
                    <div className="absolute inset-0 bg-charcoal/50" />
                </motion.div>

                <div className="relative z-10 w-full max-w-7xl mx-auto">
                    <p className="text-[10px] tracking-luxury uppercase text-cream/60 mb-8">
                        Est. 2024 — Milan / London
                    </p>
                    <h1 className="font-display text-[clamp(60px,10vw,140px)] font-light text-cream leading-none m-0">
                        Dressed<br />in Silence.
                    </h1>
                    <p className="max-w-md text-sm text-cream/70 font-light leading-relaxed mt-6">
                        Vela is a house built on a single conviction —
                        that the most powerful thing a garment can say
                        is nothing at all.
                    </p>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 right-8 md:right-16 md:bottom-16 flex flex-col items-center gap-2 z-10">
                    <motion.div
                        className="w-px h-12 bg-cream/50 origin-top"
                        animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </section>

            {/* Section 2 — The Manifesto */}
            <section className="w-full py-32 px-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
                <div>
                    <p className="text-[10px] tracking-luxury uppercase text-warmgray mb-8">
                        The Vela Philosophy
                    </p>
                    <h2 className="font-display text-4xl font-light text-charcoal leading-relaxed m-0">
                        We build clothing for people
                        who have stopped trying.
                    </h2>
                </div>
                <div className="flex flex-col">
                    <p className="text-sm font-sans text-charcoal font-light leading-relaxed pb-8 pt-0 border-t border-silk mt-0">
                        There is a certain kind of person who has moved through
                        fashion and come out the other side. They are not interested
                        in what is new. They are interested in what is right.
                    </p>
                    <p className="text-sm font-sans text-charcoal font-light leading-relaxed py-8 border-t border-silk">
                        Vela was founded to dress those people.
                        Every piece in the collection is built to a single standard:
                        will this still be worn in twenty years? If the answer
                        is uncertain, it does not belong here.
                    </p>
                    <p className="text-sm font-sans text-charcoal font-light leading-relaxed pt-8 border-t border-silk">
                        We work with a small number of mills in Italy, Scotland,
                        and France that share our obsession with material honesty.
                        Nothing is coated. Nothing is treated. Nothing is rushed.
                    </p>
                </div>
            </section>

            {/* Section 3 — Three Brand Pillars */}
            <section className="w-full bg-parchment py-24 px-8">
                <h2 className="font-display text-4xl font-light text-charcoal text-center mb-16 underline decoration-1 underline-offset-[16px] decoration-charcoal/20">
                    What we believe
                </h2>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
                    {/* Pillar 1 */}
                    <div className="flex flex-col items-start">
                        <span className="font-display text-7xl font-light text-silk">01</span>
                        <div className="border-t border-charcoal w-12 my-6" />
                        <h3 className="font-sans text-sm font-medium text-charcoal tracking-wide uppercase mb-4">Material Honesty</h3>
                        <p className="text-sm text-warmgray font-light leading-relaxed">
                            We use only materials that improve with age.
                            Cashmere softens. Leather develops patina.
                            Linen becomes more beautiful the more it is washed.
                            Synthetic blends are not considered.
                        </p>
                    </div>
                    {/* Pillar 2 */}
                    <div className="flex flex-col items-start">
                        <span className="font-display text-7xl font-light text-silk">02</span>
                        <div className="border-t border-charcoal w-12 my-6" />
                        <h3 className="font-sans text-sm font-medium text-charcoal tracking-wide uppercase mb-4">Constructed to Last</h3>
                        <p className="text-sm text-warmgray font-light leading-relaxed">
                            Every seam is reinforced. Every button is sewn with
                            four threads. Every jacket is fully canvassed.
                            We offer free restoration for the life of the garment.
                        </p>
                    </div>
                    {/* Pillar 3 */}
                    <div className="flex flex-col items-start">
                        <span className="font-display text-7xl font-light text-silk">03</span>
                        <div className="border-t border-charcoal w-12 my-6" />
                        <h3 className="font-sans text-sm font-medium text-charcoal tracking-wide uppercase mb-4">Designed to Disappear</h3>
                        <p className="text-sm text-warmgray font-light leading-relaxed">
                            The highest compliment Vela can receive is that
                            someone is described as well-dressed, not as wearing
                            a Vela piece. The garment should serve the person,
                            not the other way around.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 4 — The Making Of */}
            <section className="w-full py-24 overflow-hidden border-b border-silk">
                <div className="max-w-7xl mx-auto px-8">
                    <h2 className="font-display text-4xl font-light text-charcoal mb-16 m-0">How it's made</h2>
                </div>

                <div
                    className="flex gap-8 px-8 overflow-x-auto hide-scrollbar pb-8 snap-x snap-mandatory"
                >
                    {/* Step 1 */}
                    <div className="w-[80vw] md:w-[400px] shrink-0 flex flex-col gap-6 snap-start">
                        <div className="w-full aspect-[4/5] overflow-hidden bg-bg">
                            <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800" alt="The Material" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] tracking-luxury uppercase text-warmgray">01 — The Material</p>
                        <p className="text-sm font-light text-charcoal leading-relaxed max-w-sm">
                            We source directly from mills rather than converters.
                            Every fabric is touched before it is ordered.
                            We reject more than we accept.
                        </p>
                    </div>
                    {/* Step 2 */}
                    <div className="w-[80vw] md:w-[400px] shrink-0 flex flex-col gap-6 snap-start">
                        <div className="w-full aspect-[4/5] overflow-hidden bg-bg">
                            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800" alt="The Pattern" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] tracking-luxury uppercase text-warmgray">02 — The Pattern</p>
                        <p className="text-sm font-light text-charcoal leading-relaxed max-w-sm">
                            Each pattern is drawn by hand before it is digitized.
                            The first toile is always cut in cheap cotton.
                            We make an average of seven corrections before cutting into fabric.
                        </p>
                    </div>
                    {/* Step 3 */}
                    <div className="w-[80vw] md:w-[400px] shrink-0 flex flex-col gap-6 snap-start">
                        <div className="w-full aspect-[4/5] overflow-hidden bg-bg">
                            <img src="https://images.unsplash.com/photo-1601924921557-45e6dea0a157?q=80&w=800" alt="The Construction" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] tracking-luxury uppercase text-warmgray">03 — The Construction</p>
                        <p className="text-sm font-light text-charcoal leading-relaxed max-w-sm">
                            Our manufacturing partners work in small ateliers,
                            not factories. A Vela piece passes through twelve
                            pairs of hands before it leaves the building.
                        </p>
                    </div>
                    {/* Step 4 */}
                    <div className="w-[80vw] md:w-[400px] shrink-0 flex flex-col gap-6 snap-start">
                        <div className="w-full aspect-[4/5] overflow-hidden bg-bg">
                            <img src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800" alt="The Finish" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] tracking-luxury uppercase text-warmgray">04 — The Finish</p>
                        <p className="text-sm font-light text-charcoal leading-relaxed max-w-sm">
                            Every garment is pressed by hand. Every button is tested.
                            Every zip is run fifty times. It leaves only when
                            it is ready.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 5 — Sustainability Statement */}
            <section className="w-full py-24 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-1">
                    <p className="text-[10px] tracking-luxury uppercase text-warmgray">
                        Our Responsibility
                    </p>
                </div>
                <div className="lg:col-span-2">
                    <h2 className="font-display text-3xl font-light text-charcoal mb-12 max-w-xl leading-snug m-0">
                        The most sustainable garment
                        is one that is never thrown away.
                    </h2>

                    <div className="grid grid-cols-3 gap-8 mb-16">
                        <div>
                            <div className="font-display text-4xl md:text-5xl font-light text-charcoal">
                                <AnimatedNumber value={100} />%
                            </div>
                            <p className="text-xs text-warmgray mt-2 font-sans">Natural fibres only</p>
                        </div>
                        <div>
                            <div className="font-display text-4xl md:text-5xl font-light text-charcoal">
                                <AnimatedNumber value={5} />
                            </div>
                            <p className="text-xs text-warmgray mt-2 font-sans">Manufacturing partners worldwide</p>
                        </div>
                        <div>
                            <div className="font-display text-4xl md:text-5xl font-light text-charcoal">∞</div>
                            <p className="text-xs text-warmgray mt-2 font-sans">Free restoration, forever</p>
                        </div>
                    </div>

                    <p className="text-sm text-warmgray font-light leading-relaxed max-w-lg">
                        We do not publish sustainability reports.
                        We do not use recycled polyester and call it responsible.
                        We build things that last. That is the only
                        environmental argument that matters.
                    </p>
                </div>
            </section>

            {/* Section 6 — Closing CTA */}
            <section className="w-full bg-obsidian text-cream py-32 px-8 text-center flex flex-col items-center border-t border-charcoal">
                <h2 className="font-display text-6xl font-light m-0">Begin here.</h2>
                <p className="text-sm text-cream/60 font-light mt-6 mb-12 max-w-sm mx-auto leading-relaxed">
                    The collection is available exclusively online
                    and by appointment in London and Milan.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
                    <Link to="/products" className="bg-cream text-obsidian px-8 py-4 text-xs tracking-luxury uppercase hover:opacity-90 transition-opacity">
                        Explore Collection
                    </Link>
                    <a href="mailto:appointments@vela.com" className="border border-cream/40 text-cream px-8 py-4 text-xs tracking-luxury uppercase hover:bg-cream/10 transition-colors">
                        Book an Appointment
                    </a>
                </div>
            </section>

        </div>
    )
}
