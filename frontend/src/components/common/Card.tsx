import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
    titleClassName?: string;
    bodyClassName?: string;
    noPadding?: boolean;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
    children,
    title,
    className = '',
    titleClassName = '',
    bodyClassName = '',
    noPadding = false,
    onClick,
}) => {
    const baseCardClasses =
        'bg-bg-surface rounded-xl shadow-lg border border-neutral-200 overflow-hidden';

    const titleBaseClasses = 'px-6 py-4 border-b border-neutral-200';
    const titleTextClasses = 'text-xl font-semibold text-neutral-800';

    const bodyBaseClasses = noPadding ? '' : 'px-6 py-5';

    const clickableClasses = onClick ? 'cursor-pointer' : '';

    return (
        <div className={`${baseCardClasses} ${className} ${clickableClasses}`} onClick={onClick}>
            {title && (
                <div className={`${titleBaseClasses} ${titleClassName}`}>
                    <h3 className={titleTextClasses}>{title}</h3>
                </div>
            )}
            <div className={`${bodyBaseClasses} ${bodyClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default Card; 