import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    EnvelopeIcon,
    LockClosedIcon,
    UserIcon,
    ExclamationCircleIcon,
    IdentificationIcon
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Card from '../common/Card';

interface RegisterFormProps {
    onSubmit: (userData: RegisterData) => Promise<void>;
    isLoading: boolean;
    error?: string | null;
}

export interface RegisterData {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading, error }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Form validasyon durumları
    const [touched, setTouched] = useState({
        firstName: false,
        lastName: false,
        username: false,
        email: false,
        password: false,
        confirmPassword: false
    });

    // Form hataları
    const [formErrors, setFormErrors] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Validasyon fonksiyonları
    const validateField = useCallback((name: string, value: string) => {
        let error = '';

        switch (name) {
            case 'firstName':
            case 'lastName':
                if (value.length < 2) {
                    error = `${name === 'firstName' ? 'İsim' : 'Soyisim'} en az 2 karakter olmalıdır`;
                }
                break;
            case 'username':
                if (value.length < 3) {
                    error = 'Kullanıcı adı en az 3 karakter olmalıdır';
                }
                break;
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'Geçerli bir e-posta adresi giriniz';
                }
                break;
            case 'password':
                if (value.length < 6) {
                    error = 'Şifre en az 6 karakter olmalıdır';
                }
                break;
            case 'confirmPassword':
                if (value !== formData.password) {
                    error = 'Şifreler eşleşmiyor';
                }
                break;
        }

        return error;
    }, [formData.password]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Dokunulmuş olarak işaretle
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        // Alan dokunulmuşsa validate et
        if (touched[name as keyof typeof touched]) {
            const error = validateField(name, value);
            setFormErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    // Form gönderme
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Tüm alanları dokunulmuş olarak işaretle
        const allTouched = Object.keys(touched).reduce((acc, key) => {
            return { ...acc, [key]: true };
        }, {} as typeof touched);

        setTouched(allTouched);

        // Tüm alanları validate et
        const errors: Record<string, string> = {};
        let hasError = false;

        Object.entries(formData).forEach(([key, value]) => {
            const error = validateField(key, value as string);
            errors[key] = error;
            if (error) hasError = true;
        });

        setFormErrors(errors as typeof formErrors);

        // Hata varsa form gönderimini durdur
        if (hasError) return;

        // Form gönderimi
        await onSubmit({
            first_name: formData.firstName,
            last_name: formData.lastName,
            username: formData.username,
            email: formData.email,
            password: formData.password
        });
    };

    return (
        <Card className="shadow-2xl">
            <form className="space-y-6 p-2 sm:p-4" onSubmit={handleSubmit}>
                {error && (
                    <div className="rounded-md bg-status-error/10 p-4 border-l-4 border-status-error">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-status-error" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-status-error">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    {/* İsim */}
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-1">
                            İsim
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <IdentificationIcon className="h-5 w-5 text-neutral-400" />
                            </div>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                autoComplete="given-name"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-input block w-full rounded-lg pl-10 py-2.5 sm:text-sm ${formErrors.firstName
                                    ? 'border-status-error text-status-error placeholder-status-error/70 focus:border-status-error focus:ring-status-error'
                                    : 'border-neutral-300 focus:border-primary focus:ring-primary'
                                    }`}
                                placeholder="Adınız"
                            />
                            {formErrors.firstName && (
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <ExclamationCircleIcon className="h-5 w-5 text-status-error" aria-hidden="true" />
                                </div>
                            )}
                        </div>
                        {formErrors.firstName && (
                            <p className="mt-2 text-sm text-status-error" id="firstName-error">
                                {formErrors.firstName}
                            </p>
                        )}
                    </div>

                    {/* Soyisim */}
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-1">
                            Soyisim
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <IdentificationIcon className="h-5 w-5 text-neutral-400" />
                            </div>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                autoComplete="family-name"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-input block w-full rounded-lg pl-10 py-2.5 sm:text-sm ${formErrors.lastName
                                    ? 'border-status-error text-status-error placeholder-status-error/70 focus:border-status-error focus:ring-status-error'
                                    : 'border-neutral-300 focus:border-primary focus:ring-primary'
                                    }`}
                                placeholder="Soyadınız"
                            />
                            {formErrors.lastName && (
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <ExclamationCircleIcon className="h-5 w-5 text-status-error" aria-hidden="true" />
                                </div>
                            )}
                        </div>
                        {formErrors.lastName && (
                            <p className="mt-2 text-sm text-status-error" id="lastName-error">
                                {formErrors.lastName}
                            </p>
                        )}
                    </div>
                </div>

                {/* Kullanıcı Adı */}
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-1">
                        Kullanıcı Adı
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserIcon className="h-5 w-5 text-neutral-400" />
                        </div>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`form-input block w-full rounded-lg pl-10 py-2.5 sm:text-sm ${formErrors.username
                                ? 'border-status-error text-status-error placeholder-status-error/70 focus:border-status-error focus:ring-status-error'
                                : 'border-neutral-300 focus:border-primary focus:ring-primary'
                                }`}
                            placeholder="kullanici_adiniz"
                        />
                        {formErrors.username && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <ExclamationCircleIcon className="h-5 w-5 text-status-error" aria-hidden="true" />
                            </div>
                        )}
                    </div>
                    {formErrors.username && (
                        <p className="mt-2 text-sm text-status-error" id="username-error">
                            {formErrors.username}
                        </p>
                    )}
                </div>

                {/* E-posta */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                        E-posta Adresi
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <EnvelopeIcon className="h-5 w-5 text-neutral-400" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`form-input block w-full rounded-lg pl-10 py-2.5 sm:text-sm ${formErrors.email
                                ? 'border-status-error text-status-error placeholder-status-error/70 focus:border-status-error focus:ring-status-error'
                                : 'border-neutral-300 focus:border-primary focus:ring-primary'
                                }`}
                            placeholder="ornek@mail.com"
                        />
                        {formErrors.email && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <ExclamationCircleIcon className="h-5 w-5 text-status-error" aria-hidden="true" />
                            </div>
                        )}
                    </div>
                    {formErrors.email && (
                        <p className="mt-2 text-sm text-status-error" id="email-error">
                            {formErrors.email}
                        </p>
                    )}
                </div>

                {/* Şifre */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                        Şifre
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <LockClosedIcon className="h-5 w-5 text-neutral-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`form-input block w-full rounded-lg pl-10 py-2.5 sm:text-sm ${formErrors.password
                                ? 'border-status-error text-status-error placeholder-status-error/70 focus:border-status-error focus:ring-status-error'
                                : 'border-neutral-300 focus:border-primary focus:ring-primary'
                                }`}
                        />
                        {formErrors.password && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <ExclamationCircleIcon className="h-5 w-5 text-status-error" aria-hidden="true" />
                            </div>
                        )}
                    </div>
                    {formErrors.password && (
                        <p className="mt-2 text-sm text-status-error" id="password-error">
                            {formErrors.password}
                        </p>
                    )}
                </div>

                {/* Şifre Tekrar */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                        Şifrenizi Tekrar Girin
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <LockClosedIcon className="h-5 w-5 text-neutral-400" />
                        </div>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`form-input block w-full rounded-lg pl-10 py-2.5 sm:text-sm ${formErrors.confirmPassword
                                ? 'border-status-error text-status-error placeholder-status-error/70 focus:border-status-error focus:ring-status-error'
                                : 'border-neutral-300 focus:border-primary focus:ring-primary'
                                }`}
                        />
                        {formErrors.confirmPassword && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <ExclamationCircleIcon className="h-5 w-5 text-status-error" aria-hidden="true" />
                            </div>
                        )}
                    </div>
                    {formErrors.confirmPassword && (
                        <p className="mt-2 text-sm text-status-error" id="confirmPassword-error">
                            {formErrors.confirmPassword}
                        </p>
                    )}
                </div>

                <div>
                    <Button type="submit" variant="primary" isLoading={isLoading} className="w-full justify-center py-3">
                        Hesap Oluştur
                    </Button>
                </div>

                <div className="text-sm text-center pt-4">
                    <p className="text-neutral-600">
                        Hesap oluşturarak,{' '}
                        <Link to="/kullanim-kosullari" className="font-medium text-primary hover:text-primary-dark">
                            Kullanım Koşulları
                        </Link>
                        {' ve '}
                        <Link to="/gizlilik-politikasi" className="font-medium text-primary hover:text-primary-dark">
                            Gizlilik Politikamızı
                        </Link>
                        {' kabul etmiş olursunuz.'}
                    </p>
                </div>
            </form>
        </Card>
    );
};

export default RegisterForm; 