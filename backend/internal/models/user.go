package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User kullanıcı modeli
type User struct {
	ID                uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	Username          string         `gorm:"unique;not null;size:100" json:"username"`
	Email             string         `gorm:"unique;not null;size:255" json:"email"`
	PasswordHash      string         `gorm:"not null;size:255" json:"-"`
	FirstName         string         `gorm:"size:100" json:"first_name"`
	LastName          string         `gorm:"size:100" json:"last_name"`
	ProfilePictureURL string         `gorm:"size:255" json:"profile_picture_url"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`

	// İlişkiler
	Interests         []Interest      `gorm:"many2many:user_interests;" json:"interests,omitempty"`
	CreatedRooms      []Room          `gorm:"foreignKey:CreatorUserID" json:"created_rooms,omitempty"`
	RoomMemberships   []RoomMember    `gorm:"foreignKey:UserID" json:"room_memberships,omitempty"`
	CreatedEvents     []Event         `gorm:"foreignKey:CreatorUserID" json:"created_events,omitempty"`
	EventVotes        []EventVote     `gorm:"foreignKey:UserID" json:"event_votes,omitempty"`
	SentProposals     []EventProposal `gorm:"foreignKey:SuggesterUserID" json:"sent_proposals,omitempty"`
	ReceivedProposals []EventProposal `gorm:"foreignKey:RecipientUserID" json:"received_proposals,omitempty"`
}

// BeforeCreate GORM hook'u - oluşturulmadan önce
func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()
	return nil
}

// BeforeUpdate GORM hook'u - güncellenmeden önce
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	u.UpdatedAt = time.Now()
	return nil
}

// Kullanıcının şifresini kontrol eder
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
}
