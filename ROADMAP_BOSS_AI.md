# BOSS AI EKOSİSTEMİ & VERİTABANI DÖNÜŞÜMÜ YOL HARİTASI

Bu belge, oyunun statik dosya yapısından; dinamik, veritabanı destekli ve AI tarafından beslenen ölçeklenebilir bir "Oyun Platformuna" dönüşüm sürecini adım adım tanımlar.

---

## 🛑 FAZ 0: HAZIRLIK VE GÜVENLİK (Mevcut Durum)
**Amaç:** Mevcut çalışan sistemi bozmadan altyapıyı hazırlamak.

- [x] **DB Şemasının Oluşturulması (`models/Boss.js`)**
    - `id`, `logic`, `visualType` gibi temel alanların tanımlanması.
    - `creatorId`: Boss'un kime ait olduğu (Sistem veya Oyuncu).
    - `generatedByAI`: AI analitiği için flag.
    - `isGlobal`: Acil durum yedeği olup olmadığı.
    - `killCountBasedDifficulty`: İleride eklenecek zorluk çarpanları.

- [x] **Migrasyon Scripti (`scripts/migrate_bosses.js`)**
    - Mevcut `void_harbinger` ve `seraphim` JSON dosyalarının hatasız, birebir kopyasının MongoDB'ye aktarılması.

---

## 🏗️ FAZ 1: KOD TEMİZLİĞİ VE MODÜLERLEŞTİRME (Refactoring)
**Amaç:** 6000+ satırlık `index.ejs` dosyasını, mantığı bozmadan yönetilebilir küçük parçalara bölmek. Bu yapılmadan AI entegrasyonuna geçilmeyecek.

- [ ] **Modüler Yapının Kurulması (`/public/js/game_modules/`)**
    - `renderer.js`: Canvas çizim fonksiyonları (draw loop).
    - `physics.js`: Çarpışma ve hareket mantığı.
    - `boss_manager.js`: Boss spawn olma, veriyi işleme ve oynatma.
    - `input.js`: Klavye ve mouse kontrolleri.
    - **Global State Tanımlaması:** `index.ejs` içindeki `player`, `boss`, `projectiles` gibi değişkenlerin window/global scope'a taşınması veya bir `GameState` objesinde toplanması (Çünkü mevcut kod Class yapısı kullanmıyor, düz obje kullanıyor).

- [ ] **`index.ejs` Sadeleştirmesi**
    - HTML dosyasının içinde sadece UI ve `<script src="...">` bağlantıları kalacak.
    - **Risk Yönetimi:** Kodlar taşınırken `variable scope` (değişken erişimi) hatalarına karşı her adımda test edilecek.

---

## 🔌 FAZ 2: HİBRİT VERİ SİSTEMİ (DB + Dosya)
**Amaç:** Oyunu dosya okumaktan kurtarıp API üzerinden veri çeker hale getirmek.

- [ ] **Backend API Yazımı (`/routes/api.js`)**
    - `GET /api/boss/next`: Bir sonraki bossu getiren akıllı endpoint.
- [ ] **Akıllı Boss Seçici (The Selector Logic)**
    - Algoritma:
        1.  AI aktif mi? -> Evet -> AI'dan üret.
        2.  AI kapalı/hatalı mı? -> DB'den rastgele bir "Oyuncu Bossu" seç (Anonim Mod).
        3.  DB cevap vermiyor mu? -> Global Yedekleri (Void Harbinger) kullan.
- [ ] **Frontend Entegrasyonu**
    - `index.ejs` (veya `boss_manager.js`) içindeki `fetch('/json/...')` yapısının `fetch('/api/boss/next')` ile değiştirilmesi.

---

## 🤖 FAZ 3: AI ENTEGRASYONU VE "GÖLGE MODU"
**Amaç:** Oyuncuya hissettirmeden sonsuz içerik sunmak.

- [ ] **AI Prompt Şablonunun Tasarlanması**
    - Mevcut JSON yapısının sıkıştırılmış bir versiyonunun AI'ya öğretilmesi.
- [ ] **Zorluk Ölçeklendirme (Kill Count Scaling)**
    - Boss verisi DB'den gelirken, oyuncunun `totalKills` sayısına bakılarak `hpMult` ve `damage` değerlerinin sunucu tarafında artırılması.
    - *Örnek: Oyuncu 50 boss kestiyse, gelen boss'un saldırı hızı %20 artırılır.*
- [ ] **Anonimleştirme Katmanı**
    - Başka oyuncunun ürettiği boss seçilirse, API cevabında `creatorName` alanının gizlenmesi veya "AI Architect" olarak değiştirilmesi.

---

## 🧠 FAZ 3.5: GEMINI API İLE YAPAY ZEKA ÜRETİM HATTI (Generative Pipeline)
**Amaç:** Gemini'yi oyunun baş tasarımcısı gibi kullanıp, tek bir prompt ile tüm bölümü (Görsel, Fizik, Minyonlar) inşa etmek.

- [ ] **Prompt Mühendisliği (The Architect Prompt)**
    - Gemini'ye şu anki Canvas/JS altyapısını öğreten "System Instruction" hazırlanması.
    - Sadece "Ateş Eden Boss" değil; çizim komutlarını (`ctx.beginPath`...), animasyon karelerini ve yardımcı minyonları (`minions array`) içeren eksiksiz JSON çıktısı ürettirilmesi.
- [ ] **Payload İşleyici (The Builder)**
    - Gemini'den gelen metin tabanlı yanıtın (String) temizlenip, oyunun anlayacağı güvenli koda (Executable Function) dönüştürülmesi.
    - Hata Toleransı: Eğer AI bozuk kod gönderirse, oyunun çökmeden "Yedek Boss"u devreye sokması.
- [ ] **Dinamik Varlık Yöneticisi**
    - AI'nın ürettiği "Yardımcı Gemiler" (Minyonlar) için oyun döngüsüne yeni bir `minionManager` eklenmesi.

---

## 🌍 FAZ 4: SOSYAL EKOSİSTEM (Gelecek Vizyonu)
**Amaç:** Oyuncuların ürettikleri içerikleri sahiplenmesi.

- [ ] **"Kütüphaneye Ekle" Butonu**
    - Oyuncu savaştığı boss'u beğenirse favorilerine ekleyebilecek.
- [ ] **Marketplace (Boss Dükkanı)**
    - Oyuncular kendi AI promptları ile ürettikleri bossları vitrine koyabilecek.

---

## 📝 UYGULAMA PRENSİPLERİ
1.  **Önce Yedek:** Her işlemden önce çalışan kodun yedeği alınacak.
2.  **Paralel Çalışma:** Eski sistem (JSON dosyaları) silinmeyecek, yeni sistem %100 oturana kadar "Yedek Lastik" olarak klasörde duracak.
3.  **Kullanıcı Deneyimi:** Oyuncu arkada dönen AI veya DB işlemlerini asla fark etmeyecek (Loading ekranı uzamayacak).
