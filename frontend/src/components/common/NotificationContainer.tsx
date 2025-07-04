import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useApp();

    // Bildirim ikonunu belirleme
    const getIcon = (type: 'success' | 'error' | 'warning' | 'info') => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
            case 'error':
                return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
            case 'warning':
                return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
            case 'info':
                return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
            default:
                return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
        }
    };

    // Bildirim arka plan rengini belirleme
    const getBackgroundColor = (type: 'success' | 'error' | 'warning' | 'info') => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`flex items-start p-4 rounded-lg border shadow-md animate-slide-in-right ${getBackgroundColor(notification.type)}`}
                >
                    <div className="flex-shrink-0 mr-3">
                        {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 mr-2">
                        <p className="text-sm text-gray-700">{notification.message}</p>
                    </div>
                    <button
                        onClick={() => removeNotification(notification.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationContainer; 