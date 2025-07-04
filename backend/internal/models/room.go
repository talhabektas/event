package models

import (
	"time"

	"gorm.io/gorm"
)

// Room oda/grup modelini temsil eder
type Room struct {
	ID            uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	Name          string         `gorm:"not null;size:100" json:"name"`
	Description   string         `gorm:"type:text" json:"description"`
	CreatorUserID uint64         `gorm:"not null" json:"creator_user_id"`
	IsPublic      bool           `gorm:"default:false" json:"is_public"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// İlişkiler
	Creator User         `gorm:"foreignKey:CreatorUserID" json:"creator,omitempty"`
	Members []RoomMember `gorm:"foreignKey:RoomID" json:"members,omitempty"`
	Events  []Event      `gorm:"foreignKey:RoomID" json:"events,omitempty"`
}

// RoomMember oda üyelerini temsil eden ara tablo
type RoomMember struct {
	RoomID     uint64     `gorm:"primaryKey;not null" json:"room_id"`
	UserID     uint64     `gorm:"primaryKey;not null" json:"user_id"`
	Role       string     `gorm:"not null;default:'member';size:50" json:"role"`
	JoinedAt   time.Time  `json:"joined_at"`
	IsActive   bool       `gorm:"default:true" json:"is_active"`
	LastReadAt *time.Time `json:"last_read_at,omitempty"` // Son mesaj okunma zamanı

	// İlişkiler
	Room Room `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
