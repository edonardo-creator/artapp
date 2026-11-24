// Kulp modelleri: katalogdaki her kulp ailesinin gerçek biçimi ve kaplama rengi; biçimden üçgen ağ üretimi.
// Biçimler ARTAPP'in kendi modellemesidir: katalog resmine bakılarak ve bilinen ölçülerle (boy, delik aralığı) kurulmuştur;
// üreticinin teknik çizimi değildir. Bu dosya başka dosyaya bağlı değildir (three.js gerekmez); 3B çizim ağı buradan alır.
// Koordinat: u kulp boyunca (ortası 0), v enine, w kapak yüzünden dışarı (0: kapağın ön yüzü). Ölçü mm.

const TAU = Math.PI * 2;

// Kaplama renkleri
export const KULP_KAPLAMA = {
  krom: '#D2D5D8', inox: '#AEB2B5', nikel: '#B8B4AA', alu: '#C4C6C8', siyah: '#1A1A1C', antik: '#8E6E3E', altin: '#C8A24A', bakir: '#A46A45',
  bronz: '#6A5440', gumus: '#8C8D8C', kursun: '#55585C', beyaz: '#ECEBE6', krem: '#E9DFC6', ahsap: '#B9834A', deri: '#A0623A',
};
const renkCoz = r => !r ? '' : r[0] === '#' ? r : KULP_KAPLAMA[r] || '';

// ---- Küçük vektör yardımcıları -----------------------------------------------------
const cik = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const topla = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const carp = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const nokta = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const capraz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const uz = a => Math.hypot(a[0], a[1], a[2]);
const birim = a => { const l = uz(a); return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0]; };

// ---- Kesitler: [a, b] köşeleri (a enine, b kalınlık yönünde), saat yönünün tersine -----
const elipsK = (ra, rb, n = 14) => Array.from({ length: n }, (_, i) => [ra * Math.cos(TAU * i / n), rb * Math.sin(TAU * i / n)]);
function dikK(ha, hb, r = 0, n = 3) { // köşeleri yuvarlatılmış dikdörtgen; ha, hb yarı ölçüler
  r = Math.max(0, Math.min(r, ha - 0.01, hb - 0.01));
  if (r < 0.05) return [[ha, -hb], [ha, hb], [-ha, hb], [-ha, -hb]];
  const P = [];
  for (const [cx, cy, a0] of [[ha - r, -hb + r, -Math.PI / 2], [ha - r, hb - r, 0], [-ha + r, hb - r, Math.PI / 2], [-ha + r, -hb + r, Math.PI]])
    for (let i = 0; i <= n; i++) { const a = a0 + Math.PI / 2 * i / n; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return P;
}
// k: 'yuv' daire (çap kal), 'oval' elips, 'yassi' kenarları tam yuvarlak şerit, 'dik' köşeli (hafif pahlı)
const kesit = (k, en, kal) => k === 'yuv' ? elipsK(kal / 2, kal / 2) : k === 'oval' ? elipsK(en / 2, kal / 2)
  : k === 'yassi' ? dikK(en / 2, kal / 2, Math.min(en, kal) * 0.45) : dikK(en / 2, kal / 2, Math.min(1.2, Math.min(en, kal) * 0.2), 2);

// Kırık çizginin iç köşelerini r yarıçapıyla yuvarlatır (noktalar [u, v, w])
function yuvarlat(yol, r, adim = 6) {
  const out = [yol[0]];
  for (let i = 1; i < yol.length - 1; i++) {
    const P = yol[i], a = birim(cik(yol[i - 1], P)), b = birim(cik(yol[i + 1], P)), c = Math.max(-1, Math.min(1, nokta(a, b))), fi = Math.acos(c);
    if (fi > Math.PI - 0.02 || r <= 0) { out.push(P); continue; }
    const t = Math.min(r / Math.tan(fi / 2), uz(cik(yol[i - 1], P)) * 0.49, uz(cik(yol[i + 1], P)) * 0.49), rr = t * Math.tan(fi / 2);
    const C = topla(P, carp(birim(topla(a, b)), rr / Math.sin(fi / 2))), S = cik(topla(P, carp(a, t)), C), E = cik(topla(P, carp(b, t)), C);
    const om = Math.acos(Math.max(-1, Math.min(1, nokta(S, E) / (rr * rr))));
    for (let k = 0; k <= adim; k++) {
      const q = k / adim, s0 = om < 1e-6 ? 1 - q : Math.sin((1 - q) * om) / Math.sin(om), s1 = om < 1e-6 ? q : Math.sin(q * om) / Math.sin(om);
      out.push(topla(C, topla(carp(S, s0), carp(E, s1))));
    }
  }
  out.push(yol[yol.length - 1]);
  return out;
}

// ---- Ağ kurucu: malzeme yuvası başına üçgen listesi ---------------------------------
// Yuvalar: 0 ana (kaplama rengi), 1 ikinci malzeme (porselen, ahşap, deri…), 2 koyu (oyuk, gölge)
class Ag {
  constructor() { this.v = [[], [], []]; }
  ucgen(m, a, b, c) { this.v[m].push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
  // Eşit köşe sayılı halkalardan kabuk; halkalar ilerleme yönüne bakıldığında saat yönünün tersinedir
  kabuk(m, H, { kapali = false, bas = true, son = true } = {}) {
    const n = H.length, k = H[0].length;
    for (let i = 0; i < (kapali ? n : n - 1); i++) {
      const A = H[i], B = H[(i + 1) % n];
      for (let j = 0; j < k; j++) { const j1 = (j + 1) % k; this.ucgen(m, A[j], A[j1], B[j1]); this.ucgen(m, A[j], B[j1], B[j]); }
    }
    if (kapali) return;
    const orta = R => carp(R.reduce((s, p) => topla(s, p), [0, 0, 0]), 1 / R.length);
    if (bas) { const c = orta(H[0]); for (let j = 0; j < k; j++) this.ucgen(m, c, H[0][(j + 1) % k], H[0][j]); }
    if (son) { const c = orta(H[n - 1]); for (let j = 0; j < k; j++) this.ucgen(m, c, H[n - 1][j], H[n - 1][(j + 1) % k]); }
  }
  // Kesiti yol boyunca süpürür. B: kesitin "enine" ekseni (yolun düzlemine dik). olcek(t) → [en çarpanı, kalınlık çarpanı]
  tup(m, yol, kes, { B = [0, 1, 0], olcek = null, kapali = false, bas = true, son = true } = {}) {
    const n = yol.length, s = [0], H = [];
    for (let i = 1; i < n; i++) s.push(s[i - 1] + uz(cik(yol[i], yol[i - 1])));
    const top = s[n - 1] || 1;
    for (let i = 0; i < n; i++) {
      const p = yol[i], on = yol[kapali ? (i - 1 + n) % n : Math.max(0, i - 1)], ar = yol[kapali ? (i + 1) % n : Math.min(n - 1, i + 1)];
      let ti = birim(cik(p, on)), to = birim(cik(ar, p));
      if (!kapali && i === 0) ti = to;
      if (!kapali && i === n - 1) to = ti;
      const T = birim(topla(ti, to)), c = Math.max(0.5, nokta(T, to)); // köşede kesit açıortay düzlemine oturur; kalınlık 1 / cos kadar uzar
      const N = birim(capraz(T, B)), Bd = capraz(N, T), [sa, sb] = olcek ? olcek(s[i] / top) : [1, 1];
      H.push(kes.map(([a, b]) => [p[0] + Bd[0] * a * sa + N[0] * b * sb / c, p[1] + Bd[1] * a * sa + N[1] * b * sb / c, p[2] + Bd[2] * a * sa + N[2] * b * sb / c]));
    }
    this.kabuk(m, H, { kapali, bas, son });
  }
  // w ekseni çevresinde döner cisim. profil: [yarıçap, w] noktaları (alttan üste); su, sv: elips çarpanları
  donel(m, cu, cv, profil, { su = 1, sv = 1, n = 20, kose = 0 } = {}) {
    const H = profil.map(([r, w]) => Array.from({ length: n }, (_, j) => {
      const a = TAU * j / n + kose; let x = Math.cos(a), y = Math.sin(a);
      return [cu + Math.max(r, 0.01) * x * su, cv + Math.max(r, 0.01) * y * sv, w];
    }));
    this.kabuk(m, H);
  }
  // u ekseni çevresinde döner cisim (fıçı, iğ): profil [u, yarıçap]
  igne(m, cv, cw, profil, { sv = 1, sw = 1, n = 16 } = {}) {
    const H = profil.map(([u, r]) => Array.from({ length: n }, (_, j) => { const a = TAU * j / n; return [u, cv + Math.max(r, 0.01) * Math.cos(a) * sv, cw + Math.max(r, 0.01) * Math.sin(a) * sw]; }));
    this.kabuk(m, H);
  }
  silindir(m, cu, cv, r, w0, w1, n = 16) { this.donel(m, cu, cv, [[r, w0], [r, w1]], { n }); }
  elips(m, c, r, n = 10) { // c merkez, r yarıçaplar [u, v, w]
    const P = []; for (let i = 0; i <= n; i++) { const f = -Math.PI / 2 + Math.PI * i / n; P.push([Math.cos(f), c[2] + r[2] * Math.sin(f)]); }
    this.kabuk(m, P.map(([q, w]) => Array.from({ length: 18 }, (_, j) => { const a = TAU * j / 18; return [c[0] + Math.max(q, 0.004) * r[0] * Math.cos(a), c[1] + Math.max(q, 0.004) * r[1] * Math.sin(a), w]; })), { bas: false, son: false });
  }
  // Çokgen levha: [u, v] köşeleri (saat yönünün tersine), w0–w1 arasında; pah: üst kenarın içeri çekilmesi
  levha(m, cokgen, w0, w1, pah = 0) {
    const cu = cokgen.reduce((s, p) => s + p[0], 0) / cokgen.length, cv = cokgen.reduce((s, p) => s + p[1], 0) / cokgen.length;
    const ic = q => cokgen.map(([u, v]) => { const du = u - cu, dv = v - cv, l = Math.hypot(du, dv) || 1; return [u - du / l * q, v - dv / l * q]; });
    const H = [cokgen.map(([u, v]) => [u, v, w0])];
    if (pah > 0) { H.push(cokgen.map(([u, v]) => [u, v, w1 - pah])); H.push(ic(pah).map(([u, v]) => [u, v, w1])); } else H.push(cokgen.map(([u, v]) => [u, v, w1]));
    this.kabuk(m, H);
  }
  kutu(m, u0, u1, v0, v1, w0, w1, r = 0, pah = 0) {
    const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
    this.levha(m, dikK((u1 - u0) / 2, (v1 - v0) / 2, r, 3).map(([a, b]) => [cu + a, cv + b]), w0, w1, pah);
  }
  // Halka (simit): merkez c, yarıçap R, tel yarıçapı r; duzlem 'uv' (kapağa paralel) ya da 'vw' (kapağa dik)
  halka(m, c, R, r, { duzlem = 'uv', sv = 1, n = 28 } = {}) {
    const yol = Array.from({ length: n }, (_, i) => { const a = TAU * i / n; return duzlem === 'uv' ? [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a) * sv, c[2]] : [c[0], c[1] + R * Math.cos(a) * sv, c[2] + R * Math.sin(a)]; });
    this.tup(m, yol, elipsK(r, r, 10), { B: duzlem === 'uv' ? [0, 0, 1] : [1, 0, 0], kapali: true });
  }
}

// Köşe normalleri: aynı noktada buluşan ve aralarındaki açı eşiğin altında kalan yüzler yumuşatılır, keskin kenarlar keskin kalır
function normaller(pos, esik = 0.72) {
  const n = pos.length / 9, fn = new Float32Array(n * 3), alan = new Float32Array(n), harita = new Map(), out = new Float32Array(pos.length);
  for (let t = 0; t < n; t++) {
    const i = t * 9, c = capraz([pos[i + 3] - pos[i], pos[i + 4] - pos[i + 1], pos[i + 5] - pos[i + 2]], [pos[i + 6] - pos[i], pos[i + 7] - pos[i + 1], pos[i + 8] - pos[i + 2]]), l = uz(c);
    alan[t] = l;
    if (l > 1e-12) { fn[t * 3] = c[0] / l; fn[t * 3 + 1] = c[1] / l; fn[t * 3 + 2] = c[2] / l; }
    for (let k = 0; k < 3; k++) {
      const a = Math.round(pos[i + k * 3] * 50) + '|' + Math.round(pos[i + k * 3 + 1] * 50) + '|' + Math.round(pos[i + k * 3 + 2] * 50);
      (harita.get(a) || harita.set(a, []).get(a)).push(t);
    }
  }
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
    const i = t * 9 + k * 3, a = Math.round(pos[i] * 50) + '|' + Math.round(pos[i + 1] * 50) + '|' + Math.round(pos[i + 2] * 50);
    let x = 0, y = 0, z = 0;
    for (const q of harita.get(a)) {
      if (alan[q] < 1e-12 || fn[t * 3] * fn[q * 3] + fn[t * 3 + 1] * fn[q * 3 + 1] + fn[t * 3 + 2] * fn[q * 3 + 2] < esik) continue;
      x += fn[q * 3] * alan[q]; y += fn[q * 3 + 1] * alan[q]; z += fn[q * 3 + 2] * alan[q];
    }
    const l = Math.hypot(x, y, z);
    if (l > 1e-12) { out[i] = x / l; out[i + 1] = y / l; out[i + 2] = z / l; } else { out[i] = fn[t * 3]; out[i + 1] = fn[t * 3 + 1]; out[i + 2] = fn[t * 3 + 2] || 1; }
  }
  return out;
}

// ---- Biçim üreticileri -------------------------------------------------------------
// Hepsi: (g: Ag, L: kulpun boyu, o: ölçüler, delik: vida aralığı)

// Kavisli kulp: yay biçiminde gövde. uc: 'sivri' (uçlar incelerek kapağa iner), 'ayak' (yuvarlak ayaklar), 'duz' (köşeli ayaklar),
// 'yuvarlak' (kalın yuvarlak uçlar). direk: yay iki direğin üstünde durur. kay: kapak düzleminde S kıvrımı. cift: iki paralel tel.
// iki: ortadaki bölümün (oran) ikinci malzemeden olması. orta: ortadaki en çarpanı.
function yay(g, L, o) {
  const { H = 26, k = 'oval', en = 12, kal = 6, uc = 'sivri', orta = 1, direk = false, tasma = 20, kay = 0, cift = 0, iki = 0 } = o;
  const kes = kesit(k, en, kal), gen = k === 'yuv' ? kal : en, ar = o.ar || Math.max(gen, kal) * 0.62 + 1.5;
  const w0 = direk ? Math.max(12, H * 0.55) : uc === 'ayak' ? 6 : uc === 'sivri' ? kal * 0.3 : kal * 0.5 + 3, wt = Math.max(w0 + 4, H - kal / 2);
  const yarim = L / 2 - (direk ? 0.5 : uc === 'ayak' ? ar : uc === 'sivri' ? 1 : kal * 0.5), h = wt - w0, R = (yarim * yarim + h * h) / (2 * h), N = 30;
  const wAt = u => wt - R + Math.sqrt(Math.max(0, R * R - u * u));
  const yolAt = dv => Array.from({ length: N + 1 }, (_, i) => { const t = i / N, u = -yarim + 2 * yarim * t; return [u, dv + (kay ? kay * Math.sin(TAU * t) : 0), wAt(u)]; });
  const olcek = t => {
    const s = Math.sin(Math.PI * t), ek = 1 + (orta - 1) * s * s;
    if (uc === 'sivri') { const q = 0.45 + 0.55 * Math.pow(s, 0.55); return [q * ek, 0.62 + 0.38 * Math.pow(s, 0.5)]; }
    if (uc === 'yuvarlak' || direk) { const q = Math.min(1, Math.sqrt(Math.max(0.02, Math.min(t, 1 - t) * 14))); return [q * ek, q]; }
    return [ek, 1];
  };
  for (const dv of cift ? [-cift, cift] : [0]) {
    const yol = yolAt(dv);
    if (iki > 0) { // ortası ikinci malzeme
      const i0 = Math.round(N * (1 - iki) / 2), i1 = N - i0, ol = (a, b) => t => olcek((a + t * (b - a)) / N);
      g.tup(0, yol.slice(0, i0 + 1), kes, { olcek: ol(0, i0) }); g.tup(1, yol.slice(i0, i1 + 1), kes, { olcek: t => { const q = ol(i0, i1)(t); return [q[0] * 1.06, q[1] * 1.06]; } }); g.tup(0, yol.slice(i1), kes, { olcek: ol(i1, N) });
    } else g.tup(0, yol, kes, { olcek });
  }
  if (direk) { const ud = Math.max(8, L / 2 - tasma), rd = Math.max(3.5, kal * 0.42); for (const s of [-1, 1]) g.donel(0, s * ud, 0, [[rd * 1.5, 0], [rd * 1.5, 1.5], [rd, 4], [rd, wAt(ud)]]); return; }
  if (uc === 'ayak') for (const s of [-1, 1]) g.donel(0, s * yarim, 0, [[ar, 0], [ar, 1.6], [ar * 0.82, 3.6], [Math.max(gen, kal) * 0.42, w0 + 1.5], [Math.max(gen, kal) * 0.3, w0 + 3]], { sv: Math.min(1, (gen + 4) / (2 * ar)) + 0.25 });
  else if (uc === 'duz' || uc === 'yuvarlak') for (const s of [-1, 1]) g.kutu(0, s * yarim - kal * 0.55, s * yarim + kal * 0.55, -gen / 2, gen / 2, 0, w0 + kal * 0.2, Math.min(gen, kal) * 0.3);
}

// Köşeli (U / D) kulp: iki bacak ve aradaki düz çubuk. r: köşe yarıçapı; egik: bacakların içe yatması; pabuc: dışa uzanan ayak
// plakası; roz: yuvarlak ayak rozeti
function kopru(g, L, o) {
  const { H = 28, k = 'dik', en = 12, kal = 8, r = 0, egik = 0, pabuc = 0, roz = 0 } = o;
  const x = L / 2 - kal / 2 - (pabuc ? pabuc : 0), yt = H - kal / 2, e = Math.min(egik, x * 0.6);
  let yol = [[-x, 0, 0], [-x + e, 0, yt], [x - e, 0, yt], [x, 0, 0]];
  if (r > 0.5) yol = yuvarlat(yol, r, 7);
  g.tup(0, yol, kesit(k, en, kal));
  const gen = k === 'yuv' ? kal : en;
  if (pabuc) for (const s of [-1, 1]) g.kutu(0, s > 0 ? x - kal / 2 : -x - pabuc, s > 0 ? x + pabuc : -x + kal / 2, -gen / 2, gen / 2, 0, Math.max(2.5, Math.min(kal, 4)), 1.5);
  if (roz) for (const s of [-1, 1]) g.donel(0, s * x, 0, [[roz, 0], [roz, 2], [roz * 0.7, 4.5]]);
}

// Çubuk kulp: iki direğin üstünde düz çubuk. tasma: direklerin uçtan uzaklığı (verilmezse delik aralığından); uc: 'top' uçlarda
// küre; orta: iğ biçimi (ortası kalın); iki: çubuk ikinci malzemeden; ikiDirek: direkler ikinci malzemeden
function cubuk(g, L, o, delik) {
  const { cap = 12, H = 32, k = 'yuv', uc = 'duz', dk = 'yuv', orta = 1, iki = 0, ikiDirek = 0, da = 0 } = o, en = o.en || cap, kal = o.kal || cap;
  const ts = o.tasma ?? Math.max(6, Math.min(L * 0.22, (L - (delik || L - 28)) / 2)), wc = H - kal / 2, rd = (o.dc || Math.max(7, Math.min(en, kal) * 0.8)) / 2;
  const yb = L / 2 - (uc === 'top' ? kal * 0.72 : 0), ud = ts < 1 ? yb - rd : Math.max(4, yb - ts); // çubuğun yarı boyu (uçtaki küre boya dahildir) ve direklerin yeri
  const N = orta !== 1 || uc === 'yuvarlak' ? 18 : 1, bas = ts < 1 ? -ud + rd * 0.6 : -yb, son = -bas;
  const yol = Array.from({ length: N + 1 }, (_, i) => [bas + (son - bas) * i / N, 0, wc]);
  g.tup(iki ? 1 : 0, yol, kesit(k, en, kal), { olcek: orta !== 1 ? t => { const q = 1 + (orta - 1) * Math.sin(Math.PI * t) ** 2; return [q, q]; } : null });
  for (const s of [-1, 1]) {
    const md = ikiDirek ? 1 : 0;
    if (dk === 'dik') g.kutu(md, s * ud - rd, s * ud + rd, -Math.max(en / 2, rd), Math.max(en / 2, rd), 0, ts < 1 ? H : wc, 0.8);
    else g.donel(md, s * ud, 0, da ? [[rd * 1.7, 0], [rd * 1.7, 2], [rd * 1.05, 5], [rd * 0.8, wc * 0.5], [rd * 1.1, wc - 2], [rd, wc]] : [[rd * 1.35, 0], [rd * 1.35, 1.5], [rd, 3.5], [rd, wc]]);
    if (uc === 'top') g.elips(0, [s * yb, 0, wc], [kal * 0.72, kal * 0.72, kal * 0.72]);
  }
}

// Yassı profil kulp. tip: 'blok' (kapağa oturan dolu çubuk), 'L' (köşebent: kapağa yatan taban ve dışa çıkan dudak),
// 'plaka' (uçları pahlı ya da oval ince plaka; bar: ortasında ikinci malzemeden çıkıntı). iki: ortadaki bölüm ikinci malzeme
function serit(g, L, o) {
  const { tip = 'blok', en = 18, kal = 12, iki = 0, bar = 0, oval = 0 } = o, h = L / 2;
  if (tip === 'L') { g.kutu(0, -h, h, -en / 2, en / 2, 0, 2.6, 0.6); g.kutu(0, -h, h, en / 2 - 2.8, en / 2, 0, kal, 0.6); g.kutu(0, -h, h, en / 2 - 7, en / 2, kal - 2.8, kal, 0.6); return; }
  if (tip === 'plaka') {
    const pah = Math.min(en * 0.45, h * 0.3);
    const cok = oval ? elipsK(h, en / 2, 28) : [[h, -en / 2 + pah], [h, en / 2 - pah], [h - pah, en / 2], [-h + pah, en / 2], [-h, en / 2 - pah], [-h, -en / 2 + pah], [-h + pah, -en / 2], [h - pah, -en / 2]];
    g.levha(0, cok, 0, kal, Math.min(1.5, kal * 0.4));
    if (bar) g.kutu(1, -h * 0.5, h * 0.5, -en * 0.2, en * 0.2, kal - 0.2, kal + 5, 1.5, 1);
    return;
  }
  if (iki > 0) { const a = h * iki; g.kutu(0, -h, -a, -en / 2, en / 2, 0, kal, 1); g.kutu(1, -a, a, -en / 2, en / 2, 0, kal, 1); g.kutu(0, a, h, -en / 2, en / 2, 0, kal, 1); }
  else g.kutu(0, -h, h, -en / 2, en / 2, 0, kal, Math.min(2, en * 0.2), Math.min(1.2, kal * 0.1));
}

// Porselenli klasik kulp: iki süslü direk, aralarında porselen fıçı. tip: 'fici' (kavisli kollar), 'duz' (düz çubuk),
// 'madalyon' (kavisli gövdenin ortasında oval porselen)
function klasik(g, L, o, delik) {
  const { H = 30, tip = 'fici', pc = 16, dc = 9, uc = '' } = o, ud = Math.max(10, Math.min(L / 2 - 6, (delik || L - 34) / 2)), rd = dc / 2, wc = H - pc / 2;
  if (tip === 'madalyon') {
    yay(g, L, { H: H - 4, k: 'yassi', en: 12, kal: 5, uc: 'ayak' });
    g.elips(1, [0, 0, H - 5], [Math.min(L * 0.2, 24), Math.min(L * 0.13, 15), 5]); g.halka(0, [0, 0, H - 6], Math.min(L * 0.2, 24), 1.6, { sv: Math.min(L * 0.13, 15) / Math.min(L * 0.2, 24) });
    return;
  }
  for (const s of [-1, 1]) { // direk: geniş taban, boğumlu gövde
    g.donel(0, s * ud, 0, [[rd * 1.9, 0], [rd * 1.9, 1.8], [rd * 1.2, 4.5], [rd * 0.85, wc * 0.45], [rd * 1.25, wc * 0.7], [rd * 1.05, wc + rd * 0.4]]);
    g.elips(0, [s * ud, 0, wc], [rd * 1.25, rd * 1.25, rd * 1.25]);
    if (uc === 'top') g.elips(0, [s * (ud + rd * 2.2), 0, wc], [rd * 1.1, rd, rd]);
  }
  const b = ud - rd * 1.1, pb = b * (tip === 'duz' ? 0.86 : 0.72); // fıçının yarı boyu
  g.igne(0, 0, wc, [[-b, rd * 0.62], [-pb - 3, rd * 0.62], [-pb - 3, pc * 0.36], [-pb, pc * 0.36], [pb, pc * 0.36], [pb + 3, pc * 0.36], [pb + 3, rd * 0.62], [b, rd * 0.62]]);
  const P = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, u = -pb + 2 * pb * t; P.push([u, tip === 'duz' ? pc * 0.44 : pc * (0.36 + 0.14 * Math.sin(Math.PI * t))]); }
  g.igne(1, 0, wc, P);
}

// Düğme kulp. tip: 'mantar', 'top', 'koni' (öne doğru genişler), 'disk', 'kare', 'oval', 'kup', 'porselen' (madeni tabanda
// porselen kubbe), 'cift' (iki küre). ic: kare düğmede ikinci malzemeden iç yüz
function dugme(g, L, o) {
  const { tip = 'mantar', H = 26, su = 1, sv = 1, ic = 0, yuz = 0 } = o, c = Math.max(18, Math.min(60, L)), r = c / 2, n = yuz ? 8 : 22;
  if (tip === 'top') { g.donel(0, 0, 0, [[r * 0.42, 0], [r * 0.42, 1.5], [r * 0.3, 4], [r * 0.3, H - r * 1.1]], { n }); g.elips(0, [0, 0, H - r * 0.62], [r * 0.62, r * 0.62, r * 0.62], yuz ? 5 : 10); return; }
  if (tip === 'cift') { g.donel(0, 0, 0, [[r * 0.3, 0], [r * 0.3, H * 0.5]]); for (const s of [-1, 1]) g.elips(0, [s * r * 0.36, 0, H - r * 0.42], [r * 0.44, r * 0.44, r * 0.42]); return; }
  if (tip === 'koni') { g.donel(0, 0, 0, [[r * 0.5, 0], [r * 0.5, 1.5], [r * 0.42, 3], [r * 0.96, H - 2], [r, H - 0.8], [r * 0.9, H]], { n }); return; }
  if (tip === 'disk') { g.donel(0, 0, 0, [[r * 0.34, 0], [r * 0.34, 1.5], [r * 0.24, 4], [r * 0.24, H - 9], [r * 0.96, H - 7], [r, H - 4.5], [r * 0.86, H - 1.2], [r * 0.4, H]], { n, su, sv }); return; }
  if (tip === 'oval') { g.donel(0, 0, 0, [[r * 0.3, 0], [r * 0.3, 1.5], [r * 0.22, 4], [r * 0.22, H - 11]], { n: 16 }); g.elips(0, [0, 0, H - 6.5], [r * (o.su || 1), r * (o.sv || 0.58), 6.5]); return; }
  if (tip === 'porselen') {
    g.donel(0, 0, 0, [[r * 0.5, 0], [r * 0.5, 2], [r * 0.32, 5], [r * 0.36, H - 12], [r, H - 10], [r, H - 7], [r * 0.9, H - 6]], { n, su, sv });
    g.elips(1, [0, 0, H - 7.5], [r * 0.9 * su, r * 0.9 * sv, 7.5]);
    return;
  }
  if (tip === 'kup') { const a = r * 0.72; g.kutu(0, -a * 0.6, a * 0.6, -a * 0.6, a * 0.6, 0, H * 0.3, 1); g.kutu(0, -a, a, -a, a, H * 0.3, H, 2, 1.5); return; }
  if (tip === 'kare') {
    const a = r * su, b = r * sv, kal = o.yuksek ? H * 0.55 : 6;
    g.donel(0, 0, 0, [[Math.min(a, b) * 0.42, 0], [Math.min(a, b) * 0.42, 1.5], [Math.min(a, b) * 0.32, 4], [Math.min(a, b) * 0.32, H - kal]], { n: o.yuksek ? 4 : 14, kose: Math.PI / 4 });
    g.kutu(0, -a, a, -b, b, H - kal, H, 2, ic ? 0 : 1.2);
    if (ic) g.kutu(1, -a * 0.8, a * 0.8, -b * 0.8, b * 0.8, H - 0.3, H + 0.9, 1.5, 0.5);
    return;
  }
  g.donel(0, 0, 0, [[r * 0.4, 0], [r * 0.4, 1.5], [r * 0.3, 4], [r * 0.3, H * 0.42], [r * 0.82, H * 0.56], [r, H * 0.68], [r * 0.95, H * 0.82], [r * 0.66, H * 0.95], [r * 0.2, H]], { n, su, sv }); // mantar
}

// Halka ve sarkan kulplar (v ekseni aşağı doğru eksi). tip: 'damla' (rozetten sarkan damla), 'damlahalka' (sarkan damla
// biçimli halka), 'sarkac' (iki rozet arasında sarkan kulp), 'halka' (taşıyıcıdan sarkan halka), 'deri' (düğmeden sarkan deri
// halka), 'dil' (madeni başlıktan sarkan deri dil)
function halka(g, L, o, delik) {
  let { tip = 'halka' } = o;
  if (tip === 'oto') tip = delik ? 'sarkac' : 'damla';
  const roz = (u, r = 9) => { g.donel(0, u, 0, [[r, 0], [r, 2], [r * 0.7, 4], [r * 0.45, 7.5], [r * 0.5, 10], [r * 0.2, 11]]); };
  if (tip === 'damla') {
    roz(0, 10); g.halka(0, [0, -3, 9], 4, 1.4, { duzlem: 'vw' });
    const P = []; for (let i = 0; i <= 14; i++) { const t = i / 14; P.push([-8 - 34 * t, 1.2 + 6.2 * Math.sin(Math.PI * Math.pow(t, 0.62)) * (0.55 + 0.45 * t)]); }
    const H = P.map(([v, r]) => Array.from({ length: 14 }, (_, j) => { const a = TAU * j / 14; return [r * Math.sin(a), v, 9 + r * 0.8 * Math.cos(a)]; }));
    g.kabuk(0, H.reverse());
    return;
  }
  if (tip === 'damlahalka') { roz(0, 10); g.halka(0, [0, -3, 9], 4, 1.4, { duzlem: 'vw' }); g.tup(0, Array.from({ length: 30 }, (_, i) => { const a = TAU * i / 30; return [10 * Math.sin(a) * (0.55 + 0.45 * (1 - Math.cos(a)) / 2), -22 + 15 * Math.cos(a), 9]; }), elipsK(2.2, 2.2, 10), { B: [0, 0, 1], kapali: true }); return; }
  if (tip === 'sarkac') {
    const a = Math.max(20, (delik || L * 0.8) / 2), m = o.t2 === 'mat' ? 1 : 0;
    roz(-a, 8.5); roz(a, 8.5);
    const yol = Array.from({ length: 25 }, (_, i) => { const f = Math.PI * i / 24; return [-a * Math.cos(f), -1 - 24 * Math.sin(f), 9]; });
    g.tup(m, yol, elipsK(3, 3, 12), { B: [0, 0, 1], olcek: t => { const q = 1 + 0.5 * Math.exp(-((t - 0.5) ** 2) / 0.012); return [q, q]; } });
    return;
  }
  if (tip === 'deri') { // düğme ve ondan sarkan deri halka
    g.donel(0, 0, 0, [[6, 0], [6, 2], [4, 5], [4, 12], [9, 15], [9.5, 20], [7, 23], [2, 24]]);
    g.halka(1, [0, -17, 10], 17, 3.2, { sv: 1.15 });
    return;
  }
  if (tip === 'dil') { // madeni başlık ve deri dil
    const uzun = o.uzun ? 62 : 44, gen = o.uzun ? 26 : 40;
    g.kutu(0, -gen * 0.36, gen * 0.36, -6, 8, 0, 9, 2, 1);
    const cok = o.uzun ? dikK(gen / 2, uzun / 2, 5, 4).map(([a, b]) => [a, b - uzun / 2 - 2]) : elipsK(gen / 2, uzun / 2, 28).map(([a, b]) => [a, b - uzun / 2 - 2]);
    g.levha(1, cok, 3, 6.5, 1);
    return;
  }
  // taşıyıcıdan sarkan halka
  if (o.cubuk) { g.kutu(0, -16, 16, -5, 5, 0, 10, 3, 1); g.halka(0, [0, -25, 10], 22, 3.2); return; }
  g.donel(0, 0, 0, [[8, 0], [8, 2], [5, 5], [5, 9], [6.5, 11]]); g.halka(0, [0, -Math.max(14, L * 0.4), 9], Math.max(14, L * 0.4), 2.8);
}

// Kepçe ve gömme kulplar. tip: 'kabuk' (klasik kepçe: çeyrek elipsoit, altı açık), 'kutu' (köşeli kepçe), 'gomme' (kapağa
// gömülen oval ya da köşeli çanak), 'kivrik' (kıvrık sac)
function kepce(g, L, o) {
  const { tip = 'kabuk', en = 38, sekil = 'oval' } = o, a = Math.max(14, L / 2);
  if (tip === 'gomme') {
    const b = Math.min(en, L * 0.6) / 2, dis = sekil === 'oval' ? elipsK(a, b, 30) : dikK(a, b, Math.min(6, b * 0.4), 3);
    g.levha(0, dis, 0, 2.6, 0.9); g.levha(2, (sekil === 'oval' ? elipsK(a * 0.78, b * 0.62, 26) : dikK(a * 0.82, b * 0.6, Math.min(5, b * 0.3), 3)), 2.5, 2.9);
    return;
  }
  if (tip === 'kutu') { const b = Math.max(16, Math.min(en, 40)) / 2; g.kutu(0, -a, a, -b, b, 0, 20, 2, 1.5); g.kutu(2, -a * 0.82, a * 0.82, -b - 0.2, -b * 0.25, 4, 17, 1); return; }
  if (tip === 'kivrik') { // çeyrek silindir biçiminde kıvrık sac: üst kenarı kapakta, alt kenarı dışarıda
    const b = Math.min(en, 44), R = b * 0.9, yol = Array.from({ length: 13 }, (_, i) => { const f = Math.PI / 2 * i / 12; return [0, b / 2 - R * Math.sin(f), R * (1 - Math.cos(f)) + 1.5]; });
    g.tup(0, yol, dikK(a, 1.5, 0.5, 1), { B: [1, 0, 0] });
    return;
  }
  const b = Math.min(en, L * 0.42, 40), h = Math.min(24, b * 0.72), NA = 20, NB = 8, H = []; // kabuk: u²/a² + v²/b² + w²/h² = 1, v ≥ 0, w ≥ 0
  for (let j = 0; j <= NB; j++) { const be = Math.PI / 2 * j / NB; H.push(Array.from({ length: NA + 1 }, (_, i) => { const al = Math.PI * i / NA; return [a * Math.cos(al), b * Math.sin(al) * Math.cos(be) - b * 0.3, Math.max(0.01, h * Math.sin(al) * Math.sin(be))]; })); }
  for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) { g.ucgen(0, H[j][i], H[j][i + 1], H[j + 1][i + 1]); g.ucgen(0, H[j][i], H[j + 1][i + 1], H[j + 1][i]); }
  for (let i = 0; i < NA; i++) g.ucgen(2, [0, -b * 0.3, 0], H[NB][i + 1], H[NB][i]); // alttaki açıklık koyu görünür
  g.kutu(0, -a - 5, a + 5, b * 0.7 - 5, b * 0.7 + 3, 0, 2.4, 2); // üstteki bağlantı kulağı
}

// Kenar profili: kapağın kenarına oturan şerit
function kenar(g, L) { const h = L / 2; g.kutu(0, -h, h, -6, 6, 0, 12, 0.8, 1); g.kutu(2, -h + 2, h - 2, -6.2, -1, 4, 9, 0.5); }

// Özel biçimler
function ozel(g, L, o) {
  const { tip } = o;
  if (tip === 'yaprak') { // sapı üstünde yaprak: iki yay arasında kalan levha, ortası damarlı
    const a = Math.max(28, L * 0.62), b = a * 0.34, cok = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; cok.push([-a + 2 * a * t, -b * Math.sin(Math.PI * t) * (0.7 + 0.3 * t)]); }
    for (let i = 1; i < 12; i++) { const t = 1 - i / 12; cok.push([-a + 2 * a * t, b * Math.sin(Math.PI * t) * (1 - 0.25 * t)]); }
    g.donel(0, 0, 0, [[5, 0], [5, 2], [3.4, 4], [3.4, 13]], { n: 12 }); g.levha(0, cok, 12, 16.5, 1.4); g.tup(0, [[-a * 0.9, 0, 17], [0, 0, 18], [a * 0.9, 0, 17]], elipsK(1.6, 1.6, 8));
    return;
  }
  if (tip === 'kelebek') { g.donel(0, 0, 0, [[5, 0], [5, 2], [3.4, 4], [3.4, 11]], { n: 12 }); for (const [u, v, ru, rv] of [[-13, 7, 13, 11], [13, 7, 13, 11], [-10, -9, 9, 8], [10, -9, 9, 8]]) g.levha(0, elipsK(ru, rv, 20).map(([a, b]) => [u + a, v + b]), 10, 15, 1.5); g.elips(0, [0, 0, 14], [3, 13, 4]); return; }
  if (tip === 'fil') { g.donel(0, 0, 0, [[5, 0], [5, 2], [3.4, 4], [3.4, 11]], { n: 12 }); g.levha(0, elipsK(17, 14, 24).map(([a, b]) => [a + 4, b + 2]), 10, 16, 2); g.levha(0, elipsK(11, 12, 20).map(([a, b]) => [a - 12, b + 6]), 10, 17, 2); g.kutu(0, -22, -16, -14, 2, 10, 16, 2.5, 1.5); for (const u of [-4, 10]) g.kutu(0, u, u + 7, -17, -8, 10, 16, 2, 1.5); return; }
  if (tip === 'cakil') { const a = Math.max(26, L * 0.36); for (const [u, v, r, h] of [[-a, 0, 9, 9], [-a * 0.52, 7, 10.5, 11], [-a * 0.5, -8, 7.5, 8], [0, -2, 11.5, 12], [a * 0.42, 8, 8.5, 9], [a * 0.5, -7, 9.5, 10], [a, 1, 8, 8.5]]) g.donel(0, u, v, [[r * 0.5, 0], [r * 0.5, h - 4.5], [r, h - 4], [r, h - 1.2], [r * 0.8, h]], { n: 18 }); return; }
  if (tip === 'baklava') { const a = Math.max(20, L * 0.5); g.donel(0, 0, 0, [[5, 0], [5, 2], [3.6, 4], [3.6, 14]], { n: 12 }); g.levha(0, [[a, 0], [0, a * 0.62], [-a, 0], [0, -a * 0.62]], 13, 19, 2); return; }
  dugme(g, L, {});
}

export const _ic = { Ag }; // sınamalar için
const URETICI = { yay, kopru, cubuk, serit, klasik, dugme, halka, kepce, kenar: (g, L) => kenar(g, L), ozel };
const NOKTASAL = new Set(['dugme', 'halka', 'ozel']); // boyu olmayan kulplar: kapakta hep aynı duruşta (döndürülmez)

// ---- Aileler ----------------------------------------------------------------------
// [biçim, ölçüler, kaplama, ikinci renk]. Anahtar: katalogdaki aile adı; aynı ailede düğme de varsa 'Ad|knob'.
// Ölçülerde t2: ikinci malzemenin türü ('seramik' porselen ve parlak boya (varsayılan), 'mat' ahşap ve deri, 'kulp' ikinci metal);
// t: ana malzemenin türü ('kulp' metal (varsayılan), 'mat' boyalı / plastik / ahşap)
const A = {
  'Abby': ['yay', { H: 24, k: 'oval', en: 10, kal: 6, uc: 'ayak' }, 'krom'],
  'Alexis': ['kopru', { H: 20, en: 16, kal: 5 }, 'krom'],
  'Anne Clair': ['yay', { H: 30, k: 'oval', en: 13, kal: 7, uc: 'ayak', ar: 10 }, 'krom'],
  'Bella': ['kopru', { H: 24, en: 10, kal: 6 }, 'krom'],
  'Bernard': ['cubuk', { cap: 11, H: 32, uc: 'top', da: 1 }, 'siyah'],
  'Bertha': ['yay', { H: 24, k: 'yassi', en: 16, kal: 6, uc: 'duz', iki: 0.78 }, 'nikel', 'krem'],
  'Betty|knob': ['dugme', { tip: 'porselen', su: 1.25, sv: 0.85 }, 'gumus', 'beyaz'],
  'Betty': ['klasik', { tip: 'madalyon' }, 'gumus', 'beyaz'],
  'Brocke': ['kopru', { H: 22, en: 20, kal: 4 }, 'krom'],
  'Ceressa': ['yay', { H: 22, k: 'oval', en: 10, kal: 5, uc: 'sivri' }, 'krom'],
  'Chloe': ['kopru', { H: 24, en: 18, kal: 8, r: 14 }, 'nikel'],
  'Cube': ['kopru', { H: 30, en: 12, kal: 12 }, 'alu'],
  'Dakota': ['serit', { tip: 'blok', en: 18, kal: 22 }, 'nikel'],
  'Daphne': ['ozel', { tip: 'yaprak' }, 'altin'],
  'Dorothy': ['klasik', {}, 'antik', 'beyaz'],
  'Drop': ['halka', { tip: 'oto' }, 'antik'],
  'Edna': ['kopru', { H: 20, en: 12, kal: 4, r: 4 }, 'krom'],
  'Elmer': ['kopru', { H: 22, en: 14, kal: 6 }, 'krom'],
  'Elsie': ['klasik', { pc: 17 }, 'antik', 'krem'],
  'Enzo': ['serit', { tip: 'plaka', en: 26, kal: 3, bar: 1, t2: 'kulp' }, 'kursun', 'krom'],
  'Flandra|knob': ['dugme', { tip: 'disk' }, 'antik'],
  'Flandra': ['yay', { H: 20, k: 'yuv', kal: 9, orta: 1.35, uc: 'ayak' }, 'antik'],
  'Flower|knob': ['dugme', { tip: 'kare' }, 'gumus'],
  'Flower': ['yay', { H: 22, k: 'oval', en: 12, kal: 6, uc: 'sivri' }, 'gumus'],
  'Gestrud': ['yay', { H: 22, k: 'yassi', en: 16, kal: 4, uc: 'sivri' }, 'krom'],
  'Georgetown|knob': ['dugme', { tip: 'porselen' }, 'antik', 'krem'],
  'Georgetown': ['klasik', { tip: 'duz' }, 'antik', 'krem'],
  'Hannah': ['kopru', { H: 24, en: 12, kal: 10 }, 'nikel'],
  'Hazel|knob': ['dugme', { tip: 'porselen' }, 'antik', 'beyaz'],
  'Hazel': ['klasik', {}, 'antik', 'beyaz'],
  'Industry|knob': ['dugme', { tip: 'kup' }, 'krom'],
  'Industry': ['kopru', { H: 24, en: 24, kal: 3, r: 2 }, 'krom'],
  'Irene': ['yay', { H: 16, k: 'yassi', en: 18, kal: 4, uc: 'sivri' }, 'krom'],
  'Journey|knob': ['dugme', { tip: 'oval' }, 'antik'],
  'Journey': ['yay', { H: 26, k: 'yassi', en: 14, kal: 5, uc: 'ayak' }, 'bakir'],
  'July': ['cubuk', { k: 'dik', en: 12, kal: 8, H: 28, dk: 'dik' }, 'siyah'],
  'Katarina': ['kopru', { H: 22, en: 8, kal: 6, r: 1 }, 'krom'],
  'Kato|knob': ['dugme', { tip: 'disk' }, 'antik'],
  'Kato': ['yay', { H: 26, k: 'yuv', kal: 9, orta: 1.2, uc: 'ayak' }, 'antik'],
  'Knite': ['serit', { tip: 'plaka', en: 22, kal: 6 }, 'nikel'],
  'Lean|knob': ['dugme', { tip: 'oval' }, 'krom'],
  'Lean': ['yay', { H: 26, k: 'yassi', en: 22, kal: 5, uc: 'ayak' }, 'kursun'],
  'Lena2': ['serit', { tip: 'L', en: 20, kal: 14 }, 'alu'],
  'Liberta': ['kopru', { H: 28, k: 'yuv', kal: 8, r: 14, egik: 10 }, 'krom'],
  'Lindsey': ['cubuk', { cap: 10, H: 32 }, 'inox'],
  'Lone': ['halka', { tip: 'halka' }, 'krom'],
  'Marcello': ['kopru', { H: 22, en: 26, kal: 3, r: 6 }, 'nikel'],
  'Mia': ['serit', { tip: 'blok', en: 10, kal: 20, iki: 0.34, t2: 'kulp' }, 'siyah', 'krom'],
  'Mia Side': ['kenar', {}, 'alu'],
  'Molle': ['kopru', { H: 22, en: 14, kal: 8, r: 10 }, 'siyah'],
  'Norman': ['cubuk', { k: 'dik', en: 10, kal: 10, H: 26, tasma: 0, dk: 'dik', dc: 14, iki: 1 }, 'gumus', '#CFE0E6'],
  'Olive': ['klasik', { tip: 'duz', uc: 'top' }, 'altin', 'beyaz'],
  'Passo': ['yay', { H: 22, k: 'yassi', en: 14, kal: 4, uc: 'duz', kay: 8 }, 'krom'],
  'Paul': ['klasik', {}, 'krom', 'beyaz'],
  'Peyton': ['yay', { H: 20, k: 'yassi', en: 14, kal: 4, orta: 1.8, uc: 'sivri' }, 'krom'],
  'Rebecca': ['cubuk', { k: 'dik', en: 12, kal: 10, H: 22, tasma: 0, dk: 'dik', dc: 12, iki: 1 }, 'krom', 'beyaz'],
  'Rigid': ['kopru', { H: 28, en: 14, kal: 6, r: 2, egik: 8 }, 'nikel'],
  'Root': ['yay', { H: 28, k: 'yuv', kal: 10, uc: 'ayak' }, 'gumus'],
  'Ryan': ['kopru', { H: 24, k: 'yuv', kal: 6, r: 8 }, 'krom'],
  'Satu|Düğme': ['halka', { tip: 'deri', t2: 'mat' }, 'altin', 'deri'],
  'Satu': ['halka', { tip: 'sarkac', t2: 'mat' }, 'altin', 'deri'],
  'Stone': ['ozel', { tip: 'cakil' }, 'alu'],
  'Thor': ['cubuk', { cap: 12, H: 32 }, 'inox'],
  'Umberto': ['kopru', { H: 26, k: 'yuv', kal: 6, r: 5 }, 'krom'],
  'Vera': ['kopru', { H: 28, en: 26, kal: 5, r: 1 }, 'siyah'],
  'Vienna': ['cubuk', { cap: 10, H: 30, uc: 'top', da: 1 }, 'gumus'],
  'Violet': ['klasik', {}, 'gumus', 'beyaz'],
  'Arco': ['dugme', { tip: 'koni' }, 'krom'],
  'Bloomsbury': ['yay', { H: 24, k: 'oval', en: 12, kal: 5, uc: 'ayak' }, 'altin'],
  'Lennon': ['kopru', { H: 20, en: 16, kal: 5 }, 'krom'],
  'Nove': ['kopru', { H: 26, en: 30, kal: 8, egik: 14, r: 4 }, 'siyah'],
  'Roze': ['klasik', {}, 'krom', 'beyaz'],
  'Sophie': ['kopru', { H: 22, k: 'yuv', kal: 5, r: 6 }, 'altin'],
  'Zar': ['yay', { H: 24, k: 'oval', en: 12, kal: 6, uc: 'ayak' }, 'gumus'],
  'Zeta': ['kopru', { H: 24, en: 14, kal: 4, r: 6, pabuc: 14 }, 'siyah'],
  'Blacky': ['dugme', { tip: 'kare', ic: 1 }, 'krom', 'beyaz'],
  'Dale': ['dugme', { tip: 'kare', ic: 1, t2: 'mat' }, 'gumus', '#8E9092'],
  'Fungo': ['dugme', { tip: 'mantar' }, 'krom'],
  'Gelato': ['dugme', { tip: 'porselen' }, 'altin', 'krem'],
  'Geraldine': ['halka', { tip: 'damlahalka' }, 'antik'],
  'Hendel': ['halka', { tip: 'halka', cubuk: 1 }, 'siyah'],
  'Olifanta': ['ozel', { tip: 'fil', t: 'mat' }, '#8A7FD0'],
  'Flybo': ['ozel', { tip: 'kelebek', t: 'mat' }, '#E0559A'],
  'Opal': ['dugme', { tip: 'kup' }, 'krom'],
  'Pearl': ['dugme', { tip: 'cift' }, 'krom'],
  'Vasso': ['dugme', { tip: 'koni' }, 'krom'],
  'Kalın kulp A17': ['kopru', { H: 32, en: 16, kal: 12, r: 2 }],
  'Kulp 1': ['kopru', { H: 28, en: 14, kal: 12 }],
  'Kulp 2': ['kepce', { tip: 'gomme', en: 34, sekil: 'dik' }],
  'Kulp 3': ['yay', { H: 24, k: 'oval', en: 14, kal: 6, uc: 'sivri' }],
  'Kulp 4': ['yay', { H: 24, k: 'oval', en: 14, kal: 6, uc: 'sivri' }],
  'Kulp 7': ['cubuk', { cap: 10, H: 28, tasma: 16 }],
  'Kulp 11': ['yay', { H: 26, k: 'yassi', en: 14, kal: 6, uc: 'duz' }],
  'Kulp 12': ['yay', { H: 26, k: 'oval', en: 14, kal: 7, orta: 1.3, uc: 'sivri' }],
  'Kulp 12A': ['yay', { H: 26, k: 'oval', en: 14, kal: 7, orta: 1.3, uc: 'sivri', t: 'mat' }, 'ahsap'],
  'Kulp 13': ['yay', { H: 26, k: 'yuv', kal: 10, uc: 'ayak' }],
  'Kulp 14': ['yay', { H: 26, k: 'yuv', kal: 9, uc: 'ayak' }],
  'Kulp 16': ['yay', { H: 26, k: 'oval', en: 14, kal: 7, uc: 'sivri' }],
  'Kulp 17': ['yay', { H: 26, k: 'oval', en: 12, kal: 6, uc: 'sivri' }],
  'Kulp 18': ['cubuk', { cap: 11, H: 26, tasma: 0, dc: 12, iki: 1, t2: 'mat' }, 'inox', 'ahsap'],
  'Kulp 19': ['yay', { H: 26, k: 'oval', en: 14, kal: 8, uc: 'duz', iki: 0.7, t2: 'mat' }, 'inox', 'ahsap'],
  'Kulp 20': ['ozel', { tip: 'baklava' }],
  'Kulp 21': ['yay', { H: 30, k: 'yuv', kal: 9, direk: true, tasma: 22 }],
  'Kulp 41': ['yay', { H: 26, k: 'yassi', en: 18, kal: 5, uc: 'sivri' }],
  'Kulp 42': ['cubuk', { cap: 8, H: 26, tasma: 30 }],
  'Kulp 43': ['yay', { H: 30, k: 'yassi', en: 16, kal: 6, direk: true, tasma: 40 }],
  'Kulp 44': ['yay', { H: 26, k: 'yassi', en: 16, kal: 6, orta: 1.4, uc: 'sivri' }],
  'Kulp 45': ['yay', { H: 26, k: 'yuv', kal: 5, cift: 5, uc: 'duz' }],
  'Kulp 50': ['dugme', { tip: 'top', yuz: 1 }],
  'Rustik': ['klasik', {}, 'inox', '#E7C9CF'],
  'İzmira': ['kepce', { tip: 'kabuk' }, 'gumus'],
  'Lobut': ['cubuk', { cap: 10, H: 26, orta: 1.5, tasma: 20 }],
  'Mostar': ['yay', { H: 24, k: 'yuv', kal: 9, uc: 'duz' }],
  'Bond': ['kopru', { H: 22, en: 10, kal: 8, r: 3 }],
  'Fruko': ['dugme', { tip: 'kare', su: 1.6 }],
  'Nokta': ['dugme', { tip: 'top' }],
  'Tırtık': ['kenar', {}],
  'Tırtık 2': ['kepce', { tip: 'kutu' }],
  'Yay': ['yay', { H: 24, k: 'oval', en: 10, kal: 5, uc: 'sivri' }],
  'Aralık': ['kopru', { H: 22, en: 12, kal: 5, r: 2 }],
  'İkili': ['yay', { H: 26, k: 'oval', en: 14, kal: 8, uc: 'duz', iki: 0.5, t2: 'mat' }, 'inox', 'ahsap'],
  'Fuga': ['kenar', {}],
  'S kulp': ['yay', { H: 24, k: 'oval', en: 12, kal: 7, uc: 'duz', kay: 10 }],
  'Sivri': ['yay', { H: 26, k: 'oval', en: 14, kal: 7, uc: 'sivri', t: 'mat' }, 'ahsap'],
  'Uzun kulp 52': ['kopru', { H: 28, en: 12, kal: 10, r: 1 }],
  'İnce kulp 53': ['kopru', { H: 26, en: 8, kal: 8, r: 1 }],
  'Kavisli kulp 55': ['kopru', { H: 28, en: 12, kal: 8, r: 16 }],
  'Köşeli kulp 56': ['kopru', { H: 30, en: 16, kal: 12 }],
  'Bakır düğme 57': ['dugme', { tip: 'koni' }, 'bakir'],
  'Bakır kulp 58': ['halka', { tip: 'halka' }, 'bakir'],
  'Yuvarlak düğme 59': ['dugme', { tip: 'mantar' }],
  'Model 101': ['dugme', { tip: 'porselen' }, 'bakir', 'beyaz'],
  'Model 102': ['dugme', { tip: 'top' }, 'alu'],
  'Model 105': ['dugme', { tip: 'oval' }, 'bronz'],
  'Model 201': ['yay', { H: 34, k: 'yassi', en: 22, kal: 10, uc: 'duz', t: 'mat' }, 'krem'],
  'Model 303': ['yay', { H: 28, k: 'yuv', kal: 8, direk: true, tasma: 26 }, 'nikel'],
  'Model 305': ['kepce', { tip: 'kivrik' }, 'alu'],
  'Model 402': ['yay', { H: 26, k: 'oval', en: 14, kal: 6, uc: 'ayak' }, 'bronz'],
  'Model 403': ['yay', { H: 26, k: 'yuv', kal: 9, uc: 'ayak' }, '#A89F86'],
  'Model 404': ['yay', { H: 26, k: 'yassi', en: 22, kal: 6, uc: 'sivri' }, '#2B2622'],
  'Model 409': ['kopru', { H: 30, k: 'yuv', kal: 9, r: 6, roz: 9 }, 'alu'],
  'Model 410': ['kopru', { H: 26, en: 20, kal: 5 }, 'alu'],
  'Model 501': ['cubuk', { k: 'dik', en: 12, kal: 6, H: 24, dk: 'dik', dc: 16, tasma: 14, ikiDirek: 1, t2: 'mat' }, 'alu', 'ahsap'],
  'Model 502': ['yay', { H: 26, k: 'yuv', kal: 9, uc: 'ayak' }, 'nikel'],
  'Model 503': ['kopru', { H: 24, en: 18, kal: 4, r: 5, pabuc: 12 }, 'alu'],
  'Model 507': ['kopru', { H: 28, k: 'yuv', kal: 10, r: 12 }, 'alu'],
  'Model 509': ['yay', { H: 26, k: 'yuv', kal: 9, uc: 'ayak' }, 'nikel'],
  'Model 701': ['kopru', { H: 26, k: 'yuv', kal: 5, r: 20 }, 'alu'],
  'Model 411': ['klasik', { tip: 'madalyon' }, 'antik', 'krem'],
  'Model 185': ['kopru', { H: 28, en: 20, kal: 8, r: 2 }, 'nikel'],
  'Model 108': ['dugme', { tip: 'kare' }, 'nikel'],
  'Model 301': ['kopru', { H: 30, k: 'yuv', kal: 14, r: 14, t: 'mat' }, '#D6B48C'],
  'Model 405': ['yay', { H: 24, k: 'oval', en: 12, kal: 6, uc: 'sivri' }, 'siyah'],
  'Model 511': ['cubuk', { k: 'dik', en: 12, kal: 5, H: 26, dk: 'dik', tasma: 22 }, 'nikel'],
  'Model 510': ['yay', { H: 28, k: 'yuv', kal: 9, direk: true, tasma: 28 }, 'nikel'],
  'Model 805': ['kopru', { H: 26, en: 8, kal: 8, r: 1 }, 'nikel'],
  'Model 813': ['cubuk', { cap: 10, H: 30, tasma: 30 }, 'alu'],
  'Model 804': ['cubuk', { k: 'dik', en: 12, kal: 6, H: 26, tasma: 28 }, 'nikel'],
  'Model 512': ['klasik', { tip: 'duz' }, 'bronz', 'krem'],
  'Model 806': ['kopru', { H: 26, en: 14, kal: 5, egik: 10, r: 2 }, 'bronz'],
  'Model 110': ['dugme', { tip: 'kare', yuksek: 1 }, 'kursun'],
  'Model 703': ['yay', { H: 24, k: 'yuv', kal: 5, uc: 'sivri' }, 'alu'],
  'Model 109': ['dugme', { tip: 'kare', su: 1.5, ic: 1 }, 'bronz', 'krem'],
  'Seri 242': ['yay', { H: 24, k: 'yassi', en: 16, kal: 5, uc: 'sivri' }],
  'Seri 245': ['yay', { H: 26, k: 'oval', en: 14, kal: 7, uc: 'ayak' }],
  'Seri 246': ['yay', { H: 18, k: 'yassi', en: 16, kal: 4, orta: 1.7, uc: 'sivri' }],
  'Seri 248': ['kopru', { H: 28, en: 12, kal: 10, r: 2 }],
  'Seri 249': ['yay', { H: 28, k: 'oval', en: 18, kal: 10, uc: 'yuvarlak' }],
  'Seri 252': ['kopru', { H: 28, en: 12, kal: 10, r: 3 }],
  'Seri 253': ['kopru', { H: 28, en: 14, kal: 12, r: 1 }],
  'Model 468032': ['dugme', { tip: 'kare' }],
  'Model 467032': ['dugme', { tip: 'kare' }],
  'Model 466032': ['kepce', { tip: 'kabuk' }],
  'Model 465025': ['dugme', { tip: 'kare' }],
  'Model 464025': ['dugme', { tip: 'mantar' }],
  'Seri 286': ['yay', { H: 26, k: 'oval', en: 16, kal: 8, uc: 'yuvarlak' }],
  'Seri 269': ['yay', { H: 24, k: 'oval', en: 12, kal: 6, uc: 'sivri' }],
  'Seri 268': ['kepce', { tip: 'gomme', sekil: 'oval', en: 44 }],
  'Seri 267': ['kopru', { H: 28, en: 16, kal: 10, r: 1 }],
  'Seri 258': ['yay', { H: 28, k: 'oval', en: 18, kal: 9, uc: 'yuvarlak' }],
  'Seri 262': ['serit', { tip: 'plaka', oval: 1, en: 30, kal: 5 }],
  'Seri 266': ['kepce', { tip: 'gomme', sekil: 'oval', en: 50 }],
  'Seri 265': ['kepce', { tip: 'gomme', sekil: 'dik', en: 50 }],
  'Seri 264': ['kepce', { tip: 'gomme', sekil: 'dik', en: 44 }],
  'Seri 263': ['yay', { H: 26, k: 'oval', en: 14, kal: 7, uc: 'ayak' }],
  'Model 1110740415': ['serit', { tip: 'L', en: 22, kal: 16 }, 'alu'],
  'Model 1090940210': ['kopru', { H: 24, en: 16, kal: 4, r: 8, pabuc: 10 }, 'alu'],
  'Model 103602014': ['yay', { H: 26, k: 'oval', en: 14, kal: 8, uc: 'duz', kay: 12 }, 'alu'],
  'Model 107186038': ['yay', { H: 26, k: 'yuv', kal: 8, uc: 'ayak' }, 'alu'],
  'Model 102559016': ['yay', { H: 26, k: 'oval', en: 16, kal: 7, uc: 'ayak' }, 'alu'],
  'Model 102274205': ['yay', { H: 24, k: 'oval', en: 12, kal: 5, uc: 'sivri' }, 'alu'],
  'Model 103842047': ['yay', { H: 26, k: 'yuv', kal: 7, uc: 'duz' }, 'alu'],
  'Model 1097840311': ['yay', { H: 26, k: 'yuv', kal: 7, uc: 'ayak' }, 'alu'],
  'Model 101181201': ['halka', { tip: 'dil', t2: 'mat' }, 'alu', 'deri'],
  'Model 105943502': ['halka', { tip: 'deri', t2: 'mat' }, 'alu', '#1E1E1E'],
  'Model 110760113': ['halka', { tip: 'dil', uzun: 1, t2: 'mat' }, 'beyaz', 'deri'],
  'No 242': ['yay', { H: 24, k: 'yassi', en: 18, kal: 5, uc: 'sivri' }],
  'No 247': ['yay', { H: 20, k: 'yassi', en: 14, kal: 5, uc: 'sivri', kay: 8 }],
  'No 250': ['kopru', { H: 30, en: 14, kal: 14, r: 1 }],
  'No 253': ['kopru', { H: 28, en: 14, kal: 10, r: 1 }],
  'No 254': ['kopru', { H: 30, k: 'yuv', kal: 16, r: 10 }],
  'No 257': ['kopru', { H: 28, en: 12, kal: 10 }],
  'No 263': ['yay', { H: 26, k: 'oval', en: 16, kal: 8, uc: 'ayak' }],
  'No 833': ['kopru', { H: 24, en: 14, kal: 4, egik: 20, r: 3 }],
  'No 858': ['yay', { H: 24, k: 'yassi', en: 16, kal: 5, uc: 'sivri' }],
  'No 861': ['yay', { H: 20, k: 'oval', en: 12, kal: 5, uc: 'sivri', kay: 5 }],
  'No 866': ['yay', { H: 22, k: 'yassi', en: 14, kal: 5, uc: 'sivri', kay: 8 }],
  'No 869': ['yay', { H: 22, k: 'yassi', en: 16, kal: 5, uc: 'sivri', kay: 8 }],
  'No 874': ['kopru', { H: 30, en: 16, kal: 12, r: 2 }],
  'No 875': ['kopru', { H: 30, en: 18, kal: 12, r: 1 }],
  'No 894': ['yay', { H: 22, k: 'yassi', en: 14, kal: 5, uc: 'duz', kay: 8 }],
  'Seri 256': ['yay', { H: 22, k: 'yassi', en: 14, kal: 5, uc: 'ayak', kay: 7 }],
  'Seri 879': ['kopru', { H: 26, en: 8, kal: 8, egik: 16, r: 4 }],
  'Seri 883': ['kopru', { H: 26, en: 6, kal: 6, egik: 16, r: 4 }],
  'L profil kulp': ['serit', { tip: 'L', en: 18, kal: 14 }, 'alu'],
  'Yuvarlak çubuk kulp': ['cubuk', { cap: 12, H: 32 }],
};
// Aile tablosunda bulunmayan kulp: biçim sınıfının genel modeli
const SINIF = { bar: ['cubuk', { cap: 12, H: 30 }], bow: ['yay', { H: 26 }], u: ['kopru', { H: 28 }], flat: ['serit', { tip: 'blok', en: 18, kal: 12 }], classic: ['klasik', {}, 'inox', 'beyaz'],
  knob: ['dugme', {}], ring: ['halka', {}], cup: ['kepce', {}], tir: ['kenar', {}] };
// Genel modeller (kulplar.js: KULP_GENEL)
const GENEL = { cubuk: ['cubuk', { cap: 12, H: 26, tasma: 22 }], c32: ['cubuk', { cap: 12, H: 26, tasma: 26 }], boy: ['cubuk', { cap: 12, H: 26, tasma: 60 }], dug: ['dugme', { tip: 'mantar' }], tir: ['kenar', {}] };

// Bir kulpun modeli. satir: katalog satırı ([kod, biçim, boy, grup, aile, ölçü etiketi]); genel modellerde yalnızca kod verilir.
// Dönen: { uretici, o, renk (kaplama; '' ise projenin kulp rengi), renk2, tur, tur2, noktasal, delik }
export function kulpModeli(kod, satir = null) {
  let t = GENEL[kod] || null, delik = 0;
  if (!t && satir) {
    t = A[satir[4] + '|' + satir[1]] || A[satir[4] + '|' + satir[5]] || A[satir[4]] || SINIF[satir[1]] || SINIF.bar;
    delik = Number(/^(\d{2,4})\s*mm$/.exec(satir[5] || '')?.[1]) || 0;
    if (!NOKTASAL.has(t[0]) && delik >= satir[2]) delik = 0; // etiket toplam boyu veriyorsa (uzun profil kulplar) vida aralığı değildir
  }
  if (!t) return null;
  const o = t[1] || {};
  return { uretici: t[0], o, renk: renkCoz(t[2]), renk2: renkCoz(t[3]) || KULP_KAPLAMA.beyaz, tur: o.t || 'kulp', tur2: o.t2 || 'seramik', noktasal: NOKTASAL.has(t[0]), delik };
}

// Kulpun üçgen ağı. L: çizimdeki boy (mm). Dönen: { parcalar: [{ tur, renk, pos, norm }], sinir: [u0, v0, w0, u1, v1, w1] }
// tur: 'kulp' (metal), 'seramik' (porselen, parlak boya), 'mat' (ahşap, deri, plastik), 'koyu'. renk: '' ise kaplama rengi kullanılır.
const onbellek = new Map();
export function kulpAgi(kod, L, satir = null) {
  const anahtar = kod + '|' + Math.round(L);
  let s = onbellek.get(anahtar);
  if (s) return s;
  const md = kulpModeli(kod, satir);
  if (!md) return null;
  const g = new Ag();
  URETICI[md.uretici](g, Math.max(18, L), md.o, md.noktasal ? md.delik : md.delik && md.delik < L ? md.delik : 0);
  const turler = [md.tur, md.tur2, 'koyu'], renkler = ['', md.renk2, '#26282B'], parcalar = [], sinir = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  g.v.forEach((v, i) => {
    if (!v.length) return;
    const pos = new Float32Array(v);
    for (let j = 0; j < pos.length; j += 3) for (let a = 0; a < 3; a++) { if (pos[j + a] < sinir[a]) sinir[a] = pos[j + a]; if (pos[j + a] > sinir[a + 3]) sinir[a + 3] = pos[j + a]; }
    parcalar.push({ tur: turler[i], renk: renkler[i], pos, norm: normaller(pos) });
  });
  s = { parcalar, sinir, renk: md.renk, noktasal: md.noktasal };
  if (onbellek.size > 400) onbellek.clear();
  onbellek.set(anahtar, s);
  return s;
}
