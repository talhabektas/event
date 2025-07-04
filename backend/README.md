# Event Backend API

Go dilinde Gin framework ve GORM kütüphanesi kullanılarak geliştirilmiş bir web API projesi.

## Proje Yapısı

```
backend/
├── cmd/                    # Komut satırı uygulamaları
│   └── api/                # Ana API uygulaması
│       └── main.go         # Uygulamanın giriş noktası
├── internal/               # Dışa açık olmayan paketler
│   ├── api/                # API katmanı
│   │   ├── handlers/       # API endpoint işleyicileri
│   │   ├── middlewares/    # Ara yazılımlar (authentication, logging, vb.)
│   │   └── routes/         # Route tanımlamaları
│   ├── config/             # Uygulama yapılandırması
│   ├── models/             # Veritabanı modelleri
│   ├── repository/         # Veritabanı işlemleri
│   ├── services/           # İş mantığı
│   └── utils/              # Yardımcı fonksiyonlar ve araçlar
├── pkg/                    # Dışa açık paketler
│   ├── database/           # Veritabanı bağlantı yönetimi
│   └── validator/          # Veri doğrulama
├── migrations/             # Veritabanı şema değişiklikleri
├── .env.example            # Örnek çevre değişkenleri
├── .gitignore
├── go.mod                  # Go modül tanımı
├── go.sum
└── README.md               # Proje dokümantasyonu
```

## Kurulum

1. Gerekli bağımlılıkları yükleyin:
```bash
go mod download
```

2. `.env` dosyasını oluşturun:
Aşağıdaki içeriği `.env` dosyasına kopyalayın ve kendi bilgilerinizle güncelleyin:

```
# Server
PORT=8080
APP_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=event_db

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRY_HOURS=24
JWT_REFRESH_SECRET=your_refresh_secret_key_change_in_production
JWT_REFRESH_EXPIRY_HOURS=168
```

## Çalıştırma

```bash
cd cmd/api
go run main.go
```

## API Endpoints

- API rotaları `/api` prefix'i ile başlar
- GET `/api/ping` - Basit bir "Merhaba Dünya" yanıtı döndürür
- GET `/api/events` - Tüm etkinlikleri listeler
- GET `/api/events/:id` - Belirli bir etkinliğin detaylarını getirir
- POST `/api/events` - Yeni bir etkinlik oluşturur
- PUT `/api/events/:id` - Bir etkinliği günceller
- DELETE `/api/events/:id` - Bir etkinliği siler

## Kimlik Doğrulama

Uygulama JWT tabanlı bir kimlik doğrulama sistemi kullanır:

- POST `/api/auth/register` - Yeni bir kullanıcı kaydı
- POST `/api/auth/login` - Kullanıcı girişi, JWT token ve yenileme token'ı alır
- POST `/api/auth/refresh` - Yenileme token'ı kullanarak yeni bir JWT token alır

Token alındıktan sonra istek başlıklarınıza `Authorization: Bearer TOKEN` şeklinde ekleyerek yetkili endpointlere erişebilirsiniz.

## Mimari

Bu proje Clean Architecture prensiplerine göre katmanlara ayrılmıştır:

1. **Handlers**: HTTP isteklerini işler ve yanıtları formatlar
2. **Services**: İş mantığını içerir, repository'leri kullanarak işlemleri gerçekleştirir
3. **Repository**: Veritabanı işlemlerini soyutlar
4. **Models**: Veritabanı şemasını eşleyen yapılar
5. **Utils**: Şifre hashleme, JWT doğrulama gibi yardımcı fonksiyonlar
6. **Config**: Ortam değişkenleri ve yapılandırma yönetimi

## Veritabanı

Proje MySQL veritabanı kullanmaktadır. Veritabanı şeması `migrations` klasöründe bulunmaktadır. 