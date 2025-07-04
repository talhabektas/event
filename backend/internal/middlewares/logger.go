package middlewares

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger istekleri loglamak için kullanılan middleware
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// İstek zamanını kaydet
		t := time.Now()

		// Request path'i al
		path := c.Request.URL.Path

		// İstek metodu
		method := c.Request.Method

		// Bir sonraki handler'a geç
		c.Next()

		// Latency hesapla
		latency := time.Since(t)

		// Durum kodunu al
		status := c.Writer.Status()

		// Log bilgisini yazdır
		log.Printf("[GIN] %s | %3d | %12v | %s | %s",
			method,
			status,
			latency,
			path,
			c.ClientIP(),
		)
	}
}
