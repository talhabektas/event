export interface Event {
    id: number;
    title: string;
    description: string;
    location: string;
    creator_user_id: number;
    room_id?: number;
    is_private: boolean;
    image_url?: string;
    final_start_time?: string;
    final_end_time?: string;
    created_at: string;
    updated_at: string;
    creator?: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_picture_url?: string;
    };
    time_options?: EventTimeOption[];
}

export interface EventTimeOption {
    id: number;
    event_id: number;
    start_time: string;
    end_time: string;
    votes_count: number;
    created_at: string;
    updated_at: string;
}

export interface CreateEventDTO {
    title: string;
    description: string;
    location?: string;
    time_options: string[];
    is_private?: boolean;
    room_id?: number;
    image_url?: string;
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {
    id: number;
} 