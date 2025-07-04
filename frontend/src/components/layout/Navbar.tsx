import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    UserIcon,
    Bars3Icon,
    XMarkIcon,
    BellIcon,
    ChatBubbleLeftEllipsisIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import type { User } from '../../services/authService';
import Button from '../common/Button';
import ConversationsList from '../chat/ConversationsList';
import { useApp } from '../../contexts/AppContext';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
    user: User | null;
    onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const { suggestionCount, unreadNotificationCount, unreadMessagesCount } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isConversationsMenuOpen, setIsConversationsMenuOpen] = useState(false);
    const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);

    const handleLogout = () => {
        onLogout();
        setIsProfileMenuOpen(false);
        navigate('/');
    };

    return (
        <nav className="bg-bg-surface shadow-md border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-primary text-xl font-bold">Etkinlik Yönetimi</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-600 hover:text-primary hover:bg-neutral-100'}`
                                }
                            >
                                Ana Sayfa
                            </NavLink>
                            <NavLink
                                to="/etkinlikler"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-600 hover:text-primary hover:bg-neutral-100'}`
                                }
                            >
                                Etkinlikler
                            </NavLink>
                            <NavLink
                                to="/odalar"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-600 hover:text-primary hover:bg-neutral-100'}`
                                }
                            >
                                Odalar
                            </NavLink>
                            <NavLink
                                to="/oneriler"
                                className={({ isActive }) =>
                                    `relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-600 hover:text-primary hover:bg-neutral-100'}`
                                }
                            >
                                Öneriler
                                {suggestionCount > 0 && (
                                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                        {suggestionCount}
                                    </span>
                                )}
                            </NavLink>
                            <NavLink
                                to="/arkadaslar"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-600 hover:text-primary hover:bg-neutral-100'}`
                                }
                            >
                                Arkadaşlar
                            </NavLink>
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {user ? (
                            <div className="ml-3 relative flex items-center space-x-4">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsNotificationMenuOpen(!isNotificationMenuOpen);
                                            setIsProfileMenuOpen(false);
                                        }}
                                        className="relative p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <span className="sr-only">View notifications</span>
                                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                                        {unreadNotificationCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </span>
                                        )}
                                    </button>
                                    {isNotificationMenuOpen && <NotificationDropdown />}
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsConversationsMenuOpen(prev => !prev)}
                                        className="relative p-1 rounded-full text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        <span className="sr-only">View conversations</span>
                                        <ChatBubbleLeftEllipsisIcon className="h-6 w-6" aria-hidden="true" />
                                        {unreadMessagesCount > 0 && (
                                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[1.25rem] h-5">
                                                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                                            </span>
                                        )}
                                    </button>
                                    {isConversationsMenuOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                                            <div className="px-4 py-3 border-b">
                                                <p className="text-sm font-medium text-gray-900">Sohbetler</p>
                                            </div>
                                            <ConversationsList onClose={() => setIsConversationsMenuOpen(false)} />
                                            <div className="px-4 py-2 border-t">
                                                <Link to="/odalar" onClick={() => setIsConversationsMenuOpen(false)} className="text-sm font-medium text-blue-600 hover:text-blue-800">Tüm odaları gör</Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <button
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center">
                                            <UserIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <span className="ml-2 text-neutral-700 font-medium hidden md:block">{user.first_name}</span>
                                    </button>
                                </div>
                                {isProfileMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-bg-surface ring-1 ring-neutral-200 focus:outline-none z-20">
                                        <div className="px-4 py-3">
                                            <p className="text-sm text-neutral-700">Giriş yapıldı:</p>
                                            <p className="text-sm font-medium text-neutral-900 truncate">{user.email}</p>
                                        </div>
                                        <NavLink to="/profil" className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-neutral-100 text-primary' : 'text-neutral-700'} hover:bg-neutral-100 hover:text-primary`} onClick={() => setIsProfileMenuOpen(false)}>
                                            Profilim
                                        </NavLink>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-primary"
                                        >
                                            Çıkış Yap
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="medium" onClick={() => navigate('/giris')}>
                                    Giriş Yap
                                </Button>
                                <Button variant="primary" size="medium" onClick={() => navigate('/kayit')}>
                                    Kayıt Ol
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-primary hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                        >
                            <span className="sr-only">Ana menüyü aç</span>
                            {isMenuOpen ? (
                                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobil menü */}
            {isMenuOpen && (
                <div className="sm:hidden border-t border-neutral-200 bg-bg-surface shadow-md">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <NavLink to="/" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-700 hover:text-primary hover:bg-neutral-100'}`} onClick={() => setIsMenuOpen(false)}>
                            Ana Sayfa
                        </NavLink>
                        <NavLink to="/etkinlikler" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-700 hover:text-primary hover:bg-neutral-100'}`} onClick={() => setIsMenuOpen(false)}>
                            Etkinlikler
                        </NavLink>
                        <NavLink to="/odalar" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-700 hover:text-primary hover:bg-neutral-100'}`} onClick={() => setIsMenuOpen(false)}>
                            Odalar
                        </NavLink>
                        <NavLink to="/oneriler" className={({ isActive }) => `relative block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-700 hover:text-primary hover:bg-neutral-100'}`} onClick={() => setIsMenuOpen(false)}>
                            Öneriler
                            {suggestionCount > 0 && (
                                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                    {suggestionCount}
                                </span>
                            )}
                        </NavLink>
                        <NavLink to="/arkadaslar" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-700 hover:text-primary hover:bg-neutral-100'}`} onClick={() => setIsMenuOpen(false)}>
                            Arkadaşlar
                        </NavLink>
                    </div>
                    <div className="pt-4 pb-3 border-t border-neutral-300">
                        {user ? (
                            <>
                                <div className="flex items-center px-5 mb-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
                                            <UserIcon className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-neutral-800">{user.first_name} {user.last_name}</div>
                                        <div className="text-sm font-medium text-neutral-500">{user.email}</div>
                                    </div>
                                </div>
                                <div className="px-2 space-y-1">
                                    <NavLink to="/profil" className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-primary bg-primary-light' : 'text-neutral-700 hover:text-primary hover:bg-neutral-100'}`} onClick={() => setIsMenuOpen(false)}>
                                        Profilim
                                    </NavLink>
                                    <button
                                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary hover:bg-neutral-100"
                                    >
                                        Çıkış Yap
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="px-5 py-2 space-y-3">
                                <Button variant="ghost" size="medium" className="w-full" onClick={() => { navigate('/giris'); setIsMenuOpen(false); }}>
                                    Giriş Yap
                                </Button>
                                <Button variant="primary" size="medium" className="w-full" onClick={() => { navigate('/kayit'); setIsMenuOpen(false); }}>
                                    Kayıt Ol
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar; 