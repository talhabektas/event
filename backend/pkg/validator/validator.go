package validator

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

// CustomValidator özel doğrulama fonksiyonlarını içerir
type CustomValidator struct {
	validator *validator.Validate
}

// NewValidator yeni bir validator örneği oluşturur
func NewValidator() *CustomValidator {
	v := validator.New()

	// Yapısal etiketleri seçme özelliği ekle
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})

	return &CustomValidator{validator: v}
}

// Validate verilen yapıyı doğrular
func (v *CustomValidator) Validate(i interface{}) error {
	return v.validator.Struct(i)
}

// ValidateVar tek bir değişkeni doğrular
func (v *CustomValidator) ValidateVar(field interface{}, tag string) error {
	return v.validator.Var(field, tag)
}

// FormatValidationErrors doğrulama hatalarını okunabilir formata dönüştürür
func (v *CustomValidator) FormatValidationErrors(err error) []string {
	if err == nil {
		return nil
	}

	var errors []string
	for _, err := range err.(validator.ValidationErrors) {
		errors = append(errors, fmt.Sprintf(
			"%s alanı geçersiz: %s doğrulama kuralını karşılamıyor",
			err.Field(),
			err.Tag(),
		))
	}

	return errors
}
