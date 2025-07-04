package middlewares

import (
	"event/backend/internal/config"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/csrf"
)

// CSRFProtectionMiddleware, ortam yapılandırmasına göre CSRF koruması uygular.
func CSRFProtectionMiddleware(cfg *config.Config) gin.HandlerFunc {
	// Geliştirme ortamında CSRF korumasını atla
	if cfg.Env == "development" {
		log.Println("Geliştirme ortamı algılandı, CSRF koruması atlanıyor.")
		return func(c *gin.Context) {
			c.Next()
		}
	}

	log.Println("Üretim ortamı algılandı, CSRF koruması etkinleştiriliyor.")
	// Üretim ortamında CSRF korumasını etkinleştir
	csrfMiddleware := csrf.Protect(
		[]byte(cfg.CSRFAuthKey),
		csrf.Secure(true), // HTTPS üzerinden gönderilen cookieler
		csrf.HttpOnly(true),
		csrf.Path("/"),
		csrf.ErrorHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("CSRF hatası: %s %s - Token: %s", r.Method, r.URL.Path, csrf.FailureReason(r).Error())
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"error": "CSRF token is missing or invalid"}`))
		})),
	)

	return func(c *gin.Context) {
		// gorilla/csrf middleware'i standart http.Handler ile çalışır.
		// Gin ile uyumlu hale getirmek için bir adaptör kullanıyoruz.
		dummyNext := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// CSRF kontrolü başarılı olduktan sonra, Gin'in sonraki middleware'ine geç.
			c.Next()
		})
		csrfMiddleware(dummyNext).ServeHTTP(c.Writer, c.Request)
	}
}
