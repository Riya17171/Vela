/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                // Dynamic Mode Base mapped to CSS Variables
                bg: 'var(--bg)',
                ivory: 'var(--color-ivory)',
                parchment: 'var(--color-parchment)',
                silk: 'var(--color-silk)',
                charcoal: 'var(--color-charcoal)',
                warmgray: 'var(--color-warmgray)',
                linen: 'var(--color-linen)',
                obsidian: 'var(--color-obsidian)',
                cream: 'var(--color-cream)',
            },
            fontFamily: {
                display: ['"Outfit"', 'sans-serif'],
                sans: ['"Inter"', 'sans-serif'],
            },
            letterSpacing: {
                luxury: '0.18em',
            },
            animation: {
                'fade-up': 'fadeUp 0.7s ease forwards',
                'fade-in': 'fadeIn 0.5s ease forwards',
                'slide-right': 'slideRight 0.6s ease forwards',
                'marquee': 'marquee 30s linear infinite',
            },
            keyframes: {
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideRight: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-100%)' },
                }
            }
        },
    },
    plugins: [],
}
