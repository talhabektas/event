import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import CreateEventModal from '../../components/events/CreateEventModal';
import type { CreateEventFormData } from '../../components/events/CreateEventModal';
import { eventService } from '../../services';
import type { EventItem } from '../../services/dashboardService';

const Events: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addNotification } = useApp();

    // State değişkenleri
    const [events, setEvents] = useState<EventItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 8;

    // Etkinlikleri yükle
    useEffect(() => {
        const loadEvents = async () => {
            setIsLoading(true);
            try {
                const data = await eventService.getEvents(currentPage, ITEMS_PER_PAGE);
                setEvents(data.events);
                setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
            } catch (error) {
                console.error('Etkinlikler yüklenirken hata:', error);
                addNotification({
                    type: 'error',
                    message: 'Etkinlikler yüklenirken bir hata oluştu',
                    duration: 5000
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadEvents();
    }, [currentPage, addNotification]);

    // Yeni etkinlik oluşturma
    const handleCreateEvent = async (formData: CreateEventFormData) => {
        setIsSubmitting(true);
        try {
            const newEvent = await eventService.createEvent(formData);

            // Etkinlik listesine yeni etkinliği ekle
            if (currentPage === 1) {
                setEvents(prevEvents => [newEvent, ...prevEvents]);
            }

            addNotification({
                type: 'success',
                message: 'Etkinlik başarıyla oluşturuldu',
                duration: 3000
            });

            // Modal'ı kapat
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Etkinlik oluşturulurken hata:', error);

            // Hata mesajını belirleme
            let errorMessage = 'Etkinlik oluşturulurken bir hata oluştu';

            // Yanıt varsa daha detaylı hata mesajı göster
            if (error.response && error.response.data) {
                if (error.response.data.error) {
                    errorMessage = `Hata: ${error.response.data.error}`;
                } else if (typeof error.response.data === 'string') {
                    errorMessage = `Hata: ${error.response.data}`;
                }
            } else if (error.message) {
                errorMessage = `Hata: ${error.message}`;
            }

            addNotification({
                type: 'error',
                message: errorMessage,
                duration: 5000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Etkinlik detayına gitme
    const handleViewEvent = (eventId: number) => {
        navigate(`/etkinlikler/${eventId}`);
    };

    // Paginator
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex justify-center mt-8">
                <nav className="inline-flex rounded-md shadow">
                    <button
                        onClick={() => setCurrentPage(prevPage => Math.max(prevPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Önceki
                    </button>
                    {[...Array(totalPages)].map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentPage(idx + 1)}
                            className={`px-3 py-2 border border-gray-300 text-sm font-medium ${currentPage === idx + 1
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Sonraki
                    </button>
                </nav>
            </div>
        );
    };

    // Etkinlik kartı bileşeni
    const EventCard = ({ event }: { event: EventItem }) => {
        const formatDate = (dateString: string): string => {
            if (!dateString) return 'Tarih belirtilmemiş';

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
                }).format(date);
            } catch (error) {
                console.error('Tarih formatlanırken hata:', error);
                return 'Geçersiz tarih';
            }
        };

        return (
            <div
                className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewEvent(event.id)}
            >
                {event.imageUrl && (
                    <div className="h-40 w-full overflow-hidden">
                        <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                    <div className="text-xs text-gray-500 flex justify-between">
                        <span>{formatDate(event.startDate)}</span>
                        <span>{event.location}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Etkinlikler</h1>

                {isAuthenticated && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Yeni Etkinlik
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <>
                    {events.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500 mb-4">Henüz etkinlik bulunmuyor.</p>
                            {isAuthenticated && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    İlk etkinliği oluştur
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {events.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}

                    {renderPagination()}
                </>
            )}

            {/* Etkinlik Oluşturma Modal'ı */}
            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateEvent}
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default Events; 