package models

import (
	"time"

	"gorm.io/gorm"
)

// Interest ilgi alanını temsil eder
type Interest struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string         `gorm:"unique;not null;size:100" json:"name"`
	Category  string         `gorm:"size:100" json:"category"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// İlişkiler
	Users []User `gorm:"many2many:user_interests;" json:"users,omitempty"`
}

// UserInterest kullanıcıların ilgi alanlarını temsil eden ara tablo
type UserInterest struct {
	UserID     uint64    `gorm:"primaryKey;not null" json:"user_id"`
	InterestID uint64    `gorm:"primaryKey;not null" json:"interest_id"`
	CreatedAt  time.Time `json:"created_at"`

	// İlişkiler
	User     User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Interest Interest `gorm:"foreignKey:InterestID" json:"interest,omitempty"`
}
