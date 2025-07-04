package services

import (
	"event/backend/internal/models"
	"event/backend/internal/repository"
)

// UserService kullanıcı işlemlerini yöneten servis
type UserService struct {
	userRepo repository.UserRepository
}

// NewUserService yeni bir UserService örneği oluşturur.
// Bu fonksiyon artık repository'yi doğrudan kendisi oluşturuyor.
func NewUserService() *UserService {
	return &UserService{
		userRepo: repository.NewUserRepository(),
	}
}

// FindUserByID bir kullanıcıyı ID ile bulur
func (s *UserService) FindUserByID(id uint64) (*models.User, error) {
	return s.userRepo.FindByID(id)
}

// GetUserWithInterests bir kullanıcıyı ilgi alanlarıyla birlikte getirir
func (s *UserService) GetUserWithInterests(userID uint64) (*models.User, error) {
	return s.userRepo.FindByIDWithInterests(userID)
}

// GetFriends kullanıcının arkadaşlarını döndürür
func (s *UserService) GetFriends(userID uint64) ([]models.User, error) {
	return s.userRepo.GetUserFriends(userID)
}

// GetUserSuggestions kullanıcı için önerilen kullanıcıları veritabanından getirir.
func (s *UserService) GetUserSuggestions(userID uint64) ([]models.User, error) {
	return s.userRepo.FindSuggestionsByUserID(userID)
}

// GetUserAISuggestions kullanıcının kaydedilmiş AI önerilerini getirir
func (s *UserService) GetUserAISuggestions(userID uint64) ([]models.UserSuggestion, error) {
	return s.userRepo.GetUserAISuggestions(userID)
}

// SaveUserSuggestions kullanıcı için önerileri veritabanına kaydeder
func (s *UserService) SaveUserSuggestions(userID uint64, suggestions []string) error {
	return s.userRepo.SaveUserSuggestions(userID, suggestions)
}

// UpdateUser user'ı ve ilgi alanlarını günceller
func (s *UserService) UpdateUser(user *models.User, interests []uint) error {
	return s.userRepo.Update(user, interests)
}

// SearchUsers kullanıcıları arar
func (s *UserService) SearchUsers(query string, currentUserID uint64) ([]models.User, error) {
	return s.userRepo.Search(query, currentUserID)
}

// DeleteUserSuggestions kullanıcının tüm önerilerini siler
func (s *UserService) DeleteUserSuggestions(userID uint64) error {
	return s.userRepo.DeleteUserSuggestions(userID)
}
