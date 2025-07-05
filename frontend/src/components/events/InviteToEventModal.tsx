import React, { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';
import { Card, Button } from '../common';

interface Friend {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
}

interface InviteToEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: number;
    eventTitle: string;
    onInviteSent: () => void;
}

const InviteToEventModal: React.FC<InviteToEventModalProps> = ({
    isOpen,
    onClose,
    eventId,
    eventTitle,
    onInviteSent
}) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { addNotification } = useApp();

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
            setSelectedFriends([]);
        }
    }, [isOpen]);

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
                const response = await fetch(`/api/events/${eventId}/invite`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        invitee_id: friendId
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
                message: `${successCount} arkadaşınıza etkinlik daveti gönderildi!`,
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
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card variant="default" className="w-full max-w-md mx-auto relative">
                <div className="absolute right-4 top-4">
                    <button
                        onClick={handleClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-700 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        Arkadaşlarını Davet Et
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                            {eventTitle}
                        </span> etkinliğine arkadaşlarını davet et
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                    Arkadaşlarınızı Seçin ({selectedFriends.length} seçili)
                                </h4>

                                {friends.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-neutral-500 dark:text-neutral-400">
                                            Henüz arkadaşınız bulunmuyor.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {friends.map((friend) => (
                                            <div
                                                key={friend.id}
                                                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${selectedFriends.includes(friend.id)
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                        : 'border-neutral-200 dark:border-dark-600 hover:bg-neutral-50 dark:hover:bg-dark-700'
                                                    }`}
                                                onClick={() => handleFriendToggle(friend.id)}
                                            >
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-medium">
                                                        {friend.first_name?.[0] || friend.username[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                            {friend.first_name && friend.last_name
                                                                ? `${friend.first_name} ${friend.last_name}`
                                                                : friend.username
                                                            }
                                                        </p>
                                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                            @{friend.username}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedFriends.includes(friend.id)
                                                        ? 'border-primary-500 bg-primary-500'
                                                        : 'border-neutral-300 dark:border-dark-500'
                                                    }`}>
                                                    {selectedFriends.includes(friend.id) && (
                                                        <div className="w-2 h-2 bg-white rounded-sm" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleClose}
                                    disabled={isSending}
                                    className="flex-1"
                                >
                                    İptal
                                </Button>
                                <Button
                                    variant="gradient"
                                    onClick={handleSendInvitations}
                                    disabled={isSending || selectedFriends.length === 0}
                                    className="flex-1"
                                    iconLeft={isSending ? undefined : <PaperAirplaneIcon className="w-4 h-4" />}
                                >
                                    {isSending ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Gönderiliyor...</span>
                                        </div>
                                    ) : (
                                        `Seçili Kişileri Davet Et (${selectedFriends.length})`
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default InviteToEventModal; 