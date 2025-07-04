import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Card from '../common/Card';

interface LoginFormProps {
    onSubmit: (email: string, password: string, rememberMe: boolean) => Promise<void>;
    isLoading: boolean;
    error?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Form validasyon durumları
    const [touched, setTouched] = useState({
        email: false,
        password: false
    });

    // Form hataları
    const [formErrors, setFormErrors] = useState({
        email: '',
        password: ''
    });

    // Validasyon fonksiyonları
    const validateField = useCallback((name: string, value: string) => {
        let error = '';

        switch (name) {
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
        }

        return error;
    }, []);

    // Form gönderme
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Tüm alanları dokunulmuş olarak işaretle
        setTouched({
            email: true,
            password: true
        });

        // Tüm alanları validate et
        const emailError = validateField('email', email);
        const passwordError = validateField('password', password);

        setFormErrors({
            email: emailError,
            password: passwordError
        });

        // Hata varsa form gönderimini durdur
        if (emailError || passwordError) {
            return;
        }

        await onSubmit(email, password, rememberMe);
    };

    // Input dokunma olayları
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

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                        E-posta Adresi
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <EnvelopeIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                        Şifre
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <LockClosedIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="form-checkbox h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700">
                            Beni hatırla
                        </label>
                    </div>

                    <div className="text-sm">
                        <Link to="/sifremi-unuttum" className="font-medium text-primary hover:text-primary-dark">
                            Şifrenizi mi unuttunuz?
                        </Link>
                    </div>
                </div>

                <div>
                    <Button type="submit" variant="primary" isLoading={isLoading} className="w-full justify-center py-3">
                        Giriş Yap
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default LoginForm; 