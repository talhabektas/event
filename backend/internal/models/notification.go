package models

import (
	"time"

	"gorm.io/gorm"
)

// NotificationType bildirim türünü belirtir (enum gibi)
type NotificationType string

const (
	NotificationTypeFriendRequest   NotificationType = "friend_request"
	NotificationTypeEventInvitation NotificationType = "event_invitation"
	NotificationTypeRoomInvitation  NotificationType = "room_invitation"
	NotificationTypeSystemMessage   NotificationType = "system_message"
	NotificationTypeDefault         NotificationType = "default"
)

// Notification, kullanıcıya gösterilecek bildirimleri temsil eder
type Notification struct {
	ID        uint64           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
	DeletedAt gorm.DeletedAt   `gorm:"index" json:"-"`
	UserID    uint64           `gorm:"index;not null" json:"user_id"` // Bildirimi alan kullanıcı
	User      User             `gorm:"foreignKey:UserID" json:"-"`
	Type      NotificationType `gorm:"type:varchar(50);not null;default:'default'" json:"type"`
	Message   string           `gorm:"not null" json:"message"`
	IsRead    bool             `gorm:"default:false" json:"is_read"`
	RelatedID *uint64          `gorm:"index" json:"related_id,omitempty"` // İlgili nesnenin ID'si (örneğin event_id, user_id)
}
