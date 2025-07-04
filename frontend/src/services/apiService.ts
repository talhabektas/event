import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API temel URL'i - Vite proxy kullandığımız için /api olarak ayarlıyoruz
const API_URL = '';

// Axios instance oluşturma
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 15000, // 15 saniye timeout
});

// Request interceptor - JWT token'ını header'a ekleme
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token && config.headers) {
            // Bearer token formatında Authorization header'ı ekleme
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - hata yönetimi ve token yenileme
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // 401 Unauthorized - Sadece localStorage'ı temizle, yönlendirmeyi context'e bırak
        if (error.response?.status === 401) {
            // Token geçersiz/süresi dolmuş - localStorage'ı temizle
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Context'in handle etmesi için hatayı olduğu gibi throw et
            // window.location.href yerine auth context'in logout fonksiyonu handle edecek
        }

        // 403 Forbidden 
        if (error.response?.status === 403) {
            console.error('Bu işlem için yetkiniz bulunmamaktadır.');
        }

        // 500 Server Error 
        if (error.response?.status === 500) {
            console.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
        }

        return Promise.reject(error);
    }
);

// API metotları
const apiService = {
    /**
     * GET isteği gönderir
     * @param url - İstek URL'i
     * @param params - URL parametreleri (opsiyonel)
     * @param config - Axios konfigürasyonu (opsiyonel)
     * @returns Promise<T>
     */
    async get<T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
        console.log(`GET isteği gönderiliyor: ${url}`, params);
        try {
            const response = await apiClient.get<T>(url, { params, ...config });
            console.log(`GET yanıtı (${url}):`, response.status, response.data);
            return response.data;
        } catch (error: any) {
            console.error(`GET hatası (${url}):`, error.response ? {
                status: error.response.status,
                data: error.response.data
            } : error.message);
            throw error;
        }
    },

    /**
     * POST isteği gönderir
     * @param url - İstek URL'i
     * @param data - Gönderilecek veri
     * @param config - Axios konfigürasyonu (opsiyonel)
     * @returns Promise<T>
     */
    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        console.log(`POST isteği gönderiliyor: ${url}`, data);
        console.log(`POST isteği tam URL: ${API_URL}${url}`);
        console.log(`POST isteği headers:`, config?.headers || apiClient.defaults.headers);

        try {
            const response = await apiClient.post<T>(url, data, config);
            console.log(`POST yanıtı (${url}):`, response.status, response.data);
            return response.data;
        } catch (error: any) {
            console.error(`POST hatası (${url}):`, error);
            if (error.response) {
                console.error('Hata yanıtı:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                console.error('İstek gönderildi ama yanıt alınamadı:', error.request);
            } else {
                console.error('İstek oluşturulurken hata:', error.message);
            }
            console.error('Hata konfigürasyonu:', error.config);
            throw error;
        }
    },

    /**
     * PUT isteği gönderir
     * @param url - İstek URL'i
     * @param data - Güncellenecek veri
     * @param config - Axios konfigürasyonu (opsiyonel)
     * @returns Promise<T>
     */
    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await apiClient.put<T>(url, data, config);
        return response.data;
    },

    /**
     * DELETE isteği gönderir
     * @param url - İstek URL'i
     * @param config - Axios konfigürasyonu (opsiyonel)
     * @returns Promise<T>
     */
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await apiClient.delete<T>(url, config);
        return response.data;
    },

    /**
     * PATCH isteği gönderir
     * @param url - İstek URL'i
     * @param data - Kısmi güncellenecek veri
     * @param config - Axios konfigürasyonu (opsiyonel)
     * @returns Promise<T>
     */
    async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await apiClient.patch<T>(url, data, config);
        return response.data;
    },

    /**
     * Form verisi ile POST isteği gönderir (multipart/form-data)
     * @param url - İstek URL'i
     * @param formData - FormData nesnesi
     * @param config - Axios konfigürasyonu (opsiyonel)
     * @returns Promise<T>
     */
    async uploadFile<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
        const uploadConfig = {
            ...config,
            headers: {
                ...config?.headers,
                'Content-Type': 'multipart/form-data',
            },
        };
        const response = await apiClient.post<T>(url, formData, uploadConfig);
        return response.data;
    },

    client: apiClient,
};

export default apiService;

// Notification Types
export type NotificationType = "friend_request" | "event_invitation" | "room_invitation" | "system_message" | "default" | "new_message" | "event_join_request";

export interface Notification {
    id: number;
    created_at: string;
    updated_at: string;
    user_id: number;
    type: NotificationType;
    message: string;
    is_read: boolean;
    related_id?: number;
}


// Notification Service
export const notificationService = {
    getNotifications: (): Promise<Notification[]> => {
        return apiService.get<Notification[]>('/api/notifications');
    },
    markNotificationsAsRead: (notificationIds: number[]): Promise<{ message: string }> => {
        return apiService.post('/api/notifications/read', { notification_ids: notificationIds });
    },
}; 