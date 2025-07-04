package repository

import (
	"event/backend/internal/models"
	"event/backend/pkg/database"
	"time"

	"gorm.io/gorm"
)

// EventRepository etkinlik veritabanı işlemleri için arayüz
type EventRepository interface {
	FindAll() ([]models.Event, error)
	FindByID(id uint) (models.Event, error)
	Create(event *models.Event) error
	Update(event *models.Event) error
	Delete(id uint) error
	GetUpcomingEvents(after time.Time) ([]models.Event, error)
}

// eventRepository EventRepository arayüzünü uygular
type eventRepository struct {
	db *gorm.DB
}

// NewEventRepository yeni bir event repository oluşturur
func NewEventRepository() EventRepository {
	return &eventRepository{
		db: database.GetDB(),
	}
}

// FindAll tüm etkinlikleri getirir
func (r *eventRepository) FindAll() ([]models.Event, error) {
	var events []models.Event
	result := r.db.Find(&events)
	return events, result.Error
}

// FindByID ID'ye göre etkinlik getirir
func (r *eventRepository) FindByID(id uint) (models.Event, error) {
	var event models.Event
	result := r.db.First(&event, id)
	return event, result.Error
}

// Create yeni bir etkinlik oluşturur
func (r *eventRepository) Create(event *models.Event) error {
	return r.db.Create(event).Error
}

// Update bir etkinliği günceller
func (r *eventRepository) Update(event *models.Event) error {
	return r.db.Save(event).Error
}

// Delete bir etkinliği siler
func (r *eventRepository) Delete(id uint) error {
	return r.db.Delete(&models.Event{}, id).Error
}

// GetUpcomingEvents verilen zamandan sonraki etkinlikleri getirir
func (r *eventRepository) GetUpcomingEvents(after time.Time) ([]models.Event, error) {
	var events []models.Event

	// Önce final zamanı belirlenmiş etkinlikleri getir
	result := r.db.Where("final_start_time >= ?", after).
		Preload("Creator").
		Preload("Room").
		Preload("TimeOptions").
		Find(&events)

	if result.Error != nil {
		return nil, result.Error
	}

	// Zaman seçenekleri olan ama final zamanı belirlenmemiş etkinlikleri de getir
	var eventsWithOptions []models.Event
	result = r.db.Joins("JOIN event_time_options ON events.id = event_time_options.event_id").
		Where("events.final_start_time IS NULL AND event_time_options.start_time >= ?", after).
		Where("events.id NOT IN (?)", r.db.Table("events").
			Where("final_start_time IS NOT NULL").
			Select("id")).
		Preload("Creator").
		Preload("Room").
		Preload("TimeOptions").
		Distinct().
		Find(&eventsWithOptions)

	if result.Error != nil {
		return nil, result.Error
	}

	// İki listeyi birleştir
	events = append(events, eventsWithOptions...)

	return events, nil
}
