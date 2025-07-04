package services

import (
	"event/backend/internal/models"
	"event/backend/internal/repository"
)

// InterestService ilgi alanlarıyla ilgili iş mantığını yönetir
type InterestService interface {
	GetAll() ([]models.Interest, error)
	UpdateUserInterests(userID uint, interestIDs []uint) (*models.User, error)
}

type interestService struct {
	interestRepo repository.InterestRepository
	userRepo     repository.UserRepository
}

// NewInterestService yeni bir InterestService örneği oluşturur
func NewInterestService(interestRepo repository.InterestRepository, userRepo repository.UserRepository) InterestService {
	return &interestService{
		interestRepo: interestRepo,
		userRepo:     userRepo,
	}
}

// GetAll tüm ilgi alanlarını getirir
func (s *interestService) GetAll() ([]models.Interest, error) {
	return s.interestRepo.FindAllInterests()
}

// UpdateUserInterests kullanıcının ilgi alanlarını günceller
func (s *interestService) UpdateUserInterests(userID uint, interestIDs []uint) (*models.User, error) {
	// 1. Önce kullanıcının mevcut ilgi alanlarını temizle
	// 2. Sonra yeni ilgi alanlarını ekle
	// Bu iki işlemi tek bir transaction içinde yapmak en iyisidir.
	// Repository katmanı bu transaction'ı yönetmelidir.
	user, err := s.userRepo.UpdateUserInterests(userID, interestIDs)
	if err != nil {
		return nil, err
	}
	return user, nil
}
