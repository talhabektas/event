import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
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
    // Temel stil sınıfları
    const baseClasses =
        'inline-flex items-center justify-center font-semibold tracking-wide '
        + 'rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out';

    // Variant stil sınıfları
    const variantClasses = {
        primary:
            'bg-primary text-white hover:bg-primary-dark focus:ring-primary '
            + 'disabled:bg-primary-light disabled:hover:bg-primary-light',
        secondary:
            'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 focus:ring-neutral-400 '
            + 'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:bg-neutral-100',
        outline:
            'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary '
            + 'disabled:border-primary-light disabled:text-primary-light disabled:hover:bg-transparent',
        ghost:
            'text-primary hover:bg-primary-light focus:ring-primary '
            + 'disabled:text-primary-light disabled:hover:bg-transparent',
        danger:
            'bg-status-error text-white hover:bg-red-700 focus:ring-status-error '
            + 'disabled:bg-red-400 disabled:hover:bg-red-400',
        success:
            'bg-status-success text-white hover:bg-green-700 focus:ring-status-success '
            + 'disabled:bg-green-400 disabled:hover:bg-green-400',
    };

    // Size stil sınıfları
    const sizeClasses = {
        small: 'px-3.5 py-2 text-sm',
        medium: 'px-5 py-2.5 text-base',
        large: 'px-7 py-3 text-lg',
    };

    // Yüklenme veya normal disabled durumu
    const isDisabled = isLoading || disabled;
    const disabledClasses = isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer';

    // Tüm stillerini birleştir
    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={isDisabled}
            onClick={onClick}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {iconLeft && !isLoading && <span className="mr-2">{iconLeft}</span>}
            {children}
            {iconRight && !isLoading && <span className="ml-2">{iconRight}</span>}
        </button>
    );
};

export default Button; 