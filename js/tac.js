// Taç: üst ve boy dolapların üstünde dönen bitiş çıtası.
// 3B çizim, teknik çizim, kesim listesi, maliyet ve teklif aynı sonucu buradan alır; çizilen ile listelenen birbirini tutar.
// Modeller eB Creator'daki taç kataloğundan alındı (TACM): düz MDF taç atölyede kapak levhasından kesilir,
// lake taçlar hazır (boyalı) alınır ve metreyle hesaplanır. Taç tek renktir (üst kapak rengi ya da alt ve boy kapak rengi).
import { TANIM, KAPAK_K, TAC } from './moduller.js';
import { yerelKutu, yon, kutu } from './yerlesim.js';
import { parcaRengi } from './ortak.js';

// [kod, ad, yükseklik mm (0: “Atölye standartları”ndaki taç yüksekliği), kapak yüzünden öne çıkıntı mm, açıklama]
export const TAC_MODELLERI = [
  ['duz', 'Düz MDF taç', 0, 25, 'MDF, kapak renginde. Yüksekliği “Atölye standartları”ndan ayarlanır; kesim listesine girer.'],
  ['r1', 'Lake Rustik Taç 1', 70, 40, 'Katlı profilli rustik taç, 7 cm. Hazır (boyalı) alınır.'],
  ['r2', 'Lake Rustik Taç 2', 70, 40, 'Kavisli profilli rustik taç, 7 cm. Hazır (boyalı) alınır.'],
  ['r3', 'Lake Rustik Taç 3', 70, 40, 'Dişli (diş motifli) rustik taç, 7 cm. Hazır (boyalı) alınır.'],
  ['m1', 'Lake 30mm Taç 1', 30, 15, 'İnce profilli taç, 3 cm. Hazır (boyalı) alınır.'],
  ['m2', 'Lake 30mm Taç 2', 30, 15, 'Düz ince taç, 3 cm. Hazır (boyalı) alınır.'],
];
// Profil: alttan üste katmanlar [alt oran, üst oran, çıkıntı oranı]. Taç yukarı doğru öne açılır.
const PROFIL = {
  duz: [[0, 1, 1]],
  r1: [[0, 0.2, 0.3], [0.2, 0.38, 0.5], [0.38, 0.62, 0.62], [0.62, 0.78, 0.85], [0.78, 1, 1]],
  r2: [[0, 0.15, 0.3], [0.15, 0.3, 0.4], [0.3, 0.48, 0.55], [0.48, 0.66, 0.74], [0.66, 0.8, 0.92], [0.8, 1, 1]],
  r3: [[0, 0.14, 0.3], [0.14, 0.22, 0.45], [0.22, 0.5, 0.5], [0.5, 0.58, 0.72], [0.58, 0.8, 0.82], [0.8, 1, 1]],
  m1: [[0, 0.55, 0.55], [0.55, 1, 1]],
  m2: [[0, 1, 1]],
};
const DIS = { alt: 0.22, ust: 0.5, cik: 0.7, en: 22, adim: 44 }; // dişli taçta diş sırası (r3)
const TACSIZ = new Set(['davlumbaz', 'davlumbaz_ada', 'ust_kavis', 'ust_kavis_acik', 'ust_ayna']); // üstüne taç dönmeyen üst modüller
export const TAC_ALT_EN = 80; // düz MDF taçın alt (yatay) parçasının eni: atölyenin Adeko tarifindeki değer (TACDUZ: CORNICE_BOTTOM_HEI 80)
export const TAC_EN_UZUN = 2780; // tek parça taçın en uzun boyu (levha boyu − kenar payı); uzunu ekli yapılır

// Projenin taç seçimi. Yükseklik için projenin standartları etkin olmalı (projeAyarla).
export function tacAyari(p) {
  const m = TAC_MODELLERI.find(t => t[0] === p?.ayar?.tacModel) || TAC_MODELLERI[0];
  return { var: !!p?.ayar?.kornis, kod: m[0], ad: m[1], yuk: m[2] || TAC, cik: m[3], hazir: m[0] !== 'duz', aciklama: m[4] };
}
// Taç tek renktir: üst kapak rengi (başlangıç) ya da alt ve boy kapak rengi (ayar.tacRenk = 'kapak')
export function tacRengi(p) {
  const r = p?.renk || {};
  return p?.ayar?.tacRenk === 'kapak' ? (r.kapak || r.ustKapak || '') : (r.ustKapak || r.kapak || '');
}
export const tacResmi = () => ''; // yayın kopyasında katalog resmi yok

// Görünüş ve katalog için profil çizgileri: üstten oranlar (katman sınırları) ve diş sırası
export function tacCizgileri(kod) {
  const k = PROFIL[kod] || PROFIL.duz;
  return { cizgi: k.slice(1).map(c => 1 - c[0]), dis: kod === 'r3' ? { ust: 1 - DIS.ust, alt: 1 - DIS.alt, en: DIS.en, adim: DIS.adim } : null };
}

const aralikCikar = (liste, c, d) => liste.flatMap(([a, b]) => d <= a || c >= b ? [[a, b]] : [[a, Math.min(b, c)], [Math.max(a, d), b]].filter(([x, y]) => y - x > 0.5));

// Taç koşuları (oda koordinatında).
// kosular: [{ n, duvar, a0, a1, f, b, y0, y1, boy, renk, ilk }] — n: ön yüzün baktığı yön (0 +z, 1 +x, 2 −z, 3 −x); a: ön yüz boyunca aralık;
//   f: ön yüzün yeri; b: arka (duvar) yüzünün yeri; boy: görünen boy (mm); ilk: koşunun ilk modülü (renk ve kapak modeli için).
// dolgular: L köşe dolabının köşe karesi (yalnızca çizim için). donusler: açıkta kalan uçlardaki yan dönüş parçaları [{ boy, renk, ilk }].
// metre: taçın toplam boyu (koşular + yan dönüşler), metre.
export function taclar(p) {
  const A = tacAyari(p), { oda } = p, renk = tacRengi(p);
  const sonuc = { ayar: A, kosular: [], dolgular: [], donusler: [], metre: 0 };
  if (!A.var) return sonuc;
  const E = KAPAK_K + A.cik, parca = [];
  const ekle = (m, k, n) => {
    const s = n % 2 === 0 ? { a0: k.x0, a1: k.x1, f: n === 0 ? k.z1 : k.z0, b: n === 0 ? k.z0 : k.z1 } : { a0: k.z0, a1: k.z1, f: n === 1 ? k.x1 : k.x0, b: n === 1 ? k.x0 : k.x1 };
    if (s.a1 - s.a0 >= 1) parca.push({ ...s, n, y0: m.y + m.h, renk, ilk: m });
  };
  for (const m of p.moduller) {
    const t = TANIM[m.tip];
    if (!t || !((t.sinif === 'ust' && !TACSIZ.has(m.tip)) || (t.sinif === 'boy' && m.tip !== 'buzdolabi'))) continue;
    if (m.y + m.h + A.yuk > oda.h + 0.5) continue; // tavana sığmıyor
    if (p.moduller.some(o => o !== m && o.duvar === m.duvar && Math.abs(o.y - (m.y + m.h)) < 2 && o.x < m.x + m.w && o.x + o.w > m.x)) continue; // üstünde başka dolap var
    const y = yon(m);
    if (m.tip === 'ust_lkose') { // iki kolun iç yüzü boyunca iki parça; köşe karesi dolgu
      const kd = Math.min(m.kol || 560, m.w - 150, m.d - 150), K = kd + E, sag = m.korYon === 'sag';
      ekle(m, yerelKutu(m, oda, sag ? 0 : K, sag ? m.w - K : m.w, 0, K), y);
      ekle(m, yerelKutu(m, oda, sag ? m.w - K : 0, sag ? m.w : K, K, m.d), (y + (sag ? 3 : 1)) % 4);
      sonuc.dolgular.push({ ...yerelKutu(m, oda, sag ? m.w - K : 0, sag ? m.w : K, 0, K), y0: m.y + m.h, y1: m.y + m.h + A.yuk, renk });
    } else ekle(m, yerelKutu(m, oda, 0, m.w, 0, m.d + E), y);
  }
  // aynı hizadaki bitişik parçalar tek koşu olur
  parca.sort((a, b) => a.n - b.n || a.y0 - b.y0 || a.f - b.f || a.b - b.b || String(a.renk).localeCompare(String(b.renk)) || a.a0 - b.a0);
  for (const s of parca) {
    const k = sonuc.kosular[sonuc.kosular.length - 1];
    if (k && k.n === s.n && Math.abs(k.y0 - s.y0) < 2 && Math.abs(k.f - s.f) < 2 && Math.abs(k.b - s.b) < 2 && k.renk === s.renk && s.a0 - k.a1 < 2) k.a1 = Math.max(k.a1, s.a1);
    else sonuc.kosular.push({ ...s });
  }
  const kutuYap = k => k.n % 2 === 0 ? { x0: k.a0, x1: k.a1, z0: Math.min(k.b, k.f), z1: Math.max(k.b, k.f) } : { x0: Math.min(k.b, k.f), x1: Math.max(k.b, k.f), z0: k.a0, z1: k.a1 };
  for (const k of sonuc.kosular) {
    k.y1 = k.y0 + A.yuk; k.boy = Math.round(k.a1 - k.a0); k.kutu = kutuYap(k);
    k.duvar = k.n === 0 && Math.abs(k.b) < 2 ? 'arka' : k.n === 1 && Math.abs(k.b) < 2 ? 'sol' : k.n === 2 && Math.abs(k.b - oda.d) < 2 ? 'on' : k.n === 3 && Math.abs(k.b - oda.w) < 2 ? 'sag' : 'ada';
  }
  // Yan dönüş: koşunun ucu duvara, başka bir taça ya da taç hizasını kapatan bir modüle dayanmıyorsa açıkta kalan derinlik kadar parça
  const engel = [
    ...p.moduller.filter(m => ['alt', 'ust', 'boy', 'yapi'].includes(TANIM[m.tip]?.sinif) && m.tip !== 'pencere' && m.tip !== 'kapi' && m.tip !== 'nis')
      .map(m => ({ ...kutu(m, oda, ['alt', 'ust', 'boy'].includes(TANIM[m.tip].sinif) ? KAPAK_K : 0), kosu: null })),
    ...sonuc.kosular.map(k => ({ ...k.kutu, y0: k.y0, y1: k.y1, kosu: k })),
    ...sonuc.dolgular.map(d => ({ ...d, kosu: null })),
  ];
  for (const k of sonuc.kosular) {
    const x = k.n % 2 === 0, sinir = x ? oda.w : oda.d, d0 = Math.min(k.b, k.f), d1 = Math.max(k.b, k.f);
    for (const [uc, s0, s1] of [[k.a0, k.a0 - 3, k.a0 - 1], [k.a1, k.a1 + 1, k.a1 + 3]]) {
      if (k.duvar !== 'ada' && (uc <= 2 || uc >= sinir - 2)) continue; // oda köşesi: yan duvara dayanır
      let acik = [[d0, d1]];
      for (const e of engel) {
        if (e.kosu === k || e.y1 <= k.y0 + 1 || e.y0 >= k.y1 - 1) continue;
        const [ea0, ea1, ed0, ed1] = x ? [e.x0, e.x1, e.z0, e.z1] : [e.z0, e.z1, e.x0, e.x1];
        if (ea0 < s1 && ea1 > s0) acik = aralikCikar(acik, ed0, ed1);
      }
      const boy = Math.round(acik.reduce((t, [a, b]) => t + b - a, 0));
      if (boy > A.cik + 5) sonuc.donusler.push({ boy, renk: k.renk, ilk: k.ilk, y0: k.y0, y1: k.y1 });
    }
  }
  sonuc.metre = Math.round((sonuc.kosular.reduce((t, k) => t + k.boy, 0) + sonuc.donusler.reduce((t, d) => t + d.boy, 0)) / 10) / 100;
  return sonuc;
}

// 3B çizim için kutular: her koşu seçilen modelin profiliyle katman katman, dişli modelde diş sırasıyla. { x0, x1, z0, z1, y0, y1, renk, duvar }
export function tacKutulari(tc) {
  const A = tc.ayar, out = [], katman = PROFIL[A.kod] || PROFIL.duz;
  const kutuYap = (k, a0, a1, y0, y1, oran) => {
    const geri = A.cik * (1 - oran), on = k.n === 0 || k.n === 1 ? k.f - geri : k.f + geri, d0 = Math.min(k.b, on), d1 = Math.max(k.b, on);
    return { ...(k.n % 2 === 0 ? { x0: a0, x1: a1, z0: d0, z1: d1 } : { x0: d0, x1: d1, z0: a0, z1: a1 }), y0, y1, renk: k.renk, duvar: k.duvar === 'ada' ? '' : k.duvar };
  };
  for (const k of tc.kosular) {
    const H = k.y1 - k.y0;
    for (const [alt, ust, oran] of katman) out.push(kutuYap(k, k.a0, k.a1, k.y0 + H * alt, k.y0 + H * ust, oran));
    if (A.kod === 'r3') { // diş sırası: katmanın önünde aralıklı küçük bloklar
      const n = Math.max(1, Math.floor((k.a1 - k.a0 - DIS.en) / DIS.adim) + 1), bas = k.a0 + (k.a1 - k.a0 - ((n - 1) * DIS.adim + DIS.en)) / 2;
      for (let i = 0; i < n; i++) {
        const d = kutuYap(k, bas + i * DIS.adim, bas + i * DIS.adim + DIS.en, k.y0 + H * DIS.alt, k.y0 + H * DIS.ust, DIS.cik);
        const ic = A.cik * (DIS.cik - 0.5); // dişin gövdeden taşan kısmı
        if (k.n === 0) d.z0 = d.z1 - ic - 1; else if (k.n === 2) d.z1 = d.z0 + ic + 1; else if (k.n === 1) d.x0 = d.x1 - ic - 1; else d.x1 = d.x0 + ic + 1;
        out.push(d);
      }
    }
  }
  for (const d of tc.dolgular) out.push({ ...d, duvar: '' });
  return out;
}

// Kesim listesi için düz MDF taç parçaları: [{ ad, boy, en, renk, ilk, alt }]. Uzun koşu levha boyuna göre bölünür (ekli yapılır).
// Atölyenin Adeko tarifindeki gibi taç iki parçadır: dik duran ön parça (taç yüksekliğinde) ve dolabın üstüne yatan alt parça (TAC_ALT_EN).
export function tacParcalari(tc) {
  const out = [];
  if (tc.ayar.hazir) return out;
  for (const k of tc.kosular) {
    let kalan = k.boy;
    while (kalan > 0) {
      const L = Math.min(kalan, TAC_EN_UZUN);
      out.push({ ad: 'Taç', boy: L, en: Math.round(tc.ayar.yuk), renk: k.renk, ilk: k.ilk }, { ad: 'Taç alt parçası', boy: L, en: TAC_ALT_EN, renk: k.renk, ilk: k.ilk, alt: true });
      kalan -= L;
    }
  }
  for (const d of tc.donusler) out.push({ ad: 'Taç yan dönüşü', boy: d.boy, en: Math.round(tc.ayar.yuk), renk: d.renk, ilk: d.ilk }, { ad: 'Taç yan dönüşü alt parçası', boy: d.boy, en: TAC_ALT_EN, renk: d.renk, ilk: d.ilk, alt: true });
  return out;
}
