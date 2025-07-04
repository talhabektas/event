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
import { Card, Button } from '../components/common';
import {
    CalendarDaysIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    SparklesIcon,
    ArrowRightIcon,
    RocketLaunchIcon,
    HeartIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';

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

        if (user) {
            loadDashboardData();
        }
    }, [addNotification, setUserFeed, setAiRecommendations, user]);

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

    // Misafir kullanıcı için hero section
    const GuestHeroSection = () => (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-purple-600 to-accent-500 text-white">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-32 -translate-y-32" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-32 translate-y-32" />
            </div>

            <div className="relative container mx-auto px-4 py-20 lg:py-32">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Floating icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-8 float-animation">
                        <SparklesIcon className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-shadow-lg">
                        Etkinlikleri <span className="text-yellow-300">Keşfet</span>
                        <br />
                        Bağlantıları <span className="text-cyan-300">Kur</span>
                    </h1>

                    <p className="text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Modern etkinlik yönetim platformunda arkadaşlarınla buluş,
                        yeni insanlarla tanış ve unutulmaz anılar biriktir.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            variant="secondary"
                            size="large"
                            className="min-w-[200px] bg-white text-primary-700 hover:bg-white/90"
                            onClick={() => navigate('/kayit')}
                            iconRight={<RocketLaunchIcon className="w-5 h-5" />}
                        >
                            Hemen Başla
                        </Button>
                        <Button
                            variant="ghost"
                            size="large"
                            className="min-w-[200px] text-white border-white/30 hover:bg-white/10"
                            onClick={() => navigate('/etkinlikler')}
                            iconRight={<ArrowRightIcon className="w-5 h-5" />}
                        >
                            Etkinlikleri Keşfet
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Özellikler bölümü
    const FeaturesSection = () => (
        <div className="section-padding bg-gradient-to-b from-neutral-50 to-white dark:from-dark-900 dark:to-dark-800">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6 gradient-text">
                        Neden Etkinlik Hub?
                    </h2>
                    <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
                        Modern teknoloji ile sosyal bağlantıları güçlendiren özellikler
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: CalendarDaysIcon,
                            title: "Akıllı Etkinlik Yönetimi",
                            description: "AI destekli öneriler ile ilgi alanlarına uygun etkinlikleri keşfet",
                            color: "from-blue-500 to-cyan-500"
                        },
                        {
                            icon: UserGroupIcon,
                            title: "Sosyal Bağlantılar",
                            description: "Arkadaş önerileri ve akıllı eşleştirme ile yeni insanlarla tanış",
                            color: "from-purple-500 to-pink-500"
                        },
                        {
                            icon: ChatBubbleLeftRightIcon,
                            title: "Anlık Mesajlaşma",
                            description: "Gerçek zamanlı chat ile arkadaşlarınla ve etkinlik katılımcıları ile iletişim kur",
                            color: "from-green-500 to-emerald-500"
                        },
                        {
                            icon: SparklesIcon,
                            title: "Kişiselleştirilmiş Deneyim",
                            description: "İlgi alanlarına göre özelleştirilen kullanıcı deneyimi",
                            color: "from-orange-500 to-red-500"
                        },
                        {
                            icon: GlobeAltIcon,
                            title: "Global Topluluk",
                            description: "Dünyanın her yerinden katılımcılarla bağlantı kur",
                            color: "from-indigo-500 to-purple-500"
                        },
                        {
                            icon: HeartIcon,
                            title: "Güvenli Platform",
                            description: "Doğrulanmış kullanıcılar ve güvenli ortam",
                            color: "from-pink-500 to-rose-500"
                        }
                    ].map((feature, index) => (
                        <Card
                            key={index}
                            variant="glass"
                            className="hover-lift group cursor-default"
                        >
                            <div className="text-center p-2">
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                                    {feature.title}
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );

    // Kullanıcı dashboard'u
    const UserDashboard = () => (
        <div className="container mx-auto px-4 py-8">
            {/* Welcome section */}
            <Card variant="gradient" className="mb-8 overflow-hidden">
                <div className="relative p-8">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative">
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                            Merhaba, {user?.first_name}! 👋
                        </h1>
                        <p className="text-white/90 text-lg">
                            Bugün hangi etkinliklere katılmaya hazırsın?
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Event Feed */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                Etkinlik Akışı
                            </h2>
                            <Link to="/etkinlikler" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center space-x-1">
                                <span>Tümünü Gör</span>
                                <ArrowRightIcon className="w-4 h-4" />
                            </Link>
                        </div>
                        <EventFeed
                            events={userFeed}
                            isLoading={loading.events}
                            onAttendEvent={handleAttendEvent}
                        />
                    </section>

                    {/* AI Recommendations */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                                <span>AI Önerileri</span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 text-primary-700 dark:text-primary-300">
                                    Kişiselleştirilmiş
                                </span>
                            </h2>
                        </div>
                        <AIRecommendations
                            recommendations={aiRecommendations}
                            isLoading={loading.recommendations}
                            onViewDetails={handleViewRecommendationDetails}
                        />
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Suggestions */}
                    <Card variant="glass" title="Öneriler">
                        <Suggestions />
                    </Card>

                    {/* Quick Actions */}
                    <Card variant="default" title="Hızlı Erişim">
                        <div className="space-y-3">
                            {[
                                { to: "/etkinlikler", title: "Etkinlikleri Keşfet", desc: "Yeni ve popüler etkinlikler", color: "from-blue-500 to-cyan-500" },
                                { to: "/arkadaslar", title: "Arkadaşlar", desc: "Bağlantılar ve yeni tanışmalar", color: "from-green-500 to-emerald-500" },
                                { to: "/profil", title: "Profilim", desc: "Ayarları güncelle", color: "from-purple-500 to-pink-500" }
                            ].map((item, index) => (
                                <Link
                                    key={index}
                                    to={item.to}
                                    className="block p-4 rounded-xl bg-gradient-to-r hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
                                    style={{
                                        background: `linear-gradient(135deg, rgba(${item.color.split('-')[1] === 'blue' ? '59, 130, 246' : item.color.split('-')[1] === 'green' ? '34, 197, 94' : '168, 85, 247'}, 0.1), rgba(${item.color.split('-')[3] === 'cyan' ? '6, 182, 212' : item.color.split('-')[3] === 'emerald' ? '16, 185, 129' : '236, 72, 153'}, 0.1))`
                                    }}
                                >
                                    <div className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {item.title}
                                    </div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                        {item.desc}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen">
            {user ? (
                <UserDashboard />
            ) : (
                <>
                    <GuestHeroSection />
                    <FeaturesSection />
                </>
            )}
        </div>
    );
};

export default Home; 