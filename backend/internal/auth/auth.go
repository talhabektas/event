package auth

import (
	"errors"
	"event/backend/internal/config"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// GetUserIDFromContext, Gin context'inden kullanıcı ID'sini alır.
// Token doğrulama middleware'i (örn: JWTAuthMiddleware) tarafından context'e eklenmiş olmalıdır.
func GetUserIDFromContext(c *gin.Context) (uint64, error) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		return 0, fmt.Errorf("kullanıcı ID'si context'te bulunamadı")
	}

	userID, ok := userIDInterface.(uint64)
	if !ok {
		// Farklı bir type assertion da denenebilir, örneğin float64 (bazı JWT kütüphaneleri sayıları float64 olarak parse edebilir)
		userIDFloat, okFloat := userIDInterface.(float64)
		if okFloat {
			return uint64(userIDFloat), nil
		}
		return 0, fmt.Errorf("kullanıcı ID'si context'te geçersiz tipte (beklenen uint64 veya float64, alınan: %T)", userIDInterface)
	}

	return userID, nil
}

// ValidateTokenAndGetUserID, bir JWT'yi doğrular ve kullanıcı kimliğini döndürür.
// Config'i artık parametre olarak almıyor, kendi içinde yüklüyor.
func ValidateTokenAndGetUserID(tokenString string) (uint64, error) {
	if tokenString == "" {
		return 0, errors.New("token sağlanmadı")
	}

	// Yapılandırmayı bu fonksiyon içinde yükle
	cfg, err := config.LoadConfig()
	if err != nil {
		return 0, fmt.Errorf("yapılandırma yüklenemedi: %w", err)
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("beklenmeyen imzalama metodu: %v", token.Header["alg"])
		}
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return 0, fmt.Errorf("token ayrıştırılamadı: %w", err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			return 0, errors.New("user_id claim'i bulunamadı veya geçersiz formatta")
		}
		return uint64(userIDFloat), nil
	}

	return 0, errors.New("geçersiz token")
}
