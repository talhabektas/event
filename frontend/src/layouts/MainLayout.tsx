import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import NotificationContainer from '../components/common/NotificationContainer';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const { addNotification } = useApp();

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar user={user} onLogout={logout} />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
            <NotificationContainer />
        </div>
    );
};

export default MainLayout; 