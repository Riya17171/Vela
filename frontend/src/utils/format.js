const formatters = new Map()

/** Formats an integer amount in the smallest currency unit (paise) for display. */
export function formatPrice(minorUnits, currency = 'INR') {
  if (minorUnits === null || minorUnits === undefined || Number.isNaN(Number(minorUnits))) return '—'
  const amount = Number(minorUnits) / 100
  const fractionDigits = Number.isInteger(amount) ? 0 : 2
  const key = `${currency}:${fractionDigits}`
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    )
  }
  return formatters.get(key).format(amount)
}

/** Converts a rupee value typed by an admin into integer paise. */
export function toMinorUnits(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return NaN
  return Math.round(number * 100)
}

export function fromMinorUnits(value) {
  return value === null || value === undefined ? '' : (Number(value) / 100).toString()
}

export function formatDate(value, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', options)
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const STATUS_LABELS = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  expired: 'Expired',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refund_pending: 'Refund pending',
  refunded: 'Refunded',
  void: 'Not charged',
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status
}

export function variantLabel({ size, color }) {
  return [size && `Size ${size}`, color].filter(Boolean).join(' — ')
}
