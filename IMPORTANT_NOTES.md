# 🔐 Önemli Proje Notları ve Anahtarlar

Bu dosya proje için kritik öneme sahip anahtarları, şifreleri ve yapılandırma bilgilerini içerir.
**BU DOSYAYI ASLA GITHUB VEYA HERKESE AÇIK BİR YERDE PAYLAŞMAYIN.**

## 📱 Android Keystore Bilgileri
Android uygulamasını imzalamak için kullanılan anahtar deposu bilgileri.
*   **Dosya Yolu:** `/home/xebat/cyber-scavenger/upload-keystore.jks`
*   **Keystore Şifresi:** `android`
*   **Key Alias:** `upload`
*   **Key Şifresi:** `android`
*   **SHA-1 Parmak İzi:** `C5:96:66:84:6A:1A:E6:FB:F0:CE:0B:49:ED:50:C6:FC:86:2A:79:68`
*   **Paket Adı:** `com.muratbirben.cyberscavenger`

## 🌐 Google OAuth 2.0 Bilgileri
Google ile giriş ve Android entegrasyonu için kullanılan kimlik bilgileri.

**NOT:** Hassas bilgiler (Client Secret vb.) güvenlik nedeniyle `.env` dosyasına taşınmıştır.

*   **Client ID:** `307035875446-m8pi5ic2hhsgo5ni6h7ugqo65ja38d2h.apps.googleusercontent.com`
*   **Redirect URI:** `https://play.muratbirben.com/auth/google/callback`

### Diğer ID'ler
*   **Önceki Client ID:** `307035875446-n641ac0p4kn2p3idr566b3npirrooq92.apps.googleusercontent.com`

## 🗄️ Veritabanı Bilgileri
*   **MongoDB URI:** `mongodb://localhost/cyber-scavenger` (Varsayılan Yerel Bağlantı)

## ⚠️ Canlı Ortam (Production) Geçişi
ÖNEMLİ: İşiniz bittiğinde ve canlıya çıkacağınız zaman .env dosyasındaki NODE_ENV=development satırını tekrar NODE_ENV=production yapmanız yeterli olacaktır. Kodda değişiklik yapmanıza gerek kalmayacak.
 