// ARTAPP bağlantısız çalışma (yayinla.mjs üretir; elle düzenlemeyin)
const SURUM = 'artapp-c97249ba9e21';
const DOSYALAR = ["./","css/kagit.css","css/stil.css","img/logo/logo-1.svg","img/logo/logo-2.svg","img/logo/logo-3.svg","img/logo/logo-4.svg","img/logo/logo-4c.svg","js/adeko.js","js/aksesuarlar.js","js/aktar.js","js/ana.js","js/dekor.js","js/denetim.js","js/duzelt.js","js/esit.js","js/etiket.js","js/foto.js","js/fotocanli.js","js/fotomotor.js","js/isleme.js","js/islemefoy.js","js/kapaklar.js","js/katalogresim.js","js/kertme.js","js/kesim.js","js/kesimplan.js","js/kulplar.js","js/kulpresim.js","js/maliyet.js","js/moduller.js","js/montaj.js","js/odalar.js","js/ortak.js","js/oturt.js","js/planla.js","js/rehber.js","js/renkler.js","js/sablon.js","js/sahne.js","js/sunumdosya.js","js/tac.js","js/teklif.js","js/teknik.js","js/tezgah-veri.js","js/tezgahkatalog.js","js/uretim.js","js/yerlesim.js","kilavuz.html","manifest.json","simge-180.png","simge-192.png","simge-512.png","simge.svg","vendor/three/LICENSE","vendor/three/OrbitControls.js","vendor/three/three.module.js"];
self.addEventListener('install', e => e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR.map(d => new Request(d, { cache: 'reload' })))).then(() => self.skipWaiting()))); // 'reload': tarayıcının eski kopyası değil, sunucudaki güncel dosya kaydedilir
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(l => Promise.all(l.filter(k => k !== SURUM).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/')) return; // eşitleme istekleri ağa gider
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
