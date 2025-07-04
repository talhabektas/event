package services

import (
	"event/backend/internal/repository"
)

type DashboardService interface {
	// Gerekli metodları buraya ekleyeceğiz
}

type dashboardService struct {
	userRepo  repository.UserRepository
	eventRepo repository.EventRepository
}

func NewDashboardService(userRepo repository.UserRepository, eventRepo repository.EventRepository) DashboardService {
	return &dashboardService{
		userRepo:  userRepo,
		eventRepo: eventRepo,
	}
}
