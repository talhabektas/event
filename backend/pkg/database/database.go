package database

import (
	"fmt"
	"log"

	"event/backend/internal/config"
	"event/backend/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

// Init veritabanı bağlantısını başlatır
func Init(cfg *config.Config) error {
	var err error

	// GORM yapılandırması
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// Veritabanına bağlan
	db, err = gorm.Open(mysql.Open(cfg.GetDSN()), gormConfig)
	if err != nil {
		return fmt.Errorf("veritabanına bağlanılamadı: %v", err)
	}

	// Bağlantıyı test et
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("veritabanı bağlantısı alınamadı: %v", err)
	}

	// Bağlantı havuzu ayarları
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	// Tabloları otomatik oluştur
	if err := db.AutoMigrate(
		&models.User{},
		&models.Interest{},
		&models.UserInterest{},
		&models.Room{},
		&models.RoomMember{},
		&models.Event{},
		&models.EventTimeOption{},
		&models.EventVote{},
		&models.EventProposal{},
		&models.CounterProposal{},
		&models.Friendship{},
		&models.EventAttendance{},
		&models.EventParticipationRequest{},
		&models.Message{},
		&models.EventInvitation{},
		&models.RoomInvitation{},
		&models.Notification{},
		&models.UserSuggestion{},
	); err != nil {
		return fmt.Errorf("tablolar oluşturulamadı: %v", err)
	}

	// İlgi alanlarını tohumla (seed)
	if err := seedInterests(db); err != nil {
		return fmt.Errorf("ilgi alanları tohumlanamadı: %v", err)
	}

	log.Println("Veritabanı bağlantısı başarılı")
	return nil
}

func seedInterests(db *gorm.DB) error {
	interests := []models.Interest{
		{Name: "Yazılım Geliştirme", Category: "Teknoloji"},
		{Name: "Teknoloji", Category: "Genel"},
		{Name: "Yapay Zeka", Category: "Teknoloji"},
		{Name: "Spor", Category: "Aktivite"},
		{Name: "Müzik", Category: "Sanat"},
		{Name: "Sanat", Category: "Sanat"},
		{Name: "Sinema", Category: "Sanat"},
		{Name: "Edebiyat", Category: "Sanat"},
		{Name: "Gezi", Category: "Aktivite"},
		{Name: "Yemek", Category: "Gurme"},
		{Name: "Oyun", Category: "Hobi"},
		{Name: "Doğa Yürüyüşü", Category: "Aktivite"},
	}

	for _, interest := range interests {
		// Eğer bu isimde bir ilgi alanı yoksa oluştur (varsa dokunma)
		if err := db.Where(models.Interest{Name: interest.Name}).FirstOrCreate(&interest).Error; err != nil {
			log.Printf("İlgi alanı tohumlanırken hata oluştu (%s): %v\n", interest.Name, err)
			return err
		}
	}

	log.Println("İlgi alanları başarıyla tohumlandı.")
	return nil
}

// GetDB veritabanı bağlantısını döndürür
func GetDB() *gorm.DB {
	return db
}

// Close veritabanı bağlantısını kapatır
func Close() error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("veritabanı bağlantısı alınamadı: %v", err)
	}
	return sqlDB.Close()
}
