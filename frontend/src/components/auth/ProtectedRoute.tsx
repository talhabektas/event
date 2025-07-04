import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom'; // Route importunu kaldırın, burada gerek yok
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
// MainLayout ve ChatPage importları burada olmamalı, kaldırın
// import MainLayout from '../../layouts/MainLayout'; 
// import ChatPage from '../../pages/chat/ChatPage';

/**
 * Korumalı rota bileşeni
 * Sadece kimlik doğrulaması yapılmış kullanıcılar için erişim sağlar
 * Kimlik doğrulaması yapılmamış kullanıcıları giriş sayfasına yönlendirir
 */
const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // ----- SADECE BU SATIRI EKLEYİN -----
    console.log('[ProtectedRoute] Render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'Path:', location.pathname);
    // ------------------------------------

    // isLoading veya isAuthenticated değiştiğinde logla
    useEffect(() => {
        console.log('[ProtectedRoute] useEffect - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'Path:', location.pathname);
    }, [isLoading, isAuthenticated, location.pathname]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" color="primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/giris" state={{ from: location.pathname }} />;
    }

    console.log('[ProtectedRoute] ALL CHECKS PASSED, RENDERING OUTLET for path:', location.pathname);
    return <Outlet />; // Kullanıcı giriş yapmışsa çocuk rotayı (örn: ChatPage) render et
};

export default ProtectedRoute;