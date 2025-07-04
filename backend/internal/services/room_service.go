package services

import (
	"database/sql"
	"errors"
	"event/backend/internal/dtos"
	"event/backend/internal/models"
	"fmt"
	"log"
	"strings"
	"time"

	"gorm.io/gorm"
)

// RoomServiceInput, RoomService oluşturmak için gereken bağımlılıkları tanımlar.
type RoomServiceInput struct {
	DB          *gorm.DB
	UserService *UserService
}

// RoomService oda ile ilgili işlemleri yönetir
type RoomService struct {
	db          *gorm.DB
	userService *UserService
}

// NewRoomService yeni bir RoomService örneği oluşturur
func NewRoomService(input RoomServiceInput) *RoomService {
	return &RoomService{
		db:          input.DB,
		userService: input.UserService,
	}
}

// CreateRoomDTO yeni oda oluşturma için veri transfer nesnesi
type CreateRoomDTO struct {
	Name        string `json:"name" binding:"required,min=3,max=100"`
	Description string `json:"description" binding:"required,min=10,max=500"`
	IsPublic    bool   `json:"is_public"`
}

// CreateGroupChatDTO grup sohbeti oluşturma için veri transfer nesnesi
type CreateGroupChatDTO struct {
	Name      string   `json:"name,omitempty"`
	MemberIDs []uint64 `json:"member_ids" binding:"required,min=1"`
}

// UpdateRoomDTO oda güncelleme için veri transfer nesnesi
type UpdateRoomDTO struct {
	Name        string `json:"name" binding:"omitempty,min=3,max=100"`
	Description string `json:"description" binding:"omitempty,min=10,max=500"`
	IsPublic    *bool  `json:"is_public"`
}

// RoomListItemDTO oda listeleme için kullanılacak DTO
type RoomListItemDTO struct {
	ID            uint64    `json:"id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	IsPublic      bool      `json:"is_public"`
	CreatorUserID uint64    `json:"creator_user_id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	MembersCount  int64     `json:"membersCount"`
	EventsCount   int64     `json:"eventsCount"`
	CreatorName   string    `json:"creatorName"`
	IsCreator     bool      `json:"isCreator"`
	IsMember      bool      `json:"isMember"`
}

// CreateRoom yeni bir oda oluşturur
func (s *RoomService) CreateRoom(creatorID uint64, dto CreateRoomDTO) (*models.Room, error) {
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	room := models.Room{
		Name:          dto.Name,
		Description:   dto.Description,
		IsPublic:      dto.IsPublic,
		CreatorUserID: creatorID,
	}

	if err := tx.Create(&room).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	member := models.RoomMember{
		RoomID:   room.ID,
		UserID:   creatorID,
		Role:     "admin",
		JoinedAt: time.Now(),
		IsActive: true,
	}

	if err := tx.Create(&member).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	return &room, tx.Commit().Error
}

// CreateGroupChatRoom yeni bir grup sohbet odası oluşturur
func (s *RoomService) CreateGroupChatRoom(creatorID uint64, dto CreateGroupChatDTO) (*models.Room, error) {
	log.Printf("[CreateGroupChatRoom] Başladı - CreatorID: %d, DTO: %+v", creatorID, dto)

	// Tüm üye ID'lerine oluşturanı da ekleyelim (eğer zaten yoksa)
	allMemberIDs := append(dto.MemberIDs, creatorID)
	// Benzersiz üye ID'leri için bir map kullanalım
	uniqueMemberIDsMap := make(map[uint64]bool)
	for _, id := range allMemberIDs {
		uniqueMemberIDsMap[id] = true
	}

	// Üye sayısını kontrol et (en az 2 kişi olmalı: oluşturan + en az 1 üye)
	if len(uniqueMemberIDsMap) < 2 {
		log.Printf("[CreateGroupChatRoom] Hata: Grup sohbeti en az 2 üye gerektirir (oluşturan dahil). Sağlanan üye sayısı (benzersiz): %d", len(uniqueMemberIDsMap))
		return nil, errors.New("grup sohbeti en az 2 üye gerektirir (oluşturan dahil)")
	}

	// Grup adını belirle
	var roomName string
	if dto.Name != "" {
		roomName = dto.Name
	} else {
		// Otomatik grup adı oluştur: "Grup: User1, User2, ..."
		var memberUsernames []string
		for memberID := range uniqueMemberIDsMap {
			user, err := s.userService.FindUserByID(memberID) // userService üzerinden kullanıcı adı al
			if err != nil {
				log.Printf("[CreateGroupChatRoom] Kullanıcı adı alınamadı ID %d: %v", memberID, err)
				memberUsernames = append(memberUsernames, fmt.Sprintf("Kullanıcı %d", memberID))
			} else {
				memberUsernames = append(memberUsernames, user.Username)
			}
		}
		roomName = "Grup: " + strings.Join(memberUsernames, ", ")
		if len(roomName) > 100 { // Modeldeki size limitine dikkat
			roomName = roomName[:97] + "..."
		}
	}
	log.Printf("[CreateGroupChatRoom] Grup adı belirlendi: %s", roomName)

	tx := s.db.Begin()
	if tx.Error != nil {
		log.Printf("[CreateGroupChatRoom] Hata: Veritabanı transaction başlatılamadı: %v", tx.Error)
		return nil, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	room := models.Room{
		Name:          roomName,
		CreatorUserID: creatorID,
		IsPublic:      false,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := tx.Create(&room).Error; err != nil {
		tx.Rollback()
		log.Printf("[CreateGroupChatRoom] Hata: Oda oluşturulamadı: %v", err)
		return nil, err
	}
	log.Printf("[CreateGroupChatRoom] Oda başarıyla oluşturuldu: Ad: %s", room.Name)

	// Üyeleri ekle
	for memberID := range uniqueMemberIDsMap {
		role := "member"
		if memberID == creatorID {
			role = "admin" // Oluşturan admin olsun
		}
		roomMember := models.RoomMember{
			RoomID:   room.ID,
			UserID:   memberID,
			Role:     role,
			JoinedAt: time.Now(),
			IsActive: true,
		}
		if err := tx.Create(&roomMember).Error; err != nil {
			tx.Rollback()
			log.Printf("[CreateGroupChatRoom] Hata: Oda üyesi eklenemedi (KullanıcıID: %d, OdaID: %d): %v", memberID, room.ID, err)
			return nil, err
		}
		log.Printf("[CreateGroupChatRoom] Oda üyesi eklendi: KullanıcıID: %d, Rol: %s, OdaID: %d", memberID, role, room.ID)
	}

	if err := tx.Commit().Error; err != nil {
		log.Printf("[CreateGroupChatRoom] Hata: Veritabanı transaction commit edilemedi: %v", err)
		return nil, err
	}

	log.Printf("[CreateGroupChatRoom] Tamamlandı - OdaID: %d başarıyla oluşturuldu ve üyeler eklendi.", room.ID)

	var createdRoomWithDetails models.Room
	if err := s.db.Preload("Members.User").Preload("Creator").First(&createdRoomWithDetails, "id = ?", room.ID).Error; err != nil {
		log.Printf("[CreateGroupChatRoom] Oda (ID: %d) oluşturulduktan sonra detayları (üyelerle) preload edilemedi: %v", room.ID, err)
		return &room, nil
	}
	log.Printf("[CreateGroupChatRoom] Oda (ID: %d) detayları yüklendi, %d üye bulundu.", createdRoomWithDetails.ID, len(createdRoomWithDetails.Members))
	return &createdRoomWithDetails, nil
}

// GetPublicRooms herkese açık odaları listeler
func (s *RoomService) GetPublicRooms() ([]RoomListItemDTO, error) {
	var rooms []models.Room

	if err := s.db.Preload("Creator").Where("is_public = ?", true).Order("created_at DESC").Find(&rooms).Error; err != nil {
		return nil, err
	}

	roomListItems := make([]RoomListItemDTO, 0, len(rooms))

	for _, room := range rooms {
		log.Printf("[GetPublicRooms] Processing room ID: %d, Name: %s", room.ID, room.Name)
		var membersCount int64
		if err := s.db.Model(&models.RoomMember{}).Where("room_id = ? AND is_active = ?", room.ID, true).Count(&membersCount).Error; err != nil {
			log.Printf("[GetPublicRooms] Error counting members for room %d: %v", room.ID, err)
			membersCount = 0
		} else {
			log.Printf("[GetPublicRooms] Fetched membersCount for room %d: %d", room.ID, membersCount)
		}

		var eventsCount int64
		if err := s.db.Model(&models.Event{}).Where("room_id = ?", room.ID).Count(&eventsCount).Error; err != nil {
			log.Printf("[GetPublicRooms] Error counting events for room %d: %v", room.ID, err)
			eventsCount = 0
		} else {
			log.Printf("[GetPublicRooms] Fetched eventsCount for room %d: %d", room.ID, eventsCount)
		}

		creatorName := "Bilinmiyor"
		if room.Creator.Username != "" {
			creatorName = room.Creator.Username
		} else if room.Creator.FirstName != "" || room.Creator.LastName != "" {
			creatorName = room.Creator.FirstName + " " + room.Creator.LastName
		}

		roomListItems = append(roomListItems, RoomListItemDTO{
			ID:            room.ID,
			Name:          room.Name,
			Description:   room.Description,
			IsPublic:      room.IsPublic,
			CreatorUserID: room.CreatorUserID,
			CreatedAt:     room.CreatedAt,
			UpdatedAt:     room.UpdatedAt,
			MembersCount:  membersCount,
			EventsCount:   eventsCount,
			CreatorName:   creatorName,
		})
	}

	return roomListItems, nil
}

// GetRoomByID odayı ID'sine göre getirir ve kullanıcının erişimini kontrol eder.
// userID, odaya erişmeye çalışan kullanıcının ID'sidir.
func (s *RoomService) GetRoomByID(roomID uint64, userID uint64) (*models.Room, error) {
	log.Printf("[GetRoomByID] Başladı - OdaID: %d, KullanıcıID: %d", roomID, userID)
	var room models.Room

	log.Printf("[GetRoomByID] Oda bilgileri ve üyeler çekiliyor (Preload Members) - OdaID: %d", roomID)
	if err := s.db.Preload("Members").Preload("Creator").First(&room, "id = ?", roomID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[GetRoomByID] Oda bulunamadı - OdaID: %d", roomID)
			return nil, errors.New("oda bulunamadı")
		}
		log.Printf("[GetRoomByID] Oda çekme hatası: %v", err)
		return nil, err
	}
	log.Printf("[GetRoomByID] Oda bulundu: ID %d, Ad: %s, Üye Sayısı (Preload): %d", room.ID, room.Name, len(room.Members))

	if !room.IsPublic {
		log.Printf("[GetRoomByID] Oda özel (public değil). Erişim kontrolü yapılıyor - OdaID: %d, KullanıcıID: %d", roomID, userID)
		isMember := false
		for _, member := range room.Members {
			if member.UserID == userID && member.IsActive {
				isMember = true
				log.Printf("[GetRoomByID] Özel oda erişim kontrolü başarılı (Preload üzerinden). Kullanıcı (ID: %d) aktif üye.", userID)
				break
			}
		}
		if !isMember {
			log.Printf("[GetRoomByID] Kullanıcı (ID: %d) preload edilen üyeler arasında bulunamadı veya aktif değil. Veritabanından ek kontrol yapılıyor.", userID)
			var memberCheck models.RoomMember
			if err := s.db.Where("room_id = ? AND user_id = ? AND is_active = ?", roomID, userID, true).First(&memberCheck).Error; err != nil {
				log.Printf("[GetRoomByID] Özel oda erişim kontrolü hatası (kullanıcı üye değil, aktif değil veya DB hatası): %v", err)
				return nil, errors.New("bu odaya erişim yetkiniz yok veya oda bulunamadı")
			}
			log.Printf("[GetRoomByID] Özel oda erişim kontrolü başarılı (DB üzerinden). Kullanıcı (ID: %d) aktif üye.", userID)
		}
	}

	log.Printf("[GetRoomByID] Tamamlandı - OdaID: %d döndürülüyor.", roomID)
	return &room, nil
}

// UpdateRoom oda bilgilerini günceller
func (s *RoomService) UpdateRoom(roomID uint64, userID uint64, dto UpdateRoomDTO) (*models.Room, error) {
	var member models.RoomMember
	if err := s.db.Where("room_id = ? AND user_id = ? AND role = ? AND is_active = ?", roomID, userID, "admin", true).First(&member).Error; err != nil {
		log.Printf("[UpdateRoom] Yetki hatası: Kullanıcı %d, Oda %d için admin değil veya üye değil. Hata: %v", userID, roomID, err)
		return nil, errors.New("bu işlem için yetkiniz yok veya oda üyesi değilsiniz")
	}

	var room models.Room
	if err := s.db.First(&room, "id = ?", roomID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[UpdateRoom] Oda bulunamadı: ID %d", roomID)
			return nil, errors.New("oda bulunamadı")
		}
		log.Printf("[UpdateRoom] Oda bulma hatası: %v", err)
		return nil, err
	}

	updates := make(map[string]interface{})
	needsUpdate := false
	if dto.Name != "" && dto.Name != room.Name {
		updates["name"] = dto.Name
		needsUpdate = true
	}
	if dto.Description != "" && dto.Description != room.Description {
		updates["description"] = dto.Description
		needsUpdate = true
	}
	if dto.IsPublic != nil && *dto.IsPublic != room.IsPublic {
		updates["is_public"] = *dto.IsPublic
		needsUpdate = true
	}

	if !needsUpdate {
		log.Printf("[UpdateRoom] Güncellenecek bir değişiklik yok. Oda: %d", roomID)
		return &room, nil
	}
	updates["updated_at"] = time.Now()

	if err := s.db.Model(&room).Updates(updates).Error; err != nil {
		log.Printf("[UpdateRoom] Oda güncelleme hatası (OdaID: %d): %v", roomID, err)
		return nil, err
	}
	log.Printf("[UpdateRoom] Oda başarıyla güncellendi: ID %d", roomID)
	return &room, nil
}

// DeleteRoom odayı siler
func (s *RoomService) DeleteRoom(roomID uint64, userID uint64) error {
	var room models.Room
	if err := s.db.Select("creator_user_id").First(&room, roomID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[DeleteRoom] Oda bulunamadı: ID %d", roomID)
			return errors.New("oda bulunamadı")
		}
		log.Printf("[DeleteRoom] Oda bilgisi alınırken hata: %v", err)
		return errors.New("oda silinirken bir hata oluştu")
	}

	isCreator := room.CreatorUserID == userID

	var member models.RoomMember
	if !isCreator {
		if err := s.db.Where("room_id = ? AND user_id = ? AND role = ? AND is_active = ?", roomID, userID, "admin", true).First(&member).Error; err == nil {
			isAdmin := true
			if !isCreator && !isAdmin {
				log.Printf("[DeleteRoom] Yetkisiz silme denemesi: Kullanıcı %d, Oda %d. Kurucu değil ve admin değil.", userID, roomID)
				return errors.New("bu odayı silme yetkiniz yok")
			}
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[DeleteRoom] Admin kontrolü sırasında DB hatası (OdaID: %d, KullanıcıID: %d): %v", roomID, userID, err)
			return errors.New("oda silinirken bir hata oluştu")
		}
	}

	if err := s.db.Delete(&models.Room{}, roomID).Error; err != nil {
		log.Printf("[DeleteRoom] Oda silinirken hata (OdaID: %d): %v", roomID, err)
		return errors.New("oda silinirken bir hata oluştu")
	}

	log.Printf("[DeleteRoom] Oda başarıyla silindi (soft delete): ID %d, Silen Kullanıcı: %d", roomID, userID)
	return nil
}

// AddRoomMember odaya yeni üye ekler
func (s *RoomService) AddRoomMember(roomID uint64, userIDToAdd uint64, requesterID uint64) error {
	// Oda bilgilerini al
	var room models.Room
	if err := s.db.First(&room, roomID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[AddRoomMember] Oda bulunamadı: ID %d", roomID)
			return errors.New("oda bulunamadı")
		}
		log.Printf("[AddRoomMember] Oda bilgileri alınırken hata: %v", err)
		return errors.New("oda bilgileri alınırken bir hata oluştu")
	}

	// Odaya katılma/ekleme yetki kontrolü
	isJoiningSelf := requesterID == userIDToAdd

	if !room.IsPublic {
		// Oda herkese açık değilse, sadece adminler üye ekleyebilir.
		var adminMember models.RoomMember
		if err := s.db.Where("room_id = ? AND user_id = ? AND role = ? AND is_active = ?", roomID, requesterID, "admin", true).First(&adminMember).Error; err != nil {
			log.Printf("[AddRoomMember] Yetki hatası (Özel Oda): Kullanıcı %d, Oda %d için admin değil. Hata: %v", requesterID, roomID, err)
			return errors.New("özel odalara sadece yöneticiler üye ekleyebilir")
		}
	} else {
		// Oda herkese açıksa ve kullanıcı kendini eklemiyorsa, yine de admin olmalı.
		// Bu, bir adminin herkese açık bir odaya başkasını eklemesi senaryosunu kapsar.
		// Herkesin başkasını eklemesini engeller.
		if !isJoiningSelf {
			var adminMember models.RoomMember
			if err := s.db.Where("room_id = ? AND user_id = ? AND role = ? AND is_active = ?", roomID, requesterID, "admin", true).First(&adminMember).Error; err != nil {
				log.Printf("[AddRoomMember] Yetki hatası (Herkese Açık Oda - Başkasını Ekleme): Kullanıcı %d, Oda %d için admin değil. Hata: %v", requesterID, roomID, err)
				return errors.New("bir odaya başka bir üyeyi sadece yöneticiler ekleyebilir")
			}
		}
		// Eğer kullanıcı kendini ekliyorsa (isJoiningSelf == true), herkese açık odada yetki kontrolüne gerek yok.
	}

	var existingMember models.RoomMember
	err := s.db.Where("room_id = ? AND user_id = ?", roomID, userIDToAdd).First(&existingMember).Error
	if err == nil {
		if existingMember.IsActive {
			log.Printf("[AddRoomMember] Kullanıcı %d zaten Oda %d üyesi ve aktif.", userIDToAdd, roomID)
			return errors.New("kullanıcı zaten odanın aktif bir üyesi")
		}
		existingMember.IsActive = true
		existingMember.Role = "member"
		existingMember.JoinedAt = time.Now()
		if err := s.db.Save(&existingMember).Error; err != nil {
			log.Printf("[AddRoomMember] Mevcut pasif üye aktif edilirken hata (OdaID: %d, KullanıcıID: %d): %v", roomID, userIDToAdd, err)
			return errors.New("üyeyi odaya eklerken bir hata oluştu")
		}
		log.Printf("[AddRoomMember] Mevcut pasif üye %d, Oda %d için yeniden aktif edildi.", userIDToAdd, roomID)
		return nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("[AddRoomMember] Mevcut üye kontrolü sırasında DB hatası (OdaID: %d, KullanıcıID: %d): %v", roomID, userIDToAdd, err)
		return errors.New("üyeyi odaya eklerken bir hata oluştu")
	}

	newMember := models.RoomMember{
		RoomID:   roomID,
		UserID:   userIDToAdd,
		Role:     "member",
		JoinedAt: time.Now(),
		IsActive: true,
	}

	if err := s.db.Create(&newMember).Error; err != nil {
		log.Printf("[AddRoomMember] Yeni üye oluşturulurken hata (OdaID: %d, KullanıcıID: %d): %v", roomID, userIDToAdd, err)
		return errors.New("kullanıcıyı odaya eklerken bir hata oluştu")
	}

	log.Printf("[AddRoomMember] Kullanıcı %d, Oda %d için başarıyla üye olarak eklendi. Ekleyen: %d", userIDToAdd, roomID, requesterID)
	return nil
}

// RemoveRoomMember odadan üye çıkarır (soft delete yapar)
func (s *RoomService) RemoveRoomMember(roomID uint64, memberID uint64, removerID uint64) error {
	if removerID != memberID {
		var adminMember models.RoomMember
		if err := s.db.Where("room_id = ? AND user_id = ? AND role = ? AND is_active = ?", roomID, removerID, "admin", true).First(&adminMember).Error; err != nil {
			log.Printf("[RemoveRoomMember] Yetki hatası: Kullanıcı %d, Oda %d için admin değil veya üye değil. Hata: %v", removerID, roomID, err)
			return errors.New("bu işlem için yetkiniz yok")
		}
	}

	var memberToRemove models.RoomMember
	if err := s.db.Where("room_id = ? AND user_id = ? AND is_active = ?", roomID, memberID, true).First(&memberToRemove).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[RemoveRoomMember] Çıkarılacak aktif üye bulunamadı: Kullanıcı %d, Oda %d", memberID, roomID)
			return errors.New("çıkarılacak aktif üye bulunamadı")
		}
		log.Printf("[RemoveRoomMember] Çıkarılacak üye aranırken DB hatası (OdaID: %d, KullanıcıID: %d): %v", roomID, memberID, err)
		return errors.New("kullanıcıyı odadan çıkarırken bir hata oluştu")
	}

	if memberToRemove.Role == "admin" && removerID == memberID {
		var adminCount int64
		s.db.Model(&models.RoomMember{}).Where("room_id = ? AND role = ? AND is_active = ?", roomID, "admin", true).Count(&adminCount)
		if adminCount <= 1 {
			log.Printf("[RemoveRoomMember] Engellendi: Son admin kendini odadan (OdaID: %d) çıkaramaz.", roomID)
			return errors.New("son admin kendini odadan çıkaramaz")
		}
	}

	memberToRemove.IsActive = false
	if err := s.db.Save(&memberToRemove).Error; err != nil {
		log.Printf("[RemoveRoomMember] Üyelik pasif yapılırken hata (OdaID: %d, KullanıcıID: %d): %v", roomID, memberID, err)
		return errors.New("kullanıcıyı odadan çıkarırken bir hata oluştu")
	}

	log.Printf("[RemoveRoomMember] Kullanıcı %d, Oda %d üyeliğinden başarıyla çıkarıldı (pasif yapıldı). Çıkaran: %d", memberID, roomID, removerID)
	return nil
}

// GetUserRooms kullanıcının üye olduğu ve aktif olan odaları listeler
// TODO: Bu fonksiyonun DTO döndürmesi daha iyi olabilir (RoomListItemDTO gibi)
// Şu anda direkt model döndürüyor.
func (s *RoomService) GetUserRooms(userID uint64) ([]models.Room, error) {
	var rooms []models.Room

	var activeMemberships []models.RoomMember
	if err := s.db.Where("user_id = ? AND is_active = ?", userID, true).Find(&activeMemberships).Error; err != nil {
		log.Printf("[GetUserRooms] Kullanıcı %d için aktif üyelikler alınırken hata: %v", userID, err)
		return nil, err
	}

	if len(activeMemberships) == 0 {
		return []models.Room{}, nil
	}

	var roomIDs []uint64
	for _, membership := range activeMemberships {
		roomIDs = append(roomIDs, membership.RoomID)
	}

	if err := s.db.Preload("Creator").Preload("Members.User", "is_active = ?", true).Where("id IN ?", roomIDs).Order("updated_at DESC").Find(&rooms).Error; err != nil {
		log.Printf("[GetUserRooms] Kullanıcı %d için odalar (ID'ler: %v) çekilirken hata: %v", userID, roomIDs, err)
		return nil, err
	}

	log.Printf("[GetUserRooms] Kullanıcı %d için %d adet oda bulundu.", userID, len(rooms))
	return rooms, nil
}

// GetRoomMembers bir odanın aktif üyelerinin kullanıcı bilgilerini döndürür.
func (s *RoomService) GetRoomMembers(roomID uint64) ([]models.User, error) {
	var members []models.RoomMember
	if err := s.db.Preload("User").Where("room_id = ? AND is_active = ?", roomID, true).Find(&members).Error; err != nil {
		log.Printf("[GetRoomMembers] Oda %d için üyeler çekilirken hata: %v", roomID, err)
		return nil, err
	}

	users := make([]models.User, 0, len(members))
	for _, member := range members {
		users = append(users, member.User)
	}

	log.Printf("[GetRoomMembers] Oda %d için %d üye bulundu.", roomID, len(users))
	return users, nil
}

// GetOrCreateDMRoom iki kullanıcı arasında bir DM odası bulur veya oluşturur.
// Oda adını "DM_minUserID_maxUserID" formatında oluşturur.
func (s *RoomService) GetOrCreateDMRoom(userID1, userID2 uint64) (*models.Room, error) {
	log.Printf("[GetOrCreateDMRoom] Başladı - UserID1: %d, UserID2: %d", userID1, userID2)

	if userID1 == userID2 {
		log.Printf("[GetOrCreateDMRoom] Hata: Kullanıcılar aynı olamaz (UserID1: %d, UserID2: %d)", userID1, userID2)
		return nil, errors.New("kullanıcılar aynı olamaz")
	}

	// ID'leri sırala, böylece oda adı her zaman tutarlı olur (DM_1_2, DM_2_1 yerine hep DM_1_2)
	minUserID := userID1
	maxUserID := userID2
	if userID1 > userID2 {
		minUserID = userID2
		maxUserID = userID1
	}

	roomName := fmt.Sprintf("DM_%d_%d", minUserID, maxUserID)

	var room models.Room
	err := s.db.Where("name = ? AND is_public = ?", roomName, false).First(&room).Error
	if err == nil {
		log.Printf("[GetOrCreateDMRoom] Mevcut DM odası bulundu: ID %d, Ad: %s", room.ID, room.Name)
		if errLoad := s.db.Preload("Members.User").Preload("Creator").First(&room, room.ID).Error; errLoad != nil {
			log.Printf("[GetOrCreateDMRoom] Mevcut DM odası (ID: %d) detayları yüklenemedi: %v", room.ID, errLoad)
			return nil, fmt.Errorf("mevcut DM odası detayları yüklenemedi: %w", errLoad)
		}
		return &room, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("[GetOrCreateDMRoom] Mevcut DM odası aranırken DB hatası: %v", err)
		return nil, fmt.Errorf("mevcut DM odası aranırken DB hatası: %w", err)
	}

	log.Printf("[GetOrCreateDMRoom] Mevcut DM odası bulunamadı, yeni bir tane oluşturuluyor: %s", roomName)
	tx := s.db.Begin()
	if tx.Error != nil {
		log.Printf("[GetOrCreateDMRoom] Hata: Veritabanı transaction başlatılamadı: %v", tx.Error)
		return nil, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	newRoom := models.Room{
		Name:          roomName,
		Description:   fmt.Sprintf("Direkt Mesaj: Kullanıcı %d ve Kullanıcı %d", minUserID, maxUserID),
		CreatorUserID: userID1,
		IsPublic:      false,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := tx.Create(&newRoom).Error; err != nil {
		tx.Rollback()
		log.Printf("[GetOrCreateDMRoom] Hata: Yeni DM odası oluşturulamadı: %v", err)
		return nil, fmt.Errorf("yeni DM odası oluşturulamadı: %w", err)
	}
	log.Printf("[GetOrCreateDMRoom] Yeni DM odası başarıyla oluşturuldu: ID %d, Ad: %s", newRoom.ID, newRoom.Name)

	// İki kullanıcıyı da üye olarak ekle
	membersToCreate := []models.RoomMember{
		{RoomID: newRoom.ID, UserID: minUserID, Role: "member", JoinedAt: time.Now(), IsActive: true},
		{RoomID: newRoom.ID, UserID: maxUserID, Role: "member", JoinedAt: time.Now(), IsActive: true},
	}

	for _, member := range membersToCreate {
		if err := tx.Create(&member).Error; err != nil {
			tx.Rollback()
			log.Printf("[GetOrCreateDMRoom] Hata: DM odasına üye eklenemedi (KullanıcıID: %d, OdaID: %d): %v", member.UserID, newRoom.ID, err)
			return nil, fmt.Errorf("DM odasına üye eklenemedi: %w", err)
		}
		log.Printf("[GetOrCreateDMRoom] DM odasına üye eklendi: KullanıcıID: %d, OdaID: %d", member.UserID, newRoom.ID)
	}

	if err := tx.Commit().Error; err != nil {
		log.Printf("[GetOrCreateDMRoom] Hata: Veritabanı transaction commit edilemedi: %v", err)
		return nil, fmt.Errorf("veritabanı transaction commit edilemedi: %w", err)
	}

	log.Printf("[GetOrCreateDMRoom] Tamamlandı - Yeni DM OdaID: %d başarıyla oluşturuldu ve üyeler eklendi.", newRoom.ID)

	var createdRoomWithDetails models.Room
	if err := s.db.Preload("Members.User").Preload("Creator").First(&createdRoomWithDetails, newRoom.ID).Error; err != nil {
		log.Printf("[GetOrCreateDMRoom] Yeni DM odası (ID: %d) oluşturulduktan sonra detayları yüklenemedi: %v", newRoom.ID, err)
		return &newRoom, nil
	}
	return &createdRoomWithDetails, nil
}

// GetUserConversations, belirli bir kullanıcının tüm sohbetlerini,
// en son mesaj ve diğer kullanıcı bilgileriyle birlikte getirir.
func (s *RoomService) GetUserConversations(currentUserID uint64) ([]dtos.ConversationRoomDTO, error) {
	const query = `
		SELECT
			r.id,
			r.name,
			CASE WHEN r.name LIKE 'DM_%' AND mc.member_count = 2 THEN 1 ELSE 0 END AS is_dm,
			other_user.user_id AS other_user_id,
			ou.first_name AS other_user_first_name,
			ou.last_name AS other_user_last_name,
			ou.profile_picture_url AS other_user_avatar_url,
			lm.content AS last_message_content,
			lm.created_at AS last_message_timestamp,
			CONCAT(sender.first_name, ' ', sender.last_name) AS last_message_sender_name
		FROM rooms r
		JOIN room_members current_rm ON r.id = current_rm.room_id AND current_rm.user_id = ? AND current_rm.is_active = 1
		LEFT JOIN (
			SELECT room_id, COUNT(*) AS member_count
			FROM room_members
			WHERE is_active = 1
			GROUP BY room_id
		) mc ON r.id = mc.room_id
		LEFT JOIN room_members other_user ON r.name LIKE 'DM_%' AND r.id = other_user.room_id AND other_user.user_id != ? AND other_user.is_active = 1
		LEFT JOIN (
			SELECT 
				m.room_id,
				m.content,
				m.created_at,
				m.sender_id,
				ROW_NUMBER() OVER(PARTITION BY m.room_id ORDER BY m.created_at DESC) as rn
			FROM messages m
			WHERE m.deleted_at IS NULL
		) lm ON r.id = lm.room_id AND lm.rn = 1
		LEFT JOIN users sender ON lm.sender_id = sender.id
		LEFT JOIN users ou ON other_user.user_id = ou.id
		WHERE r.deleted_at IS NULL
		ORDER BY lm.created_at IS NULL, lm.created_at DESC;
    `

	type QueryResult struct {
		ID                    uint64
		Name                  string
		IsDM                  bool
		OtherUserID           sql.NullInt64
		OtherUserFirstName    sql.NullString
		OtherUserLastName     sql.NullString
		OtherUserAvatarURL    sql.NullString
		LastMessageContent    sql.NullString
		LastMessageTimestamp  sql.NullTime
		LastMessageSenderName sql.NullString
	}

	var results []QueryResult
	if err := s.db.Raw(query, currentUserID, currentUserID).Scan(&results).Error; err != nil {
		log.Printf("Error getting user conversations for user %d: %v", currentUserID, err)
		return nil, err
	}

	conversations := make([]dtos.ConversationRoomDTO, 0, len(results))
	for _, res := range results {
		convo := dtos.ConversationRoomDTO{
			ID:   res.ID,
			Name: res.Name,
			IsDM: res.IsDM,
		}

		if res.IsDM && res.OtherUserID.Valid {
			convo.OtherUser = &dtos.OtherUserDTO{
				ID:        uint64(res.OtherUserID.Int64),
				FirstName: res.OtherUserFirstName.String,
				LastName:  res.OtherUserLastName.String,
				AvatarURL: res.OtherUserAvatarURL.String,
			}
			convo.Name = strings.TrimSpace(res.OtherUserFirstName.String + " " + res.OtherUserLastName.String)
		}

		if res.LastMessageTimestamp.Valid {
			convo.LastMessage = &dtos.LastMessageDTO{
				Content:    res.LastMessageContent.String,
				Timestamp:  res.LastMessageTimestamp.Time,
				SenderName: res.LastMessageSenderName.String,
			}
		}
		conversations = append(conversations, convo)
	}

	return conversations, nil
}

// IsUserMemberOfRoom, bir kullanıcının belirtilen odanın aktif bir üyesi olup olmadığını kontrol eder.
func (s *RoomService) IsUserMemberOfRoom(userID, roomID uint64) (bool, error) {
	var count int64
	err := s.db.Model(&models.RoomMember{}).Where("user_id = ? AND room_id = ? AND is_active = ?", userID, roomID, true).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetRoomsByFilter odaları sağlanan filtreye göre listeler
func (s *RoomService) GetRoomsByFilter(filter string, userID uint64) ([]RoomListItemDTO, error) {
	var rooms []models.Room
	query := s.db.Preload("Creator")

	switch filter {
	case "public":
		query = query.Where("is_public = ?", true)
	case "private":
		query = query.Joins("JOIN room_members ON room_members.room_id = rooms.id").
			Where("rooms.is_public = ? AND room_members.user_id = ? AND room_members.is_active = ?", false, userID, true)
	case "mine":
		query = query.Where("creator_user_id = ?", userID)
	case "member":
		query = query.Joins("JOIN room_members ON room_members.room_id = rooms.id").
			Where("room_members.user_id = ? AND rooms.creator_user_id != ? AND room_members.is_active = ?", userID, userID, true)
	case "all":
		fallthrough
	default:
		query = query.Joins("LEFT JOIN room_members ON room_members.room_id = rooms.id AND room_members.user_id = ? AND room_members.is_active = ?", userID, true).
			Where("rooms.is_public = ? OR room_members.user_id = ?", true, userID)
	}

	if err := query.Distinct().Order("created_at DESC").Find(&rooms).Error; err != nil {
		return nil, err
	}

	roomIDs := make([]uint64, len(rooms))
	for i, room := range rooms {
		roomIDs[i] = room.ID
	}

	memberCountMap := make(map[uint64]int64)
	if len(roomIDs) > 0 {
		var memberCounts []struct {
			RoomID uint64
			Count  int64
		}
		s.db.Model(&models.RoomMember{}).
			Select("room_id, count(*) as count").
			Where("room_id IN ? AND is_active = ?", roomIDs, true).
			Group("room_id").
			Find(&memberCounts)
		for _, mc := range memberCounts {
			memberCountMap[mc.RoomID] = mc.Count
		}
	}

	eventCountMap := make(map[uint64]int64)
	if len(roomIDs) > 0 {
		var eventCounts []struct {
			RoomID uint64
			Count  int64
		}
		s.db.Model(&models.Event{}).
			Select("room_id, count(*) as count").
			Where("room_id IN ?", roomIDs).
			Group("room_id").
			Find(&eventCounts)
		for _, ec := range eventCounts {
			eventCountMap[ec.RoomID] = ec.Count
		}
	}

	userMemberMap := make(map[uint64]bool)
	if userID > 0 && len(roomIDs) > 0 {
		var userMemberOfRoomIDs []uint64
		s.db.Model(&models.RoomMember{}).
			Where("room_id IN ? AND user_id = ? AND is_active = ?", roomIDs, userID, true).
			Pluck("room_id", &userMemberOfRoomIDs)
		for _, id := range userMemberOfRoomIDs {
			userMemberMap[id] = true
		}
	}

	responseItems := make([]RoomListItemDTO, len(rooms))
	for i, room := range rooms {
		creatorName := "Bilinmiyor"
		if room.Creator.ID != 0 {
			if room.Creator.Username != "" {
				creatorName = room.Creator.Username
			} else {
				creatorName = strings.TrimSpace(room.Creator.FirstName + " " + room.Creator.LastName)
			}
		}

		responseItems[i] = RoomListItemDTO{
			ID:            room.ID,
			Name:          room.Name,
			Description:   room.Description,
			IsPublic:      room.IsPublic,
			CreatorUserID: room.CreatorUserID,
			CreatedAt:     room.CreatedAt,
			UpdatedAt:     room.UpdatedAt,
			MembersCount:  memberCountMap[room.ID],
			EventsCount:   eventCountMap[room.ID],
			CreatorName:   creatorName,
			IsCreator:     room.CreatorUserID == userID && userID != 0,
			IsMember:      userMemberMap[room.ID],
		}
	}

	return responseItems, nil
}

// InviteUserToRoom kullanıcıyı odaya davet eder
func (s *RoomService) InviteUserToRoom(roomID, inviterID, inviteeID uint64, message string) (*models.RoomInvitation, error) {
	// Davet eden kullanıcının odanın üyesi olup olmadığını kontrol et
	isMember, err := s.IsUserMemberOfRoom(inviterID, roomID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("sadece oda üyeleri davet gönderebilir")
	}

	// Davet edilecek kullanıcının zaten üye olup olmadığını kontrol et
	isAlreadyMember, err := s.IsUserMemberOfRoom(inviteeID, roomID)
	if err != nil {
		return nil, err
	}
	if isAlreadyMember {
		return nil, errors.New("kullanıcı zaten bu odanın üyesi")
	}

	// Mevcut bekleyen davet var mı kontrol et
	var existingInvitation models.RoomInvitation
	if err := s.db.Where("room_id = ? AND invitee_id = ? AND status = ?", roomID, inviteeID, models.RoomInvitationPending).First(&existingInvitation).Error; err == nil {
		return &existingInvitation, errors.New("bu kullanıcı için zaten bekleyen bir davet var")
	}

	// Odayı getir
	var room models.Room
	if err := s.db.First(&room, roomID).Error; err != nil {
		return nil, errors.New("oda bulunamadı")
	}

	// Yeni davet oluştur
	invitation := models.RoomInvitation{
		RoomID:    roomID,
		InviterID: inviterID,
		InviteeID: inviteeID,
		Message:   message,
		Status:    models.RoomInvitationPending,
	}

	if err := s.db.Create(&invitation).Error; err != nil {
		return nil, err
	}

	log.Printf("🎯 ROOM INVITATION OLUŞTURULDU: ID=%d, RoomID=%d, InviterID=%d, InviteeID=%d", invitation.ID, roomID, inviterID, inviteeID)

	// Bildirim oluştur
	notificationService := NewNotificationService()
	_, err = notificationService.CreateNotification(inviteeID, "room_invitation", fmt.Sprintf("'%s' odasına davet edildiniz", room.Name), &invitation.ID)
	if err != nil {
		log.Printf("Room invitation notification oluşturulamadı: %v", err)
	} else {
		log.Printf("📢 NOTIFICATION OLUŞTURULDU: UserID=%d, Type=room_invitation, RelatedID=%d", inviteeID, invitation.ID)
	}

	return &invitation, nil
}

// AcceptRoomInvitation oda davetini kabul eder
func (s *RoomService) AcceptRoomInvitation(invitationID, userID uint64) error {
	log.Printf("🔍 INVITATION KABUL EDİLİYOR: InvitationID=%d, UserID=%d", invitationID, userID)

	// Daveti getir
	var invitation models.RoomInvitation
	if err := s.db.First(&invitation, invitationID).Error; err != nil {
		log.Printf("❌ DAVET BULUNAMADI: InvitationID=%d, Error=%v", invitationID, err)
		return errors.New("davet bulunamadı")
	}

	// Davet edilen kullanıcının daveti kabul etmeye yetkili olup olmadığını kontrol et
	if invitation.InviteeID != userID {
		return errors.New("bu daveti kabul etme yetkiniz yok")
	}

	// Davet durumunu kontrol et
	if invitation.Status != models.RoomInvitationPending {
		return errors.New("bu davet zaten işlenmiş")
	}

	// Kullanıcının zaten üye olup olmadığını kontrol et
	isAlreadyMember, err := s.IsUserMemberOfRoom(userID, invitation.RoomID)
	if err != nil {
		return err
	}
	if isAlreadyMember {
		return errors.New("zaten bu odanın üyesisiniz")
	}

	// Transaction başlat
	tx := s.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Daveti kabul et
	invitation.Status = models.RoomInvitationAccepted
	if err := tx.Save(&invitation).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Kullanıcıyı odaya üye olarak ekle
	member := models.RoomMember{
		RoomID:   invitation.RoomID,
		UserID:   userID,
		Role:     "member",
		JoinedAt: time.Now(),
		IsActive: true,
	}
	if err := tx.Create(&member).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// DeclineRoomInvitation oda davetini reddeder
func (s *RoomService) DeclineRoomInvitation(invitationID, userID uint64) error {
	// Daveti getir
	var invitation models.RoomInvitation
	if err := s.db.First(&invitation, invitationID).Error; err != nil {
		return errors.New("davet bulunamadı")
	}

	// Davet edilen kullanıcının daveti reddetmeye yetkili olup olmadığını kontrol et
	if invitation.InviteeID != userID {
		return errors.New("bu daveti reddetme yetkiniz yok")
	}

	// Davet durumunu kontrol et
	if invitation.Status != models.RoomInvitationPending {
		return errors.New("bu davet zaten işlenmiş")
	}

	// Daveti reddet
	invitation.Status = models.RoomInvitationDeclined
	return s.db.Save(&invitation).Error
}

// GetRoomInvitations kullanıcıya gelen oda davetlerini getirir
func (s *RoomService) GetRoomInvitations(userID uint64) ([]models.RoomInvitation, error) {
	var invitations []models.RoomInvitation
	if err := s.db.Where("invitee_id = ? AND status = ?", userID, models.RoomInvitationPending).
		Preload("Room").
		Preload("Inviter").
		Order("created_at DESC").
		Find(&invitations).Error; err != nil {
		return nil, err
	}
	return invitations, nil
}

// GetUnreadMessagesCount kullanıcının tüm odalarındaki okunmamış mesaj sayısını döndürür
func (s *RoomService) GetUnreadMessagesCount(userID uint64) (int, error) {
	// Kullanıcının üye olduğu odaları ve son okuma zamanlarını al
	type RoomReadStatus struct {
		RoomID     uint64
		LastReadAt *time.Time
	}

	var roomReadStatuses []RoomReadStatus
	if err := s.db.Model(&models.RoomMember{}).
		Select("room_id, last_read_at").
		Where("user_id = ? AND is_active = true", userID).
		Scan(&roomReadStatuses).Error; err != nil {
		log.Printf("[GetUnreadMessagesCount] Kullanıcı odaları alınamadı: %v", err)
		return 0, err
	}

	if len(roomReadStatuses) == 0 {
		// Kullanıcının üye olduğu oda yok
		return 0, nil
	}

	totalUnreadCount := 0

	// Her oda için okunmamış mesaj sayısını hesapla
	for _, roomStatus := range roomReadStatuses {
		var unreadCount int64

		if roomStatus.LastReadAt == nil {
			// Hiç mesaj okunmamış, odadaki tüm mesajları say
			if err := s.db.Model(&models.Message{}).
				Where("room_id = ?", roomStatus.RoomID).
				Count(&unreadCount).Error; err != nil {
				log.Printf("[GetUnreadMessagesCount] Oda %d için mesaj sayısı alınamadı: %v", roomStatus.RoomID, err)
				continue
			}
		} else {
			// Son okuma zamanından sonraki mesajları say
			if err := s.db.Model(&models.Message{}).
				Where("room_id = ? AND timestamp > ?", roomStatus.RoomID, *roomStatus.LastReadAt).
				Count(&unreadCount).Error; err != nil {
				log.Printf("[GetUnreadMessagesCount] Oda %d için okunmamış mesaj sayısı alınamadı: %v", roomStatus.RoomID, err)
				continue
			}
		}

		totalUnreadCount += int(unreadCount)
	}

	log.Printf("[GetUnreadMessagesCount] Kullanıcı %d için toplam okunmamış mesaj: %d", userID, totalUnreadCount)
	return totalUnreadCount, nil
}

// MarkRoomAsRead odadaki mesajları okundu olarak işaretler
func (s *RoomService) MarkRoomAsRead(userID, roomID uint64) error {
	// Kullanıcının odanın üyesi olup olmadığını kontrol et
	isMember, err := s.IsUserMemberOfRoom(userID, roomID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("bu odanın üyesi değilsiniz")
	}

	// RoomMember'da LastReadAt'ı güncelle
	now := time.Now()
	if err := s.db.Model(&models.RoomMember{}).
		Where("user_id = ? AND room_id = ?", userID, roomID).
		Update("last_read_at", now).Error; err != nil {
		log.Printf("[MarkRoomAsRead] Hata: %v", err)
		return err
	}

	log.Printf("[MarkRoomAsRead] Oda %d kullanıcı %d için okundu olarak işaretlendi", roomID, userID)
	return nil
}
