package repository

import (
	"event/backend/internal/models"
	"event/backend/pkg/database"

	"gorm.io/gorm"
)

// UserRepository kullanıcı veritabanı işlemleri için arayüz
type UserRepository interface {
	FindByID(id uint64) (*models.User, error)
	FindByIDWithInterests(id uint64) (*models.User, error)
	GetUserFriends(userID uint64) ([]models.User, error)
	FindSuggestionsByUserID(userID uint64) ([]models.User, error)
	GetUserAISuggestions(userID uint64) ([]models.UserSuggestion, error)
	DeleteUserSuggestions(userID uint64) error
	SaveUserSuggestions(userID uint64, suggestions []string) error
	FindAllWithInterests() ([]models.User, error)
	Update(user *models.User, interests []uint) error
	Search(query string, currentUserID uint64) ([]models.User, error)
	FindUserFriends(userID uint) ([]models.User, error)
	UpdateUserInterests(userID uint, interestIDs []uint) (*models.User, error)
}

// userRepository UserRepository arayüzünü uygular
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository yeni bir user repository oluşturur
func NewUserRepository() UserRepository {
	return &userRepository{
		db: database.GetDB(),
	}
}

// FindByID ID ile bir kullanıcıyı getirir
func (r *userRepository) FindByID(id uint64) (*models.User, error) {
	var user models.User
	result := r.db.First(&user, id)
	return &user, result.Error
}

// FindByIDWithInterests ID ile bir kullanıcıyı ve ilgi alanlarını getirir
func (r *userRepository) FindByIDWithInterests(id uint64) (*models.User, error) {
	var user models.User
	result := r.db.
		Preload("Interests").
		First(&user, id)
	return &user, result.Error
}

// GetUserFriends, belirtilen kullanıcının arkadaşlarının listesini döndürür.
func (r *userRepository) GetUserFriends(userID uint64) ([]models.User, error) {
	var friendships []models.Friendship
	var friendIDs []uint64

	err := r.db.Where("(requester_id = ? OR addressee_id = ?) AND status = ?", userID, userID, "accepted").Find(&friendships).Error
	if err != nil {
		return nil, err
	}

	if len(friendships) == 0 {
		return []models.User{}, nil
	}

	for _, f := range friendships {
		if f.RequesterID == userID {
			friendIDs = append(friendIDs, f.AddresseeID)
		} else {
			friendIDs = append(friendIDs, f.RequesterID)
		}
	}

	if len(friendIDs) == 0 {
		return []models.User{}, nil
	}

	var friends []models.User
	if err := r.db.Where("id IN ?", friendIDs).Preload("Interests").Find(&friends).Error; err != nil {
		return nil, err
	}

	return friends, nil
}

// FindSuggestionsByUserID kullanıcı için önerilen kullanıcıları veritabanından getirir.
func (r *userRepository) FindSuggestionsByUserID(userID uint64) ([]models.User, error) {
	var friends []models.User
	var friendIDs []uint64

	friends, err := r.GetUserFriends(userID)
	if err != nil {
		return nil, err
	}
	for _, friend := range friends {
		friendIDs = append(friendIDs, friend.ID)
	}

	excludedIDs := append(friendIDs, userID)

	var suggestions []models.User
	query := r.db.Order("RAND()").Limit(10)

	if len(excludedIDs) > 0 {
		query = query.Where("id NOT IN ?", excludedIDs)
	}

	err = query.Find(&suggestions).Error
	if err != nil {
		return nil, err
	}

	return suggestions, nil
}

// GetUserAISuggestions kullanıcının kaydedilmiş AI önerilerini getirir
func (r *userRepository) GetUserAISuggestions(userID uint64) ([]models.UserSuggestion, error) {
	var suggestions []models.UserSuggestion
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&suggestions).Error
	return suggestions, err
}

// DeleteUserSuggestions kullanıcı için kaydedilmiş tüm önerileri siler
func (r *userRepository) DeleteUserSuggestions(userID uint64) error {
	err := r.db.Where("user_id = ?", userID).Delete(&models.UserSuggestion{}).Error
	return err
}

// SaveUserSuggestions kullanıcı için önerileri veritabanına kaydeder
func (r *userRepository) SaveUserSuggestions(userID uint64, suggestions []string) error {
	tx := r.db.Begin()

	if err := tx.Where("user_id = ?", userID).Delete(&models.UserSuggestion{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	for _, s := range suggestions {
		suggestion := models.UserSuggestion{
			UserID:         userID,
			SuggestionText: s,
		}
		if err := tx.Create(&suggestion).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

// FindAllWithInterests tüm kullanıcıları ilgi alanlarıyla birlikte döndürür
func (r *userRepository) FindAllWithInterests() ([]models.User, error) {
	var users []models.User
	err := r.db.Preload("Interests").Find(&users).Error
	return users, err
}

// Update kullanıcıyı ve ilişkili ilgi alanlarını günceller
func (r *userRepository) Update(user *models.User, interestIDs []uint) error {
	tx := r.db.Begin()

	if err := tx.Save(user).Error; err != nil {
		tx.Rollback()
		return err
	}

	if interestIDs != nil {
		var interests []models.Interest
		if err := tx.Where("id IN ?", interestIDs).Find(&interests).Error; err != nil {
			tx.Rollback()
			return err
		}
		if err := tx.Model(user).Association("Interests").Replace(interests); err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

// Search, kullanıcı adlarına, adlarına veya soyadlarına göre kullanıcıları arar.
func (r *userRepository) Search(query string, currentUserID uint64) ([]models.User, error) {
	var users []models.User
	likeQuery := "%" + query + "%"
	err := r.db.Where("(username LIKE ? OR first_name LIKE ? OR last_name LIKE ?) AND id != ?", likeQuery, likeQuery, likeQuery, currentUserID).
		Limit(10).
		Find(&users).Error
	return users, err
}

// FindUserFriends bir kullanıcının 'accepted' durumundaki tüm arkadaşlarını getirir.
func (r *userRepository) FindUserFriends(userID uint) ([]models.User, error) {
	var friendships []models.Friendship
	err := r.db.Where("(requester_id = ? OR addressee_id = ?) AND status = ?", userID, userID, "accepted").Find(&friendships).Error
	if err != nil {
		return nil, err
	}

	var friendIDs []uint64
	for _, f := range friendships {
		if f.RequesterID == uint64(userID) {
			friendIDs = append(friendIDs, f.AddresseeID)
		} else {
			friendIDs = append(friendIDs, f.RequesterID)
		}
	}

	if len(friendIDs) == 0 {
		return []models.User{}, nil
	}

	var friends []models.User
	err = r.db.Where("id IN ?", friendIDs).Find(&friends).Error
	if err != nil {
		return nil, err
	}

	return friends, nil
}

// UpdateUserInterests, bir kullanıcının ilgi alanlarını günceller.
// Bu işlem bir transaction içinde gerçekleştirilir.
func (r *userRepository) UpdateUserInterests(userID uint, interestIDs []uint) (*models.User, error) {
	tx := r.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	// 1. Kullanıcının mevcut tüm ilgi alanı ilişkilerini sil
	if err := tx.Where("user_id = ?", userID).Delete(&models.UserInterest{}).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 2. Yeni ilgi alanlarını oluştur
	if len(interestIDs) > 0 {
		var userInterests []models.UserInterest
		for _, interestID := range interestIDs {
			userInterests = append(userInterests, models.UserInterest{
				UserID:     uint64(userID),
				InterestID: uint64(interestID),
			})
		}

		if err := tx.Create(&userInterests).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	// 3. Güncellenmiş kullanıcı bilgisini ve ilişkili ilgi alanlarını getir
	var user models.User
	if err := tx.Preload("Interests").First(&user, userID).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Her şey yolundaysa transaction'ı onayla
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &user, nil
}
