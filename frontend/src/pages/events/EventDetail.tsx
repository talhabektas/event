import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CalendarIcon,
    MapPinIcon,
    ShareIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    UserGroupIcon,
    ClockIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { eventService } from '../../services';
import Avatar from '../../components/common/Avatar';
import apiService from '../../services/apiService';
import { formatDate, formatTime } from '../../utils/dateUtils';

interface EventDetail {
    id: number;
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate?: string;
    creatorId?: number;
    creatorName: string;
    attendeesCount: number;
    isPrivate: boolean;
    roomId?: number;
    roomName?: string;
    attendees: {
        id: number;
        name: string;
        avatarUrl?: string;
    }[];
    imageUrl?: string;
    isUserAttending?: boolean;
}

// Katılımcı tipi
interface Attendee {
    id: number;
    name: string;
    avatarUrl?: string;
    status: 'attending' | 'invited' | 'declined';
}

// Zaman seçeneği tipi
interface TimeOption {
    id: number;
    startTime: string;
    endTime: string;
    votes: number;
    hasVoted: boolean;
}

// Arkadaş kullanıcı tipi (Modal'da kullanılacak)
interface FriendUser {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
}

const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { addNotification } = useApp();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [timeOptions, setTimeOptions] = useState<TimeOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAttending, setIsAttending] = useState(false);
    const [hasSentRequest, setHasSentRequest] = useState(false);
    const [showAllAttendees, setShowAllAttendees] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [friendsToInvite, setFriendsToInvite] = useState<FriendUser[]>([]); // Tipi FriendUser[] olarak güncellendi
    const [selectedFriends, setSelectedFriends] = useState<Set<number>>(new Set());
    const [isInviting, setIsInviting] = useState(false);

    // Katılımcıları yeniden çekmek için bir fonksiyon
    const fetchAttendees = async () => {
        if (!id) return;
        try {
            const attendeesData = await apiService.get<Attendee[]>(`/api/events/${id}/attendees`);
            setAttendees(attendeesData);
        } catch (error) {
            console.error('Katılımcılar alınırken hata:', error);
            setAttendees([]); // Hata durumunda listeyi temizle
        }
    };

    useEffect(() => {
        const loadEventDetails = async () => {
            if (!id) return;

            setIsLoading(true);
            try {
                // Etkinlik detayını getir
                const eventData = await eventService.getEventById(Number(id));

                if (!eventData) {
                    addNotification({
                        type: 'error',
                        message: 'Etkinlik bulunamadı',
                        duration: 5000
                    });
                    return;
                }

                // EventData (EventItem) EventDetail tipine dönüştürülüyor
                const detailedEventData: EventDetail = {
                    ...eventData,
                    // EventItem'da olmayan veya EventDetail'de farklı olan alanlar için varsayılan/dönüştürülmüş değerler
                    // attendees başlangıçta boş, ayrı API çağrısı ile dolacak
                    attendees: [],
                    // creatorId EventItem'da yoksa, opsiyonel olduğu için sorun değil
                    // Diğer alanlar EventItem ve EventDetail arasında eşleşiyorsa doğrudan kopyalanır
                };
                setEvent(detailedEventData);
                setIsAttending(eventData.isUserAttending || false);

                // Katılımcıları API'den çek
                await fetchAttendees();

                // Zaman seçeneklerini API'den çek
                try {
                    const timeOptionsData = await apiService.get<TimeOption[]>(`/api/events/${id}/time-options`);
                    setTimeOptions(timeOptionsData);
                } catch (error) {
                    console.error('Zaman seçenekleri alınırken hata:', error);
                    setTimeOptions([]);
                }

            } catch (error) {
                console.error('Etkinlik detayı yüklenirken hata:', error);
                addNotification({
                    type: 'error',
                    message: 'Etkinlik detayları yüklenirken bir hata oluştu',
                    duration: 5000
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadEventDetails();
    }, [id, addNotification]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen bg-gray-100 flex flex-col justify-center items-center">
                <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12 text-center max-w-lg w-full">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">Etkinlik Bulunamadı</h2>
                    <p className="text-gray-500 mb-8">Aradığınız etkinlik mevcut değil veya kaldırılmış olabilir.</p>
                    <button
                        onClick={() => navigate('/etkinlikler')}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Tüm Etkinliklere Dön
                    </button>
                </div>
            </div>
        );
    }

    // Zaman bilgisi
    const getEventTimeInfo = () => {
        if (!event) return null;

        if (event.endDate) {
            return (
                <span>
                    {formatTime(event.startDate)} - {formatTime(event.endDate)}
                </span>
            );
        }

        return <span>{formatTime(event.startDate)}</span>;
    };

    const handleAttendanceToggle = async () => {
        if (!isAuthenticated) {
            navigate('/giris', { state: { from: `/etkinlikler/${id}` } });
            return;
        }

        setIsSubmitting(true);
        try {
            if (isAttending) {
                await eventService.cancelAttendance(Number(id));
                addNotification({
                    type: 'success',
                    message: 'Etkinlik katılımınız iptal edildi',
                    duration: 3000
                });
                setIsAttending(false);

            } else if (event?.isPrivate) {
                await eventService.attendEvent(Number(id));
                addNotification({
                    type: 'success',
                    message: 'Özel etkinliğe katılım isteğiniz gönderildi.',
                    duration: 3000
                });
                setHasSentRequest(true);

            } else {
                await eventService.attendEvent(Number(id));
                addNotification({
                    type: 'success',
                    message: 'Etkinliğe katılımınız onaylandı',
                    duration: 3000
                });
                setIsAttending(true);
            }

            await fetchAttendees();

            if (event) {
                setEvent(prevEvent => {
                    if (!prevEvent) return null;
                    return {
                        ...prevEvent,
                        attendeesCount: isAttending ? prevEvent.attendeesCount - 1 : prevEvent.attendeesCount + 1,
                        isUserAttending: !isAttending
                    };
                });
            }
        } catch (error: any) {
            console.error('İşlem sırasında hata:', error);
            addNotification({
                type: 'error',
                message: error.response?.data?.error || 'Bir hata oluştu',
                duration: 5000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVoteForTime = (optionId: number) => {
        if (!isAuthenticated) {
            navigate('/giris', { state: { from: `/etkinlikler/${id}` } });
            return;
        }

        // Normalde API'a istek yapılacak, şimdilik yerel state'i güncelliyoruz
        setTimeOptions(prevOptions =>
            prevOptions.map(option => {
                if (option.id === optionId) {
                    return {
                        ...option,
                        votes: option.hasVoted ? option.votes - 1 : option.votes + 1,
                        hasVoted: !option.hasVoted
                    };
                }
                return option;
            })
        );

        addNotification({
            type: 'success',
            message: 'Oyunuz kaydedildi',
            duration: 3000
        });
    };

    const handleInviteParticipants = async () => {
        if (!isAuthenticated) {
            navigate('/giris', { state: { from: `/etkinlikler/${id}` } });
            return;
        }
        setShowInviteModal(true);
        try {
            const friendsData = await apiService.get<FriendUser[]>('/api/friendships');

            // Etkinliğe zaten katılan veya davetli olan kullanıcıların ID'lerini bir Set'e alalım.
            const existingParticipantIds = new Set(attendees.map(a => a.id));

            // Arkadaşları filtrele: Zaten davetli/katılımcı olmayanları ve kendimizi listeden çıkaralım.
            const filteredFriends = friendsData.filter(friend =>
                friend.id !== user?.id && !existingParticipantIds.has(friend.id)
            );

            setFriendsToInvite(filteredFriends);

        } catch (error) {
            console.error("Arkadaşlar yüklenirken hata:", error);
            addNotification({ type: 'error', message: 'Arkadaş listeniz yüklenirken bir sorun oluştu.' });
            setFriendsToInvite([]);
        }
    };

    const handleToggleFriendSelection = (friendId: number) => {
        setSelectedFriends(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(friendId)) {
                newSelection.delete(friendId);
            } else {
                newSelection.add(friendId);
            }
            return newSelection;
        });
    };

    const handleSubmitInvites = async () => {
        if (!id || selectedFriends.size === 0) return;

        setIsInviting(true);
        let successCount = 0;
        let errorCount = 0;

        for (const friendId of selectedFriends) {
            try {
                await apiService.post(`/api/events/${id}/invite`, { invitee_id: friendId });
                successCount++;
            } catch (error: any) {
                console.error(`Kullanıcı ${friendId} davet edilirken hata:`, error);
                errorCount++;
                // Tek tek hata mesajı göstermek yerine toplu bir özet gösterilebilir
            }
        }
        setIsInviting(false);
        setShowInviteModal(false);
        setSelectedFriends(new Set());

        if (successCount > 0) {
            addNotification({ type: 'success', message: `${successCount} arkadaş başarıyla davet edildi.` });
        }
        if (errorCount > 0) {
            addNotification({ type: 'error', message: `${errorCount} davet gönderilemedi. Detaylar için konsolu kontrol edin.` });
        }
        // Katılımcı listesini veya davetli listesini yenilemek gerekebilir.
    };

    const handleShareEvent = () => {
        // Paylaşım seçeneklerini gösterecek bir menü/modal açılabilir
        // Şimdilik basit bir bildirim veya konsol logu
        if (navigator.share) {
            navigator.share({
                title: event?.title,
                text: `Şu etkinliğe göz at: ${event?.title}`,
                url: window.location.href,
            })
                .then(() => console.log('Başarılı paylaşım'))
                .catch((error) => console.log('Paylaşım hatası', error));
        } else {
            // Fallback: URL'yi kopyala
            navigator.clipboard.writeText(window.location.href).then(() => {
                addNotification({
                    type: 'info',
                    message: 'Etkinlik linki panoya kopyalandı!',
                    duration: 3000
                });
            }).catch(err => {
                console.error('Link kopyalanamadı: ', err);
                addNotification({
                    type: 'error',
                    message: 'Link kopyalanamadı.',
                    duration: 3000
                });
            });
        }
    };

    // Modal JSX'i (render fonksiyonu içinde kullanılacak)
    const renderInviteModal = () => {
        if (!showInviteModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow">
                    <h3 className="text-xl font-semibold leading-6 text-gray-800 mb-6">Arkadaşlarını Davet Et</h3>
                    <div className="max-h-72 overflow-y-auto mb-6 space-y-3 pr-2">
                        {friendsToInvite.length === 0 && (
                            <p className='text-sm text-gray-500 py-4 text-center'>Davet edilebilecek arkadaş bulunamadı. Önce arkadaş eklemeyi deneyin.</p>
                        )}
                        {friendsToInvite.map((friend: FriendUser) => (
                            <div key={friend.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className='flex items-center'>
                                    <Avatar src={friend.profilePictureUrl} alt={friend.username} className="h-10 w-10 rounded-full mr-3" />
                                    <div>
                                        <span className="font-medium text-gray-700">{friend.firstName} {friend.lastName}</span>
                                        <span className="text-sm text-gray-500 block">@{friend.username}</span>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedFriends.has(friend.id)}
                                    onChange={() => handleToggleFriendSelection(friend.id)}
                                    className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                        <button
                            type="button"
                            onClick={() => { setShowInviteModal(false); setSelectedFriends(new Set()); }}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmitInvites}
                            disabled={isInviting || selectedFriends.size === 0}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            {isInviting ? 'Gönderiliyor...' : `Seçili Kişileri Davet Et (${selectedFriends.size})`}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Görüntülenecek katılımcılar
    const displayedAttendees = showAllAttendees
        ? attendees
        : attendees.slice(0, 4);

    // En çok oy alan zaman seçeneğini belirle
    const mostVotedOption = [...timeOptions].sort((a, b) => b.votes - a.votes)[0];

    const renderAttendanceButton = () => {
        if (!isAuthenticated) {
            return (
                <button
                    onClick={() => navigate('/giris', { state: { from: `/etkinlikler/${id}` } })}
                    className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    disabled={isSubmitting}
                >
                    Katılmak İçin Giriş Yapın
                </button>
            );
        }

        if (event?.creatorId === user?.id) {
            return (
                <div className="text-center font-semibold text-gray-600 bg-gray-200 py-3 px-4 rounded-lg">
                    Bu etkinliğin sahibisiniz.
                </div>
            )
        }

        if (isAttending) {
            return (
                <button
                    onClick={handleAttendanceToggle}
                    className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'İptal Ediliyor...' : 'Katılımdan Ayrıl'}
                </button>
            );
        }

        if (hasSentRequest) {
            return (
                <div className="text-center font-semibold text-gray-600 bg-yellow-200 py-3 px-4 rounded-lg">
                    Katılım İsteği Gönderildi
                </div>
            );
        }

        return (
            <button
                onClick={handleAttendanceToggle}
                className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'İşleniyor...' : (event?.isPrivate ? 'Katılma İsteği Gönder' : 'Katıl')}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-indigo-100 py-8 md:py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {renderInviteModal()} {/* Modal'ı render et */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 hover:border-gray-400 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Geri Dön
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    {/* Etkinlik Kapak Resmi */}
                    {event.imageUrl && (
                        <div className="w-full h-64 md:h-80 lg:h-96 bg-gray-300">
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-6 md:p-10">
                        <div className="lg:grid lg:grid-cols-3 lg:gap-x-12">
                            {/* Sol Sütun: Etkinlik Detayları ve Açıklama */}
                            <div className="lg:col-span-2 mb-8 lg:mb-0">
                                <div className="mb-8">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{event.title}</h1>
                                    <p className="text-sm text-gray-500">Oluşturan: <span className="font-medium text-indigo-600">{event.creatorName || 'Bilinmiyor'}</span></p>
                                </div>

                                <div className="space-y-5 mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-start text-gray-700">
                                        <CalendarIcon className="h-6 w-6 mr-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-medium block">{formatDate(event.startDate)}</span>
                                            {event.endDate && formatDate(event.startDate) !== formatDate(event.endDate) && (
                                                <span className="text-sm text-gray-500 block">Bitiş: {formatDate(event.endDate)}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start text-gray-700">
                                        <ClockIcon className="h-6 w-6 mr-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-medium block">{getEventTimeInfo()}</span>
                                            {/* Gerekirse burada saat farkı veya süre bilgisi eklenebilir */}
                                        </div>
                                    </div>

                                    <div className="flex items-start text-gray-700">
                                        <MapPinIcon className="h-6 w-6 mr-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                        <span className="font-medium">{event.location || 'Konum Belirtilmemiş'}</span>
                                    </div>

                                    <div className="flex items-start text-gray-700">
                                        <UserGroupIcon className="h-6 w-6 mr-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                        <span className="font-medium">{event.attendeesCount} kişi katılıyor</span>
                                    </div>
                                    {event.roomName && (
                                        <div className="flex items-start text-gray-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 mr-4 text-indigo-500 flex-shrink-0 mt-0.5">
                                                <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
                                                <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18.75 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-medium">Oda: {event.roomName}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Etkinlik Açıklaması</h3>
                                    <div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-line">
                                        {event.description || <p className="italic text-gray-500">Bu etkinlik için bir açıklama girilmemiş.</p>}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                                    {renderAttendanceButton()}

                                    <button
                                        onClick={handleInviteParticipants}
                                        className="flex-1 py-3 px-4 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 flex justify-center items-center transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <UserPlusIcon className="h-5 w-5 mr-2 text-indigo-500" />
                                        Arkadaş Davet Et
                                    </button>

                                    <button
                                        onClick={handleShareEvent}
                                        className="py-3 px-4 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 flex justify-center items-center transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <ShareIcon className="h-5 w-5 text-indigo-500" />
                                        <span className="ml-2 hidden sm:inline-block">Paylaş</span>
                                    </button>
                                </div>
                            </div>

                            {/* Sağ Sütun: Zaman Seçenekleri ve Katılımcılar */}
                            <div className="lg:col-span-1 space-y-8">
                                {/* Zaman Seçenekleri Oylaması */}
                                {timeOptions && timeOptions.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-1">Zaman Seçenekleri</h2>
                                        <p className="text-sm text-gray-500 mb-5">
                                            Etkinlik için en uygun zamanı oylayın.
                                        </p>

                                        <div className="space-y-4">
                                            {timeOptions.map((option) => (
                                                <div
                                                    key={option.id}
                                                    className={`border rounded-lg p-4 transition-all duration-200 ease-in-out ${option.id === mostVotedOption?.id && timeOptions.length > 1
                                                        ? 'border-indigo-500 bg-indigo-50 shadow-md scale-105'
                                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                        }`}
                                                >
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                                        <div className="mb-2 sm:mb-0">
                                                            <p className="font-semibold text-gray-700">{formatDate(option.startTime).split(',')[0]}, {formatDate(option.startTime).split(',')[1]}</p>
                                                            <p className="text-sm text-gray-500">{formatTime(option.startTime)} - {formatTime(option.endTime)}</p>
                                                        </div>

                                                        <div className="flex items-center space-x-3 w-full sm:w-auto">
                                                            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${option.id === mostVotedOption?.id && timeOptions.length > 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {option.votes} oy
                                                            </span>
                                                            <button
                                                                onClick={() => handleVoteForTime(option.id)}
                                                                disabled={!isAuthenticated}
                                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors w-full sm:w-auto ${option.hasVoted
                                                                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                                                                    : 'bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300'
                                                                    }`}
                                                            >
                                                                {option.hasVoted ? 'Oylandı' : 'Oyla'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {option.id === mostVotedOption?.id && timeOptions.length > 1 && (
                                                        <div className="mt-3 text-indigo-600 flex items-center border-t border-indigo-200 pt-2">
                                                            <CheckCircleIcon className="h-5 w-5 mr-1.5 flex-shrink-0" />
                                                            <span className="text-sm font-medium">En çok tercih edilen</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {!isAuthenticated && (
                                            <p className="text-xs text-gray-500 mt-4 text-center">Oy kullanmak için <a href="/giris" className="text-indigo-600 hover:underline">giriş yapın</a>.</p>
                                        )}
                                    </div>
                                )}

                                {/* Katılımcılar Listesi */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-5">
                                        <h2 className="text-xl font-semibold text-gray-800">Katılımcılar</h2>
                                        {attendees && attendees.length > 0 && (
                                            <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                                                {attendees.filter(a => a.status === 'attending').length} Katılıyor
                                            </span>
                                        )}
                                    </div>

                                    {attendees && attendees.length > 0 ? (
                                        <>
                                            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                                                {displayedAttendees.map((attendee) => (
                                                    <div key={attendee.id} className="flex items-center p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors">
                                                        <Avatar
                                                            src={attendee.avatarUrl}
                                                            alt={attendee.name}
                                                            className="h-10 w-10 rounded-full mr-3 flex-shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-800 truncate" title={attendee.name}>{attendee.name}</p>
                                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full inline-block ${attendee.status === 'attending'
                                                                ? 'bg-green-100 text-green-700'
                                                                : attendee.status === 'invited'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-red-100 text-red-700' // declined veya diğer durumlar
                                                                }`}>
                                                                {attendee.status === 'attending'
                                                                    ? 'Katılıyor'
                                                                    : attendee.status === 'invited'
                                                                        ? 'Davet Edildi'
                                                                        : 'Katılmıyor'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {attendees.length > 4 && (
                                                <button
                                                    onClick={() => setShowAllAttendees(!showAllAttendees)}
                                                    className="mt-5 w-full py-2.5 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                                                >
                                                    {showAllAttendees ? (
                                                        <>
                                                            <ChevronUpIcon className="h-5 w-5 mr-1.5" />
                                                            Daha Az Göster
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDownIcon className="h-5 w-5 mr-1.5" />
                                                            Tümünü Göster ({attendees.length})
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-gray-500 text-sm text-center py-4">Henüz katılımcı yok.</p>
                                    )}

                                    {isAuthenticated && (
                                        <button
                                            onClick={handleInviteParticipants}
                                            className="mt-6 w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center transition-colors"
                                        >
                                            <UserPlusIcon className="h-5 w-5 mr-2" />
                                            Arkadaşlarını Davet Et
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail; 