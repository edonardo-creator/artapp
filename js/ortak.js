// 3B kütüphaneye bağlı olmayan ortak hesaplar: parça rengi ve tezgah kutuları.
// Sahne (3B çizim), teknik çizim ve dışa aktarım aynı sonuçları buradan alır.
import { TANIM, TEZGAH_TASMA, TEZGAH_K, KAPAK_K, T, YENI_KURAL, parcalar } from './moduller.js';
import { yerelKutu, yon, kutu } from './yerlesim.js';

export const SABIT = { inox: '#b9bec4', siyah: '#1b1c20', koyu: '#3b3d42', cam: '#a9d3e8', kulp: '#8a8f96',
  dograma: '#fafafa', ahsap: '#b08a5e', gok: '#cfe6f5', isik: '#fff3c4', ayna: '#e8edf0', seramik: '#fbfbf9',
  mavi: '#2f7fd6', kirmizi: '#d64545', sari: '#e2b93b', tul: '#ffffff', kumas: '#e9e4da' };

// Yatay gövde parçasında (tabla, raf, kayıt) boy yönü: dolabın önüne bakan, bantlanan kenar. Düz dolapta genişlik yönüdür (x), parça eninden derin olsa da.
// L köşe dolabında ve dolabın eni boyunca uzanmayan dar çıtada uzun kenardır. Kesim listesi ve işleme hesabı aynı kuralı buradan alır.
export function yatayBoyEkseni(q, m) {
  const uzunX = q.sx >= q.sz;
  if (String(m?.tip || '').endsWith('_lkose')) return uzunX ? 'x' : 'z';
  if (!uzunX && Math.min(q.sx, q.sz) < 120 && q.sx < (m?.w || 0) - 2 * T - 6) return 'z';
  return 'x';
}

// Baza koşuları (yeni ölçü kurallarında): duvara dayalı düz alt ve boy dolapların bazası, bitişik dolaplarda tek parça yazılır (eB Creator'daki gibi).
// L köşe, kavisli ve ada dolaplarının bazası modülüyle birlikte kalır.
export const bazaKosuda = m => YENI_KURAL && ['arka', 'sol', 'sag', 'on'].includes(m.duvar) && (m.y || 0) === 0
  && ['alt', 'boy'].includes(TANIM[m.tip]?.sinif) && !/_lkose$|kavis/.test(m.tip);
// Dönen: [{ duvar, a0, a1, boy, h }] — a: duvar boyunca aralık, h: baza yüksekliği
export function bazaKosulari(p) {
  const parca = [], out = [];
  for (const m of p.moduller) {
    if (!bazaKosuda(m)) continue;
    for (const q of parcalar(m)) if (q.mat === 'baza' && !q.sekil && q.sx > 25) parca.push({ duvar: m.duvar, a0: m.x + q.x, a1: m.x + q.x + q.sx, on: Math.round(q.z + q.sz), h: Math.round(q.sy) });
  }
  parca.sort((a, b) => a.duvar.localeCompare(b.duvar) || a.h - b.h || a.on - b.on || a.a0 - b.a0);
  for (const s of parca) {
    const k = out[out.length - 1];
    if (k && k.duvar === s.duvar && k.h === s.h && k.on === s.on && s.a0 - k.a1 < 2) k.a1 = Math.max(k.a1, s.a1); else out.push({ ...s });
  }
  for (const k of out) k.boy = Math.round(k.a1 - k.a0);
  return out;
}

// Rengi koyulaştırır (ton 0–1): süslemelerin gölge tonları için
export const koyult = (hex, ton) => '#' + [1, 3, 5].map(i => Math.round(parseInt(String(hex).slice(i, i + 2), 16) * ton).toString(16).padStart(2, '0')).join('');

// Parçanın rengi: parçaya yazılı sabit renk (cam, alüminyum), yoksa modüle özel renk, yoksa proje rengi, yoksa sabit malzeme rengi.
// Parçada ton varsa (kapak süslemesi) renk o oranda koyulaşır.
export function parcaRengi(p, m, r) {
  const taban = p.renk || tabanRenk(p, m, r);
  return p.ton && /^#[0-9a-f]{6}$/i.test(taban) ? koyult(taban, p.ton) : taban;
}
function tabanRenk(p, m, r) {
  switch (p.mat) {
    case 'govde': return m.govdeRenk || r.govde;
    case 'kapak': return m.kapakRenk || (TANIM[m.tip].sinif === 'ust' || ((m.tip === 'panel_yan' || m.tip === 'dolgu') && m.y > 0) ? r.ustKapak : r.kapak);
    case 'baza': return r.baza;
    case 'duvar': return r.duvar;
    case 'tezgah': return r.tezgah;
    case 'kulp': return r.kulp || SABIT.kulp; // kulp rengi projeden seçilebilir (inox, krom, siyah, pirinç)
    case 'dograma': return m.dogramaRenk || SABIT.dograma; // kapı kasası ve pencere doğraması modüle özel boyanabilir
    case 'ahsap': return (m.tip === 'kapi' && m.kanatRenk) || SABIT.ahsap;
    default: return SABIT[p.mat] || '#888888';
  }
}

// Bitişik alt modüllerin üstüne tek parça tezgah kutuları (oda koordinatında)
export function tezgahlar(p) {
  const { oda } = p, out = [];
  const altlar = p.moduller.filter(m => TANIM[m.tip].tezgah && m.y === 0 && m.h < 1200); // boy panelin üstüne tezgah gelmez
  const grupla = (liste, bas, son, anahtar) => {
    const kosular = [];
    for (const m of [...liste].sort((a, b) => bas(a) - bas(b))) {
      const k = kosular[kosular.length - 1];
      if (k && anahtar(m) === k.anahtar && bas(m) - k.son < 2) { k.son = son(m); k.uyeler.push(m); }
      else kosular.push({ anahtar: anahtar(m), bas: bas(m), son: son(m), uyeler: [m] });
    }
    return kosular;
  };
  const dMax = k => Math.max(...k.uyeler.map(m => m.d)) + TEZGAH_TASMA;
  const arka = grupla(altlar.filter(m => m.duvar === 'arka'), m => m.x, m => m.x + m.w, m => m.h);
  for (const k of arka) out.push({ x0: k.bas, x1: k.son, z0: 0, z1: dMax(k), y: k.anahtar });
  for (const k of grupla(altlar.filter(m => m.duvar === 'on'), m => m.x, m => m.x + m.w, m => m.h)) {
    out.push({ x0: k.bas, x1: k.son, z0: oda.d - dMax(k), z1: oda.d, y: k.anahtar });
  }
  for (const yan of ['sol', 'sag']) {
    for (const k of grupla(altlar.filter(m => m.duvar === yan), m => m.x, m => m.x + m.w, m => m.h)) {
      const d = dMax(k);
      // Köşede arka tezgahla üst üste binmesin
      let bas = k.bas;
      for (const a of arka) {
        const kosede = yan === 'sol' ? a.bas < d : a.son > oda.w - d;
        const ad = dMax(a);
        if (kosede && a.anahtar === k.anahtar && bas < ad) bas = Math.min(ad, k.son);
      }
      if (k.son - bas < 1) continue;
      out.push(yan === 'sol'
        ? { x0: 0, x1: d, z0: bas, z1: k.son, y: k.anahtar }
        : { x0: oda.w - d, x1: oda.w, z0: bas, z1: k.son, y: k.anahtar });
    }
  }
  // L köşe dolabı: iki kollu tezgah
  for (const m of p.moduller.filter(o => o.tip === 'alt_lkose')) {
    const kd = Math.min(m.kol || 560, m.w - 150, m.d - 150) + TEZGAH_TASMA;
    const sag = m.korYon === 'sag';
    out.push({ ...yerelKutu(m, oda, 0, m.w, 0, kd), y: m.h });
    out.push({ ...yerelKutu(m, oda, sag ? m.w - kd : 0, sag ? m.w : kd, kd, m.d), y: m.h });
  }
  // Ada: her koşunun gövde kutusuna önde kapak + 20 mm, yanlarda 20 mm, arkada tabure taşması eklenir
  const tasma = p.ayar?.adaTasma ?? 250, kenar = 20, on = KAPAK_K + kenar;
  for (const k of adaKosulari(p)) {
    const b = { x0: k.x0, x1: k.x1, z0: k.z0, z1: k.z1 }, y = k.yon;
    if (y % 2 === 0) { b.x0 -= kenar; b.x1 += kenar; } else { b.z0 -= kenar; b.z1 += kenar; }
    if (y === 0) { b.z1 += on; b.z0 -= tasma; }
    if (y === 2) { b.z0 -= on; b.z1 += tasma; }
    if (y === 1) { b.x1 += on; b.x0 -= tasma; }
    if (y === 3) { b.x0 -= on; b.x1 += tasma; }
    out.push({ ...b, y: k.h });
  }
  return out;
}

// Ada ekleri: yan ve arka bitiş paneli (kapak renginde) ile arka kenardaki bar yükseltisi (dikme paneli + tezgah malzemesinde tabla).
// Dönen kutular oda koordinatındadır: { x0, x1, z0, z1, y0, y1, tur: 'panel' | 'bar' }
export const BAR_KOTU = 1100;
export function adaEkleri(p) {
  const out = [], K = KAPAK_K;
  if (!(p.ayar?.adaPanel || p.ayar?.adaBar)) return out;
  for (const k of adaKosulari(p)) {
    const yat = k.yon % 2 === 0, [A0, A1, D0, D1] = yat ? [k.x0, k.x1, k.z0, k.z1] : [k.z0, k.z1, k.x0, k.x1];
    const s = k.yon === 0 || k.yon === 1 ? -1 : 1, arka = s < 0 ? D0 : D1; // arka yüzün derinlik eksenindeki yeri ve yönü
    // a: koşu boyunca, d: derinlik ekseninde [lo, hi]
    const ek = (a0, a1, d0, d1, y0, y1, tur) => out.push(yat ? { x0: a0, x1: a1, z0: d0, z1: d1, y0, y1, tur } : { x0: d0, x1: d1, z0: a0, z1: a1, y0, y1, tur });
    if (p.ayar.adaPanel) {
      const [on0, on1] = s < 0 ? [D0, D1 + K] : [D0 - K, D1]; // yan panel kapak hizasına kadar
      ek(A0 - K, A0, on0, on1, 0, k.h, 'panel'); ek(A1, A1 + K, on0, on1, 0, k.h, 'panel');
      ek(A0 - K, A1 + K, s < 0 ? arka - K : arka, s < 0 ? arka : arka + K, 0, k.h, 'panel');
    }
    if (p.ayar.adaBar) {
      const kal = TEZGAH_K;
      ek(A0, A1, s < 0 ? arka - kal : arka, s < 0 ? arka : arka + kal, k.h + TEZGAH_K, BAR_KOTU - kal, 'panel'); // dikme paneli
      ek(A0 - 20, A1 + 20, s < 0 ? arka - 320 : arka - 20, s < 0 ? arka + 20 : arka + 320, BAR_KOTU - kal, BAR_KOTU, 'bar'); // bar tablası
    }
  }
  return out;
}

// Dikdörtgenlerden delikleri çıkarır: { a0, a1, y0, y1 } listesi alır, deliklerin dışında kalan dikdörtgenleri döndürür
export function delikliDikler(dikler, delikler) {
  for (const d of delikler) {
    const yeni = [];
    for (const r of dikler) {
      if (d.a0 >= r.a1 || d.a1 <= r.a0 || d.y0 >= r.y1 || d.y1 <= r.y0) { yeni.push(r); continue; }
      if (d.y0 > r.y0) yeni.push({ ...r, y1: d.y0 });
      if (d.y1 < r.y1) yeni.push({ ...r, y0: d.y1 });
      const ya = Math.max(r.y0, d.y0), yb = Math.min(r.y1, d.y1);
      if (d.a0 > r.a0) yeni.push({ a0: r.a0, a1: d.a0, y0: ya, y1: yb });
      if (d.a1 < r.a1) yeni.push({ a0: d.a1, a1: r.a1, y0: ya, y1: yb });
    }
    dikler = yeni;
  }
  return dikler.filter(r => r.a1 - r.a0 >= 1 && r.y1 - r.y0 >= 1);
}

// Eğimli tavanın plandaki kırılma çizgisi: tavanın tam yüksekliğe ulaştığı yer. Yoksa null.
// Dönen: { x0, z0, x1, z1, dusuk, mesafe, duvar }
export function egimCizgisi(p) {
  const e = p.ayar?.egim, { w: W, d: D } = p.oda;
  if (!e?.duvar) return null;
  const yatay = e.duvar === 'arka' || e.duvar === 'on', mes = Math.min(e.mesafe, yatay ? D : W);
  const c = e.duvar === 'arka' || e.duvar === 'sol' ? mes : (yatay ? D : W) - mes;
  return { ...(yatay ? { x0: 0, z0: c, x1: W, z1: c } : { x0: c, z0: 0, x1: c, z1: D }), dusuk: e.dusuk, mesafe: mes, duvar: e.duvar };
}

// Bir duvar görünüşünde eğimli tavanın izi. Kağıt x'i duvara içeriden bakışa göredir (0..L).
// Eğim bu duvardaysa yatay çizgi (tavan o duvarda alçak), komşu duvardaysa eğik çizgi, karşı duvardaysa null.
export function egimGorunus(p, duvar) {
  const e = egimCizgisi(p), H = p.oda.h;
  if (!e) return null;
  const yatay = d => d === 'arka' || d === 'on';
  const L = yatay(duvar) ? p.oda.w : p.oda.d;
  if (e.duvar === duvar) return { x0: 0, y0: e.dusuk, x1: L, y1: e.dusuk, ayni: true };
  if (yatay(e.duvar) === yatay(duvar)) return null; // karşı duvar: tavan tam yükseklikte
  // eğimli duvarın bu duvar eksenindeki yeri (0 ya da L), sonra içeriden bakış yönüne çevrilir
  const bas = e.duvar === 'arka' || e.duvar === 'sol' ? 0 : L;
  const ters = duvar === 'sol' || duvar === 'on';
  const px = ters ? L - bas : bas, yon = px === 0 ? 1 : -1;
  return { x0: px, y0: e.dusuk, x1: px + yon * Math.min(e.mesafe, L), y1: H, ayni: false };
}

// Ada koşuları: aynı yöne bakan, aynı hizadaki bitişik tezgahlı ada dolapları.
// Dönen kutu gövdenin plandaki yeridir (kapak ve taşma hariç). yon: 0 önü +z, 1 önü +x, 2 önü -z, 3 önü -x
export function adaKosulari(p) {
  const ada = p.moduller.filter(m => m.duvar === 'ada' && TANIM[m.tip].tezgah && m.y === 0 && m.h < 1200), out = [];
  for (let y = 0; y < 4; y++) {
    const yatay = y % 2 === 0, bas = m => yatay ? m.x : m.z, anahtar = m => [m.h, yatay ? m.z : m.x, m.d].join('|');
    let kosu = null;
    for (const m of ada.filter(o => yon(o) === y).sort((a, b) => anahtar(a).localeCompare(anahtar(b)) || bas(a) - bas(b))) {
      if (kosu && kosu.anahtar === anahtar(m) && bas(m) - kosu.son < 2) { kosu.son = bas(m) + m.w; kosu.uyeler.push(m); }
      else out.push(kosu = { anahtar: anahtar(m), bas: bas(m), son: bas(m) + m.w, uyeler: [m] });
    }
  }
  return out.map(k => {
    const m0 = k.uyeler[0], y = yon(m0);
    const kutu = y % 2 === 0 ? { x0: k.bas, x1: k.son, z0: m0.z, z1: m0.z + m0.d } : { x0: m0.x, x1: m0.x + m0.d, z0: k.bas, z1: k.son };
    return { ...kutu, yon: y, h: m0.h, uyeler: k.uyeler };
  });
}

// ---- Bitiş ayrıntıları: oda süpürgeliği, tezgah süpürgeliği, damlalıklı tezgah kenarı ----
// Hepsi oda koordinatında kutu döndürür: { x0, x1, z0, z1, y0, y1, duvar? }. 3B çizim ve kesim listesi aynı sonucu kullanır.
export const SUPURGELIK_K = 12, TEZGAH_SUP_K = 15, DAMLALIK = { en: 18, yuk: 6 };
// [a, b] aralıklarından [c, d] aralığını çıkarır
const aralikCikar = (liste, c, d) => liste.flatMap(([a, b]) => d <= a || c >= b ? [[a, b]] : [[a, Math.min(b, c)], [Math.max(a, d), b]].filter(([x, y]) => y - x > 0));
const DUVAR_YUZU = { // duvar: [duvar boyu, kutunun duvara değip değmediği, kutunun duvar boyunca aralığı, [a, b] aralığından kutu]
  arka: [o => o.w, (k, o) => k.z0 < 20, k => [k.x0, k.x1], (a, b, K, o) => ({ x0: a, x1: b, z0: 0, z1: K })],
  on: [o => o.w, (k, o) => k.z1 > o.d - 20, k => [k.x0, k.x1], (a, b, K, o) => ({ x0: a, x1: b, z0: o.d - K, z1: o.d })],
  sol: [o => o.d, (k, o) => k.x0 < 20, k => [k.z0, k.z1], (a, b, K, o) => ({ x0: 0, x1: K, z0: a, z1: b })],
  sag: [o => o.d, (k, o) => k.x1 > o.w - 20, k => [k.z0, k.z1], (a, b, K, o) => ({ x0: o.w - K, x1: o.w, z0: a, z1: b })],
};

// Oda süpürgeliği: duvar diplerinde döner; kapıda, kolonda ve yere basan dolapların arkasında kesilir.
export function supurgelikler(p) {
  const H = Number(p.ayar?.supurgelik) || 0, { oda } = p, out = [];
  if (!H) return out;
  const engel = p.moduller.filter(m => {
    const s = TANIM[m.tip].sinif;
    return ((s === 'alt' || s === 'boy') && (m.y || 0) < H) || m.tip === 'kapi' || m.tip === 'kolon' || m.tip === 'girinti' || (m.tip === 'nis' && (m.y || 0) < H);
  }).map(m => kutu(m, oda));
  for (const [ad, [boy, deger, aralik, yap]] of Object.entries(DUVAR_YUZU)) {
    let acik = [[0, boy(oda)]];
    for (const k of engel) if (deger(k, oda)) acik = aralikCikar(acik, ...aralik(k));
    for (const [a, b] of acik) if (b - a >= 100) out.push({ ...yap(a, b, SUPURGELIK_K, oda), y0: 0, y1: H, duvar: ad });
  }
  return out;
}

// Tezgah süpürgeliği: duvara dayalı tezgahın arkasında, tezgah malzemesinden alçak şerit. Pencere ve nişin önünde kesilir.
export function tezgahSupurgelikleri(p) {
  const H = Number(p.ayar?.tezgahSup) || 0, { oda } = p, out = [];
  if (!H) return out;
  for (const b of tezgahlar(p)) {
    const y0 = b.y + TEZGAH_K, y1 = y0 + H;
    for (const [ad, [, deger, aralik, yap]] of Object.entries(DUVAR_YUZU)) {
      if (!deger({ ...b, z0: b.z0 + 19, z1: b.z1 - 19, x0: b.x0 + 19, x1: b.x1 - 19 }, oda)) continue; // tezgah bu duvara tam dayalı mı
      let acik = [aralik(b)];
      for (const m of p.moduller) {
        if (m.duvar !== ad || (m.tip !== 'pencere' && m.tip !== 'nis') || m.y >= y1 || m.y + m.h <= y0) continue;
        acik = aralikCikar(acik, ...aralik(kutu(m, oda)));
      }
      for (const [a, c] of acik) if (c - a >= 30) out.push({ ...yap(a, c, TEZGAH_SUP_K, oda), y0, y1, duvar: ad });
    }
  }
  return out;
}

// Damlalıklı kenar: tezgahın serbest kenarlarında alçak bir kabartı. Duvara, başka bir tezgaha ya da boy dolaba dayanan kenarda olmaz.
export function tezgahDamlaliklari(p) {
  if (p.ayar?.tezgahKenar !== 'damlalik') return [];
  const { oda } = p, G = DAMLALIK.en, T = tezgahlar(p), out = [];
  const yuksek = p.moduller.filter(m => TANIM[m.tip].sinif === 'boy' || m.tip === 'kolon').map(m => kutu(m, oda));
  T.forEach((b, i) => {
    const y0 = b.y + TEZGAH_K, y1 = y0 + DAMLALIK.yuk;
    const komsu = [...T.filter((t, j) => j !== i && Math.abs(t.y - b.y) < 5).map(t => ({ x0: t.x0 - 2, x1: t.x1 + 2, z0: t.z0 - 2, z1: t.z1 + 2 })),
      ...yuksek.filter(k => k.y1 > y0 && k.y0 < y1).map(k => ({ x0: k.x0 - G - 7, x1: k.x1 + G + 7, z0: k.z0 - G - 7, z1: k.z1 + G + 7 }))];
    const serit = (xBoyunca, s0, s1, a0, a1) => { // s: şeridin sabit eksendeki aralığı, a: uzandığı aralık
      let acik = [[a0, a1]];
      for (const k of komsu) {
        const [ks0, ks1, ka0, ka1] = xBoyunca ? [k.z0, k.z1, k.x0, k.x1] : [k.x0, k.x1, k.z0, k.z1];
        if (ks0 < s1 && ks1 > s0) acik = aralikCikar(acik, ka0, ka1);
      }
      for (const [a, c] of acik) if (c - a >= 30) out.push(xBoyunca ? { x0: a, x1: c, z0: s0, z1: s1, y0, y1 } : { x0: s0, x1: s1, z0: a, z1: c, y0, y1 });
    };
    if (b.z1 < oda.d - 1) serit(true, b.z1 - G, b.z1, b.x0, b.x1);
    if (b.z0 > 1) serit(true, b.z0, b.z0 + G, b.x0, b.x1);
    if (b.x1 < oda.w - 1) serit(false, b.x1 - G, b.x1, b.z0, b.z1);
    if (b.x0 > 1) serit(false, b.x0, b.x0 + G, b.z0, b.z1);
  });
  return out;
}
