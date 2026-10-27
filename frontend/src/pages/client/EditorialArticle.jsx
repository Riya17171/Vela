import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EDITORIAL_ARTICLES } from '../../data/editorial.js'

export default function EditorialArticle() {
    const { slug } = useParams()

    const article = EDITORIAL_ARTICLES.find(a => a.slug === slug)
    if (!article) return <Navigate to="/editorial" replace />

    const otherArticles = EDITORIAL_ARTICLES.filter(a => a.id !== article.id).slice(0, 3)

    const paragraphs = article.content.split('\n\n').filter(Boolean)

    return (
        <div className="w-full flex flex-col pt-0 pb-0 bg-bg">

            {/* Section 1 — Article Header */}
            <section className="max-w-3xl mx-auto px-8 w-full pt-24 text-center md:text-left">
                <Link to="/editorial" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors">
                    ← The Editorial
                </Link>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] tracking-luxury uppercase text-warmgray mt-12">
                    <span>{article.category}</span>
                    <span>{article.date}</span>
                    <span>{article.readTime}</span>
                </div>
                <h1 className="font-display text-5xl lg:text-7xl font-light text-charcoal leading-tight mt-8 m-0">
                    {article.title}
                </h1>
                <p className="text-xs text-warmgray mt-6 mb-8 font-sans">
                    By Vela Editorial
                </p>
            </section>

            {/* Section 2 — Full-Width Hero Image */}
            <section className="w-full aspect-[16/9] lg:aspect-[21/9] overflow-hidden my-16 bg-charcoal">
                <motion.img
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1.0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                />
            </section>

            {/* Section 3 — Article Body */}
            <section className="max-w-2xl mx-auto px-8 w-full pb-32">
                {paragraphs.map((p, i) => (
                    <motion.p
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="font-sans text-base text-charcoal leading-loose font-light mb-8"
                    >
                        {p}
                    </motion.p>
                ))}

                <div className="flex justify-center my-16">
                    <span className="text-warmgray">✦</span>
                </div>
            </section>

            {/* Section 4 — Related Articles */}
            <section className="w-full border-t border-silk py-24 bg-parchment">
                <div className="max-w-7xl mx-auto px-8">
                    <h3 className="font-display text-3xl font-light text-charcoal mb-16 text-center">
                        More from The Editorial
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {otherArticles.map((rel) => (
                            <Link to={`/editorial/${rel.slug}`} key={rel.slug} className="group cursor-pointer block h-full flex flex-col">
                                <div className="w-full aspect-[4/3] overflow-hidden bg-charcoal mb-6">
                                    <img
                                        src={rel.image}
                                        alt={rel.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                </div>
                                <p className="text-[10px] tracking-luxury uppercase text-warmgray mb-3">
                                    {rel.category}
                                </p>
                                <h4 className="font-display text-xl font-light text-charcoal m-0 leading-snug">
                                    {rel.title}
                                </h4>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    )
}
