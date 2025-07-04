package handlers

import (
	"log"
	"net/http"
	"strconv"

	"event/backend/internal/auth"
	appWS "event/backend/internal/websocket"

	"github.com/gin-gonic/gin"
	gorillaWS "github.com/gorilla/websocket"
)

var upgrader = gorillaWS.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Geliştirme ortamında tüm originlere izin ver
		// Üretimde burayı kendi domain'inizle kısıtlamalısınız
		// origin := r.Header.Get("Origin")
		// return origin == "http://localhost:3000" || origin == "http://yourfrontenddomain.com"
		return true
	},
}

// ServeWsRoom handles websocket requests for a specific room.
func ServeWsRoom(hub *appWS.Hub, c *gin.Context) {
	roomIDStr := c.Param("roomId")

	roomID, err := strconv.ParseUint(roomIDStr, 10, 64)
	if err != nil {
		log.Printf("Invalid room ID format (RoomID: %s): %v", roomIDStr, err)
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID format"})
		return
	}

	// Token'ı query parametresinden al
	tokenString := c.Query("token")
	if tokenString == "" {
		log.Printf("WebSocket Unauthorized: Token not provided in query params (RoomID: %s)", roomIDStr)
		// WebSocket upgrade öncesi olduğu için JSON yanıtı dönebiliriz veya handshake'i doğrudan reddedebiliriz.
		// Gorilla WebSocket dokümantasyonuna göre, handshake sırasında hata vermek için http.Error kullanılabilir.
		// c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Token not provided"})
		// Şimdilik, istemcinin hatayı alabilmesi için JSON dönelim.
		// Daha iyisi, websocket handshake hatası olarak dönmek olabilir.
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Token not provided"})
		return
	}

	// Token'ı doğrula ve kullanıcı ID'sini al
	// Bu fonksiyonun auth paketinde olması beklenir: ValidateTokenAndGetUserID(tokenString string) (uint, error)
	userID, err := auth.ValidateTokenAndGetUserID(tokenString) // auth.GetUserIDFromContext(c) yerine bu geldi
	if err != nil {
		log.Printf("WebSocket Unauthorized: Invalid token (RoomID: %s, Error: %v)", roomIDStr, err)
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: " + err.Error()})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to set websocket upgrade (RoomID: %s): %+v", roomIDStr, err)
		return
	}

	client := &appWS.Client{
		Hub:    hub,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		RoomID: roomID,
		UserID: userID,
	}
	client.Hub.Register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.WritePump()
	go client.ReadPump()

	log.Printf("Client connected to room '%d', user %d", roomID, userID)
}
