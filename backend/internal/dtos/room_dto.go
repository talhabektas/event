package dtos

import "time"

// ConversationRoomDTO, kullanıcının sohbet listesindeki tek bir konuşmayı temsil eder.
// Bu yapı, frontend'deki ConversationRoom arayüzüyle eşleşmelidir.
type ConversationRoomDTO struct {
	ID          uint64          `json:"id"`
	Name        string          `json:"name"`
	IsDM        bool            `json:"is_dm"`
	OtherUser   *OtherUserDTO   `json:"other_user,omitempty"` // omitempty, eğer değer nil ise JSON'da görünmemesini sağlar.
	LastMessage *LastMessageDTO `json:"last_message,omitempty"`
}

// OtherUserDTO, bir DM'deki diğer kullanıcıyı temsil eder.
type OtherUserDTO struct {
	ID        uint64 `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	AvatarURL string `json:"avatar_url"`
}

// LastMessageDTO, bir sohbetteki son mesajı temsil eder.
type LastMessageDTO struct {
	Content    string    `json:"content"`
	Timestamp  time.Time `json:"timestamp"`
	SenderName string    `json:"sender_name"`
}

// CreateGroupChatRoomRequest, yeni bir grup sohbeti oluşturma isteğini temsil eder.
type CreateGroupChatRoomRequest struct {
	Name      string   `json:"name,omitempty"`
	MemberIDs []uint64 `json:"member_ids" binding:"required,min=1"`
}

// GetOrCreateDMRoomRequest, bir direkt mesaj odası oluşturma veya alma isteğini temsil eder.
type GetOrCreateDMRoomRequest struct {
	OtherUserID uint64 `json:"other_user_id" binding:"required"`
}
