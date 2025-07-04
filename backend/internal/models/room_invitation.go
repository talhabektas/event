package models

import (
	"time"

	"gorm.io/gorm"
)

// RoomInvitationStatusType davet durumlarını tanımlar
type RoomInvitationStatusType string

const (
	RoomInvitationPending   RoomInvitationStatusType = "pending"
	RoomInvitationAccepted  RoomInvitationStatusType = "accepted"
	RoomInvitationDeclined  RoomInvitationStatusType = "declined"
	RoomInvitationCancelled RoomInvitationStatusType = "cancelled" // Gönderen iptal ederse
)

// RoomInvitation bir kullanıcının bir odaya davetini temsil eder
type RoomInvitation struct {
	ID        uint64                   `gorm:"primaryKey;autoIncrement" json:"id"`
	RoomID    uint64                   `gorm:"not null;index" json:"room_id"`
	InviterID uint64                   `gorm:"not null;index" json:"inviter_id"`
	InviteeID uint64                   `gorm:"not null;index" json:"invitee_id"`
	Message   string                   `gorm:"type:text" json:"message"`
	Status    RoomInvitationStatusType `gorm:"type:varchar(20);default:'pending'" json:"status"`
	CreatedAt time.Time                `json:"created_at"`
	UpdatedAt time.Time                `json:"updated_at"`
	DeletedAt gorm.DeletedAt           `gorm:"index" json:"-"`

	// İlişkiler
	Room    Room `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	Inviter User `gorm:"foreignKey:InviterID" json:"inviter,omitempty"`
	Invitee User `gorm:"foreignKey:InviteeID" json:"invitee,omitempty"`
}

// TableName veritabanı tablo adını belirtir
func (RoomInvitation) TableName() string {
	return "room_invitations"
}
