import React from 'react'

export function StatCard({ label, value, delta, icon }) {
    return (
        <div className="bg-bg border border-silk p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-luxury uppercase text-warmgray">
                    {label}
                </span>
                {icon && (
                    <span className="text-warmgray">{icon}</span>
                )}
            </div>
            <span className="font-sans text-2xl font-medium text-charcoal">
                {value}
            </span>
            {delta && (
                <span className="text-[10px] tracking-luxury uppercase text-warmgray">
                    {delta}
                </span>
            )}
        </div>
    )
}

export function DataTable({ columns, rows, renderRow, loading, empty }) {
    return (
        <div className="w-full border border-silk overflow-x-auto">
            <table className="w-full text-sm font-sans">
                <thead>
                    <tr className="border-b border-silk bg-parchment">
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                className="text-left text-[10px] tracking-luxury uppercase
                           text-warmgray font-normal px-4 py-3 whitespace-nowrap"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-12 text-center text-[10px]
                           tracking-luxury uppercase text-warmgray"
                            >
                                Loading insights...
                            </td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-12 text-center text-[10px]
                           tracking-luxury uppercase text-warmgray"
                            >
                                {empty}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, i) => renderRow(row, i))
                    )}
                </tbody>
            </table>
        </div>
    )
}

const STATUS_STYLES = {
    pending: 'bg-linen text-warmgray',
    confirmed: 'bg-parchment text-charcoal border border-silk',
    shipped: 'bg-charcoal text-cream',
    delivered: 'bg-obsidian text-cream',
    cancelled: 'bg-silk text-warmgray line-through',
}

export function StatusBadge({ status }) {
    return (
        <span className={`
      text-[9px] tracking-luxury uppercase px-3 py-1 rounded-none inline-block
      ${STATUS_STYLES[status?.toLowerCase()] || 'bg-silk text-warmgray'}
    `}>
            {status}
        </span>
    )
}

export function AdminButton({ children, variant = 'solid', onClick, disabled, type = 'button' }) {
    const base = `text-[10px] tracking-luxury uppercase px-6 py-2.5 rounded-none
                font-medium transition-colors duration-200 focus:outline-none
                disabled:opacity-40 whitespace-nowrap`

    const variants = {
        solid: 'bg-obsidian text-cream hover:bg-charcoal',
        ghost: 'border border-charcoal text-charcoal hover:bg-parchment',
        danger: 'bg-transparent border border-[#C53030] text-[#C53030] hover:bg-[#FFF5F5]',
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]}`}
        >
            {children}
        </button>
    )
}

export function AdminInput({ label, error, className = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-[10px] tracking-luxury uppercase text-warmgray">
                    {label}
                </label>
            )}
            <input
                className={`
          w-full bg-bg border rounded-none px-3 py-2.5
          text-sm text-charcoal font-sans
          placeholder:text-warmgray/50
          focus:outline-none focus:border-charcoal
          transition-colors
          ${error ? 'border-[#C53030]' : 'border-silk'}
        `}
                {...props}
            />
            {error && (
                <span className="text-[10px] tracking-luxury uppercase text-[#C53030]">
                    {error}
                </span>
            )}
        </div>
    )
}
