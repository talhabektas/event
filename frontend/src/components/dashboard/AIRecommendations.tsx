import React from 'react';
import { SparklesIcon, CalendarIcon, UserGroupIcon, MapPinIcon } from '@heroicons/react/24/outline';
import type { AIRecommendationItem } from '../../services/dashboardService';

// Bileşen tipini doğrudan servis tipinden kullanacağız
interface AIRecommendationsProps {
    recommendations: AIRecommendationItem[];
    isLoading: boolean;
    onViewDetails: (id: number, type: string) => void;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({
    recommendations,
    isLoading,
    onViewDetails
}) => {
    if (isLoading) {
        return (
            <div className="w-full h-40 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-5 text-center text-gray-500">
                <p>Henüz AI önerisi oluşturulmadı. İlgi alanlarınızı güncelleyerek öneriler alabilirsiniz.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {recommendations.map((recommendation) => (
                <div
                    key={recommendation.id}
                    className="bg-white rounded-lg shadow overflow-hidden border border-transparent hover:border-indigo-100 transition-colors"
                >
                    <div className="flex items-start p-4">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-base font-semibold text-gray-900 flex-1">{recommendation.title}</h3>
                                <div className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium inline-flex items-center">
                                    <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                                    {recommendation.matchPercentage}% Eşleşme
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recommendation.description}</p>

                            {recommendation.type === 'event' && recommendation.details?.location && (
                                <div className="flex items-center text-xs text-gray-500 mb-1">
                                    <MapPinIcon className="h-4 w-4 mr-1" />
                                    <span>{recommendation.details.location}</span>
                                </div>
                            )}

                            {recommendation.type === 'event' && recommendation.details?.date && (
                                <div className="flex items-center text-xs text-gray-500 mb-1">
                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                    <span>{recommendation.details.date}</span>
                                </div>
                            )}

                            {recommendation.type === 'event' && recommendation.details?.attendeesCount && (
                                <div className="flex items-center text-xs text-gray-500 mb-1">
                                    <UserGroupIcon className="h-4 w-4 mr-1" />
                                    <span>{recommendation.details.attendeesCount} kişi katılıyor</span>
                                </div>
                            )}

                            {recommendation.details?.tags && recommendation.details.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {recommendation.details.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {recommendation.imageUrl && (
                            <div className="ml-4 flex-shrink-0">
                                <img
                                    src={recommendation.imageUrl}
                                    alt={recommendation.title}
                                    className="h-20 w-20 object-cover rounded-lg"
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6">
                        <button
                            onClick={() => onViewDetails(recommendation.id, recommendation.type)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Detayları Gör
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AIRecommendations; 