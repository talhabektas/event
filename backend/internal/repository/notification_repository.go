package repository

import (
	"event/backend/pkg/database"

	"gorm.io/gorm"
)

type NotificationRepository interface {
	// Gerekli metodları buraya ekleyeceğiz
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository() NotificationRepository {
	return &notificationRepository{
		db: database.GetDB(),
	}
}
