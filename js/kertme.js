// Kolon ve kiriş kertmesi: dolap bir kolona ya da kirişe denk geldiğinde gövde parçaları engelin
// çevresinden kesilir. Parçalar kutu olduğundan kesim de kutu farkıdır: her parça en çok 6 parçaya bölünür.
import { parcalar, T, GZ } from './moduller.js';
import { donusum, yon, kutu, kesisir, kertilirMi, engelMi, egikDuzlem, EGIK_OLUR } from './yerlesim.js';

export const KERTME_PAYI = 3; // engel ile panel arasında bırakılan montaj boşluğu (mm)

// Odadaki bir kutuyu modülün yerel eksenine çevirir
function yerele(m, oda, k) {
  const { p } = donusum(m, oda);
  const c = (X, Z) => {
    switch (yon(m)) {
      case 1: return [p[2] - Z, X - p[0]];
      case 2: return [p[0] - X, p[2] - Z];
      case 3: return [Z - p[2], p[0] - X];
      default: return [X - p[0], Z - p[2]];
    }
  };
  const a = c(k.x0, k.z0), b = c(k.x1, k.z1);
  return {
    x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]),
    z0: Math.min(a[1], b[1]), z1: Math.max(a[1], b[1]),
    y0: k.y0 - m.y, y1: k.y1 - m.y,
  };
}

// Modülle kesişen kolon ve kirişler, modülün yerel ekseninde ve montaj payı eklenmiş olarak
export function engeller(m, proje) {
  if (!kertilirMi(m)) return [];
  const km = kutu(m, proje.oda);
  return proje.moduller
    .filter(o => engelMi(o) && kesisir(km, kutu(o, proje.oda)))
    .map(o => {
      const e = yerele(m, proje.oda, kutu(o, proje.oda));
      return { x0: e.x0 - KERTME_PAYI, x1: e.x1 + KERTME_PAYI, y0: e.y0 - KERTME_PAYI, y1: e.y1 + KERTME_PAYI,
        z0: e.z0 - KERTME_PAYI, z1: e.z1 + KERTME_PAYI };
    });
}

// Kertme ölçüleri: her engel için dolabın gövdesinden çıkarılan boşluğun yeri ve boyutu (mm, modülün yerel ekseninde).
// soldan/sagdan: dolabın ön yüzüne bakınca yan kenarlara uzaklık; arkadan: duvardan uzaklık; alt/ust: dolabın tabanından.
export function kertmeOlculeri(m, proje) {
  return engeller(m, proje).map(e => {
    const x0 = Math.max(0, e.x0), x1 = Math.min(m.w, e.x1), z0 = Math.max(0, e.z0), z1 = Math.min(m.d, e.z1);
    const y0 = Math.max(0, e.y0), y1 = Math.min(m.h, e.y1), r = Math.round;
    const boydan = y0 <= 0.5 && y1 >= m.h - 0.5;
    const o = { soldan: r(x0), sagdan: r(m.w - x1), genislik: r(x1 - x0), arkadan: r(z0), derinlik: r(z1 - z0), alt: r(y0), ust: r(y1), boydan };
    const yer = o.soldan === 0 ? 'sol kenarda' : o.sagdan === 0 ? 'sağ kenarda' : `soldan ${o.soldan} mm`;
    const derin = o.arkadan === 0 ? `arkadan ${o.derinlik} mm derin` : `arkadan ${o.arkadan} mm içeride ${o.derinlik} mm derin`;
    const yuk = boydan ? 'boydan boya' : o.alt === 0 ? `alttan ${o.ust} mm yüksekliğe kadar` : o.ust >= r(m.h) ? `${o.alt} mm'den üste kadar` : `${o.alt}–${o.ust} mm arası`;
    o.metin = `${yer}, ${o.genislik} mm geniş, ${derin}, ${yuk}`;
    return o;
  }).filter(o => o.genislik > 0 && o.derinlik > 0 && o.ust > o.alt);
}

// Kutu parçadan engeli çıkarır; kalan kutuları döndürür
export function cikar(p, e) {
  const x1 = p.x + p.sx, y1 = p.y + p.sy, z1 = p.z + p.sz;
  if (p.x >= e.x1 || x1 <= e.x0 || p.y >= e.y1 || y1 <= e.y0 || p.z >= e.z1 || z1 <= e.z0) return [p];
  const out = [];
  const ekle = (x, y, z, sx, sy, sz) => { if (sx > 1 && sy > 1 && sz > 1) out.push({ ...p, x, y, z, sx, sy, sz, kert: true }); };
  // x boyunca: engelin solu ve sağı
  ekle(p.x, p.y, p.z, e.x0 - p.x, p.sy, p.sz);
  ekle(e.x1, p.y, p.z, x1 - e.x1, p.sy, p.sz);
  const ax = Math.max(p.x, e.x0), bx = Math.min(x1, e.x1);
  // ortada kalan dilimde y boyunca: altı ve üstü
  ekle(ax, p.y, p.z, bx - ax, e.y0 - p.y, p.sz);
  ekle(ax, e.y1, p.z, bx - ax, y1 - e.y1, p.sz);
  const ay = Math.max(p.y, e.y0), by = Math.min(y1, e.y1);
  // kalan çekirdekte z boyunca: arkası ve önü
  ekle(ax, ay, p.z, bx - ax, by - ay, e.z0 - p.z);
  ekle(ax, ay, e.z1, bx - ax, by - ay, z1 - e.z1);
  return out;
}

// Modülün, kolon ve kirişlere göre kertilmiş parçaları. Engel yoksa parcalar(m) ile aynıdır.
// Eğik kesim: parçalar tavan düzleminin altında kalacak biçimde kesilir. Düzlemin altındaki parça aynen kalır,
// üstündeki atılır, düzlemin geçtiği parça üstü eğik bir parçaya dönüşür: { sekil: 'egik', e: { eksen, a0, a1, u0, u1 } }
// (a: alt, u: üst yükseklik; 0: eksenin başı, 1: sonu; parçanın kendi alt kotundan). En üste eğimli bir üst tabla eklenir.
export function egikKes(liste, m, d) {
  const boy = d.eksen === 'x' ? m.w : m.d, P = v => d.h0 + (d.h1 - d.h0) * v / boy, out = [];
  for (const p of liste) {
    if (p.sekil) { // silindir ve kavis: tepesi düzlemi aşıyorsa atılır
      if (p.y + p.h <= P(d.eksen === 'x' ? p.x : p.z)) out.push(p);
      continue;
    }
    const bas = d.eksen === 'x' ? p.x : p.z, uz = d.eksen === 'x' ? p.sx : p.sz, p0 = P(bas), p1 = P(bas + uz);
    if (p.y + p.sy <= Math.min(p0, p1) + 0.01) { out.push(p); continue; }
    if (p.y >= Math.max(p0, p1)) continue;
    const u0 = Math.max(0, Math.min(p.sy, p0 - p.y)), u1 = Math.max(0, Math.min(p.sy, p1 - p.y));
    if (Math.max(u0, u1) < 1) continue;
    const q = { ...p, sekil: 'egik', e: { eksen: d.eksen, a0: 0, a1: 0, u0, u1 } };
    delete q.ac; delete q.cek; // eğik kesilmiş kapak sabit çizilir
    out.push(q);
  }
  // eğimli üst tabla: gövdenin içinde, düzlemin hemen altında
  const z0 = GZ, x0 = T, sx = m.w - 2 * T, sz = m.d - GZ;
  if (sx > 0 && sz > 0) {
    const b = d.eksen === 'x' ? x0 : z0, u = d.eksen === 'x' ? sx : sz, t0 = P(b), t1 = P(b + u);
    if (Math.min(t0, t1) > T + 1) out.push({ ad: 'Eğik üst tabla', sekil: 'egik', x: x0, y: 0, z: z0, sx, sy: Math.max(t0, t1), sz, mat: 'govde', tur: 'govde',
      e: { eksen: d.eksen, a0: t0 - T, a1: t1 - T, u0: t0, u1: t1 } });
  }
  return out;
}

export function kertilmisParcalar(m, proje) {
  const duzlem = m.egikKes && EGIK_OLUR.has(m.tip) ? egikDuzlem(m, proje) : null;
  const son = l => duzlem ? egikKes(l, m, duzlem) : l;
  let liste = parcalar(m);
  const en = engeller(m, proje);
  if (!en.length) return son(liste);
  for (const e of en) {
    const yeni = [];
    for (const p of liste) {
      if (p.sekil) { // silindir ve kavis: merkezi engelin içindeyse atılır, değilse aynen kalır
        const icinde = p.x > e.x0 && p.x < e.x1 && p.z > e.z0 && p.z < e.z1 && p.y < e.y1 && p.y + p.h > e.y0;
        if (!icinde) yeni.push(p);
        continue;
      }
      const kalan = cikar(p, e);
      if (kalan.length > 1 && p.mentese) kalan.forEach((q, i) => { if (i) delete q.mentese; }); // açılış çizgisi tek parçada
      yeni.push(...kalan);
    }
    liste = yeni;
  }
  return son(liste);
}
