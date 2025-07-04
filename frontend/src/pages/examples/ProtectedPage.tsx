import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProtectedRoute } from '../../hooks';

/**
 * Korumalı bir sayfa örneği
 * Bu sayfa sadece giriş yapmış kullanıcılar tarafından görüntülenebilir
 */
const ProtectedPage: React.FC = () => {
    // Hook'u kullanarak sayfayı koruma
    useProtectedRoute();

    // veya ProtectedRoute bileşeni ile App.tsx içinde tanımla

    const { user } = useAuth();

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Korumalı Sayfa</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <p className="mb-4">Bu içerik sadece giriş yapmış kullanıcılar için görüntülenir.</p>

                {user && (
                    <div className="bg-blue-50 p-4 rounded-md">
                        <h2 className="text-lg font-semibold mb-2">Kullanıcı Bilgileri:</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Kullanıcı Adı: {user.username}</li>
                            <li>İsim: {user.firstName} {user.lastName}</li>
                            <li>E-posta: {user.email}</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProtectedPage; 