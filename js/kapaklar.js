// Kapak kataloğu: kapak stilleri, cam ve alüminyum çerçeve seçenekleri ve bir ön panelin (kapak, çekmece önü) parça kutuları.
// Stil listesi, görünüm aileleri ve ölçüler aynı sahibin eB Creator uygulamasındaki kapak çeşitlerinden alınmıştır
// (orada santimetre, burada milimetre). 3B çizim, kesim listesi ve küçük resimler aynı parça listesini kullanır.
// Lake modellerin ön yüzündeki oyma (çerçeve, kemer, lambri, çıta, kafes) kapakkabartma.js içindedir: 3B çizim ve fotoğraf o
// kabartmayı kullanır; buradaki süsleme kutuları teknik çizimde ve tel / şeffaf görünümde kullanılmaya devam eder.
import { kabartmaVar } from './kapakkabartma.js';

// Gruplar: [kod, ad]
export const KAPAK_GRUPLARI = [['temel', 'Temel'], ['1000', 'Lake 1000 · Düz ve kendinden kulplu'], ['2000', 'Lake 2000 · Country'], ['3000', 'Lake 3000 · Çıtalı (pervazlı)'],
  ['4000', 'Lake 4000 · Boy kapak'], ['5000', 'Lake 5000 · Elit'], ['C', 'Lake · Camlı'], ['al', 'Cam ve alüminyum çerçeve']];

// Stiller: [kod, ad, grup, görünüm, kalınlık (mm; 0: atölye standardı), alüminyum ön yüz genişliği, arkadaki profil genişliği]
// Görünümler: duz, shaker, shakerince, kanal, cita (ARTAPP'in önceki modelleri); fuga, citali, kulpsuz, country, countryc, kemer, kemerc,
// yatay, bant, panjur, hasir, kafes, xpanel, bolme (panel üstü süsleme); camc, camg, camb (ahşap çerçeveli cam); cam, al (alüminyum çerçeveli cam)
export const KAPAK_STILLERI = [
  ['duz', 'Düz', 'temel', 'duz', 0], ['cerceve', 'Çerçeveli (shaker)', 'temel', 'shaker', 0], ['ince', 'İnce çerçeveli', 'temel', 'shakerince', 0],
  ['kanal', 'Kanallı', 'temel', 'kanal', 0], ['cita', 'Cam çıtalı', 'temel', 'cita', 0], ['citali', 'Çıtalı', 'temel', 'citali', 0],
  ['fuga', 'Fugalı ince çerçeve', 'temel', 'fuga', 0], ['kulpsuz', 'Kulpsuz (kendinden kulplu)', 'temel', 'kulpsuz', 0],
  ['lk1001', 'Lake Kapak 1001', '1000', 'duz', 0], ['lk1002', 'Lake Kapak 1002 · Kendinden kulplu', '1000', 'kulpsuz', 0], ['lk1003', 'Lake Kapak 1003 · Kendinden kulplu', '1000', 'kulpsuz', 0],
  ['lk1004', 'Lake Kapak 1004 · Kendinden kulplu', '1000', 'kulpsuz', 0], ['lk1005', 'Lake Kapak 1005 · Kendinden kulplu', '1000', 'duz', 0], ['lk1006', 'Lake Kapak 1006 · Kendinden kulplu', '1000', 'duz', 0],
  ['lk1007', 'Lake Kapak 1007 · Gizli kulplu', '1000', 'kulpsuz', 0], ['lk1008', 'Lake Kapak 1008 · Fugalı çerçeve', '1000', 'fuga', 0], ['lk1009', 'Lake Kapak 1009 · Yatay derzli', '1000', 'yatay', 0],
  ['lk2001', 'Lake Kapak 2001', '2000', 'country', 0], ['lk2002', 'Lake Kapak 2002', '2000', 'country', 0], ['lk2003', 'Lake Kapak 2003', '2000', 'country', 0],
  ['lk2004', 'Lake Kapak 2004 · Kemerli', '2000', 'kemer', 0], ['lk2005', 'Lake Kapak 2005', '2000', 'country', 0], ['lk2006', 'Lake Kapak 2006', '2000', 'country', 0],
  ['lk2007', 'Lake Kapak 2007 · Lambri', '2000', 'countryc', 0], ['lk2008', 'Lake Kapak 2008 · Kemerli lambri', '2000', 'kemerc', 0], ['lk2009', 'Lake Kapak 2009', '2000', 'fuga', 0],
  ['lk2010', 'Lake Kapak 2010', '2000', 'country', 0], ['lk2011', 'Lake Kapak 2011', '2000', 'country', 0], ['lk2012', 'Lake Kapak 2012 · Kemerli', '2000', 'kemer', 0],
  ['lk2013', 'Lake Kapak 2013', '2000', 'country', 0], ['lk2014', 'Lake Kapak 2014', '2000', 'country', 0], ['lk2015', 'Lake Kapak 2015 · Lambri', '2000', 'countryc', 0],
  ['lk2016', 'Lake Kapak 2016 · Kemerli lambri', '2000', 'kemerc', 0], ['lk3001', 'Lake Kapak 3001', '3000', 'country', 0], ['lk3002', 'Lake Kapak 3002', '3000', 'country', 0],
  ['lk3003', 'Lake Kapak 3003', '3000', 'country', 0], ['lk3004', 'Lake Kapak 3004', '3000', 'country', 0], ['lk3005', 'Lake Kapak 3005', '3000', 'country', 0],
  ['lk4001', 'Lake Kapak 4001 · Çıtalı hasır, kulplu', '4000', 'citali', 0], ['lk4002', 'Lake Kapak 4002 · Çıtalı hasır', '4000', 'citali', 0], ['lk4003', 'Lake Kapak 4003 · Çıtalı hasır', '4000', 'citali', 0],
  ['lk4004', 'Lake Kapak 4004 · Çıtalı hasır', '4000', 'citali', 0], ['lk4005', 'Lake Kapak 4005 · Çıtalı hasır', '4000', 'citali', 0], ['lk4006', 'Lake Kapak 4006 · Panjur', '4000', 'panjur', 0],
  ['lk4007', 'Lake Kapak 4007 · Çerçeveli panjur', '4000', 'panjur', 0], ['lk4008', 'Lake Kapak 4008 · 22mm', '4000', 'fuga', 22], ['lk4009', 'Lake Kapak 4009 · 22mm', '4000', 'fuga', 22],
  ['lk4010', 'Lake Kapak 4010 · Delikli panel', '4000', 'hasir', 0], ['lk4011', 'Lake Kapak 4011 · Kafes panel', '4000', 'kafes', 0], ['lk5001', 'Lake Kapak 5001 · Kemerli hasır, 22mm', '5000', 'kemerc', 22],
  ['lk5002', 'Lake Kapak 5002 · Hasır bantlı, 22mm', '5000', 'bant', 22], ['lk5003', 'Lake Kapak 5003 · Kemerli kulp, 22mm', '5000', 'duz', 22], ['lk5004', 'Lake Kapak 5004 · Çapraz kulp', '5000', 'duz', 0],
  ['lk5005', 'Lake Kapak 5005 · Yay desenli', '5000', 'citali', 0], ['lk5006', 'Lake Kapak 5006 · Çıtalı, 22mm', '5000', 'citali', 22], ['lk5007', 'Lake Kapak 5007 · Hasır', '5000', 'citali', 0],
  ['lk5008', 'Lake Kapak 5008 · Hasır bantlı yuvarlak kulp', '5000', 'bant', 0], ['lk5009', 'Lake Kapak 5009 · Çapraz panelli', '5000', 'xpanel', 0], ['lk5010', 'Lake Kapak 5010 · Altın çerçeveli', '5000', 'fuga', 0],
  ['lk5011', 'Lake Kapak 5011 · Bölmeli', '5000', 'bolme', 0], ['lk5012', 'Lake Kapak 5012 · Daire motifli', '5000', 'fuga', 0], ['lk5013', 'Lake Kapak 5013 · Oval kafes', '5000', 'kafes', 0],
  ['lk5014', 'Lake Kapak 5014 · Elips kafes', '5000', 'kafes', 0], ['lk5015', 'Lake Kapak 5015 · Çapraz kafes', '5000', 'xpanel', 0], ['lk5016', 'Lake Kapak 5016 · Çapraz kafes', '5000', 'xpanel', 0],
  ['lk5017', 'Lake Kapak 5017 · Baklava kafes', '5000', 'xpanel', 0], ['lk5018', 'Lake Kapak 5018 · Geometrik kafes', '5000', 'kafes', 0], ['lkC1', 'Lake Kapak C1 · 6 bölmeli cam', 'C', 'camg', 0],
  ['lkC2', 'Lake Kapak C2 · Baklavalı cam', 'C', 'camb', 0], ['lkC3', 'Lake Kapak C3 · Tek parça cam', 'C', 'camc', 0], ['lkC4', 'Lake Kapak C4 · 6 bölmeli cam', 'C', 'camg', 0],
  ['lkC5', 'Lake Kapak C5 · Baklavalı cam', 'C', 'camb', 0], ['lkC6', 'Lake Kapak C6 · Tek parça cam', 'C', 'camc', 0],
  ['camc', 'Camlı (ahşap çerçeve)', 'al', 'camc', 0], ['cam', 'Camlı (alüminyum çerçeve)', 'al', 'cam', 0, 22, 22],
  ['al1101', 'Alüminyum çerçeve 2*2 (Altek APR 1101)', 'al', 'al', 0, 20, 20], ['al1105', 'Alüminyum çerçeve 2*4 (Altek APR 1105)', 'al', 'al', 0, 20, 40],
  ['al1106', 'Alüminyum çerçeve 1*4 (Altek APR 1106)', 'al', 'al', 0, 10, 40], ['al1107', 'Alüminyum çerçeve 0.3*4 (Altek APR 1107)', 'al', 'al', 0, 3, 40],
  ['al1111', 'Alüminyum çerçeve 0*4 (Altek APR 1111)', 'al', 'al', 0, 0, 40],
];
const STIL = Object.fromEntries(KAPAK_STILLERI.map(s => [s[0], { kod: s[0], ad: s[1], grup: s[2], gorunum: s[3], kalinlik: s[4] || 0, on: s[5] || 0, arka: s[6] || 0 }]));
export const KAPAK_MODELLERI = Object.fromEntries(KAPAK_STILLERI.map(s => [s[0], s[1]])); // kod → ad
export const kapakStili = kod => STIL[kod] || STIL.duz;
const CAMLI = new Set(['camc', 'camg', 'camb', 'cam', 'al']);
export const camliMi = kod => CAMLI.has(kapakStili(kod).gorunum);
export const aluminyumMu = kod => ['cam', 'al'].includes(kapakStili(kod).gorunum);
// Boyalı (lake) kapak: kenar bandı yapılmaz
export const boyaliMi = kod => /^lk/.test(kod);
// Kendinden kulplu görünüm: ayrıca kulp takılmaz
export const kulpsuzMu = kod => kapakStili(kod).gorunum === 'kulpsuz';

// Cam türleri: [kod, ad, renk, saydamsızlık 0–1]. Lakobel ve ayna saydam değildir.
export const CAM_TURLERI = [['duz', 'Düz cam (renksiz)', '#BFD3DB', 0.5], ['fume', 'Füme cam', '#4F5559', 0.62], ['bronz', 'Bronz cam', '#8B6B4E', 0.58], ['gold', 'Gold cam', '#C2A15A', 0.6],
  ['beyaz', 'Beyaz lakobel (opak)', '#ECEDEA', 0.93], ['siyah', 'Siyah lakobel (opak)', '#17181A', 0.93], ['ayna', 'Ayna (gümüş)', '#B4B9BD', 0.9]];
// Cam yüzeyleri: [kod, ad, açıklama]
export const CAM_YUZEYLERI = [['duz', 'Düz', 'Pürüzsüz yüzeyli cam, içerisi net görünür.'],
  ['nervur', 'Nervürlü', 'Yüzeyinde belirgin çizgi ve oluklar (yiv) olan cam; ışığı kırar, içerisi bulanık görünür.'],
  ['satina', 'Satina', 'Asitle matlaştırılmış, dokununca ipeksi his veren cam; ışık geçirir, parmak izi tutmaz.'],
  ['buzlu', 'Buzlu', 'Bir yüzü düz, diğer yüzü desenli dekoratif cam; içerisi seçilmez, mutfak gibi ıslak alanlara uygundur.']];
// Alüminyum çerçeve renkleri: [kod, ad, renk]
export const AL_RENKLERI = [['el', 'Mat eloksal (gümüş)', '#B9BDC0'], ['si', 'Siyah', '#1E1F21'], ['br', 'Bronz', '#7A6A54'], ['au', 'Altın (parlak)', '#CDAA55']];
const bul = (liste, kod) => liste.find(e => e[0] === kod) || liste[0];
export const camTuru = kod => bul(CAM_TURLERI, kod);
export const alRengi = kod => bul(AL_RENKLERI, kod);

// Projenin cam ve alüminyum seçimi: { tur, yuzey, al } (eksikler varsayılana tamamlanır)
export const camAyari = ayar => ({ tur: camTuru(ayar?.cam?.tur)[0], yuzey: bul(CAM_YUZEYLERI, ayar?.cam?.yuzey)[0], al: alRengi(ayar?.cam?.al)[0] });

// Bir ön panelin parçaları. Dönen her parça: { ad, x, y, z, sx, sy, sz, mat, tur: 'kapak', ... } (modülün yerel ölçüleri, mm).
//   ilk parça her zaman panelin tam boyundadır (menteşe ve açılış bilgisi ona yazılır)
//   sus: süsleme; ayrı kesilen parça değildir (kesim listesine girmez)     ton: rengin koyulaşma çarpanı (0–1)
//   kk: kesim listesindeki kalınlık (görünen kalınlıktan farklıysa)        renk: sabit renk (cam, alüminyum)
//   bantsiz: boyalı kapak, kenar bandı yok                                 camTur, camYuzey: camın türü ve yüzeyi
// stil: stil kodu. x, y: panelin sol alt köşesi. pw, ph: genişlik, yükseklik. d: panelin arka yüzünün z'si. K: kapak kalınlığı.
// altKulp: kendinden kulplu modelde kanal alt kenardadır (üst dolaplar). cam: camAyari() çıktısı.
export function kapakParcalari(stil, o) {
  const P = hamParcalar(stil, o), kod = kapakStili(stil).kod;
  // Kabartmalı model: tam boy panel kabartmayı taşır; süsleme kutuları (kab) 3B çizimde kabartma varken çizilmez
  if (kabartmaVar(kod) && P.length && !P[0].sus && P[0].mat === 'kapak') { P[0].kabartma = { kod, alt: !!o.altKulp }; for (let i = 1; i < P.length; i++) if (P[i].sus) P[i].kab = 1; }
  return P;
}
function hamParcalar(stil, { ad = 'Kapak', x, y, pw, ph, d, K, altKulp = false, cam = null }) {
  const st = kapakStili(stil), g = st.gorunum, P = [], x1 = x + pw, y1 = y + ph, zz = d + K, boyali = boyaliMi(st.kod);
  const k = (ad2, px, py, pz, sx, sy, sz, mat = 'kapak', ek = null) => { if (sx > 0 && sy > 0 && sz > 0) P.push({ ad: ad2, x: px, y: py, z: pz, sx, sy, sz, mat, tur: 'kapak', ...ek }); };
  const sus = (px, py, pz, sx, sy, sz, ton = 1, mat = 'kapak', ek = null) => k(ad + ' süsü', px, py, pz, sx, sy, sz, mat, { sus: true, ...(ton !== 1 ? { ton } : null), ...ek });
  const panel = (ek = null) => k(ad, x, y, d, pw, ph, K, 'kapak', boyali ? { bantsiz: true, ...ek } : ek);
  const cm = cam || camAyari(null), ct = camTuru(cm.tur), camEk = { renk: ct[2], camTur: ct[0], camYuzey: cm.yuzey };
  const camMat = ct[3] > 0.9 ? (ct[0] === 'ayna' ? 'ayna' : 'siyah') : 'cam'; // lakobel ve ayna saydam değil: parlak yüzey

  if (g === 'cam' || g === 'al') { // alüminyum çerçeve: arkada geniş profil, önde ince kenar, cam çerçevenin içinde
    const e = st.on, b = Math.max(st.arka, e), renk = alRengi(cm.al)[2], al = { renk, sus: true };
    k(ad + ' profili', x, y, d, b, ph, 6, 'inox', al);
    k(ad + ' profili', x1 - b, y, d, b, ph, 6, 'inox', al);
    k(ad + ' profili', x + b, y, d, pw - 2 * b, b, 6, 'inox', al);
    k(ad + ' profili', x + b, y1 - b, d, pw - 2 * b, b, 6, 'inox', al);
    if (e > 0) {
      k(ad + ' profili', x, y, d + 6, e, ph, K - 6, 'inox', al);
      k(ad + ' profili', x1 - e, y, d + 6, e, ph, K - 6, 'inox', al);
      k(ad + ' profili', x + e, y, d + 6, pw - 2 * e, e, K - 6, 'inox', al);
      k(ad + ' profili', x + e, y1 - e, d + 6, pw - 2 * e, e, K - 6, 'inox', al);
    }
    k(ad + ' camı', x + e, y + e, d + 6, pw - 2 * e, ph - 2 * e, 6, camMat, camEk);
    return P;
  }
  if (g === 'camc' || g === 'camg' || g === 'camb') { // ahşap çerçeveli cam: dört çerçeve parçası ve cam
    const f = Math.min(70, pw / 4, ph / 4), bant = boyali ? { bantsiz: true } : null;
    k(ad + ' çerçeve', x, y, d, f, ph, K, 'kapak', bant);
    k(ad + ' çerçeve', x1 - f, y, d, f, ph, K, 'kapak', bant);
    k(ad + ' çerçeve', x + f, y, d, pw - 2 * f, f, K, 'kapak', bant);
    k(ad + ' çerçeve', x + f, y1 - f, d, pw - 2 * f, f, K, 'kapak', bant);
    k(ad + ' camı', x + f, y + f, d + 6, pw - 2 * f, ph - 2 * f, 6, camMat, camEk);
    const gx0 = x + f, gx1 = x1 - f, gy0 = y + f, gy1 = y1 - f, cx = (gx0 + gx1) / 2, cy = (gy0 + gy1) / 2;
    if (g === 'camg') { // kayıtlı: ortada dikey, üçte bir aralıkla iki yatay kayıt
      sus(cx - 8, gy0, d + 8, 16, gy1 - gy0, K - 8);
      for (let i = 1; i < 3; i++) sus(gx0, gy0 + (gy1 - gy0) * i / 3 - 8, d + 8, gx1 - gx0, 16, K - 8);
    } else if (g === 'camb') { // baklava: ortada eşkenar dörtgen, üstten ve alttan dikey kayıt
      const a = (gx1 - gx0) * 0.32, b = (gy1 - gy0) * 0.2;
      sus(cx - 8, gy0, d + 8, 16, cy - b - gy0, K - 8);
      sus(cx - 8, cy + b, d + 8, 16, gy1 - cy - b, K - 8);
      for (const [ax, ay, bx, by] of [[cx, cy + b, cx + a, cy], [cx + a, cy, cx, cy - b], [cx, cy - b, cx - a, cy], [cx - a, cy, cx, cy + b]]) {
        const n = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay) / 14));
        for (let i = 0; i <= n; i++) { const t = i / n; sus(ax + (bx - ax) * t - 7.5, ay + (by - ay) * t - 7.5, d + 8, 15, 15, K - 8); }
      }
    }
    return P;
  }
  if (g === 'shaker' || g === 'shakerince') { // çerçeveli: göbek çerçeveden 6 mm geride (tek parça kapaktan işlenir)
    const c = g === 'shaker' ? 70 : 28, ic = 6;
    if (pw > 2 * c + 40 && ph > 2 * c + 40) {
      k(ad, x, y, d, pw, ph, K - ic, 'kapak', { kk: K, ...(boyali ? { bantsiz: true } : null) });
      k(ad + ' çerçevesi', x, y, zz - ic, c, ph, ic, 'kapak', { sus: true });
      k(ad + ' çerçevesi', x1 - c, y, zz - ic, c, ph, ic, 'kapak', { sus: true });
      k(ad + ' çerçevesi', x + c, y, zz - ic, pw - 2 * c, c, ic, 'kapak', { sus: true });
      k(ad + ' çerçevesi', x + c, y1 - c, zz - ic, pw - 2 * c, c, ic, 'kapak', { sus: true });
    } else panel();
    return P;
  }
  panel();
  if (st.kod === 'lk5010') { // altın çerçeveli: kenardan içeride ince madeni çerçeve
    const q = Math.min(45, pw * 0.16), e = 7, altin = { sus: true, renk: '#C8A24A' };
    if (pw > 2 * q + 30 && ph > 2 * q + 30) { k(ad + ' süsü', x + q, y + q, zz, pw - 2 * q, e, 1.2, 'kulp', altin); k(ad + ' süsü', x + q, y1 - q - e, zz, pw - 2 * q, e, 1.2, 'kulp', altin); k(ad + ' süsü', x + q, y + q + e, zz, e, ph - 2 * q - 2 * e, 1.2, 'kulp', altin); k(ad + ' süsü', x1 - q - e, y + q + e, zz, e, ph - 2 * q - 2 * e, 1.2, 'kulp', altin); }
    return P;
  }
  if (g === 'kanal') { // dikey kanallar: yaklaşık 70 mm arayla ince koyu çizgi
    if (pw > 120) { const n = Math.max(2, Math.round(pw / 70)); for (let i = 1; i < n; i++) k('Kanal', x + pw * i / n - 1.5, y + 4, zz, 3, ph - 8, 0.8, 'koyu', { sus: true }); }
    return P;
  }
  if (g === 'kulpsuz') { // kendinden kulplu: üst kenarda (üst dolapta alt kenarda) tutma kanalı
    sus(x, altKulp ? y : y1 - 12, zz, pw, 12, 2, 1, 'koyu');
    return P;
  }
  if (g === 'fuga') { // kenardan 40 mm içeride ince fuga çerçevesi
    const q = 40;
    if (pw > 2 * q + 30 && ph > 2 * q + 30) { sus(x + q, y + q, zz, pw - 2 * q, 8, 4, 0.9); sus(x + q, y1 - q - 8, zz, pw - 2 * q, 8, 4, 0.9); sus(x + q, y + q, zz, 8, ph - 2 * q, 4, 0.9); sus(x1 - q - 8, y + q, zz, 8, ph - 2 * q, 4, 0.9); }
    return P;
  }
  if (g === 'citali') { for (let a = x + 30; a < x1 - 20; a += 40) sus(a, y + 10, zz, 6, ph - 20, 3, 0.82); return P; }

  // Çerçeveli süslemeler: q kenardan içeri pay; c2 koyu, c3 açık gölge tonu
  const c2 = 0.72, c3 = 0.86;
  const cer = (i, ton) => { // 8 mm'lik dört çıtadan çerçeve
    if (pw <= 2 * i + 30 || ph <= 2 * i + 30) return;
    sus(x + i, y + i, zz, pw - 2 * i, 8, 5, ton); sus(x + i, y1 - i - 8, zz, pw - 2 * i, 8, 5, ton);
    sus(x + i, y + i + 8, zz, 8, ph - 2 * i - 16, 5, ton); sus(x1 - i - 8, y + i + 8, zz, 8, ph - 2 * i - 16, 5, ton);
  };
  const nokta = (ax, ay, bx, by, ton) => { // eğik çizgi: 10 mm'lik karelerle
    const n = Math.max(3, Math.round(Math.hypot(bx - ax, by - ay) / 30));
    for (let i = 0; i <= n; i++) { const t = i / n; sus(ax + (bx - ax) * t - 5, ay + (by - ay) * t - 5, zz, 10, 10, 4, ton); }
  };
  if (g === 'panjur' || g === 'hasir') {
    const q = g === 'panjur' ? 40 : 50;
    cer(q, c2);
    if (pw <= 2 * q + 46 || ph <= 2 * q + 46) return P;
    if (g === 'panjur') for (let a = y + q + 30; a < y1 - q - 10; a += 30) sus(x + q + 8, a - 3.5, zz, pw - 2 * q - 16, 7, 6, c2);
    else {
      sus(x + q + 8, y + q + 8, zz, pw - 2 * q - 16, ph - 2 * q - 16, 0.5, 0.88);
      for (let a = x + q + 30; a < x1 - q - 10; a += 30) sus(a - 2.5, y + q + 8, zz, 5, ph - 2 * q - 16, 3, c2);
      for (let a = y + q + 30; a < y1 - q - 10; a += 30) sus(x + q + 8, a - 2.5, zz, pw - 2 * q - 16, 5, 3, c2);
    }
    return P;
  }
  const q = Math.max(40, Math.min(90, pw * 0.13));
  if (g === 'yatay') { // yatay derzler: yaklaşık 120 mm arayla
    const n = Math.max(3, Math.round(ph / 120));
    for (let j = 1; j < n; j++) sus(x + 3, y + ph * j / n - 3.5, zz, pw - 6, 7, 0.6, c2);
  } else if (g === 'country' || g === 'countryc') {
    cer(q, c2); cer(q + 25, c3);
    if (g === 'countryc') for (let a = x + q + 60; a < x1 - q - 40; a += 40) sus(a - 2.5, y + q + 33, zz, 5, ph - 2 * q - 66, 3, c2);
  } else if (g === 'kemer' || g === 'kemerc') { // üstü kemerli iki çerçeve
    [q, q + 25].forEach((i, sira) => {
      if (pw <= 2 * i + 30 || ph <= 2 * i + 60) return;
      const ton = sira ? c3 : c2, ah = Math.min(120, (ph - 2 * i) * 0.15), l = x + i, r = x1 - i, t = y1 - i, b = y + i;
      sus(l, b, zz, 8, t - ah - b, 5, ton); sus(r - 8, b, zz, 8, t - ah - b, 5, ton); sus(l + 8, b, zz, r - l - 16, 8, 5, ton);
      let px = l, py = t - ah;
      for (let s = 1; s <= 10; s++) { // ikinci dereceden eğri: uçlar yanların üstünde, tepe ortada
        const u = s / 10, nx = (1 - u) * (1 - u) * l + 2 * u * (1 - u) * (l + r) / 2 + u * u * r, ny = (1 - u) * (1 - u) * (t - ah) + 2 * u * (1 - u) * (t + ah * 0.7) + u * u * (t - ah);
        nokta(px, py, nx, ny, ton); px = nx; py = ny;
      }
    });
    if (g === 'kemerc') { const ah = Math.min(120, (ph - 2 * q) * 0.15); for (let a = x + q + 60; a < x1 - q - 40; a += 40) sus(a - 2.5, y + q + 33, zz, 5, ph - 2 * q - ah - 73, 3, c2); }
  } else if (g === 'kafes') {
    cer(q, c2);
    if (pw > 2 * q + 46 && ph > 2 * q + 46) {
      sus(x + q + 8, y + q + 8, zz, pw - 2 * q - 16, ph - 2 * q - 16, 0.5, 0.6);
      for (let a = x + q + 30; a < x1 - q - 10; a += 50) sus(a - 7, y + q + 8, zz, 14, ph - 2 * q - 16, 5);
      for (let a = y + q + 30; a < y1 - q - 10; a += 50) sus(x + q + 8, a - 7, zz, pw - 2 * q - 16, 14, 4.5);
    }
  } else if (g === 'bant') { // ortada çıtalı bant
    const bh = Math.max(80, ph * 0.12), ym = y + ph / 2;
    for (let a = x + 20; a < x1 - 10; a += 20) sus(a - 2, ym - bh / 2, zz, 4, bh, 3, c2);
  } else if (g === 'xpanel' || g === 'bolme') {
    cer(q, c2);
    const iw = pw - 2 * q, ih = ph - 2 * q;
    if (iw > 60 && ih > 60) {
      const n = g === 'xpanel' ? Math.max(1, Math.round(ih / iw)) : Math.max(2, Math.round(ph / 450)), sh = ih / n;
      for (let i = 0; i < n; i++) {
        const sy = y + q + i * sh;
        if (i) sus(x + q + 8, sy - 4, zz, iw - 16, 8, 5, c2);
        if (g === 'xpanel') { nokta(x + q + 15, sy + 15, x1 - q - 15, sy + sh - 15, c2); nokta(x1 - q - 15, sy + 15, x + q + 15, sy + sh - 15, c2); }
        else { sus(x + q + 20, sy + 20, zz, iw - 40, 8, 5, c3); sus(x + q + 20, sy + sh - 28, zz, iw - 40, 8, 5, c3); }
      }
    }
  }
  return P;
}

// Stilin küçük resmi: ön görünüş, parçaların üstten alta (z sırasıyla) dikdörtgenleri. renk: kapak rengi.
export function kapakOnizleme(stil, { w = 420, h = 600, renk = '#d9d5cc', cam = null } = {}) {
  const koyult = (hex, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
  const sabit = { koyu: '#3b3d42', inox: '#b9bec4', cam: '#a9d3e8', siyah: '#1b1c20', ayna: '#d7dde1' };
  const parcalar = kapakParcalari(stil, { x: 0, y: 0, pw: w, ph: h, d: 0, K: 18, cam }).sort((a, b) => (a.z + a.sz) - (b.z + b.sz));
  let s = `<svg viewBox="-6 -6 ${w + 12} ${h + 12}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${KAPAK_MODELLERI[stil] || ''}"><rect x="-1" y="-1" width="${w + 2}" height="${h + 2}" fill="none" stroke="#1b2530" stroke-width="3"/>`;
  for (const q of parcalar) {
    const taban = q.renk || (q.mat === 'kapak' ? renk : sabit[q.mat] || '#888888'), dolgu = q.ton ? koyult(taban, q.ton) : taban, camMi = /camı$/.test(q.ad);
    s += `<rect x="${q.x.toFixed(1)}" y="${(h - q.y - q.sy).toFixed(1)}" width="${q.sx.toFixed(1)}" height="${q.sy.toFixed(1)}" fill="${dolgu}"${camMi && q.mat === 'cam' ? ' fill-opacity="0.75"' : ''}${q.sus ? '' : ' stroke="#1b2530" stroke-width="1.2" stroke-opacity="0.45"'}/>`;
  }
  return s + '</svg>';
}
