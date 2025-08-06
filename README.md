# 🎉 Event Management System

Modern, tam-zamanlı etkinlik yönetim platformu. Gerçek zamanlı sohbet, arkadaşlık sistemi ve akıllı öneriler ile donatılmış.

## ✨ Özellikler

### 🎪 Etkinlik Yönetimi
- ✅ Etkinlik oluşturma ve düzenleme
- ✅ Zaman seçenekleri ve oylama
- ✅ Katılımcı yönetimi
- ✅ Özel/Public etkinlikler

### 👥 Sosyal Özellikler
- ✅ Arkadaşlık sistemi (istek/kabul/öneri)
- ✅ Kullanıcı profilleri
- ✅ İlgi alanlarına göre öneriler
- ✅ Gerçek zamanlı bildirimler

### 💬 Sohbet Sistemi
- ✅ Gerçek zamanlı mesajlaşma (WebSocket)
- ✅ Özel mesajlar (DM)
- ✅ Grup sohbetleri
- ✅ Okunmamış mesaj sayısı
- ✅ Oda daveti sistemi

### 🏠 Oda Sistemi
- ✅ Public/Private odalar
- ✅ Oda davetleri
- ✅ Üye yönetimi
- ✅ Oda bazlı etkinlikler

## 🛠️ Teknoloji Stack

### Backend
- **Go** (Gin Framework)
- **GORM** (ORM)
- **MySQL** (Database)
- **JWT** (Authentication)
- **WebSocket** (Real-time)

### Frontend
- **React** + **TypeScript**
- **Tailwind CSS**
- **Vite** (Build tool)
- **Context API** (State management)

## 🚀 Kurulum

### Gereksinimler
- Go 1.19+
- Node.js 18+
- MySQL 8.0+

### Backend Kurulum
```bash
cd backend
go mod download
# .env dosyasını yapılandır
go run cmd/api/main.go
```

### Frontend Kurulum
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```env
# Backend (.env)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=event_db
JWT_SECRET=your_jwt_secret
PORT=8082
```

## 📱 Kullanım

1. **Kayıt ol/Giriş yap**
2. **Profil bilgilerini tamamla**
3. **İlgi alanlarını seç**
4. **Etkinlik oluştur veya katıl**
5. **Arkadaş ekle ve sohbet et**
6. **Yapay zeka önerilerini gerçekleştirerek premium üye avantajlarından faydalanabilirsin**
## 🎯 Gelecek Planları

- [ ] Event fotoğraf yükleme
- [ ] Dark mode
- [ ] Mobile PWA
- [ ] Achievement sistemi
- [ ] Voice messages
- [ ] File sharing
- [ ] Event kategorileri
- [ ] Harita entegrasyonu

## 🤝 Katkıda Bulunma

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

⭐ **Star** vererek projeyi destekleyebilirsiniz! 
