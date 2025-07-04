package repository

import (
	"event/backend/pkg/database"

	"gorm.io/gorm"
)

type FriendshipRepository interface {
	// Gerekli metodları buraya ekleyeceğiz
}

type friendshipRepository struct {
	db *gorm.DB
}

func NewFriendshipRepository() FriendshipRepository {
	return &friendshipRepository{
		db: database.GetDB(),
	}
}
