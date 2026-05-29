<div align="center">

# 🌍 Horus Eye

### Global Situational Awareness · 3D Intelligence Globe

[![Backend CI](https://github.com/unknown1fsh/horus_eye/actions/workflows/backend.yml/badge.svg)](https://github.com/unknown1fsh/horus_eye/actions/workflows/backend.yml)
[![Frontend CI](https://github.com/unknown1fsh/horus_eye/actions/workflows/frontend.yml/badge.svg)](https://github.com/unknown1fsh/horus_eye/actions/workflows/frontend.yml)
[![Docker](https://github.com/unknown1fsh/horus_eye/actions/workflows/docker.yml/badge.svg)](https://github.com/unknown1fsh/horus_eye/actions/workflows/docker.yml)
![Angular](https://img.shields.io/badge/Angular-20-DD0031?logo=angular&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?logo=springboot&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.174-000000?logo=threedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

**Açık kaynak global durum farkındalığı paneli.**
Deprem, yangın, fırtına, uçak, ISS, haber, kamera — tek bir 3D küre üstünde, gerçek zamanlı.

</div>

---

## 🇹🇷 Türkçe

> Horus Eye, halka açık veri kaynaklarından beslenen, **3D küre üstünde global durum farkındalığı** sunan açık kaynak bir intelligence dashboard'udur. Uydudan dünyaya bakar gibi şehir ışıkları belirgin gece görünümünde — deprem yansılarını, orman yangınlarını, tropikal fırtınaları, uçak trafiğini, ISS'i, jeopolitik olayları ve canlı kameraları aynı küre üzerinde canlı izleyebilirsiniz.

### ✨ Özellikler

- 🌐 **7 canlı katman** — USGS Earthquakes · NASA EONET Wildfires & Storms · OpenSky Aircraft · ISS · GDELT geopolitical events · 30+ public webcam
- 🌙 **Light + Dark tema** — varsayılan koyu, "uydudan bakış" gece modu (NASA Black Marble city lights)
- 🌍 **i18n TR + EN** — runtime locale switching (`?lang=en`), localStorage persist
- 📡 **SSE canlı kanal** — `/api/v1/stream` heartbeat + feed push hazır
- 🛡️ **Etik/yasal disclaimer** — pasif gözlem, provider TOS uyumluluğu, kaynak şeffaflığı
- 🛰️ **Polygon LOD** — 110m / 50m / 10m Natural Earth, kıtasal zoom'da yumuşak geçiş
- ⚡ **Performans** — pixel ratio cap, `visibilitychange` ile arka plan pause
- 🐘 **Flyway + Redis (opsiyonel)** — schema migration + feed snapshot cache, graceful fallback
- 🐳 **Tek komutla full stack** — `docker compose up -d`

### 🚀 Hızlı Başlangıç

```bash
git clone https://github.com/unknown1fsh/horus_eye
cd horus_eye
cp .env.example .env       # DB_PASSWORD girin
docker compose -f docker/docker-compose.yml up -d
# → http://localhost:4200
```

İlk açılışta etik/yasal disclaimer modal'ı çıkar; kabul ettikten sonra 3D küre, canlı katmanlar ve sağ üst panel'de dil/tema/bağlantı durumu görünür.

### 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│  Angular 20 SPA  · standalone components · signals          │
│  ├─ Three.js 3D globe + atmosphere + polygon LOD            │
│  ├─ 7 layer overlay (markers · arcs · pulses)               │
│  ├─ SSE EventSource client + theme/locale services          │
│  └─ Disclaimer modal · search · skeletons · i18n            │
└──────────────────────────┬──────────────────────────────────┘
                           │ /api/v1
┌──────────────────────────▼──────────────────────────────────┐
│  Spring Boot 3.4 on Java 21                                 │
│  ├─ FeedProxyController  (OpenSky · GDELT CORS proxy)       │
│  ├─ StreamController     (SseEmitter heartbeat)             │
│  ├─ Country/Continent    (REST Countries one-time sync)     │
│  ├─ FeedCacheService     (Redis wrapper, optional)          │
│  └─ Flyway V1 baseline + V2 feed_event audit                │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────────┐
        ▼                  ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│ PostgreSQL16 │    │ Redis 7      │    │ External Feeds   │
│ + Flyway     │    │ (opt cache)  │    │ USGS · EONET ·   │
│              │    │              │    │ OpenSky · ISS ·  │
│              │    │              │    │ GDELT · cams     │
└──────────────┘    └──────────────┘    └──────────────────┘
```

### 📚 Veri Kaynakları & Lisanslar

| Feed | URL | Lisans |
|---|---|---|
| USGS Earthquakes | https://earthquake.usgs.gov | Public Domain (US Gov) |
| NASA EONET | https://eonet.gsfc.nasa.gov | Public Domain (NASA) |
| OpenSky Network | https://opensky-network.org | Free non-commercial |
| wheretheiss.at — ISS | https://wheretheiss.at | Free public API |
| GDELT Project | https://www.gdeltproject.org | Open Data |
| Natural Earth | https://www.naturalearthdata.com | Public Domain |
| REST Countries v3.1 | https://restcountries.com | MPL 2.0 |
| Public webcams | curated whitelist | Embed-permitted only |

⚠️ **Etik kullanım**: Tüm akışlar yalnızca eğitim ve araştırma amacıyla görüntülenir. Hiçbir kapalı sisteme yetkisiz erişim yapılmaz; provider TOS'larına saygı duyulur.

### 🛠️ Geliştirme

```bash
# Backend
cd backend
mvn spring-boot:run               # http://localhost:8080

# Frontend
cd frontend
npm ci
npm run dev                       # http://localhost:4200

# Verify harnesses (Chrome gerekli)
node frontend/verify-output/drive-i18n.mjs   # i18n smoke test
node frontend/verify-output/drive-sse.mjs    # SSE smoke test
```

### 🗺️ Yol Haritası

- ✅ **Faz 1** — Feed Foundation (15/18 madde tamamlandı)
  - 7 katman · i18n · skeletons · SSE · Flyway+Redis · Docker+CI · Disclaimer
- ⏳ **Faz 2** — Cinematic + Premium (EffectComposer · day-night terminator · JWT · PostGIS · OpenTelemetry · PWA)
- ⏳ **Faz 3** — Premium feeds · LLM brief · alert subscriptions · k8s · voice search

### 🧪 Test & CI

3 GitHub Actions workflow:
- **backend** → `mvn verify` + PostgreSQL/Redis service containers
- **frontend** → `npm ci` + lint + build + headless test
- **docker** → backend + frontend image build (push'ta GHCR'a)

### 📦 Lisans

MIT — özgürce kullan, fork'la, geliştir. Kaynak credit'i ve provider TOS'larına saygı yeterli.

---

═══════════════════════════════ ENGLISH ═══════════════════════════════

## 🇬🇧 English

> Horus Eye is an open-source intelligence dashboard that streams public-data feeds onto a **3D globe for global situational awareness**. View the planet like a satellite — city lights shining in the night view — while earthquake ripples, wildfire hotspots, tropical storms, aircraft traffic, the ISS, geopolitical news and live cameras update in real time on the same sphere.

### ✨ Features

- 🌐 **7 live layers** — USGS Earthquakes · NASA EONET Wildfires & Storms · OpenSky Aircraft · ISS · GDELT events · 30+ public webcams
- 🌙 **Light + Dark theme** — defaults to dark, satellite-night look (NASA Black Marble city lights)
- 🌍 **i18n TR + EN** — runtime locale switch (`?lang=en`), localStorage persistence
- 📡 **SSE channel** — `/api/v1/stream` heartbeat + ready-to-push feed events
- 🛡️ **Ethical/legal disclaimer** — passive observation only, provider-TOS compliant, source transparency
- 🛰️ **Polygon LOD** — 110m / 50m / 10m Natural Earth, smooth continental zoom
- ⚡ **Performance** — pixel-ratio cap, `visibilitychange`-aware render pause
- 🐘 **Flyway + Redis (optional)** — schema migration + feed cache with graceful fallback
- 🐳 **One-command stack** — `docker compose up -d`

### 🚀 Quick Start

```bash
git clone https://github.com/unknown1fsh/horus_eye
cd horus_eye
cp .env.example .env       # set DB_PASSWORD
docker compose -f docker/docker-compose.yml up -d
# → http://localhost:4200
```

First visit prompts an ethical/legal disclaimer; after accepting, the 3D globe, live layers and the top-right language/theme/connection dock all light up.

### 🏗️ Architecture

(See the diagram above — same for both languages.)

### 📚 Data Sources & Licenses

(See the table above — all free-tier public feeds.)

⚠️ **Ethical use**: All streams are shown for educational and research purposes only. No attempt is made to access closed systems; provider TOS is respected.

### 🛠️ Development

```bash
# Backend
cd backend && mvn spring-boot:run        # http://localhost:8080

# Frontend
cd frontend && npm ci && npm run dev     # http://localhost:4200

# Verify (requires Chrome)
node frontend/verify-output/drive-i18n.mjs   # i18n smoke
node frontend/verify-output/drive-sse.mjs    # SSE smoke
```

### 🗺️ Roadmap

- ✅ **Phase 1** — Feed Foundation (15/18 items shipped)
- ⏳ **Phase 2** — Cinematic + Premium foundation
- ⏳ **Phase 3** — Premium feeds · LLM brief · alerts · k8s

### 📦 License

MIT — use, fork, extend freely. Source credit and provider TOS are expected.

---

<div align="center">

**🛰️ Horus Eye — built with curiosity, shipped with care.**

</div>
