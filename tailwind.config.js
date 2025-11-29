/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    'primary-deep': '#0A2342',
                    'primary': '#0284C7',
                    'primary-soft': '#E0F2FE',
                    'primary-hover': '#0369A1',
                    'ai': '#10B981',
                    'ai-soft': '#D1FAE5',
                    'ai-strong': '#059669',
                },
                success: {
                    DEFAULT: '#22C55E',
                    soft: '#DCFCE7',
                },
                warning: {
                    DEFAULT: '#F59E0B',
                    soft: '#FEF3C7',
                },
                error: {
                    DEFAULT: '#EF4444',
                    soft: '#FEE2E2',
                },
                info: {
                    DEFAULT: '#3B82F6',
                    soft: '#DBEAFE',
                },
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-jetbrains)', 'monospace'],
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'dropdown': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                'elevation-1': '0 1px 3px rgba(15, 23, 42, 0.08)',
                'elevation-2': '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
                'elevation-3': '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
            },
            borderRadius: {
                'card': '0.75rem',
                'button': '0.5rem',
            },
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
