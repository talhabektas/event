import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-[70vh] flex flex-col justify-center items-center">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-indigo-600">404</h1>
                <h2 className="text-2xl font-semibold text-gray-800 mt-4">Sayfa Bulunamadı</h2>
                <p className="text-gray-600 mt-2">Aradığınız sayfa bulunamadı veya taşınmış olabilir.</p>
                <Link
                    to="/"
                    className="mt-6 inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    );
};

export default NotFound; 