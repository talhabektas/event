import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    UserIcon,
    EnvelopeIcon,
    UserPlusIcon,
    UserGroupIcon,
    CheckIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    ChatBubbleLeftEllipsisIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { apiService } from '../../services';
import { Card, Button } from '../../components/common';

// Types
interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
    email?: string;
}

interface FriendRequest {
    id: number; // Friendship ID
    requester_id: number;
    addressee_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    requester?: User; // Optional - may not be preloaded
    addressee?: User; // Optional - may not be preloaded
}

interface FriendSuggestion {
    user: User;
    match_score: number;
    common_interests: string[];
}

interface SuggestedUserState extends User {
    requestStatus: 'idle' | 'pending' | 'sent';
}

const Friends: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { addNotification } = useApp();

    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'suggestions'>('friends');
    const [friends, setFriends] = useState<User[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestedUserState[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

            // Null check ve data validation
            const validRequests = (requestsResponse || []).filter((request): request is FriendRequest => {
                const isValid = Boolean(request && typeof request === 'object' &&
                    typeof request.id === 'number' &&
                    request.requester &&
                    typeof request.requester === 'object' &&
                    typeof request.requester.id === 'number');

                if (!isValid) {
                    console.warn('[fetchAllData] Invalid request object:', request);
                }
                return isValid;
            });

            setRequests(validRequests);

            // Arkadaş önerileri - backend'de doğru endpoint
            console.log('[fetchAllData] Öneriler isteniyor...');
            const suggestionsResponse = await apiService.get<FriendSuggestion[]>('/api/friendships/suggestions');
            console.log('[fetchAllData] Öneriler alındı:', suggestionsResponse);
            const suggestedUsers = (suggestionsResponse || []).map((suggestion) => ({
                ...suggestion.user,
                requestStatus: 'idle' as const,
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
            const response = await apiService.get<User[]>(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
            const searchResults = response || [];

            setSuggestions(searchResults.map(u => ({ ...u, requestStatus: 'idle' as const })) || []);
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

    const getUserDisplayName = (user?: User | null) => {
        if (!user) return 'Bilinmeyen Kullanıcı';
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName || user.username || 'Anonim';
    };

    const getUserAvatarUrl = (user?: User | null) => {
        if (!user) {
            return `https://ui-avatars.com/api/?name=?&background=random`;
        }
        if (user.profile_picture_url) {
            return user.profile_picture_url;
        }
        const name = getUserDisplayName(user);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    };

    const renderFriendsTab = () => (
        <div>
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">Arkadaşlar yükleniyor...</p>
                </div>
            ) : filteredFriends.length === 0 ? (
                <div className="text-center py-12">
                    <UserIcon className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-500" />
                    <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
                        {searchQuery ? 'Arkadaş bulunamadı' : 'Henüz arkadaşınız yok'}
                    </h3>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        {searchQuery
                            ? 'Aramanıza uygun arkadaş bulunamadı.'
                            : 'Yeni insanlarla tanışarak arkadaş çevrenizi genişletebilirsiniz.'
                        }
                    </p>
                    {!searchQuery && (
                        <Button
                            variant="primary"
                            size="medium"
                            className="mt-4"
                            onClick={() => setActiveTab('suggestions')}
                        >
                            Arkadaş Önerilerini Gör
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFriends.map((friend) => (
                        <Card key={friend.id} variant="glass" className="hover-lift">
                            <div className="p-6 text-center">
                                <img
                                    className="h-16 w-16 rounded-full object-cover mx-auto mb-4"
                                    src={getUserAvatarUrl(friend)}
                                    alt={getUserDisplayName(friend)}
                                />
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                                    {getUserDisplayName(friend)}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                    @{friend.username}
                                </p>
                                <div className="flex space-x-2">
                                    <Link to={`/profil/${friend.id}`} className="flex-1">
                                        <Button variant="outline" size="small" className="w-full">
                                            Profili Gör
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="small" className="px-3">
                                        <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    const renderRequestsTab = () => (
        <div>
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">İstekler yükleniyor...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12">
                    <EnvelopeIcon className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-500" />
                    <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">Bekleyen istek yok</h3>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">Yeni arkadaşlık isteğiniz bulunmamaktadır.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => {
                        // Safe access with null checks
                        const requester = request.requester;
                        const requesterId = requester?.id;
                        const requesterName = getUserDisplayName(requester);
                        const requesterUsername = requester?.username || 'unknown';

                        if (!requester || !requesterId) {
                            return (
                                <Card key={request.id} variant="default" className="border-orange-200 dark:border-orange-800">
                                    <div className="p-6 flex items-center space-x-4">
                                        <ExclamationTriangleIcon className="h-12 w-12 text-orange-500" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                                Hatalı arkadaşlık isteği
                                            </p>
                                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                                Bu istek için kullanıcı bilgileri bulunamadı.
                                            </p>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="small"
                                            onClick={() => handleRejectRequest(request.id)}
                                        >
                                            Sil
                                        </Button>
                                    </div>
                                </Card>
                            );
                        }

                        return (
                            <Card key={request.id} variant="glass" className="hover-lift">
                                <div className="p-6 flex items-center justify-between">
                                    <Link to={`/profil/${requesterId}`} className="flex items-center space-x-4 flex-1">
                                        <img
                                            className="h-14 w-14 rounded-full object-cover"
                                            src={getUserAvatarUrl(requester)}
                                            alt={requesterName}
                                        />
                                        <div className="flex-1">
                                            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                                {requesterName}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                @{requesterUsername}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                                                {new Date(request.created_at).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="flex space-x-3">
                                        <Button
                                            variant="success"
                                            size="small"
                                            onClick={() => handleAcceptRequest(request.id)}
                                            iconLeft={<CheckIcon className="h-4 w-4" />}
                                        >
                                            Kabul Et
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="small"
                                            onClick={() => handleRejectRequest(request.id)}
                                            iconLeft={<XMarkIcon className="h-4 w-4" />}
                                        >
                                            Reddet
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderSuggestionsTab = () => (
        <div>
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">Öneriler yükleniyor...</p>
                </div>
            ) : suggestions.length === 0 ? (
                <div className="text-center py-12">
                    <UserGroupIcon className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-500" />
                    <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
                        {searchQuery ? 'Kullanıcı bulunamadı' : 'Öneri bulunamadı'}
                    </h3>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        {searchQuery
                            ? 'Aramanıza uygun kullanıcı bulunamadı.'
                            : 'Şu anda yeni arkadaş öneriniz bulunmamaktadır.'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestions.map((suggestion) => (
                        <Card key={suggestion.id} variant="glass" className="hover-lift">
                            <div className="p-6 text-center">
                                <img
                                    className="h-16 w-16 rounded-full object-cover mx-auto mb-4"
                                    src={getUserAvatarUrl(suggestion)}
                                    alt={getUserDisplayName(suggestion)}
                                />
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                                    {getUserDisplayName(suggestion)}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                    @{suggestion.username}
                                </p>
                                <div className="flex space-x-2">
                                    <Link to={`/profil/${suggestion.id}`} className="flex-1">
                                        <Button variant="outline" size="small" className="w-full">
                                            Profili Gör
                                        </Button>
                                    </Link>
                                    <Button
                                        variant={
                                            suggestion.requestStatus === 'idle' ? 'primary' :
                                                suggestion.requestStatus === 'pending' ? 'secondary' : 'success'
                                        }
                                        size="small"
                                        disabled={Boolean(suggestion.requestStatus !== 'idle')}
                                        onClick={() => handleAddFriend(suggestion.id)}
                                        className="px-3"
                                    >
                                        {suggestion.requestStatus === 'idle' && <UserPlusIcon className="h-4 w-4" />}
                                        {suggestion.requestStatus === 'pending' && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                        )}
                                        {suggestion.requestStatus === 'sent' && <CheckIcon className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 dark:from-dark-900 dark:via-dark-800 dark:to-dark-950">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <Card variant="gradient" className="mb-8">
                    <div className="relative p-8">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <div className="relative">
                            <h1 className="text-3xl font-bold text-white mb-2">Arkadaşlar</h1>
                            <p className="text-white/90">Arkadaşlarınızı yönetin, yeni insanlarla tanışın</p>
                        </div>
                    </div>
                </Card>

                {/* Search */}
                <Card variant="glass" className="mb-8">
                    <div className="p-6">
                        <form onSubmit={handleSearch} className="flex space-x-4">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Kullanıcı ara..."
                                    className="input-modern w-full pl-12"
                                />
                            </div>
                            <Button type="submit" variant="primary" size="medium">
                                Ara
                            </Button>
                        </form>
                    </div>
                </Card>

                {/* Tabs */}
                <Card variant="glass" className="mb-8">
                    <div className="p-2">
                        <nav className="flex space-x-2">
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'friends'
                                    ? 'bg-primary-500 text-white shadow-lg'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-700/50'
                                    }`}
                            >
                                <UserGroupIcon className="h-5 w-5 inline mr-2" />
                                Arkadaşlarım ({friends.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'requests'
                                    ? 'bg-primary-500 text-white shadow-lg'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-700/50'
                                    }`}
                            >
                                <EnvelopeIcon className="h-5 w-5 inline mr-2" />
                                İstekler ({requests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('suggestions')}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'suggestions'
                                    ? 'bg-primary-500 text-white shadow-lg'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-700/50'
                                    }`}
                            >
                                <UserPlusIcon className="h-5 w-5 inline mr-2" />
                                Öneriler ({suggestions.length})
                            </button>
                        </nav>
                    </div>
                </Card>

                {/* Content */}
                <div>
                    {activeTab === 'friends' && renderFriendsTab()}
                    {activeTab === 'requests' && renderRequestsTab()}
                    {activeTab === 'suggestions' && renderSuggestionsTab()}
                </div>
            </div>
        </div>
    );
};

export default Friends; 