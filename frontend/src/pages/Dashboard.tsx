import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from '../components/common';
import {
    CalendarDaysIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    Cog6ToothIcon,
    PlusIcon,
    SparklesIcon,
    ArrowRightIcon,
    ChartBarIcon,
    BellIcon,
    BookmarkIcon
} from '@heroicons/react/24/outline';

/**
 * Dashboard sayfası
 * Home bileşeninin korumalı versiyonu olarak çalışır
 * Sadece giriş yapmış kullanıcılar erişebilir
 */
const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card variant="glass" className="max-w-md w-full mx-4">
                    <div className="text-center p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-neutral-600 dark:text-neutral-400">Kullanıcı bilgileri yükleniyor...</p>
                    </div>
                </Card>
            </div>
        );
    }

    // Quick stats data
    const quickStats = [
        { label: "Katıldığım Etkinlikler", value: "12", icon: CalendarDaysIcon, color: "from-blue-500 to-cyan-500" },
        { label: "Arkadaşlarım", value: "48", icon: UserGroupIcon, color: "from-green-500 to-emerald-500" },
        { label: "Mesajlarım", value: "156", icon: ChatBubbleLeftRightIcon, color: "from-purple-500 to-pink-500" },
        { label: "Oluşturduğum Etkinlikler", value: "5", icon: SparklesIcon, color: "from-orange-500 to-red-500" }
    ];

    // Quick action items
    const quickActions = [
        {
            title: "Yeni Etkinlik Oluştur",
            description: "Arkadaşlarınla paylaşabileceğin etkinlik oluştur",
            link: "/etkinlikler/yeni",
            icon: PlusIcon,
            color: "from-indigo-500 to-purple-500",
            buttonText: "Oluştur"
        },
        {
            title: "Etkinlikleri Keşfet",
            description: "İlgi alanlarına uygun yeni etkinlikleri keşfet",
            link: "/etkinlikler",
            icon: CalendarDaysIcon,
            color: "from-blue-500 to-cyan-500",
            buttonText: "Keşfet"
        },
        {
            title: "Arkadaş Bul",
            description: "Yeni insanlarla tanış ve bağlantılar kur",
            link: "/arkadaslar",
            icon: UserGroupIcon,
            color: "from-green-500 to-emerald-500",
            buttonText: "Bul"
        },
        {
            title: "Sohbet Et",
            description: "Arkadaşlarınla anlık mesajlaşma",
            link: "/odalar",
            icon: ChatBubbleLeftRightIcon,
            color: "from-pink-500 to-rose-500",
            buttonText: "Sohbet"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 dark:from-dark-900 dark:via-dark-800 dark:to-dark-950">
            <div className="container mx-auto px-4 py-8">
                {/* Welcome Hero Section */}
                <Card variant="gradient" className="mb-8 overflow-hidden">
                    <div className="relative p-8 lg:p-12">
                        {/* Background decorations */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

                        <div className="relative">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <SparklesIcon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                        Hoş geldin, {user.first_name || user.username}! 👋
                                    </h1>
                                    <p className="text-white/90 text-lg">
                                        Bugün hangi maceralara atılmaya hazırsın?
                                    </p>
                                </div>
                            </div>

                            {/* Quick actions in hero */}
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    variant="secondary"
                                    size="medium"
                                    className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                                    iconLeft={<PlusIcon className="w-4 h-4" />}
                                >
                                    Etkinlik Oluştur
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="medium"
                                    className="text-white border-white/30 hover:bg-white/10"
                                    iconLeft={<CalendarDaysIcon className="w-4 h-4" />}
                                >
                                    Etkinlikler
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {quickStats.map((stat, index) => (
                        <Card key={index} variant="glass" className="hover-lift">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                            {stat.value}
                                        </p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                            {stat.label}
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Recent Activity */}
                        <Card variant="default" title="Son Aktiviteler" subtitle="Yakın zamandaki etkinlikleriniz">
                            <div className="space-y-4">
                                {[
                                    { event: "JavaScript Workshop'u", action: "katıldı", time: "2 saat önce", status: "completed" },
                                    { event: "Yoga Seansı", action: "kaydoldu", time: "5 saat önce", status: "upcoming" },
                                    { event: "Kitap Kulübü", action: "oluşturdu", time: "1 gün önce", status: "created" }
                                ].map((activity, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-neutral-50 dark:bg-dark-700/50 hover:bg-neutral-100 dark:hover:bg-dark-700 transition-colors">
                                        <div className={`w-3 h-3 rounded-full ${activity.status === 'completed' ? 'bg-green-500' :
                                                activity.status === 'upcoming' ? 'bg-blue-500' : 'bg-purple-500'
                                            }`}></div>
                                        <div className="flex-1">
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                <span className="text-primary-600 dark:text-primary-400">{activity.event}</span> etkinliğine {activity.action}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="text-center pt-4">
                                    <Link
                                        to="/profil"
                                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium inline-flex items-center space-x-1"
                                    >
                                        <span>Tüm aktiviteleri gör</span>
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {quickActions.map((action, index) => (
                                <Card key={index} variant="elevated" className="group hover-lift">
                                    <div className="p-6">
                                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <action.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                            {action.title}
                                        </h3>
                                        <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                                            {action.description}
                                        </p>
                                        <Link to={action.link}>
                                            <Button variant="outline" size="small" className="w-full">
                                                {action.buttonText}
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Profile Quick Access */}
                        <Card variant="glass" title="Profil Özeti">
                            <div className="text-center p-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white font-bold text-lg">
                                        {user.first_name?.[0] || user.username?.[0] || '?'}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                                    {user.first_name} {user.last_name}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                    {user.email}
                                </p>
                                <Link to="/profil">
                                    <Button variant="outline" size="small" className="w-full">
                                        Profili Düzenle
                                    </Button>
                                </Link>
                            </div>
                        </Card>

                        {/* Upcoming Events */}
                        <Card variant="default" title="Yaklaşan Etkinlikler">
                            <div className="space-y-3">
                                {[
                                    { name: "Design Workshop", date: "Yarın 14:00", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
                                    { name: "Coffee Chat", date: "Perşembe 16:30", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
                                    { name: "Tech Meetup", date: "Cuma 19:00", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" }
                                ].map((event, index) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-700/50 transition-colors">
                                        <div className={`w-3 h-3 rounded-full ${event.color.split(' ')[0]} opacity-70`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                {event.name}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                {event.date}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div className="text-center pt-2">
                                    <Link
                                        to="/etkinlikler"
                                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                                    >
                                        Tümünü gör →
                                    </Link>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Links */}
                        <Card variant="glass" title="Hızlı Erişim">
                            <div className="space-y-2">
                                {[
                                    { icon: BellIcon, label: "Bildirimler", link: "/profil", count: 3 },
                                    { icon: BookmarkIcon, label: "Kayıtlı Etkinlikler", link: "/etkinlikler" },
                                    { icon: ChartBarIcon, label: "İstatistikler", link: "/profil" },
                                    { icon: Cog6ToothIcon, label: "Ayarlar", link: "/profil" }
                                ].map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.link}
                                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-700/50 transition-colors group"
                                    >
                                        <item.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                                        <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 font-medium">
                                            {item.label}
                                        </span>
                                        {item.count && (
                                            <span className="ml-auto bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full text-xs font-semibold">
                                                {item.count}
                                            </span>
                                        )}
                                        <ArrowRightIcon className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 ml-auto" />
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 