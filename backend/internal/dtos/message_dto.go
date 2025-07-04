package dtos

import "time"

// SenderDTO, bir mesajı gönderen kullanıcıyı temsil eder.
type SenderDTO struct {
	ID        uint64 `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	AvatarURL string `json:"avatar_url"`
}

// MessageDTO, sohbet odasındaki tek bir mesajı temsil eder.
// Frontend'e gönderilecek veri yapısı budur.
type MessageDTO struct {
	ID        uint64    `json:"id"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	Sender    SenderDTO `json:"sender"`
}
