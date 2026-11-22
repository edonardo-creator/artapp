// Fotoğrafik görüntü: sahneyi işçilere (Web Worker) kare kare izletir, sonucu biriktirir, sonda parlamaları süzer,
// gürültüyü giderir ve son işlemden (pozlama, ton eşleme, keskinleştirme) geçirir. Motor fotomotor.js içindedir.
// Yönetim eB Creator'daki düzenle aynıdır: 40 piksellik kareler, her geçişte piksel başına iki örnek, işçi sayısı çekirdek − 1.
import { makeTracer, rtDenoise, rtFF, rtPost } from './fotomotor.js';

// [ad, genişlik (piksel), piksel başına örnek]; yükseklik ekrandaki bakışın oranından gelir
export const FOTO_KALITE = [['Hızlı', 960, 16], ['Normal', 1200, 48], ['Yüksek', 1800, 128], ['En yüksek', 2400, 192]];

// İşçinin kaynak kodu: motorun kendisi ve üç ileti (kur, yüzey bilgisi, kare)
export const ISCI = `const makeTracer=${makeTracer.toString()};let T=null;onmessage=e=>{const m=e.data;if(m.t=='init'){T=makeTracer(m.sc);postMessage({t:'ready'})}else if(m.t=='g'){const b=T.gbuf(m.x,m.y,m.w,m.h);postMessage({t:'g',k:m.k,b},[b.buffer])}else{const b=T.tile(m.x,m.y,m.w,m.h,m.spp,m.sd);postMessage({t:'tile',k:m.k,b},[b.buffer])}}`;

// sc: sahne (sahne.fotoSahne çıktısı). ornek: piksel başına hedef örnek. tuval: sonucun çizileceği <canvas>.
// durum(metin, oran 0–1): ilerleme. bitti({ W, H, ornek, sure, tamam }): iş bitince ya da durdurulunca.
// Dönen: { durdur(sonucuGoster = true) }
export function fotoBaslat(sc, { ornek = 48, tuval, durum, bitti, isci = true } = {}) {
  const W = sc.cam.W, H = sc.cam.H;
  tuval.width = W; tuval.height = H;
  const ctx = tuval.getContext('2d'), id = ctx.createImageData(W, H);
  for (let k = 3; k < id.data.length; k += 4) id.data[k] = 255;
  ctx.putImageData(id, 0, 0);

  const N = W * H, acc = new Float32Array(N * 3), l2 = new Float32Array(N), cn = new Float32Array(N), G = new Float32Array(N * 7), KARE = 40, kareler = [];
  for (let y = 0; y < H; y += KARE) for (let x = 0; x < W; x += KARE) kareler.push([x, y, Math.min(KARE, W - x), Math.min(KARE, H - y)]);
  const PER = 2, gecis = Math.max(1, Math.ceil(ornek / PER)), isler = [];
  kareler.forEach((t, k) => isler.push(['g', k, 0]));                                  // önce yüzey bilgisi (gürültü giderme için)
  for (let p = 0; p < gecis; p++) kareler.forEach((t, k) => isler.push(['t', k, p]));  // sonra geçiş geçiş örnekler
  const R = { dur: false, isciler: [], t0: performance.now(), biten: 0, toplam: isler.length, g: 0, kare: 0, poz: 0, bitti: false, yedek: false };

  // ekranda ilerlerken gösterilen hızlı ton eşleme (bitince asıl son işlem uygulanır)
  const ton = v => { v *= (R.poz || 1); const a = (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14); return Math.pow(Math.min(1, Math.max(0, a)), 1 / 2.2) * 255; };
  const yuzeyKoy = (k, b) => {
    const [x, y, w, h] = kareler[k];
    for (let j = 0; j < h; j++) G.set(b.subarray(j * w * 7, (j + 1) * w * 7), ((y + j) * W + x) * 7);
    R.biten++; R.g++;
  };
  const kareKoy = (k, buf) => {
    const [x, y, w, h] = kareler[k];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const p = (y + j) * W + x + i, o = p * 3, s = (j * w + i) * 4;
      acc[o] += buf[s]; acc[o + 1] += buf[s + 1]; acc[o + 2] += buf[s + 2]; l2[p] += buf[s + 3]; cn[p] += PER;
      const d = p * 4, n = cn[p];
      id.data[d] = ton(acc[o] / n); id.data[d + 1] = ton(acc[o + 1] / n); id.data[d + 2] = ton(acc[o + 2] / n);
    }
    ctx.putImageData(id, 0, 0, x, y, w, h);
    R.biten++; R.kare++;
    if (R.kare === kareler.length && !R.poz) { // ilk geçiş bitti: ortalama parlaklıktan pozlama
      let ls = 0, c = 0;
      for (let p = 0; p < N; p += 7) { if (!cn[p]) continue; const n = cn[p], L = (0.2126 * acc[p * 3] + 0.7152 * acc[p * 3 + 1] + 0.0722 * acc[p * 3 + 2]) / n; ls += Math.log(L + 1e-3); c++; }
      if (c) R.poz = Math.min(4, Math.max(0.35, (sc.night ? 0.1 : 0.16) / Math.exp(ls / c)));
    }
    const oran = R.biten / R.toplam, gecen = (performance.now() - R.t0) / 1000, kalan = oran > 0.03 ? gecen / oran - gecen : 0;
    durum?.(`%${Math.round(oran * 100)} · yaklaşık ${kalan > 90 ? Math.round(kalan / 60) + ' dk' : Math.max(1, Math.round(kalan)) + ' sn'} kaldı`, oran);
    if (R.biten >= R.toplam) bitir();
  };
  const bitir = (goster = true) => {
    if (R.bitti) return;
    R.bitti = true; R.dur = true;
    R.isciler.forEach(w => { try { w.terminate(); } catch { /* zaten kapanmış */ } });
    if (!goster) return;
    durum?.('Görüntü temizleniyor…', 1);
    setTimeout(() => {
      const tamam = R.g >= kareler.length && R.kare >= kareler.length; // her piksel en az bir geçiş gördüyse temizlenebilir
      if (tamam) {
        rtFF(W, H, acc, cn, l2);
        const temiz = rtDenoise(W, H, acc, cn, l2, G);
        for (let p = 0; p < N; p++) if (!cn[p]) temiz[p * 3] = temiz[p * 3 + 1] = temiz[p * 3 + 2] = 0;
        id.data.set(rtPost(W, H, temiz, sc.night).o);
        ctx.putImageData(id, 0, 0);
      }
      bitti?.({ W, H, ornek: Math.round(cn.reduce((a, v) => a + v, 0) / N), sure: Math.round((performance.now() - R.t0) / 1000), tamam });
    }, 30);
  };

  let sira = 0;
  const sonraki = () => isler[sira++];
  const gonder = w => {
    if (R.dur) return;
    const j = sonraki();
    if (!j) return;
    const [tur, k, p] = j, t = kareler[k];
    w.postMessage(tur === 'g' ? { t: 'g', k, x: t[0], y: t[1], w: t[2], h: t[3] } : { t: 'tile', k, x: t[0], y: t[1], w: t[2], h: t[3], spp: PER, sd: k * 7919 + p * 104729 + 1 });
  };
  // İşçi kurulamazsa (çok eski tarayıcı) aynı iş ana iş parçacığında, ekranı kilitlemeden küçük adımlarla yapılır
  const anaDongu = () => {
    const T = makeTracer(sc);
    const adim = () => {
      if (R.dur) return;
      const t0 = performance.now();
      while (performance.now() - t0 < 40) {
        const j = sonraki();
        if (!j) return;
        const [tur, k, p] = j, t = kareler[k];
        if (tur === 'g') yuzeyKoy(k, T.gbuf(t[0], t[1], t[2], t[3])); else kareKoy(k, T.tile(t[0], t[1], t[2], t[3], PER, k * 7919 + p * 104729 + 1));
      }
      setTimeout(adim, 0);
    };
    adim();
  };
  const yedegeGec = () => {
    if (R.yedek || R.bitti) return;
    R.yedek = true;
    R.isciler.forEach(w => { try { w.terminate(); } catch { /* yok say */ } });
    R.isciler = []; sira = 0; R.biten = 0; R.g = 0; R.kare = 0; acc.fill(0); l2.fill(0); cn.fill(0);
    anaDongu();
  };
  durum?.('Başlıyor…', 0); // işten önce: küçük görüntü ilk adımda bitebilir, son ileti bu olmamalı
  try {
    if (!isci || typeof Worker === 'undefined') throw new Error('işçi yok');
    const adres = URL.createObjectURL(new Blob([ISCI], { type: 'text/javascript' }));
    const adet = Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 4) - 1));
    for (let i = 0; i < adet; i++) {
      const w = new Worker(adres);
      R.isciler.push(w);
      w.onmessage = e => {
        if (R.dur) return;
        const m = e.data;
        if (m.t === 'g') yuzeyKoy(m.k, m.b); else if (m.t === 'tile') kareKoy(m.k, m.b);
        gonder(w);
      };
      w.onerror = yedegeGec;
      w.postMessage({ t: 'init', sc: { ...sc, seed: i + 1 } });
    }
    setTimeout(() => URL.revokeObjectURL(adres), 10000);
  } catch { anaDongu(); }

  return { durdur: (goster = true) => bitir(goster), get bitti() { return R.bitti; } };
}
