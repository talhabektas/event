/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Enable dark mode with class strategy
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1', // Main primary
                    600: '#5a67d8',
                    700: '#4f46e5',
                    800: '#4338ca',
                    900: '#3730a3',
                    950: '#1e1b4b',
                },
                accent: {
                    50: '#fdf2f8',
                    100: '#fce7f3',
                    200: '#fbcfe8',
                    300: '#f9a8d4',
                    400: '#f472b6',
                    500: '#ec4899', // Main accent
                    600: '#db2777',
                    700: '#be185d',
                    800: '#9d174d',
                    900: '#831843',
                },
                neutral: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                    950: '#030712',
                },
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                status: {
                    success: {
                        light: '#10b981',
                        DEFAULT: '#059669',
                        dark: '#047857'
                    },
                    warning: {
                        light: '#f59e0b',
                        DEFAULT: '#d97706',
                        dark: '#b45309'
                    },
                    error: {
                        light: '#ef4444',
                        DEFAULT: '#dc2626',
                        dark: '#b91c1c'
                    },
                    info: {
                        light: '#3b82f6',
                        DEFAULT: '#2563eb',
                        dark: '#1d4ed8'
                    },
                },
                // Glassmorphism backgrounds
                glass: {
                    light: 'rgba(255, 255, 255, 0.25)',
                    dark: 'rgba(0, 0, 0, 0.25)',
                    backdrop: 'rgba(255, 255, 255, 0.1)',
                },
            },
            backgroundImage: {
                'gradient-light': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                'gradient-accent': 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
                'gradient-card-light': 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                'gradient-card-dark': 'linear-gradient(145deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.7) 100%)',
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'card-light': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'card-dark': '0 10px 25px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
                'navbar': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'navbar-dark': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
            },
            keyframes: {
                modalShow: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                slideIn: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                bounce: {
                    '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
                    '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            animation: {
                modalShow: 'modalShow 0.3s ease-in-out forwards',
                slideIn: 'slideIn 0.3s ease-out',
                fadeIn: 'fadeIn 0.5s ease-out',
                bounce: 'bounce 1s infinite',
                float: 'float 3s ease-in-out infinite',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
} 