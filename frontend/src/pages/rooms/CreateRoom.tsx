import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import roomService from '../../services/roomService';

const CreateRoom: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: false
    });
    const [errors, setErrors] = useState<Partial<typeof formData>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checkboxElement = e.target as HTMLInputElement;

        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? checkboxElement.checked : value
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<typeof formData> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Oda adı zorunludur';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Oda adı en az 3 karakter olmalıdır';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Oda açıklaması zorunludur';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await roomService.createRoom({
                name: formData.name,
                description: formData.description,
                isPublic: formData.isPublic,
            });

            // Başarılı olursa, odalar sayfasına yönlendir
            navigate('/odalar');
        } catch (error) {
            console.error('Oda oluşturulurken hata oluştu:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center text-sm mb-6">
                <Link
                    to="/odalar"
                    className="text-gray-500 hover:text-indigo-600 flex items-center"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Odalar Listesine Dön
                </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Yeni Oda Oluştur</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Oda Adı
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                                } shadow-sm sm:text-sm p-2 border`}
                            placeholder="Oda adını girin"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Oda Açıklaması
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                                } shadow-sm sm:text-sm p-2 border`}
                            placeholder="Odanın amacını ve içeriğini açıklayın"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    <div className="flex items-center">
                        <input
                            id="isPublic"
                            name="isPublic"
                            type="checkbox"
                            checked={formData.isPublic}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isPublic" className="ml-2 block text-sm font-medium text-gray-700">
                            Herkese Açık Oda
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Link
                            to="/odalar"
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            İptal
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Oluşturuluyor...' : 'Oda Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoom; 