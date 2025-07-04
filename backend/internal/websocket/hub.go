package websocket

import (
	"encoding/json"
	"log"
	"strconv"

	"event/backend/internal/dtos"     // MessageDTO için
	"event/backend/internal/models"   // Veritabanı modelleri için
	"event/backend/internal/services" // ChatService ve UserService için eklenecek
	// Veritabanı erişimi için (ChatService kullanınca direkt gerekmeyebilir)
	// UserService için gerekebilir
)

// Hub aktif client'ları ve odalara mesaj yayınını yönetir.
type Hub struct {
	// Kayıtlı client'lar. Key roomID, value client'lar kümesi.
	rooms map[uint64]map[*Client]bool

	// Gelen mesajlar.
	Broadcast chan *models.Message // models.Message tipine güncellendi

	// Client'lardan kayıt istekleri.
	Register chan *Client

	// Client'lardan kayıt silme istekleri.
	Unregister chan *Client

	chatService *services.ChatService // ChatService eklendi
	userService *services.UserService // UserService eklendi
}

// HubInput, Hub oluşturmak için gereken bağımlılıkları tanımlar.
type HubInput struct {
	ChatService *services.ChatService
	UserService *services.UserService
}

// NewHub yeni bir Hub oluşturur.
func NewHub(input HubInput) *Hub {
	return &Hub{
		Broadcast:   make(chan *models.Message),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		rooms:       make(map[uint64]map[*Client]bool),
		chatService: input.ChatService,
		userService: input.UserService,
	}
}

// Run Hub'ı çalıştırır.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			if _, ok := h.rooms[client.RoomID]; !ok {
				h.rooms[client.RoomID] = make(map[*Client]bool)
			}
			h.rooms[client.RoomID][client] = true
			log.Printf("Client registered to room '%s', user %d", strconv.FormatUint(client.RoomID, 10), client.UserID)

		case client := <-h.Unregister:
			if roomClients, ok := h.rooms[client.RoomID]; ok {
				if _, ok := roomClients[client]; ok {
					delete(roomClients, client)
					close(client.Send)
					log.Printf("Client unregistered from room '%s', user %d", strconv.FormatUint(client.RoomID, 10), client.UserID)
					if len(roomClients) == 0 {
						delete(h.rooms, client.RoomID)
						log.Printf("Room '%s' closed as it has no clients", strconv.FormatUint(client.RoomID, 10))
					}
				}
			}

		case messageData := <-h.Broadcast: // Gelen veri artık ham mesaj bilgisini içeriyor.
			// Gelen *models.Message (içinde sadece RoomID, UserID ve Content var) bilgisinden
			// tam bir veritabanı kaydı oluştur.
			createdMessage, err := h.chatService.CreateMessage(messageData.RoomID, messageData.UserID, messageData.Content)
			if err != nil {
				log.Printf("Error saving message to DB: %v", err)
				continue // Mesaj kaydedilemezse yayını durdur.
			}

			// Frontend'e gönderilecek DTO'yu oluştur.
			// createdMessage.Sender bilgisi CreateMessage içinde dolduruluyor.
			messageDTO := dtos.MessageDTO{
				ID:        createdMessage.ID,
				Content:   createdMessage.Content,
				Timestamp: createdMessage.Timestamp,
				Sender: dtos.SenderDTO{
					ID:        createdMessage.Sender.ID,
					FirstName: createdMessage.Sender.FirstName,
					LastName:  createdMessage.Sender.LastName,
					AvatarURL: createdMessage.Sender.ProfilePictureURL,
				},
			}

			// DTO'yu JSON'a çevir.
			messageBytes, err := json.Marshal(messageDTO)
			if err != nil {
				log.Printf("Error marshalling message DTO: %v", err)
				continue
			}

			// Mesajı odadaki client'lara yayınla.
			if roomClients, ok := h.rooms[createdMessage.RoomID]; ok {
				for client := range roomClients {
					select {
					case client.Send <- messageBytes:
					default:
						// Mesaj gönderilemezse, bu client'ın bağlantısı sorunlu demektir.
						// Client'ı doğrudan silmek yerine Unregister kanalına göndererek
						// merkezi ve güvenli bir şekilde kaydını sil.
						log.Printf("Could not send message to client %d in room %d. Unregistering.", client.UserID, client.RoomID)
						h.Unregister <- client
					}
				}
			}
		}
	}
}
