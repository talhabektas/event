import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    UserIcon,
    Bars3Icon,
    XMarkIcon,
    BellIcon,
    ChatBubbleLeftEllipsisIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import type { User } from '../../services/authService';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
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

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out transform hover:scale-105 ${isActive
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 shadow-lg'
            : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-dark-700/50'
        }`;

    const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${isActive
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
            : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-dark-700/50'
        }`;

    return (
        <nav className="navbar-glass sticky top-0 z-50 backdrop-blur-xl border-b border-neutral-200/50 dark:border-dark-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo and main navigation */}
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center group">
                            <div className="relative">
                                <SparklesIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-primary-600 dark:bg-primary-400 opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300" />
                            </div>
                            <span className="ml-3 text-xl font-bold gradient-text group-hover:scale-105 transition-transform duration-300">
                                Etkinlik Hub
                            </span>
                        </Link>

                        {/* Desktop navigation */}
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                            <NavLink to="/" className={navLinkClass}>
                                Ana Sayfa
                            </NavLink>
                            <NavLink to="/etkinlikler" className={navLinkClass}>
                                Etkinlikler
                            </NavLink>
                            <NavLink to="/odalar" className={navLinkClass}>
                                Odalar
                            </NavLink>
                            {user && (
                                <>
                                    <NavLink to="/oneriler" className={navLinkClass}>
                                        <div className="flex items-center space-x-1">
                                            <span>Öneriler</span>
                                            {suggestionCount > 0 && (
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-accent-500 to-accent-600 rounded-full shadow-lg animate-pulse">
                                                    {suggestionCount}
                                                </span>
                                            )}
                                        </div>
                                    </NavLink>
                                    <NavLink to="/arkadaslar" className={navLinkClass}>
                                        Arkadaşlar
                                    </NavLink>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                        {/* Theme toggle */}
                        <ThemeToggle size="sm" />

                        {user ? (
                            <>
                                {/* Notifications */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsNotificationMenuOpen(!isNotificationMenuOpen);
                                            setIsProfileMenuOpen(false);
                                            setIsConversationsMenuOpen(false);
                                        }}
                                        className="relative p-2.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-dark-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                                    >
                                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                                        {unreadNotificationCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs items-center justify-center font-bold">
                                                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                                </span>
                                            </span>
                                        )}
                                    </button>
                                    {isNotificationMenuOpen && <NotificationDropdown />}
                                </div>

                                {/* Messages */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setIsConversationsMenuOpen(!isConversationsMenuOpen);
                                            setIsProfileMenuOpen(false);
                                            setIsNotificationMenuOpen(false);
                                        }}
                                        className="relative p-2.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-dark-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                                    >
                                        <ChatBubbleLeftEllipsisIcon className="h-6 w-6" aria-hidden="true" />
                                        {unreadMessagesCount > 0 && (
                                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-full min-w-[1.25rem] h-5 shadow-lg">
                                                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                                            </span>
                                        )}
                                    </button>
                                    {isConversationsMenuOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl bg-white/95 dark:bg-dark-800/95 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-20 border border-neutral-200/50 dark:border-dark-700/50">
                                            <div className="px-4 py-3 border-b border-neutral-200/50 dark:border-dark-700/50 bg-gradient-to-r from-neutral-50/50 to-transparent dark:from-dark-700/50">
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Sohbetler</p>
                                            </div>
                                            <ConversationsList onClose={() => setIsConversationsMenuOpen(false)} />
                                            <div className="px-4 py-3 border-t border-neutral-200/50 dark:border-dark-700/50">
                                                <Link
                                                    to="/odalar"
                                                    onClick={() => setIsConversationsMenuOpen(false)}
                                                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
                                                >
                                                    Tüm odaları gör →
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Profile dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setIsProfileMenuOpen(!isProfileMenuOpen);
                                            setIsConversationsMenuOpen(false);
                                            setIsNotificationMenuOpen(false);
                                        }}
                                        className="flex items-center text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-neutral-100 dark:hover:bg-dark-700/50 p-2 transition-all duration-200"
                                    >
                                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
                                            <UserIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="ml-2 text-neutral-700 dark:text-neutral-200 font-medium hidden md:block">
                                            {user.first_name}
                                        </span>
                                    </button>

                                    {isProfileMenuOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl py-1 bg-white/95 dark:bg-dark-800/95 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-20 border border-neutral-200/50 dark:border-dark-700/50">
                                            <div className="px-4 py-3 border-b border-neutral-200/50 dark:border-dark-700/50">
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">Giriş yapıldı:</p>
                                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{user.email}</p>
                                            </div>
                                            <NavLink
                                                to="/profil"
                                                className={({ isActive }) => `block px-4 py-3 text-sm transition-colors duration-200 ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-700/50 hover:text-primary-600 dark:hover:text-primary-400'}`}
                                                onClick={() => setIsProfileMenuOpen(false)}
                                            >
                                                Profilim
                                            </NavLink>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-700/50 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                                            >
                                                Çıkış Yap
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Button variant="ghost" size="medium" onClick={() => navigate('/giris')}>
                                    Giriş Yap
                                </Button>
                                <Button variant="gradient" size="medium" onClick={() => navigate('/kayit')}>
                                    Kayıt Ol
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center space-x-2 sm:hidden">
                        <ThemeToggle size="sm" />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-dark-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
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

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="sm:hidden border-t border-neutral-200/50 dark:border-dark-700/50 bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        <NavLink to="/" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>
                            Ana Sayfa
                        </NavLink>
                        <NavLink to="/etkinlikler" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>
                            Etkinlikler
                        </NavLink>
                        <NavLink to="/odalar" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>
                            Odalar
                        </NavLink>
                        {user && (
                            <>
                                <NavLink to="/oneriler" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>
                                    <div className="flex items-center space-x-2">
                                        <span>Öneriler</span>
                                        {suggestionCount > 0 && (
                                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-accent-500 to-accent-600 rounded-full">
                                                {suggestionCount}
                                            </span>
                                        )}
                                    </div>
                                </NavLink>
                                <NavLink to="/arkadaslar" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>
                                    Arkadaşlar
                                </NavLink>
                                <NavLink to="/profil" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>
                                    Profil
                                </NavLink>
                            </>
                        )}

                        {/* Mobile auth section */}
                        {!user && (
                            <div className="pt-4 space-y-2">
                                <Button
                                    variant="ghost"
                                    size="medium"
                                    className="w-full"
                                    onClick={() => {
                                        navigate('/giris');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    Giriş Yap
                                </Button>
                                <Button
                                    variant="gradient"
                                    size="medium"
                                    className="w-full"
                                    onClick={() => {
                                        navigate('/kayit');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    Kayıt Ol
                                </Button>
                            </div>
                        )}

                        {user && (
                            <div className="pt-4 border-t border-neutral-200/50 dark:border-dark-700/50">
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar; 