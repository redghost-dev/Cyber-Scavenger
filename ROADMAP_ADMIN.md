# Özel Admin Paneli (EJS) Geçiş Yol Haritası

Bu yol haritası, mevcut AdminJS sisteminin güvenli bir şekilde kaldırılması ve yerine projenin ihtiyaçlarına tam uyumlu, hızlı ve %100 Türkçe destekli özel bir yönetim panelinin kurulmasını kapsar.

## 1. Aşama: Mevcut Sistemin Temizlenmesi (Cleanup)
- [x] **AdminJS Devre Dışı Bırakma:** `server.js` içindeki `setupAdmin(app)` çağrısının kaldırılması.
- [x] **Dosya Temizliği:** `config/admin.js` dosyasının silinmesi.
- [x] **Bağımlılıkların Kaldırılması:** `package.json` içinden `adminjs`, `@adminjs/express`, `@adminjs/mongoose` paketlerinin kaldırılması.
- [x] **Node Modules Temizliği:** Gereksiz paketlerin diskten silinmesi (`npm prune`).

## 2. Aşama: Yeni Altyapının Kurulması (Infrastructure)
- [x] **Admin Rotaları:** `/routes/admin.js` dosyasının oluşturulması ve `server.js`'e bağlanması.
- [x] **Admin Controller:** `/controllers/adminController.js` oluşturularak mantıksal işlemlerin (listeleme, güncelleme vb.) buraya taşınması.
- [x] **Klasör Yapısı:** `views/admin/` klasörünün oluşturulması ve alt sayfaların (layout, dashboard, users, settings) planlanması.
- [x] **Güvenlik Kontrolü:** Mevcut `middleware/auth.js` içindeki `ensureAdmin` kontrolünün tüm admin rotalarına uygulanması.

## 3. Aşama: Arayüz ve Tasarım (UI/UX)
- [x] **Admin Layout:** Tüm admin sayfalarında ortak kullanılacak olan Sidebar (Yan Menü) ve Header (Başlık) yapısının EJS partials olarak hazırlanması.
- [x] **Mobil Öncelikli Tasarım:** Panelin telefon ve tabletlerde kusursuz çalışması için responsive (duyarlı) yapı kurulması.
- [x] **Tema Seçimi:** Oyunun karanlık/siber temasına uygun, modern ve responsive bir CSS yapısının kurulması.
- [x] **Dashboard:** Genel istatistiklerin (toplam kullanıcı, online sayısı, son hile kayıtları) göründüğü ana sayfa.
- [x] **Arama ve Filtreleme:** Kullanıcılar ve kayıtlar arasında hızlı arama yapabilme yeteneği.
- [x] **Sayfalama (Pagination):** Binlerce kullanıcı veya log olduğunda panelin kasmasını önlemek için sayfalama sistemi.

## 4. Aşama: Fonksiyonel Özelliklerin Geliştirilmesi
- [x] **Kullanıcı Yönetimi:** Kullanıcı listeleme, rol değiştirme (admin/user), banlama veya şifre sıfırlama işlemleri.
- [x] **Oyun Ayarları (GameConfig):** XP oranları, coin düşme hızları, bakım modu gibi ayarların form üzerinden güncellenmesi.
- [x] **Market (Item) Yönetimi:** Yeni eşya ekleme, fiyat güncelleme, resim yükleme ve aktif/pasif yapma.
- [x] **Hile ve Geri Bildirim:** `CheatLog` ve `Feedback` kayıtlarının incelenmesi ve yönetilmesi.
- [x] **Dil Çevirileri:** `Translation` modelinin yönetimi için özel bir arayüz.
- [x] **Admin İşlem Günlükleri (Audit Logs):** Hangi adminin hangi ayarı değiştirdiğini takip eden basit bir log sistemi.
- [x] **Toplu İşlemler:** Birden fazla kullanıcıyı seçip toplu işlem yapabilme (örn: toplu ban kaldırma).

## 5. Aşama: Reklam ve Gelir Yönetimi (Ads & Monetization)
- [x] **Reklam Birimleri Yönetimi:** Google AdMob (Android/iOS) App ID ve Unit ID'lerinin (Banner, Interstitial, Rewarded) panelden yönetilmesi.
- [x] **Reklam Stratejisi Ayarları:** Reklamların sıklığı (interstitial interval) ve bekleme sürelerinin (cooldown) yapılandırılması.
- [x] **Teşvikli Reklamlar (Rewarded Ads):** 
    - Oyuncunun öldüğünde reklam izleyerek 1 kerelik canlanma (Revive) ayarı.
    - Reklam izleyerek Coin/Gem kazanma miktarlarının belirlenmesi.
    - Günlük reklam izleme limitlerinin ayarlanması.
- [ ] **Oyun İçi Entegrasyon:** Reklam ayarlarının oyun motoruna (frontend) bağlanması ve ödül mekanizmalarının çalıştırılması.

## 6. Aşama: Test ve Yayına Alım
- [x] **Yetki Testleri:** Admin olmayan kullanıcıların `/admin` paneline erişemediğinin doğrulanması.
- [x] **Form Doğrulamaları:** Hatalı veri girişlerine karşı (örn: negatif XP oranı) kontrollerin eklenmesi.
- [x] **Mobil Uyumluluk:** Panelin mobilde de sorunsuz çalıştığının kontrolü.

## 6. Aşama: Güvenlik ve Sıkılaştırma (Security & Hardening)
- [x] **CSRF Koruması:** Admin formlarına CSRF token ekleyerek dışarıdan sahte istek atılmasını engellemek.
- [x] **Gelişmiş Rate Limiting:** Admin paneli rotalarına özel, daha sıkı istek sınırlaması (Brute-force koruması).
- [x] **Input Sanitization:** Tüm form girişlerini XSS ve NoSQL Injection saldırılarına karşı temizlemek.
- [x] **Güvenli Session Yönetimi:** Admin oturumları için daha kısa süreli ve `httpOnly` çerezler.
- [ ] **IP Kısıtlaması (Opsiyonel):** Sadece belirli IP adreslerinden admin paneline erişim izni verilmesi.
- [ ] **2FA (İleride):** Admin hesapları için Google Authenticator veya SMS ile iki aşamalı doğrulama altyapısı.

---
**Hedef:** AdminJS'in getirdiği hantallıktan kurtulup, projenin ruhuna uygun, hızlı ve kolay yönetilebilir bir panel oluşturmak.
