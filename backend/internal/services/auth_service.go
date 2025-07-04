package services

import (
	"errors"
	"event/backend/internal/config"
	"event/backend/internal/models"
	"event/backend/internal/utils"
	"event/backend/pkg/database"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthService kimlik doğrulama işlemlerini yöneten servis
type AuthService struct {
	config *config.Config
}

// NewAuthService yeni bir AuthService örneği oluşturur
func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{
		config: cfg,
	}
}

// LoginResponse giriş yanıtını temsil eder
type LoginResponse struct {
	Token        string      `json:"token"`
	RefreshToken string      `json:"refresh_token"`
	User         models.User `json:"user"`
}

// Register yeni kullanıcı kaydı yapar
func (s *AuthService) Register(username, email, password, firstName, lastName string) (*LoginResponse, error) {
	db := database.GetDB()

	// E-posta veya kullanıcı adı kontrolü
	var existingUser models.User
	if err := db.Where("email = ? OR username = ?", email, username).First(&existingUser).Error; err == nil {
		if existingUser.Email == email {
			return nil, errors.New("bu e-posta adresi zaten kullanımda")
		}
		if existingUser.Username == username {
			return nil, errors.New("bu kullanıcı adı zaten kullanımda")
		}
	}

	// Şifreyi hashle
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("şifre hashlenirken hata oluştu")
	}

	// Yeni kullanıcı oluştur
	user := models.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		FirstName:    firstName,
		LastName:     lastName,
	}

	if err := db.Create(&user).Error; err != nil {
		return nil, errors.New("kullanıcı oluşturulurken hata oluştu")
	}

	// JWT token oluştur
	token, err := utils.GenerateToken(user.ID, user.Email, s.config)
	if err != nil {
		return nil, err
	}

	// Refresh token oluştur
	refreshToken, err := utils.GenerateRefreshToken(user.ID, s.config)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

// Login kullanıcı girişi yapar ve JWT token döndürür
func (s *AuthService) Login(email, password string) (*LoginResponse, error) {
	db := database.GetDB()

	// Kullanıcıyı bul
	var user models.User
	if err := db.Preload("Interests").Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("kullanıcı bulunamadı")
		}
		return nil, err
	}

	// Şifreyi kontrol et
	if err := user.CheckPassword(password); err != nil {
		return nil, errors.New("geçersiz şifre")
	}

	// JWT token oluştur
	token, err := utils.GenerateToken(user.ID, user.Email, s.config)
	if err != nil {
		return nil, err
	}

	// Refresh token oluştur
	refreshToken, err := utils.GenerateRefreshToken(user.ID, s.config)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

// GetUserByID kullanıcıyı ID ile bulur
func (s *AuthService) GetUserByID(id uint64) (*models.User, error) {
	db := database.GetDB()
	var user models.User

	if err := db.Preload("Interests").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("kullanıcı bulunamadı")
		}
		return nil, err
	}

	return &user, nil
}

// RefreshToken yenileme tokeni ile yeni bir JWT token alır
func (s *AuthService) RefreshToken(refreshToken string) (*LoginResponse, error) {
	// Yenileme tokenini doğrula
	userID, err := utils.ValidateRefreshToken(refreshToken, s.config)
	if err != nil {
		return nil, errors.New("geçersiz yenileme tokeni")
	}

	// Kullanıcıyı bul
	user, err := s.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	// Yeni JWT token oluştur
	token, err := utils.GenerateToken(user.ID, user.Email, s.config)
	if err != nil {
		return nil, err
	}

	// Yeni refresh token oluştur
	newRefreshToken, err := utils.GenerateRefreshToken(user.ID, s.config)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token:        token,
		RefreshToken: newRefreshToken,
		User:         *user,
	}, nil
}

// GenerateToken kullanıcı için JWT token oluşturur
func (s *AuthService) GenerateToken(userID uint64) (string, error) {
	// Kullanıcı bilgilerini kontrol et
	user, err := s.GetUserByID(userID)
	if err != nil {
		return "", err
	}

	// Token oluştur
	token, err := utils.GenerateToken(user.ID, user.Email, s.config)
	if err != nil {
		return "", err
	}

	return token, nil
}

// IsStrongPassword şifre güvenliğini kontrol eder
// Minimum 8 karakter, en az 1 büyük harf, 1 küçük harf ve 1 rakam
func IsStrongPassword(password string) bool {
	if len(password) < 8 {
		return false
	}

	var (
		hasUpper  bool
		hasLower  bool
		hasNumber bool
	)

	for _, char := range password {
		switch {
		case 'a' <= char && char <= 'z':
			hasLower = true
		case 'A' <= char && char <= 'Z':
			hasUpper = true
		case '0' <= char && char <= '9':
			hasNumber = true
		}
	}

	return hasUpper && hasLower && hasNumber
}
