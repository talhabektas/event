package repository

import (
	"event/backend/pkg/database"

	"gorm.io/gorm"
)

type ProposalRepository interface {
	// Gerekli metodları buraya ekleyeceğiz
}

type proposalRepository struct {
	db *gorm.DB
}

func NewProposalRepository() ProposalRepository {
	return &proposalRepository{
		db: database.GetDB(),
	}
}
