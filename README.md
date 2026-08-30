# Foto Generator AI

Aplikasi web (PWA) untuk generate prompt video AI produk — cocok untuk konten TikTok/Instagram.

## Fitur
- Generator prompt video produk (foto → prompt AI video)
- General Video Prompt Tool (cinematic, storytelling, fashion, dll)
- Bisa dihubungkan ke Gemini atau Claude API
- Bisa di-install sebagai aplikasi (PWA) di HP maupun desktop

## Cara Deploy

### GitHub Pages
1. Buka repo ini → **Settings** → **Pages**
2. Source: pilih branch `main`, folder `/ (root)`
3. Simpan, tunggu beberapa menit, app aktif di `https://<username>.github.io/<nama-repo>/`

### Netlify
1. Hubungkan repo ini ke Netlify (New site from Git)
2. Build command: kosongkan
3. Publish directory: `/`

## Struktur File
- `index.html` — aplikasi utama (single file, HTML+CSS+JS)
- `manifest.json` — konfigurasi PWA (nama, icon, tema)
- `sw.js` — service worker untuk caching/offline
- `icon-192.png`, `icon-512.png` — icon aplikasi
