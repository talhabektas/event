package repository

import (
	"event/backend/internal/models"
	"event/backend/pkg/database"

	"gorm.io/gorm"
)

// RoomRepository oda veritabanı işlemleri için arayüz
type RoomRepository interface {
	GetUserRoomMemberships(userID uint64) ([]models.RoomMember, error)
}

// roomRepository RoomRepository arayüzünü uygular
type roomRepository struct {
	db *gorm.DB
}

// NewRoomRepository yeni bir room repository oluşturur
func NewRoomRepository() RoomRepository {
	return &roomRepository{
		db: database.GetDB(),
	}
}

// GetUserRoomMemberships kullanıcının üye olduğu odaları getirir
func (r *roomRepository) GetUserRoomMemberships(userID uint64) ([]models.RoomMember, error) {
	var memberships []models.RoomMember
	result := r.db.
		Where("user_id = ? AND is_active = ?", userID, true).
		Preload("Room").
		Find(&memberships)
	return memberships, result.Error
}
