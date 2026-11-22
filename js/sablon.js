// Otomatik mutfak kurulumu: oda ölçüsü ve yerleşim tipinden hazır bir mutfak üretir.
// Kullanıcı sonucu başlangıç olarak alır, sonra istediği gibi değiştirir.
import { yeniModul, UST_HAT, ALT_DERIN } from './moduller.js';
import { yukseklikHizala, hizalamayiUygula } from './yerlesim.js';

export const YERLESIMLER = {
  duz: 'Düz (tek duvar)', l: 'L mutfak', u: 'U mutfak', paralel: 'Paralel (karşılıklı)',
  gardirop: 'Gardırop', tvunite: 'TV ünitesi', banyo: 'Banyo', bos: 'Boş oda',
};
const MUTFAK = new Set(['duz', 'l', 'u', 'paralel']);

const KOSE = 900, UST_KOSE = 650; // L köşe dolaplarının kol boyu

// p: odası ayarlanmış boş proje. Modülleri p.moduller'e ekler; kullanıcıya gösterilecek notları döndürür.
export function mutfakOlustur(sec, p) {
  const { w: W, d: D } = p.oda, notlar = [];
  const kulp = p.ayar?.kulp || 'cubuk';
  const e = (tip, duvar, x, ek = {}) => {
    const m = { ...yeniModul(tip), duvar, x: Math.round(x), kulp, ...ek };
    p.moduller.push(m);
    return m;
  };
  // a..b arasını yaklaşık 60 cm'lik dolaplarla doldurur
  const doldur = (duvar, a, b, ust) => {
    a = Math.round(a); b = Math.round(b);
    const L = b - a;
    if (L < 150) return;
    const n = Math.max(1, Math.round(L / 600));
    let x = a;
    for (let i = 0; i < n; i++) {
      const w = i === n - 1 ? b - x : Math.round(L / n / 10) * 10;
      const tip = ust ? 'ust_kapak' : i === 0 && w >= 400 ? 'alt_cekmece' : 'alt_kapak';
      const ek = { w, mentese: i % 2 ? 'sag' : 'sol' };
      if (tip !== 'alt_cekmece') ek.kapak = w >= 700 ? 2 : 1;
      e(tip, duvar, x, ek);
      x += w;
    }
  };
  // a..b alt hattına ocağı ortalar, iki yanını doldurur; üstte ua..ub arasına davlumbaz ve üst dolaplar koyar.
  // kule: ayrı fırın kulesi varsa ocak altı çekmeceli, yoksa ankastre fırınlı olur.
  const ocakHatti = (duvar, a, b, ua, ub, kule) => {
    const L = b - a;
    let wO = kule && L >= 2100 ? 900 : 600;
    if (L < wO) { doldur(duvar, a, b, false); doldur(duvar, ua, ub, true); notlar.push('Ocak için yer kalmadı.'); return; }
    let g = L - wO, sol = g >= 500 ? Math.round(g / 2 / 10) * 10 : g, sag = g - sol;
    if (sag > 0 && sag < 150) { sol += sag; sag = 0; }
    if (sol > 0 && sol < 150) { wO += sol; sol = 0; } // dar artığı ocak dolabına kat
    doldur(duvar, a, a + sol, false);
    e(kule ? 'alt_ocak' : 'alt_firin', duvar, a + sol, { w: wO });
    doldur(duvar, a + sol + wO, b, false);
    doldur(duvar, ua, a + sol, true);
    e('davlumbaz', duvar, a + sol, { w: wO });
    doldur(duvar, a + sol + wO, ub, true);
  };
  // Evye grubu: bulaşık makinesi + evye, a'dan başlar; bittiği yeri döndürür
  const evyeGrubu = (duvar, a, son) => {
    let x = a;
    if (son - a >= 2000) { e('alt_bulasik', duvar, x); x += 600; }
    e('alt_evye', duvar, x);
    return x + 800;
  };

  // Dar oda: sığmayan yerleşim yerine sığan daha küçük düzen kurulur ve kullanıcıya bildirilir.
  // U için iki köşe dolabı ile arada ocak (2400 mm) ve yan sıralarda evye/buzdolabı (1700 mm) gerekir;
  // L için köşe dolabı ile evye (1700 mm) ve yan sırada ocak (1500 mm) gerekir.
  if (sec.tip === 'u' && (W < 2400 || D < 1700)) {
    return ['Oda U mutfak için dar; L mutfak kuruldu.', ...mutfakOlustur({ ...sec, tip: 'l' }, p)];
  }
  if (sec.tip === 'l' && (W < 1700 || D < 1500)) {
    return ['Oda L mutfak için dar; düz mutfak kuruldu.', ...mutfakOlustur({ ...sec, tip: 'duz' }, p)];
  }

  switch (sec.tip) {
    case 'duz': {
      // Sıra: buzdolabı, bulaşık makinesi, evye, tezgah, ocak, kalan dolaplar, (fırın kulesi).
      // Buzdolabı evyenin yanında durur ki çalışma üçgeni kısa kalsın.
      const kule = W >= 4500, son = W - (kule ? 600 : 0);
      let x = 0;
      if (son >= 1500) { e('buzdolabi', 'arka', 0); x = 700; } // çok dar duvarda buzdolabına yer kalmaz
      else notlar.push('Buzdolabı için yer kalmadı.');
      if (kule) e('boy_firin', 'arka', son);
      if (son - x >= 2400) { e('alt_bulasik', 'arka', x); x += 600; }
      const evyeW = Math.min(800, son - x);
      const evye = e('alt_evye', 'arka', x, { w: evyeW });
      x += evyeW;
      let wO = kule ? 900 : 600, kalan = son - x - wO;
      const ustBas = Math.min(x, 700); // buzdolabı varsa üst dolaplar onun bittiği yerden başlar
      if (kalan < 0) { doldur('arka', x, son, false); doldur('arka', ustBas, son, true); notlar.push('Ocak için yer kalmadı.'); break; }
      let f = kalan >= 1000 ? 600 : Math.min(kalan, 600); // evye ile ocak arasındaki tezgah
      if (f > 0 && f < 150) { evye.w += f; x += f; f = 0; }
      let sonra = son - (x + f + wO);
      if (sonra > 0 && sonra < 150) { wO += sonra; sonra = 0; }
      doldur('arka', x, x + f, false);
      e(kule ? 'alt_ocak' : 'alt_firin', 'arka', x + f, { w: wO });
      doldur('arka', x + f + wO, son, false);
      doldur('arka', ustBas, x + f, true);
      e('davlumbaz', 'arka', x + f, { w: wO });
      doldur('arka', x + f + wO, son, true);
      break;
    }
    case 'l': {
      // Arka: köşe, evye, bulaşık makinesi, buzdolabı, (fırın kulesi). Sol: köşenin yanında ocak, sonra dolaplar.
      // Üç nokta köşenin çevresinde toplanır; arka duvarın kalanı boş bırakılır (istenirse "Boş yerleri doldur").
      e('alt_lkose', 'arka', 0); e('ust_lkose', 'arka', 0);
      let x = KOSE, ustSon;
      if (W - x >= 800) { e('alt_evye', 'arka', x); x += 800; } else notlar.push('Evye için yer kalmadı.');
      if (W - x >= 1300) { e('alt_bulasik', 'arka', x); x += 600; }
      ustSon = x;
      let kule = false;
      if (W - x >= 700) {
        e('buzdolabi', 'arka', x); x += 700;
        kule = W - x >= 600;
        if (kule) { e('boy_firin', 'arka', x); x += 600; }
      } else notlar.push('Buzdolabı için yer kalmadı.');
      doldur('arka', UST_KOSE, ustSon, true);
      if (W - x >= 600) notlar.push('Arka duvarın kalanı boş bırakıldı; "Boş yerleri doldur" ile tamamlayabilirsiniz.');
      const E = Math.min(D, 3300), wO = kule && E - KOSE >= 1500 ? 900 : 600;
      if (E - KOSE < wO) { notlar.push('Ocak için yer kalmadı.'); doldur('sol', UST_KOSE, E, true); break; }
      e(kule ? 'alt_ocak' : 'alt_firin', 'sol', KOSE, { w: wO });
      e('davlumbaz', 'sol', KOSE, { w: wO });
      doldur('sol', KOSE + wO, E, false);
      doldur('sol', UST_KOSE, KOSE, true);
      doldur('sol', KOSE + wO, E, true);
      break;
    }
    case 'u': {
      e('alt_lkose', 'arka', 0); e('ust_lkose', 'arka', 0);
      e('alt_lkose', 'arka', W - KOSE, { korYon: 'sag' }); e('ust_lkose', 'arka', W - UST_KOSE, { korYon: 'sag' });
      // Arka ortada ocak, solda köşenin yanında evye, sağda köşenin yanında buzdolabı
      const E = Math.min(D, 3500), kule = E - KOSE >= 1900;
      ocakHatti('arka', KOSE, W - KOSE, UST_KOSE, W - UST_KOSE, kule);
      e('alt_evye', 'sol', KOSE);
      let z = KOSE + 800;
      if (E - z >= 600) { e('alt_bulasik', 'sol', z); z += 600; }
      doldur('sol', z, E, false);
      doldur('sol', UST_KOSE, E, true);
      e('buzdolabi', 'sag', KOSE);
      let boySon = KOSE + 700;
      if (kule) { e('boy_firin', 'sag', boySon); boySon += 600; }
      doldur('sag', boySon, E, false);
      doldur('sag', UST_KOSE, KOSE, true);
      doldur('sag', boySon, E, true);
      break;
    }
    case 'gardirop': { // arka duvar boyunca, yaklaşık 1 m'lik çift kapaklı gövdeler
      const n = Math.max(1, Math.round(W / 1000)), h = Math.min(2400, p.oda.h);
      let x = 0;
      for (let i = 0; i < n; i++) {
        const w = i === n - 1 ? W - x : Math.round(W / n / 10) * 10;
        e('boy_gardirop', 'arka', x, { w, h, kapak: w >= 700 ? 2 : 1, raf: i % 2 ? 3 : 0 });
        x += w;
      }
      break;
    }
    case 'tvunite': { // ortada alçak ünite ve televizyon, iki yanında açık raflar
      const w = Math.min(2000, Math.max(1200, W - 1400), W), x = Math.round((W - w) / 2 / 10) * 10;
      e('alt_tv', 'arka', x, { w });
      const tw = Math.min(1250, W - 100); // dar duvarda televizyon da küçülür (en-boy oranı korunur)
      e('tv', 'arka', Math.round((W - tw) / 2), { w: tw, h: Math.round(tw * 0.576) });
      if (x >= 650) {
        for (const rx of [x - 620, x + w + 20]) for (const y of [1250, 1700]) e('ust_acik', 'arka', rx, { w: 600, h: 350, d: 260, y, raf: 0 });
      }
      break;
    }
    case 'banyo': { // lavabolu dolap, üstünde aynalı dolap, yanında dar boy dolap
      const w = W >= 1700 ? 1000 : 800, boy = W >= w + 500;
      const x = Math.max(0, Math.round((W - w - (boy ? 420 : 0)) / 2 / 10) * 10);
      e('alt_banyo', 'arka', x, { w });
      e('ust_ayna', 'arka', x, { w });
      if (boy) e('boy_kiler', 'arka', x + w + 20, { w: 400, d: 350, h: Math.min(1900, p.oda.h), raf: 4 });
      break;
    }
    case 'paralel': {
      if (W < 2060) { // iki sıra arasında 900 mm geçiş kalmıyor: her şey sol duvarda tek sıra
        notlar.push('Oda karşılıklı iki sıra için dar; sol duvarda tek sıra kuruldu.');
        const E = Math.min(D, 4200), buzVar = E >= 1500, son = E - (buzVar ? 700 : 0);
        if (buzVar) e('buzdolabi', 'sol', son); else notlar.push('Buzdolabı için yer kalmadı.');
        let x = 0;
        if (son >= 2600) { e('alt_bulasik', 'sol', 0); x = 600; }
        const ew = Math.min(800, son - x);
        e('alt_evye', 'sol', x, { w: ew });
        x += ew;
        doldur('sol', 0, x, true);
        if (son - x >= 150) ocakHatti('sol', x, son, x, son, false);
        break;
      }
      const E = Math.min(D, 3600), kule = E >= 3300, boyBas = E - 700 - (kule ? 600 : 0);
      const z = evyeGrubu('sol', 0, E);
      doldur('sol', z, E, false);
      doldur('sol', 0, E, true);
      if (kule) e('boy_firin', 'sag', boyBas);
      e('buzdolabi', 'sag', E - 700);
      ocakHatti('sag', 0, boyBas, 0, boyBas, kule);
      if (W < 2400) notlar.push('İki sıra arasında geçiş dar kalıyor; oda genişliği en az 2400 mm olmalı.');
      break;
    }
  }

  // Ada: arka tezgahla arasında 115 cm geçiş bırakır
  if (sec.ada && MUTFAK.has(sec.tip)) {
    const xl = sec.tip === 'duz' ? 600 : sec.tip === 'paralel' ? 1700 : 1600;
    const xr = sec.tip === 'u' || sec.tip === 'paralel' ? W - 1700 : W - 900;
    const aw = xr - xl >= 2000 ? 2000 : xr - xl >= 1400 ? 1400 : 0;
    const z = sec.tip === 'paralel' ? Math.round(D * 0.35) : 1750;
    if (!aw || D < z + ALT_DERIN + 900) notlar.push('Ada için yeterli yer yok; ada eklenmedi.');
    else {
      const x0 = Math.round((xl + xr - aw) / 2 / 10) * 10;
      e('alt_kapak', 'ada', x0, { z, rot: 2, w: 800, kapak: 2 });
      e('alt_cekmece', 'ada', x0 + 800, { z, rot: 2 });
      if (aw === 2000) e('alt_kapak', 'ada', x0 + 1400, { z, rot: 2 });
      if (D >= z + ALT_DERIN + 1300) {
        const n = aw === 2000 ? 3 : 2;
        for (let i = 0; i < n; i++) e('tabure', 'ada', x0 + (aw / n) * (i + 0.5) - 190, { z: z + 650, rot: 0 });
      }
    }
  }
  // Buzdolabının üstü dolapla kapatılır, üst çizgi genel yükseklikte tek hizada biter
  if (MUTFAK.has(sec.tip)) hizalamayiUygula(p, yukseklikHizala(p, yeniModul, Math.min(UST_HAT, p.oda.h)));
  return notlar;
}
