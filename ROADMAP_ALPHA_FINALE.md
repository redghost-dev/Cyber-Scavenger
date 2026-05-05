# Cyber Scavenger - Alpha Final Yol Haritası

Bu belge, oyunun "Alpha" sürümünü kararlı (stable) bir hale getirmek için izlenecek kısa vadeli adımları içerir. Hedef: Yapay Zeka entegrasyonuna geçmeden önce sağlam, oynanabilir ve hatasız bir oyun döngüsü kurmak.

## 🏁 FAZ 1: Oyun Döngüsü ve Boss Mantığı (ÖNCELİK)
Mevcut skor bazlı boss sistemini, hibrit (Skor + Kill) sisteme çevirerek oyunun sonsuz döngüye girmesini sağlamak.

- [ ] **Hibrit Sayaç Sistemi:** 
    - Oyun başı: `5000` Puan toplayana kadar bekle.
    - Boss sonrası: Sayaç sıfırlanır, `100` Düşman öldürülene kadar bekle.
- [ ] **Boss Ölçeklendirme (Scaling):**
    - Her yeni Boss geldiğinde HP değerini bir önceki seviyenin `%20` fazlası yap.
    - `Boss Level` değişkeni ile bunu takip et.
- [ ] **Admin Paneli Entegrasyonu:**
    - Panelden "İlk Çıkış Puanı" (5000) ayarlanabilsin.
    - Panelden "Boss Arası Kill Sayısı" (100) ayarlanabilsin.
    - Panelden "Güçlenme Oranı" (%20) ayarlanabilsin.

## ⚔️ FAZ 2: İçerik Çeşitliliği (Content)
Oyun döngüsü düzelince, oyuncunun sıkılmaması için çeşitlilik eklenmesi.

- [ ] **Düşman Tipleri:**
    - `Kamikaze`: Oyuncuya doğru intihar dalışı yapan hızlı, düşük canlı düşman.
    - `Shielded`: Önünde kalkan olan, sadece arkadan vurulabilen (veya yüksek hasar isteyen) düşman.
- [ ] **Silah Sistemi (Görsel Ayrım):**
    - `Shotgun`: Zaten eklendi, görsel efekti iyileştirilecek.
    - `Laser`: Hızlı seri atış yapan, düz çizgi (beam) görseli olan silah.
    - Markette silahların ikonlarının ve özelliklerinin doğru görünmesi.

## 🎨 FAZ 3: Oyun Hissi (Game Juice)
Oyunun "kütük" gibi durmaması, canlı hissettirmesi için yapılacak görsel dokunuşlar.

- [ ] **Kamera Sarsıntısı (Screen Shake):** Patlamalarda ve hasar alımda ekranın titremesi.
- [ ] **Parallax Arka Plan:** Yıldızların katmanlı olarak farklı hızlarda akması (Derinlik hissi).
- [ ] **Damage Numbers:** Vurulan düşmanın üzerinde hasar sayılarının uçuşması.
- [ ] **Gemi İvmesi:** Gemi hareket ederken hafifçe yana yatması (Rotation tilt).

## 🛠 FAZ 4: Temizlik ve Hazırlık
Gelecekteki AI sistemine hazırlık.

- [ ] **Config Loader:** `index.ejs` içindeki sayıları temizleyip, tamamen backend'den gelen JSON ile çalışacak hale getirmek.
- [ ] **Code Refactoring:** 5000 satırlık `index.ejs` dosyasını `game.js`, `enemy.js` gibi modüllere bölmek (Bu işlem risklidir, en sona bırakılmalı).
