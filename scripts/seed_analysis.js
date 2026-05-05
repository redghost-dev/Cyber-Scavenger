const mongoose = require('mongoose');
const GameConfig = require('../models/GameConfig');
require('dotenv').config();

const ANALYSIS_DOC = `# Cyber Scavenger: Game Mechanics and Economy Analysis

This document provides a deep technical analysis of the game mechanics, economy loop, and progression systems based on the current source code of Cyber Scavenger.

---

## 1. Economy Loop: Faucets vs Sinks

The game operates on a İki katmanlı bir para birimi sistemi: **Coins** (yumuşak para birimi) ve **Gems** (premium para birimi).

### **Faucets (Gelir)**
| Kaynak | Tür | Ödül | Mantık Referansı |
| :--- | :--- | :--- | :--- |
| **Orb Toplama** | Puan | 10 pts (Normal) / 50 pts (Super) | index.ejs#L2480 |
| **Düşman İmhası** | Puan | 20 pts × Kombo × Çarpan | index.ejs#L2657 |
| **Boss Kesimi** | Puan | 500 pts × Çarpan | index.ejs#L2540 |
| **Reklam Ödülleri** | Coin | 100 Coins (Varsayılan) | GameConfig.js, api.js#L95 |
| **Puan Katlama** | Puan | Skor × max(2, level) | index.ejs#L692 |

### **Sinks (Gider)**
| Kaynak | Hedef | Maliyet Türü | Mantık Referansı |
| :--- | :--- | :--- | :--- |
| **Hangar/Market** | Gemi Modelleri | Coin/Gem | shop.js#L45 |
| **Özelleştirme** | Görseller & İzler | Coin/Gem | shop.js#L45 |
| **Profil** | Avatarlar | Coin/Gem | api.js#L206 |

---

## 2. İlerleme Sistemleri (Progression)

### **Oyun İçi İlerleme**
Seviye atlama için üssel bir ölçeklendirme kullanılır:
- **XP Kaynağı**: 5 XP (normal), 20 XP (super).
- **Seviye Formülü**: xpToNextLevel = Math.floor(xpToNextLevel * 1.2)
- **Zorluk Ölçeklendirme**: 
  - **Hız**: 1.0 + (Level × 0.15)
  - **Spawn**: max(400, 2500 - (Level × 150)) ms

---

## 3. Matematiksel Formüller

### **Skor Hesaplama**
Oyun sırasında elde edilen skor:
Score = BasePoints × Kombo × SkorÇarpanı × ZorlukÇarpanı
- **Kombo**: Maksimum 8x, 3 saniye sonra söner.
- **Zorluk**: Easy (0.8x), Medium (1.0x), Hard (1.5x).

### **Savaş Formülleri**
- **Oyuncu Hasarı**:
  - Dash ile çarpma: Anında Öldürür.
  - Boss'a Dash: 10 DMG.
  - Overdrive Çarpışması: 20 DMG.
- **Düşman Hasarı**: 
  - Tüm çarpışmalar: -1 HP.
- **Başlangıç Canları**: Easy (5), Medium (3), Hard (1).

---

## 4. Denetim & Teknik Riskler

1. **Skor Güvenliği**: /api/game/submit-score doğrulanmamış veri kabul eder.
2. **Gemi İstatistikleri**: Gemilerin damage ve health özellikleri kodda tanımlı olsa da henüz oyuna (motor tarafına) yansıtılmamıştır.
3. **Sonsuz Kombo Potansiyeli**: Kombo 8x ile sınırlı olsa da level upgrades'lerden gelen çarpanların üst sınırı yoktur.
`;

async function seed() {
    try {
        await mongoose.connect('mongodb://localhost:27017/cyber-scavenger');
        console.log('MongoDB Connected');

        await GameConfig.findOneAndUpdate(
            { key: 'global_settings' },
            { 
                $set: { 
                    'analysisDoc.content': ANALYSIS_DOC,
                    'analysisDoc.lastUpdated': new Date()
                } 
            },
            { upsert: true }
        );

        console.log('Analysis Document Seeded Successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
