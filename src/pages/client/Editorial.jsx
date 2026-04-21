import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EDITORIAL_ARTICLES } from '../../data/editorial.js'
import JournalSignup from '../../components/home/JournalSignup.jsx'

export default function Editorial() {
    const featuredArticle = EDITORIAL_ARTICLES.find(a => a.featured) || EDITORIAL_ARTICLES[0]
    const otherArticles = EDITORIAL_ARTICLES.filter(a => a.id !== featuredArticle.id)

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    }

    return (
        <div className="w-full flex flex-col pt-0 pb-0 bg-bg">

            {/* Section 1 — Hero */}
            <section className="py-24 px-8 max-w-7xl mx-auto border-b border-silk w-full">
                <p className="text-[10px] tracking-luxury uppercase text-warmgray mb-8">
                    The Vela Editorial
                </p>
                <h1 className="font-display text-5xl md:text-7xl font-light text-charcoal m-0 leading-[1.1]">
                    On Dressing<br />Well.
                </h1>
                <p className="text-xs text-warmgray mt-6 font-sans">
                    Volume I — 2025
                </p>
            </section>

            {/* Section 2 — Featured Article */}
            <section className="max-w-7xl mx-auto w-full px-8 py-16">
                <Link to={`/editorial/${featuredArticle.slug}`} className="group cursor-pointer block">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 mb-16 border border-silk">
                        <div className="w-full aspect-[4/3] overflow-hidden bg-charcoal">
                            <img
                                src={featuredArticle.image}
                                alt={featuredArticle.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                        </div>
                        <div className="bg-parchment p-12 lg:p-16 flex flex-col justify-center">
                            <p className="text-[10px] tracking-luxury uppercase text-warmgray mb-6">
                                Featured — {featuredArticle.category}
                            </p>
                            <h2 className="font-display text-4xl md:text-5xl font-light text-charcoal m-0 leading-tight">
                                {featuredArticle.title}
                            </h2>
                            <p className="text-sm text-warmgray font-light leading-relaxed mt-6 mb-8 max-w-md">
                                {featuredArticle.excerpt}
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-8 border-t border-charcoal/10">
                                <span className="text-[10px] tracking-luxury uppercase text-warmgray">
                                    {featuredArticle.date} — {featuredArticle.readTime}
                                </span>
                                <span className="text-[10px] tracking-luxury uppercase text-charcoal border-b border-charcoal pb-px group-hover:bg-charcoal group-hover:text-cream transition-colors duration-300 px-2 py-1">
                                    Read Article
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </section>

            {/* Section 3 — Article Grid */}
            <motion.section
                className="max-w-7xl mx-auto w-full px-8 pb-32"
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8">
                    {otherArticles.map((article) => (
                        <motion.div variants={itemVariants} key={article.id}>
                            <Link to={`/editorial/${article.slug}`} className="group cursor-pointer block h-full flex flex-col">
                                <div className="w-full aspect-[4/3] overflow-hidden bg-charcoal mb-6">
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                </div>
                                <p className="text-[10px] tracking-luxury uppercase text-warmgray mb-3">
                                    {article.category}
                                </p>
                                <h3 className="font-display text-2xl font-light text-charcoal m-0 leading-snug">
                                    {article.title}
                                </h3>
                                <p className="text-sm text-warmgray font-light leading-relaxed mt-4 mb-6 flex-grow">
                                    {article.excerpt}
                                </p>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-[10px] tracking-luxury uppercase text-warmgray">
                                        {article.date} — {article.readTime}
                                    </span>
                                </div>
                                {/* Hover line */}
                                <div className="w-0 group-hover:w-full bg-charcoal h-px transition-all duration-500 mt-6" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Section 4 — Journal Signup */}
            <JournalSignup />

        </div>
    )
}
