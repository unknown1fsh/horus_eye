export type Locale = 'tr' | 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['tr', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'tr';

export type Dictionary = Readonly<Record<string, string>>;

const TR: Dictionary = {
  // Layer panel
  'panel.layers.title': 'Katmanlar',
  'panel.layers.toggleOpen': 'Katmanları aç',
  'panel.layers.toggleClose': 'Katmanları kapat',
  'panel.layers.activeCount': 'aktif',
  'panel.layers.totalCount': 'toplam',
  'panel.layers.opacity': 'Opasite',
  'panel.layers.loading': 'yükleniyor…',
  'panel.layers.error': 'hata',
  'panel.layers.records': 'kayıt',
  'panel.layers.waiting': 'veri bekleniyor',
  'panel.layers.reset': 'Varsayılana dön',
  'panel.layers.now': 'şimdi',
  'panel.layers.secondsAgo': 's önce',
  'panel.layers.minutesAgo': 'd önce',
  'panel.layers.hoursAgo': 'sa önce',
  'panel.layers.daysAgo': 'g önce',

  // Search bar
  'search.placeholder': 'Ülke ara...',
  'search.searching': 'Aranıyor...',
  'search.noResults': 'Sonuç bulunamadı',

  // Disclaimer modal
  'disclaimer.badge': 'Etik ve Yasal Bildirim',
  'disclaimer.title': 'Horus Eye — Pasif Gözlem Paneli',
  'disclaimer.body': 'Bu pano, halka açık veri kaynaklarından beslenen 3D durum farkındalığı görselleştirmesidir. Tüm akış verileri yalnızca eğitim ve araştırma amacıyla gösterilir. Hiçbir özel sisteme, kapalı API\'ye veya korumalı kaynağa yetkisiz erişim girişiminde bulunulmaz.',
  'disclaimer.rule1': 'Akan veriler önbelleğe alınır; topluca yeniden yayınlamayın.',
  'disclaimer.rule2': 'Kamera akışları yalnızca embed izinli halka açık kaynaklardır.',
  'disclaimer.rule3': 'Sağlayıcıların TOS\'larına uyun; ticari kullanım için ayrı izin gerekir.',
  'disclaimer.rule4': 'Hassas içerik gözlemlerseniz uygun mercilere bildirin, yayılmasına aracı olmayın.',
  'disclaimer.sourcesSummary': 'Veri kaynakları ve lisansları',
  'disclaimer.remember': 'Bu bilgiyi bir daha gösterme',
  'disclaimer.accept': 'Kabul ediyorum, devam et',

  // Locale switcher
  'locale.switcher.label': 'Dil',
  'locale.switcher.tr': 'TR',
  'locale.switcher.en': 'EN',

  // Status overlay
  'status.live': 'CANLI',
  'status.connected': 'Bağlandı',
  'status.disconnected': 'Bağlantı yok',
  'status.loading': 'Yükleniyor...',
  'status.retry': 'Tekrar dene',

  // Popups — common
  'popup.close': 'Kapat',
  'popup.source': 'Kaynak',
  'popup.time': 'Zaman',
  'popup.location': 'Konum',
  'popup.openLink': 'Bağlantıyı aç',

  // Popup — earthquake
  'popup.eq.title': 'Deprem',
  'popup.eq.magnitude': 'Büyüklük',
  'popup.eq.depth': 'Derinlik',
  'popup.eq.place': 'Yer',
  'popup.eq.unknownPlace': 'Bilinmeyen konum',
  'popup.eq.felt': 'Hissedilme',
  'popup.eq.reports': 'rapor',
  'popup.eq.significance': 'Önem',
  'popup.eq.tsunamiWarning': '⚠ Tsunami uyarısı işaretli',
  'popup.eq.usgsLink': 'USGS detayına git ↗',

  // Popup — wildfire
  'popup.fire.title': 'Yangın Hotspot',
  'popup.fire.frp': 'Yangın gücü (FRP)',
  'popup.fire.satellite': 'Uydu',
  'popup.fire.acquired': 'Tespit',
  'popup.fire.sources': 'Kaynaklar',
  'popup.fire.footnote': 'Kaynak: NASA EONET (open events)',

  // Popup — storm
  'popup.storm.title': 'Tropikal Fırtına',
  'popup.storm.category': 'Kategori',
  'popup.storm.wind': 'Rüzgar',
  'popup.storm.pressure': 'Basınç',
  'popup.storm.lastPosition': 'Son Konum',
  'popup.storm.lastUpdate': 'Son Güncelleme',
  'popup.storm.trackPoints': 'İz Noktaları',
  'popup.storm.sources': 'Kaynaklar',
  'popup.storm.footnote': 'Kaynak: NASA EONET (severeStorms)',

  // Popup — aircraft
  'popup.aircraft.title': 'Uçak',
  'popup.aircraft.callsign': 'Çağrı işareti',
  'popup.aircraft.altitude': 'İrtifa',
  'popup.aircraft.velocity': 'Hız',
  'popup.aircraft.country': 'Ülke',
  'popup.aircraft.origin': 'Menşei',
  'popup.aircraft.icao24': 'ICAO24',
  'popup.aircraft.heading': 'Yön',
  'popup.aircraft.footnote': 'Kaynak: OpenSky Network (ADS-B)',

  // Popup — ISS
  'popup.iss.title': 'Uluslararası Uzay İstasyonu',
  'popup.iss.altitude': 'İrtifa',
  'popup.iss.velocity': 'Yörünge hızı',
  'popup.iss.footprint': 'Footprint',
  'popup.iss.footnote': 'Kaynak: wheretheiss.at (5 sn aralıklarla)',

  // Popup — gdelt
  'popup.gdelt.title': 'Jeopolitik Olay',
  'popup.gdelt.tone': 'Ton',
  'popup.gdelt.themes': 'Temalar',
  'popup.gdelt.untitled': 'Başlıksız',
  'popup.gdelt.language': 'Dil',
  'popup.gdelt.openArticle': 'Makaleyi aç ↗',
  'popup.gdelt.footnote': 'Kaynak: GDELT Project DOC 2.0',

  // Popup — camera
  'popup.camera.title': 'Canlı Kamera',
  'popup.camera.tos': 'Kullanım koşulları',
  'popup.camera.streamLoading': 'Yükleniyor…',
  'popup.camera.streamError': 'Stream yüklenemedi.',
  'popup.camera.openInTab': 'Ayrı sekmede aç',
  'popup.camera.license': 'Lisans',
  'popup.camera.openSource': 'Kaynak sayfada aç ↗',
  'popup.camera.disclaimer': 'Bu yayın yalnızca eğitim ve araştırma amacıyla görüntüleniyor; sağlayıcı şartlarına saygı gösterin.'
};

const EN: Dictionary = {
  // Layer panel
  'panel.layers.title': 'Layers',
  'panel.layers.toggleOpen': 'Open layers',
  'panel.layers.toggleClose': 'Close layers',
  'panel.layers.activeCount': 'active',
  'panel.layers.totalCount': 'total',
  'panel.layers.opacity': 'Opacity',
  'panel.layers.loading': 'loading…',
  'panel.layers.error': 'error',
  'panel.layers.records': 'records',
  'panel.layers.waiting': 'awaiting data',
  'panel.layers.reset': 'Reset to defaults',
  'panel.layers.now': 'now',
  'panel.layers.secondsAgo': 's ago',
  'panel.layers.minutesAgo': 'm ago',
  'panel.layers.hoursAgo': 'h ago',
  'panel.layers.daysAgo': 'd ago',

  // Search bar
  'search.placeholder': 'Search country...',
  'search.searching': 'Searching...',
  'search.noResults': 'No results',

  // Disclaimer modal
  'disclaimer.badge': 'Ethical & Legal Notice',
  'disclaimer.title': 'Horus Eye — Passive Observation Panel',
  'disclaimer.body': 'This dashboard is a 3D situational awareness visualization driven by public data sources. All streaming data is shown for educational and research purposes only. No attempt is made to access private systems, closed APIs, or protected resources.',
  'disclaimer.rule1': 'Streaming data is cached; do not bulk-rebroadcast.',
  'disclaimer.rule2': 'Camera streams are only embed-permitted public sources.',
  'disclaimer.rule3': 'Comply with provider TOS; commercial use requires separate permission.',
  'disclaimer.rule4': 'If you observe sensitive content, report it to the appropriate authorities — do not amplify it.',
  'disclaimer.sourcesSummary': 'Data sources & licenses',
  'disclaimer.remember': 'Don\'t show this again',
  'disclaimer.accept': 'I agree, continue',

  // Locale switcher
  'locale.switcher.label': 'Language',
  'locale.switcher.tr': 'TR',
  'locale.switcher.en': 'EN',

  // Status overlay
  'status.live': 'LIVE',
  'status.connected': 'Connected',
  'status.disconnected': 'Disconnected',
  'status.loading': 'Loading...',
  'status.retry': 'Retry',

  // Popups — common
  'popup.close': 'Close',
  'popup.source': 'Source',
  'popup.time': 'Time',
  'popup.location': 'Location',
  'popup.openLink': 'Open link',

  // Popup — earthquake
  'popup.eq.title': 'Earthquake',
  'popup.eq.magnitude': 'Magnitude',
  'popup.eq.depth': 'Depth',
  'popup.eq.place': 'Place',
  'popup.eq.unknownPlace': 'Unknown location',
  'popup.eq.felt': 'Felt by',
  'popup.eq.reports': 'reports',
  'popup.eq.significance': 'Significance',
  'popup.eq.tsunamiWarning': '⚠ Tsunami warning flagged',
  'popup.eq.usgsLink': 'Open USGS details ↗',

  // Popup — wildfire
  'popup.fire.title': 'Fire Hotspot',
  'popup.fire.frp': 'Fire Radiative Power',
  'popup.fire.satellite': 'Satellite',
  'popup.fire.acquired': 'Acquired',
  'popup.fire.sources': 'Sources',
  'popup.fire.footnote': 'Source: NASA EONET (open events)',

  // Popup — storm
  'popup.storm.title': 'Tropical Storm',
  'popup.storm.category': 'Category',
  'popup.storm.wind': 'Wind',
  'popup.storm.pressure': 'Pressure',
  'popup.storm.lastPosition': 'Last Position',
  'popup.storm.lastUpdate': 'Last Update',
  'popup.storm.trackPoints': 'Track Points',
  'popup.storm.sources': 'Sources',
  'popup.storm.footnote': 'Source: NASA EONET (severeStorms)',

  // Popup — aircraft
  'popup.aircraft.title': 'Aircraft',
  'popup.aircraft.callsign': 'Callsign',
  'popup.aircraft.altitude': 'Altitude',
  'popup.aircraft.velocity': 'Velocity',
  'popup.aircraft.country': 'Country',
  'popup.aircraft.origin': 'Origin',
  'popup.aircraft.icao24': 'ICAO24',
  'popup.aircraft.heading': 'Heading',
  'popup.aircraft.footnote': 'Source: OpenSky Network (ADS-B)',

  // Popup — ISS
  'popup.iss.title': 'International Space Station',
  'popup.iss.altitude': 'Altitude',
  'popup.iss.velocity': 'Orbital velocity',
  'popup.iss.footprint': 'Footprint',
  'popup.iss.footnote': 'Source: wheretheiss.at (5 s intervals)',

  // Popup — gdelt
  'popup.gdelt.title': 'Geopolitical Event',
  'popup.gdelt.tone': 'Tone',
  'popup.gdelt.themes': 'Themes',
  'popup.gdelt.untitled': 'Untitled',
  'popup.gdelt.language': 'Language',
  'popup.gdelt.openArticle': 'Open article ↗',
  'popup.gdelt.footnote': 'Source: GDELT Project DOC 2.0',

  // Popup — camera
  'popup.camera.title': 'Live Camera',
  'popup.camera.tos': 'Terms of use',
  'popup.camera.streamLoading': 'Loading…',
  'popup.camera.streamError': 'Stream failed to load.',
  'popup.camera.openInTab': 'Open in new tab',
  'popup.camera.license': 'License',
  'popup.camera.openSource': 'Open source page ↗',
  'popup.camera.disclaimer': 'This stream is shown for educational and research purposes only — please respect provider terms.'
};

export const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = { tr: TR, en: EN } as const;
