import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { websocketService, type ChatMessage } from '../../services/websocketService';
import { useAuth } from '../../contexts/AuthContext'; // Mevcut kullanıcı bilgisi için
import Button from '../../components/common/Button'; // Button bileşenini import et
import CreateEventModal, { type CreateEventFormData } from '../../components/events/CreateEventModal'; // CreateEventModal'ı ve FormData tipini import et
import eventService from '../../services/eventService'; // eventService'i import et
import { useApp } from '../../contexts/AppContext'; // addNotification için AppContext'i import et

const RoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { user: authUser } = useAuth(); // Giriş yapmış kullanıcıyı almak için `user` -> `authUser` olarak yeniden adlandırıldı
    const { addNotification } = useApp(); // addNotification fonksiyonunu al
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null); // Otomatik scroll için
    const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false); // Modal state'i
    const [isSubmittingEvent, setIsSubmittingEvent] = useState(false); // Etkinlik gönderme durumu için state

    useEffect(() => {
        if (!roomId) {
            setError('Oda ID\'si bulunamadı.');
            return;
        }
        if (!authUser) {
            setError('Mesajlaşmak için giriş yapmalısınız.');
            return;
        }

        console.log(`Oda ${roomId} için WebSocket bağlantısı kuruluyor.`);
        const ws = websocketService.connect(
            roomId,
            (receivedMessage) => {
                setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            },
            (errEvent) => {
                console.error('WebSocket hata olayı:', errEvent);
                setError(`WebSocket bağlantı hatası: ${errEvent.type}`);
                setIsConnected(false);
            },
            () => { // onOpen
                console.log('WebSocket bağlantısı açıldı.');
                setIsConnected(true);
                setError(null);
            },
            (closeEvent) => { // onClose
                console.log(`WebSocket bağlantısı kapandı: ${closeEvent.code} ${closeEvent.reason}`);
                setIsConnected(false);
                if (closeEvent.code !== 1000) { // 1000 normal kapanma
                    setError(`WebSocket bağlantısı beklenmedik şekilde kapandı: ${closeEvent.reason || closeEvent.code}`);
                }
            }
        );

        socketRef.current = ws;

        return () => {
            console.log('RoomPage unmount ediliyor, WebSocket bağlantısı kapatılıyor.');
            websocketService.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [roomId, authUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && socketRef.current && isConnected) {
            websocketService.sendMessage(newMessage.trim());
            setNewMessage('');
        } else if (!isConnected) {
            setError("Mesaj göndermek için WebSocket bağlantısı aktif değil.");
        }
    };

    // Etkinlik oluşturma modalı için submit handler
    const handleCreateEventSubmit = async (formData: CreateEventFormData) => {
        if (!roomId) {
            addNotification({
                message: 'Oda ID\'si bulunamadı.', type: 'error'
            });
            return;
        }

        setIsSubmittingEvent(true);
        try {
            await eventService.createEvent(formData);
            addNotification({ message: 'Etkinlik başarıyla oluşturuldu!', type: 'success' });
            setIsCreateEventModalOpen(false);
        } catch (error) {
            console.error("Etkinlik oluşturulurken hata:", error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
            addNotification({ message: `Etkinlik oluşturulamadı: ${errorMessage}`, type: 'error' });
        } finally {
            setIsSubmittingEvent(false);
        }
    };

    if (!roomId) {
        return <div className="p-4 text-red-500">Hata: Oda ID'si belirtilmemiş.</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] p-4 bg-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-blue-600">Oda: {roomId}</h1>
                {roomId && authUser && (
                    <Button
                        onClick={() => setIsCreateEventModalOpen(true)}
                        variant="primary"
                        size="small"
                    >
                        Etkinlik Ekle
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Hata!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            <div className="text-sm mb-2 text-center">
                Bağlantı Durumu: {isConnected ?
                    <span className="text-green-500 font-semibold">Bağlı</span> :
                    <span className="text-red-500 font-semibold">Bağlı Değil</span>}
            </div>

            <div className="flex-grow overflow-y-auto bg-white p-4 rounded-lg shadow mb-4">
                {messages.length === 0 && !error && isConnected && (
                    <p className="text-gray-500 text-center">Henüz mesaj yok. İlk mesajı sen gönder!</p>
                )}
                {messages.map((msg, index) => (
                    <div
                        key={msg.id || index}
                        className={`mb-3 p-3 rounded-lg max-w-xs lg:max-w-md break-words ${msg.user_id === authUser?.id ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-200 text-gray-800 mr-auto'}`}
                    >
                        <p className="font-semibold text-sm">{msg.username || `Kullanıcı ${msg.user_id}`}</p>
                        <p>{msg.content}</p>
                        <p className="text-xs mt-1 opacity-75">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center bg-white p-2 rounded-lg shadow">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-grow p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!isConnected}
                />
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-r-lg disabled:opacity-50"
                    disabled={!isConnected || !newMessage.trim()}
                >
                    Gönder
                </button>
            </form>

            {/* Etkinlik Ekleme Modal'ı */}
            {isCreateEventModalOpen && roomId && (
                <CreateEventModal
                    isOpen={isCreateEventModalOpen}
                    onClose={() => setIsCreateEventModalOpen(false)}
                    roomId={roomId}
                    onSubmit={handleCreateEventSubmit}
                    isLoading={isSubmittingEvent}
                />
            )}
        </div>
    );
};

export default RoomPage; 