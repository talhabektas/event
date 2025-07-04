import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';

interface ThemeToggleProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
    className = '',
    size = 'md'
}) => {
    const { theme, toggleTheme } = useApp();
    const isDark = theme === 'dark';

    const sizeClasses = {
        sm: 'h-8 w-14',
        md: 'h-10 w-18',
        lg: 'h-12 w-22'
    };

    const iconSizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    };

    const thumbSizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10'
    };

    return (
        <button
            onClick={toggleTheme}
            className={`
                relative inline-flex items-center justify-between
                ${sizeClasses[size]}
                bg-gradient-to-r 
                ${isDark
                    ? 'from-indigo-600 to-purple-600'
                    : 'from-amber-400 to-orange-500'
                }
                rounded-full p-1 transition-all duration-500 ease-in-out
                hover:scale-110 active:scale-95
                shadow-lg hover:shadow-xl
                focus:outline-none focus:ring-4 focus:ring-opacity-30
                ${isDark ? 'focus:ring-purple-500' : 'focus:ring-amber-500'}
                ${className}
            `}
            aria-label="Toggle theme"
        >
            {/* Background gradient overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-50" />

            {/* Icons container */}
            <div className="relative flex items-center justify-between w-full px-1">
                {/* Sun icon */}
                <SunIcon
                    className={`
                        ${iconSizeClasses[size]} 
                        text-white transition-all duration-300
                        ${!isDark ? 'opacity-100 scale-100' : 'opacity-50 scale-75'}
                    `}
                />

                {/* Moon icon */}
                <MoonIcon
                    className={`
                        ${iconSizeClasses[size]} 
                        text-white transition-all duration-300
                        ${isDark ? 'opacity-100 scale-100' : 'opacity-50 scale-75'}
                    `}
                />
            </div>

            {/* Toggle thumb */}
            <div
                className={`
                    absolute top-1 left-1
                    ${thumbSizeClasses[size]}
                    bg-white rounded-full shadow-lg
                    transition-all duration-500 ease-in-out
                    transform ${isDark ? 'translate-x-8' : 'translate-x-0'}
                    flex items-center justify-center
                    backdrop-blur-sm
                `}
            >
                {/* Inner glow effect */}
                <div className={`
                    absolute inset-0 rounded-full
                    ${isDark
                        ? 'bg-gradient-to-br from-purple-200 to-indigo-200'
                        : 'bg-gradient-to-br from-amber-100 to-orange-100'
                    }
                    opacity-60 transition-all duration-500
                `} />

                {/* Center icon */}
                <div className="relative z-10">
                    {isDark ? (
                        <MoonIcon className={`${iconSizeClasses[size]} text-indigo-600`} />
                    ) : (
                        <SunIcon className={`${iconSizeClasses[size]} text-amber-600`} />
                    )}
                </div>
            </div>

            {/* Ripple effect */}
            <div className={`
                absolute inset-0 rounded-full
                bg-white opacity-0 scale-0
                transition-all duration-200
                pointer-events-none
                hover:opacity-20 hover:scale-110
            `} />
        </button>
    );
};

export default ThemeToggle; 