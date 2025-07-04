import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import RegisterForm from '../../components/auth/RegisterForm';
import type { RegisterData } from '../../components/auth/RegisterForm';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { addNotification } = useApp();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (userData: RegisterData) => {
        setError(null);
        setIsLoading(true);

        try {
            // AuthContext içindeki register fonksiyonunu kullan
            await register(userData);

            // Başarılı kayıt bildirimini göster
            addNotification({
                type: 'success',
                message: 'Hesabınız başarıyla oluşturuldu ve giriş yapıldı!',
                duration: 3000
            });

            // Ana sayfaya yönlendir
            navigate('/');
        } catch (err) {
            let errorMessage = 'Kayıt olurken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.';

            // Hata detaylarını kontrol et
            if (err instanceof Error) {
                if (err.message.includes('e-posta adresi zaten kullanılıyor')) {
                    errorMessage = 'Bu e-posta adresi zaten kullanılıyor.';
                } else if (err.message.includes('kullanıcı adı zaten kullanılıyor')) {
                    errorMessage = 'Bu kullanıcı adı zaten kullanılıyor.';
                }
            }

            setError(errorMessage);

            // Hata bildirimini göster
            addNotification({
                type: 'error',
                message: errorMessage,
                duration: 5000
            });
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
                        Yeni Hesap Oluşturun
                    </h2>
                    <p className="mt-2 text-center text-sm text-neutral-600">
                        Zaten bir hesabınız var mı?{' '}
                        <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                            Giriş yapın
                        </Link>
                    </p>
                </div>

                <RegisterForm
                    onSubmit={handleRegister}
                    isLoading={isLoading}
                    error={error}
                />
            </div>
        </div>
    );
};

export default Register; 