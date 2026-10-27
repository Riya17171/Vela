import { useState } from 'react'
import { FiStar } from 'react-icons/fi'
import { toast } from 'react-toastify'

import { useAuth } from '../../context/AuthContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { createReview, deleteReview, fetchReviews } from '../../services/reviews.js'
import { formatDate } from '../../utils/format.js'

function Stars({ value, size = 14 }) {
  return (
    <div className="flex gap-1" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar key={i} size={size} fill={i <= Math.round(value) ? 'currentColor' : 'none'} className={i <= Math.round(value) ? 'text-charcoal' : 'text-warmgray'} strokeWidth={1} />
      ))}
    </div>
  )
}

export default function ReviewSection({ productId }) {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(() => fetchReviews(productId, { limit: 20 }), [productId])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const reviews = data?.reviews ?? []
  const summary = data?.summary ?? { average: 0, count: 0, breakdown: {} }
  const hasOwnReview = reviews.some((review) => review.isOwn)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createReview(productId, { rating, comment })
      toast.success('Thank you. Your review is published.')
      setComment('')
      setRating(5)
      setIsFormOpen(false)
      await reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(reviewId) {
    try {
      await deleteReview(reviewId)
      toast.success('Review removed')
      await reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <section className="w-full py-24 border-t border-silk bg-bg" id="reviews" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="font-display text-3xl font-light text-charcoal mb-16 text-center">What our clients say</h2>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row gap-16 md:gap-24">
        <div className="md:w-1/3 flex flex-col items-center md:items-start shrink-0">
          <div className="flex items-center gap-6 mb-8">
            <span className="font-display text-7xl font-light text-charcoal">{summary.count ? summary.average.toFixed(1) : '—'}</span>
            <div className="flex flex-col gap-2">
              <Stars value={summary.average} />
              <span className="text-xs text-warmgray tracking-luxury uppercase">{summary.count} Client {summary.count === 1 ? 'Review' : 'Reviews'}</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-4">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.breakdown[stars] ?? 0
              const percent = summary.count ? Math.round((count / summary.count) * 100) : 0
              return (
                <div className="flex items-center gap-4 w-full" key={stars}>
                  <span className="text-xs font-sans text-warmgray w-12">{stars} star</span>
                  <div className="flex-1 h-px bg-silk relative" role="presentation">
                    <div className="absolute top-0 left-0 h-full bg-charcoal" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="text-xs font-sans text-warmgray w-8 text-right">{percent}%</span>
                </div>
              )
            })}
          </div>

          {!user && <p className="mt-12 text-[10px] tracking-luxury uppercase text-warmgray">Sign in to share your experience.</p>}

          {user && !hasOwnReview && !isFormOpen && (
            <button type="button" onClick={() => setIsFormOpen(true)} className="mt-12 text-xs tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors">
              Write a Review
            </button>
          )}

          {user && isFormOpen && (
            <form className="w-full mt-12 space-y-6" onSubmit={handleSubmit}>
              <h3 className="font-sans text-sm font-medium text-charcoal">Leave your thoughts</h3>
              <label className="sr-only" htmlFor="review-rating">Rating</label>
              <select id="review-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full border-b border-silk bg-transparent rounded-none py-2 text-sm text-charcoal outline-none focus:border-charcoal transition-colors cursor-pointer">
                <option value={5}>5 Stars - Exceptional</option>
                <option value={4}>4 Stars - Good</option>
                <option value={3}>3 Stars - Average</option>
                <option value={2}>2 Stars - Poor</option>
                <option value={1}>1 Star - Flawed</option>
              </select>
              <label className="sr-only" htmlFor="review-comment">Your review</label>
              <textarea
                id="review-comment"
                className="w-full border-b border-silk bg-transparent rounded-none py-2 text-sm text-charcoal placeholder:text-warmgray outline-none focus:border-charcoal transition-colors resize-none"
                rows="3"
                placeholder="Your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                minLength={3}
                maxLength={2000}
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

        <div className="flex-1 flex flex-col pt-2 md:pt-0">
          {loading ? (
            <div className="text-xs tracking-luxury uppercase text-warmgray">Loading reviews...</div>
          ) : error ? (
            <div role="alert" className="text-xs tracking-luxury uppercase text-warmgray">
              Reviews could not be loaded. <button type="button" onClick={reload} className="underline">Retry</button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-xs tracking-luxury uppercase text-warmgray">No reviews yet. Be the first to share yours.</div>
          ) : (
            reviews.map((rev) => (
              <article className="w-full py-6 border-t border-silk first:border-0 md:first:pt-0" key={rev.id}>
                <div className="flex justify-between items-center mb-5 gap-4">
                  <span className="font-sans text-sm font-medium text-charcoal">
                    {rev.author.fullName}
                    {rev.verifiedPurchase && <span className="ml-3 text-[9px] tracking-luxury uppercase text-warmgray">Verified purchase</span>}
                  </span>
                  <span className="text-xs text-warmgray">{formatDate(rev.createdAt)}</span>
                </div>
                <div className="mb-4"><Stars value={rev.rating} size={12} /></div>
                <p className="text-sm text-charcoal leading-relaxed font-light">{rev.comment}</p>
                {(rev.isOwn || user?.role === 'admin') && (
                  <button type="button" onClick={() => handleDelete(rev.id)} className="mt-4 text-[10px] tracking-luxury uppercase text-warmgray hover:text-[#C53030] transition-colors">
                    Delete
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
