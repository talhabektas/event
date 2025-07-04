import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { User, Interest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import Avatar from '../../components/common/Avatar';
import { CalendarIcon, MapPinIcon, UsersIcon, UserPlusIcon, UserMinusIcon, PencilIcon, EnvelopeIcon, CakeIcon } from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/dateUtils';
import { InterestsModal } from '../../components/profile/InterestsModal';

// --- Type Definitions ---
interface EventItem {
    id: number;
    title: string;
    description: string;
    location: string;
    final_start_time: string;
    imageUrl?: string;
}
interface UserProfile {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    profile_picture_url?: string;
    interests?: Interest[];
}
interface Room {
    id: number;
    name: string;
    description: string;
    memberCount?: number;
    isPublic?: boolean;
    createdAt?: string;
    isCreator?: boolean;
    isMember?: boolean;
    creatorName?: string;
    creatorId?: number;
}
interface Friend {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
    mutualFriendCount?: number;
}
interface FriendshipStatus {
    status: 'none' | 'pending' | 'accepted' | 'declined';
    friendshipId?: number;
}
interface Suggestion {
    id: number;
    type: 'event' | 'room' | 'friend';
    title: string;
    description: string;
    matchScore: number;
    commonInterests: string[];
    imageUrl?: string;
}

interface ProfileData {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
    created_at: string;
    interests: Interest[];
    events?: EventItem[];
    rooms?: Room[];
    suggestions?: Suggestion[];
    friends?: Friend[];
}

const Profile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser, updateUserInterests } = useAuth();
    const { addNotification } = useApp();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [userEvents, setUserEvents] = useState<EventItem[]>([]);
    const [userRooms, setUserRooms] = useState<Room[]>([]);
    const [userSuggestions, setUserSuggestions] = useState<Suggestion[]>([]);
    const [userFriends, setUserFriends] = useState<Friend[]>([]);
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({ status: 'none' });
    const [isMyProfile, setIsMyProfile] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        profilePictureFile: null as File | null,
        profilePictureUrl: ''
    });
    const [activeTab, setActiveTab] = useState('events');
    const [tabCounts, setTabCounts] = useState({
        events: 0,
        rooms: 0,
        friends: 0,
        suggestions: 0
    });

    const handleEditClick = () => {
        if (!profile) return;
        setEditForm({
            first_name: profile.first_name,
            last_name: profile.last_name,
            username: profile.username,
            email: profile.email,
            profilePictureFile: null,
            profilePictureUrl: profile.profile_picture_url || ''
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reset form to avoid showing stale data on next edit
        setEditForm({
            first_name: '',
            last_name: '',
            username: '',
            email: '',
            profilePictureFile: null,
            profilePictureUrl: ''
        });
    };

    useEffect(() => {
        const profileId = id || currentUser?.id;
        if (!profileId) {
            navigate('/giris');
            return;
        }

        setIsMyProfile(!id || Number(id) === currentUser?.id);

        const fetchProfileData = async () => {
            setIsLoading(true);
            try {
                const [profileData, friendsData] = await Promise.all([
                    apiService.get<ProfileData>(`/api/users/${profileId}`),
                    apiService.get<Friend[]>(`/api/users/${profileId}/friends`)
                ]);
                setProfile(profileData);
                setUserFriends(friendsData || []);
                setUserEvents(profileData.events || []);
                setUserRooms(profileData.rooms || []);
                setUserSuggestions(profileData.suggestions || []);
                setTabCounts({
                    events: profileData.events?.length || 0,
                    rooms: profileData.rooms?.length || 0,
                    friends: friendsData?.length || 0,
                    suggestions: profileData.suggestions?.length || 0
                });

                if (currentUser && currentUser.id !== Number(profileId)) {
                    const status = await apiService.get<FriendshipStatus>(`/api/buddies/status/${profileId}`);
                    setFriendshipStatus(status);
                }
            } catch (error) {
                console.error("Profil verileri alınırken hata:", error);
                addNotification({ type: 'error', message: 'Profil verileri yüklenemedi.' });
                navigate('/404');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [id, currentUser, navigate, addNotification]);

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setEditForm(prev => ({
                ...prev,
                profilePictureFile: file,
                profilePictureUrl: URL.createObjectURL(file)
            }));
            if (!isEditing) setIsEditing(true);
        }
    };

    const handleInterestsUpdate = async (updatedInterests: Interest[]) => {
        try {
            await updateUserInterests(updatedInterests);

            setProfile(prevProfile => {
                if (!prevProfile) return null;
                return { ...prevProfile, interests: updatedInterests };
            });

            addNotification({ type: 'success', message: 'İlgi alanları başarıyla güncellendi.' });
        } catch (error) {
            console.error("İlgi alanları güncellenirken hata:", error);
            addNotification({ type: 'error', message: 'İlgi alanları güncellenirken bir hata oluştu.' });
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing) return;
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('first_name', editForm.first_name);
        formData.append('last_name', editForm.last_name);
        formData.append('username', editForm.username);
        formData.append('email', editForm.email);
        if (editForm.profilePictureFile) {
            formData.append('avatar', editForm.profilePictureFile);
        }

        try {
            const updatedProfile = await apiService.put<ProfileData>('/api/users/me', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setProfile(updatedProfile);
            if (updateUserInterests) {
                updateUserInterests(updatedProfile.interests.map(i => ({ id: i.id })));
            }
            setIsEditing(false);
            addNotification({ type: 'success', message: 'Profil başarıyla güncellendi.' });
        } catch (error) {
            console.error('Profil güncellenirken hata:', error);
            addNotification({ type: 'error', message: 'Profil güncellenirken bir hata oluştu.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFriendshipAction = async (action: 'add' | 'remove') => {
        if (!currentUser || !id) return;

        try {
            if (action === 'add') {
                await apiService.post('/api/friendships/request', {
                    addressee_id: Number(id)
                });
                setFriendshipStatus({ status: 'pending' });
            } else if (action === 'remove' && friendshipStatus.friendshipId) {
                await apiService.delete(`/api/friendships/${friendshipStatus.friendshipId}`);
                setFriendshipStatus({ status: 'none' });
            }
        } catch (error) {
            console.error('Arkadaşlık işlemi sırasında hata:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-bg-default flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900 mb-4">Kullanıcı bulunamadı</h2>
                    <p className="text-neutral-600 mb-6">Aradığınız kullanıcı sistemimizde mevcut değil.</p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')}>
                        Ana Sayfaya Dön
                    </Button>
                </div>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'events':
                return <UserEvents events={userEvents} isLoading={isLoading} />;
            case 'rooms':
                return <UserRooms rooms={userRooms} isLoading={isLoading} />;
            case 'friends':
                return <UserFriends friends={userFriends} isLoading={isLoading} profileId={Number(id)} />;
            case 'suggestions':
                return <UserSuggestions suggestions={userSuggestions} isLoading={isLoading} />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="mb-8 overflow-hidden">
                <div className="md:flex">
                    <div className="md:w-1/3 bg-bg-surface p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-neutral-200">
                        <div className="relative group">
                            <Avatar
                                src={editForm.profilePictureUrl || profile.profile_picture_url}
                                alt={`${profile.first_name} ${profile.last_name}`}
                                size="xl"
                                className="mb-4"
                            />
                            {isMyProfile && (
                                <label
                                    htmlFor="profilePictureInput"
                                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm font-medium rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                >
                                    Değiştir
                                </label>
                            )}
                        </div>
                        <input
                            type="file"
                            id="profilePictureInput"
                            className="hidden"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                        />
                    </div>
                    <div className="md:w-2/3 p-6">
                        {isEditing ? (
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium text-neutral-700 mb-1">İsim</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        id="first_name"
                                        className="form-input block w-full rounded-lg border-neutral-300 focus:border-primary focus:ring-primary sm:text-sm"
                                        value={editForm.first_name}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-neutral-700 mb-1">Soyisim</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        id="last_name"
                                        className="form-input block w-full rounded-lg border-neutral-300 focus:border-primary focus:ring-primary sm:text-sm"
                                        value={editForm.last_name}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-1">Kullanıcı Adı</label>
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        className="form-input block w-full rounded-lg border-neutral-300 focus:border-primary focus:ring-primary sm:text-sm"
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">E-posta</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        className="form-input block w-full rounded-lg border-neutral-300 focus:border-primary focus:ring-primary sm:text-sm"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="mt-4 flex justify-end space-x-3">
                                    <Button
                                        variant="secondary"
                                        onClick={handleCancelEdit}
                                        className="mr-2"
                                        disabled={isSubmitting}
                                    >
                                        İptal
                                    </Button>
                                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                                        Değişiklikleri Kaydet
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <h1 className="text-3xl font-bold text-neutral-900">{profile.first_name} {profile.last_name}</h1>
                                    {isMyProfile && (
                                        <Button variant="secondary" size="small" onClick={handleEditClick}>
                                            <PencilIcon className="h-4 w-4 mr-1" />
                                            Düzenle
                                        </Button>
                                    )}
                                </div>
                                <p className="text-neutral-600 text-sm mb-4">@{profile.username}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
                                    <div className="flex items-center text-neutral-700">
                                        <EnvelopeIcon className="h-5 w-5 mr-2 text-neutral-400" />
                                        <span>{profile.email}</span>
                                    </div>
                                    <div className="flex items-center text-neutral-700">
                                        <CakeIcon className="h-5 w-5 mr-2 text-neutral-400" />
                                        <span>Katılım Tarihi: {formatDate(profile.created_at)}</span>
                                    </div>
                                </div>

                                {!isMyProfile && currentUser && (
                                    <div className="mt-4">
                                        {friendshipStatus.status === 'none' && (
                                            <Button variant="primary" onClick={() => handleFriendshipAction('add')} iconLeft={<UserPlusIcon className="h-5 w-5" />}>
                                                Arkadaş Ekle
                                            </Button>
                                        )}
                                        {friendshipStatus.status === 'pending' && (
                                            <Button variant="outline" disabled>İstek Gönderildi</Button>
                                        )}
                                        {friendshipStatus.status === 'accepted' && (
                                            <Button variant="danger" onClick={() => handleFriendshipAction('remove')} iconLeft={<UserMinusIcon className="h-5 w-5" />}>
                                                Arkadaşlıktan Çıkar
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Card>

            <div className="mb-6 border-b border-neutral-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'events' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
                    >
                        Etkinlikler ({tabCounts.events})
                    </button>
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rooms' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
                    >
                        Odalar ({tabCounts.rooms})
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'friends' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
                    >
                        Arkadaşlar ({tabCounts.friends})
                    </button>
                    {isMyProfile && (
                        <button
                            onClick={() => setActiveTab('suggestions')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'suggestions' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}
                        >
                            Öneriler ({tabCounts.suggestions})
                        </button>
                    )}
                </nav>
            </div>

            <div>
                {renderTabContent()}
            </div>

            <div className="mt-8">
                <Card title="İlgi Alanları">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {profile.interests && profile.interests.length > 0 ? (
                            profile.interests.map((interest) => (
                                <span key={interest.id} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                                    {interest.name}
                                </span>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Henüz ilgi alanı seçmediniz.</p>
                        )}
                    </div>
                    <div className="flex justify-end">
                        {isMyProfile && (
                            <InterestsModal onSave={handleInterestsUpdate}>
                                <Button variant="secondary" size="small" className="ml-auto">
                                    <PencilIcon className="h-4 w-4 mr-1" />
                                    Düzenle
                                </Button>
                            </InterestsModal>
                        )}
                    </div>
                </Card>
            </div>

            {/* Friends List */}
            <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <UsersIcon className="h-6 w-6 mr-2" />
                    Arkadaşlar ({userFriends.length})
                </h3>
                {userFriends.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {userFriends.map((friend) => (
                            <Card
                                key={friend.id}
                                className="p-3 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => navigate(`/profil/${friend.id}`)}
                            >
                                <Avatar src={friend.profile_picture_url} alt={friend.username} size="lg" className="mb-2" />
                                <p className="font-semibold text-sm text-neutral-800">{`${friend.first_name} ${friend.last_name}`}</p>
                                <p className="text-xs text-neutral-500">@{friend.username}</p>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">Henüz hiç arkadaşı yok.</p>
                )}
            </div>
        </div>
    );
};

const UserEvents: React.FC<{ events: EventItem[]; isLoading: boolean }> = ({ events, isLoading }) => {
    if (isLoading) return <p className="text-neutral-500">Etkinlikler yükleniyor...</p>;
    if (!events || events.length === 0) return <p className="text-neutral-500">Gösterilecek etkinlik bulunmuyor.</p>;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
                <Card key={event.id} className="overflow-hidden">
                    {event.imageUrl && (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-1">{event.title}</h3>
                        <p className="text-sm text-neutral-600 mb-2 line-clamp-2">{event.description}</p>
                        <div className="text-xs text-neutral-500 mb-1 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1.5" /> {formatDate(event.final_start_time)}
                        </div>
                        {event.location && (
                            <div className="text-xs text-neutral-500 mb-3 flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-1.5" /> {event.location}
                            </div>
                        )}
                        <Link to={`/events/${event.id}`}>
                            <Button variant="outline" size="small" className="w-full">Detayları Gör</Button>
                        </Link>
                    </div>
                </Card>
            ))}
        </div>
    );
};

const UserRooms: React.FC<{ rooms: Room[]; isLoading: boolean }> = ({ rooms, isLoading }) => {
    if (isLoading) return <p className="text-neutral-500">Odalar yükleniyor...</p>;
    if (rooms.length === 0) {
        return <p className="text-neutral-500">Henüz herhangi bir odaya katılmamışsınız.</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
                <Card key={room.id} className="flex flex-col">
                    <div className="p-6 flex-grow">
                        <h3 className="text-xl font-semibold text-neutral-800 mb-2">{room.name}</h3>
                        <p className="text-sm text-neutral-600 mb-1">
                            {room.isPublic ? 'Herkese Açık' : 'Özel Oda'} {' • '} {room.memberCount || 0} üye
                        </p>
                        {room.description && (
                            <p className="text-sm text-neutral-500 line-clamp-2 mb-4">
                                {room.description}
                            </p>
                        )}
                    </div>
                    <div className="p-4 border-t border-neutral-200">
                        <Link to={`/odalar/${room.id}`}>
                            <Button variant="outline" size="small" className="w-full">Odaya Git</Button>
                        </Link>
                    </div>
                </Card>
            ))}
        </div>
    );
};

const UserFriends: React.FC<{ friends: Friend[]; isLoading: boolean; profileId: number }> = ({ friends, isLoading, profileId }) => {
    const navigate = useNavigate();

    if (isLoading) {
        return <div className="text-center p-4">Arkadaşlar yükleniyor...</div>;
    }

    if (!friends || friends.length === 0) {
        return <div className="text-center p-4 text-neutral-500">Gösterilecek arkadaş yok.</div>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {friends.map((friend) => (
                <Card
                    key={friend.id}
                    className="p-3 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/profil/${friend.id}`)}
                >
                    <Avatar src={friend.profile_picture_url} alt={friend.username} size="lg" className="mb-2" />
                    <p className="font-semibold text-sm text-neutral-800">{`${friend.first_name} ${friend.last_name}`}</p>
                    <p className="text-xs text-neutral-500">@{friend.username}</p>
                </Card>
            ))}
        </div>
    );
};

const UserSuggestions: React.FC<{ suggestions: Suggestion[]; isLoading: boolean }> = ({ suggestions, isLoading }) => {
    if (isLoading) return <p className="text-neutral-500">Öneriler yükleniyor...</p>;
    if (!suggestions || suggestions.length === 0) return <p className="text-neutral-500">Şu anda size uygun bir öneri bulunmuyor.</p>;

    return (
        <div className="space-y-6">
            {suggestions.map(suggestion => (
                <Card key={suggestion.id} className="overflow-hidden md:flex">
                    {suggestion.imageUrl && (
                        <div className="md:w-1/4">
                            <img src={suggestion.imageUrl} alt={suggestion.title} className="w-full h-48 md:h-full object-cover" />
                        </div>
                    )}
                    <div className={`p-4 ${suggestion.imageUrl ? 'md:w-3/4' : 'w-full'}`}>
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 ${suggestion.type === 'event' ? 'bg-primary-light text-primary' :
                            suggestion.type === 'room' ? 'bg-accent-light text-accent' :
                                'bg-neutral-200 text-neutral-700'
                            }`}>
                            {suggestion.type === 'event' ? 'Etkinlik Önerisi' : suggestion.type === 'room' ? 'Oda Önerisi' : 'Arkadaş Önerisi'}
                        </span>
                        <h3 className="text-lg font-semibold text-neutral-800 mb-1">{suggestion.title}</h3>
                        <p className="text-sm text-neutral-600 mb-3 line-clamp-3">{suggestion.description}</p>
                        {suggestion.commonInterests && suggestion.commonInterests.length > 0 && (
                            <div className="mb-3">
                                <h4 className="text-xs font-medium text-neutral-500 mb-1">Ortak İlgİ Alanları:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {suggestion.commonInterests.map(interest => (
                                        <span key={interest} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs">{interest}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-neutral-400 mb-3">Eşleşme Skoru: %{suggestion.matchScore.toFixed(0)}</p>
                        <Button variant="outline" size="small">
                            {suggestion.type === 'event' ? 'Etkinliği Gör' : suggestion.type === 'room' ? 'Odayı Gör' : 'Profili Gör'}
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default Profile; 