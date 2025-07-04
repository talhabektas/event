package models

import (
	"time"

	"gorm.io/gorm"
)

// EventAttendanceStatusType katılım durumlarını tanımlar
type EventAttendanceStatusType string

const (
	AttendanceAttending EventAttendanceStatusType = "attending"
	AttendanceCancelled EventAttendanceStatusType = "cancelled" // Örnek, ileride kullanılabilir
)

// EventAttendance bir kullanıcının bir etkinliğe katılımını temsil eder
type EventAttendance struct {
	ID        uint64                    `gorm:"primaryKey;autoIncrement" json:"id"`
	EventID   uint64                    `gorm:"uniqueIndex:idx_event_user" json:"event_id"`
	Event     Event                     `gorm:"foreignKey:EventID" json:"event"` // İlişkili etkinlik
	UserID    uint64                    `gorm:"uniqueIndex:idx_event_user" json:"user_id"`
	User      User                      `gorm:"foreignKey:UserID" json:"user"` // Katılan kullanıcı
	Status    EventAttendanceStatusType `gorm:"type:varchar(20);default:'attending'" json:"status"`
	JoinedAt  time.Time                 `json:"joined_at"` // Katılma zamanı
	CreatedAt time.Time                 `json:"created_at"`
	UpdatedAt time.Time                 `json:"updated_at"`
	DeletedAt gorm.DeletedAt            `gorm:"index" json:"deleted_at,omitempty"`
}

// EventAttendanceStatus katılım durumlarını tanımlar (bu model için doğrudan kullanılmayabilir ama genel bir bilgi)
// type EventAttendanceStatus string

// const (
// 	AttendingEvent EventAttendanceStatus = "attending"
// 	CancelledEvent EventAttendanceStatus = "cancelled"
// )
