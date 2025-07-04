import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Etkinlik oluşturma için form veri tipi - Backend'le uyumlu
export interface CreateEventFormData {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    imageUrl?: string;
    roomId?: number;     // Oda ID'si için opsiyonel alan
    isPrivate?: boolean; // Etkinliğin gizli olup olmadığını belirtmek için alan
    form?: string; // Genel form hataları için eklendi
}

// Props tipi
interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: CreateEventFormData) => Promise<void>;
    isLoading: boolean;
    roomId?: string; // Oda ID'si için opsiyonel prop eklendi
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    roomId // Gelen roomId prop'unu al
}) => {
    // Eğer modal açık değilse hiçbir şey render etme
    if (!isOpen) return null;

    const [formData, setFormData] = useState<CreateEventFormData>(() => ({
        title: '',
        description: '',
        location: '',
        startDate: new Date(),
        endDate: new Date(new Date().setHours(new Date().getHours() + 2)), // 2 saat sonrası varsayılan
        isPrivate: false, // Varsayılan olarak public
        roomId: roomId ? parseInt(roomId, 10) : undefined // Gelen roomId varsa parse et, yoksa undefined
    }));

    const [errors, setErrors] = useState<Partial<Record<keyof CreateEventFormData, string>>>({});

    // Form alanlarını güncelleme
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'roomId') {
            const numValue = parseInt(value, 10);
            setFormData(prev => ({ ...prev, roomId: isNaN(numValue) ? undefined : numValue }));
        } else if (name === 'isPrivate') {
            setFormData(prev => ({ ...prev, isPrivate: value === 'true' }));
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

        if (validateForm()) {
            try {
                const formDataToSubmit = {
                    ...formData,
                    startDate: new Date(formData.startDate.toISOString()),
                    endDate: new Date(formData.endDate.toISOString()),
                };

                await onSubmit(formDataToSubmit);
                onClose(); // Modal'ı kapat
            } catch (error) {
                console.error('Etkinlik oluşturulurken hata:', error);
                setErrors(prev => ({ ...prev, form: 'Etkinlik oluşturulamadı. Lütfen tekrar deneyin.' }));
            }
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
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Arka plan overlay */}
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* Modal içeriği */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Yeni Etkinlik Oluştur
                                    </h3>
                                    <button
                                        type="button"
                                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-4">
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
                                            rows={3}
                                            value={formData.description}
                                            onChange={handleChange}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.description ? 'border-red-300' : ''}`}
                                            placeholder="Etkinlik detaylarını açıklayın"
                                        ></textarea>
                                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
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

                                    {/* Oda ID alanı */}
                                    {!roomId && (
                                        <div className="mb-4">
                                            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
                                                Oda ID (Opsiyonel)
                                            </label>
                                            <input
                                                type="number"
                                                name="roomId"
                                                id="roomId"
                                                value={formData.roomId === undefined || isNaN(Number(formData.roomId)) ? '' : formData.roomId.toString()}
                                                onChange={handleChange}
                                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.roomId ? 'border-red-300' : ''}`}
                                                placeholder="Etkinlik bir odaya aitse oda ID'sini girin"
                                            />
                                            {errors.roomId && <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>}
                                        </div>
                                    )}

                                    {/* Gizlilik Ayarı */}
                                    <div className="mb-4">
                                        <label htmlFor="isPrivate" className="block text-sm font-medium text-gray-700">
                                            Etkinlik Gizliliği
                                        </label>
                                        <select
                                            name="isPrivate"
                                            id="isPrivate"
                                            value={formData.isPrivate ? 'true' : 'false'}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            <option value="false">Herkese Açık</option>
                                            <option value="true">Gizli</option>
                                        </select>
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

                                    {/* Resim URL'si */}
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>

                                    {/* Hata mesajı için alan (Form geneli) */}
                                    {errors.form && (
                                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                                            {errors.form}
                                        </div>
                                    )}

                                    {/* Form Gönderme Butonları */}
                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:bg-indigo-300 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Oluşturuluyor...' : 'Etkinlik Oluştur'}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                            onClick={onClose}
                                            disabled={isLoading}
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateEventModal; 