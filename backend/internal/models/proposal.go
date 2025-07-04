package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// ProposalStatus öneri durumları için enum
type ProposalStatus string

const (
	ProposalPending         ProposalStatus = "pending"
	ProposalAccepted        ProposalStatus = "accepted"
	ProposalDeclined        ProposalStatus = "declined"
	ProposalCounterProposed ProposalStatus = "counter_proposed"
	ProposalCancelled       ProposalStatus = "cancelled"
)

// JSONB veritabanında JSON alan kullanımı için
type JSONB map[string]interface{}

// Value JSON formatında depolanabilmesi için driver.Value arayüzünü uygular
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan JSON verisini okumak için sql.Scanner arayüzünü uygular
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("type assertion failed")
	}
	return json.Unmarshal(bytes, j)
}

// EventProposal etkinlik önerilerini temsil eder
type EventProposal struct {
	ID                       uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	EventID                  *uint64        `json:"event_id,omitempty"`
	ProposedEventDetailsJSON JSONB          `gorm:"type:json" json:"proposed_event_details_json,omitempty"`
	SuggesterUserID          uint64         `gorm:"not null" json:"suggester_user_id"`
	RecipientUserID          uint64         `gorm:"not null" json:"recipient_user_id"`
	Status                   ProposalStatus `gorm:"not null;default:'pending';size:20" json:"status"`
	ProposedAt               time.Time      `json:"proposed_at"`
	RespondedAt              *time.Time     `json:"responded_at,omitempty"`
	CreatedAt                time.Time      `json:"created_at"`
	UpdatedAt                time.Time      `json:"updated_at"`
	DeletedAt                gorm.DeletedAt `gorm:"index" json:"-"`

	// İlişkiler
	Event            *Event            `gorm:"foreignKey:EventID" json:"event,omitempty"`
	Suggester        User              `gorm:"foreignKey:SuggesterUserID" json:"suggester,omitempty"`
	Recipient        User              `gorm:"foreignKey:RecipientUserID" json:"recipient,omitempty"`
	CounterProposals []CounterProposal `gorm:"foreignKey:OriginalProposalID" json:"counter_proposals,omitempty"`
}

// CounterProposal karşı önerileri temsil eder
type CounterProposal struct {
	ID                  uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	OriginalProposalID  uint64         `gorm:"not null" json:"original_proposal_id"`
	NewEventDetailsJSON JSONB          `gorm:"type:json" json:"new_event_details_json"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`

	// İlişkiler
	OriginalProposal EventProposal `gorm:"foreignKey:OriginalProposalID" json:"original_proposal,omitempty"`
}
