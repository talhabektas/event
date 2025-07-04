import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    UserGroupIcon,
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    UserIcon,
    CalendarIcon,
    UsersIcon,
    ChatBubbleLeftEllipsisIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import roomService from '../../services/roomService';
import SelectMembersModal from '../../components/chat/SelectMembersModal';
import InviteFriendsModal from '../../components/rooms/InviteFriendsModal';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface RoomDetail {
    id: number;
    name: string;
    description: string;
    creatorId: number;
    creatorName: string;
    isPublic: boolean;
    events: {
        id: number;
        title: string;
        startDate: string;
        location: string;
        attendeesCount: number;
    }[];
    members: {
        id: number;
        name: string;
        role: string;
        avatarUrl?: string;
    }[];
}

const RoomDetail: React.FC = () => {
    const { id: currentRoomId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { addNotification } = useApp();
    const [room, setRoom] = useState<RoomDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCurrentUserCreator, setIsCurrentUserCreator] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [activeTab, setActiveTab] = useState<'events' | 'members'>('events');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSelectMembersModalOpen, setIsSelectMembersModalOpen] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    useEffect(() => {
        const fetchRoomDetails = async () => {
            setIsLoading(true);
            try {
                console.log(`Oda detayları API çağrısı: /api/rooms/${currentRoomId}`);
                const roomData = await roomService.getRoomById(currentRoomId || '0');
                console.log("API yanıtı - oda detayları:", roomData);

                if (!roomData) {
                    console.error('Oda bulunamadı veya veriler yüklenemedi');
                    setIsLoading(false);
                    return;
                }

                let roomMembersData: any[] = [];
                try {
                    console.log(`Oda üyeleri API çağrısı: /api/rooms/${roomData.id}/members`);
                    const membersData = await roomService.getRoomMembers(roomData.id);
                    console.log("API yanıtı - oda üyeleri:", membersData);
                    if (membersData) {
                        roomMembersData = membersData;
                    }
                } catch (memberError) {
                    console.error('Oda üyeleri yüklenirken hata oluştu:', memberError);
                }

                const processedMembers = roomMembersData.map((member: any) => ({
                    id: member.id || member.user_id || 0,
                    name: member.username || member.name || 'İsimsiz Kullanıcı',
                    role: member.role || 'member',
                    avatarUrl: member.avatar_url || member.profile_picture_url || member.profilePictureUrl
                }));

                const processedRoom: RoomDetail = {
                    id: roomData.id,
                    name: roomData.name || 'İsimsiz Oda',
                    description: roomData.description || 'Açıklama bulunmuyor',
                    creatorId: roomData.creator_user_id || 0,
                    creatorName: roomData.creatorName || 'Bilinmeyen Kullanıcı',
                    isPublic: roomData.is_public !== undefined ? roomData.is_public : (roomData.isPublic !== undefined ? roomData.isPublic : true),
                    events: Array.isArray(roomData.events) ? roomData.events.map((event: any) => ({
                        id: event.id,
                        title: event.title || 'İsimsiz Etkinlik',
                        startDate: event.start_date || event.startDate || new Date().toISOString(),
                        location: event.location || 'Konum belirtilmemiş',
                        attendeesCount: event.attendees_count || event.attendeesCount || 0
                    })) : [],
                    members: processedMembers
                };

                console.log("İşlenmiş oda verisi (üyelerle birlikte):", processedRoom);
                setRoom(processedRoom);

                const isCreator = currentUser?.id === processedRoom.creatorId;
                setIsCurrentUserCreator(isCreator);

                const isUserMember = processedRoom.members.some(member => member.id === currentUser?.id);
                setIsMember(isUserMember);
            } catch (error) {
                console.error('Oda detayları yüklenirken hata oluştu:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentRoomId) {
            fetchRoomDetails();
        }
    }, [currentRoomId, currentUser?.id]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
                <p className="text-gray-600">Oda bulunamadı.</p>
                <Link
                    to="/odalar"
                    className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Odalar sayfasına dön
                </Link>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'dd MMMM yyyy, HH:mm', { locale: tr });
    };

    const handleJoinRoom = async () => {
        if (!room || !currentUser) {
            console.error("Oda bilgisi veya kullanıcı bilgisi bulunamadı.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (isMember) {
                await roomService.removeMember(room.id, currentUser.id);
                console.log('Odadan ayrılma isteği gönderildi.');
                setIsMember(false);
                setRoom(prevRoom => prevRoom ? ({
                    ...prevRoom,
                    members: prevRoom.members.filter(m => m.id !== currentUser.id)
                }) : null);
            } else {
                await roomService.addMember(room.id, currentUser.id);
                console.log('Odaya katılma isteği gönderildi.');
                setIsMember(true);
                const newMember = {
                    id: currentUser.id,
                    name: currentUser.username || 'Bilinmeyen Kullanıcı',
                    role: 'member',
                    avatarUrl: currentUser.profile_picture_url || ''
                };
                setRoom(prevRoom => prevRoom ? ({
                    ...prevRoom,
                    members: [...prevRoom.members, newMember]
                }) : null);
            }
        } catch (error) {
            console.error('Odaya katılma/ayrılma sırasında hata:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRoom = () => {
        if (window.confirm('Bu odayı silmek istediğinizden emin misiniz?')) {
            navigate('/odalar');
        }
    };

    const handleStartChat = async (selectedMemberIds: number[], numericDMRoomId?: number) => {
        setIsSelectMembersModalOpen(false);
        if (!currentUser) {
            addNotification({ message: 'Sohbet başlatmak için giriş yapmalısınız.', type: 'error' });
            return;
        }
        if (selectedMemberIds.length === 0) {
            addNotification({ message: 'Lütfen sohbet etmek için en az bir üye seçin.', type: 'info' });
            return;
        }

        setIsCreatingChat(true);

        if (selectedMemberIds.length === 1 && numericDMRoomId) {
            const otherUserId = selectedMemberIds[0];
            addNotification({ message: `Kullanıcı ${otherUserId} ile özel sohbet başlatılıyor...`, type: 'info' });
            console.log(`Özel mesaj için alınan sayısal Oda ID'si: ${numericDMRoomId}`);
            navigate(`/chat/${numericDMRoomId.toString()}`);

        } else if (selectedMemberIds.length > 1) {
            const groupName = `${currentUser.username || 'Siz'} ve ${selectedMemberIds.length} kişi`;
            try {
                addNotification({ message: 'Grup sohbeti oluşturuluyor...', type: 'info' });
                const newGroupRoom = await roomService.createGroupChatRoom({
                    name: groupName,
                    member_ids: selectedMemberIds,
                });

                if (newGroupRoom && newGroupRoom.id) {
                    addNotification({ message: 'Grup sohbeti başarıyla oluşturuldu!', type: 'success' });
                    navigate(`/chat/${newGroupRoom.id}`);
                } else {
                    addNotification({
                        message: 'Grup sohbeti oluşturulamadı. API\'den geçerli bir yanıt alınamadı.', type: 'error'
                    });
                    console.error("Grup sohbeti oluşturulamadı, API yanıtı:", newGroupRoom);
                }
            } catch (error) {
                console.error("Grup sohbeti oluşturma hatası:", error);
                addNotification({ message: `Grup sohbeti oluşturulurken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, type: 'error' });
            }
        }
        setIsCreatingChat(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center text-sm mb-4">
                <Link
                    to="/odalar"
                    className="text-gray-500 hover:text-indigo-600 flex items-center"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Odalar
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`h-2 ${room.isPublic ? 'bg-green-500' : 'bg-indigo-600'}`}></div>
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
                        <div className="flex space-x-2 items-center">
                            {isMember && room && room.members && room.members.length > 1 && (
                                <button
                                    onClick={() => setIsSelectMembersModalOpen(true)}
                                    disabled={isCreatingChat}
                                    className="inline-flex items-center rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-75"
                                >
                                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-1.5" />
                                    {isCreatingChat ? 'Oluşturuluyor...' : 'Yeni Sohbet Başlat'}
                                </button>
                            )}
                            {isMember && (
                                <button
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className="inline-flex items-center rounded-md bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                                >
                                    <PaperAirplaneIcon className="h-5 w-5 mr-1.5" />
                                    Arkadaş Davet Et
                                </button>
                            )}
                            {isCurrentUserCreator && room && (
                                <>
                                    <Link
                                        to={`/odalar/${room.id}/duzenle`}
                                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                                        Düzenle
                                    </Link>
                                    <button
                                        onClick={handleDeleteRoom}
                                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                                    >
                                        <TrashIcon className="h-4 w-4 mr-1" />
                                        Sil
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${room.isPublic
                            ? 'bg-green-100 text-green-800'
                            : 'bg-indigo-100 text-indigo-800'
                            }`}>
                            {room.isPublic ? 'Herkese Açık' : 'Özel'}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{room.creatorName} tarafından</span>
                        <span className="mx-2">•</span>
                        <UsersIcon className="h-4 w-4 mr-1" />
                        <span>{room.members.length} üye</span>
                    </div>

                    <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                        {room.description}
                    </p>

                    {isMember && !isCurrentUserCreator && (
                        <div className="mt-6">
                            <button
                                onClick={handleJoinRoom}
                                disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center rounded-md bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Ayrılıyor...' : 'Odadan Ayrıl'}
                            </button>
                        </div>
                    )}
                    {!isMember && room.isPublic && (
                        <div className="mt-6">
                            <button
                                onClick={handleJoinRoom}
                                disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Katılıyor...' : 'Odaya Katıl'}
                            </button>
                        </div>
                    )}
                    {!isMember && !room.isPublic && (
                        <div className="mt-6">
                            <p className="text-sm text-gray-600 text-center">Bu özel bir odadır. Katılmak için davet almanız gerekmektedir.</p>
                        </div>
                    )}
                </div>

                <div className="border-b border-gray-200 px-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                            ${activeTab === 'events' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Oda Etkinlikleri ({room.events.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                            ${activeTab === 'members' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Üyeler ({room.members.length})
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'events' && (
                        <div>
                            {room.events.length === 0 ? (
                                <p className="text-gray-500">Bu odada henüz etkinlik yok.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {room.events.map(event => (
                                        <li key={event.id} className="p-4 bg-gray-50 rounded-md shadow-sm">
                                            <Link to={`/etkinlikler/${event.id}`} className="hover:underline">
                                                <h4 className="font-semibold text-indigo-700">{event.title}</h4>
                                            </Link>
                                            <p className="text-sm text-gray-600 flex items-center mt-1">
                                                <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                                                {formatDate(event.startDate)}
                                            </p>
                                            <p className="text-sm text-gray-600 flex items-center">
                                                <UserIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                                                {event.attendeesCount} katılımcı
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    {activeTab === 'members' && (
                        <div>
                            {room.members.length === 0 ? (
                                <p className="text-gray-500">Bu odada henüz üye yok.</p>
                            ) : (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {room.members.map(member => (
                                        <li key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md shadow-sm">
                                            {member.avatarUrl ? (
                                                <img className="w-10 h-10 rounded-full" src={member.avatarUrl} alt={member.name} />
                                            ) : (
                                                <span className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                                <p className="text-xs text-gray-500">{member.role === 'creator' ? 'Oda Sahibi' : 'Üye'}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {room && (
                <>
                    <SelectMembersModal
                        isOpen={isSelectMembersModalOpen}
                        onClose={() => setIsSelectMembersModalOpen(false)}
                        members={room.members}
                        onStartChat={handleStartChat}
                        currentUserId={currentUser?.id}
                        roomName={room.name}
                        currentUserToken={localStorage.getItem('token') ?? undefined}
                    />
                    <InviteFriendsModal
                        isOpen={isInviteModalOpen}
                        onClose={() => setIsInviteModalOpen(false)}
                        roomId={room.id}
                        roomName={room.name}
                        onInviteSent={() => {
                            // Oda detaylarını yenile veya başka bir işlem yap
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default RoomDetail; 