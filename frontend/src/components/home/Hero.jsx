import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop',
]

export default function Hero() {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.04 }
        }
    }

    const letterVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    }

    return (
        <section className="relative w-full h-[calc(100vh-4rem)] overflow-hidden flex items-end pb-16 pl-0">
            <AnimatePresence initial={false}>
                <motion.div
                    key={currentIndex}
                    className="absolute inset-0 z-0 origin-center"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1.0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                    <img
                        src={HERO_IMAGES[currentIndex]}
                        alt="Luxury Fashion Editorial"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-charcoal/30" />
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 flex flex-col items-start w-full max-w-7xl mx-auto px-8">
                <motion.h1
                    className="font-display text-[clamp(80px,14vw,180px)] font-light text-cream leading-none lowercase m-0 flex overflow-hidden"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    {Array.from("silence").map((letter, i) => (
                        <motion.span key={i} variants={letterVariants} className="inline-block">
                            {letter}
                        </motion.span>
                    ))}
                </motion.h1>

                <motion.p
                    className="text-cream text-[10px] tracking-luxury uppercase font-sans mt-2 mb-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.6 }}
                >
                    Dressed in Silence
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.8 }}
                >
                    <Link to="/products" className="border border-cream text-cream bg-transparent px-8 py-3.5 rounded-none text-xs tracking-luxury uppercase hover:bg-parchment hover:text-charcoal hover:border-parchment transition-colors duration-300 inline-block focus:outline-none">
                        Explore Collection
                    </Link>
                </motion.div>
            </div>

            <div className="absolute bottom-8 right-8 md:right-16 flex flex-col items-center gap-2 z-10">
                <motion.div
                    className="w-px h-12 bg-cream/50 origin-top"
                    animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
        </section>
    )
}
