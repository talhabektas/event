package services

import (
	"encoding/json"
	"errors"
	"event/backend/internal/models"
	"event/backend/pkg/database"
)

// ProposalService etkinlik önerileri/davetleri işlemlerini yöneten servis
type ProposalService struct{}

// NewProposalService yeni bir ProposalService örneği oluşturur
func NewProposalService() *ProposalService {
	return &ProposalService{}
}

// CreateProposalDTO yeni öneri/davet oluşturma için veri transfer nesnesi
type CreateProposalDTO struct {
	RecipientUserID      uint64           `json:"recipient_user_id" binding:"required"`
	EventID              *uint64          `json:"event_id"`
	ProposedEventDetails *json.RawMessage `json:"proposed_event_details"`
}

// CreateProposal yeni bir öneri/davet oluşturur
func (s *ProposalService) CreateProposal(suggesterID uint64, dto CreateProposalDTO) (*models.EventProposal, error) {
	db := database.GetDB()

	// Alıcı kullanıcının varlığını kontrol et
	var recipient models.User
	if err := db.First(&recipient, dto.RecipientUserID).Error; err != nil {
		return nil, errors.New("alıcı kullanıcı bulunamadı")
	}

	// Kendine öneri yapma kontrolü
	if suggesterID == dto.RecipientUserID {
		return nil, errors.New("kendinize öneri yapamazsınız")
	}

	// Arkadaşlık veya oda üyeliği kontrolü
	var friendship models.Friendship
	var roomMember models.RoomMember
	isFriend := db.Where("((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)) AND status = 'accepted'",
		suggesterID, dto.RecipientUserID, dto.RecipientUserID, suggesterID).First(&friendship).Error == nil
	isRoomMember := db.Where("user_id = ? AND is_active = true", dto.RecipientUserID).First(&roomMember).Error == nil

	if !isFriend && !isRoomMember {
		return nil, errors.New("sadece arkadaşlarınıza veya oda üyelerine öneri yapabilirsiniz")
	}

	// Etkinlik ID'si varsa, etkinliğin varlığını ve erişim yetkisini kontrol et
	if dto.EventID != nil {
		var event models.Event
		if err := db.First(&event, dto.EventID).Error; err != nil {
			return nil, errors.New("etkinlik bulunamadı")
		}

		// Etkinliğe erişim yetkisi kontrolü
		if event.CreatorUserID != suggesterID {
			return nil, errors.New("bu etkinliği önerme yetkiniz yok")
		}
	}

	// Öneriyi oluştur
	var proposedDetails models.JSONB
	if dto.ProposedEventDetails != nil {
		var m map[string]interface{}
		if err := json.Unmarshal(*dto.ProposedEventDetails, &m); err != nil {
			return nil, errors.New("proposed_event_details geçersiz JSON")
		}
		proposedDetails = m
	}
	proposal := models.EventProposal{
		SuggesterUserID:          suggesterID,
		RecipientUserID:          dto.RecipientUserID,
		EventID:                  dto.EventID,
		ProposedEventDetailsJSON: proposedDetails,
		Status:                   "pending",
	}

	if err := db.Create(&proposal).Error; err != nil {
		return nil, err
	}

	return &proposal, nil
}

// GetIncomingProposals kullanıcıya gelen önerileri/davetleri listeler
func (s *ProposalService) GetIncomingProposals(userID uint64) ([]models.EventProposal, error) {
	db := database.GetDB()
	var proposals []models.EventProposal

	if err := db.Where("recipient_user_id = ?", userID).
		Preload("Suggester").
		Preload("Event").
		Find(&proposals).Error; err != nil {
		return nil, err
	}

	return proposals, nil
}

// GetOutgoingProposals kullanıcının gönderdiği önerileri/davetleri listeler
func (s *ProposalService) GetOutgoingProposals(userID uint64) ([]models.EventProposal, error) {
	db := database.GetDB()
	var proposals []models.EventProposal

	if err := db.Where("suggester_user_id = ?", userID).
		Preload("Recipient").
		Preload("Event").
		Find(&proposals).Error; err != nil {
		return nil, err
	}

	return proposals, nil
}

// RespondToProposal öneriye cevap verir
func (s *ProposalService) RespondToProposal(proposalID uint64, userID uint64, response string) error {
	db := database.GetDB()

	// Öneriyi bul
	var proposal models.EventProposal
	if err := db.First(&proposal, proposalID).Error; err != nil {
		return errors.New("öneri bulunamadı")
	}

	// Yetki kontrolü
	if proposal.RecipientUserID != userID {
		return errors.New("bu öneriye cevap verme yetkiniz yok")
	}

	// Durum kontrolü
	if proposal.Status != "pending" {
		return errors.New("bu öneri zaten yanıtlanmış")
	}

	// Geçerli yanıt kontrolü
	if response != "accepted" && response != "declined" {
		return errors.New("geçersiz yanıt")
	}

	// Öneriyi güncelle
	proposal.Status = models.ProposalStatus(response)
	return db.Save(&proposal).Error
}

// CreateCounterProposal karşı öneri oluşturur
func (s *ProposalService) CreateCounterProposal(proposalID uint64, userID uint64, counterEventDetails json.RawMessage) error {
	db := database.GetDB()

	// Orijinal öneriyi bul
	var originalProposal models.EventProposal
	if err := db.First(&originalProposal, proposalID).Error; err != nil {
		return errors.New("öneri bulunamadı")
	}

	// Yetki kontrolü
	if originalProposal.RecipientUserID != userID {
		return errors.New("bu öneriye karşı öneri yapma yetkiniz yok")
	}

	// Durum kontrolü
	if originalProposal.Status != "pending" {
		return errors.New("bu öneriye karşı öneri yapılamaz")
	}

	// Transaction başlat
	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// Orijinal öneriyi güncelle
	originalProposal.Status = "counter_proposed"
	if err := tx.Save(&originalProposal).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Karşı öneriyi oluştur
	var newDetails models.JSONB
	if err := json.Unmarshal(counterEventDetails, &newDetails); err != nil {
		return errors.New("karşı öneri detayları geçersiz JSON")
	}
	counterProposal := models.CounterProposal{
		OriginalProposalID:  proposalID,
		NewEventDetailsJSON: newDetails,
	}

	if err := tx.Create(&counterProposal).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Transaction'ı tamamla
	return tx.Commit().Error
}
