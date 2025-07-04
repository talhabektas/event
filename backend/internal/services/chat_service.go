package services

import (
	"errors"
	"event/backend/internal/dtos"
	"event/backend/internal/models"
	"event/backend/pkg/database" // Veritabanı bağlantısı için

	"log"
	"time"

	"gorm.io/gorm"
)

// ChatServiceInput, ChatService için bağımlılıkları içerir.
type ChatServiceInput struct {
	DB          *gorm.DB
	UserService *UserService
}

// ChatService, sohbet mesajlarıyla ilgili işlemleri yönetir.
type ChatService struct {
	db          *gorm.DB
	userService *UserService
}

// NewChatService, yeni bir ChatService örneği oluşturur.
func NewChatService(input ChatServiceInput) *ChatService {
	return &ChatService{
		db:          input.DB,
		userService: input.UserService,
	}
}

// CreateMessage yeni bir sohbet mesajını veritabanına kaydeder.
// Mesajın UserID, RoomID ve Content alanları dolu gelmelidir.
// Username alanı Hub tarafından mesaj yayınlanmadan önce doldurulabilir.
func (s *ChatService) CreateMessage(roomID uint64, userID uint64, content string) (*models.Message, error) {
	db := database.GetDB()

	// Önce kullanıcıyı alalım (Preload için gerekli olacak)
	user, err := s.userService.FindUserByID(userID)
	if err != nil {
		log.Printf("[ChatService.CreateMessage] Hata: Kullanıcı bulunamadı, ID: %d, Hata: %v", userID, err)
		return nil, err
	}

	log.Printf("[ChatService.CreateMessage] Başladı - RoomID: %d, UserID: %d, Content: %s", roomID, userID, content)

	message := models.Message{
		RoomID:    roomID,
		UserID:    userID,
		Content:   content,
		Timestamp: time.Now(),
	}

	if err := db.Create(&message).Error; err != nil {
		log.Printf("[ChatService.CreateMessage] Hata: Mesaj veritabanına kaydedilemedi: %v", err)
		return nil, err
	}

	// Mesajı gönderen kullanıcı bilgisiyle birlikte döndür
	message.Sender = *user

	log.Printf("[ChatService.CreateMessage] Tamamlandı - Mesaj başarıyla oluşturuldu, ID: %d", message.ID)
	return &message, nil
}

// GetMessagesByRoomID, bir odaya ait tüm mesajları kronolojik olarak getirir.
func (s *ChatService) GetMessagesByRoomID(roomID uint64) ([]dtos.MessageDTO, error) {
	db := database.GetDB()
	var messages []models.Message

	// Mesajları gönderen (Sender) bilgisiyle birlikte, oluşturulma tarihine göre eskiden yeniye doğru sıralayarak çek.
	err := db.Preload("Sender").Where("room_id = ?", roomID).Order("created_at asc").Find(&messages).Error
	if err != nil {
		log.Printf("[ChatService.GetMessagesByRoomID] Hata: Oda %d için mesajlar çekilemedi: %v", roomID, err)
		return nil, err
	}

	// models.Message listesini dtos.MessageDTO listesine dönüştür.
	messageDTOs := make([]dtos.MessageDTO, len(messages))
	for i, msg := range messages {
		dto := dtos.MessageDTO{
			ID:        msg.ID,
			Content:   msg.Content,
			Timestamp: msg.Timestamp,
			Sender: dtos.SenderDTO{
				ID:        msg.Sender.ID,
				FirstName: msg.Sender.FirstName,
				LastName:  msg.Sender.LastName,
				AvatarURL: msg.Sender.ProfilePictureURL,
			},
		}
		messageDTOs[i] = dto
	}

	log.Printf("[ChatService.GetMessagesByRoomID] Oda %d için %d adet mesaj bulundu.", roomID, len(messageDTOs))
	return messageDTOs, nil
}

// GetUserRooms kullanıcının odalarını getirir (Geçici)
func (s *ChatService) GetUserRooms(userID uint64) ([]dtos.ConversationRoomDTO, error) {
	_, err := s.userService.FindUserByID(userID)
	if err != nil {
		return nil, errors.New("kullanıcı bulunamadı")
	}
	// TODO: Bu fonksiyonun gerçek implementasyonu RoomService içinde olmalı.
	return []dtos.ConversationRoomDTO{}, nil
}
