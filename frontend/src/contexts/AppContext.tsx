import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { SuggestionItem, AIRecommendationItem, EventItem } from '../services/dashboardService';
import { notificationService } from '../services/apiService';
import type { Notification as SystemNotification } from '../services/apiService';
import { useAuth } from './AuthContext';

// Bildirim tipi
interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number; // ms cinsinden
    createdAt: Date;
}

// AppContext için tip tanımlaması
interface AppContextType {
    // Bildirimler
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
    removeNotification: (id: string) => void;

    // Yükleme durumu
    isGlobalLoading: boolean;
    setGlobalLoading: (isLoading: boolean) => void;

    // Tema ayarları
    theme: 'light' | 'dark';
    toggleTheme: () => void;

    // Mobil menü durumu
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;

    // Öneriler
    suggestions: SuggestionItem[];
    setSuggestions: (suggestions: SuggestionItem[]) => void;
    suggestionCount: number;

    // AI Önerileri
    aiRecommendations: AIRecommendationItem[];
    setAiRecommendations: (recommendations: AIRecommendationItem[]) => void;

    // Etkinlik akışı
    userFeed: EventItem[];
    setUserFeed: (events: EventItem[]) => void;
    updateEventInFeed: (updatedEvent: EventItem) => void;

    // System Notifications
    systemNotifications: SystemNotification[];
    unreadNotificationCount: number;
    fetchSystemNotifications: () => Promise<void>;
    markSystemNotificationsAsRead: (ids: number[]) => Promise<void>;

    // Unread Messages
    unreadMessagesCount: number;
    fetchUnreadMessagesCount: () => Promise<void>;
    markRoomAsRead: (roomId: number) => Promise<void>;
}

// Context Provider bileşeni için props tipi
interface AppProviderProps {
    children: ReactNode;
}

// AppContext'in varsayılan değeri
const AppContext = createContext<AppContextType>({
    notifications: [],
    addNotification: () => { },
    removeNotification: () => { },

    isGlobalLoading: false,
    setGlobalLoading: () => { },

    theme: 'light',
    toggleTheme: () => { },

    isMobileMenuOpen: false,
    toggleMobileMenu: () => { },

    suggestions: [],
    setSuggestions: () => { },
    suggestionCount: 0,

    aiRecommendations: [],
    setAiRecommendations: () => { },

    userFeed: [],
    setUserFeed: () => { },
    updateEventInFeed: () => { },

    systemNotifications: [],
    unreadNotificationCount: 0,
    fetchSystemNotifications: async () => { },
    markSystemNotificationsAsRead: async () => { },

    unreadMessagesCount: 0,
    fetchUnreadMessagesCount: async () => { },
    markRoomAsRead: async () => { },
});

// AppProvider bileşeni
export const AppProvider = ({ children }: AppProviderProps) => {
    const { isAuthenticated } = useAuth();
    // Bildirimler için state
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Global yükleme durumu için state
    const [isGlobalLoading, setGlobalLoading] = useState(false);

    // setGlobalLoading'i useCallback ile sarmalayalım (genelde stabil olsa da best practice)
    const handleSetGlobalLoading = useCallback((isLoading: boolean) => {
        setGlobalLoading(isLoading);
    }, []);

    // Tema ayarları için state
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Mobil menü durumu için state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Öneriler için state
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const suggestionCount = suggestions.length;

    // AI Önerileri için state
    const [aiRecommendations, setAiRecommendations] = useState<AIRecommendationItem[]>([]);

    // Etkinlik akışı için state
    const [userFeed, setUserFeed] = useState<EventItem[]>([]);

    // System notifications state
    const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    // Unread messages state
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // Tema değiştirme fonksiyonu
    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            // HTML element'ine tema class'ı ekleme/çıkarma
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return newTheme;
        });
    }, []);

    const fetchSystemNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const fetchedNotifications = await notificationService.getNotifications();
            setSystemNotifications(fetchedNotifications);
            const unreadCount = fetchedNotifications.filter(n => !n.is_read).length;
            setUnreadNotificationCount(unreadCount);
        } catch (error) {
            console.error("Sistem bildirimleri alınamadı:", error);
        }
    }, [isAuthenticated]);

    const markSystemNotificationsAsRead = useCallback(async (ids: number[]) => {
        try {
            await notificationService.markNotificationsAsRead(ids);
            // Bildirimleri yeniden çekerek listeyi ve sayacı güncelle
            await fetchSystemNotifications();
        } catch (error) {
            console.error("Bildirimler okundu olarak işaretlenemedi:", error);
        }
    }, [fetchSystemNotifications]);

    // Unread messages functions
    const fetchUnreadMessagesCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await fetch('http://localhost:8082/api/rooms/unread-count', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadMessagesCount(data.unread_count || 0);
            }
        } catch (error) {
            console.error("Okunmamış mesaj sayısı alınamadı:", error);
        }
    }, [isAuthenticated]);

    const markRoomAsRead = useCallback(async (roomId: number) => {
        try {
            const response = await fetch(`http://localhost:8082/api/rooms/${roomId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                // Okunmamış mesaj sayısını yeniden çek
                await fetchUnreadMessagesCount();
            }
        } catch (error) {
            console.error("Mesajlar okundu olarak işaretlenemedi:", error);
        }
    }, [fetchUnreadMessagesCount]);

    // Mobil menüyü toggle etme
    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
    }, []);

    // Bildirim kaldırma fonksiyonu
    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Bildirim ekleme fonksiyonu
    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
        const id = Math.random().toString(36).substring(2, 11);
        const newNotification: Notification = {
            ...notification,
            id,
            createdAt: new Date(),
            duration: notification.duration || 5000, // varsayılan 5 saniye
        };

        setNotifications(prev => [...prev, newNotification]);

        // Süresine göre bildirimi otomatik kaldır
        if (notification.duration !== 0) {
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration || 5000);
        }
    }, [removeNotification]);

    // Etkinlik akışı güncelleme fonksiyonu
    const updateEventInFeed = useCallback((updatedEvent: EventItem) => {
        setUserFeed(prevFeed => prevFeed.map(event => event.id === updatedEvent.id ? updatedEvent : event));
    }, []);

    // Sayfa yüklendiğinde tema ayarını localStorage'dan al
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
        setTheme(savedTheme);

        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSystemNotifications(); // Sayfa yüklendiğinde bir kere çek
            fetchUnreadMessagesCount(); // Okunmamış mesaj sayısını çek
            const interval = setInterval(() => {
                fetchSystemNotifications(); // Periyodik olarak çek
                fetchUnreadMessagesCount(); // Okunmamış mesaj sayısını çek
            }, 30000); // 30 saniyede bir

            return () => clearInterval(interval); // Component unmount olduğunda interval'i temizle
        }
    }, [isAuthenticated, fetchSystemNotifications, fetchUnreadMessagesCount]);

    const value = useMemo(() => ({
        notifications,
        addNotification,
        removeNotification,

        isGlobalLoading,
        setGlobalLoading: handleSetGlobalLoading,

        theme,
        toggleTheme,

        isMobileMenuOpen,
        toggleMobileMenu,

        suggestions,
        setSuggestions,
        suggestionCount,

        aiRecommendations,
        setAiRecommendations,

        userFeed,
        setUserFeed,
        updateEventInFeed,

        systemNotifications,
        unreadNotificationCount,
        fetchSystemNotifications,
        markSystemNotificationsAsRead,

        unreadMessagesCount,
        fetchUnreadMessagesCount,
        markRoomAsRead,
    }), [
        notifications,
        addNotification,
        removeNotification,
        isGlobalLoading,
        handleSetGlobalLoading,
        theme,
        isMobileMenuOpen,
        toggleTheme,
        toggleMobileMenu,
        suggestions,
        setSuggestions,
        suggestionCount,
        aiRecommendations,
        setAiRecommendations,
        userFeed,
        setUserFeed,
        updateEventInFeed,
        systemNotifications,
        unreadNotificationCount,
        fetchSystemNotifications,
        markSystemNotificationsAsRead,
        unreadMessagesCount,
        fetchUnreadMessagesCount,
        markRoomAsRead,
    ]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook - Context'e kolay erişim için
export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp hook must be used within an AppProvider');
    }
    return context;
};

export default AppContext; 