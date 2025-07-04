import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    UserGroupIcon,
    PlusIcon,
    FunnelIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import roomService from '../../services/roomService';
import type { RoomItem } from '../../services/roomService';

const Rooms: React.FC = () => {
    const [rooms, setRooms] = useState<RoomItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, public, private, mine, member

    useEffect(() => {
        const fetchRooms = async () => {
            setIsLoading(true);
            try {
                const fetchedRooms = await roomService.getRooms(filter);
                setRooms(fetchedRooms);
            } catch (error) {
                console.error('Odalar yüklenirken hata oluştu:', error);
                setRooms([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRooms();
    }, [filter]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Odalar</h1>
                <Link
                    to="/odalar/yeni"
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Oda Oluştur
                </Link>
            </div>

            {/* Filtreler */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                    <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-700">Filtrele:</span>
                    <div className="ml-4 space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 text-sm rounded-full ${filter === 'all'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setFilter('public')}
                            className={`px-3 py-1 text-sm rounded-full ${filter === 'public'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Herkese Açık
                        </button>
                        <button
                            onClick={() => setFilter('private')}
                            className={`px-3 py-1 text-sm rounded-full ${filter === 'private'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Özel
                        </button>
                        <button
                            onClick={() => setFilter('mine')}
                            className={`px-3 py-1 text-sm rounded-full ${filter === 'mine'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Oluşturduklarım
                        </button>
                        <button
                            onClick={() => setFilter('member')}
                            className={`px-3 py-1 text-sm rounded-full ${filter === 'member'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Üye Olduklarım
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : rooms.length === 0 ? (
                <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-600">Bu filtrelere uygun oda bulunmamaktadır.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => (
                        <div
                            key={room.id}
                            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className={`h-2 ${room.isPublic ? 'bg-green-500' : 'bg-indigo-600'}`}></div>
                            <div className="p-5">
                                <div className="flex justify-between items-start">
                                    <Link to={`/odalar/${room.id}`}>
                                        <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">{room.name}</h3>
                                    </Link>
                                    {room.isMember && (
                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                            Üye
                                        </span>
                                    )}
                                </div>

                                <p className="text-gray-600 text-sm mt-2 mb-4 line-clamp-2">{room.description}</p>

                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center text-gray-500 text-sm">
                                        <UserGroupIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                                        <span>{room.memberCount || 0} üye</span>
                                    </div>

                                    <div className="flex items-center text-gray-500 text-sm">
                                        <CalendarIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                                        <span>{room.eventCount || 0} etkinlik</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs text-gray-500">{room.creatorName || 'Bilinmeyen'} tarafından</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${room.isPublic
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-indigo-50 text-indigo-700'
                                        }`}>
                                        {room.isPublic ? 'Herkese Açık' : 'Özel'}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    {room.isMember ? (
                                        <Link
                                            to={`/odalar/${room.id}`}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Odaya Git
                                        </Link>
                                    ) : (
                                        <Link
                                            to={`/odalar/${room.id}`}
                                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Odayı İncele
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Rooms; 