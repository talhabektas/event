import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import roomService from '../../services/roomService';
import Avatar from '../../components/common/Avatar';
import { CalendarIcon, MapPinIcon, UserGroupIcon, UserPlusIcon, UserMinusIcon, PencilIcon, BellIcon, EnvelopeIcon, CakeIcon } from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/dateUtils';
import { InterestsModal } from '../../components/profile/InterestsModal';

// Type definitions
interface UserProfile {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    profile_picture_url?: string;
    interests?: { id: number; name: string }[];
}

interface EventItem {
    id: number;
    title: string;
    description: string;
    location: string;
    final_start_time: string;
}

interface Room {
    id: number;
    name: string;
    description: string;
    memberCount?: number;
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

interface Friend {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    mutualFriendCount?: number;
}

interface FriendshipStatus {
    status: 'none' | 'pending' | 'accepted' | 'declined';
    friendshipId?: number;
}

const Profile: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const { user: authUser, updateUser } = useAuth();
    const { addNotification } = useApp();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userEvents, setUserEvents] = useState<EventItem[]>([]);
    const [userRooms, setUserRooms] = useState<Room[]>([]);
    const [userFriends, setUserFriends] = useState<Friend[]>([]);
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({ status: 'none' });
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', username: '', email: '' });
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
    const [activeTab, setActiveTab] = useState('events');
    const [tabCounts, setTabCounts] = useState({ events: 0, rooms: 0, friends: 0, suggestions: 0 });

    const isOwnProfile = !id || (authUser && String(authUser.id) === id);
    const profileId = isOwnProfile ? authUser?.id : Number(id);

    const loadProfileData = useCallback(async () => {
        if (!profileId) return;
        setIsLoading(true);
        try {
            const userData = await apiService.get<UserProfile>(isOwnProfile ? '/api/users/me' : `/api/users/${profileId}`);
            setProfile(userData);
            if (isOwnProfile) {
                setEditForm({
                    first_name: userData.first_name || '',
                    last_name: userData.last_name || '',
                    username: userData.username || '',
                    email: userData.email || '',
                });
                setProfilePicturePreview(userData.profile_picture_url || '');
            } else if (authUser) {
                const status = await apiService.get<FriendshipStatus>(`/api/friendships/status/${profileId}`);
                setFriendshipStatus(status);
            }
            const [events, rooms, friends, suggestions] = await Promise.all([
                apiService.get<EventItem[]>(`/api/users/${profileId}/events`),
                roomService.getUserRooms(profileId.toString()),
                apiService.get<Friend[]>(`/api/users/${profileId}/friends`),
                isOwnProfile ? apiService.get<Suggestion[]>('/api/suggestions/events') : Promise.resolve([])
            ]);
            setUserEvents(events || []);
            setUserRooms(rooms || []);
            setUserFriends(friends || []);
            setUserSuggestions(suggestions || []);
            setTabCounts({
                events: events?.length || 0,
                rooms: rooms?.length || 0,
                friends: friends?.length || 0,
                suggestions: suggestions?.length || 0,
            });
        } catch (error) {
            console.error('Profil verisi yüklenirken hata:', error);
            addNotification({ type: 'error', message: 'Profil verileri yüklenemedi.' });
        } finally {
            setIsLoading(false);
        }
    }, [profileId, isOwnProfile, authUser, addNotification]);

    useEffect(() => {
        loadProfileData();
    }, [loadProfileData]);

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePictureFile(file);
            setProfilePicturePreview(URL.createObjectURL(file));
            if (!isEditing) setIsEditing(true);
        }
    };

    const handleSaveInterests = async (interests: { id: number; name: string }[]) => {
        setIsSubmitting(true);
        try {
            const response: UserProfile = await apiService.put('/api/users/me', { interests });
            if (authUser && updateUser) {
                const updatedUser = { ...authUser, interests: response.interests };
                updateUser(updatedUser);
                setProfile(prev => prev ? { ...prev, interests: response.interests } : null);
            }
            addNotification({ type: 'success', message: 'İlgi alanları güncellendi.' });
        } catch (error) {
            console.error('İlgi alanları güncellenirken hata:', error);
            addNotification({ type: 'error', message: 'İlgi alanları güncellenemedi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProfileUpdate = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        Object.entries(editForm).forEach(([key, value]) => formData.append(key, value));
        if (profilePictureFile) formData.append('avatar', profilePictureFile);

        try {
            const updatedProfile: UserProfile = await apiService.put('/api/users/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (updateUser) updateUser(updatedProfile);
            setProfile(updatedProfile);
            setProfilePicturePreview(updatedProfile.profile_picture_url || '');
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
        if (!profileId) return;
        try {
            if (action === 'add') {
                await apiService.post(`/api/friendships/request/${profileId}`, {});
                setFriendshipStatus({ status: 'pending' });
                addNotification({ type: 'success', message: 'Arkadaşlık isteği gönderildi.' });
            } else if (action === 'remove' && friendshipStatus.friendshipId) {
                await apiService.delete(`/api/friendships/${friendshipStatus.friendshipId}`);
                setFriendshipStatus({ status: 'none' });
                addNotification({ type: 'success', message: 'Arkadaşlık sonlandırıldı.' });
            }
        } catch (error) {
            addNotification({ type: 'error', message: 'İşlem sırasında bir hata oluştu.' });
        }
    };

    if (isLoading) return <div className="text-center p-8">Profil Yükleniyor...</div>;
    if (!profile) return <div className="text-center p-8">Kullanıcı bulunamadı.</div>;

    const renderTabs = () => (
        <div className="border-b">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {Object.keys(tabCounts).map(tab => (
                    (isOwnProfile || tab !== 'suggestions') && (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}>
                            {tab} <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs ml-1">{tabCounts[tab as keyof typeof tabCounts]}</span>
                        </button>
                    )
                ))}
            </nav>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'events': return <UserEvents events={userEvents} />;
            case 'rooms': return <UserRooms rooms={userRooms} />;
            case 'friends': return <UserFriends friends={userFriends} />;
            case 'suggestions': return <UserSuggestions suggestions={userSuggestions} />;
            default: return null;
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <div className="md:flex md:items-start">
                    <div className="md:w-1/4 text-center md:text-left mb-4 md:mb-0">
                        <div className="relative w-32 h-32 mx-auto md:mx-0">
                            <Avatar src={profilePicturePreview || profile.profile_picture_url} alt={profile.username} size="xl" />
                            {isOwnProfile && <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary-dark"><PencilIcon className="h-5 w-5" /></label>}
                            {isOwnProfile && <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />}
                        </div>
                    </div>
                    <div className="md:w-3/4 md:pl-8">
                        {isEditing ? (
                            <div className="space-y-4">
                                {Object.keys(editForm).map(key => <input key={key} type={key === 'email' ? 'email' : 'text'} value={editForm[key as keyof typeof editForm]} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} className="w-full p-2 border rounded" placeholder={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />)}
                                <div className="flex space-x-2">
                                    <Button onClick={handleProfileUpdate} disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}</Button>
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>İptal</Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-3xl font-bold">{profile.first_name || profile.username} {profile.last_name}</h1>
                                <p className="text-muted-foreground">@{profile.username}</p>
                                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                                    <div className="flex items-center"><EnvelopeIcon className="h-5 w-5 mr-2" /><span>{profile.email}</span></div>
                                    <div className="flex items-center"><CakeIcon className="h-5 w-5 mr-2" /><span>{formatDate(profile.created_at)}'den beri üye</span></div>
                                </div>
                                {isOwnProfile ? <Button variant="outline" size="small" className="mt-4" onClick={() => setIsEditing(true)}><PencilIcon className="h-4 w-4 mr-2" />Profili Düzenle</Button> : <FriendshipButton status={friendshipStatus.status} onAction={handleFriendshipAction} />}
                            </div>
                        )}
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-2">İlgi Alanları</h2>
                            <div className="flex flex-wrap gap-2 items-center">
                                {profile.interests?.map(interest => <span key={interest.id} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">{interest.name}</span>)}
                                {isOwnProfile && <InterestsModal onSave={handleSaveInterests}><button className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center"><PencilIcon className="h-4 w-4" /></button></InterestsModal>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8">{renderTabs()}</div>
                <div className="mt-4">{renderTabContent()}</div>
            </Card>
        </div>
    );
};

// Sub-components
const FriendshipButton: React.FC<{ status: FriendshipStatus['status'], onAction: (action: 'add' | 'remove') => void }> = ({ status, onAction }) => {
    if (status === 'accepted') return <Button variant="danger" onClick={() => onAction('remove')}><UserMinusIcon className="h-5 w-5 mr-2" />Arkadaşlıktan Çıkar</Button>;
    if (status === 'pending') return <Button disabled><BellIcon className="h-5 w-5 mr-2" />İstek Gönderildi</Button>;
    return <Button onClick={() => onAction('add')}><UserPlusIcon className="h-5 w-5 mr-2" />Arkadaş Ekle</Button>;
};

const UserContentGrid: React.FC<{ items: any[], renderItem: (item: any) => React.ReactNode, noContentMessage: string }> = ({ items, renderItem, noContentMessage }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length > 0 ? items.map(item => renderItem(item)) : <div>{noContentMessage}</div>}
    </div>
);

const UserEvents: React.FC<{ events: EventItem[] }> = ({ events }) => <UserContentGrid items={events} noContentMessage="Gösterilecek etkinlik yok." renderItem={event => (
    <Card key={event.id}>
        <h3 className="font-bold">{event.title}</h3>
        <p className="text-sm text-muted-foreground truncate">{event.description}</p>
        <div className="mt-2 text-sm text-muted-foreground"><MapPinIcon className="h-4 w-4 mr-2" />{event.location}</div>
        <div className="mt-1 text-sm text-muted-foreground"><CalendarIcon className="h-4 w-4 mr-2" />{formatDate(event.final_start_time)}</div>
        <Link to={`/events/${event.id}`} className="mt-4 inline-block"><Button variant="outline" size="small">Detayları Gör</Button></Link>
    </Card>
)} />;

const UserRooms: React.FC<{ rooms: Room[] }> = ({ rooms }) => <UserContentGrid items={rooms} noContentMessage="Kullanıcı herhangi bir odaya üye değil." renderItem={room => (
    <Card key={room.id}>
        <h3 className="font-bold">{room.name}</h3>
        <p className="text-sm text-muted-foreground truncate">{room.description}</p>
        <div className="mt-2 text-sm text-muted-foreground"><UserGroupIcon className="h-4 w-4 mr-2" />{room.memberCount} üye</div>
        <Link to={`/rooms/${room.id}`} className="mt-4 inline-block"><Button variant="outline" size="small">Odaya Git</Button></Link>
    </Card>
)} />;

const UserFriends: React.FC<{ friends: Friend[] }> = ({ friends }) => <UserContentGrid items={friends} noContentMessage="Gösterilecek arkadaş yok." renderItem={friend => (
    <Link to={`/profil/${friend.id}`} key={friend.id}>
        <Card className="text-center p-4">
            <Avatar src={friend.profilePictureUrl} alt={friend.username} size="lg" className="mx-auto" />
            <p className="mt-2 font-semibold truncate">{friend.firstName || friend.username}</p>
            {friend.mutualFriendCount && <p className="text-xs text-muted-foreground">{friend.mutualFriendCount} ortak arkadaş</p>}
        </Card>
    </Link>
)} />;

const UserSuggestions: React.FC<{ suggestions: Suggestion[] }> = ({ suggestions }) => <UserContentGrid items={suggestions} noContentMessage="Henüz size uygun bir öneri bulunamadı." renderItem={suggestion => (
    <Card key={`${suggestion.type}-${suggestion.id}`}>
        {suggestion.imageUrl && <img src={suggestion.imageUrl} alt={suggestion.title} className="w-full h-32 object-cover mb-4 rounded-t-lg" />}
        <h3 className="font-bold">{suggestion.title}</h3>
        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
        <div className="mt-2 text-xs">
            <p>Eşleşme: %{suggestion.matchScore.toFixed(0)}</p>
            <p>Ortak İlgiler: {suggestion.commonInterests.join(', ')}</p>
        </div>
    </Card>
)} />;

export default Profile; 