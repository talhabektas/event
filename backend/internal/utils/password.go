package utils

import (
	"golang.org/x/crypto/bcrypt"
)

// PasswordConfig şifre hashleme ayarlarını içerir
type PasswordConfig struct {
	HashCost int // bcrypt maliyeti
}

// DefaultPasswordConfig varsayılan şifre konfigürasyonları
var DefaultPasswordConfig = PasswordConfig{
	HashCost: 12, // bcrypt için önerilen maliyet
}

// HashPassword şifreyi bcrypt kullanarak hashler
func HashPassword(password string) (string, error) {
	return HashPasswordWithConfig(password, DefaultPasswordConfig)
}

// HashPasswordWithConfig belirtilen konfigürasyonla şifreyi hashler
func HashPasswordWithConfig(password string, config PasswordConfig) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), config.HashCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// CheckPasswordHash bir şifrenin hash ile eşleşip eşleşmediğini kontrol eder
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// IsStrongPassword şifre karmaşıklık kurallarını kontrol eder
// Minimum 8 karakter, en az 1 büyük harf, 1 küçük harf ve 1 rakam
func IsStrongPassword(password string) bool {
	if len(password) < 8 {
		return false
	}

	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case 'a' <= char && char <= 'z':
			hasLower = true
		case 'A' <= char && char <= 'Z':
			hasUpper = true
		case '0' <= char && char <= '9':
			hasNumber = true
		case char == '!' || char == '@' || char == '#' || char == '$' || char == '%' || char == '^' || char == '&' || char == '*':
			hasSpecial = true
		}
	}

	// En az 3 şartı sağlamalı (örneğin: büyük harf, küçük harf, rakam)
	conditions := 0
	if hasUpper {
		conditions++
	}
	if hasLower {
		conditions++
	}
	if hasNumber {
		conditions++
	}
	if hasSpecial {
		conditions++
	}

	return conditions >= 3
}
