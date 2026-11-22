// Yerleşim geometrisi: modülün odadaki yeri, kapladığı kutu, çakışma, boş yer bulma, yakalama.
// Oda ekseni: x = arka duvar boyunca (0..oda.w), z = arka duvardan odaya doğru (0..oda.d), y = yukarı.
// Duvar modüllerinde m.x = duvar boyunca arka-sol köşeden (yan duvarlarda arka köşeden) uzaklık.
// Ada modüllerinde (m.x, m.z) = gövdenin plandaki sol-arka (en küçük) köşesi, m.rot = 0..3 (x90°).
import { KAPAK_K, TANIM } from './moduller.js';

// Ön duvarda da m.x odanın solundan (x ekseninde) ölçülür; modülün önü arka duvara bakar.
export const DUVARLAR = { arka: 'Arka duvar', sol: 'Sol duvar', sag: 'Sağ duvar', on: 'Ön duvar', ada: 'Ada (serbest)' };
export const DUVAR_LISTE = ['arka', 'sol', 'sag', 'on'];
// Duvar x ekseni boyunca mı uzanıyor (arka, ön) yoksa z ekseni boyunca mı (sol, sağ)
export const xEksenli = duvar => duvar === 'arka' || duvar === 'on';

export function duvarBoyu(duvar, oda) {
  return xEksenli(duvar) ? oda.w : oda.d;
}

// Modülün yönü: 0 önü +z, 1 önü +x, 2 önü -z, 3 önü -x
export function yon(m) {
  return m.duvar === 'arka' ? 0 : m.duvar === 'sol' ? 1 : m.duvar === 'sag' ? 3 : m.duvar === 'on' ? 2 : (m.rot || 0);
}

// three.js grubu için konum ve Y dönüşü
export function donusum(m, oda) {
  switch (m.duvar) {
    case 'arka': return { p: [m.x, m.y, 0], r: 0 };
    case 'sol': return { p: [0, m.y, m.x + m.w], r: Math.PI / 2 };
    case 'sag': return { p: [oda.w, m.y, m.x], r: -Math.PI / 2 };
    case 'on': return { p: [m.x + m.w, m.y, oda.d], r: Math.PI };
    default:
      switch (m.rot || 0) {
        case 1: return { p: [m.x, m.y, m.z + m.w], r: Math.PI / 2 };
        case 2: return { p: [m.x + m.w, m.y, m.z + m.d], r: Math.PI };
        case 3: return { p: [m.x + m.d, m.y, m.z], r: -Math.PI / 2 };
        default: return { p: [m.x, m.y, m.z], r: 0 };
      }
  }
}

// Kapladığı eksen hizalı kutu. ek: ön yüze eklenecek pay (kapak kalınlığı gibi)
export function kutu(m, oda, ek = 0) {
  if (m.tip.endsWith('_lkose')) ek = 0; // L köşede kapaklar kare alanın içinde kalır
  let x0, x1, z0, z1;
  const y = yon(m);
  if (m.duvar === 'arka') { x0 = m.x; x1 = m.x + m.w; z0 = 0; z1 = m.d; }
  else if (m.duvar === 'sol') { x0 = 0; x1 = m.d; z0 = m.x; z1 = m.x + m.w; }
  else if (m.duvar === 'sag') { x0 = oda.w - m.d; x1 = oda.w; z0 = m.x; z1 = m.x + m.w; }
  else if (m.duvar === 'on') { x0 = m.x; x1 = m.x + m.w; z0 = oda.d - m.d; z1 = oda.d; }
  else if (y % 2 === 0) { x0 = m.x; x1 = m.x + m.w; z0 = m.z; z1 = m.z + m.d; }
  else { x0 = m.x; x1 = m.x + m.d; z0 = m.z; z1 = m.z + m.w; }
  if (y === 0) z1 += ek; else if (y === 1) x1 += ek; else if (y === 2) z0 -= ek; else x0 -= ek;
  return { x0, x1, y0: m.y, y1: m.y + m.h, z0, z1 };
}

// Modülün yerel plan noktasını oda koordinatına çevirir: [x, z]
export function yerelNokta(m, oda, lx, lz) {
  const { p } = donusum(m, oda);
  switch (yon(m)) {
    case 1: return [p[0] + lz, p[2] - lx];
    case 2: return [p[0] - lx, p[2] - lz];
    case 3: return [p[0] - lz, p[2] + lx];
    default: return [p[0] + lx, p[2] + lz];
  }
}

// Modülün yerel plan dikdörtgenini (x: genişlik, z: derinlik) oda koordinatına çevirir
export function yerelKutu(m, oda, lx0, lx1, lz0, lz1) {
  const { p } = donusum(m, oda);
  const c = (lx, lz) => {
    switch (yon(m)) {
      case 1: return [p[0] + lz, p[2] - lx];
      case 2: return [p[0] - lx, p[2] - lz];
      case 3: return [p[0] - lz, p[2] + lx];
      default: return [p[0] + lx, p[2] + lz];
    }
  };
  const a = c(lx0, lz0), b = c(lx1, lz1);
  return { x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), z0: Math.min(a[1], b[1]), z1: Math.max(a[1], b[1]) };
}

const EPS = 0.5;
export function kesisir(a, b) {
  return a.x0 < b.x1 - EPS && a.x1 > b.x0 + EPS &&
         a.y0 < b.y1 - EPS && a.y1 > b.y0 + EPS &&
         a.z0 < b.z1 - EPS && a.z1 > b.z0 + EPS;
}

// Kertme: sade dolaplar kolon ve kirişle üst üste gelebilir, gövdeleri kertilir (kertme.js).
// Cihazlı modüller (fırın, bulaşık makinesi, buzdolabı, davlumbaz) kertilemez.
const KERTILMEZ = new Set(['alt_firin', 'alt_bulasik', 'alt_ocak', 'alt_evye', 'boy_firin', 'buzdolabi', 'boy_ankastre', 'davlumbaz', 'davlumbaz_ada', 'ust_mikro', 'alt_camasir', 'alt_sarap', 'alt_solo', 'boy_camasir']);
export const engelMi = m => m.tip === 'kolon' || m.tip === 'kiris';
export const kertilirMi = m => /^(alt|ust|boy)_/.test(m.tip) && !KERTILMEZ.has(m.tip);
const kertmeCifti = (a, b) => (engelMi(a) && kertilirMi(b)) || (engelMi(b) && kertilirMi(a));

// Tesisat noktaları (priz, anahtar, su, gider, doğalgaz) duvardaki işaretlerdir: hiçbir şeyle çakışmış sayılmaz.
const TESISAT = new Set(['priz', 'anahtar', 'su_giris', 'gider', 'dogalgaz', 'not_yazi', 'olcu_cizgi']);
export const tesisatMi = m => TESISAT.has(m.tip);

// kati: true ise kertmeye izin verilmez (otomatik yerleştirmede dolap kolonun üstüne konmasın)
export function cakisanlar(m, moduller, oda, kati = false) {
  if (tesisatMi(m)) return [];
  const a = kutu(m, oda, KAPAK_K);
  return moduller.filter(o => o.id !== m.id && !tesisatMi(o) && (kati || !kertmeCifti(m, o)) && kesisir(a, kutu(o, oda, KAPAK_K)));
}

export function serbestMi(m, moduller, oda, kati = false) {
  return cakisanlar(m, moduller, oda, kati).length === 0;
}

// Duvar boyunca yakalama noktaları: 0, duvar sonu ve diğer modüllerin kenarları
function kenarlar(m, moduller, oda) {
  const boy = duvarBoyu(m.duvar, oda);
  const s = new Set([0, boy - m.w]);
  for (const o of moduller) {
    if (o.id === m.id || tesisatMi(o) || tesisatMi(m)) continue;
    if (o.y >= m.y + m.h || o.y + o.h <= m.y) continue; // farklı kotta
    const k = kutu(o, oda, KAPAK_K);
    const [a, b] = xEksenli(m.duvar) ? [k.x0, k.x1] : [k.z0, k.z1];
    s.add(b); s.add(a - m.w);
  }
  return [...s].filter(v => v >= 0).sort((p, q) => p - q);
}

// Duvara eklenen modül için soldan ilk boş yer
export function bosYerBul(m, moduller, oda) {
  if (m.duvar === 'ada') {
    const aday = { ...m };
    for (let i = 0; i < 40; i++) {
      aday.x = Math.round((oda.w - m.w) / 2 + (i % 5) * 150 - 300);
      aday.z = Math.round(oda.d * 0.45 + Math.floor(i / 5) * 150);
      if (aday.x >= 0 && serbestMi(aday, moduller, oda, true)) return { x: aday.x, z: aday.z };
    }
    return { x: Math.round((oda.w - m.w) / 2), z: Math.round(oda.d * 0.45) };
  }
  const boy = duvarBoyu(m.duvar, oda);
  const adaylar = kenarlar(m, moduller, oda);
  const dene = x => serbestMi({ ...m, x }, moduller, oda, true);
  const ic = adaylar.find(x => x + m.w <= boy + EPS && dene(x));
  if (ic != null) return { x: Math.round(ic) };
  const dis = adaylar.find(dene);
  return { x: Math.round(dis != null ? dis : boy) };
}

// Sürüklerken: istenen konumu sınırla, komşu kenarlara yakala, çakışıyorsa en yakın boş kenara kaydır.
// Geçerli konum yoksa null döner.
export function tasimaCoz(m, istenen, moduller, oda) {
  if (m.duvar === 'ada') {
    const g = yon(m) % 2 === 0 ? [m.w, m.d] : [m.d, m.w];
    const x = Math.round(Math.min(Math.max(istenen.x, 0), Math.max(0, oda.w - g[0])) / 10) * 10;
    const z = Math.round(Math.min(Math.max(istenen.z, 0), Math.max(0, oda.d - g[1])) / 10) * 10;
    for (const aday of [{ x, z }, { x, z: m.z }, { x: m.x, z }]) {
      if (serbestMi({ ...m, ...aday }, moduller, oda)) return aday;
    }
    return null;
  }
  const boy = duvarBoyu(m.duvar, oda);
  let x = Math.min(Math.max(istenen.x, 0), Math.max(0, boy - m.w));
  const adaylar = kenarlar(m, moduller, oda).filter(v => v + m.w <= boy + EPS);
  const yakin = adaylar.reduce((en, v) => Math.abs(v - x) < Math.abs(en - x) ? v : en, Infinity);
  if (Math.abs(yakin - x) <= 40) x = yakin;
  x = Math.round(x);
  if (serbestMi({ ...m, x }, moduller, oda)) return { x };
  const bos = adaylar.filter(v => Math.abs(v - x) <= 500 && serbestMi({ ...m, x: v }, moduller, oda))
    .sort((p, q) => Math.abs(p - x) - Math.abs(q - x))[0];
  return bos != null ? { x: Math.round(bos) } : null;
}

// Bir duvarın boş kalan yerlerini standart alt ve üst dolaplarla doldurur; eklenecek modülleri döndürür.
// Kapı, pencere, kolon ve komşu duvarın dolapları boşluk hesabında dikkate alınır.
// Duvar boyunca, verilen sonda modülünün (kot, yükseklik, derinlik) kapladığı şeritte boş kalan aralıklar
export function bosAraliklar(duvar, proje, sonda) {
  const { oda, moduller } = proje, boy = duvarBoyu(duvar, oda);
  const [e0, e1] = xEksenli(duvar) ? ['x0', 'x1'] : ['z0', 'z1'];
  const s = kutu({ ...sonda, duvar, x: 0, w: boy }, oda, KAPAK_K);
  const dolu = moduller.filter(o => !tesisatMi(o)).map(o => kutu(o, oda, KAPAK_K)).filter(k => kesisir(s, k))
    .map(k => [Math.max(0, k[e0]), Math.min(boy, k[e1])]).sort((a, b) => a[0] - b[0]);
  const bos = [];
  let bas = 0;
  for (const [a, b] of dolu) { if (a - bas >= 1) bos.push([bas, a]); bas = Math.max(bas, b); }
  if (boy - bas >= 1) bos.push([bas, boy]);
  return bos;
}

// Bitiş parçaları: dolap sırasının açıkta kalan ucuna yan panel, dolap ile duvar (ya da komşu) arasındaki
// 150 mm'ye kadar boşluğa dolgu ekler. Eklenecek modülleri döndürür.
export function bitisParcalari(proje, yeniModul) {
  const { moduller } = proje, out = [];
  const HARIC = new Set(['buzdolabi', 'alt_kavis', 'ust_kavis', 'ust_kavis_acik', 'davlumbaz', 'davlumbaz_ada', 'alt_tv', 'alt_banyo', 'ust_ayna']);
  for (const duvar of ['arka', 'sol', 'sag', 'on']) {
    for (const ust of [false, true]) {
      const sira = moduller.filter(m => m.duvar === duvar && /^(alt|ust|boy)_/.test(m.tip) && !HARIC.has(m.tip)
        && (ust ? m.y >= 1000 : m.y === 0));
      if (!sira.length) continue;
      const sonda = { ...yeniModul(ust ? 'ust_kapak' : 'alt_kapak'), y: ust ? Math.min(...sira.map(m => m.y)) : 0,
        h: ust ? 300 : 800, d: ust ? 300 : 500 };
      for (const [a, b] of bosAraliklar(duvar, proje, sonda)) {
        const L = b - a;
        const solK = sira.find(m => Math.abs(m.x + m.w - a) < 2), sagK = sira.find(m => Math.abs(m.x - b) < 2);
        const ekle = (tip, x, w, kom) => out.push({ ...yeniModul(tip), duvar, x: Math.round(x), w: Math.round(w), y: kom.y, h: kom.h,
          d: tip === 'dolgu' ? kom.d : kom.d + KAPAK_K, kulp: 'yok', kapakRenk: kom.kapakRenk });
        if (L >= 5 && L <= 150 && (solK || sagK)) ekle('dolgu', a, L, solK || sagK);
        else if (L > 150) {
          if (solK) ekle('panel_yan', a, 18, solK);
          if (sagK && L > 200) ekle('panel_yan', b - 18, 18, sagK);
        }
      }
    }
  }
  return out;
}

export function boslukDoldur(duvar, proje, yeniModul) {
  const { oda } = proje, boy = duvarBoyu(duvar, oda), out = [];
  const sira = tip => {
    const bos = bosAraliklar(duvar, proje, yeniModul(tip));
    for (const [a, b] of bos) {
      const ilk = Math.ceil(a), son = Math.floor(b), L = son - ilk;
      if (L < 250) continue; // dolap sığmayacak kadar dar
      const n = Math.max(1, Math.round(L / 600));
      let x = ilk;
      for (let i = 0; i < n; i++) {
        const w = i === n - 1 ? son - x : Math.round(L / n / 10) * 10;
        const m = { ...yeniModul(tip), duvar, x, w };
        m.kapak = w >= 700 ? 2 : 1;
        m.mentese = i % 2 ? 'sag' : 'sol';
        out.push(m);
        x += w;
      }
    }
  };
  sira('alt_kapak');
  sira('ust_kapak');
  return out;
}

// Genel yüksekliğe hizalama: üst ve boy dolapların üst kenarı `hat` kotuna getirilir, davlumbaz bacası oraya uzar,
// buzdolabının üstü dolapla kapatılır. Böylece mutfağın üst çizgisi tek hizada olur.
// yalniz: verilirse yalnızca o buzdolabının üstü işlenir. Dönen: { degisen: [{ id, y?, h }], eklenen: [modül] }
export function yukseklikHizala(proje, yeniModul, hat, yalniz = null) {
  const { moduller } = proje, degisen = [], eklenen = [];
  for (const m of moduller) {
    if (yalniz && m.id !== yalniz) continue;
    const sinif = TANIM[m.tip].sinif;
    if (m.tip === 'buzdolabi') {
      const bosluk = hat - m.h;
      if (bosluk < 150) continue; // dolap sığacak yer yok
      // üstünde zaten bir dolap varsa onu hizala, yoksa yenisini ekle
      const ust = moduller.find(o => o.id !== m.id && o.duvar === m.duvar && TANIM[o.tip].sinif === 'ust' && o.y >= m.h - 20 && o.y < hat
        && (m.duvar === 'ada' ? Math.abs(o.x - m.x) < 5 && Math.abs((o.z || 0) - (m.z || 0)) < 5 : o.x < m.x + m.w - 5 && o.x + o.w > m.x + 5));
      if (ust) { if (ust.y !== m.h || ust.h !== bosluk) degisen.push({ id: ust.id, y: m.h, h: bosluk }); }
      else eklenen.push({ ...yeniModul('ust_buzustu'), duvar: m.duvar, x: m.x, z: m.z, rot: m.rot, w: m.w, d: Math.min(m.d, 600), y: m.h, h: bosluk,
        kapak: m.w >= 600 ? 2 : 1, kulp: m.kulp || 'cubuk' });
      continue;
    }
    if (yalniz) continue;
    if (sinif === 'boy' && m.y === 0 && m.h !== hat) degisen.push({ id: m.id, h: hat });
    else if (sinif === 'ust' && m.tip !== 'davlumbaz_ada' && m.y >= 1000 && m.y < hat - 150 && m.y + m.h !== hat
      && !moduller.some(b => b.tip === 'buzdolabi' && b.duvar === m.duvar && m.y >= b.h - 20 && m.x < b.x + b.w - 5 && m.x + m.w > b.x + 5)) {
      degisen.push({ id: m.id, h: hat - m.y }); // buzdolabı üstündekiler yukarıda ayrıca işlendi
    }
  }
  return { degisen, eklenen };
}
export function hizalamayiUygula(proje, sonuc) {
  for (const d of sonuc.degisen) { const m = proje.moduller.find(o => o.id === d.id); if (m) { m.h = d.h; if (d.y != null) m.y = d.y; } }
  proje.moduller.push(...sonuc.eklenen);
  return sonuc.degisen.length + sonuc.eklenen.length;
}

// Eğimli tavan: ayar.egim ={ duvar, dusuk, mesafe }. Tavan o duvarda `dusuk` yüksekliğindedir ve duvardan
// `mesafe` kadar uzaklaşınca oda yüksekliğine ulaşır. Verilen kutunun (plandaki yeri) üstündeki en düşük tavan yüksekliği.
export function tavanYuksekligi(proje, k) {
  const { oda } = proje, e = proje.ayar?.egim;
  if (!e?.duvar) return oda.h;
  const uzak = e.duvar === 'arka' ? k.z0 : e.duvar === 'on' ? oda.d - k.z1 : e.duvar === 'sol' ? k.x0 : oda.w - k.x1;
  const oran = Math.max(0, Math.min(1, uzak / Math.max(1, e.mesafe)));
  return Math.min(oda.h, e.dusuk + (oda.h - e.dusuk) * oran);
}

// Eğik kesim: çatı katında dolabın üstü kısaltılmak yerine tavanın eğimine göre kesilir (modülde egikKes işaretliyse).
// Dönen: modülün yerel ekseninde kesim düzlemi { eksen: 'x' | 'z', h0, h1 } ya da kesilecek yer yoksa null.
// eksen 'x': eğim dolabın genişliği boyunca (h0 solda, h1 sağda); 'z': derinliği boyunca (h0 arkada / duvarda, h1 önde).
// Yükseklikler modülün alt kenarından ölçülür; tavanla arada 15 mm montaj payı bırakılır.
export const EGIK_OLUR = new Set(['ust_kapak', 'ust_acik', 'ust_tepe', 'ust_cam', 'boy_kiler', 'boy_gardirop', 'ozel_ust', 'ozel_boy']);
export function egikDuzlem(m, proje) {
  const e = proje.ayar?.egim, { oda } = proje;
  if (!e?.duvar) return null;
  const H = (lx, lz) => {
    const [x, z] = yerelNokta(m, oda, lx, lz);
    const uzak = e.duvar === 'arka' ? z : e.duvar === 'on' ? oda.d - z : e.duvar === 'sol' ? x : oda.w - x;
    return Math.min(oda.h, e.dusuk + (oda.h - e.dusuk) * Math.max(0, uzak) / Math.max(1, e.mesafe)) - 15 - m.y;
  };
  const a = H(0, 0), b = H(m.w, 0), c = H(0, m.d);
  const d = Math.abs(b - a) >= Math.abs(c - a) ? { eksen: 'x', h0: a, h1: b } : { eksen: 'z', h0: a, h1: c };
  return Math.min(d.h0, d.h1) >= m.h ? null : d;
}
// Eğik kesimli modül tavana uyuyor mu: alçak ucunda en az 250 mm gövde kalmalı
export function egikUygun(m, proje) {
  if (!m.egikKes || !EGIK_OLUR.has(m.tip)) return false;
  const d = egikDuzlem(m, proje);
  return !d || Math.min(d.h0, d.h1) >= 250;
}

// Boş kalması gereken alanlar: pencerenin önü, kapının önü, kanadın açılma alanı, sürgülü kapının kayma alanı.
// Dönen: [{ k: kutu, neden, sahip: öğenin kimliği, pencere | kapi: true }]
export const PENCERE_ONU = 600; // pencerenin önünde boş bırakılan derinlik (dolap derinliği kadar)
export function acikliklar(proje) {
  const { oda, moduller } = proje, out = [];
  for (const m of moduller) {
    const alan = (lx0, lx1, lz) => ({ ...yerelKutu(m, oda, lx0, lx1, 0, lz), y0: m.y, y1: m.y + m.h });
    if (m.tip === 'pencere') out.push({ k: alan(0, m.w, PENCERE_ONU), neden: 'pencerenin önündeydi', sahip: m.id, pencere: true });
    if (m.tip !== 'kapi') continue;
    out.push({ k: alan(0, m.w, 150), neden: 'kapının önündeydi', sahip: m.id, kapi: true });
    if (m.kapiTip === 'surgu') {
      const kanat = m.w - 140, sol = m.mentese !== 'sag';
      out.push({ k: alan(sol ? -kanat : m.w, sol ? 0 : m.w + kanat, 90), neden: 'sürgülü kapının kayma alanındaydı', sahip: m.id, kapi: true });
    } else if (m.kapiTip !== 'dis') {
      out.push({ k: alan(0, m.w, m.kapiTip === 'cift' ? m.w / 2 : m.w), neden: 'kapının açılma alanındaydı', sahip: m.id, kapi: true });
    }
  }
  return out;
}

// Proje uyarıları: { id, mesaj }
export function uyarilar(proje) {
  const { oda, moduller } = proje;
  const out = [];
  const dolapGibi = o => ['alt', 'ust', 'boy'].includes(TANIM[o.tip].sinif);
  const pencereOnleri = acikliklar(proje).filter(e => e.pencere);
  for (const m of moduller) {
    const k = kutu(m, oda);
    if (m.duvar !== 'ada') {
      const boy = duvarBoyu(m.duvar, oda);
      if (m.x < -EPS || m.x + m.w > boy + EPS) out.push({ id: m.id, mesaj: 'duvardan taşıyor' });
    } else if (k.x0 < -EPS || k.z0 < -EPS || k.x1 > oda.w + EPS || k.z1 > oda.d + EPS) {
      out.push({ id: m.id, mesaj: 'odanın dışında' });
    }
    if (m.y + m.h > oda.h + EPS) out.push({ id: m.id, mesaj: 'tavandan yüksek' });
    else if (!tesisatMi(m) && m.tip !== 'pencere' && m.tip !== 'nis' && m.y + m.h > tavanYuksekligi(proje, k) + EPS && !egikUygun(m, proje)) out.push({ id: m.id, mesaj: 'eğimli tavana sığmıyor' });
    // Kanadın açılma alanı: içe açılan kapıda kapı genişliği, çift kanatta yarısı kadar derin. Dışa açılan ve sürgülüde yok.
    if (m.tip === 'kapi' && m.kapiTip !== 'dis' && m.kapiTip !== 'surgu') {
      const alan = { ...yerelKutu(m, oda, 0, m.w, 0, m.kapiTip === 'cift' ? m.w / 2 : m.w), y0: m.y, y1: m.y + m.h };
      for (const o of moduller) {
        if (o.id === m.id || tesisatMi(o) || ['pencere', 'kiris', 'sarkit', 'spot', 'plafonyer'].includes(o.tip)) continue;
        if (kesisir(alan, kutu(o, oda))) out.push({ id: o.id, mesaj: 'kapının açılma alanında' });
      }
    }
    // Sürgülü kapının kanadı açıklığın menteşe tarafındaki yanına kayar; o duvar parçası boş kalmalı
    if (m.tip === 'kapi' && m.kapiTip === 'surgu') {
      const kanat = m.w - 140, sol = m.mentese !== 'sag';
      const alan = { ...yerelKutu(m, oda, sol ? -kanat : m.w, sol ? 0 : m.w + kanat, 0, 90), y0: m.y, y1: m.y + m.h };
      for (const o of moduller) {
        if (o.id === m.id || tesisatMi(o) || o.tip === 'kiris') continue;
        if (kesisir(alan, kutu(o, oda))) out.push({ id: o.id, mesaj: 'sürgülü kapının kayma alanında' });
      }
    }
    // Asma tavan duvar kenarlarında 150 mm düşüktür; duvardaki dolap bunun altına sığmalı
    if (proje.ayar?.asmaTavan && m.duvar !== 'ada' && /^(alt|ust|boy)_|^buzdolabi$|^panel_yan$/.test(m.tip) && m.y + m.h > oda.h - 150 + EPS) {
      out.push({ id: m.id, mesaj: 'asma tavana sığmıyor' });
    }
    // Priz ve anahtar dolabın arkasında kalmamalı
    if (m.tip === 'priz' || m.tip === 'anahtar') {
      const k0 = kutu(m, oda);
      if (moduller.some(o => /^(alt|ust|boy)_|^buzdolabi$/.test(o.tip) && kesisir(k0, kutu(o, oda)))) out.push({ id: m.id, mesaj: 'dolabın arkasında kalıyor' });
    }
    // Çakışmalar: dolap pencere ya da kapıya denk geliyorsa bunu açıkça söyle; uyarı dolapta görünür, pencerede değil
    const cak = cakisanlar(m, moduller, oda);
    if (dolapGibi(m)) {
      if (pencereOnleri.some(e => kesisir(e.k, k))) out.push({ id: m.id, mesaj: 'pencerenin önünde' });
      if (cak.some(o => o.tip === 'kapi')) out.push({ id: m.id, mesaj: 'kapının önünde' });
      if (cak.some(o => o.tip !== 'pencere' && o.tip !== 'kapi')) out.push({ id: m.id, mesaj: 'başka modülle çakışıyor' });
    } else if (m.tip === 'pencere' || m.tip === 'kapi') {
      if (cak.some(o => !dolapGibi(o))) out.push({ id: m.id, mesaj: 'başka modülle çakışıyor' });
    } else if (cak.length) out.push({ id: m.id, mesaj: 'başka modülle çakışıyor' });
  }
  return out;
}
