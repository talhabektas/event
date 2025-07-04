import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { eventService } from '../../services';
import { XMarkIcon, PhotoIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useProtectedRoute } from '../../hooks';

interface CreateEventFormData {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    maxAttendees: number;
    eventType: string;
    imageUrl?: string;
    roomId?: string;
    isPrivate: boolean;
}

const CreateEvent: React.FC = () => {
    // Sayfa için koruma sağla
    useProtectedRoute();

    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addNotification } = useApp();

    const [formData, setFormData] = useState<CreateEventFormData>({
        title: '',
        description: '',
        location: '',
        startDate: new Date(),
        endDate: new Date(new Date().setHours(new Date().getHours() + 2)),
        maxAttendees: 0,
        eventType: 'social',
        imageUrl: '',
        roomId: '',
        isPrivate: false,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CreateEventFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form alanlarını güncelleme
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Alanı değiştirdiğimizde ilgili hata mesajını temizle
        if (errors[name as keyof CreateEventFormData]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Tarih/saat alanlarını güncelleme
    const handleDateChange = (name: 'startDate' | 'endDate', value: string) => {
        try {
            const date = new Date(value);
            setFormData(prev => ({ ...prev, [name]: date }));

            // Tarih alanı için hata varsa temizle
            if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        } catch (error) {
            console.error('Tarih formatı geçersiz:', error);
        }
    };

    // Form doğrulama
    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof CreateEventFormData, string>> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Etkinlik başlığı gereklidir';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Etkinlik açıklaması gereklidir';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Etkinlik konumu gereklidir';
        }

        if (formData.startDate >= formData.endDate) {
            newErrors.endDate = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Formu gönderme
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // eventService.createEvent'in beklediği CreateEventFormData (eventService.ts'deki import'a göre)
            // roomId: number | undefined ve isPrivate: boolean | undefined bekliyor olabilir.
            // Bizim CreateEvent.tsx'deki CreateEventFormData'mız roomId: string, isPrivate: boolean şeklinde.
            // Bu yüzden bir dönüşüm yapmamız gerekiyor.
            const payload: any = { // services.CreateEventFormData'ya (modal'daki) uygun hale getir
                ...formData,
                roomId: formData.roomId ? parseInt(formData.roomId, 10) : undefined,
                // startDate ve endDate Date objesi olarak kalmalı, eventService içinde ISO string'e çevriliyor.
                // isPrivate zaten boolean.
            };

            // CreateEventModal'daki CreateEventFormData'da olmayan alanları çıkaralım (location, maxAttendees, eventType)
            // Backend DTO'sunda bu alanlar yok.
            delete payload.location;
            delete payload.maxAttendees;
            delete payload.eventType;


            console.log("Etkinlik oluşturma verileri (servise gönderilecek):", payload);
            console.log("Son payload (isPrivate kontrolü):", payload.isPrivate, typeof payload.isPrivate);

            // Etkinliği oluştur
            const createdEvent = await eventService.createEvent(payload);
            console.log("Oluşturulan etkinlik:", createdEvent);

            // Başarılı bildirim ekle
            addNotification({
                type: 'success',
                message: 'Etkinlik başarıyla oluşturuldu',
                duration: 3000
            });

            // Başarılı olursa, etkinlikler sayfasına yönlendir
            navigate('/etkinlikler');
        } catch (error) {
            console.error("Etkinlik oluşturulurken hata oluştu:", error);

            // Hata bildirim ekle
            addNotification({
                type: 'error',
                message: 'Etkinlik oluşturulurken bir hata oluştu',
                duration: 5000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Formatlanmış tarih-saat değerlerini almak için yardımcı fonksiyon
    const getDateTimeString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            <div className="mb-6 flex items-center">
                <button
                    onClick={() => navigate('/etkinlikler')}
                    className="mr-4 text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Yeni Etkinlik Oluştur</h1>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Image URL Input */}
                    <div className="mb-4">
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                            Kapak Resmi URL'si (Opsiyonel)
                        </label>
                        <input
                            type="url"
                            name="imageUrl"
                            id="imageUrl"
                            value={formData.imageUrl || ''}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.imageUrl ? 'border-red-300' : ''}`}
                            placeholder="https://ornek.com/resim.jpg"
                        />
                        {errors.imageUrl && <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>}
                    </div>

                    {/* Etkinlik Başlığı */}
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Etkinlik Başlığı*
                        </label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.title ? 'border-red-300' : ''}`}
                            placeholder="Etkinlik başlığını girin"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    </div>

                    {/* Etkinlik Açıklaması */}
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Etkinlik Açıklaması*
                        </label>
                        <textarea
                            name="description"
                            id="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.description ? 'border-red-300' : ''}`}
                            placeholder="Etkinlik detaylarını açıklayın"
                        ></textarea>
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    </div>

                    {/* Oda ID'si (Opsiyonel) */}
                    <div className="mb-4">
                        <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
                            Oda ID'si (Opsiyonel)
                        </label>
                        <input
                            type="number"
                            name="roomId"
                            id="roomId"
                            value={formData.roomId}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.roomId ? 'border-red-300' : ''}`}
                            placeholder="Etkinliği bir odaya bağlamak için ID girin"
                        />
                        {errors.roomId && <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>}
                    </div>

                    {/* Gizli Etkinlik Checkbox */}
                    <div className="mb-4">
                        <div className="flex items-center">
                            <input
                                id="isPrivate"
                                name="isPrivate"
                                type="checkbox"
                                checked={formData.isPrivate}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
                                Bu özel bir etkinliktir (Sadece davetliler görebilir)
                            </label>
                        </div>
                    </div>

                    {/* Konum */}
                    <div className="mb-4">
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                            Konum*
                        </label>
                        <input
                            type="text"
                            name="location"
                            id="location"
                            value={formData.location}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.location ? 'border-red-300' : ''}`}
                            placeholder="Etkinlik konumunu girin"
                        />
                        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                    </div>

                    {/* Tarih/Saat Seçimi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                                Başlangıç Tarihi ve Saati*
                            </label>
                            <input
                                type="datetime-local"
                                name="startDate"
                                id="startDate"
                                value={getDateTimeString(formData.startDate)}
                                onChange={(e) => handleDateChange('startDate', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                                Bitiş Tarihi ve Saati*
                            </label>
                            <input
                                type="datetime-local"
                                name="endDate"
                                id="endDate"
                                value={getDateTimeString(formData.endDate)}
                                onChange={(e) => handleDateChange('endDate', e.target.value)}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.endDate ? 'border-red-300' : ''}`}
                            />
                            {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {/* Etkinlik Türü */}
                        <div>
                            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">
                                Etkinlik Türü
                            </label>
                            <select
                                name="eventType"
                                id="eventType"
                                value={formData.eventType}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="social">Sosyal</option>
                                <option value="business">İş/Networking</option>
                                <option value="education">Eğitim</option>
                                <option value="culture">Kültür/Sanat</option>
                                <option value="sports">Spor</option>
                                <option value="other">Diğer</option>
                            </select>
                        </div>

                        {/* Katılımcı Sayısı */}
                        <div>
                            <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700">
                                Maksimum Katılımcı Sayısı
                            </label>
                            <input
                                type="number"
                                name="maxAttendees"
                                id="maxAttendees"
                                value={formData.maxAttendees}
                                onChange={handleChange}
                                min="0"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="0 = sınırsız"
                            />
                            <p className="mt-1 text-xs text-gray-500">0 = sınırsız katılımcı</p>
                        </div>
                    </div>

                    {/* Form Gönderme Butonları */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => navigate('/etkinlikler')}
                            disabled={isSubmitting}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Oluşturuluyor...' : 'Etkinlik Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEvent; 