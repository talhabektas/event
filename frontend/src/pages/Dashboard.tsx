import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Dashboard sayfası
 * Home bileşeninin korumalı versiyonu olarak çalışır
 * Sadece giriş yapmış kullanıcılar erişebilir
 */
const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <div>Kullanıcı bilgileri yükleniyor...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h1 className="text-3xl font-bold text-indigo-700 mb-4">
                    Merhaba, {user.first_name || user.username}! 👋
                </h1>
                <p className="text-gray-600">
                    Etkinlik akışınızda neler olduğunu ve sizin için önerilerimizi görebilirsiniz.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Etkinlik Akışı</h2>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-500">Henüz etkinlik akışınızda gösterilecek bir etkinlik bulunmuyor.</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Önerileri</h2>
                    <div className="relative">
                        <span className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Kişiselleştirilmiş
                        </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center mt-2">
                        <p className="text-gray-500">Henüz AI önerisi oluşturulmadı. İlgi alanlarınızı güncelleyerek öneriler alabilirsiniz.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Etkinlikleri Keşfet</h2>
                    <p className="text-gray-600 mb-4">Yeni ve popüler etkinlikleri görüntüle</p>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md w-full">
                        Etkinlikleri Gör
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Arkadaşlar</h2>
                    <p className="text-gray-600 mb-4">Arkadaşlarını görüntüle ve yeni bağlantılar kur</p>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md w-full">
                        Arkadaşları Gör
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Profilim</h2>
                    <p className="text-gray-600 mb-4">Profil ayarlarını güncelle</p>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md w-full">
                        Profili Düzenle
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 