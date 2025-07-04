/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    light: '#7e8cfa', // Indigo-400
                    DEFAULT: '#5a67d8', // Indigo-600
                    dark: '#434190',  // Indigo-800
                },
                accent: {
                    DEFAULT: '#ec4899', // Pink-500
                    hover: '#d93481', // Pink-600
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
                },
                'bg-default': '#f3f4f6', // neutral-100
                'bg-surface': '#ffffff',
                status: {
                    success: '#10b981', // Green-500
                    warning: '#f59e0b', // Amber-500
                    error: '#ef4444',   // Red-500
                    info: '#3b82f6',    // Blue-500
                },
            },
            keyframes: {
                modalShow: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                }
            },
            animation: {
                modalShow: 'modalShow 0.3s ease-in-out forwards',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
} 