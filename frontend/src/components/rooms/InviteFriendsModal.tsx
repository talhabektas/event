import React, { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';

interface Friend {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
}

interface InviteFriendsModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: number;
    roomName: string;
    onInviteSent: () => void;
}

const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
    isOpen,
    onClose,
    roomId,
    roomName,
    onInviteSent
}) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
    const [inviteMessage, setInviteMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { addNotification } = useApp();

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
            setInviteMessage(`Seni '${roomName}' odasına davet etmek istiyorum!`);
        }
    }, [isOpen, roomName]);

    const fetchFriends = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/friendships/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Arkadaşlar alınamadı');
            }

            const friendsData = await response.json();
            setFriends(friendsData);
        } catch (error) {
            console.error('Arkadaşlar yüklenirken hata:', error);
            addNotification({ message: 'Arkadaşlar yüklenirken hata oluştu', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFriendToggle = (friendId: number) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const handleSendInvitations = async () => {
        if (selectedFriends.length === 0) {
            addNotification({ message: 'Lütfen en az bir arkadaş seçin', type: 'warning' });
            return;
        }

        setIsSending(true);
        let successCount = 0;
        let errorCount = 0;

        for (const friendId of selectedFriends) {
            try {
                const response = await fetch(`/api/rooms/${roomId}/invite`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        invitee_id: friendId,
                        message: inviteMessage
                    })
                });

                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                    const errorData = await response.json();
                    console.error(`Arkadaş ${friendId} davet edilirken hata:`, errorData);
                }
            } catch (error) {
                errorCount++;
                console.error(`Arkadaş ${friendId} davet edilirken hata:`, error);
            }
        }

        if (successCount > 0) {
            addNotification({
                message: `${successCount} arkadaşınıza davet gönderildi!`,
                type: 'success'
            });
        }

        if (errorCount > 0) {
            addNotification({
                message: `${errorCount} davette hata oluştu`,
                type: 'error'
            });
        }

        setIsSending(false);
        setSelectedFriends([]);
        onInviteSent();
        onClose();
    };

    const handleClose = () => {
        setSelectedFriends([]);
        setInviteMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

                <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                        <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                            onClick={handleClose}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                                Arkadaşları '{roomName}' Odasına Davet Et
                            </h3>

                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <label htmlFor="invite-message" className="block text-sm font-medium text-gray-700 mb-2">
                                            Davet Mesajı
                                        </label>
                                        <textarea
                                            id="invite-message"
                                            rows={3}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={inviteMessage}
                                            onChange={(e) => setInviteMessage(e.target.value)}
                                            placeholder="Arkadaşlarınıza gönderilecek davet mesajını yazın..."
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                            Arkadaşlarınızı Seçin ({selectedFriends.length} seçili)
                                        </h4>

                                        {friends.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4">
                                                Henüz arkadaşınız bulunmuyor.
                                            </p>
                                        ) : (
                                            <div className="max-h-60 overflow-y-auto space-y-2">
                                                {friends.map((friend) => (
                                                    <div
                                                        key={friend.id}
                                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedFriends.includes(friend.id)
                                                                ? 'border-indigo-500 bg-indigo-50'
                                                                : 'border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                        onClick={() => handleFriendToggle(friend.id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFriends.includes(friend.id)}
                                                            onChange={() => handleFriendToggle(friend.id)}
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                                        />

                                                        {friend.profile_picture_url ? (
                                                            <img
                                                                src={friend.profile_picture_url}
                                                                alt={friend.username}
                                                                className="w-8 h-8 rounded-full mr-3"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                                                <span className="text-sm font-medium text-gray-600">
                                                                    {(friend.first_name || friend.username || 'U').charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {friend.first_name && friend.last_name
                                                                    ? `${friend.first_name} ${friend.last_name}`
                                                                    : friend.username
                                                                }
                                                            </p>
                                                            {friend.first_name && friend.last_name && (
                                                                <p className="text-xs text-gray-500">@{friend.username}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleSendInvitations}
                            disabled={isSending || isLoading || selectedFriends.length === 0}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                        >
                            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                            {isSending ? 'Gönderiliyor...' : 'Davet Gönder'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSending}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 sm:mt-0 sm:w-auto"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InviteFriendsModal; 