package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response API yanıtı için standart yapı
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// APIErrorResponse hata yanıtı struct'ı
type APIErrorResponse struct {
	Error string `json:"error"`
}

// SuccessResponse başarılı bir yanıt oluşturur
func SuccessResponse(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// ErrorResponse hata yanıtı oluşturur
func ErrorResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, Response{
		Success: false,
		Error:   message,
	})
}

// ValidationErrorResponse doğrulama hatası yanıtı oluşturur
func ValidationErrorResponse(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusBadRequest, message)
}

// ServerErrorResponse sunucu hatası yanıtı oluşturur
func ServerErrorResponse(c *gin.Context, message string) {
	if message == "" {
		message = "Sunucu hatası oluştu"
	}
	ErrorResponse(c, http.StatusInternalServerError, message)
}

// NotFoundResponse kayıt bulunamadı yanıtı oluşturur
func NotFoundResponse(c *gin.Context, message string) {
	if message == "" {
		message = "Kayıt bulunamadı"
	}
	ErrorResponse(c, http.StatusNotFound, message)
}
