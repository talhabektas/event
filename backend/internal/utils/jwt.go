package utils

import (
	"errors"
	"fmt"
	"time"

	"event/backend/internal/config"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims JWT token içeriğini temsil eder
type JWTClaims struct {
	UserID uint64 `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// GenerateToken yeni bir JWT token oluşturur
func GenerateToken(userID uint64, email string, cfg *config.Config) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(cfg.JWTExpiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}

// GenerateRefreshToken yenileme tokeni oluşturur
func GenerateRefreshToken(userID uint64, cfg *config.Config) (string, error) {
	claims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(cfg.RefreshExpiration)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    "event-app",
		Subject:   fmt.Sprintf("%d", userID),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.RefreshSecret))
}

// ValidateToken JWT token'ı doğrular ve içeriğini döndürür
func ValidateToken(tokenString string, cfg *config.Config) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("beklenmeyen imzalama metodu")
		}
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("geçersiz token")
}

// ValidateRefreshToken yenileme tokenini doğrular ve kullanıcı ID'sini döndürür
func ValidateRefreshToken(tokenString string, cfg *config.Config) (uint64, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("beklenmeyen imza yöntemi: %v", token.Header["alg"])
		}

		return []byte(cfg.RefreshSecret), nil
	})

	if err != nil {
		return 0, err
	}

	if !token.Valid {
		return 0, errors.New("geçersiz yenileme tokeni")
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok {
		return 0, errors.New("token içeriği okunamadı")
	}

	// Subject'ten userID'yi çıkar
	var userID uint64
	_, err = fmt.Sscanf(claims.Subject, "%d", &userID)
	if err != nil {
		return 0, errors.New("token içindeki kullanıcı ID'si geçersiz")
	}

	return userID, nil
}

// ExtractTokenFromHeader "Bearer" Authorization header'ından token çıkarır
func ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", errors.New("Authorization header bulunamadı")
	}

	var tokenString string
	_, err := fmt.Sscanf(authHeader, "Bearer %s", &tokenString)
	if err != nil {
		return "", errors.New("geçersiz Authorization header formatı. 'Bearer TOKEN' olmalı")
	}

	return tokenString, nil
}
