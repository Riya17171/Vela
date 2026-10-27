import { useState, useEffect } from 'react'
import { FiStar } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { fetchReviewsByProduct, addReview } from '../../services/reviews.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ReviewSection({ productId, productRating, ratingCount }) {
    const { user } = useAuth()
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)

    useEffect(() => {
        async function load() {
            const data = await fetchReviewsByProduct(productId)
            setReviews(data)
            setLoading(false)
        }
        load()
    }, [productId])

    async function handleSubmit(e) {
        e.preventDefault()
        if (!user) {
            toast.error("Must be logged in to review")
            return
        }
        setSubmitting(true)
        const newReview = await addReview({ productId, userId: user.id, rating, comment })
        if (newReview) {
            setReviews([newReview, ...reviews])
            setComment('')
            setRating(5)
            setIsFormOpen(false)
        }
        setSubmitting(false)
    }

    const breakdown = [
        { stars: 5, percent: 70 },
        { stars: 4, percent: 20 },
        { stars: 3, percent: 5 },
        { stars: 2, percent: 3 },
        { stars: 1, percent: 2 },
    ]

    return (
        <section className="w-full py-24 border-t border-silk bg-bg" id="reviews">
            <h2 className="font-display text-3xl font-light text-charcoal mb-16 text-center">What our clients say</h2>

            <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row gap-16 md:gap-24">

                {/* Rating Summary col */}
                <div className="md:w-1/3 flex flex-col items-center md:items-start shrink-0">
                    <div className="flex items-center gap-6 mb-8">
                        <span className="font-display text-7xl font-light text-charcoal">{Number(productRating).toFixed(1)}</span>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => <FiStar key={i} size={14} fill={i <= productRating ? 'currentColor' : 'none'} className="text-charcoal" strokeWidth={1} />)}
                            </div>
                            <span className="text-xs text-warmgray tracking-luxury uppercase">{ratingCount} Client Reviews</span>
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-4">
                        {breakdown.map(row => (
                            <div className="flex items-center gap-4 w-full" key={row.stars}>
                                <span className="text-xs font-sans text-warmgray w-12">{row.stars} star</span>
                                <div className="flex-1 h-px bg-silk relative">
                                    <div className="absolute top-0 left-0 h-full bg-charcoal" style={{ width: `${row.percent}%` }} />
                                </div>
                                <span className="text-xs font-sans text-warmgray w-8 text-right">{row.percent}%</span>
                            </div>
                        ))}
                    </div>

                    {user && !isFormOpen && (
                        <button onClick={() => setIsFormOpen(true)} className="mt-12 text-xs tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors">
                            Write a Review
                        </button>
                    )}

                    {user && isFormOpen && (
                        <form className="w-full mt-12 space-y-6" onSubmit={handleSubmit}>
                            <h4 className="font-sans text-sm font-medium text-charcoal">Leave your thoughts</h4>
                            <select
                                value={rating}
                                onChange={(e) => setRating(Number(e.target.value))}
                                className="w-full border-b border-silk bg-transparent rounded-none py-2 text-sm text-charcoal outline-none focus:border-charcoal transition-colors cursor-pointer"
                            >
                                <option value={5}>5 Stars - Exceptional</option>
                                <option value={4}>4 Stars - Good</option>
                                <option value={3}>3 Stars - Average</option>
                                <option value={2}>2 Stars - Poor</option>
                                <option value={1}>1 Star - Flawed</option>
                            </select>
                            <textarea
                                className="w-full border-b border-silk bg-transparent rounded-none py-2 text-sm text-charcoal placeholder:text-warmgray outline-none focus:border-charcoal animate-none transition-colors resize-none"
                                rows="3"
                                placeholder="Your experience..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                            />
                            <div className="flex gap-4">
                                <button type="submit" disabled={submitting} className="flex-1 bg-obsidian text-cream text-xs tracking-luxury uppercase py-3 rounded-none font-medium hover:bg-charcoal transition-colors disabled:opacity-50">
                                    {submitting ? 'Submitting...' : 'Publish'}
                                </button>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 border border-charcoal text-charcoal text-xs tracking-luxury uppercase rounded-none hover:bg-parchment transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Review List */}
                <div className="flex-1 flex flex-col pt-2 md:pt-0">
                    {loading ? (
                        <div className="text-xs tracking-luxury uppercase text-warmgray">Loading insights...</div>
                    ) : reviews.length === 0 ? (
                        <div className="text-xs tracking-luxury uppercase text-warmgray">No insights published yet.</div>
                    ) : (
                        reviews.map(rev => (
                            <div className="w-full py-6 border-t border-silk first:border-0 md:first:pt-0" key={rev.id}>
                                <div className="flex justify-between items-center mb-5">
                                    <span className="font-sans text-sm font-medium text-charcoal">{rev.profiles?.full_name || 'Client'}</span>
                                    <span className="text-xs text-warmgray">{new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map(i => <FiStar key={i} size={12} fill={i <= rev.rating ? 'currentColor' : 'none'} color={i <= rev.rating ? 'currentColor' : 'var(--border)'} className={i <= rev.rating ? 'text-charcoal' : 'text-warmgray'} strokeWidth={1} />)}
                                </div>
                                <p className="text-sm text-charcoal leading-relaxed font-light">{rev.comment}</p>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </section>
    )
}
