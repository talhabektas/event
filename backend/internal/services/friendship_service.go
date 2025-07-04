package services

import (
	"errors"
	"event/backend/internal/models"
	"event/backend/internal/repository"
	"event/backend/pkg/database"
	"sort"

	"gorm.io/gorm"
)

// FriendshipService arkadaşlık işlemlerini yöneten servis
type FriendshipService struct {
	userRepo repository.UserRepository
}

// NewFriendshipService yeni bir FriendshipService örneği oluşturur
func NewFriendshipService(userRepo repository.UserRepository) *FriendshipService {
	return &FriendshipService{
		userRepo: userRepo,
	}
}

// CreateFriendshipRequest arkadaşlık isteği oluşturur
func (s *FriendshipService) CreateFriendshipRequest(requesterID, addresseeID uint64) error {
	db := database.GetDB()

	// Kendisiyle arkadaşlık kurma kontrolü
	if requesterID == addresseeID {
		return errors.New("kendinizle arkadaşlık kuramazsınız")
	}

	// Mevcut arkadaşlık kontrolü
	var existingFriendship models.Friendship
	err := db.Where("(requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)",
		requesterID, addresseeID, addresseeID, requesterID).First(&existingFriendship).Error

	if err == nil {
		// Kayıt bulundu, yani zaten bir ilişki var.
		return errors.New("bu kullanıcı ile zaten bir arkadaşlık ilişkisi var veya bekleyen bir istek mevcut")
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		// Kayıt bulunamadı hatası dışında bir hata oluştu.
		return err
	}

	// Yeni arkadaşlık isteği oluştur
	friendship := models.Friendship{
		RequesterID: requesterID,
		AddresseeID: addresseeID,
		Status:      "pending",
	}

	return db.Create(&friendship).Error
}

// AcceptFriendshipRequest arkadaşlık isteğini kabul eder
func (s *FriendshipService) AcceptFriendshipRequest(friendshipID, userID uint64) error {
	db := database.GetDB()

	// Arkadaşlık isteğini bul
	var friendship models.Friendship
	if err := db.First(&friendship, friendshipID).Error; err != nil {
		return errors.New("arkadaşlık isteği bulunamadı")
	}

	// İsteği kabul eden kişinin addressee olduğunu kontrol et
	if friendship.AddresseeID != userID {
		return errors.New("bu isteği kabul etme yetkiniz yok")
	}

	// İsteğin durumunu kontrol et
	if friendship.Status != "pending" {
		return errors.New("bu istek zaten işlenmiş")
	}

	// İsteği kabul et
	friendship.Status = "accepted"
	return db.Save(&friendship).Error
}

// DeclineFriendshipRequest arkadaşlık isteğini reddeder
func (s *FriendshipService) DeclineFriendshipRequest(friendshipID, userID uint64) error {
	db := database.GetDB()

	// Arkadaşlık isteğini bul
	var friendship models.Friendship
	if err := db.First(&friendship, friendshipID).Error; err != nil {
		return errors.New("arkadaşlık isteği bulunamadı")
	}

	// İsteği reddeden kişinin addressee olduğunu kontrol et
	if friendship.AddresseeID != userID {
		return errors.New("bu isteği reddetme yetkiniz yok")
	}

	// İsteğin durumunu kontrol et
	if friendship.Status != "pending" {
		return errors.New("bu istek zaten işlenmiş")
	}

	// İsteği reddet
	friendship.Status = "declined"
	return db.Save(&friendship).Error
}

// DeleteFriendship arkadaşlığı sonlandırır
func (s *FriendshipService) DeleteFriendship(friendshipID, userID uint64) error {
	db := database.GetDB()

	// Arkadaşlığı bul
	var friendship models.Friendship
	if err := db.First(&friendship, friendshipID).Error; err != nil {
		return errors.New("arkadaşlık bulunamadı")
	}

	// Kullanıcının arkadaşlığın bir parçası olduğunu kontrol et
	if friendship.RequesterID != userID && friendship.AddresseeID != userID {
		return errors.New("bu arkadaşlığı sonlandırma yetkiniz yok")
	}

	// Arkadaşlığı sil
	return db.Delete(&friendship).Error
}

// GetFriends kullanıcının arkadaşlarını listeler
func (s *FriendshipService) GetFriends(userID uint64) ([]models.User, error) {
	return s.userRepo.GetUserFriends(userID)
}

// GetPendingRequests gelen arkadaşlık isteklerini listeler
func (s *FriendshipService) GetPendingRequests(userID uint64) ([]models.Friendship, error) {
	db := database.GetDB()
	var requests []models.Friendship

	// Kullanıcıya gelen bekleyen istekleri getir
	if err := db.Where("addressee_id = ? AND status = ?", userID, "pending").
		Preload("Requester"). // İsteği gönderen kullanıcı bilgilerini de getir
		Preload("Addressee"). // İsteği alan kullanıcı bilgilerini de getir
		Find(&requests).Error; err != nil {
		return nil, err
	}

	return requests, nil
}

// FriendSuggestion bir arkadaş önerisini temsil eder
type FriendSuggestion struct {
	User            models.User `json:"user"`
	MatchScore      float64     `json:"match_score"`
	CommonInterests []string    `json:"common_interests"`
}

// GetFriendSuggestions kullanıcı için arkadaş önerileri döndürür
func (s *FriendshipService) GetFriendSuggestions(userID uint64) ([]FriendSuggestion, error) {
	// 1. Mevcut kullanıcıyı ve arkadaşlarını al
	user, err := s.userRepo.FindByIDWithInterests(userID)
	if err != nil {
		return nil, err
	}
	friends, err := s.userRepo.GetUserFriends(userID)
	if err != nil {
		return nil, err
	}

	// Arkadaş ID'lerini ve kendi ID'sini bir haritada tut
	friendIDs := make(map[uint64]bool)
	friendIDs[userID] = true
	for _, friend := range friends {
		friendIDs[friend.ID] = true
	}

	// Kullanıcının ilgi alanlarını bir haritada tut
	userInterests := make(map[uint64]string)
	for _, interest := range user.Interests {
		userInterests[interest.ID] = interest.Name
	}

	// 2. Potansiyel arkadaşları bul
	allUsers, err := s.userRepo.FindAllWithInterests()
	if err != nil {
		return nil, err
	}

	suggestions := make([]FriendSuggestion, 0)
	for _, potentialFriend := range allUsers {
		if _, isFriendOrSelf := friendIDs[potentialFriend.ID]; isFriendOrSelf {
			continue
		}

		matchScore := 0.0
		var commonInterests []string
		for _, pfInterest := range potentialFriend.Interests {
			if _, exists := userInterests[pfInterest.ID]; exists {
				matchScore += 25.0
				commonInterests = append(commonInterests, pfInterest.Name)
			}
		}

		// Ortak ilgi alanı olmasa bile kullanıcıyı ekle (base score 1.0)
		if matchScore == 0 {
			matchScore = 1.0
		}

		suggestions = append(suggestions, FriendSuggestion{
			User:            potentialFriend,
			MatchScore:      matchScore,
			CommonInterests: commonInterests,
		})
	}

	// 5. Önerileri puana göre sırala
	sort.Slice(suggestions, func(i, j int) bool {
		return suggestions[i].MatchScore > suggestions[j].MatchScore
	})

	if len(suggestions) > 10 {
		suggestions = suggestions[:10]
	}

	return suggestions, nil
}
