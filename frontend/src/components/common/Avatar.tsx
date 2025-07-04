import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

interface AvatarProps {
    src?: string;
    alt: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    className = '',
    size = 'md'
}) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-10 w-10',
        lg: 'h-14 w-14',
        xl: 'h-20 w-20'
    };

    const defaultSize = sizeClasses[size];

    if (!src) {
        // Avatar resmi yoksa placeholder göster
        return (
            <div className={`bg-gray-200 flex items-center justify-center rounded-full ${defaultSize} ${className}`}>
                <UserIcon className="h-1/2 w-1/2 text-gray-500" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`rounded-full object-cover ${defaultSize} ${className}`}
            onError={(e) => {
                // Resim yüklenemezse placeholder göster
                e.currentTarget.src = '';
                e.currentTarget.onerror = null;
                e.currentTarget.classList.add('bg-gray-200');
            }}
        />
    );
};

export default Avatar; 