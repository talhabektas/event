import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    UserPlusIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
    EnvelopeIcon,
    CheckIcon,
    XMarkIcon,
    UserIcon,
    ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

// Backend'den gelen User modeliyle eşleşen tip
interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
    email?: string;
}

// Backend Friendship modeli ile uyumlu tip
interface FriendRequest {
    id: number; // Friendship ID
    requester_id: number;
    addressee_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    requester: User; // Preload edilmiş requester
    addressee: User; // Preload edilmiş addressee
}

// Backend FriendSuggestion modeli ile uyumlu tip
interface FriendSuggestion {
    user: User;
    match_score: number;
    common_interests: string[];
}

interface SuggestedUserState extends User {
    requestStatus: 'idle' | 'pending' | 'sent';
}

const Friends: React.FC = () => {
    const [friends, setFriends] = useState<User[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestedUserState[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'suggestions'>('friends');
    const [isLoading, setIsLoading] = useState(true);
    const { user: currentUser } = useAuth();
    const { addNotification } = useApp();

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        console.log('[fetchAllData] Başladı...');
        try {
            // Arkadaş listesi - backend'de doğru endpoint
            console.log('[fetchAllData] Arkadaş listesi isteniyor...');
            const friendsResponse = await apiService.get<User[]>('/api/friendships/');
            console.log('[fetchAllData] Arkadaş listesi alındı:', friendsResponse);
            setFriends(friendsResponse || []);

            // Bekleyen istekler - backend'de doğru endpoint
            console.log('[fetchAllData] Bekleyen istekler isteniyor...');
            const requestsResponse = await apiService.get<FriendRequest[]>('/api/friendships/requests/pending');
            console.log('[fetchAllData] Bekleyen istekler alındı:', requestsResponse);
            setRequests(requestsResponse || []);

            // Arkadaş önerileri - backend'de doğru endpoint
            console.log('[fetchAllData] Öneriler isteniyor...');
            const suggestionsResponse = await apiService.get<FriendSuggestion[]>('/api/friendships/suggestions');
            console.log('[fetchAllData] Öneriler alındı:', suggestionsResponse);
            const suggestedUsers = (suggestionsResponse || []).map((suggestion) => ({
                ...suggestion.user,
                requestStatus: 'idle' as 'idle',
            }));
            setSuggestions(suggestedUsers);
            console.log('[fetchAllData] Başarıyla tamamlandı.');

        } catch (error) {
            console.error('Arkadaş verileri yüklenirken hata oluştu:', error);
            addNotification({ type: 'error', message: 'Veriler yüklenirken bir hata oluştu.' });
            // Hata durumunda state'leri sıfırla
            setFriends([]);
            setRequests([]);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
            console.log('[fetchAllData] Sona erdi.');
        }
    }, [addNotification]);

    useEffect(() => {
        if (currentUser) {
            fetchAllData();
        }
    }, [currentUser, fetchAllData]);

    const handleAcceptRequest = async (friendshipId: number) => {
        try {
            // Backend'de doğru endpoint
            await apiService.post(`/api/friendships/requests/${friendshipId}/accept`);
            addNotification({ type: 'success', message: 'Arkadaşlık isteği kabul edildi.' });
            fetchAllData(); // Verileri yeniden yükle
        } catch (error) {
            console.error('İstek kabul edilirken hata:', error);
            addNotification({ type: 'error', message: 'İstek kabul edilirken bir hata oluştu.' });
        }
    };

    const handleRejectRequest = async (friendshipId: number) => {
        try {
            // Backend'de doğru endpoint
            await apiService.post(`/api/friendships/requests/${friendshipId}/decline`);
            addNotification({ type: 'info', message: 'Arkadaşlık isteği reddedildi.' });
            fetchAllData(); // Verileri yeniden yükle
        } catch (error) {
            console.error('İstek reddedilirken hata:', error);
            addNotification({ type: 'error', message: 'İstek reddedilirken bir hata oluştu.' });
        }
    };

    const handleAddFriend = async (userId: number) => {
        setSuggestions(prev => prev.map(s => s.id === userId ? { ...s, requestStatus: 'pending' } : s));
        try {
            // Backend'de doğru endpoint ve payload formatı
            await apiService.post('/api/friendships/request', { addressee_id: userId });
            setSuggestions(prev => prev.map(s => s.id === userId ? { ...s, requestStatus: 'sent' } : s));
            addNotification({ type: 'success', message: 'Arkadaşlık isteği gönderildi.' });
        } catch (error: any) {
            console.error('Arkadaşlık isteği gönderilirken hata:', error);
            addNotification({ type: 'error', message: error.response?.data?.error || 'Bir hata oluştu.' });
            setSuggestions(prev => prev.map(s => s.id === userId ? { ...s, requestStatus: 'idle' } : s));
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        try {
            setIsLoading(true);
            // Backend user search endpoint'i
            const response = await apiService.get<User[]>(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
            const searchResults = response || [];

            // Arama sonuçlarını suggestions olarak göster
            setSuggestions(searchResults.map(u => ({ ...u, requestStatus: 'idle' })) || []);
            setActiveTab('suggestions');
        } catch (error) {
            console.error('Arama yapılırken hata:', error);
            addNotification({ type: 'error', message: 'Arama sırasında bir hata oluştu.' });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredFriends = friends.filter(friend =>
        `${friend.first_name || ''} ${friend.last_name || ''} ${friend.username}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getUserDisplayName = (user: User) => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName || user.username;
    };

    const getUserAvatarUrl = (user: User) => {
        if (user.profile_picture_url) {
            return user.profile_picture_url;
        }
        const name = getUserDisplayName(user);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    };

    const renderFriendsTab = () => (
        <div>
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Arkadaşlar yükleniyor...</p>
                </div>
            ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Arkadaş bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchQuery ? 'Aramanıza uygun arkadaş bulunamadı.' : 'Henüz arkadaşınız bulunmamaktadır.'}
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {filteredFriends.map((friend) => (
                        <li key={friend.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <Link to={`/profil/${friend.id}`} className="flex items-center space-x-4">
                                <img
                                    className="h-12 w-12 rounded-full object-cover"
                                    src={getUserAvatarUrl(friend)}
                                    alt={getUserDisplayName(friend)}
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName(friend)}</p>
                                    <p className="text-sm text-gray-500">@{friend.username}</p>
                                </div>
                            </Link>
                            <button className="p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                                <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    const renderRequestsTab = () => (
        <div>
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">İstekler yükleniyor...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-8">
                    <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Bekleyen istek yok</h3>
                    <p className="mt-1 text-sm text-gray-500">Yeni arkadaşlık isteğiniz bulunmamaktadır.</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {requests.map((request) => (
                        <li key={request.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <Link to={`/profil/${request.requester.id}`} className="flex items-center space-x-4">
                                <img
                                    className="h-12 w-12 rounded-full object-cover"
                                    src={getUserAvatarUrl(request.requester)}
                                    alt={getUserDisplayName(request.requester)}
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName(request.requester)}</p>
                                    <p className="text-sm text-gray-500">@{request.requester.username}</p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(request.created_at).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            </Link>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleAcceptRequest(request.id)}
                                    className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                                >
                                    <CheckIcon className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => handleRejectRequest(request.id)}
                                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    const renderSuggestionsTab = () => (
        <div>
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Öneriler yükleniyor...</p>
                </div>
            ) : suggestions.length === 0 ? (
                <div className="text-center py-8">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Öneri bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchQuery ? 'Aramanıza uygun kullanıcı bulunamadı.' : 'Şu anda yeni arkadaş öneriniz bulunmamaktadır.'}
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {suggestions.map((suggestion) => (
                        <li key={suggestion.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <Link to={`/profil/${suggestion.id}`} className="flex items-center space-x-4">
                                <img
                                    className="h-12 w-12 rounded-full object-cover"
                                    src={getUserAvatarUrl(suggestion)}
                                    alt={getUserDisplayName(suggestion)}
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName(suggestion)}</p>
                                    <p className="text-sm text-gray-500">@{suggestion.username}</p>
                                </div>
                            </Link>
                            <button
                                onClick={() => handleAddFriend(suggestion.id)}
                                disabled={suggestion.requestStatus !== 'idle'}
                                className={`p-2 rounded-full ${suggestion.requestStatus === 'idle'
                                        ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                                        : suggestion.requestStatus === 'pending'
                                            ? 'bg-yellow-100 text-yellow-600'
                                            : 'bg-green-100 text-green-600'
                                    } disabled:cursor-not-allowed`}
                            >
                                {suggestion.requestStatus === 'idle' && <UserPlusIcon className="h-5 w-5" />}
                                {suggestion.requestStatus === 'pending' && (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                                )}
                                {suggestion.requestStatus === 'sent' && <CheckIcon className="h-5 w-5" />}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Arkadaşlar</h1>
                </div>

                {/* Arama Çubuğu */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <form onSubmit={handleSearch} className="flex space-x-2">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Kullanıcı ara..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Ara
                        </button>
                    </form>
                </div>

                {/* Tab Navigation */}
                <div className="px-6">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'friends'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <UserGroupIcon className="h-5 w-5 inline mr-2" />
                            Arkadaşlarım ({friends.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <EnvelopeIcon className="h-5 w-5 inline mr-2" />
                            İstekler ({requests.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('suggestions')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'suggestions'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <UserPlusIcon className="h-5 w-5 inline mr-2" />
                            Öneriler ({suggestions.length})
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="px-6 py-4">
                    {activeTab === 'friends' && renderFriendsTab()}
                    {activeTab === 'requests' && renderRequestsTab()}
                    {activeTab === 'suggestions' && renderSuggestionsTab()}
                </div>
            </div>
        </div>
    );
};

export default Friends; 