import apiService from './apiService';
import type { RegisterData } from '../components/auth/RegisterForm';

// Backend'den dönen kullanıcı tipi
export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    updated_at: string;
    profile_picture_url?: string;
    interests?: { id: number; name: string; category: string }[];
}

// Backend'den login işlemi sonucunda dönen veri tipi
interface LoginResponse {
    token: string;
    user: User;
}

// Backend'den register işlemi sonucunda dönen veri tipi
interface RegisterResponse {
    token: string;
    user: User;
}

/**
 * Kimlik doğrulama işlemleri için servis
 */
const authService = {
    /**
     * Kullanıcı girişi yapar
     * @param email Kullanıcı e-posta adresi
     * @param password Kullanıcı şifresi
     * @returns Kullanıcı bilgileri ve JWT token
     */
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            console.log('Login isteği gönderiliyor...');
            console.log('Gönderilen veriler:', { email, password: '********' });

            const response = await apiService.post<LoginResponse>('/api/auth/login', {
                email,
                password,
            });
            console.log('Login API cevabı:', response);

            // Token ve kullanıcı bilgilerini localStorage'a kaydet
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Yeni kullanıcı kaydı yapar
     * @param userData Kullanıcı kayıt bilgileri
     * @returns Kullanıcı bilgileri ve JWT token
     */
    register: async (userData: RegisterData): Promise<RegisterResponse> => {
        try {
            console.log("Backend API'ye kayıt isteği gönderiliyor:", {
                ...userData,
                password: '********'
            });
            console.log("Tam API URL:", apiService.client.defaults.baseURL + '/api/auth/register');

            const response = await apiService.post<RegisterResponse>('/api/auth/register', userData);
            console.log('API cevabı:', response);

            // Token ve kullanıcı bilgilerini localStorage'a kaydet
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            return response;
        } catch (error) {
            console.error('Register error:', error);
            console.error('Hata detayları:', (error as any).response?.data || (error as any).message);
            throw error;
        }
    },

    /**
     * Mevcut oturumu doğrular ve kullanıcı bilgilerini getirir
     * @returns Kullanıcı bilgileri
     */
    getCurrentUser: async (): Promise<User> => {
        try {
            const user = await apiService.get<User>('/api/auth/me');
            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    },

    /**
     * Şifre sıfırlama isteği gönderir
     * @param email Kullanıcı e-posta adresi
     */
    forgotPassword: async (email: string): Promise<void> => {
        try {
            await apiService.post('/auth/forgot-password', { email });
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    },

    /**
     * Şifre sıfırlama işlemini tamamlar
     * @param token Şifre sıfırlama tokeni
     * @param newPassword Yeni şifre
     */
    resetPassword: async (token: string, newPassword: string): Promise<void> => {
        try {
            await apiService.post('/auth/reset-password', {
                token,
                password: newPassword,
            });
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    },

    /**
     * Kullanıcı profil bilgilerini günceller
     * @param userData Güncellenecek kullanıcı bilgileri
     * @returns Güncellenmiş kullanıcı bilgileri
     */
    updateProfile: async (userData: Partial<User>): Promise<User> => {
        try {
            const updatedUser = await apiService.put<User>('/api/users/me', userData);
            return updatedUser;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    /**
     * Kullanıcının ilgi alanlarını günceller
     * @param interests Güncellenmiş ilgi alanları dizisini içeren nesne
     * @returns Güncellenmiş kullanıcı bilgileri
     */
    updateInterests: async (interestsPayload: { interest_ids: number[] }): Promise<User> => {
        try {
            const updatedUser = await apiService.post<User>('/api/users/me/interests', interestsPayload);
            return updatedUser;
        } catch (error) {
            console.error('Update interests error:', error);
            throw error;
        }
    },

    /**
     * Şifre değiştirme işlemi
     * @param currentPassword Mevcut şifre
     * @param newPassword Yeni şifre
     */
    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        try {
            await apiService.post('/auth/change-password', {
                currentPassword,
                newPassword,
            });
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    /**
     * Kayıtlı JWT token'ını döndürür
     * @returns JWT token veya null
     */
    getToken: (): string | null => {
        return localStorage.getItem('token');
    },
};

export default authService; 