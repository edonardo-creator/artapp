// Sahne dekoru: çizime yaşam katan eşyalar (tezgah üstü, raf ve vitrin içi, duvar, bitki, halı, masa ve ada üstü, vitrin ışığı).
// Eşyalar projeye modül olarak eklenmez; odanın düzenine bakılarak kendiliğinden yerleştirilir ve yalnızca gerçekçi görünümde,
// Foto kipinde ve fotoğrafik görüntüde çizilir. Aynı proje ve aynı "tohum" her zaman aynı düzeni verir.
// Çıktı basit cisimlerdir (kutu, elipsoit, silindir, kesik koni); 3B çizim ve fotoğraf motoru aynı listeyi kullanır.
import { TANIM, parcalar, TEZGAH_K } from './moduller.js';
import { tezgahlar } from './ortak.js';
import { kutu, yerelKutu, DUVAR_LISTE } from './yerlesim.js';

// [anahtar, ad, açıklama]
export const DEKOR_GRUPLARI = [
  ['tezgah', 'Tezgah üstü', 'su ısıtıcı, kahve makinesi, meyve kasesi, kesme tahtaları, kavanozlar, şişeler, saksı'],
  ['raf', 'Raf ve vitrin içi', 'tabak, bardak, kase, kitap, kavanoz'],
  ['duvar', 'Duvar', 'tablolar, duvar saati, dekor tabakları'],
  ['bitki', 'Bitkiler', 'yerde büyük saksı, tezgahta küçük saksı'],
  ['hali', 'Halı', 'tezgahın önünde yolluk ya da masanın altında halı'],
  ['masa', 'Masa ve ada üstü', 'vazo, meyve, servis tabakları'],
  ['vitrin', 'Vitrin ışığı', 'camlı dolapların içinde sıcak ışık'],
];
export const DEKOR_VARSAYILAN = { acik: false, yogunluk: 2, tohum: 1, ...Object.fromEntries(DEKOR_GRUPLARI.map(g => [g[0], true])) };
export function dekorAyari(p) {
  const a = { ...DEKOR_VARSAYILAN, ...(p?.ayar?.dekor || {}) };
  a.acik = !!a.acik; a.yogunluk = [1, 2, 3].includes(Number(a.yogunluk)) ? Number(a.yogunluk) : 2; a.tohum = Math.abs(Math.round(Number(a.tohum) || 1)) % 100000 || 1;
  for (const g of DEKOR_GRUPLARI) a[g[0]] = a[g[0]] !== false;
  return a;
}

// Fotoğraf motorunun malzeme kodları (fotomotor.js): boyalı, ahşap, taş, parlak metal, cam, parlak seramik, koyu mat, ışık, inox, kumaş / yaprak
const M = { boya: 1, ahsap: 2, tas: 3, metal: 4, cam: 5, seramik: 6, koyu: 8, isik: 9, inox: 11, kumas: 17 };
const YESIL = ['#3f6b35', '#4d7a3c', '#5b8a44', '#2f5a30', '#6a9a4f', '#456f3a'];
const AHSAP = ['#b98a5a', '#8a5a36', '#c9a274', '#6f4a30', '#d6b98c'];

function rastgele(tohum) { // mulberry32
  let a = (tohum >>> 0) || 1;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.ar = (a0, a1) => a0 + (a1 - a0) * r();
  r.sec = l => l[Math.floor(r() * l.length) % l.length];
  r.kar = l => { const k = [...l]; for (let i = k.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [k[i], k[j]] = [k[j], k[i]]; } return k; };
  return r;
}

// Yerel çerçeve: a = yüzey boyunca (tezgahın ya da duvarın uzun yönü), c = duvardan odaya doğru, y = yukarı.
// o: [x, z] başlangıç, u: a yönü, v: c yönü (ikisi de eksene paralel birim vektör)
const cerceve = (ox, oz, u, v) => ({ ox, oz, u, v });
function Cizer(liste, duvar = '', asili = false) { // asili: duvara asılı (tablo, saat); duvarın arkasından bakınca görünmez
  const koy = (s, x0, y0, z0, x1, y1, z1, renk, mat, k) => {
    if (!(x1 - x0 > 0.2 && y1 - y0 > 0.2 && z1 - z0 > 0.2)) return;
    liste.push({ s, b: [x0, y0, z0, x1, y1, z1], k: k || 0, r: renk, m: mat, d: duvar, as: asili });
  };
  const dunya = (F, a, c) => [F.ox + F.u[0] * a + F.v[0] * c, F.oz + F.u[1] * a + F.v[1] * c];
  const C = {
    duvar,
    kutu(F, a0, a1, y0, y1, c0, c1, renk, mat = M.boya) { const p = dunya(F, a0, c0), q = dunya(F, a1, c1); koy(0, Math.min(p[0], q[0]), y0, Math.min(p[1], q[1]), Math.max(p[0], q[0]), y1, Math.max(p[1], q[1]), renk, mat); },
    elips(F, a, y, c, ra, ry, rc, renk, mat = M.boya) { const p = dunya(F, a - ra, c - rc), q = dunya(F, a + ra, c + rc); koy(1, Math.min(p[0], q[0]), y - ry, Math.min(p[1], q[1]), Math.max(p[0], q[0]), y + ry, Math.max(p[1], q[1]), renk, mat); },
    // dik silindir ya da kesik koni: k < 1 üstü dar, k > 1 altı dar (2 − k oranında), k = 1 düz
    sil(F, a, y0, c, r, h, renk, mat = M.boya, k = 1) { const p = dunya(F, a, c); koy(2, p[0] - r, y0, p[1] - r, p[0] + r, y0 + h, p[1] + r, renk, mat, k); },
    // ekseni duvara dik (c yönünde) yatay silindir: duvar saati, tabak, yuvarlak kesme tahtası
    disk(F, a, y, c0, c1, r, renk, mat = M.boya) { const p = dunya(F, a - r, c0), q = dunya(F, a + r, c1); koy(F.v[0] !== 0 ? 3 : 4, Math.min(p[0], q[0]), y - r, Math.min(p[1], q[1]), Math.max(p[0], q[0]), y + r, Math.max(p[1], q[1]), renk, mat, 1); },
    // eğik elipsoit: merkez (a, y, c); r0 uzun eksen yarıçapı, r1 genişlik, r2 kalınlık; az: uzun eksenin yatay açısı (a'dan c'ye), el: yükselme açısı
    egik(F, a, y, c, r0, r1, r2, az, el, renk, mat = M.kumas) {
      const p = dunya(F, a, c), ua = Math.cos(az) * Math.cos(el), uc = Math.sin(az) * Math.cos(el);
      const e0 = [F.u[0] * ua + F.v[0] * uc, Math.sin(el), F.u[1] * ua + F.v[1] * uc];
      const l1 = Math.hypot(e0[0], e0[2]), e1 = l1 < 1e-6 ? [1, 0, 0] : [-e0[2] / l1, 0, e0[0] / l1];   // genişlik ekseni yataydır
      const e2 = [e0[1] * e1[2] - e0[2] * e1[1], e0[2] * e1[0] - e0[0] * e1[2], e0[0] * e1[1] - e0[1] * e1[0]];
      const ex = Math.hypot(e0[0] * r0, e1[0] * r1, e2[0] * r2), ey = Math.hypot(e0[1] * r0, e1[1] * r1, e2[1] * r2), ez = Math.hypot(e0[2] * r0, e1[2] * r1, e2[2] * r2);
      if (!(r0 > 0.2 && r1 > 0.2 && r2 > 0.2)) return;
      liste.push({ s: 5, b: [p[0] - ex, y - ey, p[1] - ez, p[0] + ex, y + ey, p[1] + ez], k: 0, r: renk, m: mat, d: duvar, as: asili, e: [p[0], y, p[1], r0, r1, r2, ...e0, ...e1, ...e2] });
    },
    // iki nokta arasında ince çubuk (sap, dal, kaşık sapı)
    sap(F, a0, y0, c0, a1, y1, c1, kal, renk, mat = M.kumas) {
      const da = a1 - a0, dy = y1 - y0, dc = c1 - c0, L = Math.hypot(da, dy, dc);
      if (L < 1) return;
      C.egik(F, (a0 + a1) / 2, (y0 + y1) / 2, (c0 + c1) / 2, L / 2 + kal * 0.4, kal, kal, Math.atan2(dc, da), Math.asin(dy / L), renk, mat);
    },
    // yaprak: (a, y, c) sapa bağlandığı nokta; uz boyu, en genişliği; az yönü, el yükselmesi
    yaprak(F, a, y, c, uz, en, az, el, renk) {
      C.egik(F, a + Math.cos(az) * Math.cos(el) * uz / 2, y + Math.sin(el) * uz / 2, c + Math.sin(az) * Math.cos(el) * uz / 2, uz / 2, en / 2, Math.max(4, en * 0.07), az, el, renk, M.kumas);
    },
    // ekseni a yönünde yatay silindir (rulo, oklava)
    rulo(F, a0, a1, y, c, r, renk, mat = M.boya) { const p = dunya(F, a0, c - r), q = dunya(F, a1, c + r); koy(F.u[0] !== 0 ? 3 : 4, Math.min(p[0], q[0]), y - r, Math.min(p[1], q[1]), Math.max(p[0], q[0]), y + r, Math.max(p[1], q[1]), renk, mat, 1); },
  };
  return C;
}

// ---- Eşyalar. Hepsi (C, F, a, y, c, r) alır: a, c eşyanın taban merkezinin yeri; y üstüne konduğu yüzeyin kotu. Dönen: kapladığı yarı genişlik ----
const yaprakKumesi = (C, F, a, y, c, R, adet, r, yassi = 1) => {
  for (let i = 0; i < adet; i++) {
    const aci = r() * Math.PI * 2, uz = Math.sqrt(r()) * R, yuk = (r() - 0.35) * R * 1.2, b = R * r.ar(0.22, 0.42);
    C.elips(F, a + Math.cos(aci) * uz * 0.9, y + R * 0.75 + yuk, c + Math.sin(aci) * uz * 0.9, b * r.ar(0.9, 1.5), b * r.ar(0.55, 0.95) * yassi, b * r.ar(0.9, 1.5), r.sec(YESIL), M.kumas);
  }
};
const ESYA = {
  suIsitici(C, F, a, y, c, r) {
    const govde = r.sec(['#c9ccd0', '#e9e6df', '#2b2d31', '#b8c4bd']), mat = govde === '#c9ccd0' ? M.inox : M.seramik;
    C.sil(F, a, y, c, 82, 18, '#1f2023', M.koyu);
    C.sil(F, a, y + 18, c, 76, 150, govde, mat, 0.82);
    C.sil(F, a, y + 168, c, 60, 10, '#1f2023', M.koyu);
    C.elips(F, a, y + 180, c, 16, 12, 16, '#1f2023', M.koyu);
    C.kutu(F, a + 70, a + 96, y + 60, y + 150, c - 11, c + 11, '#1f2023', M.koyu);   // sap
    C.kutu(F, a + 62, a + 96, y + 140, y + 158, c - 11, c + 11, '#1f2023', M.koyu);
    C.kutu(F, a - 96, a - 62, y + 128, y + 150, c - 13, c + 13, govde, mat);          // ağız
    return 100;
  },
  kahveMakinesi(C, F, a, y, c, r) {
    const g = r.sec(['#24262a', '#d9d6cf', '#7d2a2a']);
    C.kutu(F, a - 105, a + 105, y, y + 22, c - 130, c + 120, g, M.seramik);
    C.kutu(F, a - 105, a + 105, y + 22, y + 330, c - 130, c - 20, g, M.seramik);
    C.kutu(F, a - 105, a + 105, y + 250, y + 330, c - 20, c + 120, g, M.seramik);
    C.kutu(F, a - 80, a + 80, y + 270, y + 312, c + 118, c + 124, '#b9bec4', M.inox);
    C.sil(F, a, y + 24, c + 50, 56, 112, '#cfdadd', M.cam, 1.22);
    C.sil(F, a, y + 26, c + 50, 50, 62, '#2a1a12', M.boya, 1.2);
    C.sil(F, a, y + 136, c + 50, 52, 10, '#1f2023', M.koyu);
    C.kutu(F, a + 52, a + 76, y + 50, y + 120, c + 42, c + 58, '#1f2023', M.koyu);
    return 115;
  },
  tostMakinesi(C, F, a, y, c, r) {
    const g = r.sec(['#c9ccd0', '#e8e2d4', '#b34a3a', '#2b2d31']), mat = g === '#c9ccd0' ? M.inox : M.seramik;
    C.kutu(F, a - 140, a + 140, y + 8, y + 178, c - 82, c + 82, g, mat);
    C.kutu(F, a - 144, a + 144, y, y + 10, c - 86, c + 86, '#1f2023', M.koyu);
    for (const k of [-34, 34]) C.kutu(F, a - 100, a + 100, y + 176, y + 181, c + k - 13, c + k + 13, '#15161a', M.koyu);
    C.kutu(F, a + 140, a + 152, y + 96, y + 116, c - 18, c + 18, '#1f2023', M.koyu);
    return 150;
  },
  meyveKasesi(C, F, a, y, c, r) {
    C.sil(F, a, y, c, 60, 14, '#f1efe9', M.seramik);
    C.sil(F, a, y + 14, c, 148, 66, r.sec(['#f1efe9', '#d7dfe0', '#2f3439', '#c9a274']), M.seramik, 1.52);
    const meyve = [['#e8842a', 38, 38], ['#b8262c', 36, 36], ['#8fb043', 36, 36], ['#e9c53a', 30, 46], ['#d9541e', 37, 37], ['#f0d24a', 30, 44], ['#6d2a5a', 26, 26]];
    for (let i = 0; i < 9; i++) {
      const m = r.sec(meyve), aci = r() * 6.283, uz = i < 6 ? r.ar(35, 92) : r.ar(0, 40), yon = r() < 0.5;
      C.elips(F, a + Math.cos(aci) * uz, y + 70 + m[1] * 0.55 + (i < 6 ? 0 : 46), c + Math.sin(aci) * uz, yon ? m[2] : m[1], m[1], yon ? m[1] : m[2], m[0], M.boya);
    }
    return 150;
  },
  kesmeTahtalari(C, F, a, y, c, r) { // duvara yaslanmış tahtalar (c: duvara yakın kenar)
    const n = 2 + (r() < 0.5 ? 1 : 0);
    let ic = c - 60;
    for (let i = 0; i < n; i++) {
      const w = r.ar(210, 300) - i * 30, h = r.ar(330, 420) - i * 50, t = r.ar(16, 24), kay = (i - (n - 1) / 2) * r.ar(40, 80);
      C.kutu(F, a + kay - w / 2, a + kay + w / 2, y, y + h, ic, ic + t, r.sec(AHSAP), M.ahsap);
      ic += t + 4;
    }
    if (r() < 0.6) C.disk(F, a + r.ar(-120, 120), y + 135, ic, ic + 18, 135, r.sec(AHSAP), M.ahsap);
    return 190;
  },
  kavanozlar(C, F, a, y, c, r) {
    const icerik = ['#e2c98f', '#c8733a', '#4a2e1c', '#efe6d2', '#8a9a4a', '#b53d2e', '#d9b25a'];
    let x = a - 120;
    for (let i = 0; i < 3; i++) {
      const R = r.ar(42, 54), h = r.ar(120, 200) - i * 10;
      C.sil(F, x + R, y, c, R, h, '#dfeaea', M.cam);
      C.sil(F, x + R, y + 3, c, R - 5, h * r.ar(0.55, 0.85), r.sec(icerik), M.boya);
      C.sil(F, x + R, y + h, c, R + 2, 18, r.sec(['#b98a5a', '#c9ccd0', '#2b2d31']), M.ahsap);
      x += R * 2 + 14;
    }
    return 170;
  },
  siseler(C, F, a, y, c, r) {
    C.kutu(F, a - 110, a + 110, y, y + 14, c - 70, c + 70, r.sec(AHSAP), M.ahsap);
    const renk = ['#4a5a2a', '#2a2a22', '#8a5a1e', '#3a4a3a'];
    let x = a - 70;
    for (let i = 0; i < 3; i++) {
      const R = r.ar(27, 36), h = r.ar(150, 210), kr = r.sec(renk);
      C.sil(F, x, y + 14, c + r.ar(-20, 20), R, h, kr, M.cam);
      C.sil(F, x, y + 14 + h, c, R, 38, kr, M.cam, 0.36);
      C.sil(F, x, y + 52 + h, c, R * 0.36, 44, kr, M.cam);
      C.sil(F, x, y + 96 + h, c, R * 0.42, 14, r.sec(['#1f2023', '#b98a5a', '#c9ccd0']), M.koyu);
      x += 70;
    }
    return 120;
  },
  kasiklik(C, F, a, y, c, r) {
    C.sil(F, a, y, c, 58, 150, r.sec(['#f1efe9', '#3a4b55', '#c9b79a', '#2b2d31']), M.seramik, 1.12);
    for (let i = 0; i < 7; i++) {
      const az = i * 0.9 + r.ar(-0.3, 0.3), el = r.ar(1.15, 1.45), L = r.ar(250, 330), ah = r() < 0.6, renk = ah ? r.sec(AHSAP) : '#c9ccd0', mat = ah ? M.ahsap : M.inox;
      const a1 = a + Math.cos(az) * Math.cos(el) * L, c1 = c + Math.sin(az) * Math.cos(el) * L, y1 = y + 20 + Math.sin(el) * L;
      C.sap(F, a + Math.cos(az) * 12, y + 20, c + Math.sin(az) * 12, a1, y1, c1, ah ? 6 : 4.5, renk, mat);
      C.egik(F, a1 + Math.cos(az) * Math.cos(el) * 26, y1 + Math.sin(el) * 26, c1 + Math.sin(az) * Math.cos(el) * 26, r.ar(30, 42), r.ar(17, 26), 5, az, el, renk, mat);
    }
    return 70;
  },
  baharatlik(C, F, a, y, c, r) {
    C.kutu(F, a - 135, a + 135, y, y + 12, c - 40, c + 40, r.sec(AHSAP), M.ahsap);
    const ic = ['#b53d2e', '#d9a23a', '#3f5a2a', '#5a3a22', '#e8dcc0', '#8a2a1e'];
    for (let i = 0; i < 5; i++) {
      const x = a - 104 + i * 52;
      C.sil(F, x, y + 12, c, 22, 82, '#e3ecec', M.cam);
      C.sil(F, x, y + 14, c, 19, r.ar(40, 70), r.sec(ic), M.boya);
      C.sil(F, x, y + 94, c, 23, 16, '#c9ccd0', M.inox);
    }
    return 140;
  },
  saksi(C, F, a, y, c, r) {
    const R = r.ar(52, 68), h = r.ar(86, 110), tur = r();
    C.sil(F, a, y, c, R, h, r.sec(['#c6714a', '#f1efe9', '#3a3d42', '#cfc6b4', '#8aa39a']), M.seramik, 1.26);
    C.sil(F, a, y + h - 8, c, R - 5, 6, '#3a2a1e', M.kumas);
    const ust = y + h - 4, n = 9 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) { // her sap dışa doğru eğik; üstünde ve boyunca yapraklar
      const az = i * 2.4 + r.ar(-0.4, 0.4), el = tur < 0.5 ? r.ar(0.75, 1.35) : r.ar(0.4, 1.2), L = r.ar(90, 190), b0 = r.ar(0, R * 0.5);
      const a0 = a + Math.cos(az) * b0, c0 = c + Math.sin(az) * b0, a1 = a0 + Math.cos(az) * Math.cos(el) * L, c1 = c0 + Math.sin(az) * Math.cos(el) * L, y1 = ust + Math.sin(el) * L, yr = r.sec(YESIL);
      C.sap(F, a0, ust, c0, a1, y1, c1, 2.6, '#5d7a3c');
      if (tur < 0.5) for (let j = 1; j <= 3; j++) { const t = j / 3, yon = az + (j % 2 ? 1.3 : -1.3); C.yaprak(F, a0 + (a1 - a0) * t, ust + (y1 - ust) * t, c0 + (c1 - c0) * t, r.ar(38, 62), r.ar(24, 36), yon, r.ar(0.1, 0.6), yr); }
      else C.yaprak(F, a1, y1, c1, r.ar(70, 120), r.ar(45, 75), az, el - r.ar(0.5, 1.0), yr); // tek büyük yaprak (paşa kılıcı, monstera gibi)
    }
    return 115;
  },
  kagitHavlu(C, F, a, y, c, r) {
    C.sil(F, a, y, c, 68, 10, '#c9ccd0', M.inox);
    C.sil(F, a, y + 10, c, 9, 285, '#c9ccd0', M.inox);
    C.sil(F, a, y + 12, c, 58, 250, '#f4f2ec', M.kumas);
    C.elips(F, a, y + 300, c, 14, 10, 14, '#c9ccd0', M.inox);
    return 75;
  },
  fincanTepsisi(C, F, a, y, c, r) {
    C.kutu(F, a - 160, a + 160, y, y + 16, c - 105, c + 105, r.sec(AHSAP), M.ahsap);
    const fr = r.sec(['#f1efe9', '#c9d4d6', '#e8d9c4', '#3a4b55']);
    for (const [dx, dz] of [[-80, -30], [20, 40], [-40, 55]]) {
      C.sil(F, a + dx, y + 16, c + dz, 52, 6, fr, M.seramik);
      C.sil(F, a + dx, y + 22, c + dz, 38, 62, fr, M.seramik, 1.2);
      C.sil(F, a + dx, y + 26, c + dz, 33, 50, '#3a2415', M.boya, 1.2);
    }
    C.sil(F, a + 95, y + 16, c - 40, 46, 78, fr, M.seramik, 0.86);
    C.elips(F, a + 95, y + 100, c - 40, 42, 16, 42, fr, M.seramik);
    C.elips(F, a + 95, y + 120, c - 40, 10, 9, 10, fr, M.seramik);
    return 170;
  },
  sabunluk(C, F, a, y, c, r) {
    C.kutu(F, a - 90, a + 90, y, y + 10, c - 50, c + 50, '#e9e6df', M.seramik);
    C.sil(F, a - 40, y + 10, c, 32, 128, r.sec(['#7a4a1e', '#e9e6df', '#3a3d42']), M.cam);
    C.sil(F, a - 40, y + 138, c, 12, 36, '#c9ccd0', M.inox);
    C.kutu(F, a - 44, a + 4, y + 170, y + 180, c - 6, c + 6, '#c9ccd0', M.inox);
    C.kutu(F, a + 14, a + 82, y + 10, y + 38, c - 32, c + 32, r.sec(['#e9c53a', '#7ab6c9', '#e88a4a']), M.kumas);
    return 95;
  },
  tabakYigini(C, F, a, y, c, r) {
    const n = 5 + Math.floor(r() * 5), renk = r.sec(['#f4f2ec', '#e3e9ea', '#d9cfbf', '#3a4b55']);
    for (let i = 0; i < n; i++) C.sil(F, a, y + i * 13, c, 118 - (i % 2) * 3, 11, renk, M.seramik, 1.24);
    return 125;
  },
  kaseYigini(C, F, a, y, c, r) {
    const n = 3 + Math.floor(r() * 3), renk = r.sec(['#f4f2ec', '#c9d4d6', '#c6714a', '#8aa39a']);
    for (let i = 0; i < n; i++) C.sil(F, a, y + i * 26, c, 78, 60, renk, M.seramik, 1.5);
    return 85;
  },
  bardaklar(C, F, a, y, c, r) {
    const n = 3 + Math.floor(r() * 2), h = r.ar(95, 130);
    for (let i = 0; i < n; i++) C.sil(F, a + (i - (n - 1) / 2) * 76, y, c + (i % 2 ? 18 : -18), 33, h, '#e6f0f0', M.cam, 1.16);
    return n * 40;
  },
  kitaplar(C, F, a, y, c, r) {
    const renk = ['#7a2e2e', '#2e4a6a', '#3f5a3a', '#c9a23a', '#e9e2d0', '#2b2d31', '#8a5a36', '#b86a4a', '#5a4a6a'];
    const n = 5 + Math.floor(r() * 5);
    let x = a - n * 15;
    for (let i = 0; i < n; i++) { const t = r.ar(20, 42), h = r.ar(185, 260), d = r.ar(140, 180); C.kutu(F, x, x + t, y, y + h, c - d / 2, c + d / 2, r.sec(renk), M.boya); x += t + 1; }
    const w = r.ar(170, 230);
    for (let i = 0; i < 2; i++) C.kutu(F, x + 12, x + 12 + w - i * 20, y + i * 34, y + (i + 1) * 34 - 2, c - 75, c + 75, r.sec(renk), M.boya);
    return n * 16 + 120;
  },
  vazo(C, F, a, y, c, r) {
    const cam = r() < 0.4, renk = cam ? '#dbe8e6' : r.sec(['#f1efe9', '#3a4b55', '#c6714a', '#d9cfbf', '#2b2d31', '#8aa39a']), mat = cam ? M.cam : M.seramik, h = r.ar(210, 300);
    C.sil(F, a, y, c, 46, 10, renk, mat);
    C.elips(F, a, y + h * 0.36, c, 70, h * 0.36, 70, renk, mat);
    C.sil(F, a, y + h * 0.6, c, 30, h * 0.4, renk, mat, 1.3);
    const cicek = r.sec([['#f4f2ec', '#e9c53a'], ['#e7a6b0', '#f1d6dc'], ['#d9541e', '#e9a23a'], ['#d8c9a6', '#c9b58a'], ['#b8262c', '#e88a8a']]), kuru = cicek[0] === '#d8c9a6';
    for (let i = 0; i < 12; i++) { // saplar vazonun ağzından dışa doğru açılır
      const az = i * 2.4 + r.ar(-0.5, 0.5), el = r.ar(0.95, 1.5), L = r.ar(200, 400), y0 = y + h - 30;
      const tx = a + Math.cos(az) * Math.cos(el) * L, tz = c + Math.sin(az) * Math.cos(el) * L, ty = y0 + Math.sin(el) * L;
      C.sap(F, a, y0, c, tx, ty, tz, 2.8, kuru ? '#b9a67c' : '#5b7a3c');
      if (kuru) C.egik(F, tx + Math.cos(az) * Math.cos(el) * 70, ty + Math.sin(el) * 70, tz + Math.sin(az) * Math.cos(el) * 70, 85, 20, 20, az, el, r.sec(cicek));
      else {
        C.elips(F, tx, ty + 14, tz, r.ar(26, 40), r.ar(20, 30), r.ar(26, 40), r.sec(cicek), M.kumas);
        C.elips(F, tx, ty + 22, tz, 10, 9, 10, '#d9a23a', M.kumas);
        if (r() < 0.75) C.yaprak(F, a + (tx - a) * 0.55, y0 + (ty - y0) * 0.55, c + (tz - c) * 0.55, r.ar(60, 95), r.ar(26, 38), az + r.ar(-1.2, 1.2), r.ar(0.1, 0.7), r.sec(YESIL));
      }
    }
    return 150;
  },
  mumluk(C, F, a, y, c, r) {
    C.kutu(F, a - 150, a + 150, y, y + 12, c - 70, c + 70, r.sec(['#2b2d31', ...AHSAP, '#d9cfbf']), M.ahsap);
    for (const [dx, h, R] of [[-85, 150, 34], [0, 105, 38], [85, 70, 34]]) { C.sil(F, a + dx, y + 12, c, R, h, r.sec(['#f4f0e4', '#e6dcc8', '#d9c9c0']), M.kumas); C.sil(F, a + dx, y + 12 + h, c, 2.5, 12, '#2b2d31', M.koyu); }
    return 160;
  },
};

// Büyük yer saksısı: geniş yapraklı (kauçuk / keman yapraklı) ya da top biçimli
function yerSaksisi(C, F, a, c, r) {
  const sepet = r() < 0.4, R = r.ar(170, 215), h = r.ar(330, 420), tur = r();
  C.sil(F, a, 0, c, R, h, sepet ? '#c9a46a' : r.sec(['#f1efe9', '#3a3d42', '#c6714a', '#d9cfbf', '#5a6a66']), sepet ? M.kumas : M.seramik, 1.2);
  if (sepet) for (let i = 1; i < 6; i++) C.sil(F, a, h * i / 6, c, R * (0.84 + 0.16 * i / 6) + 2, 8, '#b08a52', M.kumas);
  C.sil(F, a, h - 14, c, R - 14, 8, '#35271c', M.kumas);
  if (tur < 0.2) { // top biçimli çalı
    C.sil(F, a, h - 10, c, 16, 260, '#5a4632', M.ahsap);
    for (let i = 0; i < 110; i++) {
      const aci = r() * 6.283, fi = Math.acos(2 * r() - 1), RR = 300 * Math.cbrt(r()) * 1.02, b = r.ar(50, 95);
      C.elips(F, a + Math.sin(fi) * Math.cos(aci) * RR, h + 520 + Math.cos(fi) * RR * 0.92, c + Math.sin(fi) * Math.sin(aci) * RR, b, b * r.ar(0.6, 0.9), b, r.sec(YESIL), M.kumas);
    }
    return;
  }
  if (tur < 0.6) { // geniş yapraklı ağaççık (kauçuk, keman yapraklı incir): hafif eğik gövdeler, sarmal dizili büyük yapraklar
    const govde = 2 + Math.floor(r() * 2);
    for (let g = 0; g < govde; g++) {
      const az0 = g / govde * 6.283 + r.ar(-0.5, 0.5), b0 = r.ar(20, 70), boy = r.ar(950, 1450) - g * 180, egim = r.ar(40, 130);
      const a0 = a + Math.cos(az0) * b0, c0 = c + Math.sin(az0) * b0, a1 = a0 + Math.cos(az0) * egim, c1 = c0 + Math.sin(az0) * egim, y0 = h - 10, y1 = y0 + boy;
      C.sap(F, a0, y0, c0, a1, y1, c1, r.ar(9, 13), '#6a5a3c', M.ahsap);
      const n = 9 + Math.floor(r() * 6);
      for (let j = 0; j < n; j++) {
        const t = 0.3 + 0.7 * (j + 1) / n, az = az0 + j * 2.4 + r.ar(-0.3, 0.3), el = 0.3 + 0.85 * Math.pow(t, 1.4) + r.ar(-0.25, 0.25), uz = r.ar(210, 320) * (1.05 - 0.3 * t), yr = r.sec(YESIL);
        const pa = a0 + (a1 - a0) * t, pc = c0 + (c1 - c0) * t, py = y0 + boy * t, sapUz = r.ar(30, 60);
        C.sap(F, pa, py, pc, pa + Math.cos(az) * sapUz, py + Math.sin(el) * sapUz * 0.6, pc + Math.sin(az) * sapUz, 3.2, '#5d7a3c');
        C.yaprak(F, pa + Math.cos(az) * sapUz, py + Math.sin(el) * sapUz * 0.6, pc + Math.sin(az) * sapUz, uz, uz * r.ar(0.36, 0.46), az, el, yr);
      }
    }
    return;
  }
  // palmiye (areka): tabandan yay çizerek açılan dallar, iki yanında ince yaprakçıklar
  const dal = 8 + Math.floor(r() * 4);
  for (let i = 0; i < dal; i++) {
    const az = i / dal * 6.283 + r.ar(-0.3, 0.3), boy = r.ar(1000, 1500), yr = r.sec(YESIL);
    let pa = a + Math.cos(az) * r.ar(10, 60), pc = c + Math.sin(az) * r.ar(10, 60), py = h - 10;
    const dilim = 5;
    for (let k = 0; k < dilim; k++) { // yukarı çıkarken dışa doğru yatan yay
      const el = 1.45 - 1.0 * Math.pow(k / (dilim - 1), 1.5), L = boy / dilim, na = pa + Math.cos(az) * Math.cos(el) * L, nc = pc + Math.sin(az) * Math.cos(el) * L, ny = py + Math.sin(el) * L;
      C.sap(F, pa, py, pc, na, ny, nc, 5 - k * 0.6, '#5d7a3c');
      if (k >= 1) for (let j = 0; j < 4; j++) for (const yan of [-1, 1]) {
        const t = (j + 0.5) / 4, uz = r.ar(150, 240) * (1.1 - 0.12 * k);
        C.yaprak(F, pa + (na - pa) * t, py + (ny - py) * t, pc + (nc - pc) * t, uz, r.ar(20, 30), az + yan * r.ar(0.75, 1.1), el - r.ar(0.25, 0.6), yr);
      }
      pa = na; pc = nc; py = ny;
    }
  }
}

// Halı: zemin üstünde ince kumaş, bordür ve desen şeritleri
function hali(C, x0, z0, x1, z1, r) {
  const F = cerceve(x0, z0, [1, 0], [0, 1]), w = x1 - x0, d = z1 - z0, tur = Math.floor(r() * 3);
  const takim = r.sec([['#d9cfbc', '#8a7a62', '#b9a98c'], ['#c9bfb0', '#4a5560', '#8a929b'], ['#c7a77a', '#7a5a36', '#e3d2b0'], ['#b8b3aa', '#2f3439', '#e6e2da'], ['#a7b0a0', '#56634f', '#dfe3d6']]);
  C.kutu(F, 0, w, 0, 9, 0, d, takim[0], M.kumas);
  if (tur === 0) { // bordürlü, ortası madalyon
    const b = Math.min(w, d) * 0.07;
    for (const [a0, a1, c0, c1] of [[b, w - b, b, b * 1.6], [b, w - b, d - b * 1.6, d - b], [b, b * 1.6, b, d - b], [w - b * 1.6, w - b, b, d - b]]) C.kutu(F, a0, a1, 9, 10.5, c0, c1, takim[1], M.kumas);
    C.elips(F, w / 2, 9.6, d / 2, Math.min(w, d) * 0.3, 1.2, Math.min(w, d) * 0.2, takim[2], M.kumas);
    C.elips(F, w / 2, 10.2, d / 2, Math.min(w, d) * 0.16, 1.2, Math.min(w, d) * 0.1, takim[1], M.kumas);
  } else if (tur === 1) { // çizgili yolluk
    const uzun = w >= d, L = uzun ? w : d, n = Math.max(5, Math.round(L / 260));
    for (let i = 0; i < n; i++) { const p = L * (i + 0.5) / n, k = L / n * 0.22; if (uzun) C.kutu(F, p - k, p + k, 9, 10.5, 0, d, i % 2 ? takim[1] : takim[2], M.kumas); else C.kutu(F, 0, w, 9, 10.5, p - k, p + k, i % 2 ? takim[1] : takim[2], M.kumas); }
  } else { // jüt örgü: iç içe çerçeveler
    const n = 5;
    for (let i = 1; i < n; i++) { const g = Math.min(w, d) / 2 * i / n, t = Math.min(w, d) * 0.018; for (const [a0, a1, c0, c1] of [[g, w - g, g, g + t], [g, w - g, d - g - t, d - g], [g, g + t, g, d - g], [w - g - t, w - g, g, d - g]]) C.kutu(F, a0, a1, 9, 10.5, c0, c1, i % 2 ? takim[1] : takim[2], M.kumas); }
  }
}

// Duvar tablosu: çerçeve, paspartu ve soyut ya da bitki desenli resim. F: duvar çerçevesi (a duvar boyunca, c duvardan dışarı)
function tablo(C, F, a, y, w, h, r) {
  const cer = r.sec(['#1f2023', '#f1efe9', '#b98a5a', '#6f4a30', '#c9a23a']), kal = 22, pas = Math.min(w, h) * 0.11;
  C.kutu(F, a - w / 2, a + w / 2, y - h / 2, y + h / 2, 0, 26, cer, M.ahsap);
  C.kutu(F, a - w / 2 + kal, a + w / 2 - kal, y - h / 2 + kal, y + h / 2 - kal, 26, 28, '#f6f3ec', M.kumas);
  const ix0 = a - w / 2 + kal + pas, ix1 = a + w / 2 - kal - pas, iy0 = y - h / 2 + kal + pas, iy1 = y + h / 2 - kal - pas, iw = ix1 - ix0, ih = iy1 - iy0, tur = Math.floor(r() * 3);
  if (tur === 0) { // bitki baskısı
    C.kutu(F, ix0, ix1, iy0, iy1, 28, 29, r.sec(['#f1eadb', '#e6ebe2', '#f4efe6']), M.kumas);
    C.kutu(F, a - 3, a + 3, iy0 + ih * 0.08, iy0 + ih * 0.7, 29, 30, '#4d6b3a', M.kumas);
    for (let i = 0; i < 7; i++) { const yy = iy0 + ih * (0.25 + 0.6 * i / 7), sag = i % 2 ? 1 : -1, uz = iw * r.ar(0.16, 0.3); C.kutu(F, a + (sag > 0 ? 0 : -uz), a + (sag > 0 ? uz : 0), yy, yy + ih * 0.075, 29, 30, r.sec(YESIL), M.kumas); }
  } else if (tur === 1) { // soyut renk alanları
    const palet = r.sec([['#d9a273', '#3a4b55', '#e9e2d0', '#8aa39a'], ['#c6714a', '#f1eadb', '#2f3439', '#d9b25a'], ['#7a8f9a', '#e6ded0', '#b98a5a', '#2b3a44']]);
    C.kutu(F, ix0, ix1, iy0, iy1, 28, 29, palet[2], M.kumas);
    C.kutu(F, ix0, ix0 + iw * 0.55, iy0, iy0 + ih * 0.45, 29, 30, palet[0], M.kumas);
    C.kutu(F, ix0 + iw * 0.35, ix1, iy0 + ih * 0.55, iy1, 29, 30, palet[1], M.kumas);
    C.disk(F, ix0 + iw * 0.62, iy0 + ih * 0.42, 30, 31, Math.min(iw, ih) * 0.2, palet[3], M.kumas);
  } else { // manzara: ufuk, güneş, tepeler
    C.kutu(F, ix0, ix1, iy0 + ih * 0.42, iy1, 28, 29, '#e9d9c0', M.kumas);
    C.kutu(F, ix0, ix1, iy0, iy0 + ih * 0.42, 28, 29, '#8a9a86', M.kumas);
    C.disk(F, ix0 + iw * 0.68, iy0 + ih * 0.66, 29, 30, Math.min(iw, ih) * 0.13, '#d9813a', M.kumas);
    C.kutu(F, ix0, ix0 + iw * 0.6, iy0 + ih * 0.3, iy0 + ih * 0.5, 29, 30, '#56634f', M.kumas);
  }
}
function duvarSaati(C, F, a, y, r) {
  const R = r.ar(140, 175), cer = r.sec(['#1f2023', '#b98a5a', '#c9a23a', '#f1efe9']);
  C.disk(F, a, y, 0, 30, R, cer, M.ahsap);
  C.disk(F, a, y, 30, 32, R - 14, '#f6f3ec', M.kumas);
  for (let i = 0; i < 12; i++) { const t = i / 12 * 6.283, q = R - 30; C.kutu(F, a + Math.sin(t) * q - 4, a + Math.sin(t) * q + 4, y + Math.cos(t) * q - 4, y + Math.cos(t) * q + 4, 32, 33.5, '#2b2d31', M.koyu); }
  C.kutu(F, a - 4, a + 4, y, y + R * 0.52, 33, 35, '#1f2023', M.koyu);           // akrep
  C.kutu(F, a, a + R * 0.66, y - 3, y + 3, 33, 35, '#1f2023', M.koyu);            // yelkovan
  C.disk(F, a, y, 33, 37, 9, '#1f2023', M.koyu);
}
function dekorTabaklari(C, F, a, y, r) {
  const renk = r.sec([['#f1efe9', '#2e4a6a', '#7a9ab8'], ['#f1eadb', '#b86a4a', '#3a4b55'], ['#e9e6df', '#56634f', '#c9a23a']]);
  for (const [dx, dy, R] of [[-150, 60, 120], [110, 130, 95], [60, -110, 105]]) {
    C.disk(F, a + dx, y + dy, 0, 14, R, renk[0], M.seramik);
    C.disk(F, a + dx, y + dy, 14, 16, R * 0.78, renk[1], M.seramik);
    C.disk(F, a + dx, y + dy, 16, 18, R * 0.5, renk[0], M.seramik);
    C.disk(F, a + dx, y + dy, 18, 20, R * 0.22, renk[2], M.seramik);
  }
}

// ---- Yerleşim ---------------------------------------------------------------------------------
const cihazMi = m => ['buzdolabi', 'davlumbaz', 'davlumbaz_ada'].includes(m.tip);
const hacimli = m => { const s = TANIM[m.tip]?.sinif; return s === 'alt' || s === 'ust' || s === 'boy' || s === 'yapi' || s === 'dekor'; };
const kesisir = (a, b, pay = 0) => a.x0 < b.x1 + pay && a.x1 > b.x0 - pay && a.z0 < b.z1 + pay && a.z1 > b.z0 - pay;
// aralık listesinden [b0, b1] çıkarılır
const cikar = (liste, b0, b1) => liste.flatMap(([a0, a1]) => b1 <= a0 || b0 >= a1 ? [[a0, a1]] : [[a0, Math.min(a1, b0)], [Math.max(a0, b1), a1]].filter(q => q[1] - q[0] > 1));

// Odanın dekoru. Dönen: [{ s: biçim (0 kutu, 1 elipsoit, 2 / 3 / 4 ekseni y / x / z olan silindir), b: [x0, y0, z0, x1, y1, z1] mm,
//   k: koninin daralması, r: renk, m: fotoğraf motoru malzeme kodu, d: dayandığı duvar ('' ise serbest) }]
export function dekorUret(p) {
  const A = dekorAyari(p), liste = [];
  if (!A.acik || !p?.oda || !Array.isArray(p.moduller)) return liste;
  const { oda } = p, r = rastgele(A.tohum * 7919 + Math.round(oda.w) + Math.round(oda.d) * 3);
  const kutular = p.moduller.filter(m => TANIM[m.tip] && hacimli(m)).map(m => ({ m, ...kutu(m, oda) }));
  const bosMu = (b, y0, y1, pay = 0) => b.x0 >= 0 && b.z0 >= 0 && b.x1 <= oda.w && b.z1 <= oda.d && !kutular.some(k => kesisir(b, k, pay) && k.y0 < y1 && k.y1 > y0);
  const tz = tezgahlar(p).map(b => {
    const dv = b.z0 < 1 ? 'arka' : b.x0 < 1 ? 'sol' : b.x1 > oda.w - 1 ? 'sag' : b.z1 > oda.d - 1 ? 'on' : '';
    return { ...b, dv, ust: b.y + TEZGAH_K };
  });

  // --- Tezgah üstü ---
  if (A.tezgah || A.bitki || A.masa) for (const b of tz) {
    const C = Cizer(liste, b.dv), xBoy = b.dv === 'arka' || b.dv === 'on' || (!b.dv && b.x1 - b.x0 >= b.z1 - b.z0);
    // çerçeve: a tezgah boyunca, c duvardan (adada arka kenardan) öne
    const F = b.dv === 'arka' ? cerceve(b.x0, b.z0, [1, 0], [0, 1]) : b.dv === 'on' ? cerceve(b.x0, b.z1, [1, 0], [0, -1]) : b.dv === 'sol' ? cerceve(b.x0, b.z0, [0, 1], [1, 0]) : b.dv === 'sag' ? cerceve(b.x1, b.z0, [0, 1], [-1, 0])
      : xBoy ? cerceve(b.x0, b.z0, [1, 0], [0, 1]) : cerceve(b.x0, b.z0, [0, 1], [1, 0]);
    const L = xBoy ? b.x1 - b.x0 : b.z1 - b.z0, D = xBoy ? b.z1 - b.z0 : b.x1 - b.x0, a0 = xBoy ? b.x0 : b.z0;
    let bos = [[90, L - 90]];
    const evyeler = [];
    for (const k of kutular) { // evye ve ocak boş bırakılır; başka tezgahla kesişen köşe iki kez donatılmaz; üstte yer kaplayanlar (boy dolap yanı) hariç
      const t = k.m.tip, lo = (xBoy ? k.x0 : k.z0) - a0, hi = (xBoy ? k.x1 : k.z1) - a0;
      if (!kesisir(k, b)) continue;
      if (t === 'alt_evye') { bos = cikar(bos, lo - 60, hi + 60); evyeler.push([lo, hi]); }
      else if (t === 'alt_ocak' || ((t === 'alt_firin' || t === 'alt_solo') && k.m.ocakTip !== 'yok')) bos = cikar(bos, lo - 150, hi + 150);
      else if (k.y0 < b.ust + 380 && k.y1 > b.ust + 5) bos = cikar(bos, lo - 40, hi + 40); // tezgahın hemen üstünde bir şey var (alçak üst dolap, mikrodalga)
    }
    for (const o of tz) if (o !== b && kesisir(o, b)) bos = cikar(bos, (xBoy ? o.x0 : o.z0) - a0 - 60, (xBoy ? o.x1 : o.z1) - a0 + 60);
    const ada = !b.dv;
    if (ada) { // ada: ortada tek bir düzen (vazo, meyve ya da mumluk)
      if (!A.masa) continue;
      const orta = bos.map(q => [q, Math.min(L / 2, q[1]) - Math.max(L / 2, q[0])]).sort((x, y) => y[1] - x[1])[0]?.[0];
      if (!orta || orta[1] - orta[0] < 420) continue;
      const a = Math.min(orta[1] - 200, Math.max(orta[0] + 200, L / 2));
      ESYA[r.sec(['vazo', 'meyveKasesi', 'mumluk'])](C, F, a, b.ust, D / 2, r);
      if (A.yogunluk > 1 && orta[1] - orta[0] > 1300) ESYA.fincanTepsisi(C, F, a + (a < L / 2 ? 520 : -520), b.ust, D / 2, r);
      continue;
    }
    const arkaC = Math.min(175, D * 0.3); // duvara yakın şerit: ön taraf çalışma alanı olarak boş kalır
    if (A.tezgah) for (const [lo, hi] of evyeler) { // evyenin yanında sabunluk
      const sag = bos.find(q => q[0] >= hi && q[1] - q[0] > 230), sol = [...bos].reverse().find(q => q[1] <= lo && q[1] - q[0] > 230);
      if (sag) { ESYA.sabunluk(C, F, sag[0] + 110, b.ust, arkaC - 30, r); bos = cikar(bos, sag[0], sag[0] + 240); }
      else if (sol) { ESYA.sabunluk(C, F, sol[1] - 110, b.ust, arkaC - 30, r); bos = cikar(bos, sol[1] - 240, sol[1]); }
    }
    const aralik = [0, 1250, 760, 470][A.yogunluk];
    let havuz = r.kar([...(A.tezgah ? ['suIsitici', 'kahveMakinesi', 'meyveKasesi', 'kesmeTahtalari', 'kavanozlar', 'siseler', 'kasiklik', 'baharatlik', 'kagitHavlu', 'tostMakinesi', 'fincanTepsisi'] : []), ...(A.bitki ? ['saksi'] : [])]);
    for (const [lo, hi] of bos) {
      let a = lo + r.ar(60, 220);
      while (havuz.length && a + 130 < hi) {
        const ad = havuz.shift(), yari = { suIsitici: 100, kahveMakinesi: 115, tostMakinesi: 150, meyveKasesi: 150, kesmeTahtalari: 190, kavanozlar: 170, siseler: 120, kasiklik: 70, baharatlik: 140, saksi: 115, kagitHavlu: 75, fincanTepsisi: 170 }[ad];
        if (a + yari * 2 > hi + 20) { havuz.push(ad); if (havuz.every(x => a + 150 > hi)) break; a += 40; continue; }
        const c = ad === 'kesmeTahtalari' ? 62 : ad === 'meyveKasesi' || ad === 'fincanTepsisi' ? Math.min(D * 0.42, 230) : arkaC;
        ESYA[ad](C, F, a + yari, b.ust, c, r);
        a += yari * 2 + aralik * r.ar(0.7, 1.3);
      }
    }
  }

  // --- Raf ve vitrin içi; vitrin ışığı ---
  if (A.raf || A.vitrin) for (const m of p.moduller) {
    if (!['ust_acik', 'ust_cam', 'ust_kavis_acik'].includes(m.tip) && !(m.tip === 'boy_kiler' && false)) continue;
    const ps = parcalar(m).filter(q => !q.sekil && q.mat === 'govde' && Number.isFinite(q.sy) && q.sy <= 30 && q.sx > 150 && q.sz > 120).sort((x, y) => x.y - y.y);
    if (ps.length < 2) continue;
    const C = Cizer(liste, DUVAR_LISTE.includes(m.duvar) ? m.duvar : '');
    for (let i = 0; i < ps.length - 1; i++) {
      const q = ps[i], ust = ps[i + 1], bosluk = ust.y - (q.y + q.sy), R = yerelKutu(m, oda, q.x + 25, q.x + q.sx - 25, q.z + 25, q.z + q.sz - 20), yy = m.y + q.y + q.sy;
      const xBoy = m.duvar === 'arka' || m.duvar === 'on' || (!DUVAR_LISTE.includes(m.duvar) && R.x1 - R.x0 >= R.z1 - R.z0);
      const F = xBoy ? cerceve(R.x0, R.z0, [1, 0], [0, 1]) : cerceve(R.x0, R.z0, [0, 1], [1, 0]), L = xBoy ? R.x1 - R.x0 : R.z1 - R.z0, D = xBoy ? R.z1 - R.z0 : R.x1 - R.x0;
      if (A.vitrin && m.tip === 'ust_cam' && i === ps.length - 2) C.kutu(F, 20, L - 20, m.y + ust.y - 9, m.y + ust.y - 2, D * 0.55, D * 0.55 + 16, '#ffd9a0', M.isik);
      if (!A.raf || bosluk < 150 || L < 240 || D < 150) continue;
      const adaylar = r.kar([['tabakYigini', 125, 150], ['kaseYigini', 85, 180], ['bardaklar', 150, 140], ['kitaplar', 200, 270], ['kavanozlar', 170, 230], ['saksi', 115, 330], ['vazo', 150, 620], ['baharatlik', 140, 120]]
        .filter(e => e[2] <= bosluk - 12 && (e[0] !== 'saksi' || A.bitki) && (m.tip !== 'ust_cam' || !['kitaplar', 'saksi', 'vazo'].includes(e[0]))));
      let a = r.ar(20, 70);
      for (const [ad, yari] of adaylar) {
        if (a + yari * 2 > L - 10) continue;
        ESYA[ad](C, F, a + yari, yy, D / 2, r);
        a += yari * 2 + r.ar(40, 130) * (4 - A.yogunluk);
        if (A.yogunluk === 1) break;
      }
    }
  }

  // --- TV ünitesinin üstü: iki uçta birer eşya (ortası televizyon için boş) ---
  if (A.masa) for (const k of kutular.filter(q => q.m.tip === 'alt_tv')) {
    const dv = DUVAR_LISTE.includes(k.m.duvar) ? k.m.duvar : '', C = Cizer(liste, dv), xBoy = k.x1 - k.x0 >= k.z1 - k.z0;
    const F = xBoy ? cerceve(k.x0, k.z0, [1, 0], [0, 1]) : cerceve(k.x0, k.z0, [0, 1], [1, 0]), L = xBoy ? k.x1 - k.x0 : k.z1 - k.z0, D = xBoy ? k.z1 - k.z0 : k.x1 - k.x0;
    if (L < 900 || D < 250) continue;
    const ustuDolu = a => kutular.some(o => o !== k && o.y0 < k.y1 + 400 && o.y1 > k.y1 + 5 && (xBoy ? o.x0 < k.x0 + a + 160 && o.x1 > k.x0 + a - 160 && o.z0 < k.z1 && o.z1 > k.z0 : o.z0 < k.z0 + a + 160 && o.z1 > k.z0 + a - 160 && o.x0 < k.x1 && o.x1 > k.x0));
    const esya = r.kar(['vazo', 'kitaplar', 'mumluk', 'saksi']);
    [190, L - 190].forEach((a, i) => { if (!ustuDolu(a) && (esya[i] !== 'saksi' || A.bitki)) ESYA[esya[i]](C, F, a, k.y1, D / 2, r); });
  }

  // --- Masa üstü ---
  if (A.masa) for (const k of kutular.filter(q => q.m.tip === 'masa')) {
    const C = Cizer(liste), w = k.x1 - k.x0, d = k.z1 - k.z0, F = cerceve(k.x0, k.z0, [1, 0], [0, 1]), y = k.y1;
    ESYA[r.sec(['vazo', 'vazo', 'meyveKasesi', 'mumluk'])](C, F, w / 2, y, d / 2, r);
    if (A.yogunluk > 1) { // servis: uzun kenarlarda karşılıklı tabak ve bardak
      const xBoy = w >= d, L = xBoy ? w : d, D = xBoy ? d : w, n = L > 1500 ? 2 : 1, G = xBoy ? F : cerceve(k.x0, k.z0, [0, 1], [1, 0]), tabak = r.sec(['#f4f2ec', '#d9e0e0', '#3a4b55']);
      for (let i = 0; i < n; i++) for (const c of [150, D - 150]) {
        const a = L * (i + 0.5) / n + (n === 1 ? (c < D / 2 ? -360 : 360) : 0);
        if (a < 160 || a > L - 160) continue;
        C.sil(G, a, y, c, 135, 4, '#c9b79a', M.kumas); C.sil(G, a, y + 4, c, 118, 12, tabak, M.seramik, 1.25); C.sil(G, a + 150, y, c + (c < D / 2 ? 40 : -40), 32, 105, '#e6f0f0', M.cam, 1.16);
      }
    }
  }

  // --- Halı ---
  if (A.hali) {
    const C = Cizer(liste), masa = kutular.find(q => q.m.tip === 'masa');
    const yer = q => bosMu(q, 0, 40, 0) || !kutular.some(k => k.y0 < 20 && kesisir(q, k, 0) && !['masa', 'sandalye', 'tabure'].includes(k.m.tip));
    let kondu = false;
    if (masa) for (const pay of [650, 450, 250]) {
      const q = { x0: Math.max(60, masa.x0 - pay), z0: Math.max(60, masa.z0 - pay), x1: Math.min(oda.w - 60, masa.x1 + pay), z1: Math.min(oda.d - 60, masa.z1 + pay) };
      if (q.x1 - q.x0 > 900 && q.z1 - q.z0 > 900 && yer(q)) { hali(C, q.x0, q.z0, q.x1, q.z1, r); kondu = true; break; }
    }
    if (!kondu) { // en geniş boş zemin dikdörtgeni (10 cm'lik ızgarada): dolaplar, tabureler ve kapı önleri dolu sayılır
      const H = 100, nx = Math.floor(oda.w / H), nz = Math.floor(oda.d / H), dolu = new Uint8Array(nx * nz);
      const isaretle = (x0, z0, x1, z1) => { for (let j = Math.max(0, Math.floor(z0 / H)); j < Math.min(nz, Math.ceil(z1 / H)); j++) for (let i = Math.max(0, Math.floor(x0 / H)); i < Math.min(nx, Math.ceil(x1 / H)); i++) dolu[j * nx + i] = 1; };
      for (const k of kutular) if (k.y0 < 30 && !['pencere', 'nis', 'kiris'].includes(k.m.tip)) { const pay = k.m.tip === 'kapi' ? 900 : 120; isaretle(k.x0 - pay, k.z0 - pay, k.x1 + pay, k.z1 + pay); }
      for (const b of tz) if (b.dv) { const c = 1000; isaretle(b.x0 - (b.dv === 'sag' ? c : 0), b.z0 - (b.dv === 'on' ? c : 0), b.x1 + (b.dv === 'sol' ? c : 0), b.z1 + (b.dv === 'arka' ? c : 0)); } // tezgah önündeki çalışma şeridi boş kalır
      isaretle(0, 0, oda.w, 150); isaretle(0, oda.d - 150, oda.w, oda.d); isaretle(0, 0, 150, oda.d); isaretle(oda.w - 150, 0, oda.w, oda.d); // duvar dipleri
      let iyi = null;
      const yuk = new Int32Array(nx);
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) yuk[i] = dolu[j * nx + i] ? 0 : yuk[i] + 1;
        for (let i = 0; i < nx; i++) { // her sütundan sağa doğru en küçük yüksekliğe göre dikdörtgen
          let en = yuk[i];
          for (let k = i; k < nx && en > 0; k++) {
            en = Math.min(en, yuk[k]);
            const w = Math.min(32, k - i + 1), d = Math.min(22, en), puan = w * d - Math.abs(w - d * 1.5) * 0.5;
            if (w >= 12 && d >= 7 && (!iyi || puan > iyi.puan)) iyi = { puan, i: i + Math.floor((k - i + 1 - w) / 2), j: j - en + 1 + Math.floor((en - d) / 2), w, d };
          }
        }
      }
      if (iyi) { hali(C, iyi.i * H + 60, iyi.j * H + 60, (iyi.i + iyi.w) * H - 60, (iyi.j + iyi.d) * H - 60, r); kondu = true; }
    }
    if (!kondu) for (const b of [...tz].filter(q => q.dv).sort((x, y) => Math.max(y.x1 - y.x0, y.z1 - y.z0) - Math.max(x.x1 - x.x0, x.z1 - x.z0))) {
      const xBoy = b.dv === 'arka' || b.dv === 'on', L = xBoy ? b.x1 - b.x0 : b.z1 - b.z0;
      for (const [en, kisalt] of [[820, 360], [700, 500], [600, 700], [600, 1100]]) {
        const boy = Math.min(2800, L - kisalt), o = (L - boy) / 2, on = 110;
        if (boy < 1100) continue;
        const q = b.dv === 'arka' ? { x0: b.x0 + o, x1: b.x0 + o + boy, z0: b.z1 + on, z1: b.z1 + on + en } : b.dv === 'on' ? { x0: b.x0 + o, x1: b.x0 + o + boy, z0: b.z0 - on - en, z1: b.z0 - on }
          : b.dv === 'sol' ? { x0: b.x1 + on, x1: b.x1 + on + en, z0: b.z0 + o, z1: b.z0 + o + boy } : { x0: b.x0 - on - en, x1: b.x0 - on, z0: b.z0 + o, z1: b.z0 + o + boy };
        if (bosMu(q, 0, 60, 30)) { hali(C, q.x0, q.z0, q.x1, q.z1, r); kondu = true; break; }
      }
      if (kondu) break;
    }
  }

  // --- Duvar: tablolar, saat, dekor tabakları ---
  if (A.duvar) {
    const adaylar = [];
    for (const dv of DUVAR_LISTE) {
      const xBoy = dv === 'arka' || dv === 'on', L = xBoy ? oda.w : oda.d;
      let bos = [[260, L - 260]];
      for (const k of kutular) { // duvarın önünde 1,10–2,10 m bandını kapatan her şey (dolap, pencere, kapı, komşu duvarın dolabı)
        const yakin = dv === 'arka' ? k.z0 < 90 : dv === 'on' ? k.z1 > oda.d - 90 : dv === 'sol' ? k.x0 < 90 : k.x1 > oda.w - 90;
        if (yakin && k.y0 < 2100 && k.y1 > 1100) bos = cikar(bos, (xBoy ? k.x0 : k.z0) - 140, (xBoy ? k.x1 : k.z1) + 140);
      }
      for (const [a0, a1] of bos) if (a1 - a0 >= 520) adaylar.push({ dv, a0, a1, boy: a1 - a0 });
    }
    adaylar.sort((x, y) => y.boy - x.boy);
    const cerceveDuvar = (dv, a0) => dv === 'arka' ? cerceve(a0, 0, [1, 0], [0, 1]) : dv === 'on' ? cerceve(a0, oda.d, [1, 0], [0, -1]) : dv === 'sol' ? cerceve(0, a0, [0, 1], [1, 0]) : cerceve(oda.w, a0, [0, 1], [-1, 0]);
    const yOrta = Math.min(1560, oda.h - 620);
    let saat = false, tabak = false;
    adaylar.slice(0, A.yogunluk + 1).forEach((q, i) => {
      const C = Cizer(liste, q.dv, true), F = cerceveDuvar(q.dv, q.a0), orta = q.boy / 2;
      if (i > 0 && !saat && q.boy < 900) { duvarSaati(C, F, orta, yOrta + 60, r); saat = true; return; }
      if (i > 0 && !tabak && q.boy >= 700 && q.boy < 1100 && r() < 0.5) { dekorTabaklari(C, F, orta, yOrta, r); tabak = true; return; }
      if (q.boy >= 1750) { const w = Math.min(520, (q.boy - 500) / 3.3); for (const k of [-1, 0, 1]) tablo(C, F, orta + k * (w + 90), yOrta, w, w * 1.36, r); }
      else if (q.boy >= 1150) { const w = Math.min(480, (q.boy - 380) / 2.2); for (const k of [-0.5, 0.5]) tablo(C, F, orta + k * (w + 80), yOrta, w, w * 1.3, r); }
      else { const w = Math.min(560, q.boy - 260); tablo(C, F, orta, yOrta, w, w * (r() < 0.5 ? 1.3 : 0.74), r); }
    });
    if (!saat && adaylar.length > A.yogunluk + 1) { const q = adaylar[A.yogunluk + 1]; duvarSaati(Cizer(liste, q.dv, true), cerceveDuvar(q.dv, q.a0), q.boy / 2, yOrta + 60, r); }
  }

  // --- Yerde büyük saksı ---
  if (A.bitki) {
    const C = Cizer(liste), E = 560, pay = 210, kapilar = kutular.filter(k => k.m.tip === 'kapi');
    const noktalar = r.kar([[pay, pay], [oda.w - E - pay, pay], [pay, oda.d - E - pay], [oda.w - E - pay, oda.d - E - pay]]);
    for (const k of kutular) if (TANIM[k.m.tip].sinif === 'boy' || cihazMi(k.m)) { // boy dolabın ve buzdolabının yanı
      if (k.z0 < 5) noktalar.push([k.x1 + 60, pay], [k.x0 - E - 60, pay]);
      if (k.x0 < 5) noktalar.push([pay, k.z1 + 60], [pay, k.z0 - E - 60]);
      if (k.x1 > oda.w - 5) noktalar.push([oda.w - E - pay, k.z1 + 60], [oda.w - E - pay, k.z0 - E - 60]);
    }
    let adet = A.yogunluk === 3 ? 2 : 1;
    const konan = [];
    for (const [x, z] of noktalar) {
      const q = { x0: x, z0: z, x1: x + E, z1: z + E };
      if (!bosMu(q, 0, 1700, 40) || konan.some(o => kesisir(q, o, 600))) continue;
      if (kapilar.some(k => kesisir(q, { x0: k.x0 - 950, x1: k.x1 + 950, z0: k.z0 - 950, z1: k.z1 + 950 }))) continue; // kapının açılma alanı
      yerSaksisi(C, cerceve(x + E / 2, z + E / 2, [1, 0], [0, 1]), 0, 0, r);
      konan.push(q);
      if (--adet <= 0) break;
    }
  }
  // duvardan dışarı taşan yaprak ve dallar atılır (dışarıdan bakışta duvarın dışında asılı kalmasın)
  return liste.filter(q => q.s !== 5 || (q.b[0] >= 0 && q.b[2] >= 0 && q.b[3] <= oda.w && q.b[5] <= oda.d && q.b[4] <= oda.h));
}
