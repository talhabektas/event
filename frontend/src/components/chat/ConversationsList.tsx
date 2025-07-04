import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import roomService, { type ConversationRoom } from '../../services/roomService';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

interface ConversationsListProps {
    onClose: () => void; // Menüyü kapatmak için prop
}

const ConversationsList: React.FC<ConversationsListProps> = ({ onClose }) => {
    const [conversations, setConversations] = useState<ConversationRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setIsLoading(true);
                const data = await roomService.getMyConversations();
                setConversations(data);
                setError(null);
            } catch (err) {
                setError('Sohbetler yüklenemedi.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, []);

    const getDisplayName = (conv: ConversationRoom) => {
        if (conv.is_dm && conv.other_user) {
            return `${conv.other_user.first_name} ${conv.other_user.last_name}`;
        }
        return conv.name;
    };

    const renderLastMessage = (conv: ConversationRoom) => {
        if (!conv.last_message) return <p className="text-sm text-gray-500 italic">Henüz mesaj yok.</p>;

        const sender = conv.last_message.sender_name === `${currentUser?.first_name} ${currentUser?.last_name}`
            ? 'Siz'
            : conv.last_message.sender_name.split(' ')[0];

        const content = conv.last_message.content;
        const shortContent = content.length > 25 ? `${content.substring(0, 25)}...` : content;

        return (
            <p className="text-sm text-gray-600 truncate">
                <span className="font-semibold">{sender}:</span> {shortContent}
            </p>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-4">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-sm text-red-600">{error}</div>;
    }

    return (
        <div className="max-h-96 overflow-y-auto">
            {conversations.length > 0 ? (
                conversations.map((conv) => (
                    <Link
                        key={conv.id}
                        to={`/chat/${conv.id}`}
                        onClick={onClose}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex-shrink-0 mr-3">
                            {conv.is_dm ? (
                                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                            ) : (
                                <UsersIcon className="h-10 w-10 text-gray-400" />
                            )}
                        </div>
                        <div className="w-full">
                            <p className="font-semibold text-gray-800 truncate">{getDisplayName(conv)}</p>
                            {renderLastMessage(conv)}
                        </div>
                    </Link>
                ))
            ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                    Henüz bir sohbetiniz bulunmuyor.
                </div>
            )}
        </div>
    );
};

export default ConversationsList; 