import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import LoginForm from '../../components/auth/LoginForm';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { addNotification } = useApp();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Kullanıcının geldiği sayfayı kontrol et (korumalı rotalardan yönlendirme varsa)
    const from = location.state?.from?.pathname || '/';

    const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
        setError(null);
        setIsLoading(true);

        try {
            // AuthContext içindeki login fonksiyonunu kullan
            await login(email, password);

            // Başarılı giriş bildirimini göster
            addNotification({
                type: 'success',
                message: 'Başarıyla giriş yaptınız!',
                duration: 3000
            });

            // Beni hatırla işlevi için local storage kullanımı
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('rememberedEmail');
            }

            // Kullanıcının geldiği sayfaya ya da ana sayfaya yönlendir
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 500); // Kısa bir gecikme ekle ki kullanıcı bildirimi görebilsin
        } catch (err: any) {
            // Hata mesajını belirle
            let errorMessage = 'Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.';

            // Spesifik hata mesajlarını kontrol et
            if (err && err.message) {
                if (err.message.includes('Kullanıcı bulunamadı')) {
                    errorMessage = 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.';
                } else if (err.message.includes('şifre')) {
                    errorMessage = 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.';
                }
            }

            setError(errorMessage);

            // Hata bildirimini göster
            addNotification({
                type: 'error',
                message: errorMessage,
                duration: 5000
            });

            console.error('Giriş hatası:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-default py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    {/* Logo veya site adı buraya eklenebilir */}
                    {/* <img className="mx-auto h-12 w-auto" src="/path-to-your-logo.png" alt="Site Logosu" /> */}
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900">
                        Hesabınıza Giriş Yapın
                    </h2>
                    {/* Kayıt linki eklenebilir */}
                    {/* 
                    <p className="mt-2 text-center text-sm text-neutral-600">
                        Veya {' '}
                        <Link to="/kayit" className="font-medium text-primary hover:text-primary-dark">
                            yeni bir hesap oluşturun
                        </Link>
                    </p> 
                    */}
                </div>

                {from !== '/' && (
                    <div className="bg-status-info/10 border-l-4 border-status-info text-status-info p-4 rounded-md" role="alert">
                        <p className="font-medium">Bilgilendirme</p>
                        <p className="text-sm">Bu sayfaya erişmek için giriş yapmanız gerekiyor.</p>
                    </div>
                )}

                {/* LoginForm bir Card içine alınabilir veya kendi stilini yönetebilir */}
                {/* Şimdilik Card kullanmadan bırakıyorum, LoginForm.tsx'i gördükten sonra karar verebiliriz */}
                <LoginForm
                    onSubmit={handleLogin}
                    isLoading={isLoading}
                    error={error}
                />
            </div>
        </div>
    );
};

export default Login; 