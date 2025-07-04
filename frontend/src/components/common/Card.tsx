import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    className?: string;
    titleClassName?: string;
    bodyClassName?: string;
    noPadding?: boolean;
    onClick?: () => void;
    variant?: 'default' | 'glass' | 'gradient' | 'elevated';
    hoverable?: boolean;
    loading?: boolean;
}

const Card: React.FC<CardProps> = ({
    children,
    title,
    subtitle,
    className = '',
    titleClassName = '',
    bodyClassName = '',
    noPadding = false,
    onClick,
    variant = 'default',
    hoverable = true,
    loading = false,
}) => {
    // Base card classes with modern styling
    const baseCardClasses = 'rounded-2xl overflow-hidden transition-all duration-300 ease-out';

    // Variant-specific styling
    const variantClasses = {
        default:
            'bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 '
            + 'shadow-card-light dark:shadow-card-dark',

        glass:
            'glass-card bg-white/70 dark:bg-dark-800/70 backdrop-blur-lg '
            + 'border border-white/20 dark:border-dark-700/50 '
            + 'shadow-glass dark:shadow-glass-dark',

        gradient:
            'bg-gradient-card-light dark:bg-gradient-card-dark '
            + 'border border-white/30 dark:border-dark-600/30 '
            + 'shadow-xl',

        elevated:
            'bg-white dark:bg-dark-800 border border-neutral-100 dark:border-dark-700 '
            + 'shadow-2xl hover:shadow-3xl transform hover:-translate-y-1'
    };

    // Hover effects
    const hoverClasses = hoverable && !loading
        ? 'hover-lift hover:scale-[1.02] hover:shadow-2xl dark:hover:shadow-glass-dark'
        : '';

    // Click handler classes
    const clickableClasses = onClick && !loading
        ? 'cursor-pointer active:scale-[0.98]'
        : '';

    // Title styling
    const titleBaseClasses = `
        px-6 py-4 border-b border-neutral-200/50 dark:border-dark-700/50
        bg-gradient-to-r from-neutral-50/50 to-transparent dark:from-dark-700/50
    `;

    const titleTextClasses = `
        text-xl font-semibold text-neutral-900 dark:text-neutral-50 
        tracking-tight leading-tight
    `;

    const subtitleTextClasses = `
        text-sm text-neutral-600 dark:text-neutral-400 mt-1
    `;

    // Body styling
    const bodyBaseClasses = noPadding
        ? 'relative'
        : 'px-6 py-5 relative';

    // Loading overlay
    const LoadingOverlay = () => (
        <div className="absolute inset-0 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                    <div className="w-8 h-8 border-3 border-primary-200 dark:border-primary-800 rounded-full animate-spin">
                        <div className="absolute top-0 left-0 w-8 h-8 border-3 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                    </div>
                </div>
                <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                    Yükleniyor...
                </span>
            </div>
        </div>
    );

    return (
        <div
            className={`
                ${baseCardClasses} 
                ${variantClasses[variant]} 
                ${hoverClasses} 
                ${clickableClasses} 
                ${className}
                ${loading ? 'pointer-events-none' : ''}
            `}
            onClick={!loading ? onClick : undefined}
        >
            {/* Loading overlay */}
            {loading && <LoadingOverlay />}

            {/* Title section */}
            {title && (
                <div className={`${titleBaseClasses} ${titleClassName}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className={titleTextClasses}>
                                {title}
                            </h3>
                            {subtitle && (
                                <p className={subtitleTextClasses}>
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Optional gradient accent */}
                        <div className="w-1 h-12 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full opacity-60" />
                    </div>
                </div>
            )}

            {/* Body content */}
            <div className={`${bodyBaseClasses} ${bodyClassName}`}>
                {children}
            </div>

            {/* Hover shine effect */}
            {hoverable && !loading && (
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000" />
                </div>
            )}
        </div>
    );
};

export default Card; 