import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import apiService from '../../services/apiService'; // API servisi eklendi
import authService from '../../services/authService';
import { type ConversationRoom } from '../../services/roomService'; // Sohbet odası tipi eklendi

// DTO'lar ile uyumlu yeni interface'ler
interface Sender {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url: string;
}

export interface ChatMessage {
    id: number;
    content: string;
    timestamp: string;
    sender: Sender;
}

const ChatPage: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const { markRoomAsRead } = useApp();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roomDetails, setRoomDetails] = useState<ConversationRoom | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!chatId || !authUser) return;

        // WebSocket'i kapatmak için bir temizleme fonksiyonu
        const cleanup = () => {
            if (socketRef.current) {
                console.log("useEffect cleanup: WebSocket kapatılıyor.");
                socketRef.current.close(1000, "Component unmounting or chatId changed");
                socketRef.current = null;
            }
        };

        const initializeChat = async () => {
            // Önceki bağlantıyı veya effect'i temizle
            cleanup();

            try {
                console.log(`[ChatPage] Oda ve mesaj geçmişi yükleniyor - Oda ID: ${chatId}`);
                // 1. Oda detaylarını ve erişim kontrolünü yap
                const roomData = await apiService.get<ConversationRoom>(`/api/rooms/${chatId}`);
                setRoomDetails(roomData);

                // 2. Mesaj geçmişini yükle
                const messageHistory = await apiService.get<ChatMessage[]>(`/api/rooms/${chatId}/messages`);
                setMessages(messageHistory);
                setError(null); // Başarılı yüklemeden sonra hataları temizle

                // 2.1. Mesajları okundu olarak işaretle
                if (chatId) {
                    await markRoomAsRead(parseInt(chatId));
                    console.log(`[ChatPage] Oda ${chatId} okundu olarak işaretlendi`);
                }

                // 3. Yetkilendirme başarılıysa WebSocket'i kur
                const token = authService.getToken();
                console.log('[ChatPage] Token alındı:', token ? `${token.substring(0, 50)}...` : 'NULL');
                if (!token) {
                    setError('WebSocket bağlantısı için yetkilendirme tokenı bulunamadı.');
                    return;
                }

                console.log(`[ChatPage] WebSocket bağlantısı kuruluyor - Oda ID: ${chatId}`);
                const socketUrl = `ws://localhost:8082/api/ws/room/${chatId}?token=${token}`;
                console.log('[ChatPage] WebSocket URL:', socketUrl);
                const ws = new WebSocket(socketUrl);
                socketRef.current = ws;

                ws.onopen = () => {
                    console.log('WebSocket bağlantısı açıldı.');
                    setIsConnected(true);
                    setError(null);
                };

                ws.onmessage = (event) => {
                    try {
                        const receivedMessage = JSON.parse(event.data) as ChatMessage;
                        console.log('WebSocket mesaj alındı:', receivedMessage);
                        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    } catch (err) {
                        console.error('WebSocket mesajı parse edilirken hata:', err);
                    }
                };

                ws.onerror = (errEvent) => {
                    console.error('WebSocket hata olayı:', errEvent);
                    setError('WebSocket bağlantı hatası oluştu.');
                    setIsConnected(false);
                };

                ws.onclose = (closeEvent) => {
                    console.log(`WebSocket bağlantısı kapandı: Kod=${closeEvent.code}, Sebep=${closeEvent.reason}`);
                    setIsConnected(false);
                    // 1000 normal kapanma olduğundan, beklenmedik kapanmalar için hata göster
                    if (closeEvent.code !== 1000) {
                        setError('Bağlantı beklenmedik şekilde kapandı.');
                    }
                    socketRef.current = null;
                };

            } catch (err) {
                console.error("Sohbet yüklenirken hata:", err);
                setError("Sohbet yüklenemedi veya bu sohbeti görme yetkiniz yok.");
                setIsConnected(false);
                setTimeout(() => navigate('/odalar'), 3000);
            }
        };

        initializeChat();

        // Bu effect'in cleanup fonksiyonu
        return cleanup;

    }, [chatId, authUser?.id, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(newMessage.trim());
            setNewMessage('');
        } else {
            setError("Mesaj gönderilemiyor. Bağlantı aktif değil.");
        }
    };

    const getChatTitle = () => {
        if (!roomDetails) return `Sohbet (${chatId})`;
        if (roomDetails.is_dm && roomDetails.other_user) {
            return `${roomDetails.other_user.first_name} ${roomDetails.other_user.last_name}`;
        }
        return roomDetails.name;
    };

    if (!authUser) {
        return (
            <div className="p-4 text-red-500">
                Sohbeti görüntülemek için lütfen <Link to="/giris" className="underline">giriş yapın</Link>.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-gray-50">
            <header className="bg-white shadow-sm p-4 border-b border-gray-200">
                <div className="flex items-center">
                    <Link to="/odalar" className="text-gray-500 hover:text-gray-800 mr-4">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </Link>
                    <h1 className="text-lg font-semibold text-gray-800">{getChatTitle()}</h1>
                </div>
                <div className="text-xs mt-1 ml-10">
                    <span className={`px-2 py-1 rounded-full text-white text-xs ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
                        {isConnected ? 'Bağlı' : 'Bağlı Değil'}
                    </span>
                </div>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded" role="alert">
                    <p className="font-bold">Hata</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && !error && (
                    <p className="text-gray-500 text-center py-10">Henüz mesaj yok. İlk mesajı sen gönder!</p>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${msg.sender.id === authUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.sender.id !== authUser?.id && (
                            <img src={msg.sender.avatar_url || '/default-avatar.png'} alt={msg.sender.first_name} className="h-8 w-8 rounded-full" />
                        )}
                        <div
                            className={`p-3 rounded-lg max-w-xs lg:max-w-md break-words shadow-sm ${msg.sender.id === authUser?.id ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}
                        >
                            {msg.sender.id !== authUser?.id && (
                                <p className="font-semibold text-sm mb-0.5 text-blue-600">{`${msg.sender.first_name} ${msg.sender.last_name}`}</p>
                            )}
                            <p className="text-base">{msg.content}</p>
                            <p className={`text-xs mt-1 text-right ${msg.sender.id === authUser?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-gray-200 flex items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isConnected ? "Mesajınızı yazın..." : "Bağlantı bekleniyor..."}
                    className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow px-5"
                    disabled={!isConnected}
                />
                <button
                    type="submit"
                    className="ml-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={!isConnected || !newMessage.trim()}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatPage; 