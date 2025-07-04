package models

import "gorm.io/gorm"

// UserSuggestion stores AI-generated suggestions for a user.
type UserSuggestion struct {
	gorm.Model
	UserID         uint64 `gorm:"index;not null"`
	User           User   `gorm:"foreignKey:UserID"`
	SuggestionText string `gorm:"type:text;not null"`
}
