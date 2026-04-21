import React from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full min-h-screen bg-bg flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-parchment border border-silk p-12 text-center">
                        <h2 className="font-display text-3xl font-light text-charcoal mb-4">Something went wrong.</h2>
                        <p className="font-sans text-xs text-warmgray mb-8">
                            An unexpected error occurred. Please try reloading the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-[10px] tracking-luxury uppercase text-charcoal border-b border-charcoal pb-1 hover:text-charcoal/70 transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
