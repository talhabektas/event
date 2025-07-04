package config

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config uygulama yapılandırmasını temsil eder
type Config struct {
	// Veritabanı ayarları
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	// JWT ayarları
	JWTSecret         string
	JWTExpiration     time.Duration
	RefreshSecret     string
	RefreshExpiration time.Duration

	// Sunucu ayarları
	Port string
	Env  string

	// CSRF
	CSRFAuthKey string
}

// LoadConfig .env dosyasından veya ortam değişkenlerinden yapılandırmayı yükler
func LoadConfig() (*Config, error) {
	// Proje kök dizinini bulmak için daha sağlam bir yöntem
	_, b, _, _ := runtime.Caller(0)
	basepath := filepath.Dir(b)
	projectRoot := filepath.Join(basepath, "..", "..") // internal/config -> backend/

	// .env dosyasının tam yolunu belirt
	envPath := filepath.Join(projectRoot, ".env")

	if err := godotenv.Load(envPath); err != nil {
		fmt.Printf("Warning: .env file not loaded from '%s', falling back to environment variables and defaults\n", envPath)
	}

	// JWT sürelerini parse et
	jwtExp, err := time.ParseDuration(getEnv("JWT_EXPIRATION", "24h"))
	if err != nil {
		return nil, err
	}

	refreshExp, err := time.ParseDuration(getEnv("REFRESH_EXPIRATION", "720h")) // 30 gün
	if err != nil {
		return nil, err
	}

	return &Config{
		// Veritabanı ayarları
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "event_db"),

		// JWT ayarları
		JWTSecret:         getEnv("JWT_SECRET", "your-secret-key"),
		JWTExpiration:     jwtExp,
		RefreshSecret:     getEnv("REFRESH_SECRET", "your-refresh-secret-key"),
		RefreshExpiration: refreshExp,

		// Sunucu ayarları
		Port: getEnv("PORT", "8082"),
		Env:  getEnv("ENV", "development"),

		// CSRF
		CSRFAuthKey: getEnv("CSRF_AUTH_KEY", "a-32-byte-long-auth-key-for-csrf"),
	}, nil
}

// GetDSN veritabanı bağlantı dizesini döndürür
func (c *Config) GetDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}

// getEnv ortam değişkenini alır, yoksa varsayılan değeri döndürür
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvInt(key string, defaultValue int) int {
	value := getEnv(key, "")
	if value == "" {
		return defaultValue
	}
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return intValue
}
