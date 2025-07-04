import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

/**
 * Korumalı rotalar için hook.
 * Kullanıcı oturum açmamışsa giriş sayfasına yönlendirir.
 */
const useProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { addNotification } = useApp();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            addNotification({
                type: 'warning',
                message: 'Bu sayfayı görüntülemek için giriş yapmalısınız.',
                duration: 5000
            });
            navigate('/giris', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate, addNotification]);

    return { isLoading, isAuthenticated };
};

export default useProtectedRoute; 