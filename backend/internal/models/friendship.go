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
	ID          uint64 `gorm:"primarykey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
	RequesterID uint64         `gorm:"not null"`
	Requester   User           `gorm:"foreignKey:RequesterID"`
	AddresseeID uint64         `gorm:"not null"`
	Addressee   User           `gorm:"foreignKey:AddresseeID"`
	Status      string         `gorm:"not null"` // "pending", "accepted", "declined", "blocked"
}
