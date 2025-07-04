import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-neutral-800 text-neutral-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Etkinlik Yönetimi</h3>
                        <p className="text-sm">
                            Etkinliklerinizi kolayca yönetin, arkadaşlarınızla buluşun ve yeni insanlarla tanışın.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Bağlantılar</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link to="/" className="hover:text-primary-light transition-colors">Ana Sayfa</Link>
                            </li>
                            <li>
                                <Link to="/etkinlikler" className="hover:text-primary-light transition-colors">Etkinlikler</Link>
                            </li>
                            <li>
                                <Link to="/odalar" className="hover:text-primary-light transition-colors">Odalar</Link>
                            </li>
                            <li>
                                <Link to="/oneriler" className="hover:text-primary-light transition-colors">Öneriler</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">İletişim</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href="mailto:mehmettalha.bektas@gmail.com" className="hover:text-primary-light transition-colors">
                                    mehmettalha.bektas@gmail.com
                                </a>
                            </li>
                            <li>
                                <a href="tel:+902121234567" className="hover:text-primary-light transition-colors">
                                    +90 553 718 58 61
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-neutral-700 pt-8 text-center text-neutral-500 text-xs">
                    <p>&copy; {new Date().getFullYear()} Etkinlik Yönetimi. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 