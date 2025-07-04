import React from 'react';
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { EventItem } from '../../services/dashboardService';

// Bileşen tipini doğrudan servis tipinden kullanacağız
interface EventFeedProps {
    events: EventItem[];
    isLoading: boolean;
    onAttendEvent?: (eventId: number) => void;
}

const EventFeed: React.FC<EventFeedProps> = ({ events, isLoading, onAttendEvent }) => {
    // Tarihi formatlama fonksiyonu
    const formatDate = (dateString: string | undefined | null): string => {
        if (!dateString) {
            return 'Tarih belirtilmemiş';
        }
        try {
            const date = new Date(dateString);
            // Geçersiz tarih kontrolü
            if (isNaN(date.getTime())) {
                return 'Geçersiz tarih';
            }
            return new Intl.DateTimeFormat('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (error) {
            console.error("Tarih formatlama hatası:", dateString, error);
            return 'Hatalı tarih formatı';
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-64 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                <p>Henüz etkinlik akışınızda gösterilecek bir etkinlik bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {events.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {event.imageUrl && (
                        <div className="h-48 w-full overflow-hidden">
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                        </div>
                    )}
                    <div className="p-5">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title || 'Başlık Yok'}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{event.description || 'Açıklama Yok'}</p>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-500">
                                <CalendarIcon className="h-5 w-5 mr-2" />
                                <span>{formatDate(event.startDate)}</span>
                            </div>
                            {event.endDate && (
                                <div className="flex items-center text-gray-500">
                                    <span className="ml-7">Bitiş: {formatDate(event.endDate)}</span>
                                </div>
                            )}
                            <div className="flex items-center text-gray-500">
                                <MapPinIcon className="h-5 w-5 mr-2" />
                                <span>{event.location || 'Konum belirtilmemiş'}</span>
                            </div>
                            <div className="flex items-center text-gray-500">
                                <UserGroupIcon className="h-5 w-5 mr-2" />
                                <span>{event.attendeesCount ?? 0} kişi katılıyor</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <a
                                href={`/etkinlikler/${event.id}`}
                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Detayları Gör
                            </a>

                            {onAttendEvent && (
                                <button
                                    onClick={() => onAttendEvent(event.id)}
                                    className={`px-4 py-2 rounded-md font-medium ${event.isUserAttending
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                >
                                    {event.isUserAttending ? 'Katılıyorsunuz' : 'Katıl'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EventFeed; 