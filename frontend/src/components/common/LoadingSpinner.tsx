import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'white' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = 'primary'
}) => {
    const sizeClasses = {
        sm: 'h-5 w-5',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    const colorClasses = {
        primary: 'border-indigo-500',
        white: 'border-white',
        gray: 'border-gray-300'
    };

    return (
        <div className="flex justify-center items-center">
            <div
                className={`rounded-full border-t-2 border-b-2 ${colorClasses[color]} animate-spin ${sizeClasses[size]}`}
            ></div>
        </div>
    );
};

export default LoadingSpinner; 