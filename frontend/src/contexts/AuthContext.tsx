import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';
import type { User } from '../services/authService';
import type { RegisterData } from '../components/auth/RegisterForm';

// AuthContext için tip tanımlaması
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => Promise<void>;
    updateUserInterests: (interests: { id: number }[]) => Promise<void>;
}

// AuthContext'in varsayılan değeri
const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    register: async () => { },
    logout: () => { },
    updateUser: async () => { },
    updateUserInterests: async () => { },
});

// Context Provider bileşeni için props tipi
interface AuthProviderProps {
    children: ReactNode;
}

// LocalStorage'dan kullanıcı bilgilerini alma fonksiyonu
const getUserFromStorage = (): User | null => {
    try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            return JSON.parse(userJson) as User;
        }
    } catch (error) {
        console.error('LocalStorage\'dan kullanıcı bilgileri alınırken hata:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
    return null;
};

// AuthProvider bileşeni
export const AuthProvider = ({ children }: AuthProviderProps) => {
    // LocalStorage'dan başlangıç durumu
    const [user, setUser] = useState<User | null>(() => getUserFromStorage());
    const [isLoading, setIsLoading] = useState(false);

    // Uygulama başladığında kullanıcı oturumunu kontrol et
    useEffect(() => {
        return;
        const checkAuth = async () => {
            console.log('🔍 checkAuth çalışıyor - token:', !!localStorage.getItem('token'), 'user state:', !!user);
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                // LocalStorage'da token var, ama user yoksa veya gerçekliğini kontrol etmek istiyorsak API'den alalım
                if (token && !user) {
                    console.log('⚠️ Token var ama user yok, API\'den almaya çalışıyorum...');
                    try {
                        // API'den kullanıcı bilgilerini almaya çalış
                        const userData = await authService.getCurrentUser();
                        console.log('✅ API\'den user alındı:', userData.email);
                        setUser(userData);
                        // LocalStorage'ı güncelle
                        localStorage.setItem('user', JSON.stringify(userData));
                    } catch (error) {
                        console.error('❌ API\'den kullanıcı bilgileri alınamadı:', error);
                        // API başarısız oldu, localStorage'dan almaya çalış
                        const storedUser = getUserFromStorage();
                        if (storedUser) {
                            console.log('✅ localStorage\'dan user alındı:', storedUser.email);
                            setUser(storedUser);
                        } else {
                            console.log('💥 HİÇBİR YERDE USER YOK - LOGOUT YAPIYORUM!');
                            // Kullanıcı bilgisi yok, oturumu temizle
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            setUser(null);
                        }
                    }
                } else if (!token) {
                    console.log('❌ Token yok - logout');
                    // Token yoksa oturum da yok
                    localStorage.removeItem('user');
                    setUser(null);
                } else {
                    console.log('✅ Token ve user var, her şey normal');
                }
            } catch (error) {
                console.error('💥 Oturum kontrolü sırasında hata - LOGOUT!:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Giriş yap
    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login(email, password);

            // Token ve kullanıcı bilgilerini localStorage'a kaydet
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            // State'i güncelle
            setUser(response.user);
        } catch (error) {
            console.error('Giriş sırasında hata:', error);
            throw error;
        }
    };

    // Kayıt ol
    const register = async (userData: RegisterData) => {
        try {
            console.log('Kullanıcı kayıt verisi:', userData);

            const response = await authService.register(userData);
            console.log('Register API yanıtı:', response);

            // Token ve kullanıcı bilgilerini localStorage'a kaydet
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            // State'i güncelle
            setUser(response.user);
        } catch (error) {
            console.error('Kayıt sırasında hata:', error);
            throw error;
        }
    };

    // Çıkış yap
    const logout = () => {
        // LocalStorage'dan oturum bilgilerini temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // State'i güncelle
        setUser(null);

        // Login sayfasına yönlendir - window.location kullan (Router context problemi yüzünden)
        window.location.href = '/giris';
    };

    // Kullanıcı bilgilerini güncelle
    const updateUser = async (userData: Partial<User>) => {
        try {
            const updatedUser = await authService.updateProfile(userData);

            // Kullanıcı state'ini güncelle
            setUser(updatedUser);

            // LocalStorage'ı güncelle
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Kullanıcı bilgileri güncellenirken hata:', error);
            throw error;
        }
    };

    // Kullanıcının sadece ilgi alanlarını güncelle
    const updateUserInterests = async (interests: { id: number }[]) => {
        try {
            // Servise göndermeden önce doğru formata dönüştür
            const payload = { interest_ids: interests.map(i => i.id) };
            console.log('İlgi alanları güncelleniyor:', payload);

            const updatedUser = await authService.updateInterests(payload);
            console.log('Güncellenen kullanıcı:', updatedUser);

            // Kullanıcı state'ini güncelle
            setUser(updatedUser);

            // LocalStorage'ı güncelle
            localStorage.setItem('user', JSON.stringify(updatedUser));

            console.log('✅ İlgi alanları başarıyla güncellendi, logout YAPILMADI');
        } catch (error: any) {
            console.error('Kullanıcı ilgi alanları güncellenirken hata:', error);
            console.log('❌ Hata oluştu ama logout YAPILMAYACAK - sadece hatayı throw ediyoruz');

            // İlgi alanları güncellemesinde HİÇ logout yapma
            // Sadece hatayı throw et ki UI'da gösterilsin
            throw error;
        }
    };

    // value nesnesini useMemo ile sarmala
    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        updateUserInterests,
    }), [user, isLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook - Context'e kolay erişim için
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth hook must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext; 