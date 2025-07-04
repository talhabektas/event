import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { eventService } from '../../services';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { Notification as SystemNotification } from '../../services/apiService';

const NotificationDropdown: React.FC = () => {
    const {
        systemNotifications,
        unreadNotificationCount,
        markSystemNotificationsAsRead,
        addNotification,
        fetchSystemNotifications
    } = useApp();

    const navigate = useNavigate();

    const handleNotificationClick = (notification: SystemNotification) => {
        markSystemNotificationsAsRead([notification.id]);
        if (notification.related_id) {
            switch (notification.type) {
                case 'new_message':
                    navigate(`/rooms/${notification.related_id}`);
                    break;
                case 'friend_request':
                    navigate('/arkadaslar');
                    break;
                case 'event_invitation':
                case 'event_join_request':
                    navigate(`/etkinlikler/${notification.related_id}`);
                    break;
                case 'room_invitation':
                    navigate(`/odalar/${notification.related_id}`);
                    break;
            }
        }
    };

    const handleAction = async (e: React.MouseEvent, action: 'approve' | 'decline', requestId: number, notificationId: number) => {
        e.stopPropagation();
        try {
            if (action === 'approve') {
                await eventService.approveRequest(requestId);
                addNotification({ type: 'success', message: 'İstek onaylandı.' });
            } else {
                await eventService.declineRequest(requestId);
                addNotification({ type: 'info', message: 'İstek reddedildi.' });
            }
            await markSystemNotificationsAsRead([notificationId]);
        } catch (error) {
            console.error(`${action} failed:`, error);
            addNotification({ type: 'error', message: 'İşlem sırasında hata oluştu.' });
        }
    };

    const handleRoomInvitationAction = async (e: React.MouseEvent, action: 'accept' | 'decline', invitationId: number, notificationId: number) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8082/api/rooms/invitations/${invitationId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Room invitation action failed');
            }

            if (action === 'accept') {
                addNotification({ type: 'success', message: 'Oda daveti kabul edildi!' });
            } else {
                addNotification({ type: 'info', message: 'Oda daveti reddedildi.' });
            }

            await markSystemNotificationsAsRead([notificationId]);
            await fetchSystemNotifications(); // Bildirimleri yenile
        } catch (error) {
            console.error(`Room invitation ${action} failed:`, error);
            addNotification({ type: 'error', message: 'İşlem sırasında hata oluştu.' });
        }
    };

    const renderNotificationContent = (notification: SystemNotification) => {
        if (notification.type === 'event_join_request' && notification.related_id) {
            const requestId = notification.related_id;
            return (
                <div>
                    <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={(e) => handleAction(e, 'approve', requestId, notification.id)}
                            className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600"
                        >
                            Onayla
                        </button>
                        <button
                            onClick={(e) => handleAction(e, 'decline', requestId, notification.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600"
                        >
                            Reddet
                        </button>
                    </div>
                </div>
            );
        }

        if (notification.type === 'room_invitation' && notification.related_id) {
            // Room invitation bildirimlerinde related_id artık invitation_id'dir
            const invitationId = notification.related_id;
            return (
                <div>
                    <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={(e) => handleRoomInvitationAction(e, 'accept', invitationId, notification.id)}
                            className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600"
                        >
                            Kabul Et
                        </button>
                        <button
                            onClick={(e) => handleRoomInvitationAction(e, 'decline', invitationId, notification.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600"
                        >
                            Reddet
                        </button>
                    </div>
                </div>
            );
        }

        return <p className="text-sm text-gray-700">{notification.message}</p>;
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="p-2 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900 px-2 py-1">Bildirimler</h3>
                {unreadNotificationCount > 0 && (
                    <button
                        onClick={() => markSystemNotificationsAsRead(systemNotifications.map(n => n.id))}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                        Tümünü Okundu Say
                    </button>
                )}
            </div>
            <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {systemNotifications.length > 0 ? (
                    systemNotifications.map((notification) => (
                        <li
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-3 cursor-pointer ${notification.is_read ? 'bg-white' : 'bg-indigo-50'} hover:bg-gray-100`}
                        >
                            <div className="flex items-start">
                                {!notification.is_read && (
                                    <div className="flex-shrink-0">
                                        <span className="inline-block h-2 w-2 rounded-full bg-indigo-600"></span>
                                    </div>
                                )}
                                <div className="ml-2 flex-grow">
                                    {renderNotificationContent(notification)}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: tr })}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))
                ) : (
                    <div className="p-4 text-sm text-gray-500 text-center">
                        Yeni bildiriminiz yok.
                    </div>
                )}
            </ul>
        </div>
    );
};

export default NotificationDropdown;