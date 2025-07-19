package models

import (
	"time"

	"gorm.io/gorm"
)

// FriendshipStatus arkadaşlık durumları için enum
type FriendshipStatus string

const (
	FriendshipPending  FriendshipStatus = "pending"
	FriendshipAccepted FriendshipStatus = "accepted"
	FriendshipDeclined FriendshipStatus = "declined"
	FriendshipBlocked  FriendshipStatus = "blocked"
)

// Friendship kullanıcılar arasındaki arkadaşlık ilişkisini temsil eder
type Friendship struct {
	ID          uint64         `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	RequesterID uint64         `gorm:"not null" json:"requester_id"`
	Requester   User           `gorm:"foreignKey:RequesterID" json:"requester"`
	AddresseeID uint64         `gorm:"not null" json:"addressee_id"`
	Addressee   User           `gorm:"foreignKey:AddresseeID" json:"addressee"`
	Status      string         `gorm:"not null" json:"status"` // "pending", "accepted", "declined", "blocked"
}
