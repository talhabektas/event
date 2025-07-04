package models

import (
	"gorm.io/gorm"
)

// GORM tarafından kaydedilecek model tabloları
var Models = []interface{}{
	&User{},
	&Interest{},
	&UserInterest{},
	&Room{},
	&RoomMember{},
	&Friendship{},
	&Event{},
	&EventTimeOption{},
	&EventVote{},
	&EventAttendance{},
	&EventProposal{},
	&CounterProposal{},
}

// SetupModels veritabanında tabloları oluşturur
func SetupModels(db *gorm.DB) error {
	// AutoMigrate tüm modelleri otomatik olarak göç eder
	return db.AutoMigrate(Models...)
}
