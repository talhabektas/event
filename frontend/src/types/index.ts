export * from './event';

export interface Interest {
    id: number;
    name: string;
    category: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
    created_at: string;
    updated_at: string;
    interests?: Interest[];
}

export interface Room {
    id: number;
    name: string;
    creator_user_id: number;
    is_private: boolean;
    created_at: string;
    updated_at: string;
} 