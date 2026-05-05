# 🚀 Cyber Scavenger: Ultimate Mobile Platform Roadmap

Bu belge, Cyber Scavenger'ı basit bir tarayıcı oyunundan; gelir modeli olan, yönetilebilir, güvenli ve global ölçekte rekabetçi bir mobil oyun platformuna dönüştürme planıdır.

---

## 🎯 AKTIF: HUD Element Yerleşim Düzenlemesi (2026-01-07)

### Tespit Edilen Sorunlar:
1. **İç İçe Geçmiş Elementler:**
   - SKOR (#game-ui)
   - BOSS CAN BARI (#boss-hp-bar)
   - HIGH SCORE (#high-score-ui)
   - KULLANICI CANI (#player-hp-container)
   - FPS ve DEBUG bilgileri (#debug-info)
   - Tüm bu elementler üst üste biniyor

2. **Buton Aralığı Sorunu:**
   - Tam ekran ve pause butonları arasında fazla boşluk var

### Yapılacaklar (Sadece Konum Değişiklikleri):
- [ ] 1. DEBUG bilgisini tamamen kaldır (#debug-info → display: none veya sil)
- [ ] 2. SKOR (#game-ui) → Sol üst köşe (şu anki pozisyon korunacak, diğerleri ona göre ayarlanacak)
- [ ] 3. HIGH SCORE (#high-score-ui) → Sağ üst köşe (top değerini artır, skor ile çakışmayacak şekilde)
- [ ] 4. KULLANICI CANI (#player-hp-container) → Orta üst (top değerini artır, boss bar ile çakışmayacak)
- [ ] 5. BOSS CAN BARI (#boss-hp-bar) → Kullanıcı canından aşağı (top değerini ayarla)
- [ ] 6. Tam ekran ve pause butonlarını birbirine yaklaştır (gap veya right değerlerini ayarla)

### DOKUNULMAYACAKLAR:
- ❌ Joystick ve mobil kontroller (alt bölge)
- ❌ ULTRA BAR (#overdrive-bar, #overdrive-fill, #overdrive-ready)
- ❌ XP BAR (#xp-container)
- ❌ Diğer oyun mekanikleri

---

## ✅ Faz 0: Mimari, Güvenlik ve Yedekleme (Tamamlan9
1.  **Tam Yedekleme Sistemi (Safety First)**
    *   [x] **Otomatik Yedek:** Her deploy öncesi veritabanı ve dosyaların yedeğini alan `backup.sh` scripti.
    *   [x] **Rollback:** Bir hata durumunda tek komutla eski sürüme dönme mekanizması.

2.  **Modüler Mimari (MVC Refactoring)**
    *   [x] **Sorun:** Şu an tüm kodlar iç içe. Bir değişiklik diğerini bozabilir.
    *   [x] **Çözüm:** Kodları `Models` (Veri), `Views` (Görünüm), `Controllers` (Mantık) ve `Services` (İşlemler) olarak ayıracağız.
    *   [x] **İzolasyon:** Reklam modülü çökerse oyun devam edecek. Market çökerse giriş sistemi etkilenmeyecek.
"" 
3.  **Güvenlik Denetimi (Security Audit)**
    *   [x] **Anti-Cheat:** Skor gönderimlerinde sunucu taraflı doğrulama (İmkansız skorları reddetme).
    *   [x] **Rate Limiting:** API saldırılarını engellemek için istek sınırlama.
    *   [x] **Input Validation:** Kullanıcıdan gelen her veriyi (isim, mesaj) temizleme (XSS ve Injection koruması).

---

## ✅ Faz 1: Altyapı ve Kimlik (Tamamlandı)
*Hedef: Kullanıcının kimliğini oluşturması ve veritabanı yapısı.*

1.  **Hibrit Auth Sistemi**
    *   [x] **Yerel Kayıt:** E-posta/Şifre (bcrypt şifreleme).
    *   [x] **Google OAuth:** Güvenli Google girişi.
    *   [x] **Profil:** Nickname, Avatar, Ülke Bayrağı.

2.  **Kullanıcı Etkileşimi**
    *   [x] **Geri Bildirim Sistemi:** Oyun içinden yönetime mesaj/hata bildirme formu (Feedback Modeli).
    *   [x] **Online Sayacı:** Main menüde "X Kişi Çevrimiçi" göstergesi (Middleware + API).

---

## 👑 Faz 2: Yönetim Portalı (God Mode Admin)
*Hedef: Oyunun her parametresini kod yazmadan kontrol etmek.*

1.  **Admin Paneli (AdminJS Entegrasyonu)**
    *   [x] **Dashboard:** Günlük aktif kullanıcı, toplam gelir, sunucu durumu grafikleri (AdminJS Default).
    *   [x] **Oyun Yönetimi:** Günlük görevleri, düşman canlarını, XP oranlarını panelden değiştirme (GameConfig Modeli).
    *   [x] **Kullanıcı Yönetimi:** Oyuncu banlama, envanter düzenleme, şifre sıfırlama.
    *   [x] **Market Yönetimi:** Yeni eşya ekleme, fiyat değiştirme (Item Modeli).

2.  **Analitik ve Raporlama**
    *   [ ] **Gelir Takibi:** Reklam ve satın alma gelirleri.
    *   [x] **İhlal Logları:** Hile şüphesi olan hesapların otomatik raporlanması (CheatLog Modeli).

---

## 💰 Faz 3: Gelir Modeli ve Reklamlar (Monetization)
*Hedef: Kullanıcıyı boğmadan gelir elde etmek.*

1.  **Akıllı Reklam Modülü (Ad Wrapper)**
    *   [x] **API Desteği:** Google AdSense/AdMob veya Unity Ads kodlarını dinamik olarak ekleyebileceğimiz yapı (GameConfig.ads).
    *   [x] **Ödüllü Reklamlar (Rewarded):** "Canlanmak için izle", "2x Coin için izle" (Client-side implementation).
    *   [ ] **Kademeli Gösterim:** Yeni oyuncuya ilk 10 oyun reklam yok, sonra azalarak artan reklam sıklığı.

2.  **"No Ads" ve Satın Alma**
    *   [ ] **Ödeme Altyapısı:** Stripe veya benzeri bir sistemle güvenli ödeme.
    *   [ ] **No Ads Paketi:** Küçük bir ücretle reklamları kalıcı kapatma.

---

## ⚖️ Faz 4: Ekonomi ve İlerleme (Progression)
*Hedef: Uzun vadeli oyun döngüsü.*

1.  **Dengeleme**
    *   [ ] **Logaritmik Level:** Zorlaşan seviye sistemi.
    *   [ ] **Hard Caps:** Özelliklerin (Magnet vb.) oyunu bozmayacak üst limitleri.

2.  **Market (Shop)**
    *   [x] **Kozmetik:** Skinler, İzler (Trails) (Shop API ve Oyun Entegrasyonu Tamamlandı).
    *   [x] **Para Birimi:** Oyun içi kazanılan "CyberBits" (User.wallet ve Shop API).

---

## 🏆 Faz 5: Rekabet ve Ligler (Competition)
*Hedef: Global rekabet.*

1.  **Lig Sistemi**
    *   [x] Bronze -> Cyber Legend ligleri (Score Submission Logic).
    *   [x] Haftalık yükselme/düşme (Cron Job: Her Pazar 00:00).

2.  **Sıralamalar**
    *   [x] Global Sıralama (Leaderboard API).
    *   [x] Lig Sıralaması (Leaderboard API).
    *   [ ] Arkadaş sıralaması.

---

## 📱 Faz 6: UI/UX ve Mobil Deneyim
*Hedef: Profesyonel mobil uygulama hissi.*

1.  **Modern Arayüz**
    *   [x] **Mağaza Arayüzü:** Eşya satın alma ve kuşanma ekranı (`views/shop.ejs`).
    *   [x] **Oyun İçi Entegrasyon:** Satın alınan eşyaların (Skin/Trail) oyun içinde görünmesi.
    *   [x] **Mobil Kontroller:** Joystick ve dokunmatik iyileştirmeler.
    *   [x] **Özelleştirilebilir Kontroller:** Kullanıcının joystick ve buton yerlerini değiştirebilmesi (HUD Editor).
    *   [x] **Profil İstatistikleri:** Cüzdan (Coin/Gem) ve detaylı istatistikler (`views/profile.ejs`).
    *   [x] **Menü Entegrasyonu:** Ana menüye Mağaza ve Sıralama butonları eklendi.
    *   [x] **Dock Menü:** Alt sekme yapısı (Shop, Hangar, Rank, Config, Profile) eklendi.
    *   [ ] Gelişmiş Ayarlar (Ses sliderları, Grafik kalitesi).
    *   [ ] Oyun Rehberi (Tutorial).

2.  **Oynanış Derinliği**
    *   [ ] Bölüm (Stage) Sistemi: Dalga -> Boss -> Yeni Bölüm.
    *   [ ] Günlük Görevler.

---

## 🎨 Faz 7: CSS Konsolidasyonu (YENİDEN DÜZENLENMİŞ - MİKRO-ADIM PROTOKOLÜ)
*Bu faz, oyunun görsel bütünlüğünü bozmamak için adım adım ilerlenecek ve her adımda kullanıcı onayı alınacaktır.*

### **Strateji: Hücre Bazlı Taşıma**
Her adımda sadece belirli bir UI bileşeninin stili taşınacak, `index.ejs` güncellenecek ve test edilecektir.

#### **7.1: Giriş ve Karşılama Ekranı (Auth & Landing) - [TAMAMLANDI]**
- [x] `.landing-screen`, `.auth-actions`, `.auth-card` (ve `cyber-btn`, `logo-title`) stillerinin `index.ejs`'den `auth.css`'e taşınması.
- [x] Giriş ekranındaki inline flexbox stilleri `.auth-container` sınıfına dönüştürüldü.
- [x] Versiyon etiketi `.version-tag` sınıfına dönüştürüldü.
- **[ONAY BEKLİYOR]** *Lütfen giriş ekranını kontrol et. Mobilde ve masaüstünde butonların yerleşimi ve başlık düzgün mü?*

#### **7.2: Ana Menü ve Karakter Paneli (Main Menu) - [TAMAMLANDI]**
- [x] `.user-stats-panel`, `.main-menu-avatar`, `.guest-avatar-icon` stillerinin `main-menu.css`'e taşınması.
- [x] "Watch Ad" ve "Logout" butonlarındaki inline stillerin `.reward-btn` ve `.menu-nav-btn` sınıflarına dönüştürülmesi.
- [x] Karakter bilgileri (Level, Nickname) için `.character-name` ve `.character-rank` sınıfları eklendi.
- **[ONAY BEKLİYOR]** *Lütfen Ana Menü ekranını kontrol et. Karakter kartı, butonlar ve hizalamalar doğru mu?*

#### **7.3: Global Navigasyon (Dock Menü) - [TAMAMLANDI]**
- [x] `dock.css` dosyasındaki `z-index` değeri `35000` olarak güncellendi.
- [x] `index.ejs` dosyasındaki satır içi (inline) `z-index` tanımı kaldırıldı, CSS'e güvenildi.
- [x] Mobil ve dil (Almanca) özelindeki uyumluluklar korundu.
- **[ONAY BEKLİYOR]** *Lütfen Navigasyon (Dock) menüsünü kontrol et. Pencereler (Shop/Hangar) açıldığında dock menüsü artık onların altında kalmamalı ve mobilde hizalaması düzgün olmalı.*

#### **7.4: Modallar ve Paneller (Shop, Hangar, Rank) - [TAMAMLANDI]**
- [x] `.modal-overlay`, `.modal-content`, `.inventory-grid`, `.inventory-tabs` ve `.tab-btn` stilleri `modals.css`'e taşındı.
- [x] Modalların `z-index` değeri `40000` olarak güncellendi (Dock'un üstünde görünmesi için).
- [x] Kart yapıları (`.shop-card`, `.leaderboard-row`) `dock.css`'den `modals.css`'e daha mantıklı bir organizasyon için taşındı.
- [x] Mobil ekranlar için modal boyutları ve grid yapısı optimize edildi (`@media`).
- **[ONAY BEKLİYOR]** *Lütfen Market (Shop), Hangar ve Sıralama (Rank) pencerelerini kontrol et. Dock menüsünün üstünde açılıyorlar mı? Mobilde içerikler sığıyor mu?*

#### **7.5: Gelişmiş Ayarlar ve HUD Editor - [TAMAMLANDI]**
- [x] Ayarlar modalındaki karmaşık inline stiller temizlendi.

#### **7.6: Combat & HUD Overlay (Can Barları, XP) - [TAMAMLANDI]**
- [x] HUD ve oyun içi UI öğelerinin Neo-Cyberpunk temaya uyarlanması.

#### **7.7: Alt Menüler (Profil, Mağaza, Sıralama, Auth) - [TAMAMLANDI]**
- [x] Login, Register ve Profil sayfalarının modernizasyonu.

#### **7.8: Final Temizlik - [TAMAMLANDI]**
- [x] `index.ejs` içindeki kalan tüm `#0f0` referansları `var(--cyber-blue)` ile değiştirildi.
- [x] Tüm CSS dosyalarındaki (`style.css`, `dock.css`, `modals.css`, vb.) yeşil renk paleti modern Neo-Cyberpunk (Cyan/Pink) paletine dönüştürüldü.

---

## 🔌 Backend API Referansı

### 1. Kimlik Doğrulama (Auth)
*   `POST /auth/register`: Yeni kullanıcı kaydı.
*   `POST /auth/login`: Giriş yapma.
*   `GET /auth/google`: Google ile giriş.
*   `GET /auth/logout`: Çıkış yapma.

### 2. Oyun İstatistikleri (Game Stats)
*   `GET /api/current_user`: Giriş yapmış kullanıcının bilgilerini (Wallet, Stats, Inventory) döner.
*   `POST /api/game/submit-score`: Oyun sonu skor gönderimi. (Level, XP, Coin hesaplar).
*   `GET /api/stats/online`: Son 5 dakikada aktif olan kullanıcı sayısı.

### 3. Mağaza ve Ekonomi (Shop & Economy)
*   `GET /api/shop/items`: Satıştaki tüm aktif eşyaları listeler.
*   `POST /api/shop/buy`: Eşya satın alma işlemi. (Bakiye kontrolü yapar).
*   `GET /api/shop/inventory`: Kullanıcının sahip olduğu eşyalar.
*   `POST /api/shop/equip`: Satın alınan eşyayı kuşanma.

### 4. Sıralama (Leaderboard)
*   `GET /api/leaderboard/global`: En yüksek puanlı ilk 100 oyuncu.
*   `GET /api/leaderboard/league`: Kullanıcının kendi ligindeki sıralaması ve rakipleri.

---

## ⚙️ Arka Plan İşlemleri (Cron Jobs)

### Haftalık Lig Sıfırlama
*   **Dosya:** `jobs/cron.js`
*   **Zaman:** Her Pazar 00:00 (Sunucu saati).
*   **İşlev:**
    1.  Tüm kullanıcıları haftalık skorlarına (`weeklyScore`) göre sıralar.
    2.  İlk 10 -> **Cyber Legend**, Sonraki 40 -> **Diamond**, vb. şeklinde ligleri günceller.
    3.  Tüm kullanıcıların `weeklyScore` değerini sıfırlar.

---

## 🛠️ Frontend Geliştirme İçin Notlar (To-Do)

1.  **Mağaza Arayüzü (Shop UI):**
    *   `/api/shop/items` endpoint'inden gelen veriyi grid şeklinde listele.
    *   Satın al butonuna basınca `/api/shop/buy` isteği at.
    *   Başarılı ise animasyon göster ve bakiyeyi güncelle.

2.  **Reklam Entegrasyonu (Client-Side):**
    *   `GameConfig` modelinden gelen `ads` objesini kontrol et (`isEnabled`).
    *   Google AdMob veya Unity Ads SDK'sını projeye dahil et.
    *   Ölünce "Canlanmak için izle" butonu koy ve izleme bitince oyunu devam ettir.

3.  **Sıralama Tablosu:**
    *   Ana menüye "Leaderboard" butonu ekle.
    *   Tabloyu `/api/leaderboard/global` verisiyle doldur.
    *   Kullanıcının kendi sırasını vurgula.

---

## 🎨 Faz 4: UX/UI Revizyonu ve Mobil Optimizasyon (Devam Ediyor)
*Hedef: Tüm sayfaların görsel bütünlüğünü sağlamak, Android WebView performansını artırmak ve çoklu dil desteği.*

1.  **Görsel Bütünlük (Cyberpunk Theme Unification)**
    *   [ ] **Ortak Tasarım Dili:** Login, Register, Shop, Leaderboard ve Oyun ekranlarının aynı renk paleti, font ve arka planı kullanması.
    *   [x] **Cyber Header:** Tüm sayfalarda standart, sticky ve mobil uyumlu header kullanımı.
    *   [x] **Intro/Loading Ekranı:** Sayfa geçişlerinde ve ilk açılışta gizemli, cyberpunk temalı yükleme animasyonu.

2.  **Mobil & Android WebView Optimizasyonu**
    *   [x] **Responsive Layout:** Tüm ekranların dikey/yatay modda kusursuz görünmesi.
    *   [x] **Touch Controls:** Buton ve etkileşim alanlarının parmakla kullanıma uygun boyutta olması.
    *   [ ] **Offline Dostu:** Bağlantı koptuğunda oyunun çökmemesi, dil dosyalarının client-side (istemci taraflı) çalışması.

3.  **Çoklu Dil Desteği (i18n)**
    *   [x] **Dinamik Dil Seçimi:** Kullanıcının sistem diline (TR, EN, DE) göre otomatik dil algılama.
    *   [x] **Client-Side Localization:** Çevirilerin JSON/JS objesi olarak tutulup anlık değiştirilebilmesi (API bağımsız).

## 🌍 Faz 7: Dinamik Dil Yönetimi (Localization 2.0)
*Hedef: Oyunun tüm metinlerini veritabanından yönetilebilir hale getirmek ve yeni dil eklemeyi kolaylaştırmak.*

1.  **Altyapı (Backend)**
    *   [x] **Translation Modeli:** Dil anahtarlarını ve çevirilerini tutan MongoDB şeması.
    *   [x] **API:** Çevirileri frontend'e sunan ve Admin panelinden güncellemeyi sağlayan endpointler.
    *   [x] **Seed Script:** Mevcut hardcoded çevirileri veritabanına aktaran araç.

2.  **Yönetim (Admin)**
    *   [x] **Dil Editörü:** Admin panelinde anahtar-değer çiftlerini düzenleme arayüzü.
    *   [x] **Yeni Dil Ekleme:** Kod yazmadan yeni bir dil (örn: FR, ES) ekleme yeteneği.

3.  **Entegrasyon (Frontend)**
    *   [x] **Dinamik Yükleme:** `localization.js`'in veritabanından güncel çevirileri çekmesi.
    *   [x] **Tam Kapsam:** `index` (Upgrade Kartları dahil), `shop`, `leaderboard`, `profile` sayfalarındaki tüm sabit metinlerin `data-i18n` ile değiştirilmesi.



---

## 🏗️ Faz 7: Temizlik ve Kod Organizasyonu (Tamamlandı)
*Hedef: index.ejs dosyasını küçültmek ve CSS'i modüler hale getirmek.*

1.  **CSS Modülerleştirme**
    *   [x] Auth, Ana Menü, Dock, Modallar, Ayarlar ve Oyun HUD stillerini ayrı dosyalara çıkarma.
    *   [x] Gereksiz inline stilleri ve dahili <style> bloklarını temizleme.

2.  **UI/UX İyileştirmeleri**
    *   [x] Ayarlar panelinde Dock menüsünün arkada kalma sorunu çözüldü (z-index: 50000).
    *   [x] Ayarlar paneline mobil uyumlu "GERİ" butonu eklendi.
    *   [x] Tekrarlanan JS fonksiyonları (openSettings/closeSettings) temizlendi.

---

## 🌌 Faz 8: Neo-Cyberpunk Rebirth (Responsive & Performance)
*Hedef: 90'lardan kalma tasarımı geleceğin estetiğiyle değiştirmek ve yapısal (yerleşim) hatalarını modern CSS ile kökten çözmek.*

### **8.1: Temel Değişken Tarlası ve Katman Protokolü (Z-Index)**
- [x] `:root` değişkenlerinin tanımlanması (Neon Pink, Cyber Blue, Toxic Violet).
- [x] Merkezi `z-index` hiyerarşisinin kurulması (Dock > Modals > Overlays).
- [x] **[KPI]**: Renklerin tek bir dosyadan kontrol edilebilir olması.

### **8.2: Global Layout ve "Safe Area" Revizyonu**
- [x] `body` ve `#game-wrapper` için `overflow: hidden` ve `flex` yapısının kurulması.
- [x] Navigasyon menüsü için ekran altında güvenli alan (padding/margin) protokolü.
- [x] **[KPI]**: İçeriğin hiçbir cihazda ekranın dışına taşmaması.

### **8.3: Navigasyon (Dock) ve Menü Tasarımı**
- [x] Dock menüsünün modern "Glassmorphism" (buzlu cam) stiline geçirilmesi.
- [x] İkon ve yazıların mobil ölçekleme (clamp) ile optimize edilmesi.
- [x] **[KPI]**: Dock menüsünün hiçbir modalın arkasında kalmaması.

### **8.4: Modalların İçeriği ve Ayarlar Paneli**
- [x] Sabit `px` genişliklerinin `clamp()` ve `%` ile değiştirilmesi.
- [x] Market kartları, Envanter itemleri ve Sıralama listesinin yeni neon temasına uyarlanması.
- [x] **[KPI]**: Ayarlar ve Marketin tüm cihazlarda kusursuz görünmesi.

### **8.5: Giriş ve Kayıt (Auth) Ekranları**
- [x] `auth.css` dosyasının Neon-Cyberpunk renk paletine taşınması.
- [x] Arkaplan "grid" sisteminin yeşilden mavi/pembe tonlarına güncellenmesi.
- [x] **[KPI]**: Açılış ekranının modern bir "AAA" oyun havası vermesi.

### **8.6: Ana Menü ve Profil Alanı**
- [x] Hangar, Karakter istatistikleri ve Seviye panellerinin tasarımı.
- [x] Kullanıcı avatarı ve rütbe göstergelerinin modernizasyonu.
- [x] **[KPI]**: Ana menünün karmaşadan uzak, teknolojik görünmesi.

### **8.7: Oyun İçi HUD (Combat UI) Modernizasyonu - [TAMAMLANDI]**
*Hedef: Oyun oynanırken ekranda görünen tüm göstergeleri (HP, XP, Skor) Neo-Cyberpunk temasına uyarlamak.*

- [x] **8.7.1: Ana Skor ve High Score Panelleri**: Skor alanları neon çerçeveler ve `cyber-blue`/`neon-pink` renkleriyle tema uyumlu hale getirildi.
- [x] **8.7.2: XP ve Seviye Göstergesi**: Üstteki XP barı segmentli neon yapıya ve seviye numarasını terminal stiline dönüştürüldü.
- [x] **8.7.3: Can Sistemi (HP Bar)**: Mevcut kalplerin yerini temaya uygun "Enerji Çekirdekleri" (Energy Cells) aldı.
- [x] **8.7.4: Yetenek ve Durum Göstergeleri**: Dash dolum barı, Overdrive göstergesi ve aktif güçlendirmelerin (Powerups) renklerini neon palete çekildi, sayaçlar eklendi.
- [x] **8.7.5: Boss HP ve Combo UI**: Boss can barı ve Combo çarpanı modernize edildi.
- [x] **[KPI]**: HUD öğelerinin (Skor/Can/XP) birbiriyle veya menülerle üst üste binmemesi, 60 FPS akıcılığın korunması.

---

## 🚀 Faz 9: Oynanış Derinliği ve İçerik Genişletme (Gameplay & Content)
*Hedef: Teması yenilenen oyunun mekaniklerini zenginleştirmek ve oyuncu tutundurma oranını artırmak.*

### **9.1: Bölüm (Stage) ve Dalga (Wave) Sistemi**
- [ ] Belirli skor eşiklerinde "Bölüm Atlama" mekanizması.
- [ ] Her bölümde farklı arka plan görseli ve zorluk çarpanı.
- [ ] **[KPI]**: Oyunun monotonluktan kurtulup bir ilerleme hissi vermesi.

### **9.2: Günlük Görevler ve Ödül Havuzu**
- [ ] "1000 Skor Yap", "5 Dakika Hayatta Kal" gibi günlük kontratlar.
- [ ] Görev tamamlandığında ekstra Gem/Coin ödülü.
- [ ] **[KPI]**: Kullanıcıların her gün oyuna geri dönmesi için motivasyon.

### **9.3: Gelişmiş Ses ve Müzik Yönetimi**
- [ ] Neo-Cyberpunk temasına uygun synthwave arka plan müzikleri.
- [ ] Vuruş, toplama ve patlama efektlerinin (SFX) yenilenmesi.
- [ ] **[KPI]**: Görsel kaliteye eş değer bir işitsel deneyim.

