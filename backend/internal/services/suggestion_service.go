package services

import (
	"event/backend/internal/models"
	"event/backend/internal/repository"
	"sort"
	"time"
)

// SuggestionService önerileri yöneten servisi temsil eder
type SuggestionService struct {
	UserRepo     repository.UserRepository
	EventRepo    repository.EventRepository
	InterestRepo repository.InterestRepository
	RoomRepo     repository.RoomRepository
}

// NewSuggestionService yeni bir SuggestionService oluşturur
func NewSuggestionService(
	userRepo repository.UserRepository,
	eventRepo repository.EventRepository,
	interestRepo repository.InterestRepository,
	roomRepo repository.RoomRepository,
) *SuggestionService {
	return &SuggestionService{
		UserRepo:     userRepo,
		EventRepo:    eventRepo,
		InterestRepo: interestRepo,
		RoomRepo:     roomRepo,
	}
}

// EventSuggestion bir etkinlik önerisini temsil eder
type EventSuggestion struct {
	Event            models.Event `json:"event"`
	MatchScore       float64      `json:"match_score"` // 0-100 arasında eşleşme puanı
	CommonInterests  []string     `json:"common_interests"`
	FriendsAttending []string     `json:"friends_attending,omitempty"`
}

// GetSuggestedEvents kullanıcı için etkinlik önerileri döndürür
func (s *SuggestionService) GetSuggestedEvents(userID uint64) ([]models.Event, error) {
	// Kullanıcıyı ve ilgi alanlarını getir
	user, err := s.UserRepo.FindByIDWithInterests(userID)
	if err != nil {
		return nil, err
	}

	// Kullanıcının ilgi alanlarını bir haritada tut
	userInterests := make(map[string]bool)
	for _, interest := range user.Interests {
		userInterests[interest.Name] = true
	}

	// Kullanıcının arkadaşlarını bul
	friends, err := s.UserRepo.GetUserFriends(userID)
	if err != nil {
		return nil, err
	}

	// Kullanıcının oda üyeliklerini bul
	roomMemberships, err := s.RoomRepo.GetUserRoomMemberships(userID)
	if err != nil {
		return nil, err
	}

	// Kullanıcının arkadaşlarının ilgi alanlarını topla
	friendInterests := make(map[string]int)
	for _, friend := range friends {
		for _, interest := range friend.Interests {
			friendInterests[interest.Name]++
		}
	}

	// Şu andan itibaren gelecekteki etkinlikleri al
	now := time.Now()
	events, err := s.EventRepo.GetUpcomingEvents(now)
	if err != nil {
		return nil, err
	}

	var suggestions []EventSuggestion
	var suggestedEvents []models.Event

	for _, event := range events {
		// Özel etkinlikleri kontrol et - sadece kullanıcı davetliyse veya odanın üyesiyse öner
		if event.IsPrivate {
			// Etkinlik bir odaya aitse ve kullanıcı o odanın üyesi değilse atla
			if event.RoomID != nil {
				isMember := false
				for _, membership := range roomMemberships {
					if membership.RoomID == *event.RoomID {
						isMember = true
						break
					}
				}
				if !isMember {
					continue
				}
			} else {
				// Odası olmayan özel etkinlikler için davet kontrolü yapılabilir
				// Şimdilik bu tür etkinlikleri atlayalım
				continue
			}
		}

		// Etkinliğin organizatörünü ve katılımcılarını getir
		eventCreator, err := s.UserRepo.FindByIDWithInterests(event.CreatorUserID)
		if err != nil {
			continue
		}

		// Etkinlik sahibinin ilgi alanlarını topla
		creatorInterests := make(map[string]bool)
		for _, interest := range eventCreator.Interests {
			creatorInterests[interest.Name] = true
		}

		// Etkinliğe katılan arkadaşları bul
		var friendsAttending []string
		// Not: Bu kısım, sistemde etkinliğe katılanları takip eden bir yapı olduğunda doldurulabilir

		// Eşleşme puanını hesapla
		matchScore := 0.0
		var commonInterests []string

		// İlgi alanı eşleşmelerini kontrol et
		for interest := range userInterests {
			if creatorInterests[interest] {
				commonInterests = append(commonInterests, interest)
				matchScore += 20.0 // Her ortak ilgi alanı için 20 puan
			}
		}

		// Arkadaş ilgi alanı eşleşmelerini kontrol et
		for interest, count := range friendInterests {
			if creatorInterests[interest] && !userInterests[interest] {
				// Kullanıcının olmayıp arkadaşların olan ilgi alanları
				commonInterests = append(commonInterests, interest+" (arkadaşlarınızdan)")
				matchScore += 10.0 * float64(count) / float64(len(friends)) // Popülerliğe göre ağırlıklandırılmış
			}
		}

		// Katılan arkadaş sayısına göre puanı artır
		matchScore += float64(len(friendsAttending)) * 15.0

		// Eşleşme puanını 0-100 arasında sınırla
		if matchScore > 100.0 {
			matchScore = 100.0
		}

		// Eşleşme varsa listeye ekle
		if matchScore > 0 || len(friendsAttending) > 0 {
			suggestions = append(suggestions, EventSuggestion{
				Event:            event,
				MatchScore:       matchScore,
				CommonInterests:  commonInterests,
				FriendsAttending: friendsAttending,
			})
			suggestedEvents = append(suggestedEvents, event)
		}
	}

	// Sonuçları eşleşme puanına göre sırala
	sort.Slice(suggestions, func(i, j int) bool {
		return suggestions[i].MatchScore > suggestions[j].MatchScore
	})

	// Sadece eventleri döndürmek için yeniden düzenleme
	sortedEvents := make([]models.Event, len(suggestions))
	for i, s := range suggestions {
		sortedEvents[i] = s.Event
	}

	return sortedEvents, nil
}
