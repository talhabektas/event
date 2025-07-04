package models

import (
	"time"

	"gorm.io/gorm"
)

// EventParticipationRequestStatusType katılım isteği durumlarını tanımlar
type EventParticipationRequestStatusType string

const (
	RequestPending  EventParticipationRequestStatusType = "pending"
	RequestApproved EventParticipationRequestStatusType = "approved"
	RequestRejected EventParticipationRequestStatusType = "rejected"
)

// EventParticipationRequest bir kullanıcının özel bir etkinliğe katılma isteğini temsil eder
type EventParticipationRequest struct {
	ID        uint64                              `gorm:"primaryKey"`
	EventID   uint64                              `gorm:"not null;uniqueIndex:idx_event_user_request"`
	Event     Event                               `gorm:"foreignKey:EventID"`
	UserID    uint64                              `gorm:"not null;uniqueIndex:idx_event_user_request"`
	User      User                                `gorm:"foreignKey:UserID"`
	Status    EventParticipationRequestStatusType `gorm:"type:varchar(20);default:'pending'"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
