package models

import (
	"time"

	"gorm.io/gorm"
)

// EventInvitationStatusType davet durumlarını tanımlar
type EventInvitationStatusType string

const (
	InvitationPending   EventInvitationStatusType = "pending"
	InvitationAccepted  EventInvitationStatusType = "accepted"
	InvitationDeclined  EventInvitationStatusType = "declined"
	InvitationCancelled EventInvitationStatusType = "cancelled" // Gönderen iptal ederse
)

// EventInvitation bir kullanıcının bir etkinliğe davetini temsil eder
type EventInvitation struct {
	ID        uint64                    `gorm:"primaryKey;autoIncrement" json:"id"`
	EventID   uint64                    `gorm:"not null" json:"event_id"`
	Event     Event                     `gorm:"foreignKey:EventID" json:"event"`
	InviterID uint64                    `gorm:"not null" json:"inviter_id"` // Davet eden kullanıcı
	Inviter   User                      `gorm:"foreignKey:InviterID" json:"inviter"`
	InviteeID uint64                    `gorm:"not null" json:"invitee_id"` // Davet edilen kullanıcı
	Invitee   User                      `gorm:"foreignKey:InviteeID" json:"invitee"`
	Status    EventInvitationStatusType `gorm:"type:varchar(20);default:'pending'" json:"status"`
	CreatedAt time.Time                 `json:"created_at"`
	UpdatedAt time.Time                 `json:"updated_at"`
	DeletedAt gorm.DeletedAt            `gorm:"index" json:"deleted_at,omitempty"`
}
