import React from 'react';
import { UserIcon, CheckIcon, XMarkIcon, ClockIcon, CalendarIcon, HomeIcon } from '@heroicons/react/24/outline';
import type { SuggestionItem } from '../../services/dashboardService';

// Bileşen tipini doğrudan servis tipinden kullanacağız
interface SuggestionFeedProps {
    suggestions: SuggestionItem[];
    isLoading: boolean;
    onAccept: (id: number, type: string) => void;
    onReject: (id: number) => void;
}

const SuggestionFeed: React.FC<SuggestionFeedProps> = ({
    suggestions,
    isLoading,
    onAccept,
    onReject
}) => {
    // Zaman formatlaması için yardımcı fonksiyon
    const formatTimeSince = (dateString: string): string => {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            return `${interval} yıl önce`;
        }

        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return `${interval} ay önce`;
        }

        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            return `${interval} gün önce`;
        }

        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return `${interval} saat önce`;
        }

        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return `${interval} dakika önce`;
        }

        return `${Math.floor(seconds)} saniye önce`;
    };

    if (isLoading) {
        return (
            <div className="w-full h-32 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
                <p>Şu anda bekleyen öneri bulunmuyor.</p>
            </div>
        );
    }

    const getSuggestionContent = (suggestion: SuggestionItem) => {
        switch (suggestion.type) {
            case 'friend':
                return (
                    <>
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                {suggestion.imageUrl ? (
                                    <img
                                        className="h-10 w-10 rounded-full"
                                        src={suggestion.imageUrl}
                                        alt={suggestion.data.name || 'Profil resmi'}
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <UserIcon className="h-6 w-6 text-indigo-500" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {suggestion.data.name || suggestion.data.username}
                                </p>
                                <p className="text-sm text-gray-500 truncate">{suggestion.description}</p>
                            </div>
                        </div>
                    </>
                );
            case 'event':
                return (
                    <>
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                {suggestion.imageUrl ? (
                                    <img
                                        className="h-10 w-10 rounded-lg object-cover"
                                        src={suggestion.imageUrl}
                                        alt={suggestion.data.eventTitle || 'Etkinlik'}
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <CalendarIcon className="h-6 w-6 text-purple-500" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {suggestion.data.eventTitle || suggestion.title}
                                </p>
                                <p className="text-sm text-gray-500 truncate">{suggestion.description}</p>
                            </div>
                        </div>
                    </>
                );
            case 'room':
                return (
                    <>
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                {suggestion.imageUrl ? (
                                    <img
                                        className="h-10 w-10 rounded-lg object-cover"
                                        src={suggestion.imageUrl}
                                        alt={suggestion.data.roomName || 'Oda'}
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <HomeIcon className="h-6 w-6 text-blue-500" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {suggestion.data.roomName || suggestion.title}
                                </p>
                                <p className="text-sm text-gray-500 truncate">{suggestion.description}</p>
                            </div>
                        </div>
                    </>
                );
            default:
                return (
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
                        <p className="text-sm text-gray-500 truncate">{suggestion.description}</p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
                {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-1">
                            {getSuggestionContent(suggestion)}
                            <div className="flex-shrink-0 ml-2 flex">
                                <span className="inline-flex items-center text-xs text-gray-500">
                                    <ClockIcon className="h-3.5 w-3.5 mr-1" />
                                    {formatTimeSince(suggestion.createdAt)}
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-end space-x-2">
                            <button
                                onClick={() => onReject(suggestion.id)}
                                className="inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => onAccept(suggestion.id, suggestion.type)}
                                className="inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <CheckIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SuggestionFeed; 