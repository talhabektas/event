import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import EventFeed from '../components/dashboard/EventFeed';
import Suggestions from './suggestions/Suggestions';
import AIRecommendations from '../components/dashboard/AIRecommendations';
import { dashboardService } from '../services';
import type { EventItem } from '../services/dashboardService';
import type { AIRecommendationItem } from '../services/dashboardService';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        addNotification,
        aiRecommendations,
        setAiRecommendations,
        userFeed,
        setUserFeed,
        updateEventInFeed,
    } = useApp();

    const [loading, setLoading] = useState({
        events: true,
        recommendations: true
    });

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const data = await dashboardService.getDashboardData();
                setUserFeed(data?.userFeed?.events || []);
                setAiRecommendations(data?.aiRecommendations?.items || []);
            } catch (error) {
                console.error('Dashboard verileri yüklenirken hata:', error);
                addNotification({
                    type: 'error',
                    message: 'Verileri yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                    duration: 5000
                });
                setUserFeed([]);
                setAiRecommendations([]);
            } finally {
                setLoading({
                    events: false,
                    recommendations: false
                });
            }
        };

        loadDashboardData();
    }, [addNotification, setUserFeed, setAiRecommendations]);

    const handleAttendEvent = async (eventId: number) => {
        try {
            await dashboardService.attendEvent(eventId);
            const eventToUpdate = userFeed.find(e => e.id === eventId);
            if (eventToUpdate) {
                const updatedEvent = {
                    ...eventToUpdate,
                    isUserAttending: !eventToUpdate.isUserAttending,
                    attendeesCount: eventToUpdate.isUserAttending ? eventToUpdate.attendeesCount - 1 : eventToUpdate.attendeesCount + 1
                };
                updateEventInFeed(updatedEvent);
            }
            addNotification({
                type: 'success',
                message: 'Etkinliğe katılım durumunuz güncellendi',
                duration: 3000
            });
        } catch (error) {
            console.error('Etkinliğe katılım güncellenirken hata:', error);
            addNotification({
                type: 'error',
                message: 'Etkinliğe katılım durumunuz güncellenirken bir hata oluştu',
                duration: 5000
            });
        }
    };

    // AI öneri detaylarına yönlendirme
    const handleViewRecommendationDetails = (id: number, type: string) => {
        switch (type) {
            case 'event':
                navigate(`/etkinlikler/${id}`);
                break;
            case 'room':
                navigate(`/odalar/${id}`);
                break;
            case 'friend':
                navigate(`/profil/${id}`);
                break;
            default:
                break;
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            {user && (
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Merhaba, {user.first_name}! 👋
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Etkinlik akışınızda neler olduğunu ve sizin için önerilerimizi görebilirsiniz.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Etkinlik Akışı
                        </h2>
                        <EventFeed
                            events={userFeed}
                            isLoading={loading.events}
                            onAttendEvent={handleAttendEvent}
                        />
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            AI Önerileri
                            <span className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                Kişiselleştirilmiş
                            </span>
                        </h2>
                        <AIRecommendations
                            recommendations={aiRecommendations}
                            isLoading={loading.recommendations}
                            onViewDetails={handleViewRecommendationDetails}
                        />
                    </section>
                </div>

                <div className="space-y-6">
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Öneriler
                            </h2>
                        </div>
                        <Suggestions />
                    </section>

                    <section className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            Hızlı Erişim
                        </h2>
                        <div className="space-y-2">
                            <Link
                                to="/etkinlikler"
                                className="block p-3 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                            >
                                <div className="font-medium text-indigo-700">Etkinlikleri Keşfet</div>
                                <p className="text-sm text-indigo-600">Yeni ve popüler etkinlikleri görüntüle</p>
                            </Link>
                            <Link
                                to="/arkadaslar"
                                className="block p-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                            >
                                <div className="font-medium text-green-700">Arkadaşlar</div>
                                <p className="text-sm text-green-600">Arkadaşlarını görüntüle ve yeni bağlantılar kur</p>
                            </Link>
                            <Link
                                to="/profil"
                                className="block p-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                            >
                                <div className="font-medium text-blue-700">Profilim</div>
                                <p className="text-sm text-blue-600">Profil ayarlarını güncelle</p>
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Home; 