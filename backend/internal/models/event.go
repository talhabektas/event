package models

import (
	"time"

	"gorm.io/gorm"
)

// Event etkinlik bilgilerini temsil eder
type Event struct {
	ID             uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	Title          string         `gorm:"not null;size:255" json:"title"`
	Description    string         `gorm:"type:text" json:"description"`
	Location       string         `gorm:"size:255" json:"location"`
	CreatorUserID  uint64         `gorm:"not null" json:"creator_user_id"`
	RoomID         *uint64        `gorm:"index" json:"room_id,omitempty"`
	IsPrivate      bool           `gorm:"default:false" json:"is_private"`
	ImageURL       string         `gorm:"size:255" json:"image_url,omitempty"`
	FinalStartTime *time.Time     `json:"final_start_time,omitempty"`
	FinalEndTime   *time.Time     `json:"final_end_time,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// İlişkiler
	Creator     User              `gorm:"foreignKey:CreatorUserID" json:"creator,omitempty"`
	Room        *Room             `gorm:"foreignKey:RoomID;references:ID" json:"room,omitempty"`
	TimeOptions []EventTimeOption `gorm:"foreignKey:EventID" json:"time_options,omitempty"`
	Proposals   []EventProposal   `gorm:"foreignKey:EventID" json:"proposals,omitempty"`
}

// EventTimeOption etkinlik için zaman seçeneklerini temsil eder
type EventTimeOption struct {
	ID         uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	EventID    uint64         `gorm:"not null" json:"event_id"`
	StartTime  time.Time      `json:"start_time"`
	EndTime    time.Time      `json:"end_time"`
	VotesCount int            `gorm:"default:0" json:"votes_count"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	// İlişkiler
	Event Event       `gorm:"foreignKey:EventID" json:"event,omitempty"`
	Votes []EventVote `gorm:"foreignKey:EventTimeOptionID" json:"votes,omitempty"`
}

// EventVote etkinlik zaman seçeneği için oyları temsil eder
type EventVote struct {
	UserID            uint64    `gorm:"primaryKey;not null" json:"user_id"`
	EventTimeOptionID uint64    `gorm:"primaryKey;not null" json:"event_time_option_id"`
	VotedAt           time.Time `json:"voted_at"`

	// İlişkiler
	User       User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TimeOption EventTimeOption `gorm:"foreignKey:EventTimeOptionID" json:"time_option,omitempty"`
}
