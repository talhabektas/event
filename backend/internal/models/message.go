package models

import (
	"time"

	"gorm.io/gorm"
)

// Message odalardaki mesajları temsil eder.
// Frontend'deki ChatMessage arayüzü ile uyumlu olmalıdır.
type Message struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement" json:"id,omitempty"`   // id frontend'de opsiyonel
	RoomID    uint64         `gorm:"not null;index" json:"room_id"`                  // Tip uint64 olarak düzeltildi
	UserID    uint64         `gorm:"not null;column:sender_id;index" json:"user_id"` // Alan adı UserID, DB sütunu sender_id
	Username  string         `gorm:"-" json:"username,omitempty"`                    // Hub tarafından doldurulacak, DB'de saklanmayacak
	Content   string         `gorm:"type:text;not null" json:"content"`
	Timestamp time.Time      `gorm:"column:created_at" json:"timestamp"` // Alan adı Timestamp, DB sütunu created_at
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// İlişkiler
	// RoomID string olduğu için Room ilişkisi direkt çalışmayabilir, eğer sayısal ID üzerinden bir ilişki bekleniyorsa
	// bu kısım gözden geçirilmeli veya Room struct'ının ID'si de string olmalı ya da bu ilişki kaldırılmalı/farklı yönetilmeli.
	// Şimdilik Room ilişkisini yorum satırına alıyorum, DM mesajları için Room tablosunda karşılık olmayabilir.
	// Room   Room `gorm:"foreignKey:RoomID" json:"-"`
	Sender User `gorm:"foreignKey:UserID;references:ID" json:"-"` // Sender bilgisi Username alanı için kullanılacak
}

// BeforeCreate GORM hook'u - oluşturulmadan önce
// Timestamp alanı zaten oluşturma sırasında set edilecek, GORM default'u kullanılabilir veya burada bırakılabilir.
// Eğer gorm.Model kullanılmıyorsa, bu hook kalabilir.
func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.Timestamp.IsZero() { // Sadece Timestamp set edilmemişse set et
		m.Timestamp = time.Now()
	}
	return nil
}
