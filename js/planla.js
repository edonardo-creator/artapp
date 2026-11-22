// Akıllı planlama: sihirbazın kurduğu mutfağı odadaki pencere ve kapıya göre düzenler.
// - Ocak pencerenin altına denk geliyorsa yanındaki sade dolapla yer değiştirir (davlumbaz ocakla birlikte gider).
// - Evye, penceresi olan duvardaysa pencerenin altına alınır; bulaşık makinesi yanında kalır.
// - Üst dolap sırası boşluklara göre yeniden kurulur: pencerenin iki yanı dolar, önü boş kalır.
// - Kalan çakışmalar (kapı, tavan) çakışma gidermeyle temizlenir.
// 3B kütüphaneye bağlı değildir.
import { TANIM, yeniModul } from './moduller.js';
import { bosAraliklar, DUVARLAR } from './yerlesim.js';
import { cakismalariGider } from './duzelt.js';

const SADE = new Set(['alt_kapak', 'alt_cekmece']);
const OCAKLI = new Set(['alt_ocak', 'alt_firin', 'alt_solo']);
const yakin = (a, b) => Math.abs(a - b) < 2;

// Bir duvardaki, yeri değiştirilebilen tezgahlı alt modüller (köşe, kavis ve bitiş parçaları hariç), soldan sağa
const altSira = (p, duvar) => p.moduller.filter(m => m.duvar === duvar && m.y === 0 && TANIM[m.tip].sinif === 'alt' && TANIM[m.tip].tezgah
  && !/_lkose$|_kose$|kavis|^panel_yan$|^dolgu$/.test(m.tip)).sort((a, b) => a.x - b.x);

// İki modülün sıradaki yerini değiştirir; aradakiler kaydırılır. Yalnızca aynı bitişik koşudaysalar yapılır.
function yerDegis(p, duvar, a, b) {
  const l = altSira(p, duvar), i = l.indexOf(a), j = l.indexOf(b);
  if (i < 0 || j < 0 || i === j) return false;
  const lo = Math.min(i, j), hi = Math.max(i, j);
  for (let k = lo; k < hi; k++) if (!yakin(l[k].x + l[k].w, l[k + 1].x)) return false;
  const dilim = l.slice(lo, hi + 1);
  [dilim[0], dilim[dilim.length - 1]] = [dilim[dilim.length - 1], dilim[0]];
  let x = l[lo].x;
  for (const m of dilim) { m.x = x; x += m.w; }
  return true;
}

// Dönen: yapılan değişikliklerin notları
export function pencereyeGoreDuzenle(p) {
  const notlar = [], degisen = new Set();
  for (const pen of p.moduller.filter(m => m.tip === 'pencere' && m.duvar !== 'ada' && m.y >= 880)) {
    const duvar = pen.duvar, p0 = pen.x, p1 = pen.x + pen.w, orta = (p0 + p1) / 2;
    const altinda = m => m.x < p1 - 50 && m.x + m.w > p0 + 50;
    // ocak yer değiştirirse (kendi taşınsa da, başka bir değişim yüzünden kaysa da) davlumbazı onunla gider
    const ciftler = altSira(p, duvar).filter(m => OCAKLI.has(m.tip)).map(o => [o, p.moduller.find(d => d.tip === 'davlumbaz' && d.duvar === duvar && d.x < o.x + o.w - 5 && d.x + d.w > o.x + 5)]).filter(c => c[1]);
    // 1) Ocak pencerenin altında olmasın
    for (const ocak of altSira(p, duvar).filter(m => OCAKLI.has(m.tip) && altinda(m))) {
      const adaylar = altSira(p, duvar).filter(m => SADE.has(m.tip) && !altinda(m)).sort((a, b) => Math.abs(a.x - ocak.x) - Math.abs(b.x - ocak.x));
      for (const aday of adaylar) {
        const yedek = altSira(p, duvar).map(m => [m, m.x]);
        if (yerDegis(p, duvar, ocak, aday) && !altinda(ocak)) {
          notlar.push(`Ocak (${DUVARLAR[duvar]}) pencerenin altından çekildi.`); degisen.add(duvar);
          break;
        }
        for (const [m, x] of yedek) m.x = x;
      }
    }
    // 2) Evye bu duvardaysa pencerenin altına gelsin
    const evye = altSira(p, duvar).find(m => m.tip === 'alt_evye');
    if (evye && !(evye.x <= orta && evye.x + evye.w >= orta)) {
      const hedef = altSira(p, duvar).find(m => m !== evye && SADE.has(m.tip) && m.x <= orta && m.x + m.w >= orta);
      const bitisik = (a, b) => yakin(a.x + a.w, b.x) || yakin(b.x + b.w, a.x);
      const bul = altSira(p, duvar).find(m => m.tip === 'alt_bulasik' && bitisik(m, evye));
      if (hedef && yerDegis(p, duvar, evye, hedef)) {
        notlar.push(`Evye (${DUVARLAR[duvar]}) pencerenin altına alındı.`); degisen.add(duvar);
        if (bul && !bitisik(bul, evye)) { // bulaşık makinesi evyenin yanında kalsın
          const komsu = altSira(p, duvar).find(m => SADE.has(m.tip) && bitisik(m, evye));
          if (komsu) yerDegis(p, duvar, bul, komsu);
        }
      }
    }
    for (const [o, d] of ciftler) { d.x = o.x; d.w = o.w; }
    degisen.add(duvar); // penceresi olan duvarda üst sıra her durumda yeniden kurulur
  }
  return { notlar, duvarlar: [...degisen] };
}

// Bir duvarın sade üst dolaplarını kaldırıp boşluklara yeniden dizer. Üst dolap yalnızca altında alt ya da boy
// dolap olan bölümlere konur; pencere, davlumbaz, köşe dolabı ve boy dolaplar boşluk hesabında dolu sayılır.
export function ustSirayiYenile(p, duvar) {
  const sade = m => m.duvar === duvar && m.tip === 'ust_kapak' && !m.bolme && !m.donanim;
  const ornek = p.moduller.find(sade);
  if (!ornek && !p.moduller.some(m => m.duvar === duvar && TANIM[m.tip].sinif === 'ust')) return 0; // bu duvarda üst sıra hiç yoktu
  p.moduller = p.moduller.filter(m => !sade(m));
  // altı dolu bölümler
  const alt = p.moduller.filter(m => m.duvar === duvar && m.y === 0 && ['alt', 'boy'].includes(TANIM[m.tip].sinif)).map(m => [m.x, m.x + m.w]).sort((a, b) => a[0] - b[0]);
  const dolu = [];
  for (const [a, b] of alt) { const son = dolu[dolu.length - 1]; if (son && a <= son[1] + 2) son[1] = Math.max(son[1], b); else dolu.push([a, b]); }
  const sonda = { ...yeniModul('ust_kapak'), ...(ornek ? { y: ornek.y, h: ornek.h, d: ornek.d } : {}) };
  let eklenen = 0;
  for (const [b0, b1] of bosAraliklar(duvar, p, sonda)) {
    for (const [d0, d1] of dolu) {
      const ilk = Math.ceil(Math.max(b0, d0)), son = Math.floor(Math.min(b1, d1)), L = son - ilk;
      if (L < 250) continue;
      const n = Math.max(1, Math.round(L / 600));
      let x = ilk;
      for (let i = 0; i < n; i++) {
        const w = i === n - 1 ? son - x : Math.round(L / n / 10) * 10;
        p.moduller.push({ ...sonda, id: yeniModul('ust_kapak').id, duvar, x, w, kapak: w >= 700 ? 2 : 1, mentese: i % 2 ? 'sag' : 'sol',
          kulp: ornek?.kulp || p.ayar?.kulp || 'cubuk' });
        x += w; eklenen++;
      }
    }
  }
  return eklenen;
}

// Alt sıradaki iç boşlukları (iki yanında dolap olan, bir dolabın çekilmesiyle açılmış aralıkları) sade alt dolapla doldurur.
// Sıranın açık uçlarına dokunmaz. Dönen: eklenen modüller
export function altBosluklariDoldur(p, duvar) {
  const sira = p.moduller.filter(m => m.duvar === duvar && m.y === 0 && ['alt', 'boy'].includes(TANIM[m.tip].sinif));
  const ornek = sira.find(m => SADE.has(m.tip)), eklenen = [];
  for (const [b0, b1] of bosAraliklar(duvar, p, yeniModul('alt_kapak'))) {
    const ilk = Math.ceil(b0), son = Math.floor(b1), L = son - ilk;
    if (L < 250 || L > 2400) continue;
    if (!sira.some(m => yakin(m.x + m.w, b0)) || !sira.some(m => yakin(m.x, b1))) continue; // iki yanında da dolap olmalı
    const n = Math.max(1, Math.round(L / 600));
    let x = ilk;
    for (let i = 0; i < n; i++) {
      const w = i === n - 1 ? son - x : Math.round(L / n / 10) * 10;
      const m = { ...yeniModul('alt_kapak'), duvar, x, w, kapak: w >= 700 ? 2 : 1, mentese: i % 2 ? 'sag' : 'sol', kulp: ornek?.kulp || p.ayar?.kulp || 'cubuk' };
      p.moduller.push(m); eklenen.push(m);
      x += w;
    }
  }
  return eklenen;
}

// Sihirbaz sonrası tek çağrı: pencereye göre düzenle, üst sırayı yenile, kalan çakışmaları gider.
// Dönen: kullanıcıya gösterilecek notlar
export function akilliPlanla(p) {
  const { notlar, duvarlar } = pencereyeGoreDuzenle(p);
  for (const d of duvarlar) ustSirayiYenile(p, d);
  const s = cakismalariGider(p);
  // kapı yüzünden kaldırılan üst dolapların bıraktığı boşluklar: o duvarlarda üst sıra yeniden dizilir (açıklıklar boş kalır)
  if (s.toplam) {
    const etkilenen = new Set(p.moduller.filter(m => m.tip === 'kapi' && m.duvar !== 'ada').map(m => m.duvar));
    for (const d of etkilenen) if (!duvarlar.includes(d)) ustSirayiYenile(p, d);
    const s2 = cakismalariGider(p);
    s.notlar.push(...s2.notlar); s.toplam += s2.toplam;
  }
  // Çekilen dolapların alt sırada bıraktığı iç boşluklar dolar; dolan yer pencerenin altındaysa evye oraya alınabilir
  const tum = [...notlar, ...s.notlar];
  let dolan = 0;
  for (const d of new Set(p.moduller.filter(m => (m.tip === 'pencere' || m.tip === 'kapi') && m.duvar !== 'ada').map(m => m.duvar))) {
    const yeni = altBosluklariDoldur(p, d);
    if (yeni.length) { dolan += yeni.length; cakismalariGider(p, new Set(yeni.map(m => m.id))); }
  }
  if (dolan) {
    tum.push(`Alt sırada açılan boşluğa ${dolan} dolap eklendi.`);
    const ikinci = pencereyeGoreDuzenle(p);
    for (const d of ikinci.duvarlar) ustSirayiYenile(p, d);
    tum.push(...ikinci.notlar, ...cakismalariGider(p).notlar);
  }
  return tum;
}
