import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-600 flex flex-col justify-center items-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="p-6">
                    <div className="text-center">
                        <Link to="/" className="inline-block mb-6">
                            <h1 className="text-2xl font-bold text-indigo-600">Etkinlik Yönetimi</h1>
                            <p className="text-gray-500 text-sm mt-1">Etkinliklerinizi yönetin, arkadaşlarınızla buluşun</p>
                        </Link>
                    </div>

                    <div className="my-6">
                        <Outlet />
                    </div>
                </div>
            </div>

            <div className="mt-6 text-center text-sm text-white">
                <p>&copy; {new Date().getFullYear()} Etkinlik Yönetimi. Tüm hakları saklıdır.</p>
            </div>
        </div>
    );
} 