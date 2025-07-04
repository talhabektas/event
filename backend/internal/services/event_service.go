package services

import (
	"errors"
	"event/backend/internal/models"
	"event/backend/pkg/database"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// EventService etkinlik işlemlerini yöneten servis
type EventService struct {
	db *gorm.DB
}

// NewEventService yeni bir EventService örneği oluşturur
func NewEventService() *EventService {
	return &EventService{
		db: database.GetDB(),
	}
}

// GetAllPublicEvents tüm herkese açık etkinlikleri listeler (pagination ile)
func (s *EventService) GetAllPublicEvents(page, limit int) ([]models.Event, int64, error) {
	var events []models.Event
	var total int64

	// Toplam kayıt sayısını hesapla (is_private filtresi kaldırıldı)
	if err := s.db.Model(&models.Event{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Offset hesapla
	offset := (page - 1) * limit

	// Herkese açık etkinlikleri getir (is_private filtresi kaldırıldı)
	if err := s.db.Preload("Creator").
		Preload("Room").
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&events).Error; err != nil {
		return nil, 0, err
	}

	return events, total, nil
}

// CreateEventDTO yeni etkinlik oluşturma için veri transfer nesnesi
type CreateEventDTO struct {
	Title       string   `json:"title" binding:"required,min=3,max=100"`
	Description string   `json:"description" binding:"required,min=10,max=500"`
	RoomID      *uint    `json:"room_id"`
	IsPrivate   bool     `json:"is_private"`
	ImageURL    string   `json:"image_url" binding:"omitempty,url"`
	TimeOptions []string `json:"time_options" binding:"required,min=1"` // ISO 8601 formatında tarih listesi
}

// UpdateEventDTO etkinlik güncelleme için veri transfer nesnesi
type UpdateEventDTO struct {
	Title       string   `json:"title" binding:"omitempty,min=3,max=100"`
	Description string   `json:"description" binding:"omitempty,min=10,max=500"`
	IsPrivate   *bool    `json:"is_private"`
	TimeOptions []string `json:"time_options" binding:"omitempty,min=1"` // ISO 8601 formatında tarih listesi
}

// CreateEvent yeni bir etkinlik oluşturur
func (s *EventService) CreateEvent(creatorID uint64, dto CreateEventDTO) (*models.Event, error) {
	// Transaction başlat
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	var eventRoomIDPointer *uint64
	if dto.RoomID != nil {
		// DTO'dan gelen *uint değerini alıp *uint64'e çeviriyoruz
		tempRoomID := uint64(*dto.RoomID)
		eventRoomIDPointer = &tempRoomID
	}

	// Etkinliği oluştur
	event := models.Event{
		Title:         dto.Title,
		Description:   dto.Description,
		CreatorUserID: creatorID,
		RoomID:        eventRoomIDPointer, // *uint64 tipindeki işaretçiyi ata
		IsPrivate:     dto.IsPrivate,
		ImageURL:      dto.ImageURL,
	}

	if err := tx.Create(&event).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Zaman seçeneklerini ekle
	for _, timeStr := range dto.TimeOptions {
		parsedTime, err := time.Parse(time.RFC3339, timeStr)
		if err != nil {
			tx.Rollback()
			return nil, errors.New("geçersiz tarih formatı")
		}
		// Örnek: Her bir timeStr için 2 saatlik bir aralık ekliyoruz
		endTime := parsedTime.Add(2 * time.Hour)
		timeOption := models.EventTimeOption{
			EventID:   event.ID,
			StartTime: parsedTime,
			EndTime:   endTime,
		}
		if err := tx.Create(&timeOption).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	// Transaction'ı tamamla
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &event, nil
}

// GetUserEvents kullanıcının görebileceği etkinlikleri listeler
func (s *EventService) GetUserEvents(userID uint64) ([]models.Event, error) {
	var events []models.Event

	// Kullanıcının görebileceği etkinlikleri getir:
	// 1. Kendi etkinlikleri
	// 2. Arkadaşlarının herkese açık etkinlikleri
	// 3. Üye olduğu odaların etkinlikleri
	if err := s.db.Where(`
		(creator_user_id = ?) OR
		(is_private = false AND creator_user_id IN (
			SELECT CASE 
				WHEN requester_id = ? THEN addressee_id
				ELSE requester_id
			END
			FROM friendships
			WHERE (requester_id = ? OR addressee_id = ?)
			AND status = 'accepted'
		)) OR
		(room_id IN (
			SELECT room_id
			FROM room_members
			WHERE user_id = ?
		))
	`, userID, userID, userID, userID, userID).
		Preload("Creator").
		Preload("Room").
		Preload("TimeOptions").
		Find(&events).Error; err != nil {
		return nil, err
	}

	return events, nil
}

// GetEventByID belirli bir etkinliğin detaylarını getirir
func (s *EventService) GetEventByID(eventID uint64, userID uint64) (*models.Event, int64, error) {
	var event models.Event
	log.Printf("[EventService] GetEventByID çağrıldı. eventID: %d, userID: %d", eventID, userID)

	if err := s.db.Preload("Creator").
		Preload("Room").
		Preload("TimeOptions").
		First(&event, eventID).Error; err != nil {
		log.Printf("[EventService] Etkinlik bulunurken hata: %v", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, errors.New("etkinlik bulunamadı")
		}
		return nil, 0, err // Diğer veritabanı hataları
	}
	log.Printf("[EventService] Etkinlik bulundu: %+v", event)

	// Katılımcı sayısını hesapla
	var attendeesCount int64
	// EventAttendee modelinin ve ilişkili tablonun doğru olduğunu varsayıyoruz.
	// Eğer farklıysa, model adı (EventAttendee) ve where koşulu (EventID) güncellenmeli.
	if err := s.db.Model(&models.EventAttendance{}).Where("event_id = ? AND status = ?", eventID, models.AttendanceAttending).Count(&attendeesCount).Error; err != nil {
		log.Printf("[EventService] Etkinlik katılımcı sayısı alınırken hata: %v", err)
		// Hata durumunda katılımcı sayısını 0 kabul edip devam edebilir veya hatayı yukarı fırlatabiliriz.
		// Şimdilik loglayıp 0 ile devam edelim, böylece etkinlik detayı yine de gösterilebilir.
		attendeesCount = 0
	}
	log.Printf("[EventService] Etkinlik katılımcı sayısı: %d", attendeesCount)

	// Erişim kontrolü
	if event.IsPrivate {
		log.Println("[EventService] Etkinlik özel (IsPrivate = true)")
		if userID == 0 {
			log.Println("[EventService] Anonim kullanıcı özel etkinliğe erişmeye çalışıyor.")
			return nil, 0, errors.New("bu özel etkinliği görüntülemek için giriş yapmalısınız")
		}
		log.Printf("[EventService] Giriş yapmış kullanıcı (ID: %d) özel etkinliğe erişiyor.", userID)

		if event.CreatorUserID != userID { // Kullanıcı etkinliğin sahibi değilse
			log.Printf("[EventService] Kullanıcı (ID: %d) etkinliğin sahibi değil (Sahip ID: %d). Arkadaşlık kontrol edilecek.", userID, event.CreatorUserID)
			// Arkadaşlık kontrolü
			var friendship models.Friendship
			errFriendship := s.db.Where("((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)) AND status = 'accepted'",
				userID, event.CreatorUserID, event.CreatorUserID, userID).
				First(&friendship).Error
			log.Printf("[EventService] Arkadaşlık sorgusu sonucu errFriendship: %v", errFriendship)

			isFriend := false
			if errFriendship == nil { // Hata yoksa arkadaştır
				isFriend = true
				log.Println("[EventService] Kullanıcı etkinliğin sahibiyle arkadaş.")
			} else if !errors.Is(errFriendship, gorm.ErrRecordNotFound) { // Kayıt bulunamadı dışında bir hata ise
				log.Printf("[EventService] Arkadaşlık sorgusunda beklenmedik hata: %v", errFriendship)
				return nil, 0, errFriendship // Bu gerçek bir DB hatası, yukarı fırlat
			} else {
				log.Println("[EventService] Kullanıcı etkinliğin sahibiyle arkadaş değil (kayıt bulunamadı).")
			}

			if !isFriend { // Arkadaş değilse oda üyeliğini kontrol et
				log.Println("[EventService] Kullanıcı arkadaş değil. Oda üyeliği kontrol edilecek.")
				if event.RoomID != nil {
					log.Printf("[EventService] Etkinliğin odası var (RoomID: %d). Üyelik kontrol ediliyor.", *event.RoomID)
					var member models.RoomMember
					errMember := s.db.Where("room_id = ? AND user_id = ?", *event.RoomID, userID).
						First(&member).Error
					log.Printf("[EventService] Oda üyeliği sorgusu sonucu errMember: %v", errMember)

					isMember := false
					if errMember == nil { // Hata yoksa üyedir
						isMember = true
						log.Println("[EventService] Kullanıcı odaya üye.")
					} else if !errors.Is(errMember, gorm.ErrRecordNotFound) { // Kayıt bulunamadı dışında bir hata ise
						log.Printf("[EventService] Oda üyeliği sorgusunda beklenmedik hata: %v", errMember)
						return nil, 0, errMember // Bu gerçek bir DB hatası, yukarı fırlat
					} else {
						log.Println("[EventService] Kullanıcı odaya üye değil (kayıt bulunamadı).")
					}

					if !isMember { // Ne arkadaş ne de üye ise erişemez
						log.Println("[EventService] Kullanıcı ne sahip, ne arkadaş, ne de oda üyesi. Erişim reddedildi.")
						return nil, 0, errors.New("bu özel etkinliğe erişim yetkiniz yok (ne sahip, ne arkadaş, ne de oda üyesi)")
					}
				} else { // Oda yoksa ve arkadaş da değilse (ve sahip de değilse) erişemez
					log.Println("[EventService] Etkinliğin odası yok ve kullanıcı arkadaş değil. Erişim reddedildi.")
					return nil, 0, errors.New("bu özel etkinliğe erişim yetkiniz yok (ne sahip, ne arkadaş)")
				}
			}
		} else {
			log.Println("[EventService] Kullanıcı etkinliğin sahibi. Erişim verildi.")
		}
	} else {
		log.Println("[EventService] Etkinlik herkese açık (IsPrivate = false). Erişim verildi.")
	}

	log.Println("[EventService] GetEventByID başarıyla tamamlandı. Etkinlik ve katılımcı sayısı döndürülüyor.")
	return &event, attendeesCount, nil
}

// UpdateEvent etkinliği günceller
func (s *EventService) UpdateEvent(eventID uint64, userID uint64, dto UpdateEventDTO) (*models.Event, error) {
	var event models.Event

	// Etkinliği bul ve sahibini kontrol et
	if err := s.db.First(&event, eventID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("etkinlik bulunamadı")
		}
		return nil, err
	}

	if event.CreatorUserID != userID {
		return nil, errors.New("bu etkinliği güncelleme yetkiniz yok")
	}

	// Güncelleme verilerini hazırla
	updates := make(map[string]interface{})
	if dto.Title != "" {
		updates["title"] = dto.Title
	}
	if dto.Description != "" {
		updates["description"] = dto.Description
	}
	if dto.IsPrivate != nil {
		updates["is_private"] = *dto.IsPrivate
	}

	// Etkinliği güncelle
	if err := s.db.Model(&event).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Zaman seçeneklerini güncellemek (opsiyonel):
	// Bu kısım daha karmaşık olabilir. Mevcutları silip yenilerini eklemek bir yöntemdir.
	if len(dto.TimeOptions) > 0 {
		// Mevcut zaman seçeneklerini sil
		if err := s.db.Where("event_id = ?", eventID).Delete(&models.EventTimeOption{}).Error; err != nil {
			return nil, err
		}
		// Yeni zaman seçeneklerini ekle
		for _, timeStr := range dto.TimeOptions {
			parsedTime, err := time.Parse(time.RFC3339, timeStr)
			if err != nil {
				return nil, errors.New("geçersiz tarih formatı")
			}
			timeOption := models.EventTimeOption{
				EventID:   eventID,
				StartTime: parsedTime,
			}
			if err := s.db.Create(&timeOption).Error; err != nil {
				return nil, err
			}
		}
	}

	// Güncellenmiş etkinliği geri döndür
	return &event, nil
}

// DeleteEvent bir etkinliği siler
func (s *EventService) DeleteEvent(eventID uint64, userID uint64) error {
	var event models.Event

	// Etkinliği bul ve sahibini kontrol et
	if err := s.db.First(&event, eventID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("etkinlik bulunamadı")
		}
		return err
	}

	if event.CreatorUserID != userID {
		return errors.New("bu etkinliği silme yetkiniz yok")
	}

	// Etkinliği sil
	if err := s.db.Delete(&event).Error; err != nil {
		return err
	}
	return nil
}

// VoteForTimeOption kullanıcı bir zaman seçeneğine oy verir
func (s *EventService) VoteForTimeOption(eventID uint64, optionID uint64, userID uint64) error {
	var event models.Event
	if err := s.db.First(&event, eventID).Error; err != nil {
		return errors.New("etkinlik bulunamadı")
	}
	// TODO: Özel etkinlikler için erişim kontrolü eklenebilir.

	var timeOption models.EventTimeOption
	if err := s.db.First(&timeOption, optionID).Error; err != nil {
		return errors.New("zaman seçeneği bulunamadı")
	}

	if timeOption.EventID != eventID {
		return errors.New("bu zaman seçeneği bu etkinliğe ait değil")
	}

	// Kullanıcının daha önce bu seçeneğe oy verip vermediğini kontrol et
	var existingVote models.EventVote
	err := s.db.Where("user_id = ? AND event_time_option_id = ?", userID, optionID).First(&existingVote).Error
	if err == nil {
		return errors.New("bu seçeneğe zaten oy verdiniz")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err // Veritabanı hatası
	}

	// Yeni oy oluştur
	vote := models.EventVote{
		EventTimeOptionID: optionID,
		UserID:            userID,
		VotedAt:           time.Now(),
	}

	if err := s.db.Create(&vote).Error; err != nil {
		return err
	}

	// Zaman seçeneğindeki oy sayısını artır (transaction ile daha güvenli olabilir)
	timeOption.VotesCount++
	return s.db.Save(&timeOption).Error
}

// FinalizeEvent etkinliği sonlandırır ve nihai zamanı belirler
func (s *EventService) FinalizeEvent(eventID uint64, userID uint64, selectedOptionID *uint64) error {
	var event models.Event

	// Etkinliği bul ve sahibini kontrol et
	if err := s.db.First(&event, eventID).Error; err != nil {
		return errors.New("etkinlik bulunamadı")
	}

	if event.CreatorUserID != userID {
		return errors.New("bu işlemi yapma yetkiniz yok")
	}

	if selectedOptionID == nil {
		// Eğer bir seçenek belirtilmemişse, en çok oy alanı otomatik olarak seç
		var topOption models.EventTimeOption
		if err := s.db.Where("event_id = ?", eventID).Order("votes_count DESC").First(&topOption).Error; err != nil {
			return errors.New("oylanan seçenek bulunamadı")
		}
		event.FinalStartTime = &topOption.StartTime
		event.FinalEndTime = &topOption.EndTime
	} else {
		// Belirtilen seçeneği bul
		var selectedOption models.EventTimeOption
		if err := s.db.First(&selectedOption, *selectedOptionID).Error; err != nil {
			return errors.New("seçilen zaman seçeneği bulunamadı")
		}
		if selectedOption.EventID != eventID {
			return errors.New("seçilen zaman seçeneği bu etkinliğe ait değil")
		}
		event.FinalStartTime = &selectedOption.StartTime
		event.FinalEndTime = &selectedOption.EndTime
	}

	// Etkinliği güncelle
	return s.db.Save(&event).Error
}

// AttendEvent kullanıcının bir etkinliğe katılmasını sağlar.
// Eğer etkinlik özelse, katılım isteği oluşturur.
// Eğer herkese açıksa, doğrudan katılım sağlar.
func (s *EventService) AttendEvent(eventID, userID uint64) error {
	// Önce etkinliği bulalım ve özel olup olmadığını kontrol edelim.
	var event models.Event
	if err := s.db.First(&event, eventID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("etkinlik bulunamadı")
		}
		return err
	}

	// Etkinlik ÖZEL ise
	if event.IsPrivate {
		// Mevcut bir istek var mı diye kontrol et (pending, approved fark etmez)
		var existingRequest models.EventParticipationRequest
		err := s.db.Where("event_id = ? AND user_id = ?", eventID, userID).First(&existingRequest).Error
		if err == nil {
			// Zaten bir istek var, durumuna göre mesaj döndür
			if existingRequest.Status == models.RequestPending {
				return errors.New("bu etkinliğe katılım isteğiniz zaten beklemede")
			}
			return errors.New("bu etkinliğe zaten bir katılım isteğiniz mevcut veya daha önce işlenmiş")
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			// Beklenmedik bir veritabanı hatası
			return err
		}

		// Yeni katılım isteği oluştur
		request := models.EventParticipationRequest{
			EventID: eventID,
			UserID:  userID,
			Status:  models.RequestPending,
		}
		if err := s.db.Create(&request).Error; err != nil {
			return err
		}

		// Kullanıcı adını almak için küçük bir sorgu
		var user models.User
		s.db.First(&user, userID)
		notificationService := NewNotificationService() // Servisi instantiate et
		msg := fmt.Sprintf("'%s' kullanıcısı '%s' adlı özel etkinliğinize katılmak istiyor.", user.Username, event.Title)

		// BİLDİRİM DÜZELTMESİ: related_entity_id olarak event.ID yerine request.ID gönderilmeli
		_, err = notificationService.CreateNotification(event.CreatorUserID, "event_join_request", msg, &request.ID)
		if err != nil {
			log.Printf("Katılım isteği oluşturuldu ama bildirim gönderilemedi: %v", err)
			// Sadece logla, ana işlem başarılı oldu
		}

		return nil // İstek başarıyla oluşturuldu
	}

	// Etkinlik HERKESE AÇIK ise (Mevcut UPSERT mantığı)
	attendance := models.EventAttendance{
		EventID:  eventID,
		UserID:   userID,
		Status:   models.AttendanceAttending,
		JoinedAt: time.Now(),
	}

	err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "event_id"}, {Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"status"}),
	}).Create(&attendance).Error

	return err
}

// ApproveParticipationRequest bir katılım isteğini onaylar.
func (s *EventService) ApproveParticipationRequest(requestID uint64, approverID uint64) error {
	tx := s.db.Begin()

	// İsteği bul
	var request models.EventParticipationRequest
	if err := tx.Preload("Event").First(&request, requestID).Error; err != nil {
		tx.Rollback()
		return errors.New("katılım isteği bulunamadı")
	}

	// Onaylayanın etkinlik sahibi olduğunu doğrula
	if request.Event.CreatorUserID != approverID {
		tx.Rollback()
		return errors.New("bu isteği onaylama yetkiniz yok")
	}

	// İsteğin durumunu güncelle
	request.Status = models.RequestApproved
	if err := tx.Save(&request).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Onaylanan kullanıcıyı katılımcı olarak ekle
	attendance := models.EventAttendance{
		EventID:  request.EventID,
		UserID:   request.UserID,
		Status:   models.AttendanceAttending,
		JoinedAt: time.Now(),
	}
	if err := tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "event_id"}, {Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"status"}),
	}).Create(&attendance).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// DeclineParticipationRequest bir katılım isteğini reddeder.
func (s *EventService) DeclineParticipationRequest(requestID uint64, declinerID uint64) error {
	var request models.EventParticipationRequest
	if err := s.db.Preload("Event").First(&request, requestID).Error; err != nil {
		return errors.New("katılım isteği bulunamadı")
	}

	// Reddedenin etkinlik sahibi olduğunu doğrula
	if request.Event.CreatorUserID != declinerID {
		return errors.New("bu isteği reddetme yetkiniz yok")
	}

	request.Status = models.RequestRejected
	return s.db.Save(&request).Error
}

// CancelAttendance kullanıcının etkinliğe katılımını iptal eder.
func (s *EventService) CancelAttendance(eventID, userID uint64) error {
	// Sadece durumu güncelle
	return s.db.Model(&models.EventAttendance{}).
		Where("event_id = ? AND user_id = ?", eventID, userID).
		Update("status", "not_attending").Error
}

// GetEventAttendees bir etkinliğe katılanların listesini döndürür.
func (s *EventService) GetEventAttendees(eventID uint64) ([]interface{}, error) {
	var attendees []models.EventAttendance
	if err := s.db.Preload("User").
		Where("event_id = ? AND status = ?", eventID, models.AttendanceAttending).
		Find(&attendees).Error; err != nil {
		return nil, err
	}

	// Gerekli bilgileri içeren bir struct listesi döndürelim
	type AttendeeInfo struct {
		ID                uint64 `json:"id"`
		FirstName         string `json:"first_name"`
		LastName          string `json:"last_name"`
		ProfilePictureURL string `json:"profile_picture_url"`
	}

	result := make([]interface{}, len(attendees))
	for i, a := range attendees {
		result[i] = AttendeeInfo{
			ID:                a.User.ID,
			FirstName:         a.User.FirstName,
			LastName:          a.User.LastName,
			ProfilePictureURL: a.User.ProfilePictureURL,
		}
	}
	return result, nil
}

// GetEventTimeOptions bir etkinliğin zaman seçeneklerini ve oy durumlarını döndürür.
func (s *EventService) GetEventTimeOptions(eventID uint64) ([]interface{}, error) {
	type TimeOptionWithVotes struct {
		ID        uint64 `json:"id"`
		StartTime string `json:"startTime"`
		EndTime   string `json:"endTime"`
		Votes     int    `json:"votes"`
		HasVoted  bool   `json:"hasVoted"`
	}

	var options []models.EventTimeOption
	if err := s.db.Where("event_id = ?", eventID).Find(&options).Error; err != nil {
		return nil, err
	}

	// Bu kısım optimize edilebilir (tek bir sorguyla vs.)
	// Şimdilik basit tutalım
	result := make([]interface{}, len(options))
	for i, option := range options {
		var votesCount int64
		s.db.Model(&models.EventVote{}).Where("event_time_option_id = ?", option.ID).Count(&votesCount)

		// Kullanıcının oy verip vermediğini kontrol et (bu örnekte userID yok, genel liste varsayımı)
		hasVoted := false // Gerçek bir implementasyonda userID'ye göre kontrol edilmeli

		result[i] = TimeOptionWithVotes{
			ID:        option.ID,
			StartTime: option.StartTime.Format(time.RFC3339),
			EndTime:   option.EndTime.Format(time.RFC3339),
			Votes:     int(votesCount),
			HasVoted:  hasVoted,
		}
	}

	return result, nil
}

// InviteUserToEvent bir kullanıcıyı etkinliğe davet eder.
func (s *EventService) InviteUserToEvent(eventID, inviterID, inviteeID uint64) (*models.EventInvitation, error) {
	// Etkinliği ve davet eden kişinin yetkisini kontrol et
	var event models.Event
	if err := s.db.First(&event, eventID).Error; err != nil {
		return nil, errors.New("etkinlik bulunamadı")
	}

	if event.CreatorUserID != inviterID {
		// Oda admini olup olmadığını da kontrol edebiliriz
		isRoomAdmin := false
		if event.RoomID != nil {
			var member models.RoomMember
			if err := s.db.Where("room_id = ? AND user_id = ? AND role = 'admin'", *event.RoomID, inviterID).First(&member).Error; err == nil {
				isRoomAdmin = true
			}
		}
		if !isRoomAdmin {
			return nil, errors.New("bu etkinliğe davet etme yetkiniz yok")
		}
	}

	// Davet edilen kullanıcının zaten katılımcı olup olmadığını kontrol et
	var attendance models.EventAttendance
	if err := s.db.Where("event_id = ? AND user_id = ?", eventID, inviteeID).First(&attendance).Error; err == nil {
		return nil, errors.New("kullanıcı zaten etkinliğe katılıyor")
	}

	// Davetin zaten var olup olmadığını kontrol et
	var existingInvitation models.EventInvitation
	if err := s.db.Where("event_id = ? AND invitee_id = ?", eventID, inviteeID).First(&existingInvitation).Error; err == nil {
		return &existingInvitation, errors.New("bu kullanıcı zaten davet edilmiş")
	}

	// Yeni davet oluştur
	invitation := models.EventInvitation{
		EventID:   eventID,
		InviterID: inviterID,
		InviteeID: inviteeID,
		Status:    "pending",
	}

	if err := s.db.Create(&invitation).Error; err != nil {
		return nil, err
	}

	// Bildirim oluştur
	notificationService := NewNotificationService()
	_, err := notificationService.CreateNotification(inviteeID, "event_invitation", fmt.Sprintf("Etkinliğe davet edildiniz: %s", event.Title), &event.ID)
	if err != nil {
		log.Printf("Davet gönderildi ama bildirim oluşturulamadı: %v", err)
		// Bu hatayı yukarıya fırlatmak yerine sadece loglayabiliriz. Davet işlemi başarılı oldu.
	}

	return &invitation, nil
}

// GetEventsForFeed kullanıcının ana sayfa akışı için etkinlikleri getirir.
// userID 0 ise, herkese açık son etkinlikleri getirir.
func (s *EventService) GetEventsForFeed(userID uint64) ([]models.Event, error) {
	var events []models.Event
	query := s.db.Preload("Creator").Preload("Room").Order("created_at desc").Limit(20)

	if userID != 0 {
		// Giriş yapmış kullanıcı için daha karmaşık bir mantık eklenebilir.
		// Örneğin, arkadaşlarının katıldığı veya ilgi alanlarına uyan etkinlikler.
		// Şimdilik, herkese açık ve üye olduğu özel odalardaki etkinlikleri getirelim.
		var roomIDs []uint64
		s.db.Model(&models.RoomMember{}).Where("user_id = ?", userID).Pluck("room_id", &roomIDs)
		query = query.Where("is_private = ? OR room_id IN (?)", false, roomIDs)
	} else {
		// Giriş yapmamış kullanıcı için sadece herkese açık etkinlikler
		query = query.Where("is_private = ?", false)
	}

	err := query.Find(&events).Error
	return events, err
}
