import apiService from './apiService';
import type { CreateEventFormData } from '../components/events/CreateEventModal';
import type { EventItem } from './dashboardService';
import type { Event, CreateEventDTO } from '../types/event';

/**
 * Etkinlik hizmetleri için API servisi
 */
const eventService = {
    /**
     * Etkinlikleri getirir
     * @param page Sayfa numarası
     * @param limit Sayfa başına etkinlik sayısı
     * @returns Etkinlik listesi
     */
    getEvents: async (page = 1, limit = 10): Promise<{ events: EventItem[], total: number }> => {
        try {
            // API'den gelen yanıtı doğrudan konsola yazdır (debug için)
            console.log(`Etkinlikler API çağrısı: /api/events?page=${page}&limit=${limit}`);

            // any tipinde veriyi direkt al (dönüşüm için)
            const response = await apiService.get<any>(`/api/events?page=${page}&limit=${limit}`);
            console.log('API yanıtı:', response);

            // Backend'den gelen yanıtı kontrol et ve dönüştür
            let events: EventItem[] = [];
            let total: number = 0;

            // Backend'in events ve total alanlarını kontrol et
            if (response && Array.isArray(response)) {
                // Backend doğrudan dizi dönüyorsa
                console.log('Backend doğrudan dizi döndü');
                events = response;
                total = response.length;
            } else if (response && response.events && Array.isArray(response.events)) {
                // Backend { events: [...], total: X } formatında dönüyorsa
                console.log('Backend events ve total formatında döndü');
                events = response.events;
                total = response.total || response.events.length;
            } else if (response && typeof response === 'object') {
                // Başka bir format varsa
                console.log('Beklenmedik API yanıt formatı, tüm alanlar:', Object.keys(response));
                // Veri yapısında events alanını ara
                for (const key in response) {
                    if (Array.isArray(response[key])) {
                        console.log(`Potansiyel events dizisi bulundu: ${key}, uzunluk:`, response[key].length);
                        events = response[key];
                        total = events.length;
                        break;
                    }
                }
            }

            console.log('İşlenmiş events dizisi:', events);
            console.log('Toplam kayıt sayısı:', total);

            return {
                events,
                total
            };
        } catch (error) {
            console.error('Etkinlikler alınırken hata oluştu:', error);
            // API başarısız olursa boş liste döndür
            return {
                events: [],
                total: 0
            };
        }
    },

    /**
     * ID'ye göre etkinlik detayını getirir
     * @param id Etkinlik ID
     * @returns Etkinlik detayı
     */
    getEventById: async (id: number): Promise<Event | null> => {
        try {
            const response = await apiService.get<Event>(`/api/events/${id}`);
            return response;
        } catch (error) {
            console.error('Etkinlik detayı alınırken hata oluştu:', error);
            return null;
        }
    },

    /**
     * Yeni etkinlik oluşturur
     * @param eventData Etkinlik verisi
     * @returns Oluşturulan etkinlik
     */
    createEvent: async (eventData: CreateEventFormData): Promise<Event> => {
        try {
            // Tarih formatını doğru şekilde biçimlendir
            const formatDateToISO = (date: Date): string => {
                return date.toISOString();
            };

            // Backend'in beklediği formatta veri oluştur - CreateEventDTO yapısına uygun
            const eventPayload: CreateEventDTO = {
                title: eventData.title,
                description: eventData.description,
                location: eventData.location,
                time_options: [formatDateToISO(eventData.startDate)]
            };

            // Opsiyonel alanları ekle
            if (eventData.isPrivate !== undefined) {
                eventPayload.is_private = eventData.isPrivate;
            }

            if (eventData.roomId !== undefined) {
                eventPayload.room_id = eventData.roomId;
            }

            if (eventData.imageUrl) {
                eventPayload.image_url = eventData.imageUrl;
            }

            // Bitiş tarihi varsa time_options'a ekle
            if (eventData.endDate) {
                eventPayload.time_options.push(formatDateToISO(eventData.endDate));
            }

            console.log("Gönderilen etkinlik verisi:", JSON.stringify(eventPayload));

            // JSON formatında gönder
            const response = await apiService.post<Event>('/api/events', eventPayload, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return response;
        } catch (error) {
            console.error('Etkinlik oluşturulurken hata oluştu:', error);
            throw error;
        }
    },

    /**
     * Etkinliği günceller
     * @param id Etkinlik ID
     * @param eventData Güncellenecek etkinlik verisi
     * @returns Güncellenmiş etkinlik
     */
    updateEvent: async (id: number, eventData: Partial<CreateEventFormData>): Promise<Event> => {
        try {
            // Backend'in beklediği formatta veri oluştur
            const updatePayload: Partial<CreateEventDTO> = {};

            // Sadece tanımlı alanları payload'a ekle
            if (eventData.title !== undefined) updatePayload.title = eventData.title;
            if (eventData.description !== undefined) updatePayload.description = eventData.description;
            if (eventData.location !== undefined) updatePayload.location = eventData.location;
            if (eventData.isPrivate !== undefined) updatePayload.is_private = eventData.isPrivate;
            if (eventData.roomId !== undefined) updatePayload.room_id = eventData.roomId;
            if (eventData.imageUrl !== undefined) updatePayload.image_url = eventData.imageUrl;

            // Tarih alanları varsa time_options'a ekle
            if (eventData.startDate || eventData.endDate) {
                updatePayload.time_options = [];
                if (eventData.startDate) {
                    updatePayload.time_options.push(eventData.startDate.toISOString());
                }
                if (eventData.endDate) {
                    updatePayload.time_options.push(eventData.endDate.toISOString());
                }
            }

            // PUT isteği gönder
            const response = await apiService.put<Event>(`/api/events/${id}`, updatePayload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response;
        } catch (error) {
            console.error('Etkinlik güncellenirken hata oluştu:', error);
            throw error;
        }
    },

    /**
     * Etkinliği siler
     * @param id Silinecek etkinlik ID
     */
    deleteEvent: async (id: number): Promise<void> => {
        try {
            await apiService.delete(`/api/events/${id}`);
        } catch (error) {
            console.error('Etkinlik silinirken hata oluştu:', error);
            throw error;
        }
    },

    /**
     * Kullanıcının etkinliklerini getirir
     * @param userId Kullanıcı ID
     * @returns Kullanıcının etkinlik listesi
     */
    getUserEvents: async (userId: number): Promise<Event[]> => {
        try {
            const response = await apiService.get<Event[]>(`/api/users/${userId}/events`);
            return response;
        } catch (error) {
            console.error('Kullanıcı etkinlikleri alınırken hata oluştu:', error);
            // API başarısız olursa boş dizi döndür
            return [];
        }
    },

    /**
     * Etkinliğe katılma
     * @param eventId Etkinlik ID
     */
    attendEvent: async (eventId: number): Promise<void> => {
        try {
            await apiService.post(`/api/events/${eventId}/attend`);
        } catch (error) {
            console.error('Etkinliğe katılma hatası:', error);
            throw error;
        }
    },

    /**
     * Etkinlik katılımını iptal etme
     * @param eventId Etkinlik ID
     */
    cancelAttendance: async (eventId: number): Promise<void> => {
        try {
            await apiService.delete(`/api/events/${eventId}/attend`);
        } catch (error) {
            console.error('Etkinlik katılımını iptal etme hatası:', error);
            throw error;
        }
    },

    /**
     * Etkinlik zamanı için oy verme
     * @param eventId Etkinlik ID
     * @param timeOptionId Zaman seçeneği ID
     */
    voteForTimeOption: async (eventId: number, timeOptionId: number): Promise<void> => {
        try {
            await apiService.post(`/api/events/${eventId}/time-options/${timeOptionId}/vote`);
        } catch (error) {
            console.error('Zaman seçeneği oylaması hatası:', error);
            throw error;
        }
    },

    getEventAttendees: async (eventId: number) => {
        return apiService.get(`/api/events/${eventId}/attendees`);
    },

    approveRequest: async (requestId: number) => {
        return apiService.post(`/api/requests/${requestId}/approve`, {});
    },

    declineRequest: async (requestId: number) => {
        return apiService.post(`/api/requests/${requestId}/decline`, {});
    },

    inviteUserToEvent: async (eventId: number, userId: number) => {
        return apiService.post(`/api/events/${eventId}/invite`, { userId });
    }
};

export default eventService; 