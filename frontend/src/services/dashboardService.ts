import apiService from './apiService';

// Dashboard veri modelleri
interface DashboardResponse {
    userFeed: {
        events: EventItem[];
    };
    suggestions: {
        items: SuggestionItem[];
    };
    aiRecommendations: {
        items: AIRecommendationItem[];
    };
}

export interface EventItem {
    id: number;
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate?: string;
    imageUrl?: string;
    attendeesCount: number;
    creatorName: string;
    isUserAttending?: boolean;
    isPrivate: boolean;
    creator_user_id: number;
    room_id?: number;
    final_start_time?: string;
    final_end_time?: string;
}

export interface SuggestionItem {
    id: number;
    type: 'event' | 'room' | 'friend';
    title: string;
    description: string;
    imageUrl?: string;
    createdAt: string;
    data: {
        id: number;
        name?: string;
        username?: string;
        eventTitle?: string;
        roomName?: string;
    };
}

export interface AIRecommendationItem {
    id: number;
    type: 'event' | 'room' | 'friend';
    title: string;
    description: string;
    matchScore: number;
    matchPercentage: number;
    imageUrl?: string;
    details: {
        location?: string;
        date?: string;
        attendeesCount?: number;
        tags?: string[];
    };
}

// Dashboard servisi
const dashboardService = {
    // Dashboard verilerini getiren metot
    async getDashboardData(): Promise<DashboardResponse> {
        try {
            // API'den gerçek verileri çekmeyi dene
            return await apiService.get<DashboardResponse>('/api/dashboard');
        } catch (error) {
            console.error('Dashboard verileri alınırken hata oluştu:', error);

            // API başarısız olursa boş veri döndür
            return {
                userFeed: {
                    events: []
                },
                suggestions: {
                    items: []
                },
                aiRecommendations: {
                    items: []
                }
            };
        }
    },

    // Etkinliğe katılım durumunu güncelleme metodu
    async attendEvent(eventId: number): Promise<void> {
        try {
            await apiService.post(`/events/${eventId}/attend`);
        } catch (error) {
            console.error('Etkinliğe katılma hatası:', error);
            throw error;
        }
    },

    // Öneri kabul etme metodu
    async acceptSuggestion(id: number, type: string): Promise<void> {
        try {
            await apiService.post(`/suggestions/${id}/accept`, { type });
        } catch (error) {
            console.error('Öneri kabul etme hatası:', error);
            throw error;
        }
    },

    // Öneri reddetme metodu
    async rejectSuggestion(id: number): Promise<void> {
        try {
            await apiService.post(`/suggestions/${id}/reject`);
        } catch (error) {
            console.error('Öneri reddetme hatası:', error);
            throw error;
        }
    }
};

export default dashboardService; 