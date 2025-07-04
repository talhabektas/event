import apiService from './apiService';
import type { User } from './authService';

// INTERFACES

export interface RoomItem {
    id: number;
    name: string;
    description: string;
    is_public: boolean;
    creator_user_id: number;
    created_at: string;
    updated_at: string;
    membersCount: number;
    eventsCount: number;
    creatorName: string;
    isPublic?: boolean;   // Mapped for frontend use
    isCreator?: boolean;  // Mapped for frontend use
    isMember?: boolean;   // Mapped for frontend use
}

export interface RoomDetails extends RoomItem {
    events?: any[]; // TODO: Replace 'any' with a specific Event type
    members?: RoomMember[];
}

export interface RoomMember {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
    joined_at: string;
}

export interface ConversationRoom {
    id: number;
    name: string;
    is_dm: boolean;
    other_user?: {
        id: number;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
    last_message?: {
        content: string;
        timestamp: string;
        sender_name: string;
    };
}

// SERVICE OBJECT

const roomService = {

    /**
     * Fetches all conversations (rooms) for the current user.
     */
    getMyConversations: async (): Promise<ConversationRoom[]> => {
        try {
            const conversations = await apiService.get<ConversationRoom[]>('/api/rooms/me');
            return conversations || [];
        } catch (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }
    },

    /**
     * Fetches a list of public rooms.
     */
    getRooms: async (filter: string = 'all'): Promise<RoomItem[]> => {
        try {
            const roomsFromApi = await apiService.get<any[]>(`/api/rooms?filter=${filter}`);
            if (!Array.isArray(roomsFromApi)) {
                console.error("getRooms: API response is not an array:", roomsFromApi);
                return [];
            }
            return roomsFromApi.map(dto => ({
                id: dto.id,
                name: dto.name,
                description: dto.description,
                is_public: dto.is_public,
                creator_user_id: dto.creator_user_id,
                created_at: dto.created_at,
                updated_at: dto.updated_at,
                membersCount: dto.members_count || 0,
                eventsCount: dto.events_count || 0,
                creatorName: dto.creator_name || 'Bilinmeyen',
                isPublic: dto.is_public,
                isMember: dto.is_member,
            }));
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return [];
        }
    },

    /**
     * Fetches details for a single room by its ID.
     */
    getRoomById: async (id: number | string): Promise<RoomDetails | null> => {
        try {
            const roomId = typeof id === 'string' ? parseInt(id, 10) : id;
            if (isNaN(roomId)) {
                console.error('Invalid room ID provided:', id);
                return null;
            }
            const roomData = await apiService.get<any>(`/api/rooms/${roomId}`);
            return roomData ? { ...roomData, isPublic: roomData.is_public } : null;
        } catch (error) {
            console.error(`Error fetching room ${id}:`, error);
            return null;
        }
    },

    /**
     * Creates a new room.
     */
    createRoom: async (roomData: { name: string; description: string; isPublic: boolean }): Promise<RoomItem | null> => {
        try {
            const payload = {
                name: roomData.name,
                description: roomData.description,
                is_public: roomData.isPublic
            };
            const response = await apiService.post<RoomItem>('/api/rooms', payload);
            return response ? { ...response, isPublic: response.is_public } : null;
        } catch (error) {
            console.error('Error creating room:', error);
            return null;
        }
    },

    /**
     * Updates an existing room.
     */
    updateRoom: async (roomId: number, roomData: Partial<RoomItem>): Promise<RoomItem | null> => {
        try {
            const payload: any = { ...roomData };
            if (roomData.isPublic !== undefined) {
                payload.is_public = roomData.isPublic;
                delete payload.isPublic;
            }
            const response = await apiService.put<RoomItem>(`/api/rooms/${roomId}`, payload);
            return response ? { ...response, isPublic: response.is_public } : null;
        } catch (error) {
            console.error(`Error updating room ${roomId}:`, error);
            return null;
        }
    },

    /**
     * Deletes a room.
     */
    deleteRoom: async (roomId: number): Promise<void> => {
        try {
            await apiService.delete(`/api/rooms/${roomId}`);
        } catch (error) {
            console.error(`Error deleting room ${roomId}:`, error);
            throw error;
        }
    },

    /**
     * Fetches members of a specific room.
     */
    getRoomMembers: async (roomId: number | string): Promise<RoomMember[]> => {
        try {
            const members = await apiService.get<RoomMember[]>(`/api/rooms/${roomId}/members`);
            return members || [];
        } catch (error) {
            console.error(`Error fetching members for room ${roomId}:`, error);
            return [];
        }
    },

    /**
     * Adds a member to a specific room.
     */
    addMember: async (roomId: number | string, userId: number): Promise<void> => {
        try {
            await apiService.post(`/api/rooms/${roomId}/members`, { user_id: userId });
        } catch (error) {
            console.error(`Error adding member ${userId} to room ${roomId}:`, error);
            throw error;
        }
    },

    /**
     * Removes a member from a specific room.
     */
    removeMember: async (roomId: number | string, userId: number): Promise<void> => {
        try {
            await apiService.delete(`/api/rooms/${roomId}/members/${userId}`);
        } catch (error) {
            console.error(`Error removing member ${userId} from room ${roomId}:`, error);
            throw error;
        }
    },

    /**
     * Gets or creates a Direct Message (DM) room with another user.
     */
    getOrCreateDMRoom: async (user2Id: number): Promise<{ numericDMRoomId: number }> => {
        try {
            const response = await apiService.post<any>('/api/rooms/dm', {
                other_user_id: user2Id
            });
            // Backend direkt room objesi döndürüyor, room.id'yi numericDMRoomId olarak döndür
            return { numericDMRoomId: response.id };
        } catch (error) {
            console.error('Error getting or creating DM room:', error);
            throw error;
        }
    },

    /**
     * Creates a group chat room with multiple members.
     */
    createGroupChatRoom: async (data: { name: string; member_ids: number[] }): Promise<any> => {
        try {
            const response = await apiService.post<any>('/api/rooms/group-chat', {
                name: data.name,
                member_ids: data.member_ids
            });
            return response;
        } catch (error) {
            console.error('Error creating group chat room:', error);
            throw error;
        }
    }
};

export default roomService; 