package services

import (
	"event/backend/internal/models"
	"event/backend/pkg/database"

	"gorm.io/gorm"
)

type NotificationService struct {
	db *gorm.DB
}

func NewNotificationService() *NotificationService {
	return &NotificationService{db: database.GetDB()}
}

func (s *NotificationService) GetNotificationsForUser(userID uint64) ([]models.Notification, error) {
	var notifications []models.Notification
	err := s.db.Where("user_id = ?", userID).Order("created_at desc").Find(&notifications).Error
	return notifications, err
}

func (s *NotificationService) MarkNotificationsAsRead(userID uint64, notificationIDs []uint64) error {
	return s.db.Model(&models.Notification{}).
		Where("user_id = ? AND id IN ?", userID, notificationIDs).
		Update("is_read", true).Error
}

func (s *NotificationService) CreateNotification(userID uint64, notificationType models.NotificationType, message string, relatedID *uint64) (*models.Notification, error) {
	notification := &models.Notification{
		UserID:    userID,
		Type:      notificationType,
		Message:   message,
		RelatedID: relatedID,
	}

	if err := s.db.Create(notification).Error; err != nil {
		return nil, err
	}
	return notification, nil
}
