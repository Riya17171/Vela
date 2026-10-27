import { Link } from 'react-router-dom'
import { EDITORIAL_ARTICLES } from '../../data/editorial.js'

export default function EditorialTeaser() {
    const teasers = EDITORIAL_ARTICLES.slice(0, 3)

    return (
        <section className="w-full bg-obsidian text-cream py-24 px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end mb-16 gap-6 border-b border-cream/20 pb-8">
                <h2 className="font-display text-5xl font-light text-cream m-0">The Editorial</h2>
                <Link to="/editorial" className="text-xs tracking-luxury uppercase text-cream/70 hover:text-cream transition-colors focus:outline-none pb-1">
                    Read More →
                </Link>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {teasers.map((article) => (
                    <Link to={`/editorial/${article.slug}`} key={article.slug} className="group cursor-pointer">
                        <div className="w-full aspect-[4/5] overflow-hidden bg-charcoal">
                            <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                        </div>
                        <p className="text-[10px] tracking-luxury uppercase text-cream/50 mt-6">{article.category}</p>
                        <h3 className="font-display text-2xl font-light text-cream mt-2 group-hover:underline underline-offset-4 decoration-1 decoration-cream/30">{article.title}</h3>
                        <p className="text-xs text-cream/40 mt-2 font-sans">{article.date}</p>
                    </Link>
                ))}
            </div>
        </section>
    )
}
