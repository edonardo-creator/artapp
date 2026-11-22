// Çakışma giderme: pencerenin önüne, kapının önüne ya da açılma alanına denk gelen ve eğimli / asma tavana
// sığmayan modülleri düzeltir. Sıra: önce daralt ya da kısalt, olmuyorsa uygun boş yere taşı, o da olmuyorsa kaldır.
// Oda öğelerine (kapı, pencere, kolon, kiriş), tesisata ve lambalara dokunulmaz. 3B kütüphaneye bağlı değildir.
import { TANIM, KAPAK_K } from './moduller.js';
import { kutu, kesisir, duvarBoyu, xEksenli, DUVARLAR, DUVAR_LISTE, serbestMi, tavanYuksekligi, acikliklar, egikDuzlem, egikUygun, EGIK_OLUR } from './yerlesim.js';

// Genişliği değiştirilebilen sade dolaplar (cihazlı ve köşe modülleri daraltılmaz)
export const DARALIR = new Set(['alt_kapak', 'alt_cekmece', 'alt_sise', 'ust_kapak', 'ust_cam', 'ust_acik', 'ust_tepe', 'boy_kiler', 'boy_gardirop', 'ozel_alt', 'ozel_ust', 'ozel_boy']);
// Yeri başka bir modüle bağlı olanlar: taşınmaz, sığmıyorsa kaldırılır
const BAGLI = new Set(['davlumbaz', 'davlumbaz_ada', 'ust_buzustu', 'panel_yan', 'dolgu']);
// Yeri odanın köşesine ya da sıranın ucuna bağlı olanlar: taşınmaz
const DUVARA_BAGLI = /_lkose$|_kose$|kavis/;
const YER_MOBILYASI = new Set(['tabure', 'masa', 'sandalye']);
// Vazgeçilmez cihazlar: kendi duvarında yer yoksa başka duvara taşınır. Sade dolaplar başka duvara atılmaz;
// kendi duvarında yer yoksa kaldırılır (tek başına, yersiz bir dolap kalmasın).
const CIHAZ = new Set(['buzdolabi', 'boy_firin', 'boy_ankastre', 'boy_camasir', 'alt_evye', 'alt_ocak', 'alt_firin', 'alt_bulasik', 'alt_camasir', 'alt_solo']);
const EN_DAR = 200;

const dolapMi = m => ['alt', 'ust', 'boy'].includes(TANIM[m.tip].sinif);
const hedefMi = m => dolapMi(m) || YER_MOBILYASI.has(m.tip);

// Bir modül en az hangi yüksekliğe kadar kısaltılabilir; kısaltılamıyorsa Infinity
export function enAzYukseklik(m) {
  const sinif = TANIM[m.tip].sinif;
  if (sinif === 'ust') return m.tip === 'davlumbaz' || m.tip === 'davlumbaz_ada' ? 300 : m.tip === 'ust_mikro' ? 650 : m.tip.includes('kavis') || m.tip === 'ust_lkose' ? 400 : 250;
  if (sinif === 'boy') return { boy_kiler: 1200, boy_gardirop: 1500, boy_vestiyer: 1400, ozel_boy: 1000, boy_firin: 1720 }[m.tip] || Infinity;
  return Infinity; // alt dolaplar ve cihazlar sabit yüksekliktedir
}

// Modülün bulunduğu yerde izin verilen en yüksek üst kot (eğimli tavan, asma tavan, oda yüksekliği)
export function tavanSiniri(proje, m) {
  const egimli = tavanYuksekligi(proje, kutu(m, proje.oda));
  return Math.min(egimli, proje.ayar?.asmaTavan && m.duvar !== 'ada' ? proje.oda.h - 150 : proje.oda.h);
}

const duvarAdi = m => DUVARLAR[m.duvar] || m.duvar;

// yalniz: verilirse yalnızca bu kimlikteki modüller düzeltilir (otomatik eklenenler için).
// Projeyi yerinde değiştirir. Dönen: { notlar: [metin], daraltilan, kisaltilan, tasinan, silinen, toplam }
export function cakismalariGider(proje, yalniz = null) {
  const { oda } = proje, engeller = acikliklar(proje);
  const sonuc = { notlar: [], daraltilan: 0, kisaltilan: 0, egik: 0, tasinan: 0, silinen: 0, toplam: 0 };
  const yaz = (tur, m, metin) => { sonuc[tur]++; sonuc.toplam++; sonuc.notlar.push(`${TANIM[m.tip].ad} (${duvarAdi(m)}): ${metin}`); };
  const engelBul = aday => { const k = kutu(aday, oda, KAPAK_K), yer = YER_MOBILYASI.has(aday.tip); return engeller.find(e => (!yer || e.kapi) && e.sahip !== aday.id && kesisir(e.k, k)); };
  // eğik kesimli dolap eğime uyar; yalnızca düz sınırlara (asma tavan, oda yüksekliği) sığması gerekir
  const duzSinir = aday => proje.ayar?.asmaTavan && aday.duvar !== 'ada' ? oda.h - 150 : oda.h;
  const sigar = aday => egikUygun(aday, proje) ? aday.y + aday.h <= duzSinir(aday) + 0.5 : aday.y + aday.h <= tavanSiniri(proje, aday) + 0.5;
  const uygun = (aday, digerleri) => {
    if (aday.duvar !== 'ada' && (aday.x < 0 || aday.x + aday.w > duvarBoyu(aday.duvar, oda) + 0.5)) return false;
    return serbestMi(aday, digerleri, oda, true) && !engelBul(aday) && sigar(aday);
  };

  // Engelin duvar eksenindeki izdüşümünün dışında kalan en geniş parça
  const daralt = (m, e, digerleri) => {
    if (m.duvar === 'ada' || !DARALIR.has(m.tip)) return null;
    const [o0, o1] = xEksenli(m.duvar) ? [e.k.x0, e.k.x1] : [e.k.z0, e.k.z1];
    const sol = [m.x, Math.min(m.x + m.w, Math.floor(o0))], sag = [Math.max(m.x, Math.ceil(o1)), m.x + m.w];
    for (const [a, b] of [sol, sag].sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]))) {
      if (b - a < EN_DAR) continue;
      const aday = { ...m, x: Math.round(a), w: Math.round(b - a) };
      if (m.kapak) aday.kapak = aday.w >= 700 ? 2 : 1;
      if (uygun(aday, digerleri)) return { x: aday.x, w: aday.w, ...(m.kapak ? { kapak: aday.kapak } : {}) };
    }
    return null;
  };

  // Uygun boş yer: kendi duvarında eski yerine en yakın nokta; cihazlar için sonra diğer duvarlar
  const yerBul = (m, digerleri) => {
    if (BAGLI.has(m.tip) || DUVARA_BAGLI.test(m.tip)) return null; // köşe ve kavis dolapları yerinden oynatılmaz
    if (m.duvar === 'ada') {
      const g = (m.rot || 0) % 2 === 0 ? [m.w, m.d] : [m.d, m.w];
      let en = null;
      for (let x = 0; x <= oda.w - g[0]; x += 100) for (let z = 0; z <= oda.d - g[1]; z += 100) {
        const u = Math.hypot(x - m.x, z - m.z);
        if ((!en || u < en.u) && uygun({ ...m, x, z }, digerleri)) en = { x, z, u };
      }
      return en ? { x: en.x, z: en.z } : null;
    }
    const duvarlar = !CIHAZ.has(m.tip) ? [m.duvar] : [m.duvar, ...DUVAR_LISTE.filter(d => d !== m.duvar)];
    for (const duvar of duvarlar) {
      const boy = duvarBoyu(duvar, oda), adaylar = [];
      for (let x = 0; x <= boy - m.w; x += 50) adaylar.push(x);
      adaylar.push(Math.max(0, boy - m.w));
      if (duvar === m.duvar) adaylar.sort((a, b) => Math.abs(a - m.x) - Math.abs(b - m.x));
      for (const x of adaylar) if (uygun({ ...m, duvar, x }, digerleri)) return { duvar, x: Math.round(x) };
    }
    return null;
  };

  for (const m of [...proje.moduller]) {
    if (!hedefMi(m) || (yalniz && !yalniz.has(m.id))) continue;
    for (let tur = 0; tur < 4 && proje.moduller.includes(m); tur++) {
      const e = engelBul(m), sinir = tavanSiniri(proje, m);
      if (!e && sigar(m)) break;
      const digerleri = proje.moduller.filter(o => o !== m);
      const neden = e ? e.neden : proje.ayar?.egim?.duvar && tavanYuksekligi(proje, kutu(m, oda)) < oda.h ? 'eğimli tavana sığmıyordu' : 'tavana sığmıyordu';
      if (e) {
        const d = daralt(m, e, digerleri);
        if (d) { Object.assign(m, d); yaz('daraltilan', m, `${neden}, ${m.w} mm'ye daraltıldı`); continue; }
      } else {
        // sade dolap kısaltılmaz, üstü tavanın eğimine göre kesilir (alçak ucunda en az 250 mm kalıyorsa)
        const duzlem = EGIK_OLUR.has(m.tip) && !m.egikKes ? egikDuzlem(m, proje) : null;
        if (duzlem && Math.min(duzlem.h0, duzlem.h1) >= 250) {
          m.egikKes = 1;
          if (m.y + m.h > duzSinir(m)) m.h = Math.floor(duzSinir(m) - m.y);
          yaz('egik', m, `${neden}, üstü tavanın eğimine göre kesildi`);
          continue;
        }
        const yh = Math.floor(sinir - m.y);
        if (yh >= enAzYukseklik(m)) { m.h = yh; yaz('kisaltilan', m, `${neden}, ${yh} mm'ye kısaltıldı`); continue; }
      }
      const yer = yerBul(m, digerleri);
      if (yer) {
        const eskiDuvar = duvarAdi(m);
        Object.assign(m, yer);
        yaz('tasinan', m, `${neden}, ${yer.duvar && DUVARLAR[yer.duvar] !== eskiDuvar ? eskiDuvar + ' üzerinden buraya' : 'boş yere'} taşındı`);
        continue;
      }
      proje.moduller.splice(proje.moduller.indexOf(m), 1);
      yaz('silinen', m, `${neden}, uygun yer bulunamadığı için kaldırıldı`);
    }
  }
  // Altındaki buzdolabı taşınmış ya da kaldırılmışsa buzdolabı üstü dolap da kaldırılır
  for (const m of [...proje.moduller]) {
    if (m.tip !== 'ust_buzustu' || (yalniz && !yalniz.has(m.id))) continue;
    const altinda = proje.moduller.some(b => b.tip === 'buzdolabi' && b.duvar === m.duvar && b.x < m.x + m.w - 5 && b.x + b.w > m.x + 5);
    if (!altinda && sonuc.toplam) { proje.moduller.splice(proje.moduller.indexOf(m), 1); yaz('silinen', m, 'altındaki buzdolabı yer değiştirdiği için kaldırıldı'); }
  }
  return sonuc;
}

// Kullanıcıya gösterilecek kısa özet
export function giderOzeti(s) {
  if (!s.toplam) return '';
  const say = [[s.daraltilan, 'daraltıldı'], [s.egik, 'eğik kesildi'], [s.kisaltilan, 'kısaltıldı'], [s.tasinan, 'taşındı'], [s.silinen, 'kaldırıldı']].filter(x => x[0]).map(x => `${x[0]} modül ${x[1]}`).join(', ');
  return `Çakışmalar giderildi: ${say}.\n\n` + s.notlar.slice(0, 10).map(n => '• ' + n).join('\n') + (s.notlar.length > 10 ? `\n… ve ${s.notlar.length - 10} değişiklik daha` : '') + '\n\nGeri al (Ctrl + Z) ile eski haline dönebilirsiniz.';
}
