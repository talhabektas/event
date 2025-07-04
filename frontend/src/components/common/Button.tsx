import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'gradient';
    size?: 'small' | 'medium' | 'large';
    type?: 'button' | 'submit' | 'reset';
    isLoading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'medium',
    type = 'button',
    isLoading = false,
    disabled = false,
    onClick,
    className = '',
    iconLeft,
    iconRight,
}) => {
    // Base classes with modern styling
    const baseClasses =
        'btn-modern inline-flex items-center justify-center font-semibold tracking-wide '
        + 'rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-800 '
        + 'transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 '
        + 'shadow-lg hover:shadow-xl disabled:transform-none';

    // Enhanced variant classes with dark mode support
    const variantClasses = {
        primary:
            'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 '
            + 'text-white focus:ring-primary-500 shadow-primary-500/25 '
            + 'dark:from-primary-500 dark:to-primary-600 dark:hover:from-primary-600 dark:hover:to-primary-700 '
            + 'disabled:from-primary-300 disabled:to-primary-400 disabled:hover:from-primary-300 disabled:hover:to-primary-400',

        gradient:
            'bg-gradient-to-r from-primary-600 via-purple-600 to-accent-500 '
            + 'hover:from-primary-700 hover:via-purple-700 hover:to-accent-600 '
            + 'text-white focus:ring-purple-500 shadow-purple-500/25 '
            + 'disabled:from-neutral-300 disabled:via-neutral-400 disabled:to-neutral-300',

        secondary:
            'bg-white dark:bg-dark-800 text-neutral-700 dark:text-neutral-200 '
            + 'border border-neutral-300 dark:border-dark-600 '
            + 'hover:bg-neutral-50 dark:hover:bg-dark-700 hover:border-neutral-400 dark:hover:border-dark-500 '
            + 'focus:ring-neutral-500 shadow-neutral-500/10 '
            + 'disabled:bg-neutral-100 dark:disabled:bg-dark-900 disabled:text-neutral-400 dark:disabled:text-neutral-600',

        outline:
            'border-2 border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 '
            + 'bg-transparent hover:bg-primary-600 dark:hover:bg-primary-500 hover:text-white '
            + 'focus:ring-primary-500 shadow-primary-500/20 '
            + 'disabled:border-primary-300 dark:disabled:border-primary-700 '
            + 'disabled:text-primary-300 dark:disabled:text-primary-700 disabled:hover:bg-transparent',

        ghost:
            'text-primary-600 dark:text-primary-400 bg-transparent '
            + 'hover:bg-primary-50 dark:hover:bg-primary-900/20 '
            + 'focus:ring-primary-500 shadow-none hover:shadow-lg '
            + 'disabled:text-primary-300 dark:disabled:text-primary-700 disabled:hover:bg-transparent',

        danger:
            'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 '
            + 'text-white focus:ring-red-500 shadow-red-500/25 '
            + 'dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 '
            + 'disabled:from-red-300 disabled:to-red-400',

        success:
            'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 '
            + 'text-white focus:ring-emerald-500 shadow-emerald-500/25 '
            + 'dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700 '
            + 'disabled:from-emerald-300 disabled:to-emerald-400',
    };

    // Enhanced size classes
    const sizeClasses = {
        small: 'px-4 py-2.5 text-sm min-h-[2.5rem]',
        medium: 'px-6 py-3 text-base min-h-[3rem]',
        large: 'px-8 py-4 text-lg min-h-[3.5rem]',
    };

    // Loading and disabled state handling
    const isDisabled = isLoading || disabled;
    const disabledClasses = isDisabled
        ? 'opacity-60 cursor-not-allowed pointer-events-none'
        : 'cursor-pointer';

    // Combine all classes
    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={isDisabled}
            onClick={onClick}
        >
            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
                    <svg
                        className="animate-spin h-5 w-5 text-current"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                </div>
            )}

            {/* Button content */}
            <div className={`flex items-center justify-center space-x-2 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
                {iconLeft && (
                    <span className="flex-shrink-0">
                        {iconLeft}
                    </span>
                )}

                <span className="font-medium tracking-wide">
                    {children}
                </span>

                {iconRight && (
                    <span className="flex-shrink-0">
                        {iconRight}
                    </span>
                )}
            </div>

            {/* Shine effect for gradient buttons */}
            {(variant === 'primary' || variant === 'gradient') && !isDisabled && (
                <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700" />
                </div>
            )}
        </button>
    );
};

export default Button; 