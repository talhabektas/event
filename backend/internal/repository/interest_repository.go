package repository

import (
	"event/backend/internal/models"
	"event/backend/pkg/database"

	"gorm.io/gorm"
)

// InterestRepository ilgi alanları veritabanı işlemleri için arayüz
type InterestRepository interface {
	FindAllInterests() ([]models.Interest, error)
}

// interestRepository InterestRepository arayüzünü uygular
type interestRepository struct {
	db *gorm.DB
}

// NewInterestRepository yeni bir interest repository oluşturur
func NewInterestRepository() InterestRepository {
	return &interestRepository{
		db: database.GetDB(),
	}
}

// FindAllInterests tüm ilgi alanlarını getirir
func (r *interestRepository) FindAllInterests() ([]models.Interest, error) {
	var interests []models.Interest
	result := r.db.Find(&interests)
	return interests, result.Error
}
