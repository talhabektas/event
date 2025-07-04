import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Korumalı rotalarda kullanılacak özel hook
 * İçinde kullanıldığı sayfanın korunmasını sağlar
 * 
 * @returns isAuthenticated ve isLoading değerlerini döndürür
 */
const useProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Eğer kimlik doğrulama işlemi tamamlandıysa ve kullanıcı giriş yapmamışsa
        if (!isLoading && !isAuthenticated) {
            // Kullanıcıyı giriş sayfasına yönlendir ve mevcut sayfaya dönebilmesi için state'i sakla
            navigate('/giris', { state: { from: location }, replace: true });
        }
    }, [isAuthenticated, isLoading, navigate, location]);

    return { isAuthenticated, isLoading };
};

export default useProtectedRoute; 