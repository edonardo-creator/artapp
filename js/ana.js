// Uygulama durumu, arayüz ve kayıt.
import { OZEL_TURLER, KATALOG, TANIM, yeniModul, yeniKimlik, alanlar, parcalar, standartAyarla, projeAyarla, KAPAK_MODELLERI, STANDART_SINIR, STANDART_VARSAYILAN, UST_HAT, ALT_DERIN, OLCU_SURUM } from './moduller.js';
import { SABIT } from './ortak.js';
import { DUVARLAR, DUVAR_LISTE, xEksenli, duvarBoyu, bosYerBul, tasimaCoz, uyarilar, kutu, boslukDoldur, serbestMi, bitisParcalari, bosAraliklar, yukseklikHizala, hizalamayiUygula, EGIK_OLUR } from './yerlesim.js';

const DESEN_KAPAK = { duz: 'Düz', ahsap: 'Ahşap' };
const DESEN_TEZGAH = { duz: 'Düz', mermer: 'Mermer', ahsap: 'Ahşap' };
const DESEN_ZEMIN = { duz: 'Düz', parke: 'Parke', karo: 'Karo (60 × 60)', mermer: 'Mermer', beton: 'Beton' };
const DESEN_ARASI = { duz: 'Düz (cam / boya)', metro: 'Metro fayans', fayans: 'Kare fayans (20 × 20)', mozaik: 'Mozaik', mermer: 'Mermer', tugla: 'Tuğla' };
const DESEN_DUVAR = { duz: 'Düz boya', kagit: 'Çizgili duvar kağıdı', tugla: 'Tuğla', beton: 'Brüt beton', fayans: 'Kare fayans (banyo)' };
// Hazır görünümler: tek seçimle renk ve desen takımı.
// Kapak, gövde ve baza renkleri renk kataloğundaki adlı renklerdir (Mat beyaz, Antrasit, Meşe…): CAM parça listesinde malzeme adı bu adla yazılır.
const GORUNUMLER = {
  'Antrasit + beyaz': { renk: { kapak: '#3b3f42', ustKapak: '#eceae4', govde: '#eceae4', tezgah: '#ecebe7', baza: '#3b3f42' }, desen: { kapak: 'duz', ustKapak: 'duz', tezgah: 'mermer' } },
  'Meşe + beyaz': { renk: { kapak: '#b88a5a', ustKapak: '#eceae4', govde: '#eceae4', tezgah: '#f0eeea', baza: '#3b3f42' }, desen: { kapak: 'ahsap', ustKapak: 'duz', tezgah: 'mermer' } },
  'Ceviz + krem': { renk: { kapak: '#6f4a30', ustKapak: '#d8cdbe', govde: '#d8cdbe', tezgah: '#d8d2c6', baza: '#1c1c1c' }, desen: { kapak: 'ahsap', ustKapak: 'duz', tezgah: 'duz' } },
  'Tam beyaz + ahşap tezgah': { renk: { kapak: '#eceae4', ustKapak: '#eceae4', govde: '#eceae4', tezgah: '#b98f62', baza: '#eceae4' }, desen: { kapak: 'duz', ustKapak: 'duz', tezgah: 'ahsap' } },
  'Adaçayı + meşe': { renk: { kapak: '#85a37c', ustKapak: '#b88a5a', govde: '#eceae4', tezgah: '#f1efea', baza: '#3b3f42' }, desen: { kapak: 'duz', ustKapak: 'ahsap', tezgah: 'mermer' } },
};
const EVYELER = { tek: 'Tek gözlü', genis: 'Tek geniş göz', bucuk: 'Bir buçuk gözlü', cift: 'Çift gözlü', damla: 'Damlalıklı (sağda)', damlaSol: 'Damlalıklı (solda)', yuvarlak: 'Yuvarlak' };
const OCAKLAR = { gaz4: 'Gazlı, 4 gözlü', gaz5: 'Gazlı, 5 gözlü (geniş)', cam4: 'Cam / indüksiyon, 4 gözlü', gaz2: 'Domino gazlı, 2 gözlü', cam2: 'Domino cam, 2 gözlü', yok: 'Ocak yok' };
import { KULP_GENEL, KULP_KATALOG, KULP_GRUPLARI, KULP_BICIMLERI, KULP_RENKLERI, kulpAdi, kulpOnizleme } from './kulplar.js';
const KULPLAR = Object.fromEntries(KULP_GENEL.map(k => [k[0], k[1]]));
import * as sahne from './sahne.js';
import { YERLESIMLER, mutfakOlustur } from './sablon.js';
import { teknikSayfa } from './teknik.js';
import { denetle } from './denetim.js';
import { kertmeOlculeri } from './kertme.js';
import { dxf, sketchupBetigi } from './aktar.js';
import { rehberBaslat, rehberGerekirse } from './rehber.js';
import { odaListesi, odaSec, odaEkle, odaSil, odaAdlandir, odaGorunumleri, odaKopyala, modulleriTasi } from './odalar.js';
import { sunumDosyasi } from './sunumdosya.js';
import { cakismalariGider, giderOzeti } from './duzelt.js';
import { akilliPlanla } from './planla.js';
import { kesimSayfa, kesimCsv } from './kesim.js';
import { kesimPlaniSayfa, kesimPlani } from './kesimplan.js';
import { oturt, secenekUygula, bosaOturt, tasimaOnerileri } from './oturt.js';
import { etiketSayfa } from './etiket.js';
import { maliyetSayfa, maliyet, maliyetDegerleri, maliyetCsv, projeHirdavati } from './maliyet.js';
import { TAC_MODELLERI, tacAyari, tacResmi, tacRengi, taclar, tacCizgileri } from './tac.js';
import { FOTO_KALITE, fotoBaslat } from './foto.js';
import { fotoCanli, sahneIzi } from './fotocanli.js';
import { teklifSayfa, teklifGiris } from './teklif.js';
import { AKSESUAR_GENEL, AKSESUAR_GRUPLARI, aksesuarAra, aksesuarKaydi, aksesuarListesi } from './aksesuarlar.js';
import { donanimSecenekleri } from './moduller.js';
import { tl } from './maliyet.js';
import { URETIM_SECENEK, uretimAyari } from './uretim.js';
import { TEZGAH_TEMEL, TEZGAH_MARKALARI, TEZGAH_GRUPLARI, TEZGAH_YUZEYLERI, tezgahListesi, tezgahSecimi, tezgahAdi } from './tezgahkatalog.js';
import { kapakResmi, aksesuarResmi } from './katalogresim.js';
import { kulpResmi } from './kulpresim.js';
import { montajSayfa } from './montaj.js';
import { islemeSayfa, cncPaketi } from './islemefoy.js';
import { camListesiCsv, modulKodListesiCsv, modulKodu } from './adeko.js';
import { islemeKurali, islemeVarsayilanKoy, ISLEME_KURAL } from './isleme.js';
// bu cihazın işleme ölçüleri (yeni projelerin başlangıç ölçüsü)
try { islemeVarsayilanKoy(JSON.parse(localStorage.getItem('kurgu.isleme.v1') || '{}')); } catch { /* depolama kapalı ya da bozuk kayıt: uygulamanın ölçüleri */ }
import { DEKOR_GRUPLARI, dekorAyari } from './dekor.js';
import { RENK_GRUPLARI, renkAra, renkAdi } from './renkler.js';
import { MALZEME_BOLUMLERI, malzemeAra, malzemeMarkalari, malzemeRenkten, malzemeOnizleme } from './malzemeler.js';
import { KAPAK_GRUPLARI, KAPAK_STILLERI, kapakOnizleme, kapakStili, camAyari, CAM_TURLERI, CAM_YUZEYLERI, AL_RENKLERI } from './kapaklar.js';
import { esitKur, esitle, esitPlanla, esitSilindi, esitAyarDegisti, esitDurum, sonrakiTarih } from './esit.js';

const ANAHTAR = 'kurgu.proje.v1';
const $ = s => document.querySelector(s);

let P = yukle() || ornekProje();
let secili = null;            // birincil seçim (özellik paneli bunu gösterir)
let secililer = new Set();    // Shift ile çoklu seçim; guncelle() içinde secili ile tutarlı hale getirilir
let hedefDuvar = 'arka';
let bekleyen = null;   // katalogdan seçilmiş, çizimde tıklanacak yeri bekleyen modül: { anahtar, ad, sablon(), otomatik() }
let oneriDurum = null; // son yerleştirmenin ölçü önerileri: { id, ad, secenekler, aktif, durum, imza }
let tasimaHedef = null; // sürüklenen tek modülün son istenen yeri: { id, x } (bırakınca öneri üretmek için)
let gorunum = { mod: 'gercek', kapakGizle: false, olculer: true, acilis: false };
const gecmis = [], ileri = [];

// ---- Proje ------------------------------------------------------------------------

function bosProje() {
  return {
    surum: 1, id: yeniKimlik(), ad: 'Yeni mutfak',
    oda: { w: 4000, d: 3000, h: 2700 },
    renk: { govde: '#eceae4', kapak: '#3b3f42', ustKapak: '#eceae4', tezgah: '#d9d5cc', baza: '#3b3f42', duvar: '#f4f1ea', zemin: '#c9a77c', arasi: '#e4e8e2' },
    desen: { kapak: 'duz', ustKapak: 'duz', tezgah: 'mermer', zemin: 'parke' },
    ayar: { adaTasma: 250, kulp: 'cubuk', arasi: 1, olcu: OLCU_SURUM, ...(kayitliStandart() ? { std: kayitliStandart() } : {}) },
    moduller: [],
  };
}

function ornekProje() {
  const p = bosProje();
  projeAyarla(p.ayar); // dolaplar yeni projenin standardındaki ölçülerle gelsin
  p.ad = 'Örnek mutfak — L + ada';
  p.oda = { w: 5000, d: 4000, h: 2800 };
  const e = (tip, duvar, x, ek = {}) => p.moduller.push({ ...yeniModul(tip), duvar, x, ...ek });
  e('alt_lkose', 'arka', 0, { w: 1050 });
  e('alt_cekmece', 'arka', 1050);
  e('alt_ocak', 'arka', 1650);
  e('alt_kapak', 'arka', 2550);
  e('alt_kapak', 'arka', 3150, { w: 550, mentese: 'sag' });
  e('boy_firin', 'arka', 3700);
  e('buzdolabi', 'arka', 4300);
  e('ust_buzustu', 'arka', 4300);
  e('ust_lkose', 'arka', 0, { w: 600 });
  e('ust_kapak', 'arka', 600, { mentese: 'sag' });
  e('ust_kapak', 'arka', 1200, { w: 450 });
  e('davlumbaz', 'arka', 1650);
  e('ust_cam', 'arka', 2550);
  e('ust_kapak', 'arka', 3350, { w: 350, mentese: 'sag' });
  e('alt_bulasik', 'sol', 900);
  e('alt_evye', 'sol', 1500);
  e('alt_cekmece', 'sol', 2300);
  e('alt_kavis', 'sol', 2900, { korYon: 'sol' });
  e('ust_acik', 'sol', 2300);
  e('pencere', 'sol', 1000);
  e('kapi', 'sag', 2900);
  for (const x of [1700, 2310, 2920]) e('tabure', 'ada', x, { z: 2400 });
  e('sarkit', 'ada', 2350, { z: 1880, y: p.oda.h - 700 });
  e('alt_kapak', 'ada', 1500, { z: 1750, rot: 2, w: 800, kapak: 2 });
  e('alt_cekmece', 'ada', 2300, { z: 1750, rot: 2 });
  e('alt_kapak', 'ada', 2900, { z: 1750, rot: 2 });
  return p;
}

function yukle() {
  try {
    const p = JSON.parse(localStorage.getItem(ANAHTAR));
    if (!(p && p.surum === 1 && Array.isArray(p.moduller))) return null;
    if (!p.id) p.id = yeniKimlik();
    return p;
  } catch { return null; }
}

// Proje kitaplığı: tarayıcıda saklanan tüm projeler. Açık proje her değişiklikte kitaplıkta da güncellenir.
const KITAPLIK = 'kurgu.kitaplik.v1';
function kitaplikOku() {
  try { const k = JSON.parse(localStorage.getItem(KITAPLIK)); return Array.isArray(k) ? k : []; } catch { return []; }
}
function kitaplikYaz(k) {
  try { localStorage.setItem(KITAPLIK, JSON.stringify(k)); return true; } catch { return false; }
}
function simdiKaydet() {
  clearTimeout(kayitZamani); kayitZamani = null;
  if (ilkBekle) return; // yeni cihaz: ortak depoda proje var mı diye bakılana kadar örnek proje kaydedilmez
  const yeni = JSON.stringify(P);
  try { localStorage.setItem(ANAHTAR, yeni); } catch { /* depolama kapalı olabilir */ }
  const k = kitaplikOku(), i = k.findIndex(e => e.id === P.id);
  // İçerik değişmediyse tarih de değişmez: yalnızca seçim ya da görünüm değişince proje "değişmiş" sayılıp başka cihazlara gönderilmesin
  if (i >= 0 && JSON.stringify(k[i].proje) === yeni) return;
  const kayit = { id: P.id, ad: P.ad, tarih: sonrakiTarih(k[i]?.es), proje: P, ...(i >= 0 && k[i].es ? { es: k[i].es } : {}) };
  if (i >= 0) k[i] = kayit; else k.unshift(kayit);
  kitaplikYaz(k);
  esitPlanla();
}
let kayitZamani = null;
let ilkBekle = false;
try { ilkBekle = !localStorage.getItem(ANAHTAR) && !kitaplikOku().length; } catch { /* depolama kapalı olabilir */ }
const kopyaAl = o => JSON.parse(JSON.stringify(o));

// Ortak projeler: eşitleme bir şey değiştirdiğinde ekran ona uyar
function esitSonra(s) {
  const k = kitaplikOku();
  if (ilkBekle) { // yeni cihazın ilk açılışı: ortak depoda proje varsa örnek yerine en son çalışılan açılır
    ilkBekle = false;
    if (k.length && !gecmis.length) { P = kopyaAl(k.sort((a, b) => b.tarih - a.tarih)[0].proje); secili = null; guncelle(); sahne.kamera('3b'); }
    else kaydet();
  } else if (s.silinen?.has(P.id)) {
    P = k.length ? kopyaAl(k.sort((a, b) => b.tarih - a.tarih)[0].proje) : bosProje();
    gecmis.length = 0; ileri.length = 0; secili = null;
    guncelle(); sahne.kamera('3b');
    bildir('Açık proje başka bir cihazda silindi.');
  } else if (s.degisen?.has(P.id)) {
    const e = k.find(x => x.id === P.id);
    if (e) {
      const oda = P.aktifOda;
      P = kopyaAl(e.proje);
      gecmis.length = 0; ileri.length = 0;
      odaDegistiyse(oda);
      bildir('Proje başka bir cihazda güncellendi.');
    }
  }
  if (s.cakisma?.length) bildir(`“${s.cakisma[0]}” iki cihazda ayrı ayrı değiştirilmiş. İki sürüm de Projeler listesinde duruyor.`, 9000);
  if (s.ayar?.has('modullerim')) katalogCiz();
  if ($('#projeler').open) projelerCiz();
}
let bildirimZamani = null;
function bildir(metin, ms = 4500) {
  let b = $('#bildirim');
  if (!b) { b = document.createElement('div'); b.id = 'bildirim'; b.setAttribute('role', 'status'); b.onclick = () => { b.hidden = true; }; document.body.append(b); }
  b.textContent = metin; b.hidden = false;
  clearTimeout(bildirimZamani); bildirimZamani = setTimeout(() => { b.hidden = true; }, ms);
}
function kaydet() { // sürükleme sırasında her harekette yazmamak için geciktirilir
  if (!kayitZamani) kayitZamani = setTimeout(simdiKaydet, 400);
}
window.addEventListener('pagehide', () => { if (kayitZamani) simdiKaydet(); });

function projeAc(id) {
  const e = kitaplikOku().find(x => x.id === id);
  if (!e) return;
  if (kayitZamani) simdiKaydet();
  P = JSON.parse(JSON.stringify(e.proje));
  gecmis.length = 0; ileri.length = 0; secili = null;
  guncelle(); sahne.kamera('3b');
}
function projeKopyala(id) {
  const k = kitaplikOku(), e = k.find(x => x.id === id);
  if (!e) return;
  const p = JSON.parse(JSON.stringify(e.proje));
  p.id = yeniKimlik(); p.ad = e.ad + ' (kopya)';
  k.unshift({ id: p.id, ad: p.ad, tarih: Date.now(), proje: p });
  kitaplikYaz(k);
  esitPlanla(200);
}
function projeSil(id) {
  if (kayitZamani) simdiKaydet();
  const k = kitaplikOku().filter(x => x.id !== id);
  kitaplikYaz(k);
  esitSilindi(id); // ortak depodan ve öteki cihazlardan da kalkar
  if (id === P.id) { // açık proje silindiyse başka birine geç
    P = k.length ? JSON.parse(JSON.stringify(k[0].proje)) : bosProje();
    gecmis.length = 0; ileri.length = 0; secili = null;
    guncelle(); sahne.kamera('3b');
  }
}
const ESIT_METIN = {
  bagli: 'Projeler ortak: ARTAPP’in çalıştığı bilgisayarda saklanır ve aynı ağdaki bütün cihazlarda aynı liste görünür. Her değişiklik kendiliğinden kaydedilir.',
  yok: 'Ortak depoya şu an ulaşılamıyor. Değişiklikler bu cihazda saklanıyor; bağlantı gelince kendiliğinden eşitlenecek.',
  bilinmiyor: 'Projeler her değişiklikte kendiliğinden kaydedilir.',
  cihaz: 'Projeler yalnızca bu cihazda, bu tarayıcıda saklanır; her değişiklik kendiliğinden kaydedilir. Başka cihaza taşımak ya da yedeklemek için “⋯ › Paylaş” ya da “Dosyaya kaydet”, öbür cihazda “Dosyadan aç” kullanın.',
};
function projelerCiz() {
  if (kayitZamani) simdiKaydet();
  $('#esitDurum').textContent = ESIT_METIN[esitDurum()] + (globalThis.ARTAPP_SURUM ? ` Yayın sürümü: ${globalThis.ARTAPP_SURUM}.` : '');
  $('#esitDurum').dataset.durum = esitDurum();
  const k = kitaplikOku().filter(e => e?.proje?.oda && Array.isArray(e.proje.moduller)).sort((a, b) => b.tarih - a.tarih); // bozuk kayıt listeyi çökertmesin
  $('#projeListe').innerHTML = k.map(e => {
    const n = e.proje.moduller.filter(m => ['alt', 'ust', 'boy'].includes(TANIM[m.tip]?.sinif)).length;
    const ad = String(e.ad).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return `<li class="${e.id === P.id ? 'acik' : ''}"><div><b>${ad}</b>
      <small>${n} modül · ${e.proje.oda.w} × ${e.proje.oda.d} mm · ${new Date(e.tarih).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}${e.id === P.id ? ' · açık' : ''}</small></div>
      <button data-p="ac" data-id="${e.id}"${e.id === P.id ? ' disabled' : ''}>Aç</button>
      <button data-p="kopya" data-id="${e.id}">Kopyala</button>
      <button data-p="sil" data-id="${e.id}" class="tehlike">Sil</button></li>`;
  }).join('') || '<li><small>Kayıtlı proje yok.</small></li>';
}

function gecmiseAt() {
  gecmis.push(JSON.stringify(P));
  if (gecmis.length > 100) gecmis.shift();
  ileri.length = 0;
}
function geriAl() {
  if (!gecmis.length) return;
  ileri.push(JSON.stringify(P));
  const oda = P.aktifOda;
  P = JSON.parse(gecmis.pop());
  odaDegistiyse(oda);
}
function yinele() {
  if (!ileri.length) return;
  gecmis.push(JSON.stringify(P));
  const oda = P.aktifOda;
  P = JSON.parse(ileri.pop());
  odaDegistiyse(oda);
}
// Geri al / yinele başka bir odaya döndürdüyse oda alanları ve kamera da o odaya uyar
function odaDegistiyse(onceki) {
  if (!P.moduller.some(m => m.id === secili)) secili = null;
  const degisti = (onceki || 0) !== (P.aktifOda || 0);
  if (degisti) document.querySelector('#oda').dataset.yenile = '1';
  guncelle();
  if (degisti) sahne.kamera('3b');
}

// Durumu değiştirip her şeyi yenile
function degistir(fn) {
  gecmiseAt();
  fn();
  guncelle();
}

const seciliModul = () => P.moduller.find(m => m.id === secili) || null;

// ---- Modül işlemleri ----------------------------------------------------------------

function modulEkle(tip) {
  let yerYok = false;
  degistir(() => {
    const m = yeniModul(tip);
    m.duvar = TANIM[tip].sinif === 'dekor' ? 'ada' : hedefDuvar; // dekor her zaman serbest yerleşir
    if (m.duvar === 'ada') m.rot = TANIM[tip].sinif === 'dekor' ? 0 : 2;
    if (['sarkit', 'spot', 'plafonyer'].includes(tip)) m.y = P.oda.h - m.h;
    if (tip === 'davlumbaz_ada') { m.duvar = 'ada'; m.rot = 0; m.h = Math.max(300, P.oda.h - m.y); } // tavandan sarkar
    m.kulp = P.ayar.kulp || 'cubuk';
    if (tip === 'kolon' || tip === 'girinti') m.h = P.oda.h;
    yonAyarla(m);
    if (tip === 'kiris') m.y = P.oda.h - m.h;
    if (TANIM[tip].sinif === 'tesisat') { // tesisat hiçbir şeyle çakışmaz; üst üste binmesinler diye duvar boyunca aralıklı konur
      if (m.duvar === 'ada') m.duvar = 'arka';
      const ayni = P.moduller.filter(o => o.duvar === m.duvar && TANIM[o.tip].sinif === 'tesisat').length;
      m.x = Math.min(duvarBoyu(m.duvar, P.oda) - m.w, 300 + ayni * 250);
    } else {
      // dolap: pencere önü, kapı önü ve açılma alanı, kolon ve tavan gözetilerek ilk uygun yere; uygun yer yoksa eski kuralla (uyarıyla) konur
      const yer = bosaOturt(P, m, m.duvar);
      if (yer) secenekUygula(m, yer);
      else { Object.assign(m, bosYerBul(m, P.moduller, P.oda)); yerYok = m.duvar !== 'ada' && ['alt', 'ust', 'boy'].includes(TANIM[tip].sinif); }
    }
    P.moduller.push(m);
    secili = m.id; secililer = new Set([m.id]); // yeni modül tek başına seçilir
  });
  if (yerYok) bildir(`${DUVARLAR[hedefDuvar]} üzerinde bu modüle uygun boş yer yok (pencere, kapı ve kolon gözetildi). Modül yine de kondu: taşıyın ya da ölçüsünü değiştirin.`, 7000);
  document.body.classList.remove('sayfa-tam'); // telefonda panel tam boydaysa yarıya iner: eklenen modül görünsün
}
// ---- Tıklanan yere oturtma: katalogdan seçilen modül, çizimde tıklanan duvara ya da zemine konur (oturt.js) ----
const modulImza = m => JSON.stringify([m.duvar, m.x, m.z, m.rot, m.y, m.w, m.h, m.d]);
// Yeni modülün ölçüleri hazır, yeri belirsiz hali
function modulSablonu(tip) {
  const m = yeniModul(tip);
  m.kulp = P.ayar.kulp || 'cubuk';
  if (['sarkit', 'spot', 'plafonyer'].includes(tip)) m.y = P.oda.h - m.h;
  if (tip === 'davlumbaz_ada') { m.rot = 0; m.h = Math.max(300, P.oda.h - m.y); } // tavandan sarkar
  if (tip === 'kolon' || tip === 'girinti') m.h = P.oda.h;
  if (tip === 'kiris') m.y = P.oda.h - m.h;
  return m;
}
function katalogIsaretle() {
  for (const k of $('#katalog').querySelectorAll('.kart')) {
    const a = k.dataset.tip ? 't:' + k.dataset.tip : 'k:' + (k.querySelector('[data-kayit]')?.dataset.kayit || '');
    k.classList.toggle('bekliyor', !!bekleyen && a === bekleyen.anahtar);
  }
}
function yerSeritCiz() {
  const s = $('#yerSerit');
  s.hidden = !bekleyen;
  if (bekleyen) s.innerHTML = `<span><b>${kacis(bekleyen.ad)}</b> seçildi: koymak istediğiniz duvara ya da zemine tıklayın.</span>
    <span class="yerDugme"><button type="button" data-yer="oto" title="Ekleme yeri olarak seçili duvardaki ilk boş yere koyar (karta ikinci kez tıklamak da aynısını yapar)">Boş yere koy</button><button type="button" data-yer="vazgec" title="Esc">Vazgeç</button></span>`;
}
function yerlestirBitir() { bekleyen = null; sahne.yerIste(null); yerSeritCiz(); katalogIsaretle(); }
function yerlestirBasla(k) {
  if (bekleyen?.anahtar === k.anahtar) { const b = bekleyen; yerlestirBitir(); b.otomatik(); return; } // aynı karta ikinci tıklama: ilk boş yere koyar
  bekleyen = k;
  oneriKapat();
  sahne.yerIste(yerTiklandi, yerOnizle);
  document.body.classList.remove('sayfa-tam'); // telefonda panel tam boydaysa yarıya iner: çizim görünsün
  yerSeritCiz(); katalogIsaretle();
}
// İşaretçi gezerken: modülün oturacağı yer yarı saydam kutuyla gösterilir (yeşil: olduğu gibi, turuncu: ölçü ya da yer değişecek)
function yerOnizle(nokta) {
  if (!bekleyen || !nokta) { sahne.hayalet(null); return; }
  const m = bekleyen.sablon(), r = oturt(P, m, nokta), s = r.secenekler[0];
  if (!s) { sahne.hayalet(null); return; }
  sahne.hayalet(kutu({ ...m, ...s.deg }, P.oda), r.durum ? 0xd9a400 : 0x1f9d55); // sarı: ölçü ya da yer değişecek (turuncu artık vurgu rengi)
}
function yerTiklandi(nokta) {
  if (!bekleyen) return;
  const m = bekleyen.sablon(), r = oturt(P, m, nokta), ad = bekleyen.ad;
  if (!r.secenekler.length) { bildir(r.mesaj || 'Buraya sığmıyor; başka bir yere tıklayın.', 7000); return; } // kip açık kalır
  yerlestirBitir();
  degistir(() => {
    secenekUygula(m, r.secenekler[0].deg);
    if (r.secenekler[0].deg.korYon == null) yonAyarla(m); // köşe ve kavis yönü seçenekte geliyorsa o geçerlidir
    P.moduller.push(m);
    if (m.duvar !== 'ada') hedefDuvar = m.duvar;
    secili = m.id; secililer = new Set([m.id]);
    oneriDurum = r.secenekler.length > 1 || r.durum ? { id: m.id, ad, secenekler: r.secenekler, aktif: 0, durum: r.durum, imza: modulImza(m) } : null;
  });
  oneriCiz();
}
function oneriCiz() {
  const k = $('#oneri'), o = oneriDurum;
  k.hidden = !o;
  if (!o) return;
  k.innerHTML = `<header><b>Ölçü önerileri</b><span>${kacis(o.ad)}</span><button type="button" data-oneri="kapat" aria-label="Önerileri kapat" title="Kapat">×</button></header>`
    + (o.durum ? `<p>${kacis(o.durum)}</p>` : '')
    + o.secenekler.map((s, i) => `<button type="button" class="${i === o.aktif ? 'aktif' : ''}" data-oneri="${i}"${i === o.aktif ? ' aria-pressed="true"' : ''}><b>${kacis(s.ad)}</b>${s.aciklama ? `<small>${kacis(s.aciklama)}</small>` : ''}</button>`).join('')
    + (o.secenekler.length > 1 ? '<small class="not">İşaretli olan geçerli. Ötekine tıklayınca modül o ölçüye ve yere geçer.</small>' : '');
}
function oneriKapat() { oneriDurum = null; const k = $('#oneri'); if (k) k.hidden = true; }
function oneriSec(i) {
  const o = oneriDurum, m = o && P.moduller.find(q => q.id === o.id), s = o?.secenekler[i];
  if (!m || !s) { oneriKapat(); return; }
  degistir(() => { secenekUygula(m, s.deg); if (s.deg.korYon == null) yonAyarla(m); if (m.duvar !== 'ada') hedefDuvar = m.duvar; o.aktif = i; o.imza = modulImza(m); });
  oneriCiz();
}
// Sürükleyip bırakılan dolap için öneri kutusu: hiçbir şey kendiliğinden değişmez, ilk seçenek "olduğu gibi kalsın"dır
function tasimaOner(h) {
  const m = P.moduller.find(o => o.id === h.id);
  if (!m || bekleyen || secililer.size > 1 || secili !== m.id) return;
  const r = tasimaOnerileri(P, m, h.x);
  if (!r) return;
  oneriDurum = { id: m.id, ad: TANIM[m.tip].ad, secenekler: r.secenekler, aktif: 0, durum: r.durum, imza: modulImza(m) };
  oneriCiz();
}
function duvarDoldur() {
  if (hedefDuvar === 'ada') return;
  const yeni = boslukDoldur(hedefDuvar, P, yeniModul);
  if (!yeni.length) { alert(DUVARLAR[hedefDuvar] + ' üzerinde dolap sığacak boş yer yok.'); return; }
  degistir(() => {
    for (const m of yeni) { m.kulp = P.ayar.kulp || 'cubuk'; P.moduller.push(m); }
    cakismalariGider(P, new Set(yeni.map(m => m.id))); // eklenenler kapının açılma alanına ya da eğimli tavana denk gelmesin
    secili = null;
  });
}
// Atölye standartları penceresi
// Depolama anahtarı işlevlerin içinde yazılı: bosProje() modül yüklenirken, bu satırlardan önce çağrılıyor.
const STANDART_ETIKET = {
  govde: 'Gövde levhası', arkalik: 'Arkalık', kapak: 'Kapak', bosluk: 'Kapak boşluğu (her kenarda)',
  baza: 'Baza yüksekliği', altGovde: 'Alt dolap gövde yüksekliği', altDerin: 'Alt ve boy dolap gövde derinliği',
  tezgah: 'Tezgah kalınlığı', tezgahTasma: 'Tezgah taşması (gövdeden öne)', ustKot: 'Üst dolap kotu', ustYuk: 'Üst dolap yüksekliği', ustDerin: 'Üst dolap gövde derinliği',
  ustHat: 'Genel yükseklik (dolap bitişi)', tac: 'Düz MDF taç yüksekliği',
  arkalikKanal: 'Arkalık bağlantısı', kanalArka: 'Kanal: arka kenardan', kanalDerin: 'Kanal derinliği',
};
function kayitliStandart() {
  try { const s = JSON.parse(localStorage.getItem('kurgu.standart.v1')); return s && typeof s === 'object' ? s : null; } catch { return null; }
}
function standartAc(degerler = standartAyarla(P.ayar.std, P.ayar.olcu)) {
  $('#standartAlan').innerHTML = Object.entries(STANDART_ETIKET).map(([ad, etiket]) => ad === 'arkalikKanal'
    ? `<label class="alan"><span>${etiket}</span><select name="${ad}"><option value="1"${degerler[ad] ? ' selected' : ''}>Kanallı (kanala girer)</option><option value="0"${degerler[ad] ? '' : ' selected'}>Çakma (arkadan çakılır)</option></select></label>`
    : `<label class="alan"><span>${etiket}</span><input type="number" name="${ad}" value="${degerler[ad]}" min="${STANDART_SINIR[ad][0]}" max="${STANDART_SINIR[ad][1]}" step="${ad === 'kanalArka' || ad === 'bosluk' ? 0.5 : 1}" required><em>mm</em></label>`).join('');
  if (!$('#standart').open) { firmaAlanDoldur(); $('#standart').showModal(); }
}
function standartUygula(f) {
  const v = Object.fromEntries(new FormData(f)), yeni = {};
  for (const ad of Object.keys(STANDART_ETIKET)) {
    const n = Number(v[ad]), [a, b] = STANDART_SINIR[ad];
    if (!(n >= a && n <= b)) { alert(`${STANDART_ETIKET[ad]} ${a}–${b} mm arasında olmalı.`); return false; }
    yeni[ad] = n;
  }
  const eskiKot = standartAyarla(P.ayar.std, P.ayar.olcu).ustKot;
  degistir(() => {
    P.ayar.std = yeni;
    // standart kotta duran üst dolaplar yeni kota taşınır; elle başka kota konmuş olanlara dokunulmaz
    if (yeni.ustKot !== eskiKot) for (const m of P.moduller) if (TANIM[m.tip].sinif === 'ust' && m.y === eskiKot) m.y = yeni.ustKot;
  });
  firmaKaydet(v);
  if (v.varsayilan) { try { localStorage.setItem('kurgu.standart.v1', JSON.stringify(yeni)); esitAyarDegisti('standart'); } catch { /* depolama kapalı olabilir */ } }
  return true;
}

// Açıkta kalan sıra uçlarına yan panel, duvarla arada kalan dar boşluklara dolgu ekler
function bitisEkle() {
  const yeni = bitisParcalari(P, yeniModul);
  if (!yeni.length) { alert('Eklenecek bitiş parçası bulunamadı: sıra uçları duvara ya da başka bir dolaba dayanıyor.'); return; }
  degistir(() => { P.moduller.push(...yeni); secili = null; });
}

// Genel yükseklik: üst ve boy dolapların üst kenarı tek hatta toplanır, buzdolabının üstü dolapla kapatılır.
// yalniz verilirse yalnızca o buzdolabının üstü işlenir.
function genelHizala(yalniz = null) {
  const hat = Math.min(UST_HAT, P.oda.h - (P.ayar.asmaTavan ? 150 : 0));
  const sonuc = yukseklikHizala(P, yeniModul, hat, yalniz);
  sonuc.eklenen = sonuc.eklenen.filter(m => serbestMi(m, P.moduller, P.oda)); // üstünde başka bir şey varsa eklenmez
  if (!sonuc.degisen.length && !sonuc.eklenen.length) {
    const nerede = ' Genel yüksekliği "Atölye standartları" penceresinden değiştirebilirsiniz.';
    alert((yalniz ? 'Buzdolabının üstüne dolap sığmıyor ya da üstü zaten dolu.' : `Bütün dolaplar zaten ${hat} mm genel yüksekliğinde.`) + nerede);
    return;
  }
  let duzeltme = null;
  degistir(() => {
    hizalamayiUygula(P, sonuc);
    duzeltme = cakismalariGider(P, new Set([...sonuc.degisen.map(d => d.id), ...sonuc.eklenen.map(m => m.id)])); // eğimli tavana taşan olursa kısalt
    if (!yalniz) secili = null;
  });
  if (duzeltme?.toplam) setTimeout(() => alert(giderOzeti(duzeltme)), 30);
}

// Üst ve boy dolapların üstünü tavana kadar tepe dolabıyla kapatır
function tavanaTamamla() {
  const yeni = [];
  for (const m of P.moduller) {
    const t = TANIM[m.tip];
    if (!(t.sinif === 'ust' || t.sinif === 'boy') || m.tip.startsWith('davlumbaz')) continue;
    const ust = m.y + m.h, kalan = P.oda.h - (P.ayar.asmaTavan ? 150 : 0) - ust; // asma tavan varsa onun altına kadar
    if (kalan < 150) continue;
    const lk = m.tip === 'ust_lkose';
    const tepe = { ...(lk ? m : yeniModul('ust_tepe')), id: yeniKimlik(), duvar: m.duvar, x: m.x, z: m.z, rot: m.rot,
      w: m.w, d: lk ? m.d : Math.min(m.d, ALT_DERIN), y: ust, h: kalan, kulp: m.kulp, kapakRenk: m.kapakRenk, govdeRenk: m.govdeRenk };
    if (!lk) { tepe.kapak = m.w >= 700 ? 2 : 1; tepe.mentese = m.mentese; }
    if (serbestMi(tepe, [...P.moduller, ...yeni], P.oda)) yeni.push(tepe);
  }
  if (!yeni.length) { alert('Tavana kadar tamamlanacak dolap bulunamadı.'); return; }
  degistir(() => { P.moduller.push(...yeni); cakismalariGider(P, new Set(yeni.map(m => m.id))); secili = null; });
}

// Uyarı çubuğundaki "Çakışmaları gider": pencere, kapı ve tavanla ilgili bütün çakışmaları düzeltir
const GIDERILIR = new Set(['pencerenin önünde', 'kapının önünde', 'kapının açılma alanında', 'sürgülü kapının kayma alanında', 'eğimli tavana sığmıyor', 'asma tavana sığmıyor', 'tavandan yüksek']);
function hepsiniGider() {
  let s = null;
  degistir(() => { s = cakismalariGider(P); secili = null; });
  setTimeout(() => alert(s.toplam ? giderOzeti(s) : 'Kendiliğinden giderilebilecek çakışma bulunamadı.'), 30);
}

// Yeni proje sihirbazı
function sihirbazAc(odaOlarak = false) {
  const d = $('#sihirbaz');
  d.querySelector('[name=odaOlarak]').checked = odaOlarak;
  d.querySelector('[name=koru]').checked = !odaOlarak;
  d.querySelector('[name=odaAd]').value = '';
  d.querySelector('h2').textContent = odaOlarak ? 'Yeni oda' : 'Yeni mutfak';
  d.querySelector('[name=w]').value = P.oda.w;
  d.querySelector('[name=d]').value = P.oda.d;
  d.querySelector('[name=h]').value = P.oda.h;
  d.showModal();
}
function sihirbazUygula(f) {
  const v = Object.fromEntries(new FormData(f));
  const w = Number(v.w), dd = Number(v.d), h = Number(v.h);
  if (!(w >= 1200 && dd >= 1200 && h >= 2000)) { alert('Oda ölçüleri en az 1200 × 1200 mm, tavan en az 2000 mm olmalı.'); return false; }
  let notlar = [];
  const yerlesimAdi = v.tip === 'bos' ? '' : YERLESIMLER[v.tip].replace(/ \(.*/, '');
  // Sihirbazda girilen yeni pencere ve kapı: duvara sığacak biçimde sınırlanır
  const girilen = [];
  const sinirla = (m, boy) => { m.w = Math.min(m.w, boy); m.x = Math.max(0, Math.min(Math.round(m.x), boy - m.w)); return m; };
  if (v.penDuvar) girilen.push(sinirla({ ...yeniModul('pencere'), duvar: v.penDuvar, x: Number(v.penX) || 0, w: Math.max(300, Number(v.penW) || 1200),
    y: Math.min(Math.max(0, Number(v.penY) || 1000), h - 400), h: Math.min(1200, h - 200 - Math.min(Math.max(0, Number(v.penY) || 1000), h - 400)) }, duvarBoyu(v.penDuvar, { w, d: dd })));
  if (v.kapDuvar) girilen.push(sinirla({ ...yeniModul('kapi'), duvar: v.kapDuvar, x: Number(v.kapX) || 0, h: Math.min(2100, h) }, duvarBoyu(v.kapDuvar, { w, d: dd })));
  const duzenle = hedef => { // dolaplar pencere, kapı ve tavana göre düzenlenir
    const n = akilliPlanla(hedef);
    if (n.length) notlar.push('Odadaki pencere, kapı ve tavana göre düzenlendi:', ...n.slice(0, 9).map(x => '• ' + x), ...(n.length > 9 ? [`… ve ${n.length - 9} değişiklik daha`] : []));
  };
  degistir(() => {
    if (v.odaOlarak) { // açık projeye yeni oda: diğer odalar yerinde kalır
      odaEkle(P, v.odaAd || yerlesimAdi, { w, d: dd, h });
      notlar = mutfakOlustur({ tip: v.tip, ada: !!v.ada }, P);
      P.moduller.push(...girilen);
      if (girilen.length) duzenle(P);
    } else {
      const yeni = bosProje();
      projeAyarla(yeni.ayar); // dolaplar yeni projenin standardındaki ölçülerle gelsin
      yeni.oda = { w, d: dd, h };
      yeni.ad = v.tip === 'bos' ? 'Yeni mutfak' : yerlesimAdi + (v.ada ? ' + ada' : '');
      // Odanın kendisi korunur: kapı, pencere, kolon, kiriş, niş, tesisat noktaları ve tavan ayarları yeni çizime taşınır
      const korunan = v.koru ? P.moduller.filter(m => ['yapi', 'tesisat'].includes(TANIM[m.tip].sinif) && m.duvar !== 'ada'
        && m.x >= 0 && m.x + m.w <= duvarBoyu(m.duvar, yeni.oda) && m.y + m.h <= h).map(m => ({ ...m })) : [];
      if (v.koru) { yeni.ayar.egim = P.ayar.egim ? { ...P.ayar.egim } : null; yeni.ayar.asmaTavan = P.ayar.asmaTavan || 0; }
      notlar = mutfakOlustur({ tip: v.tip, ada: !!v.ada }, yeni);
      yeni.moduller.push(...korunan, ...girilen);
      if (korunan.length || girilen.length || yeni.ayar.egim || yeni.ayar.asmaTavan) duzenle(yeni);
      if (String(v.odaAd || '').trim()) odaAdlandir(yeni, 0, v.odaAd);
      P = yeni;
    }
    secili = null; $('#oda').dataset.yenile = '1';
  });
  sahne.kamera('3b');
  if (notlar.length) setTimeout(() => alert(notlar.join('\n')), 50);
  return true;
}

const seciliModuller = () => P.moduller.filter(m => secililer.has(m.id));

// Köşe ve kavis tarafını duvara göre ayarla: köşe dolabında köşe arka köşede, kavisli dolapta kavis serbest uçta
function yonAyarla(m) {
  if (m.tip.endsWith('_lkose')) m.korYon = m.duvar === 'sol' || m.duvar === 'on' ? 'sag' : 'sol';
  if (m.tip.includes('kavis')) m.korYon = m.duvar === 'sol' ? 'sol' : 'sag';
}

// Çoklu seçimde sürükleme: tutulan modülle aynı yerdeki (aynı duvar ya da ada) seçili modüller birlikte kayar.
// Seçili olmayanlarla çakışacaksa ya da duvardan taşacaksa hareket yapılmaz.
function grupTasi(m, istenen) {
  const grup = seciliModuller().filter(o => o.duvar === m.duvar);
  const ada = m.duvar === 'ada';
  const dx = Math.round(istenen.x - m.x), dz = ada ? Math.round((istenen.z ?? m.z) - m.z) : 0;
  if (!dx && !dz) return;
  const idler = new Set(grup.map(o => o.id));
  const digerleri = P.moduller.filter(o => !idler.has(o.id));
  const dene = (ddx, ddz) => {
    const adaylar = grup.map(o => ({ ...o, x: o.x + ddx, z: (o.z || 0) + ddz }));
    const boy = ada ? 0 : duvarBoyu(m.duvar, P.oda);
    for (const a of adaylar) {
      if (ada) { const k = kutu(a, P.oda); if (k.x0 < 0 || k.z0 < 0 || k.x1 > P.oda.w || k.z1 > P.oda.d) return false; }
      else if (a.x < 0 || a.x + a.w > boy) return false;
      if (!serbestMi(a, digerleri, P.oda)) return false;
    }
    grup.forEach((o, i) => { o.x = adaylar[i].x; if (ada) o.z = adaylar[i].z; });
    return true;
  };
  if (dene(dx, dz) || (ada && (dene(dx, 0) || dene(0, dz)))) guncelle();
}
function modulSil() {
  if (!secili) return;
  degistir(() => { P.moduller = P.moduller.filter(m => !secililer.has(m.id)); secili = null; });
}
function modulCogalt() {
  const liste = seciliModuller();
  if (!liste.length) return;
  degistir(() => {
    const yeni = new Set();
    for (const m of liste) {
      const k = { ...m, id: yeniKimlik() };
      Object.assign(k, bosYerBul(k, P.moduller, P.oda));
      P.moduller.push(k);
      yeni.add(k.id); secili = k.id;
    }
    secililer = yeni;
  });
}
// Pano: kopyalanan modüller. Oda ya da proje değişse de kalır; yapıştırınca açık odada boş yere oturur.
let pano = [];
function modulKopyala() {
  const liste = seciliModuller();
  if (liste.length) pano = liste.map(m => JSON.parse(JSON.stringify(m)));
  return liste.length;
}
function modulYapistir() {
  if (!pano.length) return;
  degistir(() => {
    const yeni = new Set();
    for (const m of pano) {
      const k = { ...JSON.parse(JSON.stringify(m)), id: yeniKimlik() };
      if (k.duvar !== 'ada' && k.x + k.w > duvarBoyu(k.duvar, P.oda)) k.x = 0;
      Object.assign(k, bosYerBul(k, P.moduller, P.oda));
      P.moduller.push(k);
      yeni.add(k.id); secili = k.id;
    }
    secililer = yeni;
  });
}
// Ayna kopya: modülün sağ-sol yönlü her ayarı ters çevrilmiş bir eşi yanındaki boş yere konur
function aynaKopya() {
  const liste = seciliModuller();
  if (!liste.length) return;
  const ters = v => v === 'sol' ? 'sag' : v === 'sag' ? 'sol' : v;
  degistir(() => {
    const yeni = new Set();
    for (const m of liste) {
      const k = { ...JSON.parse(JSON.stringify(m)), id: yeniKimlik(), mentese: ters(m.mentese), korYon: ters(m.korYon) };
      if (Array.isArray(k.bolmeIc)) { const n = (k.bolme || 0) + 1; k.bolmeIc = Array.from({ length: n }, (_, i) => m.bolmeIc[n - 1 - i] ?? null); }
      if (k.evye === 'damla') k.evye = 'damlaSol'; else if (k.evye === 'damlaSol') k.evye = 'damla';
      Object.assign(k, bosYerBul(k, P.moduller, P.oda));
      P.moduller.push(k);
      yeni.add(k.id); secili = k.id;
    }
    secililer = yeni;
  });
}

// İki noktayla ölçü: duvarda iki tıklama arasına ölçü çizgisi eklenir. Noktalar 10 mm'ye ve o duvardaki
// modül kenarlarına (40 mm içinde) yapışır.
let olcuIlk = null;
function olcuModu(acik) {
  olcuIlk = null;
  gosterimKapat(); // telefonda açık seçenekler çizimin üstünü örtmesin
  $('#olcuCiz').classList.toggle('aktif', acik);
  $('#olcuIpucu').hidden = !acik;
  $('#olcuIpucu').textContent = 'Ölçünün başlayacağı noktaya tıklayın';
  sahne.noktaIste(acik ? olcuNoktasi : null);
}
function olcuNoktasi(n) {
  const yapis = (v, kenarlar) => { let en = Math.round(v / 10) * 10, fark = 40; for (const k of kenarlar) if (Math.abs(k - v) < fark) { fark = Math.abs(k - v); en = Math.round(k); } return en; };
  const ayni = P.moduller.filter(m => m.duvar === n.duvar && !['olcu_cizgi', 'not_yazi'].includes(m.tip));
  const nokta = { duvar: n.duvar, a: yapis(n.a, [0, duvarBoyu(n.duvar, P.oda), ...ayni.flatMap(m => [m.x, m.x + m.w])]), y: yapis(n.y, [0, P.oda.h, ...ayni.flatMap(m => [m.y, m.y + m.h])]) };
  if (!olcuIlk) { olcuIlk = nokta; $('#olcuIpucu').textContent = 'Şimdi bitiş noktasına tıklayın (aynı duvarda)'; return; }
  if (nokta.duvar !== olcuIlk.duvar) { $('#olcuIpucu').textContent = 'İki nokta aynı duvarda olmalı; bitiş noktasına yeniden tıklayın'; return; }
  const dx = Math.abs(nokta.a - olcuIlk.a), dy = Math.abs(nokta.y - olcuIlk.y), ilk = olcuIlk;
  if (Math.max(dx, dy) < 10) return;
  olcuModu(false);
  degistir(() => {
    const m = yeniModul('olcu_cizgi');
    m.duvar = nokta.duvar;
    if (dx >= dy) Object.assign(m, { x: Math.min(ilk.a, nokta.a), w: dx, y: Math.max(0, ilk.y - 20), h: 40 });   // yatay: ilk noktanın kotunda
    else Object.assign(m, { x: Math.max(0, ilk.a - 20), w: 40, y: Math.min(ilk.y, nokta.y), h: dy });            // dikey: ilk noktanın hizasında
    P.moduller.push(m);
    secili = m.id; secililer = new Set([m.id]);
  });
}

// Sağ tık menüsü: modülün üstünde modül işlemleri, boş yerde yapıştırma
// kimlik verilirse ekran noktasına bakılmaz (telefondaki seçim çubuğu); yukari: menü noktanın üstüne açılır
function sagMenuAc(e, kimlik, yukari = false) {
  if (vitrinde()) return;
  const id = kimlik === undefined ? sahne.modulKimligi(e) : kimlik, menu = $('#sagMenu');
  if (id && !secililer.has(id)) { secili = id; secililer = new Set([id]); guncelle(); }
  if (!id && !pano.length) { menu.hidden = true; return; }
  const n = id ? secililer.size : 0;
  menu.innerHTML = (id ? `<button data-sm="cogalt">Çoğalt<kbd>Ctrl D</kbd></button><button data-sm="ayna" title="Menteşe ve köşe yönü ters çevrilmiş eşini ekler">Ayna kopya</button>
    <button data-sm="kopyala">Kopyala${n > 1 ? ` (${n})` : ''}<kbd>Ctrl C</kbd></button>` : '')
    + `<button data-sm="yapistir"${pano.length ? '' : ' disabled'}>Yapıştır${pano.length > 1 ? ` (${pano.length})` : ''}<kbd>Ctrl V</kbd></button>`
    + (id ? `<hr><button data-sm="sil" class="tehlike">Sil<kbd>Delete</kbd></button>` : '');
  menu.hidden = false;
  const r = $('#orta').getBoundingClientRect();
  menu.style.left = Math.max(4, Math.min(e.clientX - r.left, r.width - menu.offsetWidth - 4)) + 'px';
  menu.style.top = Math.max(4, Math.min(e.clientY - r.top - (yukari ? menu.offsetHeight : 0), r.height - menu.offsetHeight - 4)) + 'px';
}

function kaydir(dx, dz) {
  const liste = seciliModuller();
  if (!liste.length) return;
  degistir(() => {
    for (const m of liste) Object.assign(m, m.duvar === 'ada' ? { x: m.x + dx, z: m.z + dz } : { x: m.x + (dx || dz) });
  });
}

// ---- Arayüz ----------------------------------------------------------------------------

function guncelle() {
  projeAyarla(P.ayar); // açık projenin atölye standartları ve kapak modeli tüm hesaplarda geçerli olsun
  if (oneriDurum) { // öneriler yalnızca yeni konan modül seçiliyken ve elle değiştirilmemişken geçerlidir
    const om = P.moduller.find(m => m.id === oneriDurum.id);
    if (!om || secili !== om.id || modulImza(om) !== oneriDurum.imza) oneriKapat();
  }
  kaydet();
  // Seçimi tutarlı tut: silinmiş modülleri at, birincil seçim kümede olsun
  const var_ = new Set(P.moduller.map(m => m.id));
  if (!var_.has(secili)) secili = null;
  if (!secili) secililer = new Set();
  else { secililer = new Set([...secililer].filter(id => var_.has(id))); secililer.add(secili); }
  const uy = uyarilar(P);
  const den = denetle(P);
  sahne.ciz(P, { secili, secililer, uyari: new Set(uy.map(u => u.id)), ...gorunum,
    ucgen: gorunum.ucgen && den.ucgen ? { noktalar: den.ucgen, kenarlar: den.kenarlar } : null });
  denetimCiz(den);
  $('#projeAd').value = P.ad;
  $('#dekor').checked = dekorAyari(P).acik;
  $('#geri').disabled = !gecmis.length;
  $('#ileri').disabled = !ileri.length;
  odaSekmeCiz(); bakisCiz(); odaCiz(); duvarCiz(uy); ozellikCiz(uy); ozetCiz();
}

const sayi = (id, etiket, deger, ek = '') =>
  `<label class="alan"><span>${etiket}</span><input type="number" inputmode="numeric" data-a="${id}" value="${Math.round(deger)}" step="${ek.step || 10}" min="${ek.min ?? 0}"><em>mm</em></label>`;
const renk = (id, etiket, deger) =>
  `<label class="alan renk"><span>${etiket}</span><input type="color" data-a="${id}" value="${deger}"></label>`;
const secim = (id, etiket, deger, secenekler) =>
  `<label class="alan"><span>${etiket}</span><select data-a="${id}">${Object.entries(secenekler).map(([k, v]) =>
    `<option value="${k}"${String(k) === String(deger) ? ' selected' : ''}>${v}</option>`).join('')}</select></label>`;

// Kayıtlı modüllerim: kullanıcının ayarlayıp adla sakladığı modüller (tarayıcıda, tüm projelerde ortak)
const MODULLERIM = 'kurgu.modullerim.v1';
function modullerimOku() {
  try { const k = JSON.parse(localStorage.getItem(MODULLERIM)); return Array.isArray(k) ? k.filter(e => TANIM[e.modul?.tip]) : []; } catch { return []; }
}
function modulKaydet() {
  const m = seciliModul();
  if (!m) return;
  const ad = (prompt('Bu modül kütüphanenize hangi adla kaydedilsin?', `${TANIM[m.tip].ad} ${m.w}`) || '').trim();
  if (!ad) return;
  const { id, duvar, x, z, rot, ...ozellik } = m; // konum saklanmaz, yalnızca modülün kendisi
  const k = modullerimOku();
  k.unshift({ id: yeniKimlik(), ad: ad.slice(0, 40), modul: ozellik });
  try { localStorage.setItem(MODULLERIM, JSON.stringify(k)); } catch { alert('Kaydedilemedi: tarayıcı depolaması dolu ya da kapalı.'); return; }
  esitAyarDegisti('modullerim');
  katalogCiz();
}
function kayitliEkle(kayitId) {
  const e = modullerimOku().find(k => k.id === kayitId);
  if (!e) return;
  degistir(() => {
    const m = { ...yeniModul(e.modul.tip), ...JSON.parse(JSON.stringify(e.modul)), id: yeniKimlik() };
    m.duvar = TANIM[m.tip].sinif === 'dekor' ? 'ada' : hedefDuvar;
    if (m.duvar === 'ada') m.rot = TANIM[m.tip].sinif === 'dekor' ? 0 : 2;
    yonAyarla(m);
    const yer = bosaOturt(P, m, m.duvar);
    if (yer) secenekUygula(m, yer); else Object.assign(m, bosYerBul(m, P.moduller, P.oda));
    P.moduller.push(m);
    secili = m.id; secililer = new Set([m.id]);
  });
  document.body.classList.remove('sayfa-tam');
}
function kayitliSil(kayitId) {
  const k = modullerimOku().filter(e => e.id !== kayitId);
  try { localStorage.setItem(MODULLERIM, JSON.stringify(k)); esitAyarDegisti('modullerim'); } catch { /* yok say */ }
  katalogCiz();
}

function katalogCiz() {
  const kac = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const benim = modullerimOku();
  const benimHtml = benim.length ? `<h3>Kayıtlı modüllerim</h3><div class="kartlar">${benim.map(e =>
    `<div class="kart kayitli"><button data-kayit="${e.id}" title="${kac(TANIM[e.modul.tip].ad)} · ${e.modul.w} × ${e.modul.h} × ${e.modul.d} mm">
      <i class="simge s-${TANIM[e.modul.tip].sinif} t-${e.modul.tip}"></i><b>${kac(e.ad)}</b><small>${e.modul.w} mm</small></button>
      <button class="mini" data-kayit-sil="${e.id}" title="Kütüphanemden sil" aria-label="${kac(e.ad)} kaydını sil">×</button></div>`).join('')}</div>` : '';
  const kart = k => `<button class="kart" data-tip="${k.tip}" title="${k.w} × ${k.h} × ${k.d} mm">
    <i class="simge s-${k.sinif} t-${k.tip}"></i><b>${k.ad}</b><small>${k.w} mm</small></button>`;
  // Arama: ad ve grup içinde, büyük-küçük harf ve Türkçe harf farkı gözetmeden
  const sade = s => s.toLocaleLowerCase('tr').replace(/[çğıöşü]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]));
  const aranan = sade($('#katalogAra').value.trim());
  if (aranan) {
    const bulunan = KATALOG.filter(k => sade(k.ad + ' ' + k.grup).includes(aranan));
    $('#katalog').innerHTML = bulunan.length ? `<div class="kartlar">${bulunan.map(kart).join('')}</div>`
      : `<p class="ipucu kisa">“${kac($('#katalogAra').value.trim())}” için modül bulunamadı.</p>`;
    return;
  }
  // Sık kullanılanlar: en çok eklenen altı modül (en az üç farklı modül kullanıldıysa)
  const kullanim = kullanimOku();
  const sik = Object.entries(kullanim).filter(([tip]) => TANIM[tip]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tip]) => TANIM[tip]);
  const sikHtml = sik.length >= 3 ? `<h3>Sık kullandıklarım</h3><div class="kartlar">${sik.map(kart).join('')}</div>` : '';
  const kapali = kapaliGruplar();
  const gruplar = {};
  for (const k of KATALOG) (gruplar[k.grup] ||= []).push(k);
  $('#katalog').innerHTML = benimHtml + sikHtml + Object.entries(gruplar).map(([g, liste]) =>
    `<details data-grup="${g}"${kapali.includes(g) ? '' : ' open'}><summary>${g} <small>${liste.length}</small></summary>
      <div class="kartlar">${liste.map(kart).join('')}</div></details>`).join('');
}

// Kütüphane kullanım sayıları ve kapalı gruplar (tarayıcıda, tüm projelerde ortak)
function kullanimOku() {
  try { const k = JSON.parse(localStorage.getItem('kurgu.kullanim.v1')); return k && typeof k === 'object' ? k : {}; } catch { return {}; }
}
function kullanimArtir(tip) {
  const k = kullanimOku();
  k[tip] = (k[tip] || 0) + 1;
  try { localStorage.setItem('kurgu.kullanim.v1', JSON.stringify(k)); } catch { /* depolama kapalı olabilir */ }
}
function kapaliGruplar() {
  try { const k = JSON.parse(localStorage.getItem('kurgu.kapaliGrup.v1')); return Array.isArray(k) ? k : []; } catch { return []; }
}

const kacis = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const metin = (id, etiket, deger, ipucu = '') =>
  `<label class="alan metin"><span>${etiket}</span><input type="text" data-a="${id}" value="${kacis(deger)}" maxlength="200" placeholder="${ipucu}"></label>`;

// Kayıtlı bakışlar: açık odaya ait, en çok dört tane. Sunum PDF'i görüntüleri bunlardan alır.
function bakisCiz() {
  const b = P.bakislar || [];
  $('#bakisSec').innerHTML = `<option value="">Bakışlar (${b.length})</option>` + b.map((v, i) => `<option value="${i}">${i + 1}. ${String(v.ad).replace(/[&<>"]/g, '')}</option>`).join('')
    + `<option value="+">＋ Bu bakışı kaydet</option>` + (b.length ? `<option value="-">Kayıtlı bakışları sil</option>` : '');
}
function bakisIslemi(v) {
  $('#bakisSec').value = '';
  if (v === '') return;
  const b = P.bakislar || [];
  if (v === '+') {
    const bakis = sahne.bakisAl();
    if (!bakis) { alert('Plan görünüşü kaydedilemez; önce 3B ya da iç görünüşe geçin.'); return; }
    if (b.length >= 4) { alert('En çok dört bakış kaydedilebilir. Önce kayıtlı bakışları silin.'); return; }
    const ad = prompt('Bakışın adı (sunum dosyasında görüntünün altında yazar)', `Görünüm ${b.length + 1}`);
    if (ad === null) return;
    degistir(() => { P.bakislar = [...b, { ad: ad.trim().slice(0, 40) || `Görünüm ${b.length + 1}`, ...bakis }]; });
    return;
  }
  if (v === '-') { if (confirm('Bu odanın kayıtlı bakışları silinsin mi?')) degistir(() => { P.bakislar = []; }); return; }
  sahne.bakisKoy(b[Number(v)]);
}

// Firma bilgisi: sunum dosyasında kullanılır, tarayıcıda saklanır
function firmaOku() {
  try { const f = JSON.parse(localStorage.getItem('kurgu.firma.v1')); return f && typeof f === 'object' ? f : {}; } catch { return {}; }
}
let firmaLogoGecici = null; // pencere açıkken seçilen logo; Uygula denince kaydedilir
function firmaAlanDoldur() {
  const f = firmaOku(), d = $('#standart');
  firmaLogoGecici = f.logo || '';
  d.querySelector('[name=firmaAd]').value = f.ad || '';
  d.querySelector('[name=firmaIletisim]').value = f.iletisim || '';
  $('#firmaLogo').value = '';
  firmaLogoCiz();
}
function firmaLogoCiz() {
  $('#firmaLogoOn').innerHTML = firmaLogoGecici ? `<img src="${firmaLogoGecici}" alt="Logo"><button type="button" class="mini" id="firmaLogoSil">Logoyu kaldır</button>` : '';
}
function firmaKaydet(v) {
  const f = { ad: String(v.firmaAd || '').trim().slice(0, 60), iletisim: String(v.firmaIletisim || '').trim().slice(0, 100), logo: firmaLogoGecici || '' };
  const onceki = JSON.stringify(firmaOku());
  try { localStorage.setItem('kurgu.firma.v1', JSON.stringify(f)); if (JSON.stringify(f) !== onceki) esitAyarDegisti('firma'); } catch { alert('Firma bilgisi kaydedilemedi: tarayıcı deposu dolu olabilir. Daha küçük bir logo deneyin.'); }
}

// Fiyat listesi: birim fiyatlar bütün projelerde ortaktır (tarayıcıda saklanır, ortak depoyla eşitlenir)
function fiyatOku() {
  try { const f = JSON.parse(localStorage.getItem('kurgu.fiyat.v1')); return f && typeof f === 'object' && !Array.isArray(f) ? f : {}; } catch { return {}; }
}
// Kağıt görünümleri (teknik çizim, kesim listesi, kesim planı, maliyet): aynı katmanda gösterilir
let kagit = '';
const KAGIT = { teknik: 'Teknik çizim', kesim: 'Kesim listesi', plan: 'Kesim planı', etiket: 'Parça etiketleri', maliyet: 'Hırdavat ve maliyet', teklif: 'Teklif dosyası', montaj: 'Montaj şablonu', isleme: 'İşleme föyü' };
// Teklif dosyasının kapak görüntüsü: bu projenin son fotoğrafik görüntüsü varsa o, yoksa ekrandaki bakış (gerçekçi, seçimsiz, ölçüsüz)
let teklifGorsel = '', fotoSon = null;
const planEk = new Set(); // kesim planında birlikte planlanan projelerin kimlikleri
function teklifGorselAl(ekrandan = false) {
  const canliVeri = canliResim();
  if (canliVeri) return canliVeri;
  if (!ekrandan && fotoSon && fotoSon.id === P.id) return fotoSon.veri;
  const onceki = { secili, secililer, gorunum: { ...gorunum } };
  let veri = '';
  try {
    secili = null; secililer = new Set();
    Object.assign(gorunum, { mod: 'gercek', olculer: false, acilis: false, ucgen: false, kapakAcik: false, kapakGizle: false });
    guncelle();
    veri = sahne.png(1600, 'image/jpeg');
  } catch (hata) { console.error(hata); }
  secili = onceki.secili; secililer = onceki.secililer;
  for (const a of Object.keys(gorunum)) if (!(a in onceki.gorunum)) delete gorunum[a];
  Object.assign(gorunum, onceki.gorunum);
  guncelle();
  return veri;
}
// Teklif sayfaları A4 dikeydir (210 mm): dar ekranda sayfa ekrana sığacak kadar küçültülür
const teklifOlcek = () => document.documentElement.style.setProperty('--tk-olcek', String(Math.min(1, (window.innerWidth - 16) / 800)));
// Kağıt yeniden kurulur; yazılan kutunun odağı ve kaydırma yeri korunur
function kagitYenidenKur() {
  setTimeout(() => {
    const o = document.activeElement, ic = $('#teknikIcerik');
    const sec = o && ic.contains(o) ? ['fiyat', 'maliyet', 'aks', 'plan'].map(k => o.dataset[k] != null ? `[data-${k}="${CSS.escape(o.dataset[k])}"]` : '').find(Boolean) : '';
    const kay = $('#teknik').scrollTop;
    ic.innerHTML = kagitIcerik();
    $('#teknik').scrollTop = kay;
    if (sec) ic.querySelector(sec)?.focus();
  }, 0);
}
function aksesuarSil(i) {
  degistir(() => { const l = aksesuarListesi(P); l.splice(i, 1); P.aksesuar = l; });
  if (kagit === 'teklif') kagitYenidenKur();
}
function kagitIcerik() {
  if (kagit === 'teklif') { const f = fiyatOku(), t = teklifGiris(P, f) + teklifSayfa(P, f, firmaOku(), teklifGorsel); projeAyarla(P.ayar); return t; }
  // kesim planında birlikte planlanacak projeler (yalnızca bu oturumda; projeye yazılmaz)
  const kitap = kagit === 'plan' ? kitaplikOku().filter(e => e?.id !== P.id && e?.proje?.oda && Array.isArray(e.proje.moduller)) : [];
  for (const id of planEk) if (!kitap.some(e => e.id === id)) planEk.delete(id);
  const h = kagit === 'etiket' ? etiketSayfa(P, firmaOku()) : kagit === 'isleme' ? islemeSayfa(P) : kagit === 'montaj' ? montajSayfa(P) : kagit === 'teknik' ? teknikSayfa(P) : kagit === 'kesim' ? kesimSayfa(P)
    : kagit === 'plan' ? kesimPlaniSayfa(P, kitap.filter(e => planEk.has(e.id)).map(e => e.proje), kitap.map(e => ({ id: e.id, ad: e.ad || e.proje.ad || 'Adsız', secili: planEk.has(e.id) }))) : maliyetSayfa(P, fiyatOku(), firmaOku());
  projeAyarla(P.ayar);
  return h;
}
function kagitAc(tur) {
  if (kayitZamani) simdiKaydet();
  if (tur === 'teklif') { teklifGorsel = teklifGorselAl(); teklifOlcek(); }
  kagit = tur;
  $('#teknikBaslik').textContent = KAGIT[tur];
  $('#kesimCsvIndir').hidden = !(tur === 'kesim' || tur === 'maliyet');
  $('#teknikIcerik').innerHTML = kagitIcerik();
  $('#teknik').hidden = false; $('#teknik').scrollTop = 0;
}
// Maliyet sayfasındaki hesaplanan hücreleri günceller (sayfa yeniden kurulmaz; yazılan kutu odağını korur)
function maliyetYenile() {
  const f = fiyatOku(), d = maliyetDegerleri(maliyet(P, f));
  projeAyarla(P.ayar);
  for (const el of $('#teknikIcerik').querySelectorAll('[data-d]')) {
    const v = d[el.dataset.d];
    if (v === undefined) continue;
    el.textContent = v;
    if (el.dataset.d === 'not') el.hidden = !v;
  }
  for (const el of $('#teknikIcerik').querySelectorAll('[data-w]')) if (d[el.dataset.w] !== undefined) el.style.width = d[el.dataset.w]; // gider dağılımı çubukları
  // aynı fiyat iki satırda olabilir (iki renkte aynı levha): öteki kutu da güncellensin
  for (const el of $('#teknikIcerik').querySelectorAll('[data-fiyat]')) if (el !== document.activeElement) el.value = f[el.dataset.fiyat] || '';
}
function kagitDegisti(e) {
  const el = e.target;
  if (el.dataset.planek) { if (el.checked) planEk.add(el.dataset.planek); else planEk.delete(el.dataset.planek); kagitYenidenKur(); return; }
  if (el.dataset.isleme) { // işleme kuralı: boş bırakılan kutu varsayılana döner
    const ad = el.dataset.isleme;
    degistir(() => { const i = { ...(P.ayar.isleme || {}) }; if (el.value.trim() === '') delete i[ad]; else i[ad] = Number(el.value); P.ayar.isleme = i; });
    kagitYenidenKur(); return;
  }
  if (el.dataset.uretim) { degistir(() => { P.ayar.uretim = { ...(P.ayar.uretim || {}), [el.dataset.uretim]: el.value }; }); kagitYenidenKur(); return; }
  if (el.dataset.plan) {
    const ad = el.dataset.plan;
    if (ad !== 'yon' && el.value.trim() === '') { kagitYenidenKur(); return; } // boş bırakılan kutu eski değerine döner
    degistir(() => { P.ayar = P.ayar || {}; P.ayar.kesim = { ...(P.ayar.kesim || {}), [ad]: ad === 'yon' ? el.value : Number(el.value) }; });
    // odak bir sonraki kutuya geçtikten sonra sayfa yeniden kurulur ve odak aynı kutuya geri verilir
    setTimeout(() => {
      const odak = document.activeElement?.dataset?.plan, kay = $('#teknik').scrollTop;
      $('#teknikIcerik').innerHTML = kagitIcerik();
      $('#teknik').scrollTop = kay;
      if (odak) $('#teknikIcerik').querySelector(`[data-plan="${odak}"]`)?.focus();
    }, 0);
  } else if (el.dataset.fiyat) {
    const f = fiyatOku(), v = Number(el.value);
    if (v > 0) f[el.dataset.fiyat] = Math.round(v * 100) / 100; else delete f[el.dataset.fiyat];
    try { localStorage.setItem('kurgu.fiyat.v1', JSON.stringify(f)); esitAyarDegisti('fiyat'); } catch { /* depolama kapalı olabilir */ }
    if (kagit === 'teklif') kagitYenidenKur(); else maliyetYenile();
  } else if (el.dataset.maliyet) {
    const ad = el.dataset.maliyet, metin = ['teslim', 'not', 'odeme', 'no'].includes(ad);
    degistir(() => { P.ayar = P.ayar || {}; P.ayar.maliyet = { ...(P.ayar.maliyet || {}), [ad]: metin ? el.value.trim() : Math.max(0, Number(el.value) || 0) }; });
    if (kagit === 'teklif') kagitYenidenKur(); else maliyetYenile();
  } else if (el.dataset.aks) { // teklif ayarlarındaki aksesuar satırı: "sıra.alan"
    const [i, alan] = el.dataset.aks.split('.');
    degistir(() => {
      const l = aksesuarListesi(P), x = l[Number(i)];
      if (!x || !['renk', 'adet', 'fiyat'].includes(alan)) return;
      x[alan] = alan === 'renk' ? el.value : alan === 'adet' ? Math.max(1, Math.round(Number(el.value)) || 1) : Math.max(0, Number(el.value) || 0);
      P.aksesuar = l;
    });
    kagitYenidenKur();
  }
}

// Yüksek kalite görüntü: ekrandaki bakış gerçekçi görünümde, seçim ve ölçüler gizlenerek birçok kez çizilir
async function renderAl() {
  if (sahne.renderSuruyor()) return;
  const onceki = { secili, secililer, gorunum: { ...gorunum } };
  const telefon = window.matchMedia('(max-width: 900px), (max-height: 520px)').matches;
  let veri = null;
  try {
    secili = null; secililer = new Set(); gorunum.mod = 'gercek'; gorunum.olculer = false; gorunum.acilis = false; gorunum.ucgen = false;
    guncelle();
    bildir('Yüksek kalite görüntü hazırlanıyor… %0', 60000);
    await new Promise(f => requestAnimationFrame(f));
    veri = await sahne.render({ genislik: telefon ? 1920 : 3840, ornek: telefon ? 24 : 48, ilerleme: o => bildir(`Yüksek kalite görüntü hazırlanıyor… %${Math.round(o * 100)}`, 60000) });
  } catch (hata) { console.error(hata); }
  secili = onceki.secili; secililer = onceki.secililer; Object.assign(gorunum, onceki.gorunum);
  guncelle();
  if (!veri) { bildir('Görüntü alınamadı. "Görsel al" ile deneyin.'); return; }
  indir(await (await fetch(veri)).blob(), dosyaAdi('png').replace(/\.png$/, '-render.png'));
  bildir('Görüntü kaydedildi.');
}

// Fotoğrafik görüntü: ekrandaki bakış ışın izlemeyle çizilir (foto.js). Sahne dökümü gerçekçi görünümde, seçimsiz, ölçüsüz
// ve kapaklar kapalı alınır; döküm alınınca ekran eski haline döner, hesap arka planda sürer.
let fotoIs = null;
function fotoAc() {
  const s = $('#fotoKalite');
  if (!s.options.length) {
    s.innerHTML = FOTO_KALITE.map((k, i) => `<option value="${i}">${k[0]} — ${k[1]} piksel, ${k[2]} örnek</option>`).join('');
    s.value = window.matchMedia('(max-width: 900px), (max-height: 520px)').matches ? '0' : '1';
  }
  $('#fotoIsik').value = gorunum.aksam ? 'aksam' : 'gunduz';
  $('#foto').showModal();
}
function fotoCalistir() {
  if (fotoIs) fotoIs.durdur(false);
  const onceki = { secili, secililer, gorunum: { ...gorunum } };
  let sc = null;
  try {
    secili = null; secililer = new Set();
    Object.assign(gorunum, { mod: 'gercek', olculer: false, acilis: false, ucgen: false, kapakAcik: false, kapakGizle: false, aksam: false });
    guncelle();
    const k = FOTO_KALITE[Number($('#fotoKalite').value)] || FOTO_KALITE[1];
    sc = sahne.fotoSahne({ W: k[1], aksam: $('#fotoIsik').value === 'aksam', spot: $('#fotoSpot').checked });
    if (sc) sc.hedef = k[2];
  } catch (hata) { console.error(hata); }
  secili = onceki.secili; secililer = onceki.secililer;
  for (const a of Object.keys(gorunum)) if (!(a in onceki.gorunum)) delete gorunum[a];
  Object.assign(gorunum, onceki.gorunum);
  guncelle();
  if (!sc) { $('#fotoDurum').textContent = 'Fotoğraf çekilemedi: üstten plan görünüşündeyseniz önce 3B bir bakışa geçin.'; return; }
  const hedef = sc.hedef; delete sc.hedef;
  $('#fotoBaslat').textContent = 'Yeniden başlat'; $('#fotoDurdur').disabled = false; $('#fotoKaydet').disabled = true;
  fotoIs = fotoBaslat(sc, {
    ornek: hedef, tuval: $('#fotoTuval'),
    durum: m => { $('#fotoDurum').textContent = m; },
    bitti: b => {
      $('#fotoDurdur').disabled = true; $('#fotoKaydet').disabled = !b.tamam;
      if (b.tamam) { try { fotoSon = { id: P.id, veri: $('#fotoTuval').toDataURL('image/jpeg', 0.9) }; } catch { /* görüntü alınamadıysa teklif ekran görüntüsünü kullanır */ } }
      $('#fotoDurum').textContent = b.tamam ? `Tamamlandı: ${b.W} × ${b.H} piksel, piksel başına ${b.ornek} örnek, ${b.sure} sn.` : 'Durduruldu: görüntü ilk geçişi bitmeden tamamlanamaz. Yeniden başlatın.';
    },
  });
}

// ---- Foto kipi (canlı fotoğraf): çizim alanındaki bakış, sahne durunca arka planda ışın izlemeyle çizilir ve çizimin
// üstüne konur; kademe kademe netleşir. Kamera oynayınca ya da çizim değişince fotoğraf hemen kalkar, durunca yeniden başlar.
// Seçim gibi görüntüyü değiştirmeyen işlemlerde fotoğraf yerinde kalır (sahne dökümünün parmak izi aynıysa).
let canli = null, canliIz = null, canliGizli = true;
const canliRozet = (metin, oran = -1) => {
  const r = $('#fotoRozet');
  r.hidden = !metin;
  if (!metin) return;
  r.querySelector('span').textContent = metin;
  r.querySelector('i').style.width = oran < 0 ? '0' : Math.round(oran * 100) + '%';
  r.classList.toggle('hazir', oran >= 1);
};
// Ekrandaki bakışın dökümü ve kademeleri: çeyrek, yarım ve tam genişlik (aynı döküm, yalnızca görüntü boyu değişir)
function canliDokum() {
  const c = $('#tuval'), w = c.clientWidth, h = c.clientHeight;
  if (!w || !h) return null;
  const hafif = window.matchMedia('(max-width: 900px), (max-height: 520px)').matches || (navigator.hardwareConcurrency || 4) < 6;
  const WT = Math.max(160, Math.round(Math.min(w, hafif ? 720 : 1280) / 8) * 8);
  const sc = sahne.fotoSahne({ W: WT, H: Math.max(8, Math.round(WT * h / w)), aksam: !!gorunum.aksam, spot: true });
  if (!sc) return null;
  const boy = (W, ornek) => ({ ornek, sc: W === WT ? sc : { ...sc, cam: { ...sc.cam, W, H: Math.max(8, Math.round(W * h / w)), F: sc.cam.F * Math.max(8, Math.round(W * h / w)) / sc.cam.H } } });
  return { iz: sahneIzi(sc), kademeler: [boy(Math.round(WT / 32) * 8, 4), boy(Math.round(WT / 16) * 8, 6), boy(WT, hafif ? 24 : 64)] };
}
function canliGizle() {
  canliGizli = true;
  canli?.durakla();
  $('#fotoCanli').classList.remove('acik');
  $('#fotoIz').innerHTML = '';
  if (gorunum.foto) canliRozet('Foto: durunca çekilir');
}
// Seçili modüllerin sınır kutusu fotoğrafın üstüne çizilir (fotoğraf seçim çizgilerini örttüğü için)
function canliIzCiz() {
  const svg = $('#fotoIz'), c = $('#tuval'), r = c.getBoundingClientRect();
  let h = '';
  if (!canliGizli) for (const id of secililer) {
    const m = P.moduller.find(o => o.id === id);
    if (!m) continue;
    const k = kutu(m, P.oda), n = [];
    for (const x of [k.x0, k.x1]) for (const y of [m.y, m.y + m.h]) for (const z of [k.z0, k.z1]) n.push(sahne.ekranNoktasi(x, y, z));
    if (n.some(q => q.arkada || !Number.isFinite(q.x))) continue;
    for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]])
      h += `<line x1="${(n[a].x - r.left).toFixed(1)}" y1="${(n[a].y - r.top).toFixed(1)}" x2="${(n[b].x - r.left).toFixed(1)}" y2="${(n[b].y - r.top).toFixed(1)}"/>`;
  }
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  svg.innerHTML = h ? `<g class="alt">${h}</g><g>${h}</g>` : '';
}
function canliGoruntu(b) { // yeni görüntü tuvale kondu
  if (!gorunum.foto) return;
  if (canliGizli) { if (canli?.durum()?.durakli) return; canliGizli = false; }
  $('#fotoCanli').classList.add('acik');
  canliIzCiz();
  canliRozet(b.bitti ? 'Fotoğraf hazır' : `Fotoğraf netleşiyor · %${Math.max(1, Math.round(b.oran * 100))}`, b.bitti ? 1 : b.oran);
}
function canliDurgun() { // sahne durdu
  if (!gorunum.foto || !$('#teknik').hidden) return;
  const d = canliDokum();
  if (!d) { canliGizle(); canliRozet('Foto: yalnızca 3B bakışta çalışır'); return; }
  const s = canli?.durum();
  if (s && canliIz === d.iz) { // aynı görüntü: kaldığı yerden sürer
    canli.surdur();
    if (s.gosterilen) { canliGizli = false; $('#fotoCanli').classList.add('acik'); canliIzCiz(); canliRozet(s.tamam ? 'Fotoğraf hazır' : `Fotoğraf netleşiyor · %${Math.max(1, Math.round(s.oran * 100))}`, s.tamam ? 1 : s.oran); }
    return;
  }
  canli = canli || fotoCanli({ tuval: $('#fotoCanli'), goster: canliGoruntu });
  canliIz = d.iz; canliGizli = false;
  $('#fotoCanli').classList.remove('acik'); $('#fotoIz').innerHTML = '';
  if (!canli.cek(d.kademeler)) { canliRozet('Foto: bu tarayıcıda çalışmıyor'); return; }
  canliRozet('Fotoğraf çekiliyor…', 0);
}
function canliCizildi(kameraOynadi) { // çizim alanı yeniden çizildi
  if (!gorunum.foto || canliGizli) return;
  if (kameraOynadi) { canliGizle(); return; }
  const d = canliDokum(); // çizim yeniden kuruldu: görüntü gerçekten değiştiyse fotoğraf kalkar, değişmediyse (seçim) yerinde kalır
  if (!d || d.iz !== canliIz) canliGizle(); else canliIzCiz();
}
function canliKip(acik) {
  gorunum.foto = !!acik;
  try { localStorage.setItem('kurgu.foto.v1', acik ? '1' : '0'); } catch { /* depolama kapalı olabilir */ }
  if (!acik) { canli?.kapat(); canli = null; canliIz = null; canliGizli = true; $('#fotoCanli').classList.remove('acik'); $('#fotoIz').innerHTML = ''; canliRozet(''); }
}
// Ekrandaki canlı fotoğraf (varsa ve görünüyorsa) JPEG olarak; yoksa boş
const canliResim = () => { try { return gorunum.foto && !canliGizli && canli?.durum()?.gosterilen ? $('#fotoCanli').toDataURL('image/jpeg', 0.92) : ''; } catch { return ''; } };

// Müşteri sunum dosyası: her odanın 3B görüntüleri alınır, sonra yazdırılabilir sayfalar kurulur.
// Görüntüler ölçüsüz, kapaklar kapalı, katı görünümde alınır; iş bitince ekran eski haline döner.
function dosyaAc() {
  if (kayitZamani) simdiKaydet();
  const odalar = [];
  try {
    for (const g of odaGorunumleri(P)) {
      const gorseller = [];
      if (g.proje.moduller.length) {
        projeAyarla(g.proje.ayar);
        const ops = { secili: null, secililer: new Set(), uyari: new Set(), mod: 'gercek', kapakGizle: false, kapakAcik: false, olculer: false, acilis: false, aksam: false, ucgen: null };
        sahne.ciz(g.proje, ops);
        // kayıtlı bakış varsa görüntüler onlardan, yoksa genel görünüm ve köşeden iç bakıştan alınır
        const kayitli = (g.proje.bakislar || []).slice(0, 4);
        for (const b of kayitli) { if (sahne.bakisKoy(b)) gorseller.push({ ad: b.ad, veri: sahne.png(1600) }); }
        // en az iki görüntü olsun: eksik kalanlar genel görünüm ve köşeden iç bakışla tamamlanır
        for (const [kam, ad] of [['kose', 'İçeriden bakış'], ['3b', 'Genel görünüm']]) {
          if (gorseller.length >= 2) break;
          sahne.kamera(kam); gorseller[kam === '3b' ? 'unshift' : 'push']({ ad, veri: sahne.png(1600) });
        }
        // lamba ya da tezgah ışığı varsa bir de akşam görüntüsü
        const isikli = g.proje.ayar?.led || g.proje.moduller.some(m => ['sarkit', 'spot', 'plafonyer'].includes(m.tip));
        if (isikli && gorseller.length < 4) {
          sahne.ciz(g.proje, { ...ops, aksam: true });
          if (kayitli.length) sahne.bakisKoy(kayitli[0]); else sahne.kamera('kose');
          gorseller.push({ ad: 'Akşam görünümü', veri: sahne.png(1600) });
        }
      }
      odalar.push({ ad: g.ad, proje: g.proje, gorseller });
    }
  } catch (hata) { console.error(hata); }
  guncelle(); sahne.kamera('3b'); // ekranı açık odaya geri çevir
  kagit = 'dosya';
  $('#kesimCsvIndir').hidden = true;
  $('#teknikBaslik').textContent = 'Sunum dosyası';
  $('#teknikIcerik').innerHTML = sunumDosyasi(P, odalar, firmaOku());
  $('#teknik').hidden = false; $('#teknik').scrollTop = 0;
}

// Oda sekmeleri: projedeki odalar arasında geçiş, ekleme, adlandırma, silme
function odaSekmeCiz() {
  const liste = odaListesi(P);
  $('#odaSekme').innerHTML = `<div class="secici sar">` + liste.map((o, i) =>
    `<button data-oda="${i}" class="${i === P.aktifOda ? 'aktif' : ''}">${String(o.ad).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))}</button>`).join('') + `</div>
    <div class="dugmeler dort"><button data-oda="ekle" title="Projeye yeni bir oda ekler: kiler, banyo, ikinci mutfak…">+ Oda</button>
    <button data-oda="kopya" title="Açık odayı içindekilerle birlikte çoğaltır">Kopyala</button>
    <button data-oda="ad" title="Açık odanın adını değiştirir">Adlandır</button>
    <button data-oda="sil" class="tehlike" ${liste.length < 2 ? 'disabled' : ''} title="Açık odayı içindekilerle birlikte siler">Sil</button></div>`;
}
function odaIslemi(is) {
  const liste = odaListesi(P), i = P.aktifOda;
  if (is === 'ekle') return sihirbazAc(true);
  if (is === 'kopya') {
    degistir(() => { odaKopyala(P, i); secili = null; $('#oda').dataset.yenile = '1'; });
    sahne.kamera('3b');
    return;
  }
  if (is === 'ad') {
    const ad = prompt('Oda adı', liste[i].ad);
    if (ad && ad.trim()) degistir(() => odaAdlandir(P, i, ad));
    return;
  }
  if (is === 'sil') {
    if (liste.length < 2 || !confirm(`"${liste[i].ad}" odası içindeki ${P.moduller.length} öğeyle birlikte silinsin mi?\n(Geri al ile döndürülebilir.)`)) return;
    degistir(() => { odaSil(P, i); secili = null; $('#oda').dataset.yenile = '1'; });
    sahne.kamera('3b');
    return;
  }
  const hedef = Number(is);
  if (!Number.isInteger(hedef) || hedef === i) return;
  degistir(() => { odaSec(P, hedef); secili = null; $('#oda').dataset.yenile = '1'; });
  sahne.kamera('3b');
}

// Seçili modülleri başka odaya taşıma seçimi (birden çok oda varsa görünür)
function odayaTasiHtml() {
  const liste = odaListesi(P);
  if (liste.length < 2) return '';
  const sec = Object.fromEntries(liste.map((o, i) => [i, o.ad]).filter(([i]) => i !== P.aktifOda));
  return `<div class="blok">${secim('odayaTasi', 'Odaya taşı', '', { '': 'Seçin…', ...sec })}</div>`;
}
function odayaTasi(j) {
  const idler = [...secililer], liste = odaListesi(P);
  if (!idler.length || !liste[j]) return;
  let n = 0;
  degistir(() => {
    // hedef odada aynı duvarda ilk boş yere konur; duvar o odada kısa kalıyorsa yine aynı duvarda, uyarıyla kalır
    n = modulleriTasi(P, idler, j, (k, veri) => bosYerBul(k, veri.moduller, veri.oda));
    secili = null;
  });
  if (n) setTimeout(() => alert(`${n} öğe "${liste[j].ad}" odasına taşındı.`), 30);
}

function odaCiz() {
  const aktif = document.activeElement;
  // yazarken yeniden çizme; eğim seçimi alan ekleyip çıkardığı için o durumda yeniden çizilir
  if (aktif && $('#oda').contains(aktif) && !$('#oda').dataset.yenile) return;
  delete $('#oda').dataset.yenile;
  const b = P.bilgi || {};
  $('#oda').innerHTML = `<div class="grup-oda"><h3>Ölçüler</h3>` +
    sayi('oda.w', 'Arka duvar', P.oda.w, { min: 1000 }) + sayi('oda.d', 'Yan duvar', P.oda.d, { min: 1000 }) +
    sayi('oda.h', 'Tavan', P.oda.h, { min: 2000 }) + `<h3>Tavan</h3>` +
    secim('egim.duvar', 'Eğimli tavan', P.ayar.egim?.duvar || '', { '': 'Yok', arka: 'Arka duvara alçalır', sol: 'Sol duvara alçalır', sag: 'Sağ duvara alçalır', on: 'Ön duvara alçalır' }) +
    (P.ayar.egim?.duvar ? sayi('egim.dusuk', 'Duvardaki yük.', P.ayar.egim.dusuk, { min: 300 }) + sayi('egim.mesafe', 'Eğim boyu', P.ayar.egim.mesafe, { min: 200 }) : '') +
    secim('ayar.asmaTavan', 'Asma tavan', P.ayar.asmaTavan ? 1 : 0, { 0: 'Yok', 1: 'Kenarlarda (50 cm, 15 cm düşük)' }) + `<h3>Müşteri</h3>` +
    metin('bilgi.musteri', 'Müşteri', b.musteri, 'Ad soyad ya da firma') + metin('bilgi.adres', 'Adres', b.adres, 'Montaj adresi') +
    metin('bilgi.not', 'Proje notu', b.not, 'Teknik çizimde görünür') + `</div><div class="grup-gorunum">` +
    secim('hazir', 'Hazır görünüm', '', { '': 'Seçin…', ...Object.fromEntries(Object.keys(GORUNUMLER).map(k => [k, k])) }) +
    `<h3>Renkler</h3><div class="renkler">` + renk('renk.kapak', 'Alt kapak', P.renk.kapak) + renk('renk.ustKapak', 'Üst kapak', P.renk.ustKapak) +
    renk('renk.govde', 'Gövde', P.renk.govde) + renk('renk.tezgah', 'Tezgah', P.renk.tezgah) +
    renk('renk.baza', 'Baza', P.renk.baza) + renk('renk.duvar', 'Duvar', P.renk.duvar) + renk('renk.zemin', 'Zemin', P.renk.zemin) +
    renk('renk.arasi', 'Tezgah arası', P.renk.arasi || '#e4e8e2') + (P.ayar.supurgelik ? renk('renk.supurgelik', 'Süpürgelik', P.renk.supurgelik || '#f3f2ee') : '') + `</div><button type="button" class="tam" data-renk-ac="1" title="RAL renkleri, dekor adları ve gerçek dokulu malzemeler (levha ve kapak dekorları, tezgah, zemin, duvar): seçtiğiniz renk ya da malzeme kapak, gövde, tezgah, duvar ya da başka bir yüzeye uygulanır">Renk ve malzeme kataloğu…</button>${malzemeOzeti()}<label class="alan"><span>Tezgah</span><button type="button" class="kapakSec" data-tezgah-ac="1" title="Tezgah kataloğunu açar: temel renkler ve plaka katalogları">${kacis(tezgahAdi(P, { kodlu: false }))}</button></label><h3>Desen ve kaplama</h3>` +
    secim('desen.kapak', 'Alt kapak', P.desen?.kapak || 'duz', DESEN_KAPAK) +
    secim('desen.ustKapak', 'Üst kapak', P.desen?.ustKapak || 'duz', DESEN_KAPAK) +
    secim('desen.tezgah', 'Tezgah', P.desen?.tezgah || 'duz', DESEN_TEZGAH) +
    secim('desen.zemin', 'Zemin', P.desen?.zemin || 'duz', DESEN_ZEMIN) +
    ((P.desen?.zemin || 'duz') !== 'duz' ? secim('desen.zeminYon', 'Döşeme yönü', P.desen?.zeminYon || '0', { 0: 'Yan duvar boyunca', 90: 'Arka duvar boyunca', 45: 'Çapraz' }) : '') +
    secim('desen.duvar', 'Duvar', P.desen?.duvar || 'duz', DESEN_DUVAR) +
    ((P.ayar.arasi ?? 1) ? secim('desen.arasi', 'Arası deseni', P.desen?.arasi || 'duz', DESEN_ARASI) : '') +
    secim('ayar.arasi', 'Tezgah arası', P.ayar.arasi ?? 1, { 1: 'Kaplama var', 0: 'Kaplama yok' }) + `<h3>Kapak modeli</h3>` +
    kapakDugme('kapakModel', 'Alt kapak') + kapakDugme('kapakModelUst', 'Üst kapak') + kapakDugme('kapakModelBoy', 'Boy kapak') +
    secim('ayar.camTur', 'Kapak camı', camAyari(P.ayar).tur, Object.fromEntries(CAM_TURLERI.map(c => [c[0], c[1]]))) +
    secim('ayar.camYuzey', 'Cam yüzeyi', camAyari(P.ayar).yuzey, Object.fromEntries(CAM_YUZEYLERI.map(c => [c[0], c[1]]))) +
    secim('ayar.camAl', 'Alüminyum', camAyari(P.ayar).al, Object.fromEntries(AL_RENKLERI.map(c => [c[0], c[1]]))) + `<h3>Ayrıntılar</h3>` +
    secim('ayar.led', 'Tezgah ışığı', P.ayar.led ? 1 : 0, { 0: 'Yok', 1: 'LED şerit' }) +
    secim('ayar.adaPanel', 'Ada paneli', P.ayar.adaPanel ? 1 : 0, { 0: 'Yok', 1: 'Yan ve arka bitiş paneli' }) +
    secim('ayar.adaBar', 'Ada barı', P.ayar.adaBar ? 1 : 0, { 0: 'Yok', 1: 'Bar yükseltisi (110 cm)' }) +
    secim('ayar.tezgahKenar', 'Tezgah kenarı', P.ayar.tezgahKenar || 'duz', { duz: 'Düz', yuvarlak: 'Yuvarlak', damlalik: 'Damlalıklı (kabartma kenar)' }) +
    secim('ayar.tezgahSup', 'Tezgah süpürgeliği', P.ayar.tezgahSup || 0, { 0: 'Yok', 50: '5 cm', 100: '10 cm' }) +
    secim('ayar.supurgelik', 'Oda süpürgeliği', P.ayar.supurgelik || 0, { 0: 'Yok', 80: '8 cm', 120: '12 cm' }) +
    `<label class="alan"><span>Taç</span><button type="button" class="kapakSec" data-tac-ac="1" title="Taç kataloğunu açar: üst ve boy dolapların üstündeki taç">${P.ayar.kornis ? kacis(tacAyari(P).ad) : 'Yok'}</button></label>` +
    secim('ayar.bant', 'Işık bandı', P.ayar.bant ? 1 : 0, { 0: 'Yok', 1: 'Var' }) +
    `<label class="alan"><span>Tüm kulplar</span><button type="button" class="kapakSec" data-kulp="ayar" title="Kulp kataloğunu açar">${kulpAdi(P.ayar.kulp || 'cubuk')}</button></label></div>`;
}

// ---- Kapak kataloğu: küçük resimli seçim penceresi ----
// hedef: 'kapakModel' (alt kapaklar ve genel), 'kapakModelUst', 'kapakModelBoy' ya da 'modul' (seçili modüller)
const kapakDugme = (alan, etiket) => {
  const kod = P.ayar[alan] || '', ad = kod && KAPAK_MODELLERI[kod] ? KAPAK_MODELLERI[kod] : alan === 'kapakModel' ? KAPAK_MODELLERI.duz : 'Alt kapakla aynı';
  return `<label class="alan"><span>${etiket}</span><button type="button" class="kapakSec" data-kapak="${alan}" title="Kapak kataloğunu açar: ${ad}">${ad}</button></label>`;
};
let kkHedef = 'kapakModel', kkGrup = 'temel';
const kkSecili = () => kkHedef === 'modul' ? (seciliModul()?.kapakModel || '') : (P.ayar[kkHedef] || (kkHedef === 'kapakModel' ? 'duz' : ''));
function kapakKatalogAc(hedef) {
  kkHedef = hedef;
  const secili = kkSecili();
  kkGrup = secili && KAPAK_MODELLERI[secili] ? kapakStili(secili).grup : 'temel';
  $('#kkBaslik').textContent = { kapakModel: 'Alt dolap kapakları. Üst ve boy dolaplara ayrı model seçilmediyse onlara da uygulanır.', kapakModelUst: 'Üst dolap kapakları.',
    kapakModelBoy: 'Boy dolap kapakları.', modul: 'Seçili modülün kapak ve çekmece önleri.' }[hedef];
  kapakKatalogCiz();
  if (!$('#kapakKatalog').open) $('#kapakKatalog').showModal();
}
function kapakKatalogCiz() {
  const secili = kkSecili(), cam = camAyari(P.ayar), m = kkHedef === 'modul' ? seciliModul() : null;
  const renk = m ? (m.kapakRenk || (TANIM[m.tip].sinif === 'ust' ? P.renk.ustKapak : P.renk.kapak)) : kkHedef === 'kapakModelUst' ? P.renk.ustKapak : P.renk.kapak;
  $('#kkGrup').innerHTML = KAPAK_GRUPLARI.map(([k, ad]) => `<button type="button" data-kk-grup="${k}" class="${k === kkGrup ? 'aktif' : ''}">${ad}</button>`).join('');
  const bos = kkHedef === 'kapakModel' ? '' : `<button type="button" class="kkKart${secili ? '' : ' secili'}" data-kk=""><span class="kkBos">—</span><b>${kkHedef === 'modul' ? 'Proje ayarı' : 'Alt kapakla aynı'}</b></button>`;
  $('#kkListe').innerHTML = bos + KAPAK_STILLERI.filter(s => s[2] === kkGrup).map(s =>
    `<button type="button" class="kkKart${s[0] === secili ? ' secili' : ''}" data-kk="${s[0]}" title="${s[1]}">${kapakResmi(s[0]) ? `<img src="${kapakResmi(s[0])}" alt="" loading="lazy">` : kapakOnizleme(s[0], { renk, cam })}<b>${s[1]}</b></button>`).join('');
  const cip = (alan, liste, deger) => `<div class="kkCip">${liste.map(c => `<button type="button" data-kk-cam="${alan}:${c[0]}" class="${c[0] === deger ? 'aktif' : ''}"${alan === 'yuzey' ? ` title="${c[2]}"` : ''}>${alan === 'yuzey' ? '' : `<i style="background:${c[2]}"></i>`}${c[1]}</button>`).join('')}</div>`;
  $('#kkCam').hidden = kkGrup !== 'al' && kkGrup !== 'C';
  $('#kkCam').innerHTML = $('#kkCam').hidden ? '' : `<h3>Cam türü</h3>${cip('tur', CAM_TURLERI, cam.tur)}<h3>Cam yüzeyi</h3>${cip('yuzey', CAM_YUZEYLERI, cam.yuzey)}`
    + (kkGrup === 'al' ? `<h3>Alüminyum çerçeve rengi</h3>${cip('al', AL_RENKLERI, cam.al)}` : '') + `<p class="ipucu kisa">Cam ve çerçeve rengi projedeki bütün camlı kapaklara uygulanır.</p>`;
}
function kapakKatalogTik(e) {
  const g = e.target.closest('[data-kk-grup]'), c = e.target.closest('[data-kk-cam]'), k = e.target.closest('[data-kk]');
  if (g) { kkGrup = g.dataset.kkGrup; kapakKatalogCiz(); return; }
  if (c) { const [alan, deger] = c.dataset.kkCam.split(':'); degistir(() => { P.ayar.cam = { ...camAyari(P.ayar), [alan]: deger }; }); kapakKatalogCiz(); return; }
  if (!k) return;
  const kod = k.dataset.kk;
  degistir(() => {
    if (kkHedef === 'modul') { for (const m of seciliModuller()) { if (kod) m.kapakModel = kod; else delete m.kapakModel; } $('#ozellik').dataset.id = ''; }
    else if (kod) P.ayar[kkHedef] = kod; else if (kkHedef === 'kapakModel') P.ayar.kapakModel = 'duz'; else delete P.ayar[kkHedef];
  });
  $('#kapakKatalog').close();
}

// ---- Taç kataloğu: eB Creator'daki taç modelleri. Seçim projeye yazılır (ayar.kornis: var / yok, ayar.tacModel: model) ----
function tacOnizleme(kod) {
  const c = tacCizgileri(kod), W = 120, H = 40, y = 6, h = 28;
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect x="4" y="${y}" width="${W - 8}" height="${h}" fill="#eceae4" stroke="#8a929b"/>${c.cizgi.map(o => `<line x1="4" x2="${W - 4}" y1="${y + h * o}" y2="${y + h * o}" stroke="#8a929b" stroke-width="0.8"/>`).join('')}</svg>`;
}
function tacKatalogAc() {
  const A = tacAyari(P), tc = taclar(P), duzYuk = tacAyari({ ayar: {} }).yuk;
  $('#tacBaslik').textContent = 'Taç üst ve boy dolapların üstünde döner; bitişik dolaplarda tek parçadır, açıkta kalan uçlara yan dönüş eklenir. Düz MDF taç ön + alt iki parça olarak kesim listesine ve levha hesabına girer; yüksekliği “Atölye standartları”ndan ayarlanır. '
    + 'Lake taçlar hazır alınır, maliyete metreyle girer.' + (A.var && tc.metre ? ` Bu odada taç: ${String(tc.metre).replace('.', ',')} m${tc.donusler.length ? ` (${tc.donusler.length} yan dönüş dahil)` : ''}.` : '');
  $('#tacListe').innerHTML = `<button type="button" class="kkKart${A.var ? '' : ' secili'}" data-tac=""><span class="kkBos">—</span><b>Taç yok</b></button>`
    + TAC_MODELLERI.map(t => `<button type="button" class="kkKart${A.var && A.kod === t[0] ? ' secili' : ''}" data-tac="${t[0]}" title="${t[4]}">${tacResmi(t[0]) ? `<img src="${tacResmi(t[0])}" alt="" loading="lazy">` : tacOnizleme(t[0])}<b>${t[1]} · ${t[2] || duzYuk} mm</b></button>`).join('');
  const secenek = [['', 'Üst kapak rengi', P.renk.ustKapak || P.renk.kapak], ['kapak', 'Alt ve boy kapak rengi', P.renk.kapak]], simdi = P.ayar.tacRenk === 'kapak' ? 'kapak' : '';
  $('#tacRenk').innerHTML = `<h3>Taç rengi</h3><div class="kkCip">${secenek.map(([k, ad, renk]) => `<button type="button" data-tac-renk="${k}" class="${k === simdi ? 'aktif' : ''}"><i style="background:${kacis(renk || tacRengi(P))}"></i>${ad}</button>`).join('')}</div>`;
  if (!$('#tacKatalog').open) $('#tacKatalog').showModal();
}
function tacKatalogTik(e) {
  const c = e.target.closest('[data-tac-renk]');
  if (c) { const v = c.dataset.tacRenk; degistir(() => { if (v) P.ayar.tacRenk = v; else delete P.ayar.tacRenk; }); tacKatalogAc(); return; }
  const k = e.target.closest('[data-tac]');
  if (!k) return;
  const kod = k.dataset.tac;
  degistir(() => { if (kod) { P.ayar.kornis = 1; P.ayar.tacModel = kod; } else P.ayar.kornis = 0; });
  $('#tacKatalog').close();
}

// ---- Kulp kataloğu: genel modeller ve katalog (biçime göre süzülür). hedef: 'ayar' (bütün kulplar) ya da 'modul' (seçili modüller) ----
let kuHedef = 'ayar', kuGrup = 'Temel', kuBicim = '';
const kuSecili = () => kuHedef === 'modul' ? (seciliModul()?.kulp || 'cubuk') : (P.ayar.kulp || 'cubuk');
function kulpKatalogAc(hedef) {
  kuHedef = hedef; kuBicim = '';
  const k = KULP_KATALOG.find(e => e[0] === kuSecili());
  kuGrup = k ? k[3] : 'Temel';
  $('#kuBaslik').textContent = hedef === 'modul' ? 'Seçili modülün kulpu.' : 'Projedeki bütün kulplar. Modüllere ayrı kulp seçildiyse onlar da değişir.';
  kulpKatalogCiz();
  if (!$('#kulpKatalog').open) $('#kulpKatalog').showModal();
}
function kulpKatalogCiz() {
  const secili = kuSecili(), renk = P.renk.kulp || '#8a8f96';
  $('#kuGrup').innerHTML = ['Temel', ...KULP_GRUPLARI].map(g => `<button type="button" data-ku-grup="${g}" class="${g === kuGrup ? 'aktif' : ''}">${g === 'Temel' ? 'Temel modeller' : g}</button>`).join('');
  const liste = kuGrup === 'Temel' ? KULP_GENEL.map(k => [k[0], k[2], k[3], 'Temel', k[1], '']) : KULP_KATALOG.filter(k => k[3] === kuGrup);
  const bicimler = [...new Set(liste.map(k => k[1]))].filter(b => KULP_BICIMLERI[b]);
  if (kuBicim && !bicimler.includes(kuBicim)) kuBicim = '';
  $('#kuBicim').innerHTML = kuGrup === 'Temel' ? '' : [['', 'Hepsi'], ...bicimler.map(b => [b, KULP_BICIMLERI[b]])].map(([b, ad]) => `<button type="button" data-ku-bicim="${b}" class="${b === kuBicim ? 'aktif' : ''}">${ad}</button>`).join('');
  $('#kuListe').innerHTML = liste.filter(k => !kuBicim || k[1] === kuBicim).map(k =>
    `<button type="button" class="kkKart${k[0] === secili ? ' secili' : ''}" data-ku="${k[0]}">${kulpResmi(k[0]) ? `<img src="${kulpResmi(k[0])}" alt="" loading="lazy" width="70" height="70">` : kulpOnizleme(k[0], renk)}<b>${kulpAdi(k[0])}</b></button>`).join(''); // katalog satırında resim, temel modellerde çizim
  // "Kendi rengi": her kulp katalogdaki kendi kaplamasıyla çizilir (kulpmodel.js); bir renk seçilirse bütün kulplar o renge döner
  $('#kuRenk').innerHTML = `<button type="button" data-ku-renk="" class="${P.renk.kulp ? '' : 'aktif'}" title="Her kulp katalogdaki kendi kaplamasıyla çizilir"><i style="background:linear-gradient(135deg,#D2D5D8 0 34%,#8E6E3E 34% 67%,#1A1A1C 67%)"></i>Kendi rengi</button>` + KULP_RENKLERI.map(r => `<button type="button" data-ku-renk="${r[2]}" class="${r[2].toLowerCase() === String(P.renk.kulp || '').toLowerCase() ? 'aktif' : ''}"><i style="background:${r[2]}"></i>${r[1]}</button>`).join('');
}
function kulpKatalogTik(e) {
  const g = e.target.closest('[data-ku-grup]'), b = e.target.closest('[data-ku-bicim]'), r = e.target.closest('[data-ku-renk]'), k = e.target.closest('[data-ku]');
  if (g) { kuGrup = g.dataset.kuGrup; kuBicim = ''; kulpKatalogCiz(); return; }
  if (b) { kuBicim = b.dataset.kuBicim; kulpKatalogCiz(); return; }
  if (r) { degistir(() => { P.renk.kulp = r.dataset.kuRenk; }); kulpKatalogCiz(); return; }
  if (!k) return;
  const kod = k.dataset.ku;
  degistir(() => {
    if (kuHedef === 'modul') for (const m of seciliModuller()) m.kulp = kod;
    else { P.ayar.kulp = kod; for (const m of P.moduller) m.kulp = kod; }
    $('#ozellik').dataset.id = '';
  });
  $('#kulpKatalog').close();
}

// ---- Sahne dekoru: eşyalar odanın düzenine göre kendiliğinden yerleşir (dekor.js); burada yalnızca açılıp kapatılır ve ayarlanır ----
function dekorDegistir(alan, deger) {
  degistir(() => { P.ayar.dekor = { ...dekorAyari(P), [alan]: deger }; });
  dekorPencereCiz();
}
function dekorPencereCiz() {
  const a = dekorAyari(P);
  $('#dkAcik').checked = a.acik;
  $('#dkGrup').innerHTML = DEKOR_GRUPLARI.map(([k, ad, acik]) => `<label class="onay duz" title="${acik}"><input type="checkbox" data-dk="${k}"${a[k] ? ' checked' : ''}> <span><b>${ad}</b><small>${acik}</small></span></label>`).join('');
  $('#dkYogunluk').innerHTML = [[1, 'Az'], [2, 'Orta'], [3, 'Çok']].map(([k, ad]) => `<button type="button" data-dk-yogunluk="${k}" class="${a.yogunluk === k ? 'aktif' : ''}">${ad}</button>`).join('');
}
function dekorPencereAc() { dekorPencereCiz(); if (!$('#dekorAyar').open) $('#dekorAyar').showModal(); }

// ---- Renk kataloğu: temel renkler, RAL ve levha dekorları. Önce hangi yüzeye uygulanacağı seçilir, sonra renk ----
const RENK_HEDEFLERI = [['kapak', 'Alt kapak'], ['ustKapak', 'Üst kapak'], ['govde', 'Gövde'], ['baza', 'Baza'], ['arasi', 'Tezgah arası'], ['duvar', 'Duvar'], ['zemin', 'Zemin'], ['tezgah', 'Tezgah']];
// Seçili dolap(lar)a özel hedefler: renk ya da malzeme yalnızca o dolabın kapağına ya da gövdesine uygulanır (dolabın "özel renk" alanı)
const MODUL_HEDEFLERI = [['m:kapakRenk', 'Seçili dolap: kapak'], ['m:govdeRenk', 'Seçili dolap: gövde']];
// Katalog: renkler (temel, RAL, dekor adları; yaklaşık ton) ve gerçek malzemeler (rkGrup 'M:bölüm'; doku resimleriyle).
// Gerçek malzeme seçilince yüzeyin rengi malzemenin imza rengi olur; çizim dokuyu o renkten tanır (malzemeler.js).
let rkHedef = 'kapak', rkGrup = 'RAL', rkYazi = '', rkMarka = '', rkSinir = 240;
const rkSeciliModuller = () => P.moduller.filter(m => (secililer.has(m.id) || m.id === secili) && ['alt', 'ust', 'boy'].includes(TANIM[m.tip]?.sinif));
const rkHedefler = () => { const ms = rkSeciliModuller(); return ms.length ? [...RENK_HEDEFLERI, ...MODUL_HEDEFLERI.filter(([k]) => ms.some(m => alanlar(m)[k.slice(2)]))] : RENK_HEDEFLERI; };
const rkHedefRengi = h => String((h.startsWith('m:') ? rkSeciliModuller().find(m => m[h.slice(2)])?.[h.slice(2)] : P.renk[h]) || '').toLowerCase();
const rkSwatch = (renk, md) => { const on = malzemeOnizleme(md); return `background:${renk || '#fff'}${on ? ` url(${on}) center/cover` : ''}`; };
function renkKatalogAc() {
  rkYazi = ''; $('#rkAra').value = ''; rkSinir = 240;
  if (!rkHedefler().some(h => h[0] === rkHedef)) rkHedef = 'kapak';
  const md = malzemeRenkten(rkHedefRengi(rkHedef)); // yüzeyde gerçek malzeme varsa katalog onun bölümünde ve markasında açılır
  if (md) { rkGrup = 'M:' + md.bolum; rkMarka = md.marka; }
  renkKatalogCiz();
  if (!$('#renkKatalog').open) $('#renkKatalog').showModal();
}
// liste false ise kartlar yeniden kurulmaz, yalnızca seçim işareti ve üstteki yazılar güncellenir (seçince liste zıplamasın)
function renkKatalogCiz(liste = true) {
  const hedefler = rkHedefler();
  if (!hedefler.some(h => h[0] === rkHedef)) rkHedef = 'kapak';
  const simdiki = rkHedefRengi(rkHedef), bolum = rkGrup.startsWith('M:') ? rkGrup.slice(2) : '';
  $('#rkHedef').innerHTML = hedefler.map(([k, ad]) => { const r = rkHedefRengi(k); return `<button type="button" data-rk-hedef="${k}" class="${k === rkHedef ? 'aktif' : ''}"><i style="${rkSwatch(r, malzemeRenkten(r))}"></i>${ad}</button>`; }).join('');
  $('#rkGrup').innerHTML = [...RENK_GRUPLARI, ...MALZEME_BOLUMLERI.map(([k, ad]) => ['M:' + k, ad + ' · gerçek'])]
    .map(([k, ad]) => `<button type="button" data-rk-grup="${k}" class="${k === rkGrup ? 'aktif' : ''}">${ad}</button>`).join('');
  $('#rkMarka').hidden = !bolum;
  for (const k of ['#rkHedef', '#rkGrup']) $(k).querySelector('.aktif')?.scrollIntoView({ block: 'nearest', inline: 'center' }); // telefonda yana kayan satırda seçili düğme görünsün
  $('#rkAra').placeholder = bolum ? 'Malzeme adı ya da kodu ara (ör. ceviz, H1113, 8301)' : 'Renk adı ya da numarası ara (ör. 7016, ceviz)';
  if (!liste) $('#rkListe').querySelectorAll('[data-rk]').forEach(b => b.classList.toggle('secili', b.dataset.rk === simdiki));
  else if (bolum) {
    const markalar = malzemeMarkalari(bolum);
    if (rkMarka && !markalar.some(m => m[0] === rkMarka)) rkMarka = '';
    $('#rkMarka').innerHTML = `<option value="">Bütün markalar (${markalar.reduce((t, m) => t + m[1], 0)})</option>` + markalar.map(([m, n]) => `<option value="${kacis(m)}"${m === rkMarka ? ' selected' : ''}>${kacis(m)} (${n})</option>`).join('');
    const hepsi = malzemeAra(bolum, rkMarka, rkYazi), kalan = Math.max(0, hepsi.length - rkSinir);
    $('#rkListe').innerHTML = (hepsi.slice(0, rkSinir).map(m => { const on = malzemeOnizleme(m);
      return `<button type="button" class="rkRenk rkMalz${m.renk === simdiki ? ' secili' : ''}" data-rk="${m.renk}" title="${kacis(m.ad + ' · ' + m.marka)}"><i style="background:${m.renk}">${on ? `<img loading="lazy" decoding="async" src="${on}" alt="">` : ''}</i><span>${kacis(m.ad)}</span></button>`; }).join('')
      + (kalan ? `<button type="button" class="rkDaha" data-rk-daha="1">Daha fazla göster (${kalan} malzeme daha)</button>` : '')) || '<p class="ipucu">Bu adla malzeme bulunamadı.</p>';
  } else {
    const renkler = renkAra(rkYazi.trim() ? '' : rkGrup, rkYazi);
    $('#rkListe').innerHTML = renkler.map(r => `<button type="button" class="rkRenk${r[2] === simdiki ? ' secili' : ''}" data-rk="${r[2]}" title="${kacis(r[1])}"><i style="background:${r[2]}"></i><span>${kacis(r[1].replace(/^(Panel|MDF|Sunta) /, ''))}</span></button>`).join('') || '<p class="ipucu">Bu adla renk bulunamadı.</p>';
  }
  const ad = hedefler.find(h => h[0] === rkHedef)[1], md = malzemeRenkten(simdiki);
  $('#rkDurum').textContent = md
    ? `${ad}: ${md.ad} · ${md.marka}. ${md.dokulu ? `Gerçek doku; çizimde ${md.en} × ${md.boy} mm ölçüsünde yinelenir.` : 'Düz renk.'}`
    : `${ad}: ${renkAdi(simdiki) || simdiki || 'seçilmedi'}. Ekrandaki ton yaklaşıktır; kesin renk için kartelaya bakın.`;
}
function renkKatalogTik(e) {
  const h = e.target.closest('[data-rk-hedef]'), g = e.target.closest('[data-rk-grup]'), r = e.target.closest('[data-rk]');
  if (h) { rkHedef = h.dataset.rkHedef; renkKatalogCiz(false); return; }
  if (g) { rkGrup = g.dataset.rkGrup; rkYazi = ''; $('#rkAra').value = ''; rkSinir = 240; renkKatalogCiz(); $('#rkListe').scrollTop = 0; return; }
  if (e.target.closest('[data-rk-daha]')) { rkSinir += 480; renkKatalogCiz(); return; }
  if (!r) return;
  const renk = r.dataset.rk;
  degistir(() => {
    if (rkHedef.startsWith('m:')) { const alan = rkHedef.slice(2); for (const m of rkSeciliModuller()) if (alanlar(m)[alan]) m[alan] = renk; $('#ozellik').dataset.id = ''; }
    else { P.renk[rkHedef] = renk; if (rkHedef === 'tezgah') delete P.ayar.tezgahSec; }
    $('#oda').dataset.yenile = '1';
  });
  renkKatalogCiz(false);
}
// Görünüm panelinde: gerçek malzeme atanmış yüzeylerin kısa özeti (ad ve önizleme)
function malzemeOzeti() {
  const s = RENK_HEDEFLERI.map(([k, ad]) => [ad, malzemeRenkten(P.renk[k])]).filter(e => e[1]);
  return s.length ? `<p class="malzOzet">${s.map(([ad, m]) => `<span title="${kacis(m.ad + ' · ' + m.marka)}"><i style="${rkSwatch(m.renk, m)}"></i><b>${ad}</b> ${kacis(m.ad)}</span>`).join('')}</p>` : '';
}

// ---- Tezgah kataloğu: temel renkler ve iki üreticinin plakaları. Plaka seçilince yüzey ve kalınlık aynı pencerede seçilir ----
let tzMarka = 'temel', tzGrup = '';
function tezgahKatalogAc() {
  const s = tezgahSecimi(P);
  tzMarka = s ? s.marka : 'temel'; tzGrup = s ? s.grup : '';
  tezgahKatalogCiz();
  if (!$('#tezgahKatalog').open) $('#tezgahKatalog').showModal();
}
function tezgahKatalogCiz() {
  const s = tezgahSecimi(P), renk = String(P.renk.tezgah || '').toLowerCase(), desen = P.desen?.tezgah || 'duz';
  $('#tzMarka').innerHTML = [['temel', 'Temel renkler'], ...Object.entries(TEZGAH_MARKALARI)].map(([k, ad]) => `<button type="button" data-tz-marka="${k}" class="${k === tzMarka ? 'aktif' : ''}">${ad}${k === 'temel' ? '' : ` (${tezgahListesi(k).length})`}</button>`).join('');
  const gruplar = TEZGAH_GRUPLARI[tzMarka] || [];
  if (tzGrup && !gruplar.some(g => g[0] === tzGrup)) tzGrup = '';
  $('#tzGrup').innerHTML = gruplar.length ? [['', 'Hepsi'], ...gruplar].map(([k, ad]) => `<button type="button" data-tz-grup="${k}" class="${k === tzGrup ? 'aktif' : ''}">${ad}</button>`).join('') : '';
  $('#tzListe').innerHTML = tzMarka === 'temel'
    ? TEZGAH_TEMEL.map(t => `<button type="button" class="kkKart${!s && t[1] === renk && t[2] === desen ? ' secili' : ''}" data-tz-temel="${t[1]}|${t[2]}"><i class="tzRenk" style="background:${t[1]}"></i><b>${t[0]}</b></button>`).join('')
    : tezgahListesi(tzMarka, tzGrup).map(t => `<button type="button" class="kkKart${s?.id === t.id ? ' secili' : ''}" data-tz="${t.id}" title="${t.ad}">${t.resim ? `<img src="${t.resim}" alt="" loading="lazy">` : `<i class="tzRenk" style="background:${t.renk}"></i>`}<b>${t.ad}</b></button>`).join('');
  const cip = (alan, liste, deger) => `<div class="kkCip">${liste.map(([k, ad]) => `<button type="button" data-tz-ayar="${alan}:${k}" class="${k === deger ? 'aktif' : ''}">${ad}</button>`).join('')}</div>`;
  $('#tzSecim').innerHTML = s ? `<div class="tzSecili">${s.resim ? `<img src="${s.resim}" alt="">` : ''}<div><b>${TEZGAH_MARKALARI[s.marka]} · ${s.ad}</b><span>${(TEZGAH_GRUPLARI[s.marka].find(g => g[0] === s.grup) || ['', ''])[1]}${s.kod ? ` · ürün kodu ${s.kod}` : ''}${s.not ? ' · ' + s.not : ''}</span></div></div>
    <h3>Yüzey</h3>${cip('yuzey', Object.keys(s.yuzeyler).map(y => [y, TEZGAH_YUZEYLERI[y] || y]), s.yuzey)}<h3>Kalınlık</h3>${cip('kalinlik', Object.keys(s.yuzeyler[s.yuzey]).map(k => [k, k + ' mm']), s.kalinlik)}
    <p class="ipucu kisa">Plakanın resmi 3B çizimde ve fotoğrafta tezgahın dokusu olur. Kalınlık yalnızca teklife ve ürün koduna yansır; çizimdeki tezgah kalınlığı “Atölye standartları”ndan gelir.</p>`
    : '<p class="ipucu kisa">Temel renklerden birini seçin ya da bir kataloğa geçip plaka seçin. Renk ve deseni “Görünüm” sekmesinden elle de ayarlayabilirsiniz.</p>';
}
function tezgahKatalogTik(e) {
  const m = e.target.closest('[data-tz-marka]'), g = e.target.closest('[data-tz-grup]'), t = e.target.closest('[data-tz-temel]'), k = e.target.closest('[data-tz]'), a = e.target.closest('[data-tz-ayar]');
  if (m) { tzMarka = m.dataset.tzMarka; tzGrup = ''; tezgahKatalogCiz(); return; }
  if (g) { tzGrup = g.dataset.tzGrup; tezgahKatalogCiz(); return; }
  if (!t && !k && !a) return;
  degistir(() => {
    if (t) { const [renk, desen] = t.dataset.tzTemel.split('|'); P.renk.tezgah = renk; P.desen = { ...(P.desen || {}), tezgah: desen }; delete P.ayar.tezgahSec; }
    else if (k) { const b = tezgahListesi(tzMarka).find(x => x.id === k.dataset.tz); if (b) { P.ayar.tezgahSec = { id: b.id }; P.renk.tezgah = b.renk.toLowerCase(); P.desen = { ...(P.desen || {}), tezgah: 'duz' }; } }
    else { const [alan, deger] = a.dataset.tzAyar.split(':'); P.ayar.tezgahSec = { ...(P.ayar.tezgahSec || {}), [alan]: deger }; }
    $('#oda').dataset.yenile = '1';
  });
  tezgahKatalogCiz();
}

// ---- Aksesuar kataloğu: projeye aksesuar ekler. hedef 'modul' ise ürün seçili dolaba takılır: dolabın iç donanımı olur,
// "kapaklar açık" gösterimde açılışı görünür ----
let akHedef = 'proje', akGrup = '', akYazi = '';
function aksKatalogAc(hedef) {
  akHedef = hedef === 'modul' && seciliModul() ? 'modul' : 'proje';
  akGrup = ''; akYazi = ''; $('#akAra').value = '';
  const m = akHedef === 'modul' ? seciliModul() : null;
  $('#akBaslik').textContent = m ? `Seçili dolap: ${TANIM[m.tip].ad}. Yalnızca bu dolaba takılabilen ürünler listelenir. Eklediğiniz ürün dolabın iç donanımı olur; “kapaklar açık” gösterimde açılışı görünür, teklifte kodu ve fiyatıyla yer alır.`
    : 'Eklediğiniz ürünler teklif dosyasında adet ve fiyatla yer alır. Fiyatlar katalogdaki liste fiyatıdır: güncelliğini denetleyin, gerekirse teklif ayarlarında değiştirin.';
  aksKatalogCiz();
  if (!$('#aksKatalog').open) $('#aksKatalog').showModal();
}
function aksKatalogCiz() {
  const m = akHedef === 'modul' ? seciliModul() : null, uygun = m ? Object.keys(donanimSecenekleri(m.tip) || {}) : null;
  const gruplar = uygun ? [] : ['', ...AKSESUAR_GRUPLARI, 'Genel'];
  $('#akGrup').hidden = !gruplar.length;
  $('#akGrup').innerHTML = gruplar.map(g => `<button type="button" data-ak-grup="${g}" class="${g === akGrup ? 'aktif' : ''}">${g || 'Tümü'}</button>`).join('');
  $('#akAra').hidden = akGrup === 'Genel';
  let h;
  if (akGrup === 'Genel') h = AKSESUAR_GENEL.map(a => `<div class="akSatir"><div><b>${a[1]}</b><span>Kodsuz; fiyatını teklif ayarlarında girersiniz</span></div><em></em><button type="button" class="mini" data-ak-ekle="${a[0]}|0">Ekle</button></div>`).join('');
  else h = aksesuarAra(akGrup, akYazi).filter(a => !uygun || uygun.includes(a[4])).map(a => {
    const f = a[5].map(k => k[4]).filter(Boolean), en = Math.min(...f), cok = Math.max(...f);
    const resim = aksesuarResmi(a[0]);
    return `<details class="akUrun${resim ? ' resimli' : ''}"><summary>${resim ? `<img src="${resim}" alt="" loading="lazy">` : ''}<b>${a[2]}</b><span>${a[1]} · ${a[5].length} ölçü · ${a[3].join(', ')}${f.length ? ` · ${tl(en)}${cok > en ? ' – ' + tl(cok) : ''}` : ''}</span></summary>${resim ? `<img class="akBuyuk" src="${resim}" alt="${a[2]}" loading="lazy">` : ''}` + a[5].map((k, i) =>
      `<div class="akSatir"><div><b>${k[0]}</b>${k[1] ? ' · ' + k[1] : ''}<span>${k[2] ? k[2] + ' mm' : ''}${k[3] ? ` · ${k[3] / 10} cm modül` : ''}</span></div><em>${k[4] ? tl(k[4]) : '—'}</em><button type="button" class="mini" data-ak-ekle="${a[0]}|${i}">Ekle</button></div>`).join('') + '</details>';
  }).join('') || '<p class="ipucu">Uygun ürün bulunamadı.</p>';
  $('#akListe').innerHTML = h;
  const secili = aksesuarListesi(P);
  $('#akSecili').innerHTML = secili.length ? secili.map((x, i) => `<div class="akSatir${aksesuarResmi(x.g) ? ' resimli' : ''}">${aksesuarResmi(x.g) ? `<img src="${aksesuarResmi(x.g)}" alt="" loading="lazy">` : ''}<div><b>${kacis(x.ad)}</b><span>${kacis([x.kod, x.renk, x.modul && P.moduller.some(o => o.id === x.modul) ? 'dolaba takılı' : ''].filter(Boolean).join(' · '))}</span></div><em>${x.adet} adet${x.fiyat ? ' × ' + tl(x.fiyat) : ''}</em><button type="button" class="mini" data-ak-sil="${i}" title="Projeden çıkar">×</button></div>`).join('')
    : '<p class="ipucu">Henüz aksesuar eklenmedi.</p>';
}
function aksKatalogTik(e) {
  const g = e.target.closest('[data-ak-grup]'), ek = e.target.closest('[data-ak-ekle]'), sil = e.target.closest('[data-ak-sil]');
  if (g) { akGrup = g.dataset.akGrup; aksKatalogCiz(); return; }
  if (sil) { aksesuarSil(Number(sil.dataset.akSil)); aksKatalogCiz(); return; }
  if (!ek) return;
  const [kimlik, sira] = ek.dataset.akEkle.split('|'), kayit = aksesuarKaydi(kimlik, Number(sira));
  if (!kayit) return;
  const m = akHedef === 'modul' ? seciliModul() : null;
  degistir(() => {
    const liste = aksesuarListesi(P);
    if (m && kayit.hareket && donanimSecenekleri(m.tip)?.[kayit.hareket]) { // dolabın önceki katalog donanımı çıkar, yenisi takılır
      m.donanim = kayit.hareket;
      P.aksesuar = [...liste.filter(x => x.modul !== m.id), { ...kayit, modul: m.id }];
      $('#ozellik').dataset.id = '';
    } else {
      const ayni = liste.find(x => x.g === kayit.g && x.kod === kayit.kod && !x.modul);
      if (ayni) ayni.adet++; else liste.push(kayit);
      P.aksesuar = liste;
    }
  });
  aksKatalogCiz();
  if (kagit === 'teklif') kagitYenidenKur();
}

// ---- Komut paleti (Ctrl + K): her düğme, görünüm, oda ve modül adıyla aranıp çalıştırılır ----
const sadeYazi = s => String(s).toLocaleLowerCase('tr').replace(/[çğıöşü]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]));
let paletSonuc = [], paletSecili = 0;
function paletKomutlari() {
  const dugme = (id, ad, ek = '') => ({ tur: 'Komut', ad, ek, calistir: () => $('#' + id).click() });
  const tikla = (sec, tur, ad, ek = '') => ({ tur, ad, ek, calistir: () => document.querySelector(sec)?.click() });
  const duvarAdi = DUVARLAR[hedefDuvar].replace(' (serbest)', '');
  return [
    dugme('yeni', 'Yeni mutfak ya da oda', 'sihirbaz'), dugme('projelerAc', 'Projeler', 'kayıtlı projeleri aç'), dugme('kesimAc', 'Kesim listesi', 'parça ölçüleri, levha, kenar bandı'), dugme('planAc', 'Kesim planı', 'levhaya yerleşim, levha sayısı, fire'), dugme('etiketAc', 'Parça etiketleri', '70 × 70 mm, her parçaya bir etiket'),
    dugme('maliyetAc', 'Hırdavat ve maliyet', 'hırdavat, fiyat, kâr, KDV'), dugme('teklifAc', 'Teklif dosyası', 'müşteri teklifi, metre fiyatı, PDF'), dugme('aksAc', 'Aksesuar kataloğu', 'kiler, çöp kovası, sepet, köşe mekanizması'), dugme('tezgahAc', 'Tezgah kataloğu', 'mermer, taş, kuvars, plaka'), dugme('montajAc', 'Montaj şablonu', 'patlatılmış görünüş, parça ve hırdavat listesi'), dugme('islemeAc', 'İşleme föyü', 'delik, menteşe yuvası, kulp deliği, gola kertmesi'), dugme('dekorAc', 'Sahne dekoru', 'bitki, halı, tablo, tezgah üstü eşya, vitrin ışığı'), dugme('fotoAc', 'Fotoğrafik görüntü', 'ışın izleme, render, fotoğraf'), dugme('renderAc', 'Yüksek kalite görüntü', 'hızlı, yumuşak gölge'),
    dugme('teknikAc', 'Teknik çizim', 'plan, görünüş, liste'), dugme('dosyaAc', 'Sunum PDF', 'müşteri dosyası'), dugme('gorsel', 'Görsel al', 'resim kaydet'),
    dugme('aktarAc', 'Dışa aktar', 'DXF, AutoCAD, SketchUp'), dugme('sunumAc', 'Sunum modu', 'tam ekran, döner'), dugme('vitrinAc', 'Müşteri gösterimi', 'çizim kilitli; renk, kapak, akşam, fotoğraf'),
    dugme('indir', 'Dosyaya kaydet', 'proje dosyası indir'), dugme('ac', 'Dosyadan aç', 'proje dosyası yükle'), dugme('paylas', 'Paylaş', 'proje dosyasını WhatsApp ya da e-postayla gönder'), dugme('ornek', 'Örnek mutfak'),
    dugme('standartAc', 'Atölye standartları ve firma bilgisi', 'levha, baza, logo'), dugme('temaDegis', 'Arayüz teması ve düzeni', 'grafit, gece, kum, lacivert, klasik mavi; yeni ya da klasik düzen'), dugme('yardimAc', 'Yardım ve kısayollar'),
    dugme('geri', 'Geri al', 'Ctrl Z'), dugme('ileri', 'Yinele', 'Ctrl Y'),
    dugme('doldur', 'Boş yerleri doldur', duvarAdi), dugme('bitis', 'Bitiş parçalarını ekle'), dugme('spotDiz', 'Tavana spot diz'),
    dugme('genelHiza', 'Genel yüksekliğe hizala'), dugme('tavan', 'Dolapları tavana tamamla'), dugme('olcuCiz', 'Ölçü çiz', 'iki nokta'),
    ...(document.querySelector('#uyarilar [data-gider]') ? [tikla('#uyarilar [data-gider]', 'Komut', 'Çakışmaları gider')] : []),
    ...[['gercek', 'Gerçekçi'], ['kati', 'Çizgili'], ['seffaf', 'Şeffaf'], ['tel', 'Tel kafes']].map(([k, ad]) => tikla(`[data-mod=${k}]`, 'Görünüm', ad + ' görünüm')),
    ...[['3b', '3B genel bakış', '1'], ['ic', 'İçeriden bakış', '2'], ['on', 'Önden bakış', '3'], ['sol', 'Yandan bakış', '4'], ['ust', 'Plan (üstten)', '5']].map(([k, ad, ek]) => tikla(`[data-kam="${k}"]`, 'Bakış', ad, ek)),
    ...[['kapakGizle', 'Kapakları gizle / göster'], ['kapakAcik', 'Kapakları aç / kapat'], ['olculer', 'Ölçüleri göster / gizle'], ['acilis', 'Açılış yönünü göster / gizle'], ['aksam', 'Akşam görünümü']].map(([id, ad]) => ({ ...dugme(id, ad), tur: 'Görünüm' })),
    ...[['modul', 'Modüller sekmesi'], ['oda', 'Oda sekmesi', 'ölçü, tavan, müşteri'], ['gorunum', 'Görünüm sekmesi', 'renk, desen, kaplama']].map(([k, ad, ek]) => ({ tur: 'Panel', ad, ek: ek || '', calistir: () => solSekme(k) })),
    ...odaListesi(P).map((o, i) => ({ tur: 'Oda', ad: o.ad, ek: i === P.aktifOda ? 'açık' : 'odaya geç', calistir: () => odaIslemi(String(i)) })),
    ...Object.keys(DUVARLAR).map(d => ({ tur: 'Yer', ad: 'Ekleme yeri: ' + DUVARLAR[d], ek: '', calistir: () => { hedefDuvar = d; duvarCiz(uyarilar(P)); } })),
    ...KATALOG.map(k => ({ tur: 'Modül', ad: k.ad, ek: `${k.grup} · ${duvarAdi}`, calistir: () => modulEkle(k.tip) })),
  ];
}
function paletCiz() {
  const aranan = sadeYazi($('#paletAra').value.trim()).split(/\s+/).filter(Boolean);
  const hepsi = paletKomutlari();
  paletSonuc = (aranan.length ? hepsi.filter(k => { const m = sadeYazi(k.ad + ' ' + k.ek + ' ' + k.tur); return aranan.every(a => m.includes(a)); }) : hepsi.filter(k => k.tur !== 'Modül' && k.tur !== 'Yer')).slice(0, 60);
  paletSecili = Math.min(paletSecili, Math.max(0, paletSonuc.length - 1));
  const kac = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('#paletListe').innerHTML = paletSonuc.length ? paletSonuc.map((k, i) =>
    `<li role="option" data-i="${i}" class="${i === paletSecili ? 'secili' : ''}"><i>${k.tur}</i><b>${kac(k.ad)}</b><small>${kac(k.ek)}</small></li>`).join('')
    : `<li class="bos">“${kac($('#paletAra').value.trim())}” için sonuç yok</li>`;
  $('#paletListe .secili')?.scrollIntoView({ block: 'nearest' });
}
function paletAc() {
  if ($('#palet').open) return;
  $('#paletAra').value = ''; paletSecili = 0;
  $('#palet').showModal();
  paletCiz();
  $('#paletAra').focus();
}
function paletCalistir(i) {
  const k = paletSonuc[i];
  if (!k) return;
  $('#palet').close();
  k.calistir();
}
function solSekme(ad) { sayfaAc(ad); }
// ---- Telefon ve dar ekran: alt gezinme çubuğu panelleri çizimin altında açar ----
// ad: 'cizim' (paneller kapalı) | 'modul' | 'oda' | 'gorunum' | 'ozellik'
function sayfaAc(ad) {
  const b = document.body.classList;
  if (ad === 'cizim') b.remove('acik-sol', 'acik-sag', 'sayfa-tam');
  else if (ad === 'ozellik') { b.add('acik-sag'); b.remove('acik-sol'); }
  else { $('#sol').dataset.sekme = ad; b.add('acik-sol'); b.remove('acik-sag'); }
  gezinmeCiz();
}
function acikSayfa() {
  const b = document.body.classList;
  return b.contains('acik-sag') ? 'ozellik' : b.contains('acik-sol') ? $('#sol').dataset.sekme : 'cizim';
}
function gezinmeCiz() {
  const acik = acikSayfa();
  document.querySelectorAll('#altGezinme [data-sayfa]').forEach(d => { if (d.dataset.sayfa === acik) d.setAttribute('aria-current', 'page'); else d.removeAttribute('aria-current'); });
}
function gosterimKapat() { $('.ust-arac').classList.remove('acik'); $('#gosterimAc').setAttribute('aria-expanded', 'false'); }
// ---- Müşteri gösterimi (kod adı: vitrin) ----
// Çizim kilitlenir: seçim, taşıma, silme, ekleme yoktur. Bakış çevrilir; Görünüm panelinden renk, desen ve kapak modeli değiştirilir;
// kapaklar açılır, akşam ışığı ve fotoğraf kipi açılıp kapanır. Çıkınca ölçü ve görünüm ayarları girişteki haline döner.
// Renk ve kapak değişiklikleri projeye işlenir (çıkınca Geri al ile geri alınabilir).
let vitrinOnce = null;
const vitrinde = () => document.body.classList.contains('vitrin');
function vitrinCiz() {
  const durum = { acik: !!gorunum.kapakAcik, aksam: !!gorunum.aksam, foto: !!gorunum.foto };
  document.querySelectorAll('[data-vt]').forEach(d => { if (d.dataset.vt in durum) d.setAttribute('aria-pressed', String(durum[d.dataset.vt])); });
}
function vitrinAyarla(acik) {
  if (acik === vitrinde()) return;
  const esitle = (sec, deger) => { if ($(sec).checked !== !!deger) $(sec).click(); };
  if (acik) {
    if (bekleyen) yerlestirBitir();
    if ($('#olcuCiz').classList.contains('aktif')) olcuModu(false);
    gosterimKapat(); $('#sagMenu').hidden = true;
    vitrinOnce = { olculer: !!gorunum.olculer, acilis: !!gorunum.acilis, kapakGizle: !!gorunum.kapakGizle, kapakAcik: !!gorunum.kapakAcik, aksam: !!gorunum.aksam, mod: gorunum.foto ? 'foto' : gorunum.mod, sekme: $('#sol').dataset.sekme };
    if (!gorunum.foto && gorunum.mod !== 'gercek') $('#modSec [data-mod=gercek]').click();
    esitle('#olculer', false); esitle('#acilis', false); esitle('#kapakGizle', false);
    secili = null; secililer = new Set();
    document.body.classList.add('vitrin');
    sahne.saltOku(true);
    $('#sol').dataset.sekme = 'gorunum';
    sayfaAc('cizim');
    bildir('Müşteri gösterimi: çizim kilitli. Görüntüyü çevirebilir, renk ve kapak modelini değiştirebilirsiniz.', 6000);
  } else {
    document.body.classList.remove('vitrin');
    sahne.saltOku(false);
    const o = vitrinOnce || {}; vitrinOnce = null;
    esitle('#olculer', o.olculer); esitle('#acilis', o.acilis); esitle('#kapakGizle', o.kapakGizle); esitle('#kapakAcik', o.kapakAcik); esitle('#aksam', o.aksam);
    if (o.mod && o.mod !== (gorunum.foto ? 'foto' : gorunum.mod)) $(`#modSec [data-mod=${o.mod}]`).click();
    $('#sol').dataset.sekme = o.sekme || 'modul';
    sayfaAc('cizim');
  }
  vitrinCiz(); guncelle();
}
// Panel tutamağı: sürükleyince yükseklik değişir (çok aşağı: kapanır, çok yukarı: tam boy); dokununca yarım / tam boy
function tutamakKur(t) {
  let bas = null;
  t.addEventListener('pointerdown', e => {
    bas = { y: e.clientY, h: t.closest('aside').getBoundingClientRect().height, oynadi: false };
    try { t.setPointerCapture(e.pointerId); } catch { /* yakalama olmadan da çalışır */ }
  });
  t.addEventListener('pointermove', e => {
    if (!bas) return;
    const dy = e.clientY - bas.y;
    if (!bas.oynadi && Math.abs(dy) < 6) return;
    bas.oynadi = true;
    document.body.classList.remove('sayfa-tam');
    document.body.style.setProperty('--sayfa-h', Math.max(60, bas.h - dy) + 'px');
  });
  const bitir = e => {
    if (!bas) return;
    const b = bas; bas = null;
    if (!b.oynadi) { if (e.type === 'pointerup') document.body.classList.toggle('sayfa-tam'); return; }
    const oran = (b.h - (e.clientY - b.y)) / ($('main').clientHeight || 1);
    document.body.style.removeProperty('--sayfa-h');
    if (oran < 0.26) sayfaAc('cizim');
    else if (oran > 0.8) document.body.classList.add('sayfa-tam');
    else document.body.style.setProperty('--sayfa-h', Math.round(Math.min(74, Math.max(32, oran * 100))) + '%');
  };
  t.addEventListener('pointerup', bitir);
  t.addEventListener('pointercancel', bitir);
}
// Arayüz temaları: renkler stil.css içindeki değişken takımlarıdır; seçim bu cihazda saklanır (kurgu.tema.v1).
// [kod, ad, açıklama, panel, zemin, yazı, vurgu]: son dört renk yalnızca penceredeki önizleme kartı içindir. 'grafit' varsayılandır (data-tema yok).
const TEMALAR = [
  ['grafit', 'Grafit', 'Açık gri yüzeyler, turuncu vurgu; logoyla aynı renkler', '#ffffff', '#eef0f2', '#1a1d22', '#d9480f'],
  ['gece', 'Gece', 'Koyu grafit, turuncu vurgu; loş ortam ve uzun çalışma için', '#17191e', '#0f1114', '#eceef1', '#ff8a4c'],
  ['kum', 'Kum', 'Sıcak krem yüzeyler, bakır vurgu; mağaza ve sunum havası', '#fffdf9', '#f1ece4', '#2a241d', '#b4532a'],
  ['lacivert', 'Lacivert', 'Koyu lacivert, altın vurgu', '#121a30', '#0b1020', '#edf0f7', '#e3b453'],
  ['mavi', 'Klasik mavi', 'Önceki açık tema: beyaz yüzeyler, mavi vurgu', '#ffffff', '#f2f3f5', '#141a21', '#2f5bea'],
];
const temaOku = () => { const t = document.documentElement.dataset.tema; return TEMALAR.some(k => k[0] === t) ? t : 'grafit'; };
function temaAyarla(kod) {
  const t = TEMALAR.find(k => k[0] === kod) || TEMALAR[0];
  if (t[0] === 'grafit') delete document.documentElement.dataset.tema; else document.documentElement.dataset.tema = t[0];
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t[3]); // telefonda tarayıcı çubuğunun rengi
  try { localStorage.setItem('kurgu.tema.v1', t[0]); } catch { /* depolama kapalı olabilir */ }
  temaSahneyeYansit();
  temaPencereCiz();
}
// Arayüz düzeni: 'yeni' (varsayılan; css/duzen.css) ya da 'klasik' (2026-11-23 öncesi görünüm). Seçim cihazda saklanır.
const duzenOku = () => document.documentElement.dataset.duzen === 'klasik' ? 'klasik' : 'yeni';
function duzenAyarla(kod) {
  if (kod === 'klasik') document.documentElement.dataset.duzen = 'klasik'; else delete document.documentElement.dataset.duzen;
  try { localStorage.setItem('kurgu.duzen.v1', kod === 'klasik' ? 'klasik' : 'yeni'); } catch { /* depolama kapalı olabilir */ }
  window.dispatchEvent(new Event('resize')); // çizim alanının ölçüsü değişir
  temaPencereCiz();
}
// 3B çizimde seçili modülün çerçevesi temanın vurgu rengini alır
function temaSahneyeYansit() {
  try { sahne.vurguRengi(getComputedStyle(document.documentElement).getPropertyValue('--vurgu').trim() || '#d9480f'); guncelle(); } catch { /* sahne henüz kurulmadıysa sonra yansır */ }
}
function temaPencereCiz() {
  const secili = temaOku(), l = $('#temaListe');
  if (!l) return;
  l.innerHTML = TEMALAR.map(([kod, ad, aciklama, panel, zemin, yazi, vurgu]) => `<button type="button" class="temaKart${kod === secili ? ' secili' : ''}" data-tema-sec="${kod}"${kod === secili ? ' aria-pressed="true"' : ''}>
      <span class="temaOn" style="background:${zemin}" aria-hidden="true"><span><i style="background:${yazi};opacity:.75;width:60%"></i><i style="background:${panel}"></i><i style="background:${vurgu}"></i></span><span style="background:${panel};border:1px solid ${vurgu}"></span></span>
      <b>${ad}${kod === 'grafit' ? ' (varsayılan)' : ''}</b><small>${aciklama}</small></button>`).join('');
  const d = duzenOku();
  if ($('#duzenListe')) $('#duzenListe').innerHTML = [['yeni', 'Yeni düzen'], ['klasik', 'Klasik düzen']].map(([kod, ad]) =>
    `<button type="button" data-duzen-sec="${kod}" class="${kod === d ? 'aktif' : ''}"${kod === d ? ' aria-pressed="true"' : ''}>${ad}</button>`).join('');
}

function duvarCiz(uy) {
  $('#duvarSec').innerHTML = Object.entries(DUVARLAR).map(([k, v]) =>
    `<button data-duvar="${k}" class="${k === hedefDuvar ? 'aktif' : ''}">${v.replace(' duvar', '').replace(' (serbest)', '')}</button>`).join('');
  $('#doldur').disabled = hedefDuvar === 'ada';
  $('#doldur').textContent = hedefDuvar === 'ada' ? 'Boş yerleri doldur' : `${DUVARLAR[hedefDuvar]}ın boş yerlerini doldur`.replace('duvarın', 'duvarın');
  // Duvar doluluk çubukları (alt sıra)
  $('#doluluk').innerHTML = DUVAR_LISTE.map(d => {
    const boy = duvarBoyu(d, P.oda);
    const dolu = P.moduller.filter(m => m.duvar === d && m.y === 0).reduce((t, m) => t + m.w, 0);
    if (!dolu) return '';
    const tasan = dolu > boy;
    return `<div class="dol${tasan ? ' tasan' : ''}"><span>${DUVARLAR[d]}</span>
      <div class="cubuk"><i style="width:${Math.min(100, dolu / boy * 100)}%"></i></div>
      <em>${dolu} / ${boy} mm · ${tasan ? 'taşma ' + (dolu - boy) : 'boş ' + (boy - dolu)}</em></div>`;
  }).join('');
  const kutuUy = $('#uyarilar');
  kutuUy.innerHTML = uy.length ? uy.map(u => {
    const m = P.moduller.find(o => o.id === u.id);
    return `<button data-sec="${u.id}">⚠ ${TANIM[m.tip].ad} ${u.mesaj}</button>`;
  }).join('') + (uy.some(u => GIDERILIR.has(u.mesaj) && ['alt', 'ust', 'boy', 'dekor'].includes(TANIM[P.moduller.find(o => o.id === u.id)?.tip]?.sinif)) ? `<button data-gider="1" class="ana" title="Pencerenin ya da kapının önündeki ve tavana sığmayan dolapları daraltır, kısaltır, boş yere taşır; yer yoksa kaldırır">Çakışmaları gider</button>` : '') : '';
  kutuUy.hidden = !uy.length;
}

function ozellikCiz(uy) {
  const kap = $('#ozellik');
  const m = seciliModul();
  document.body.classList.toggle('secili-var', !!m);
  $('#secimCubugu').hidden = !m;
  if (m) $('#secimAd').textContent = secililer.size > 1 ? `${secililer.size} öğe` : `${TANIM[m.tip].ad} · ${m.w}`;
  if (!m) {
    kap.dataset.id = '';
    kap.innerHTML = `<p class="ipucu">Bir modüle tıklayıp özelliklerini değiştirin, sürükleyerek taşıyın.<br><br>
      Yeni modül için soldan modüle, sonra çizimde koymak istediğiniz duvara ya da zemine tıklayın.</p>`;
    return;
  }
  if (secililer.size > 1) { // toplu düzenleme
    kap.dataset.id = 'toplu';
    const liste = seciliModuller();
    const ortak = (alan) => { const v = new Set(liste.map(o => o[alan])); return v.size === 1 ? [...v][0] : ''; };
    kap.innerHTML = `<h2>${liste.length} öğe seçili</h2>
      <p class="ipucu kisa">Shift + tıklama ile seçime ekleyin ya da çıkarın. Ok tuşları hepsini birlikte kaydırır.</p>
      <div class="blok"><h3>Toplu değiştir</h3>` +
      secim('toplu.kulp', 'Kulp', ortak('kulp') || '', { '': 'Karışık', ...KULPLAR }) +
      ozelRenk('toplu.kapakRenk', 'Kapak', ortak('kapakRenk'), P.renk.kapak) +
      ozelRenk('toplu.govdeRenk', 'Gövde', ortak('govdeRenk'), P.renk.govde) +
      secim('toplu.govdeMalzeme', 'Gövde malzemesi', 'ayni', { ayni: 'Değiştirme', '': `Proje ayarı (${uretimAyari(P).govde})`, ...Object.fromEntries(URETIM_SECENEK.govde.map(x => [x, x])) }) +
      secim('toplu.kapakMalzeme', 'Kapak malzemesi', 'ayni', { ayni: 'Değiştirme', '': `Proje ayarı (${uretimAyari(P).kapak})`, ...Object.fromEntries(URETIM_SECENEK.kapak.map(x => [x, x])) }) + `</div>
      <div class="blok"><h3>Hizala</h3><div class="dugmeler iki">
        <button data-is="bitistir" title="Aynı duvardaki seçili modülleri ilkinden başlayarak aralıksız dizer">Yan yana diz</button>
        <button data-is="dagit" title="İki uçtaki modül yerinde kalır, aradakiler eşit aralıkla dağıtılır">Eşit dağıt</button>
        <button data-is="altHizala" title="Alt kotlarını son seçilen modüle eşitler">Altları hizala</button>
        <button data-is="ustHizala" title="Üst kotlarını son seçilen modüle eşitler">Üstleri hizala</button>
      </div></div>
      <p class="parca">${liste.map(o => TANIM[o.tip].ad).slice(0, 6).join(', ')}${liste.length > 6 ? '…' : ''}</p>
      ${odayaTasiHtml()}<div class="dugmeler"><button data-is="cogalt">Çoğalt</button><button data-is="sil" class="tehlike">Sil</button></div>`;
    return;
  }
  const aktif = document.activeElement;
  if (kap.dataset.id === m.id && aktif && kap.contains(aktif) && aktif.tagName === 'INPUT' && aktif.type === 'number') {
    // yazılan alan dışındakileri güncelle
    kap.querySelectorAll('input[type=number]').forEach(i => { if (i !== aktif && !i.dataset.a.startsWith('satir.')) i.value = Math.round(alanOku(m, i.dataset.a)); });
    return;
  }
  kap.dataset.id = m.id;
  const t = TANIM[m.tip], a = alanlar(m);
  const sorun = uy.filter(u => u.id === m.id).map(u => u.mesaj);
  let h = `<h2>${t.ad}</h2>`;
  if (sorun.length) h += `<p class="sorun">⚠ ${sorun.join(', ')}</p>`;
  h += `<div class="blok"><h3>Konum</h3>` + secim('duvar', 'Yer', m.duvar, DUVARLAR);
  if (m.duvar === 'ada') {
    h += sayi('x', 'Soldan', m.x) + sayi('z', 'Arkadan', m.z) +
      secim('rot', 'Ön yüz', m.rot, { 2: 'Arka duvara bakar', 0: 'Öne bakar', 1: 'Sağa bakar', 3: 'Sola bakar' });
  } else {
    h += sayi('x', xEksenli(m.duvar) ? 'Soldan' : 'Köşeden', m.x);
    const bos = yanBosluk(m); // komşuya uzaklık: yazarak da değiştirilebilir
    if (bos) {
      const [e1, e2] = xEksenli(m.duvar) ? ['Sol boşluk', 'Sağ boşluk'] : ['Arka boşluk', 'Ön boşluk'];
      h += sayi('solBosluk', e1, bos.sol, { step: 1 }) + sayi('sagBosluk', e2, bos.sag, { step: 1 });
    }
  }
  if (t.sinif === 'ust' || t.sinif === 'tesisat' || ['pencere', 'kiris', 'sarkit', 'spot', 'plafonyer', 'alt_banyo', 'tv', 'panel_yan', 'dolgu'].includes(m.tip)) h += sayi('y', 'Yerden', m.y);
  h += `</div><div class="blok"><h3>Ölçü</h3>` + sayi('w', 'Genişlik', m.w, { min: 150 }) + sayi('h', 'Yükseklik', m.h, { min: 150 }) +
    sayi('d', m.tip.endsWith('_lkose') ? 'Yan kol' : 'Derinlik', m.d, { min: 150 }) + `</div>`;
  let ic = '';
  if (a.bolme) ic += secim('bolme', 'Dikme', m.bolme || 0, { 0: 'Yok (tek bölme)', 1: '1 dikme (2 bölme)', 2: '2 dikme (3 bölme)', 3: '3 dikme (4 bölme)' });
  if (a.kalkar) ic += secim('kalkar', 'Açılış', m.kalkar ? 1 : 0, { 0: 'Yana (menteşeli)', 1: 'Yukarı (kalkar kapak)' });
  if (a.kapak && !(a.kalkar && m.kalkar)) ic += secim('kapak', m.bolme ? 'Genel kapak' : 'Kapak', m.kapak, { 1: 'Tek kapak', 2: 'Çift kapak' });
  if (a.bolme && m.bolme) {
    const secenek = { '': 'Genel ayar', kapak1: 'Tek kapak', kapak2: 'Çift kapak', acik: 'Açık (kapaksız)' };
    if (TANIM[m.tip].sinif !== 'ust') secenek.cekmece = 'Çekmeceli';
    for (let i = 0; i <= m.bolme; i++) ic += secim('bolmeIc.' + i, `${i + 1}. bölme`, m.bolmeIc?.[i] || '', secenek);
  }
  if (a.mentese) ic += secim('mentese', 'Menteşe', m.mentese, { sol: 'Solda', sag: 'Sağda' });
  if (a.cekmece) ic += secim('cekmece', 'Çekmece', m.cekmece, { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' });
  if (a.raf) ic += secim('raf', 'Raf', m.raf, { 0: 'Yok', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6' });
  if (a.korYon) ic += secim('korYon', m.tip.includes('kavis') ? 'Kavis' : m.tip === 'alt_kose' ? 'Kör taraf' : 'Köşe', m.korYon, { sol: 'Solda', sag: 'Sağda' });
  if (a.kulp) ic += `<label class="alan"><span>Kulp</span><button type="button" class="kapakSec" data-kulp="modul" title="Kulp kataloğunu açar">${kulpAdi(m.kulp || 'cubuk')}</button></label>`;
  if (a.ozel) { // bölme düzeni: alttan üste, her satırda tür ve yükseklik
    const st = ozelListe(m);
    ic += `<p class="ipucu kisa">Bölmeler alttan üste sıralıdır. Yüksekliği boş bırakılanlar kalan yeri eşit paylaşır.</p>` + st.map((s, i) =>
      `<div class="satirDuzen"><span>${i + 1}.</span><select data-a="satir.${i}.tur" aria-label="${i + 1}. bölme türü">${Object.entries(OZEL_TURLER).map(([k, v]) => `<option value="${k}"${k === s.tur ? ' selected' : ''}>${v}</option>`).join('')}</select>
      <input type="number" data-a="satir.${i}.h" value="${s.h > 0 ? s.h : ''}" placeholder="oto" min="0" step="10" title="Bölme yüksekliği (mm); boş: otomatik" aria-label="${i + 1}. bölme yüksekliği">
      <button class="mini" data-satir-sil="${i}" title="Bölmeyi sil"${st.length < 2 ? ' disabled' : ''}>×</button></div>`).join('')
      + (st.length < 8 ? `<button data-is="satirEkle" class="tam">+ Bölme ekle (üste)</button>` : '');
  }
  if (a.kapak || a.cekmece || a.ozel) ic += `<label class="alan"><span>Kapak modeli</span><button type="button" class="kapakSec" data-kapak="modul" title="Kapak kataloğunu açar">${m.kapakModel && KAPAK_MODELLERI[m.kapakModel] ? KAPAK_MODELLERI[m.kapakModel] : 'Proje ayarı'}</button></label>`;
  if (P.ayar.egim?.duvar && EGIK_OLUR.has(m.tip)) ic += secim('egikKes', 'Eğimli tavanda', m.egikKes ? 1 : 0, { 0: 'Üstü düz', 1: 'Üstü tavana göre eğik kesilir' });
  if (a.donanim) ic += secim('donanim', 'İç donanım', m.donanim || '', { '': 'Yok', ...a.donanim })
    + `<button type="button" class="tam" data-aks-ac="modul" title="Bu dolaba takılabilen ürünleri katalogdan seçer: ürün teklifte kodu ve fiyatıyla yer alır">Katalogdan donanım seç…</button>`;
  if (a.evye) ic += secim('evye', 'Evye', m.evye || 'tek', EVYELER) + secim('evyeMat', 'Evye malzemesi', m.evyeMat || 'inox', { inox: 'Paslanmaz çelik', granit: 'Granit (siyah)', beyaz: 'Seramik (beyaz)' });
  if (a.ocak) ic += secim('ocakTip', 'Ocak', m.ocakTip || 'gaz4', OCAKLAR);
  if (a.davTip) ic += secim('davTip', 'Davlumbaz', m.davTip || 'baca', { baca: 'Bacalı (ince gövde)', kutu: 'Kutu gövde', cam: 'Siyah camlı', gomme: 'Gömme (dolap içinde)' });
  if (a.buzTip) ic += secim('buzTip', 'Buzdolabı', m.buzTip || 'alt', { alt: 'Dondurucu altta', ust: 'Dondurucu üstte', tek: 'Tek kapılı', cift: 'Gardırop tipi (çift kapı)', fransiz: 'Çift kapı + alt çekmece' });
  if (a.kule) ic += secim('kule', 'Cihazlar', m.kule || 'ikili', { ikili: 'Fırın + mikrodalga', firin: 'Yalnız fırın', cift: 'Çift fırın' });
  if (a.cihazRenk) ic += secim('cihazRenk', 'Cihaz rengi', m.cihazRenk || '', { '': 'Varsayılan', inox: 'Paslanmaz', siyah: 'Siyah', beyaz: 'Beyaz' });
  if (m.tip === 'nis') ic += sayi('derin', 'Niş derinliği', m.derin || 150, { min: 50 });
  if (a.kapiTip) ic += secim('kapiTip', 'Kapı tipi', m.kapiTip || 'ic', { ic: 'İçe açılan', cift: 'Çift kanat (içe)', dis: 'Dışa açılan', surgu: 'Sürgülü', balkon: 'Balkon kapısı (camlı)' });
  if (a.kapiModel) ic += secim('kapiModel', 'Kanat modeli', m.kapiModel || 'duz', { duz: 'Düz', panelli: 'Panelli (tablalı)', camli: 'Camlı' });
  if (a.pencereTip) ic += secim('pencereTip', 'Pencere', m.pencereTip || 'cift', { cift: 'Çift kanat', tek: 'Sabit (tek cam)', uc: 'Üç bölmeli', surme: 'Sürme' })
    + secim('perde', 'Perde', m.perde || '', { '': 'Yok', stor: 'Stor', jaluzi: 'Jaluzi', tul: 'Tül (yere kadar)' })
    + secim('denizlik', 'Denizlik', m.denizlik ? 1 : 0, { 0: 'Yok', 1: 'Mermer denizlik' });
  if (ic) h += `<div class="blok"><h3>İç düzen</h3>${ic}</div>`;
  if (m.tip === 'kapi' || m.tip === 'pencere') { // doğrama ve kanat rengi
    h += `<div class="blok"><h3>Renk</h3>` + ozelRenk('dogramaRenk', m.tip === 'kapi' ? 'Kasa' : 'Doğrama', m.dogramaRenk, SABIT.dograma)
      + (m.tip === 'kapi' && m.kapiTip !== 'balkon' ? ozelRenk('kanatRenk', 'Kanat', m.kanatRenk, SABIT.ahsap) : '') + `</div>`;
  }
  if (a.kapakRenk || a.govdeRenk) {
    h += `<div class="blok"><h3>Renk</h3>`;
    if (a.kapakRenk) h += ozelRenk('kapakRenk', 'Kapak', m.kapakRenk, t.sinif === 'ust' ? P.renk.ustKapak : P.renk.kapak);
    if (a.govdeRenk) h += ozelRenk('govdeRenk', 'Gövde', m.govdeRenk, P.renk.govde);
    h += `</div>`;
    if (['alt', 'ust', 'boy'].includes(t.sinif)) { // malzeme türü: bu dolap projenin türünden ayrı kesilir (kesim listesi, plan, maliyet, CNC)
      const U = uretimAyari(P), tur = (liste, proje) => ({ '': `Proje ayarı (${proje})`, ...Object.fromEntries(liste.map(x => [x, x])) });
      h += `<div class="blok"><h3>Malzeme</h3>`
        + (a.govdeRenk ? secim('govdeMalzeme', 'Gövde', URETIM_SECENEK.govde.includes(m.govdeMalzeme) ? m.govdeMalzeme : '', tur(URETIM_SECENEK.govde, U.govde)) : '')
        + (a.kapakRenk ? secim('kapakMalzeme', 'Kapak', URETIM_SECENEK.kapak.includes(m.kapakMalzeme) ? m.kapakMalzeme : '', tur(URETIM_SECENEK.kapak, U.kapak)) : '') + `</div>`;
    }
  }
  if (m.tip === 'not_yazi') h += `<div class="blok"><h3>Yazı</h3>${metin('not', 'Not', m.not, 'Çizimde, teknik çizimde ve DXF’te görünür')}</div>`;
  if (!['yapi', 'dekor', 'tesisat'].includes(t.sinif)) h += `<div class="blok"><h3>Not</h3>${metin('not', 'Modül notu', m.not, 'Listede ve ayrıntı kartında görünür')}</div>`;
  if (['alt', 'ust', 'boy'].includes(t.sinif)) { const oneri = modulKodu({ ...m, adk: '' }); h += `<div class="blok"><h3>Adeko</h3>${metin('adk', 'Modül kodu (cc)', m.adk, oneri ? 'Otomatik: ' + oneri : 'Öneri yok: Adeko listesinden yazın')}</div>`; }
  const parcaSayisi = parcalar(m).filter(p => p.tur === 'govde' || p.tur === 'kapak').length;
  h += `<p class="parca">${t.sinif === 'yapi' ? 'Oda öğesi: dolaplar bununla çakışamaz.' : t.sinif === 'dekor' ? 'Dekor öğesi: yalnızca sunum içindir.'
    : t.sinif === 'tesisat' ? 'Tesisat noktası: teknik çizimde ölçüleriyle görünür.' : parcaSayisi + ' parça'}</p>
    ${kertmeOlculeri(m, P).map(k => `<p class="kertmeNotu"><b>Kertme:</b> ${k.metin}</p>`).join('')}
    ${m.tip === 'buzdolabi' ? '<button data-is="buzUstu" class="tam" title="Buzdolabının üstünü genel yüksekliğe kadar dolapla kapatır; dolap varsa ölçüsünü hizalar">Üstüne dolap ekle</button>' : ''}
    ${odayaTasiHtml()}<div class="dugmeler"><button data-is="cogalt">Çoğalt</button><button data-is="sil" class="tehlike">Sil</button></div>
    ${['yapi', 'dekor', 'tesisat'].includes(t.sinif) ? '' : '<button data-is="kaydet" class="tam" title="Bu modülü ayarlarıyla kütüphanenize ekler; başka projelerde de kullanabilirsiniz">Kütüphaneme kaydet</button>'}`;
  kap.innerHTML = h;
}

// Özel modülün bölme listesi (kopya): değişiklikler bunun üzerinde yapılıp modüle yazılır
const ozelListe = m => (Array.isArray(m.satirlar) && m.satirlar.length ? m.satirlar : [{ tur: 'kapak1' }]).map(s => ({ ...s }));
function satirDegistir(fn) {
  const m = seciliModul();
  if (!m) return;
  degistir(() => { const st = ozelListe(m); fn(st); m.satirlar = st; });
  $('#ozellik').dataset.id = ''; ozellikCiz(uyarilar(P));
}

const ozelRenk = (id, etiket, deger, varsayilan) =>
  `<label class="alan renk"><span>${etiket}</span><input type="color" data-a="${id}" value="${deger || varsayilan}">
   ${deger ? `<button class="mini" data-sifirla="${id}" title="Proje rengine dön">↺</button>` : '<em>proje</em>'}</label>`;

function alanOku(m, a) {
  if (a === 'solBosluk' || a === 'sagBosluk') { const b = yanBosluk(m); return b ? (a === 'solBosluk' ? b.sol : b.sag) : 0; }
  return m[a];
}

// Duvar modülünün iki yanındaki boşluk: en yakın komşuya ya da duvar ucuna uzaklık (aynı kot ve derinlikte)
function yanBosluk(m) {
  if (m.duvar === 'ada') return null;
  const ar = bosAraliklar(m.duvar, { oda: P.oda, moduller: P.moduller.filter(o => o.id !== m.id) }, m)
    .find(([a, b]) => a <= m.x + 0.6 && b >= m.x + m.w - 0.6);
  return ar ? { a: ar[0], b: ar[1], sol: Math.round(m.x - ar[0]), sag: Math.round(ar[1] - m.x - m.w) } : null;
}

// Çoklu seçimde hizalama: birincil seçimin duvarındaki seçili modüller üzerinde çalışır
function hizala(is) {
  const ana = seciliModul();
  if (!ana) return;
  // yalnızca birincil seçimle aynı duvarda ve aynı sırada (kotları kesişen) olanlar: alt ve üst sıra karışmasın
  const grup = seciliModuller().filter(o => o.duvar === ana.duvar && o.duvar !== 'ada' && o.y < ana.y + ana.h && o.y + o.h > ana.y)
    .sort((a, b) => a.x - b.x);
  if (is === 'altHizala' || is === 'ustHizala') {
    return degistir(() => { for (const o of seciliModuller()) o.y = is === 'altHizala' ? ana.y : ana.y + ana.h - o.h; });
  }
  if (grup.length < 2) { alert('Bu işlem için aynı duvarda en az iki modül seçin.'); return; }
  if (is === 'bitistir') {
    return degistir(() => { let x = grup[0].x; for (const o of grup) { o.x = Math.round(x); x += o.w; } });
  }
  if (is === 'dagit') {
    if (grup.length < 3) { alert('Eşit dağıtmak için aynı duvarda en az üç modül seçin.'); return; }
    const son = grup[grup.length - 1], aralik = (son.x + son.w - grup[0].x - grup.reduce((t, o) => t + o.w, 0)) / (grup.length - 1);
    if (aralik < 0) { alert('Modüller bu aralığa sığmıyor; önce iki uçtaki modülü birbirinden uzaklaştırın.'); return; }
    degistir(() => { let x = grup[0].x; for (const o of grup) { o.x = Math.round(x); x += o.w + aralik; } });
  }
}

let denetimAcik = false;
function denetimCiz(den) {
  const uyari = den.maddeler.filter(m => m.tur === 'uyari').length;
  const b = $('#denetimAc');
  b.textContent = uyari ? `Denetim: ${uyari} öneri` : 'Denetim: uygun';
  b.classList.toggle('sorunlu', uyari > 0);
  b.setAttribute('aria-expanded', denetimAcik);
  const kap = $('#denetim');
  kap.hidden = !denetimAcik;
  if (!denetimAcik) return;
  const im = { uyari: '⚠', iyi: '✓', bilgi: 'ℹ' };
  kap.innerHTML = `<ul>${den.maddeler.map(m =>
    `<li class="d-${m.tur}"${m.id ? ` data-sec="${m.id}" tabindex="0" role="button"` : ''}><i>${im[m.tur]}</i>${m.mesaj}</li>`).join('')}</ul>
    <label class="onay duz"><input id="ucgen" type="checkbox"${gorunum.ucgen ? ' checked' : ''}${den.ucgen ? '' : ' disabled'}> Çalışma üçgenini çizimde göster</label>
    <p class="ipucu kisa">Öneriler yaygın tasarım ölçülerine dayanır; çizimi engellemez.</p>`;
}

function ozetCiz() {
  const say = s => P.moduller.filter(m => TANIM[m.tip].sinif === s).length;
  $('#ozet').textContent = `${P.moduller.length - say('yapi') - say('dekor') - say('tesisat')} modül ·${say('alt')} alt · ${say('ust')} üst · ${say('boy')} boy · oda ${P.oda.w} × ${P.oda.d} × ${P.oda.h} mm`;
}

// ---- Olaylar ------------------------------------------------------------------------------

function alanDegisti(el) {
  const a = el.dataset.a;
  if (el.type === 'color') return; // renkleri renkCanli yönetir (canlı önizleme + tek geri alma adımı)
  if (a.startsWith('bilgi.')) return degistir(() => { P.bilgi = { ...(P.bilgi || {}), [a.slice(6)]: el.value.trim().slice(0, 200) }; });
  if (a === 'toplu.govdeMalzeme' || a === 'toplu.kapakMalzeme') { // seçili dolapların hepsine aynı malzeme türü
    if (el.value !== 'ayni') degistir(() => { for (const m of seciliModuller()) if (['alt', 'ust', 'boy'].includes(TANIM[m.tip].sinif)) m[a.slice(6)] = el.value; });
    $('#ozellik').dataset.id = ''; ozellikCiz(uyarilar(P));
    return;
  }
  if (a === 'toplu.kulp') { if (el.value) degistir(() => { for (const m of seciliModuller()) m.kulp = el.value; }); return; }
  let v = el.type === 'number' ? Number(el.value) : el.value;
  if (el.type === 'number' && (!Number.isFinite(v) || v < Number(el.min || 0))) { guncelle(); return; }
  if (a.startsWith('oda.')) return degistir(() => { P.oda[a.slice(4)] = v; });
  if (a.startsWith('renk.')) return degistir(() => { P.renk[a.slice(5)] = v; if (a === 'renk.tezgah' && P.ayar.tezgahSec) { delete P.ayar.tezgahSec; $('#oda').dataset.yenile = '1'; } });
  if (a === 'hazir') {
    const g = GORUNUMLER[v];
    if (!g) return;
    degistir(() => { Object.assign(P.renk, g.renk); P.desen = { ...(P.desen || {}), ...g.desen }; delete P.ayar.tezgahSec; $('#oda').dataset.yenile = '1'; });
    document.activeElement?.blur(); odaCiz();
    return;
  }
  if (a.startsWith('desen.')) return degistir(() => { P.desen = { ...(P.desen || {}), [a.slice(6)]: v }; if (a === 'desen.zemin') $('#oda').dataset.yenile = '1'; if (a === 'desen.tezgah' && P.ayar.tezgahSec) { delete P.ayar.tezgahSec; $('#oda').dataset.yenile = '1'; } });
  if (a === 'ayar.asmaTavan') { // asma tavana sığmayan dolaplar aynı adımda kısaltılır
    let s = null;
    degistir(() => { P.ayar.asmaTavan = Number(v); if (Number(v)) s = cakismalariGider(P); });
    if (s?.toplam) setTimeout(() => alert(giderOzeti(s)), 30);
    return;
  }
  if (a === 'ayar.tezgahKenar') return degistir(() => { P.ayar.tezgahKenar = v; });
  if (a === 'ayar.supurgelik') return degistir(() => { P.ayar.supurgelik = Number(v); $('#oda').dataset.yenile = '1'; }); // renk kutusu görünsün ya da gizlensin
  if (['ayar.led', 'ayar.kornis', 'ayar.bant', 'ayar.adaPanel', 'ayar.adaBar', 'ayar.tezgahSup'].includes(a)) return degistir(() => { P.ayar[a.slice(5)] = Number(v); });
  if (a === 'ayar.kapakModel') return degistir(() => { P.ayar.kapakModel = v; });
  if (a === 'ayar.camTur' || a === 'ayar.camYuzey' || a === 'ayar.camAl') return degistir(() => { P.ayar.cam = { ...camAyari(P.ayar), [{ camTur: 'tur', camYuzey: 'yuzey', camAl: 'al' }[a.slice(5)]]: v }; });
  if (a.startsWith('egim.')) { // eğimli tavan: duvar seçimi ve iki ölçü
    let s = null;
    degistir(() => {
      const e = { duvar: '', dusuk: 1400, mesafe: 2000, ...(P.ayar.egim || {}) };
      e[a.slice(5)] = v;
      P.ayar.egim = e.duvar ? e : null;
      $('#oda').dataset.yenile = '1';
      if (P.ayar.egim) s = cakismalariGider(P); // eğime sığmayan dolaplar aynı adımda kısaltılır, taşınır ya da kaldırılır
    });
    if (s?.toplam) setTimeout(() => alert(giderOzeti(s)), 30);
    return;
  }
  if (a === 'ayar.arasi') return degistir(() => { P.ayar.arasi = Number(v); $('#oda').dataset.yenile = '1'; });
  if (a === 'ayar.kulp') return degistir(() => { P.ayar.kulp = v; for (const m of P.moduller) m.kulp = v; $('#ozellik').dataset.id = ''; });
  if (a === 'odayaTasi') { if (v !== '') odayaTasi(Number(v)); return; }
  const m = seciliModul();
  if (!m) return;
  if (['kapak', 'cekmece', 'raf', 'rot', 'bolme', 'egikKes', 'denizlik', 'kalkar'].includes(a)) v = Number(v);
  if (a === 'solBosluk' || a === 'sagBosluk') {
    const b = yanBosluk(m);
    if (b) degistir(() => { m.x = Math.round(a === 'solBosluk' ? b.a + v : b.b - m.w - v); });
    return;
  }
  if (a.startsWith('satir.')) { // özel modülün bölme düzeni
    const [, i, alan] = a.split('.');
    degistir(() => { const st = ozelListe(m); if (alan === 'h') st[i].h = v > 0 ? Math.round(v) : 0; else st[i].tur = v; m.satirlar = st; });
    if (el.tagName === 'SELECT') { $('#ozellik').dataset.id = ''; ozellikCiz(uyarilar(P)); }
    return;
  }
  if (a.startsWith('bolmeIc.')) {
    degistir(() => { const d = [...(m.bolmeIc || [])]; d[Number(a.slice(8))] = v || null; m.bolmeIc = d; });
    $('#ozellik').dataset.id = ''; ozellikCiz(uyarilar(P));
    return;
  }
  degistir(() => {
    if (a === 'duvar') {
      m.duvar = v;
      if (v === 'ada' && m.rot == null) m.rot = 2;
      yonAyarla(m);
      Object.assign(m, bosYerBul(m, P.moduller, P.oda));
    } else m[a] = v;
    // gardırop tipi buzdolabı geniştir: tip değişince genişlik de uyar (çakışma olursa uyarı çıkar)
    if (a === 'buzTip') { const genis = v === 'cift' || v === 'fransiz'; if (genis && m.w < 850) m.w = 910; else if (!genis && m.w >= 850) m.w = 700; }
  });
  if (el.tagName === 'SELECT') { $('#ozellik').dataset.id = ''; ozellikCiz(uyarilar(P)); }
}

function olaylar() {
  document.addEventListener('change', e => { if (e.target.dataset?.a) alanDegisti(e.target); });
  document.addEventListener('input', e => { if (e.target.type === 'color' && e.target.dataset?.a) renkCanli(e.target); });

  $('#katalog').addEventListener('click', e => {
    const sil = e.target.closest('[data-kayit-sil]');
    if (sil) { if (confirm('Bu kayıtlı modül kütüphanenizden silinsin mi? Projelerdeki modüller etkilenmez.')) kayitliSil(sil.dataset.kayitSil); return; }
    const kayit = e.target.closest('[data-kayit]');
    if (kayit) { // kayıtlı modül: seçilir, çizimde tıklanan yere konur
      const k = modullerimOku().find(q => q.id === kayit.dataset.kayit);
      if (k) yerlestirBasla({ anahtar: 'k:' + k.id, ad: k.ad || TANIM[k.modul.tip].ad, sablon: () => ({ ...yeniModul(k.modul.tip), ...JSON.parse(JSON.stringify(k.modul)), id: yeniKimlik() }), otomatik: () => kayitliEkle(k.id) });
      return;
    }
    const b = e.target.closest('[data-tip]');
    if (b) { // katalog kartı: seçilir, çizimde tıklanan yere konur; aynı karta ikinci tıklama ilk boş yere koyar
      const tip = b.dataset.tip;
      yerlestirBasla({ anahtar: 't:' + tip, ad: KATALOG.find(q => q.tip === tip)?.ad || TANIM[tip].ad, sablon: () => modulSablonu(tip), otomatik: () => modulEkle(tip) });
      kullanimArtir(tip);
    }
  });
  $('#katalogAra').addEventListener('input', () => { katalogCiz(); katalogIsaretle(); });
  $('#yerSerit').addEventListener('click', e => {
    const y = e.target.closest('[data-yer]')?.dataset.yer;
    if (y === 'vazgec') yerlestirBitir();
    else if (y === 'oto' && bekleyen) { const b = bekleyen; yerlestirBitir(); b.otomatik(); }
  });
  $('#oneri').addEventListener('click', e => {
    const v = e.target.closest('[data-oneri]')?.dataset.oneri;
    if (v == null) return;
    if (v === 'kapat') oneriKapat(); else oneriSec(Number(v));
  });
  // grup açma/kapama durumunu hatırla (toggle olayı kabarmaz, yakalama aşamasında dinlenir)
  $('#katalog').addEventListener('toggle', e => {
    if (!e.target.dataset?.grup) return;
    const kapali = [...$('#katalog').querySelectorAll('details[data-grup]:not([open])')].map(d => d.dataset.grup);
    try { localStorage.setItem('kurgu.kapaliGrup.v1', JSON.stringify(kapali)); } catch { /* depolama kapalı olabilir */ }
  }, true);
  $('#duvarSec').addEventListener('click', e => {
    const b = e.target.closest('[data-duvar]');
    if (b) { hedefDuvar = b.dataset.duvar; duvarCiz(uyarilar(P)); }
  });
  $('#uyarilar').addEventListener('click', e => { if (e.target.closest('[data-gider]')) return hepsiniGider(); const b = e.target.closest('[data-sec]'); if (b) { secili = b.dataset.sec; guncelle(); } });
  $('#ozellik').addEventListener('click', e => {
    const is = e.target.closest('[data-is]')?.dataset.is;
    if (is === 'sil') modulSil();
    if (is === 'cogalt') modulCogalt();
    if (is === 'kaydet') modulKaydet();
    if (is === 'buzUstu') genelHizala(secili);
    if (is === 'satirEkle') satirDegistir(st => { st.push({ tur: 'acik' }); });
    const silinecek = e.target.closest('[data-satir-sil]')?.dataset.satirSil;
    if (silinecek != null) satirDegistir(st => { if (st.length > 1) st.splice(Number(silinecek), 1); });
    if (['bitistir', 'dagit', 'altHizala', 'ustHizala'].includes(is)) hizala(is);
    const s = e.target.closest('[data-sifirla]')?.dataset.sifirla;
    if (s) { e.preventDefault(); const hedefler = s.startsWith('toplu.') ? seciliModuller() : [seciliModul()]; const alan = s.replace('toplu.', ''); degistir(() => { for (const m of hedefler) m[alan] = null; }); $('#ozellik').dataset.id = ''; ozellikCiz(uyarilar(P)); }
  });

  $('#projeAd').addEventListener('change', e => degistir(() => { P.ad = e.target.value.trim() || 'Adsız proje'; }));
  $('#geri').onclick = geriAl;
  $('#ileri').onclick = yinele;
  $('#sihirbaz form').addEventListener('submit', e => {
    if (e.submitter?.value !== 'olustur') return; // Vazgeç: pencere kendiliğinden kapanır
    if (!sihirbazUygula(e.target)) e.preventDefault();
  });
  $('#odaSekme').addEventListener('click', e => { const b = e.target.closest('[data-oda]'); if (b) odaIslemi(b.dataset.oda); });
  $('#yeni').onclick = () => sihirbazAc(false);
  $('#tavan').onclick = tavanaTamamla;
  $('#genelHiza').onclick = () => genelHizala();
  $('#bitis').onclick = bitisEkle;
  $('#standartAc').onclick = () => standartAc();
  $('#standartSifirla').onclick = () => standartAc(STANDART_VARSAYILAN);
  $('#standart form').addEventListener('submit', e => {
    if (e.submitter?.value === 'uygula' && !standartUygula(e.target)) e.preventDefault();
  });
  $('#aksam').addEventListener('change', e => { gorunum.aksam = e.target.checked; guncelle(); });
  $('#spotDiz').onclick = () => degistir(() => { // tavana eşit aralıklı spot ızgarası
    P.moduller = P.moduller.filter(m => m.tip !== 'spot');
    const nx = Math.max(1, Math.round(P.oda.w / 1300)), nz = Math.max(1, Math.round(P.oda.d / 1300));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const s = yeniModul('spot');
      const spot = { ...s, duvar: 'ada', rot: 0, x: Math.round(P.oda.w * (i + 0.5) / nx - s.w / 2), z: Math.round(P.oda.d * (j + 0.5) / nz - s.d / 2), y: P.oda.h - s.h };
      if (serbestMi(spot, P.moduller, P.oda, true)) P.moduller.push(spot); // tavana kadar çıkan dolabın içine spot konmaz
    }
    secili = null;
  });
  $('#aktarAc').onclick = () => $('#aktar').showModal();
  $('#aktarDxf').onclick = () => { indir(new Blob([dxf(P)], { type: 'application/dxf' }), dosyaAdi('dxf')); $('#aktar').close(); };
  $('#aktarSu').onclick = () => { indir(new Blob([sketchupBetigi(P)], { type: 'text/plain' }), dosyaAdi('rb')); $('#aktar').close(); };
  // Sunum modu
  const sunumAyarla = acik => {
    document.body.classList.toggle('sunum', acik);
    sahne.sunum(acik);
    if (acik) { secili = null; guncelle(); document.documentElement.requestFullscreen?.().catch(() => {}); }
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };
  $('#sunumAc').onclick = () => sunumAyarla(true);
  $('#sunumCik').onclick = () => sunumAyarla(false);
  $('#vitrinAc').onclick = () => vitrinAyarla(true);
  document.addEventListener('click', e => { // müşteri gösterimi düğmeleri (başlıkta ve telefonda alt çubukta)
    const d = e.target.closest?.('[data-vt]');
    if (!d || !vitrinde()) return;
    const is = d.dataset.vt;
    if (is === 'cik') { vitrinAyarla(false); return; }
    if (is === 'acik') $('#kapakAcik').click();
    else if (is === 'aksam') $('#aksam').click();
    else if (is === 'foto') $(`#modSec [data-mod=${gorunum.foto ? 'gercek' : 'foto'}]`).click();
    vitrinCiz();
  });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('sunum')) sunumAyarla(false); });
  // Dar ekran: seçili modül çubuğu ve açık panelleri çizime dokununca kapatma
  $('#secimCubugu').addEventListener('click', e => {
    const is = e.target.closest('[data-sc]')?.dataset.sc;
    if (is === 'sol') kaydir(-10, 0);
    if (is === 'sag') kaydir(10, 0);
    if (is === 'ozellik') sayfaAc(acikSayfa() === 'ozellik' ? 'cizim' : 'ozellik');
    if (is === 'cogalt') modulCogalt();
    if (is === 'sil') modulSil();
    if (is === 'birak') { secili = null; guncelle(); }
    if (is === 'diger') { const r = e.target.closest('button').getBoundingClientRect(); sagMenuAc({ clientX: r.right, clientY: r.top - 6 }, secili, true); }
  });
  // Alt gezinme çubuğu: açık bölüme yeniden dokununca panel kapanır
  $('#altGezinme').addEventListener('click', e => { const d = e.target.closest('[data-sayfa]'); if (d) sayfaAc(d.dataset.sayfa === acikSayfa() ? 'cizim' : d.dataset.sayfa); });
  document.querySelectorAll('.sayfa-kapat').forEach(d => { d.onclick = () => sayfaAc('cizim'); });
  document.querySelectorAll('.tutamak').forEach(tutamakKur);
  $('#gosterimAc').onclick = () => { const acik = $('.ust-arac').classList.toggle('acik'); $('#gosterimAc').setAttribute('aria-expanded', String(acik)); };
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.ust-arac')) gosterimKapat(); });
  $('#olcuIpucu').onclick = () => olcuModu(false);
  // Dokunmatik: modüle ya da boş yere uzun basınca sağ tık menüsü açılır
  let uzunBas = null;
  const uzunIptal = () => { clearTimeout(uzunBas?.t); uzunBas = null; };
  $('#tuval').addEventListener('pointerdown', e => {
    uzunIptal();
    if (e.pointerType !== 'touch' || !e.isPrimary || $('#olcuCiz').classList.contains('aktif')) return;
    uzunBas = { x: e.clientX, y: e.clientY, t: setTimeout(() => {
      const n = uzunBas; uzunBas = null;
      if (!n) return;
      sagMenuAc({ clientX: n.x, clientY: n.y });
      if (!$('#sagMenu').hidden) navigator.vibrate?.(12);
    }, 550) };
  });
  $('#tuval').addEventListener('pointermove', e => { if (uzunBas && Math.hypot(e.clientX - uzunBas.x, e.clientY - uzunBas.y) > 10) uzunIptal(); });
  $('#tuval').addEventListener('pointerup', uzunIptal);
  $('#tuval').addEventListener('pointercancel', uzunIptal);
  $('#yardimAc').onclick = () => $('#yardim').showModal();
  $('#turBaslat').onclick = () => { $('#yardim').close(); rehberBaslat(sayfaAc); };
  $('#denetimAc').onclick = () => { denetimAcik = !denetimAcik; guncelle(); };
  $('#denetim').addEventListener('click', e => { const li = e.target.closest('[data-sec]'); if (li) { secili = li.dataset.sec; guncelle(); } });
  $('#denetim').addEventListener('change', e => { if (e.target.id === 'ucgen') { gorunum.ucgen = e.target.checked; guncelle(); } });
  $('#projelerAc').onclick = () => { projelerCiz(); $('#projeler').showModal(); esitle().then(() => { if ($('#projeler').open) projelerCiz(); }); };
  $('#projeListe').addEventListener('click', e => {
    const b = e.target.closest('[data-p]');
    if (!b) return;
    const { p, id } = b.dataset;
    if (p === 'ac') { projeAc(id); $('#projeler').close(); return; }
    if (p === 'kopya') projeKopyala(id);
    if (p === 'sil' && confirm(esitDurum() === 'bagli' ? 'Bu proje bütün cihazlardan silinecek. Devam edilsin mi?' : 'Bu proje silinecek. Devam edilsin mi?')) projeSil(id);
    projelerCiz();
  });
  $('#dosyaAc').onclick = dosyaAc;
  $('#kesimAc').onclick = () => kagitAc('kesim');
  $('#planAc').onclick = () => kagitAc('plan');
  $('#etiketAc').onclick = () => kagitAc('etiket');
  $('#maliyetAc').onclick = () => kagitAc('maliyet');
  $('#teklifAc').onclick = () => kagitAc('teklif');
  $('#aksAc').onclick = () => aksKatalogAc('proje');
  document.addEventListener('click', e => { const b = e.target.closest('[data-aks-ac]'); if (b) aksKatalogAc(b.dataset.aksAc); });
  $('#aksKatalog').addEventListener('click', aksKatalogTik);
  document.addEventListener('click', e => { if (e.target.closest('[data-tezgah-ac]')) tezgahKatalogAc(); });
  $('#tezgahKatalog').addEventListener('click', tezgahKatalogTik);
  $('#tezgahAc').onclick = tezgahKatalogAc;
  document.addEventListener('click', e => { if (e.target.closest('[data-renk-ac]')) renkKatalogAc(); });
  $('#renkKatalog').addEventListener('click', renkKatalogTik);
  $('#rkAra').addEventListener('input', e => { rkYazi = e.target.value; rkSinir = 240; renkKatalogCiz(); });
  $('#rkMarka').addEventListener('change', e => { rkMarka = e.target.value; rkSinir = 240; renkKatalogCiz(); $('#rkListe').scrollTop = 0; });
  $('#rkAra').addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
  $('#montajAc').onclick = () => kagitAc('montaj');
  $('#islemeAc').onclick = () => kagitAc('isleme');
  $('#aktarCam').onclick = () => { const v = camListesiCsv(P); projeAyarla(P.ayar); indir(new Blob([v], { type: 'text/csv;charset=utf-8' }), dosyaAdi('csv').replace(/\.csv$/, '-cam-parca-listesi.csv')); $('#aktar').close(); bildir('CAM parça listesi indirildi.'); };
  $('#aktarKod').onclick = () => { const v = modulKodListesiCsv(P); projeAyarla(P.ayar); indir(new Blob([v], { type: 'text/csv;charset=utf-8' }), dosyaAdi('csv').replace(/\.csv$/, '-modul-kod-listesi.csv')); $('#aktar').close(); bildir('Modül kod listesi indirildi.'); };
  $('#aktarCnc').onclick = () => { const k = cncPaketi(P); projeAyarla(P.ayar); indir(new Blob([k.veri], { type: 'application/zip' }), k.ad); $('#aktar').close(); bildir(`CNC paketi indirildi: ${k.parca} parça, ${k.klasor} levha türü.`); };
  $('#dekor').addEventListener('change', e => { degistir(() => { P.ayar.dekor = { ...dekorAyari(P), acik: e.target.checked }; }); if (e.target.checked && gorunum.mod !== 'gercek') bildir('Dekor yalnızca “Gerçekçi” ve “Foto” görünümünde çizilir.'); });
  $('#dekorAc').onclick = dekorPencereAc;
  $('#dekorAyar').addEventListener('change', e => { const k = e.target.dataset.dk; if (k) dekorDegistir(k, e.target.checked); else if (e.target.id === 'dkAcik') dekorDegistir('acik', e.target.checked); });
  $('#dekorAyar').addEventListener('click', e => {
    const y = e.target.closest('[data-dk-yogunluk]');
    if (y) dekorDegistir('yogunluk', Number(y.dataset.dkYogunluk));
    else if (e.target.closest('#dkYeniden')) dekorDegistir('tohum', dekorAyari(P).tohum + 1);
  });
  $('#akAra').addEventListener('input', e => { akYazi = e.target.value; aksKatalogCiz(); });
  $('#akAra').addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); }); // Enter pencereyi kapatmasın
  $('#teknikIcerik').addEventListener('click', e => {
    const sil = e.target.closest('[data-aks-sil]');
    if (sil) { aksesuarSil(Number(sil.dataset.aksSil)); return; }
    if (e.target.closest('[data-teklif="gorsel"]')) { teklifGorsel = teklifGorselAl(true); kagitYenidenKur(); }
    const is = e.target.closest('[data-isleme-is]')?.dataset.islemeIs;
    if (is === 'varsayilan') { // projedeki ölçüler bu cihazın başlangıç ölçüsü olur
      const k = islemeKurali(P), fark = Object.fromEntries(Object.entries(k).filter(([a, v]) => ISLEME_KURAL[a] !== v));
      try { localStorage.setItem('kurgu.isleme.v1', JSON.stringify(fark)); } catch { /* depolama kapalı olabilir */ }
      islemeVarsayilanKoy(fark); bildir('İşleme ölçüleri bu cihazda varsayılan yapıldı.'); kagitYenidenKur();
    } else if (is === 'sifirla') {
      try { localStorage.removeItem('kurgu.isleme.v1'); } catch { /* yok say */ }
      islemeVarsayilanKoy({}); degistir(() => { delete P.ayar.isleme; }); kagitYenidenKur();
    }
  });
  window.addEventListener('resize', () => { if (kagit === 'teklif') teklifOlcek(); });
  $('#renderAc').onclick = renderAl;
  $('#fotoAc').onclick = fotoAc;
  document.addEventListener('click', e => { const b = e.target.closest('[data-kapak]'); if (b) kapakKatalogAc(b.dataset.kapak); });
  $('#kapakKatalog').addEventListener('click', kapakKatalogTik);
  document.addEventListener('click', e => { if (e.target.closest('[data-tac-ac]')) tacKatalogAc(); });
  $('#tacKatalog').addEventListener('click', tacKatalogTik);
  document.addEventListener('click', e => { const b = e.target.closest('[data-kulp]'); if (b) kulpKatalogAc(b.dataset.kulp); });
  $('#kulpKatalog').addEventListener('click', kulpKatalogTik);
  $('#fotoBaslat').onclick = fotoCalistir;
  $('#fotoDurdur').onclick = () => fotoIs?.durdur(true);
  $('#fotoKaydet').onclick = () => $('#fotoTuval').toBlob(b => { if (b) indir(b, dosyaAdi('png').replace(/\.png$/, '-foto.png')); }, 'image/png');
  $('#foto').addEventListener('close', () => { if (fotoIs && !fotoIs.bitti) { fotoIs.durdur(false); $('#fotoDurdur').disabled = true; $('#fotoDurum').textContent = 'Durduruldu.'; } });
  $('#teknikIcerik').addEventListener('change', kagitDegisti);
  $('#kesimCsvIndir').onclick = () => {
    const mal = kagit === 'maliyet';
    indir(new Blob([mal ? maliyetCsv(P, fiyatOku()) : kesimCsv(P)], { type: 'text/csv;charset=utf-8' }), dosyaAdi('csv').replace(/\.csv$/, mal ? '-maliyet.csv' : '-kesim.csv'));
    projeAyarla(P.ayar);
  };
  $('#teknikAc').onclick = () => kagitAc('teknik');
  $('#teknikKapat').onclick = () => { $('#teknik').hidden = true; $('#teknikIcerik').innerHTML = ''; kagit = ''; };
  $('#teknikYazdir').onclick = () => window.print();
  $('#ornek').onclick = () => { if (confirm('Mevcut çizimin yerine örnek mutfak açılacak. Devam edilsin mi?')) { degistir(() => { P = ornekProje(); secili = null; }); sahne.kamera('3b'); } };
  $('#indir').onclick = () => indir(new Blob([JSON.stringify(P, null, 2)], { type: 'application/json' }), dosyaAdi('json'));
  $('#ac').onclick = () => $('#dosya').click();
  const projeDosyasiAc = async f => {
    try {
      if (f.size > 20 * 1024 * 1024) throw new Error('büyük');
      const p = JSON.parse(await f.text());
      if (p.surum !== 1 || !Array.isArray(p.moduller) || !p.oda) throw new Error('biçim');
      degistir(() => { P = { ...bosProje(), ...p, id: yeniKimlik() }; secili = null; }); // dosyadan açılan proje ayrı kayıt olur
      sahne.kamera('3b');
      bildir(`“${P.ad || 'Proje'}” açıldı ve Projeler listesine ayrı bir proje olarak eklendi.`);
    } catch { alert('Bu dosya bir proje dosyası olarak okunamadı.'); }
  };
  $('#dosya').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) projeDosyasiAc(f); });
  // Proje dosyasını pencereye sürükleyip bırakmak "Dosyadan aç" ile aynıdır (dosya seçme alanına bırakılan dosya o alana gider)
  const dosyaSuruklemesi = e => [...(e.dataTransfer?.types || [])].includes('Files');
  window.addEventListener('dragover', e => { if (dosyaSuruklemesi(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  window.addEventListener('drop', e => {
    if (!dosyaSuruklemesi(e) || e.target?.matches?.('input[type=file]')) return;
    e.preventDefault(); // tarayıcı dosyayı sayfanın yerine açmasın
    if (!$('#teknik').hidden || document.querySelector('dialog[open]')) { bildir('Proje dosyasını açmak için önce açık pencereyi kapatın.'); return; }
    const f = [...e.dataTransfer.files].find(d => /\.(json|txt)$/i.test(d.name));
    if (f) projeDosyasiAc(f); else bildir('Buraya yalnızca ARTAPP proje dosyası (.json ya da .txt) bırakılabilir.');
  });
  // Paylaş: projeyi dosya olarak cihazın paylaşma menüsüne verir (WhatsApp, e-posta…); paylaşma menüsü olmayan cihazda dosya indirilir.
  // Paylaşılan dosya .txt uzantılıdır: tarayıcılar .json dosyasının paylaşılmasına izin vermez. İçerik "Dosyaya kaydet" ile aynıdır.
  $('#paylas').onclick = async () => {
    const metin = JSON.stringify(P), ad = dosyaAdi('json').replace(/\.json$/, '.artapp.txt');
    let dosya = null;
    try { dosya = new File([metin], ad, { type: 'text/plain' }); } catch { /* File desteklenmiyorsa indirilir */ }
    let paylasilir = false;
    try { paylasilir = !!(dosya && navigator.share && navigator.canShare?.({ files: [dosya] })); } catch { paylasilir = false; }
    if (paylasilir) {
      try {
        await navigator.share({ files: [dosya], title: P.ad || 'ARTAPP projesi' });
        bildir('Proje dosyası paylaşıldı. Öbür cihazda “⋯ › Dosyadan aç” ile açılır.', 7000);
        return;
      } catch (h) { if (h?.name === 'AbortError') return; /* paylaşma başarısız: aşağıda indirilir */ }
    }
    indir(new Blob([JSON.stringify(P, null, 2)], { type: 'application/json' }), dosyaAdi('json'));
    bildir('Proje dosyası indirildi. Dosyayı WhatsApp ya da e-postayla gönderebilirsiniz; öbür cihazda “⋯ › Dosyadan aç” ile açılır.', 8000);
  };
  $('#gorsel').onclick = async () => {
    if (canliResim()) { $('#fotoCanli').toBlob(b => { if (b) indir(b, dosyaAdi('png').replace(/\.png$/, '-foto.png')); }, 'image/png'); return; } // Foto kipinde ekrandaki fotoğraf
    const onceki = secili; secili = null; guncelle();
    const veri = sahne.png();
    secili = onceki; guncelle();
    indir(await (await fetch(veri)).blob(), dosyaAdi('png'));
  };

  $('#modSec').addEventListener('click', e => {
    const b = e.target.closest('[data-mod]');
    if (!b) return;
    gorunum.mod = b.dataset.mod === 'foto' ? 'gercek' : b.dataset.mod; // Foto kipi gerçekçi görünümün üstünde çalışır
    canliKip(b.dataset.mod === 'foto');
    $('#modSec').querySelectorAll('button').forEach(x => x.classList.toggle('aktif', x === b));
    guncelle();
    if (gorunum.foto) canliDurgun();
  });
  $('#kapakGizle').addEventListener('change', e => { gorunum.kapakGizle = e.target.checked; guncelle(); });
  $('#olculer').addEventListener('change', e => { gorunum.olculer = e.target.checked; guncelle(); });
  $('#acilis').addEventListener('change', e => { gorunum.acilis = e.target.checked; guncelle(); });
  $('#kapakAcik').addEventListener('change', e => { gorunum.kapakAcik = e.target.checked; guncelle(); });
  $('#doldur').onclick = duvarDoldur;
  $('#bakisSec').addEventListener('change', e => bakisIslemi(e.target.value));
  $('#firmaLogo').addEventListener('change', e => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    if (dosya.size > 400 * 1024) { alert('Logo dosyası 400 KB\'den küçük olmalı.'); e.target.value = ''; return; }
    const okuyucu = new FileReader();
    okuyucu.onload = () => { firmaLogoGecici = String(okuyucu.result); firmaLogoCiz(); };
    okuyucu.readAsDataURL(dosya);
  });
  $('#firmaLogoOn').addEventListener('click', e => { if (e.target.id === 'firmaLogoSil') { firmaLogoGecici = ''; $('#firmaLogo').value = ''; firmaLogoCiz(); } });
  $('#kamSec').addEventListener('click', e => { const b = e.target.closest('[data-kam]'); if (b) sahne.kamera(b.dataset.kam); });

  $('#olcuCiz').onclick = () => olcuModu(!$('#olcuCiz').classList.contains('aktif'));
  // Sol panel sekmeleri, "Diğer" menüsü, tema ve komut paleti
  $('#solSekme').addEventListener('click', e => { const b = e.target.closest('[data-sekme]'); if (b) { $('#sol').dataset.sekme = b.dataset.sekme; gezinmeCiz(); } });
  const digerKapat = () => { $('#digerMenu').hidden = true; $('#digerAc').setAttribute('aria-expanded', 'false'); };
  $('#digerAc').onclick = e => { e.stopPropagation(); const acik = $('#digerMenu').hidden; $('#digerMenu').hidden = !acik; $('#digerAc').setAttribute('aria-expanded', String(acik)); };
  $('#digerMenu').addEventListener('click', digerKapat);
  $('#digerMenu').addEventListener('click', e => { const t = e.target.closest('[data-tikla]'); if (t) $('#' + t.dataset.tikla).click(); }); // dar ekranda başlıktan menüye inen düğmeler
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.menu-sarma')) digerKapat(); });
  $('#standartKisayol').onclick = () => standartAc();
  $('#temaDegis').onclick = () => { temaPencereCiz(); if (!$('#temaPencere').open) $('#temaPencere').showModal(); };
  $('#temaListe').addEventListener('click', e => { const b = e.target.closest('[data-tema-sec]'); if (b) temaAyarla(b.dataset.temaSec); });
  $('#duzenListe').addEventListener('click', e => { const b = e.target.closest('[data-duzen-sec]'); if (b) duzenAyarla(b.dataset.duzenSec); });
  $('#paletAc').onclick = paletAc;
  $('#paletAra').addEventListener('input', () => { paletSecili = 0; paletCiz(); });
  $('#paletAra').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = paletSonuc.length; if (n) { paletSecili = (paletSecili + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; paletCiz(); } }
    if (e.key === 'Enter') { e.preventDefault(); paletCalistir(paletSecili); }
  });
  $('#paletListe').addEventListener('click', e => { const li = e.target.closest('[data-i]'); if (li) paletCalistir(Number(li.dataset.i)); });
  $('#palet').addEventListener('click', e => { if (e.target === $('#palet')) $('#palet').close(); }); // dışına tıklayınca kapanır
  // Sağ tık: sürüklemeden bırakılırsa menü açılır (sağ tuşla sürüklemek görüşü kaydırmaya devam eder)
  let sagBas = null;
  $('#tuval').addEventListener('pointerdown', e => { $('#sagMenu').hidden = true; sagBas = e.button === 2 ? { x: e.clientX, y: e.clientY } : null; });
  $('#tuval').addEventListener('pointerup', e => { if (e.button === 2 && sagBas && Math.hypot(e.clientX - sagBas.x, e.clientY - sagBas.y) < 5) sagMenuAc(e); sagBas = null; });
  $('#tuval').addEventListener('contextmenu', e => e.preventDefault());
  $('#sagMenu').addEventListener('click', e => {
    const is = e.target.closest('[data-sm]')?.dataset.sm;
    if (!is) return;
    $('#sagMenu').hidden = true;
    if (is === 'cogalt') modulCogalt();
    if (is === 'ayna') aynaKopya();
    if (is === 'kopyala') modulKopyala();
    if (is === 'yapistir') modulYapistir();
    if (is === 'sil') modulSil();
  });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#sagMenu') && e.target.id !== 'tuval') $('#sagMenu').hidden = true; });

  document.addEventListener('keydown', e => {
    if (vitrinde()) { // müşteri gösterimi: yalnızca bakış kısayolları (1–5) ve Esc çalışır; çizim kısayolları kapalıdır
      const yaz = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName), pencere = document.querySelector('dialog[open]');
      if (e.key === 'Escape' && !pencere) { vitrinAyarla(false); return; }
      if (!yaz && !pencere && !e.ctrlKey && !e.metaKey && !e.altKey && ['1', '2', '3', '4', '5'].includes(e.key)) sahne.kamera(['3b', 'ic', 'on', 'sol', 'ust'][Number(e.key) - 1]);
      if (!yaz && (e.ctrlKey || e.metaKey) && ['k', 'z', 'y', 'd', 'a', 'v'].includes(e.key.toLowerCase())) e.preventDefault();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); paletAc(); return; }
    if ($('#palet').open) return; // palet açıkken çizim kısayolları çalışmasın
    const yazi = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (e.key === 'Escape') digerKapat();
    if (!yazi && !e.ctrlKey && !e.metaKey && !e.altKey && $('#teknik').hidden && !document.querySelector('dialog[open]') && ['1', '2', '3', '4', '5'].includes(e.key)) {
      sahne.kamera(['3b', 'ic', 'on', 'sol', 'ust'][Number(e.key) - 1]); return; // 1–5: bakış yönü
    }
    if (!yazi && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) { if (modulKopyala()) e.preventDefault(); return; }
    if (!yazi && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && pano.length) { e.preventDefault(); modulYapistir(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? yinele() : geriAl(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); yinele(); return; }
    if (yazi) return;
    if (document.querySelector('dialog[open]')) return; // pencere açıkken çizim kısayolları çalışmasın
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); modulCogalt(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      const dolaplar = P.moduller.filter(m => ['alt', 'ust', 'boy'].includes(TANIM[m.tip].sinif));
      if (dolaplar.length) { secililer = new Set(dolaplar.map(m => m.id)); secili = dolaplar[0].id; $('#ozellik').dataset.id = ''; guncelle(); }
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); modulSil(); return; }
    if (e.key === 'Escape' && document.body.classList.contains('sunum')) { $('#sunumCik').click(); return; }
    if (e.key === 'Escape') { $('#sagMenu').hidden = true; if (bekleyen) { yerlestirBitir(); return; } if ($('#olcuCiz').classList.contains('aktif')) { olcuModu(false); return; } if (!$('#teknik').hidden) { $('#teknikKapat').click(); return; } secili = null; guncelle(); return; }
    if (!$('#teknik').hidden) return; // teknik çizim açıkken çizim kısayolları çalışmasın
    const adim = e.shiftKey ? 1 : 10;
    const ok = { ArrowLeft: [-adim, 0], ArrowRight: [adim, 0], ArrowUp: [0, -adim], ArrowDown: [0, adim] }[e.key];
    if (ok && secili) { e.preventDefault(); kaydir(...ok); }
  });
}

// Renk seçici sürüklenirken geçmişi doldurmadan canlı önizleme
let renkOnce = null;
function renkCanli(el) {
  const a = el.dataset.a;
  if (!renkOnce) { renkOnce = JSON.stringify(P); el.addEventListener('change', () => { gecmis.push(renkOnce); ileri.length = 0; renkOnce = null; $('#ozellik').dataset.id = ''; guncelle(); }, { once: true }); }
  if (a.startsWith('renk.')) { P.renk[a.slice(5)] = el.value; if (a === 'renk.tezgah') delete P.ayar.tezgahSec; }
  else if (a.startsWith('toplu.')) { for (const m of seciliModuller()) m[a.slice(6)] = el.value; }
  else { const m = seciliModul(); if (m) m[a] = el.value; }
  sahne.ciz(P, { secili, secililer, uyari: vitrinde() ? new Set() : new Set(uyarilar(P).map(u => u.id)), ...gorunum });
}

function dosyaAdi(uz) {
  return (P.ad || 'proje').toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-').replace(/^-|-$/g, '') + '.' + uz;
}
function indir(blob, ad) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = ad;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---- Başlat -----------------------------------------------------------------------------------

let tasimaOnce = null;
sahne.kur($('#tuval'), {
  cizildi: kameraOynadi => canliCizildi(kameraOynadi),
  durgun: () => canliDurgun(),
  sec(id, ekle) {
    if (ekle && id) { // Shift + tıklama: seçime ekle ya da çıkar
      if (secililer.has(id) && secililer.size > 1) { secililer.delete(id); secili = [...secililer][secililer.size - 1]; }
      else { secililer.add(id); secili = id; }
    } else { secili = id; secililer = new Set(id ? [id] : []); }
    $('#ozellik').dataset.id = '';
    guncelle();
  },
  duvarDegis(id, duvar, boyunca) { // sürüklerken başka duvara geçiş; yeni konumu ya da null döndürür
    const m = P.moduller.find(o => o.id === id);
    if (!m) return null;
    const yeni = tasimaCoz({ ...m, duvar }, { x: boyunca }, P.moduller, P.oda);
    if (!yeni) return null;
    m.duvar = duvar; m.x = yeni.x;
    yonAyarla(m);
    guncelle();
    return m.x;
  },
  tasiBasla() { tasimaOnce = JSON.stringify(P); },
  tasi(id, istenen) {
    const m = P.moduller.find(o => o.id === id);
    if (!m) return;
    if (secililer.size > 1 && secililer.has(id)) { tasimaHedef = null; grupTasi(m, istenen); return; }
    tasimaHedef = m.duvar !== 'ada' ? { id, x: istenen.x } : null;
    const yeni = tasimaCoz(m, istenen, P.moduller, P.oda);
    if (!yeni || (yeni.x === m.x && (yeni.z ?? m.z) === m.z)) return;
    Object.assign(m, yeni);
    guncelle();
  },
  tasiBitti() {
    if (tasimaOnce && tasimaOnce !== JSON.stringify(P)) { gecmis.push(tasimaOnce); ileri.length = 0; }
    tasimaOnce = null;
    const h = tasimaHedef;
    tasimaHedef = null;
    guncelle();
    if (h) tasimaOner(h); // bırakılan yere göre ölçü önerileri (varsa)
  },
});
katalogCiz();
olaylar();
guncelle();
sahne.kamera('3b');
temaSahneyeYansit(); // seçim çerçevesi açılışta da temanın vurgu renginde olsun
// Ortak projeler: kitaplık sunucudaki depoyla eşitlenir (sunucu yoksa uygulama eskisi gibi yalnızca bu cihazda çalışır)
esitKur({ oku: kitaplikOku, yaz: kitaplikYaz, once: () => { if (kayitZamani) simdiKaydet(); }, sonra: esitSonra });

// Adres "#teknik" ile bitiyorsa teknik çizim doğrudan açılır (yazdırma ve bağlantı paylaşımı için); tur başlamaz
if (location.hash === '#teknik') $('#teknikAc').click();
else if (location.hash === '#kesim') $('#kesimAc').click();
else if (location.hash === '#plan') $('#planAc').click();
else if (location.hash === '#etiket') $('#etiketAc').click();
else if (location.hash === '#maliyet') $('#maliyetAc').click();
else if (location.hash === '#teklif') $('#teklifAc').click();
else if (location.hash === '#montaj') $('#montajAc').click();
else if (location.hash === '#isleme') $('#islemeAc').click();
else if (location.hash === '#dosya') dosyaAc();
else setTimeout(() => rehberGerekirse(sayfaAc), 600); // ilk açılışta tanıtım turu (çizim yerleştikten sonra)
// Foto kipi bu cihazda açık bırakıldıysa (ve ekran telefon boyunda değilse) yeniden açılır
try { if (!location.hash && localStorage.getItem('kurgu.foto.v1') === '1' && !window.matchMedia('(max-width: 900px), (max-height: 520px)').matches) document.querySelector('#modSec [data-mod="foto"]')?.click(); } catch { /* depolama kapalı olabilir */ }

// Sınama ve hata ayıklama için
window.kurgu = { get proje() { return P; }, esitle, esitDurum, kopyala: modulKopyala, yapistir: modulYapistir, ayna: aynaKopya,
  kare: n => sahne.kareOlc(n), bakis: b => b ? sahne.bakisKoy(b) : sahne.bakisAl(), // bakış: kameranın yeri ve hedefi (metre); deneme ve hata ayıklama için
  // n kez tam yenileme yapıp ortalama süreyi (ms) döndürür; hız ölçümü için
  olc: (n = 20) => { const t = performance.now(); for (let i = 0; i < n; i++) guncelle(); return Math.round((performance.now() - t) / n * 10) / 10; }, ekran: (x, y, z) => sahne.ekranNoktasi(x, y, z), sihirbaz: (tip, ada, w, d, h = 2700) => {
  const f = $('#sihirbaz form');
  f.querySelector(`[name=tip][value=${tip}]`).checked = true;
  f.querySelector('[name=ada]').checked = ada;
  Object.entries({ w, d, h }).forEach(([k, v]) => { f.querySelector(`[name=${k}]`).value = v; });
  return sihirbazUygula(f);
}, kutu, uyarilar: () => uyarilar(P), png: () => sahne.png(), render: ops => sahne.render(ops), fotoSahne: ops => sahne.fotoSahne(ops), canli: () => canli?.durum() || null, plan: () => kesimPlani(P), hirdavat: () => projeHirdavati(P), maliyet: () => maliyet(P, fiyatOku()) };
