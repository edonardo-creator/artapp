// Kapak kabartmaları: katalogdaki her lake kapak modelinin ön yüzündeki oyma (çerçeve, pano, kemer, lambri, çıta, panjur, kafes).
// Tarifler ARTAPP'in kendi modellemesidir: katalog resmine bakılarak kurulmuştur, üreticinin teknik çizimi değildir.
// Her model kapağın ölçüsüne göre bir yükseklik alanı üretir (mm; 0 kapağın ön yüzü, eksi içeri oyuk, artı dışarı kabarık).
// Bu alandan üç şey çıkar: 3B çizimin yüzey yönü haritası (nrm), fotoğraf motorunun eğim tablosu (egim) ve oyukları
// koyulaştıran gölge haritası (ton). Bu dosya başka dosyaya bağlı değildir (three.js gerekmez).

const yum = t => t * t * (3 - 2 * t);
const sinirla = (v, a, b) => v < a ? a : v > b ? b : v;

// ---- Şekiller: (x, y) → kenara uzaklık (mm; içeride artı, dışarıda eksi). x sağa, y yukarı; (0, 0) kapağın sol alt köşesi ----
const dikS = (x0, y0, x1, y1) => (x, y) => Math.min(x - x0, x1 - x, y - y0, y1 - y);
const yuvS = (x0, y0, x1, y1, r) => { // köşeleri yuvarlak dikdörtgen
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = (x1 - x0) / 2 - r, hy = (y1 - y0) / 2 - r;
  return (x, y) => { const qx = Math.abs(x - cx) - hx, qy = Math.abs(y - cy) - hy; return r - (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0)); };
};
// Üstü kemerli dikdörtgen. tip 'yay': daire yayı (uçlarda ah kadar alçak); 'kas': omuzlu yumuşak kemer
const kemerS = (x0, y0, x1, y1, ah, tip) => {
  const W = x1 - x0, cx = (x0 + x1) / 2, R = (W * W / 4 + ah * ah) / (2 * ah);
  const ust = tip === 'kas' ? x => y1 - ah * (1 - Math.pow(Math.sin(Math.PI * sinirla((x - x0) / W, 0, 1)), 1.6)) : x => y1 - R + Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)));
  return (x, y) => { const e = ust(x + 0.5) - ust(x - 0.5); return Math.min(x - x0, x1 - x, y - y0, (ust(x) - y) / Math.sqrt(1 + e * e)); };
};
const elipsS = (cx, cy, a, b) => (x, y) => (1 - Math.hypot((x - cx) / a, (y - cy) / b)) * Math.min(a, b);
const daralt = (f, q) => (x, y) => f(x, y) - q;      // şekli q kadar içeri çeker
const kenar = f => (x, y) => Math.abs(f(x, y));       // şeklin kenar çizgisine uzaklık
const dogru = (x0, y0, x1, y1) => { // doğru parçasına uzaklık
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
  return (x, y) => { const t = sinirla(((x - x0) * dx + (y - y0) * dy) / l2, 0, 1); return Math.hypot(x - x0 - dx * t, y - y0 - dy * t); };
};
const enAz = f => (x, y) => { let m = 1e9; for (let i = 0; i < f.length; i++) { const q = f[i](x, y); if (q < m) m = q; } return m; };
const kirik = n => enAz(n.slice(1).map((p, i) => dogru(n[i][0], n[i][1], p[0], p[1]))); // kırık çizgiye uzaklık
const kesis = (f, g) => (x, y) => Math.min(f(x, y), g(x, y));

// ---- Yükseklik alanı ----------------------------------------------------------------
class Alan {
  constructor(pw, ph, yatayCevir, duseyCevir) {
    this.pw = pw; this.ph = ph; this.cx = yatayCevir; this.cy = duseyCevir;
    this.s = sinirla(760 / Math.max(pw, ph), 0.3, 0.75); // piksel / mm
    this.W = Math.max(8, Math.round(pw * this.s)); this.H = Math.max(8, Math.round(ph * this.s));
    this.h = new Float32Array(this.W * this.H); this.t = new Float32Array(this.W * this.H).fill(1);
  }
  // f(x, y, i): [x0, x1] × [y0, y1] (mm) içindeki her piksel için; x, y pikselin ortası, i dizideki yeri
  her(f, x0 = 0, y0 = 0, x1 = this.pw, y1 = this.ph) {
    const { s, W, H, pw, ph } = this;
    if (this.cx) [x0, x1] = [pw - x1, pw - x0];
    if (this.cy) [y0, y1] = [ph - y1, ph - y0];
    const ia = Math.max(0, Math.floor(x0 * s)), ib = Math.min(W - 1, Math.ceil(x1 * s)), ja = Math.max(0, Math.floor(y0 * s)), jb = Math.min(H - 1, Math.ceil(y1 * s));
    for (let j = ja; j <= jb; j++) { const y = (j + 0.5) / s, yy = this.cy ? ph - y : y; for (let i = ia; i <= ib; i++) { const x = (i + 0.5) / s; f(this.cx ? pw - x : x, yy, j * W + i); } }
  }
  // Şeklin içi d kadar oyulur; kenardan b genişliğinde eğimle iner (d eksi verilirse pano dışarı kabarır)
  ic(sekil, d, b, ...kutu) { this.her((x, y, i) => { const q = sekil(x, y); if (q > 0) this.h[i] -= d * yum(Math.min(1, q / b)); }, ...kutu); }
  // Çizgi boyunca oluk: w genişlik, d derinlik (V kesit; yuvarlak: yarım daire kesit)
  oluk(uzaklik, w, d, yuvarlak = false, ...kutu) { const r = w / 2; this.her((x, y, i) => { const q = uzaklik(x, y); if (q < r) this.h[i] -= d * (yuvarlak ? Math.sqrt(1 - (q / r) * (q / r)) : 1 - q / r); }, ...kutu); }
  // Çizgi boyunca kabarık kordon (pervaz, çıta)
  bant(uzaklik, w, yuk, ...kutu) { const r = w / 2; this.her((x, y, i) => { const q = uzaklik(x, y); if (q < r) this.h[i] += yuk * Math.cos(Math.PI / 2 * q / r); }, ...kutu); }
  // Delik ya da derin oyuk: içi koyu görünür
  delik(sekil, ton = 0.22, ...kutu) { this.her((x, y, i) => { const q = sekil(x, y); if (q > 0) { this.h[i] = Math.min(this.h[i], -9 * Math.min(1, q / 1.6)); this.t[i] = Math.min(this.t[i], ton + (1 - ton) * (1 - Math.min(1, q / 1.3))); } }, ...kutu); }
  // Deliğin üstünden geçen çıta: yüzey yeniden kapak düzlemine çıkar
  cita(uzaklik, w, ...kutu) { const r = w / 2; this.her((x, y, i) => { const q = uzaklik(x, y); if (q < r) { const k = Math.min(1, (r - q) / 1.3); this.h[i] *= 1 - k; this.t[i] += (1 - this.t[i]) * k; } }, ...kutu); }
  // Yinelenen yiv / çıta dizisi: sekil içinde, [a0, a1] aralığına tam sayıda sığacak biçimde. yon 'dikey' (çizgiler düşey) ya da 'yatay'.
  // profil: 'yuvarlak' (yan yana yuvarlak çıtalar), 'oluk' (yan yana içbükey oluklar), 'v' (aralıklı ince V derz), 'kademe' (düz şerit ve oluk)
  yiv(sekil, a0, a1, adim, d, yon = 'dikey', profil = 'yuvarlak') {
    const n = Math.max(1, Math.round((a1 - a0) / adim)), p = (a1 - a0) / n;
    this.her((x, y, i) => {
      const m = sekil(x, y); if (m <= 0) return;
      const f = (((yon === 'dikey' ? x : y) - a0) / p) % 1, q = 2 * (f < 0 ? f + 1 : f) - 1, sol = Math.min(1, m / 3);
      let v;
      if (profil === 'v') { const u = (1 - Math.abs(q)) * p / 2; v = u < 2.6 ? -d * (1 - u / 2.6) : 0; }
      else if (profil === 'oluk') v = -d * Math.sqrt(1 - q * q);
      else if (profil === 'kademe') v = Math.abs(q) > 0.56 ? -d * yum(Math.min(1, (Math.abs(q) - 0.56) / 0.12)) : 0;
      else v = -d * (1 - Math.sqrt(1 - q * q));
      this.h[i] += v * sol;
    });
  }
  // Panjur: yatay eğik kanatlar; aralar koyu
  panjur(sekil, y0, y1, adim) {
    const n = Math.max(2, Math.round((y1 - y0) / adim)), p = (y1 - y0) / n;
    this.her((x, y, i) => {
      const m = sekil(x, y); if (m <= 0) return;
      const f = (((y - y0) / p) % 1 + 1) % 1, sol = Math.min(1, m / 2);
      this.h[i] += (f > 0.86 ? -10 : -1.5 - 7 * f / 0.86) * sol;
      if (f > 0.86) this.t[i] = Math.min(this.t[i], 1 - 0.68 * sol);
    });
  }
  // Delikli sac: sık nokta dizisi
  nokta(sekil, adim, r) {
    this.her((x, y, i) => {
      if (sekil(x, y) <= r) return;
      const sat = Math.round(y / adim), q = Math.hypot(x - (Math.round(x / adim - (sat & 1) * 0.5) + (sat & 1) * 0.5) * adim, y - sat * adim);
      if (q < r) { const k = Math.min(1, (r - q) / 1.1); this.h[i] -= 2.5 * k; this.t[i] = Math.min(this.t[i], 1 - 0.55 * k); }
    });
  }
}

// ---- Model tarifleri ---------------------------------------------------------------
// f(A, w, h): A alan, w × h kapağın ölçüsü. yon: kulp kanalı gibi tek kenara bağlı ayrıntı var; üst dolapta alt kenara, menteşe
// sağdaysa sol kenara çevrilir (tarif "kulp üstte ve sağda" varsayımıyla yazılır).
// Çerçeve genişliği küçük kapakta (çekmece önü, dar kapak) kısa kenarın dörtte birini geçmez; kemer yalnızca dik duran kapakta yapılır
const cg = (w, h, f) => Math.min(f, w * 0.26, h * 0.26);
const pano = (w, h, f0, kemer = '', ah = 0) => { const f = cg(w, h, f0); return kemer && h > w * 0.9 && h > 320 ? kemerS(f, f, w - f, h - f, Math.min(ah || 70, (w - 2 * f) * 0.24, (h - 2 * f) * 0.3), kemer) : dikS(f, f, w - f, h - f); };
// Lambri: pano içinde düşey V derzler
const lambri = (A, P, w, h, f0, adim) => { const f = cg(w, h, f0); A.yiv(daralt(P, 4), f + 10, w - f - 10, adim, 2.6, 'dikey', 'v'); };
// Yan yana n bölme: her birinde iki köşegen
const capraz = (w, h, f, n, pay = 0) => { const L = [], ih = (h - 2 * f) / n; for (let k = 0; k < n; k++) { const a = f + k * ih + pay, b = f + (k + 1) * ih - pay; L.push(dogru(f + pay, a, w - f - pay, b), dogru(w - f - pay, a, f + pay, b)); if (k) L.push(dogru(f, a - pay, w - f, a - pay)); } return enAz(L); };
const TARIF = {
  // 1000: düz ve kendinden kulplu
  lk1002: [(A, w, h) => { A.ic(dikS(-60, h - 17, w + 60, h + 60), 7, 11, 0, h - 20, w, h); A.her((x, y, i) => { if (y > h - 9) A.t[i] = Math.min(A.t[i], 0.5); }, 0, h - 10, w, h); }, 1],
  lk1003: [(A, w, h) => { const y0 = h - Math.min(h * 0.42, 300); A.delik(yuvS(w - 15, y0, w + 20, h - 22, 7), 0.42, w - 18, y0, w, h); }, 1],
  lk1004: [(A, w, h) => { const a = Math.min(64, w * 0.28); A.delik(yuvS(w / 2 - a, h - 46, w / 2 + a, h - 27, 9.4), 0.2, w / 2 - a - 2, h - 48, w / 2 + a + 2, h - 25); }, 1],
  lk1005: [(A, w, h) => { A.ic(dikS(-60, h - 24, w + 60, h + 60), 9, 24, 0, h - 26, w, h); }, 1],
  lk1006: [(A, w, h) => { A.ic(dikS(w - 24, -60, w + 60, h + 60), 9, 24, w - 26, 0, w, h); }, 1],
  lk1007: [(A, w, h) => { A.oluk(dogru(w * 0.12, h - 24, w, h - 24), 7, 5, true, 0, h - 30, w, h - 18); A.her((x, y, i) => { if (Math.abs(y - (h - 24)) < 2.2 && x > w * 0.12) A.t[i] = Math.min(A.t[i], 0.5); }, 0, h - 28, w, h - 20); }, 1],
  lk1008: [(A, w, h) => { const f = Math.min(70, w * 0.22); A.oluk(enAz([dogru(f, 0, f, h), dogru(w - f, 0, w - f, h), dogru(f, f, w - f, f), dogru(f, h - f, w - f, h - f)]), 4.5, 2.6); }],
  lk1009: [(A, w, h) => { const n = Math.max(2, Math.round(h / 120)); A.oluk(enAz(Array.from({ length: n - 1 }, (_, k) => dogru(-9, h * (k + 1) / n, w + 9, h * (k + 1) / n))), 5, 3); }],
  // 2000: country (çerçeve ve pano)
  lk2001: [(A, w, h) => { const P = pano(w, h, 62); A.ic(P, 5, 12); A.oluk(kenar(daralt(P, 18)), 3, 1.2); }],
  lk2002: [(A, w, h) => { const P = pano(w, h, 58); A.ic(P, 3, 7); A.ic(daralt(P, 16), 3, 7); }],
  lk2003: [(A, w, h) => { const P = pano(w, h, 62); A.ic(P, 8, 12); A.ic(daralt(P, 24), -7, 26); }],
  lk2004: [(A, w, h) => { const P = pano(w, h, 62, 'yay'); A.ic(P, 8, 12); A.ic(daralt(P, 24), -7, 26); }],
  lk2005: [(A, w, h) => { const P = pano(w, h, 60); A.oluk(kenar(dikS(11, 11, w - 11, h - 11)), 5, 2); A.ic(P, 6, 16); A.oluk(kenar(daralt(P, 23)), 3, 1.4); }],
  lk2006: [(A, w, h) => { const P = pano(w, h, 64); A.ic(P, 7, 10); A.ic(daralt(P, 26), -6, 22); }],
  lk2007: [(A, w, h) => { const P = pano(w, h, 64); A.ic(P, 6, 10); lambri(A, daralt(P, 10), w, h, 64, 44); }],
  lk2008: [(A, w, h) => { const P = pano(w, h, 64, 'yay'); A.ic(P, 6, 10); lambri(A, daralt(P, 10), w, h, 64, 44); }],
  lk2009: [(A, w, h) => { A.ic(dikS(30, 30, w - 30, h - 30), 2.6, 5); }],
  lk2010: [(A, w, h) => { const P = pano(w, h, 66); A.ic(P, 4, 8); A.ic(daralt(P, 18), 4, 8); }],
  lk2011: [(A, w, h) => { A.ic(pano(w, h, 72), 7, 18); }],
  lk2012: [(A, w, h) => { const P = pano(w, h, 62, 'kas', 36); A.ic(P, 6, 12); A.ic(daralt(P, 22), -5, 20); }],
  lk2013: [(A, w, h) => { const P = pano(w, h, 62); A.ic(P, 5, 10); A.oluk(kenar(daralt(P, 16)), 4, 2); }],
  lk2014: [(A, w, h) => { const P = pano(w, h, 54); A.ic(P, 5, 8); A.ic(daralt(P, 18), -4, 14); }],
  lk2015: [(A, w, h) => { const P = pano(w, h, 60); A.ic(P, 6, 10); lambri(A, daralt(P, 10), w, h, 60, 36); }],
  lk2016: [(A, w, h) => { const P = pano(w, h, 60, 'yay'); A.ic(P, 6, 10); lambri(A, daralt(P, 10), w, h, 60, 36); }],
  // 3000: çıtalı (pervazlı)
  lk3001: [(A, w, h) => { const P = pano(w, h, 70); A.ic(P, 6, 4); A.bant(kenar(daralt(P, 9)), 16, 4); }],
  lk3002: [(A, w, h) => { A.ic(pano(w, h, 70), 6, 2.5); }],
  lk3003: [(A, w, h) => { const P = pano(w, h, 52); A.ic(P, 6, 3); A.bant(kenar(daralt(P, 12)), 20, 6); A.ic(daralt(P, 30), 2, 6); }],
  lk3004: [(A, w, h) => { const P = pano(w, h, 58); A.ic(P, 6, 3); A.bant(kenar(daralt(P, 13)), 22, 6); A.bant(kenar(daralt(P, 38)), 10, 3); }],
  lk3005: [(A, w, h) => { const P = pano(w, h, 60); A.ic(P, 5, 3); A.bant(kenar(daralt(P, 6)), 9, 3); }],
  // 4000: boy kapak
  lk4001: [(A, w, h) => { A.yiv(dikS(-9, -9, w + 9, h + 9), 0, w, 14, 4); A.delik(dikS(w * 0.5, h - 20, w * 0.88, h + 20), 0.25, w * 0.5 - 2, h - 22, w * 0.88 + 2, h); }, 1],
  lk4002: [(A, w, h) => { A.yiv(dikS(-9, -9, w + 9, h + 9), 0, w, 18, 5); }],
  lk4003: [(A, w, h) => { A.yiv(dikS(-9, -9, w + 9, h + 9), 0, w, 9, 3); }],
  lk4004: [(A, w, h) => { A.yiv(dikS(-9, -9, w + 9, h + 9), 0, w, 32, 6, 'dikey', 'oluk'); }],
  lk4005: [(A, w, h) => { A.yiv(dikS(-9, -9, w + 9, h + 9), 0, w, 26, 5, 'dikey', 'kademe'); }],
  lk4006: [(A, w, h) => { const P = pano(w, h, 55), f = cg(w, h, 55); A.ic(P, 4, 3); A.panjur(daralt(P, 5), f + 5, h - f - 5, 22); }],
  lk4007: [(A, w, h) => { const P = pano(w, h, 60); A.ic(P, 5, 8); A.bant(kenar(daralt(P, 11)), 12, 3); A.panjur(daralt(P, 20), cg(w, h, 60) + 20, h - cg(w, h, 60) - 20, 16); }],
  lk4008: [(A, w, h) => { A.ic(dikS(16, 16, w - 16, h - 16), 4, 14); }],
  lk4009: [(A, w, h) => { A.ic(dikS(12, 12, w - 12, h - 12), 4, 8); }],
  lk4010: [(A, w, h) => { const P = pano(w, h, 50); A.ic(P, 4, 3); A.nokta(daralt(P, 5), 8, 2.6); }],
  lk4011: [(A, w, h) => { const P = pano(w, h, 60), a = 40, yakin = v => { const q = ((v % a) + a) % a; return Math.min(q, a - q); }; A.delik(P, 0.2);
    A.cita(kesis0((x, y) => Math.min(yakin(x - y), yakin(x + y)) * Math.SQRT1_2, P), 9); }], // baklava kafes: iki yöndeki çapraz çıtalar
  // 5000: elit
  lk5001: [(A, w, h) => { const S = yuvS(34, 34, w - 34, h - 34, Math.min((w - 68) * 0.42, (h - 68) * 0.3)); A.yiv(daralt(S, 6), 34, w - 34, 13, 3.5); A.oluk(kenar(S), 5, 3); }],
  lk5002: [(A, w, h) => { const y0 = h * 0.44, y1 = h * 0.56; A.yiv(dikS(-9, y0, w + 9, y1), 0, w, 12, 3.5); A.oluk(enAz([dogru(-9, y0, w + 9, y0), dogru(-9, y1, w + 9, y1)]), 4, 2); }],
  lk5003: [(A, w, h) => { const cx = w / 2, cy = h * 0.4, R = Math.min(w * 0.34, h * 0.2); A.oluk(dogru(cx, -9, cx, h + 9), 5, 3); A.oluk((x, y) => y < cy ? 1e9 : Math.abs(Math.hypot(x - cx, y - cy) - R), 5, 3); }],
  lk5004: [(A, w, h) => { A.oluk(kirik([[w * 0.4, h + 9], [w * 0.4, h * 0.58], [w * 0.62, h * 0.42], [w * 0.62, -9]]), 5, 3); }, 1],
  lk5005: [(A, w, h) => { const cx = w / 2, R = Math.min(w * 0.4, h * 0.2);
    for (const [cy, yan] of [[h * 0.62, -1], [h * 0.38, 1]]) { const D = (x, y) => (x - cx) * yan < 0 ? -1 : R - Math.hypot(x - cx, y - cy); A.yiv(daralt(D, 4), cx - R, cx + R, 11, 3); A.oluk(kenar(D), 4.5, 2.6); }
    A.oluk(dogru(cx, -9, cx, h + 9), 5, 3); }],
  lk5006: [(A, w, h) => { A.yiv(dikS(-9, -9, w + 9, h + 9), 0, w, 28, 5, 'dikey', 'oluk'); }],
  lk5007: [(A, w, h) => { A.yiv(dikS(-9, -9, w + 9, h * 0.33), 0, w, 12, 3.5); A.oluk(dogru(-9, h * 0.33, w + 9, h * 0.33), 4, 2); }],
  lk5008: [(A, w, h) => { const y0 = h * 0.47, y1 = h * 0.56; A.yiv(dikS(-9, y0, w + 9, y1), 0, w, 12, 3.5); A.oluk(enAz([dogru(-9, y0, w + 9, y0), dogru(-9, y1, w + 9, y1)]), 4, 2); }],
  lk5009: [(A, w, h) => { const f = cg(w, h, 55), P = pano(w, h, 55), n = Math.max(1, Math.round((h - 2 * f) / Math.max(120, (w - 2 * f) * 1.15))); A.ic(P, 5, 6); A.bant(kesis0(capraz(w, h, f, n, 4), P), 14, 5); }],
  lk5011: [(A, w, h) => { const f = cg(w, h, 58), ara = 46, n = Math.max(2, Math.round(h / 430)), ih = (h - 2 * f - (n - 1) * ara) / n; for (let k = 0; k < n; k++) A.ic(dikS(f, f + k * (ih + ara), w - f, f + k * (ih + ara) + ih), 5, 6); }],
  lk5012: [(A, w, h) => { const f = cg(w, h, 58), ih = (h - 2 * f), ort = Math.min(ih * 0.26, (w - 2 * f) * 0.6), py = (ih - ort) / 2 - 24, E = elipsS(w / 2, h / 2, (w - 2 * f) / 2 - 6, ort / 2 - 4);
    A.ic(dikS(f, f, w - f, f + py), 5, 6); A.ic(dikS(f, h - f - py, w - f, h - f), 5, 6); A.bant(kenar(E), 12, 4); A.ic(daralt(E, 12), 3, 6); }],
  lk5013: [(A, w, h) => { const f = cg(w, h, 55), P = pano(w, h, 55), cx = w / 2, G = (w - 2 * f) / 2 - 5, L = G * 2.3, n = Math.max(1, Math.round((h - 2 * f) / L)), l = (h - 2 * f) / n; A.delik(P, 0.2);
    const dalga = yan => (x, y) => { const a = 2 * Math.PI * (y - f) / l, s = Math.sin(a) * yan; return Math.abs(x - cx - G * s) / Math.sqrt(1 + (G * 2 * Math.PI / l * Math.cos(a)) ** 2); };
    A.cita(kesis0(enAz([dalga(1), dalga(-1)]), P), 10); }],
  lk5014: [(A, w, h) => { const f = cg(w, h, 55), P = pano(w, h, 55), cx = w / 2, G = (w - 2 * f) / 2 - 5, L = G * 2.6, n = Math.max(1, Math.round((h - 2 * f) / L)), l = (h - 2 * f) / n; A.delik(P, 0.2);
    const dalga = (yan, faz) => (x, y) => { const a = 2 * Math.PI * (y - f) / l + faz, s = Math.sin(a) * yan; return Math.abs(x - cx - G * s) / Math.sqrt(1 + (G * 2 * Math.PI / l * Math.cos(a)) ** 2); };
    A.cita(kesis0(enAz([dalga(1, 0), dalga(-1, 0), dalga(1, Math.PI / 2), dalga(-1, Math.PI / 2)]), P), 8); }],
  lk5015: [(A, w, h) => { const f = cg(w, h, 55), P = pano(w, h, 55), n = Math.max(2, Math.round((h - 2 * f) / Math.max(100, (w - 2 * f) * 0.62))); A.delik(P, 0.2); A.cita(kesis0(capraz(w, h, f, n), P), 10); }],
  lk5016: [(A, w, h) => { const f = cg(w, h, 55), P = pano(w, h, 55), n = Math.max(1, Math.round((h - 2 * f) / Math.max(120, (w - 2 * f) * 0.9))); A.delik(P, 0.2); A.cita(kesis0(capraz(w, h, f, n), P), 10); }],
  lk5017: [(A, w, h) => { const f = cg(w, h, 55), P = pano(w, h, 55), n = Math.max(1, Math.round((h - 2 * f) / Math.max(160, (w - 2 * f) * 1.5))); A.delik(P, 0.2); A.cita(kesis0(capraz(w, h, f, n), P), 11); }],
  lk5018: [(A, w, h) => { const f = cg(w, h, 55), P = pano(w, h, 55), cx = w / 2, a = (w - 2 * f) * 0.24, adim = Math.max(a * 3.4, 150), n = Math.max(1, Math.round((h - 2 * f) / adim)), l = (h - 2 * f) / n, L = [dogru(cx, f, cx, h - f)]; A.delik(P, 0.2);
    for (let k = 0; k < n; k++) { const cy = f + (k + 0.5) * l; L.push(kenar(dikS(cx - a, cy - a, cx + a, cy + a)), dogru(f, cy, cx - a, cy), dogru(cx + a, cy, w - f, cy)); }
    A.cita(kesis0(enAz(L), P), 9);
    for (let k = 0; k < n; k++) { const cy = f + (k + 0.5) * l; A.delik(dikS(cx - a + 4.5, cy - a + 4.5, cx + a - 4.5, cy + a - 4.5), 0.2); } }],
};
// Çıta çizgisi yalnızca şeklin içinde geçerli (dışarıda uzaklık çok büyük sayılır): kafes çıtaları çerçeveye taşmaz
function kesis0(uzaklik, sekil) { return (x, y) => sekil(x, y) < -1 ? 1e9 : uzaklik(x, y); }

export const kabartmaVar = kod => !!TARIF[kod];

// Kapağın kabartma haritaları. pw, ph: ön yüzün ölçüsü (mm). alt: kulp kanalı alt kenarda (üst dolap); ayna: kulp kenarı solda.
// Dönen: { W, H, nrm (RGBA, 3B çizimin yüzey yönü haritası; satır 0 kapağın altı), egim (Int8, piksel başına iki eğim: sağa ve
// yukarı; değer × 1 / 90), ton (Uint8: 255 açık, küçüldükçe koyu), yuk (Float32 mm) }. Model kabartmasızsa null.
const onbellek = new Map();
export function kabartmaHaritasi(kod, pw, ph, { alt = false, ayna = false } = {}) {
  const t = TARIF[kod];
  if (!t || !(pw > 30 && ph > 30)) return null;
  const yon = !!t[1], cy = yon && alt, cx = yon && ayna, anahtar = kod + '|' + Math.round(pw) + '|' + Math.round(ph) + '|' + (cy ? 1 : 0) + (cx ? 1 : 0);
  let s = onbellek.get(anahtar);
  if (s) return s;
  const A = new Alan(pw, ph, cx, cy), { W, H, h, t: tn } = A;
  t[0](A, pw, ph);
  // Oyuk gölgesi: çevresinden alçakta kalan yer koyulaşır (derz ve pano kenarları önden bakışta da okunur)
  const r = Math.max(1, Math.round(5 * A.s)), bul = new Float32Array(W * H), gec = new Float32Array(W * H);
  for (let j = 0; j < H; j++) { let top = 0; for (let i = -r; i < W; i++) { if (i + r < W) top += h[j * W + i + r]; if (i - r - 1 >= 0) top -= h[j * W + i - r - 1]; if (i >= 0) gec[j * W + i] = top / (Math.min(W - 1, i + r) - Math.max(0, i - r) + 1); } }
  for (let i = 0; i < W; i++) { let top = 0; for (let j = -r; j < H; j++) { if (j + r < H) top += gec[(j + r) * W + i]; if (j - r - 1 >= 0) top -= gec[(j - r - 1) * W + i]; if (j >= 0) bul[j * W + i] = top / (Math.min(H - 1, j + r) - Math.max(0, j - r) + 1); } }
  const nrm = new Uint8Array(W * H * 4), egim = new Int8Array(W * H * 2), ton = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, gx = (h[j * W + Math.min(W - 1, i + 1)] - h[j * W + Math.max(0, i - 1)]) * A.s / 2, gy = (h[Math.min(H - 1, j + 1) * W + i] - h[Math.max(0, j - 1) * W + i]) * A.s / 2;
    const l = Math.hypot(gx, gy, 1);
    nrm[k * 4] = Math.round((-gx / l * 0.5 + 0.5) * 255); nrm[k * 4 + 1] = Math.round((-gy / l * 0.5 + 0.5) * 255); nrm[k * 4 + 2] = Math.round((1 / l * 0.5 + 0.5) * 255); nrm[k * 4 + 3] = 255;
    egim[k * 2] = sinirla(Math.round(-gx * 90), -127, 127); egim[k * 2 + 1] = sinirla(Math.round(-gy * 90), -127, 127);
    ton[k] = Math.round(255 * tn[k] * (1 - 0.3 * sinirla((bul[k] - h[k]) / 3.2, 0, 1)));
  }
  s = { W, H, nrm, egim, ton, yuk: h, anahtar };
  if (onbellek.size > 160) onbellek.clear();
  onbellek.set(anahtar, s);
  return s;
}
