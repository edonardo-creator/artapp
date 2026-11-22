// Canlı fotoğraf: çizim alanındaki bakış, sahne durduğunda arka planda ışın izlemeyle çizilir ve kademe kademe netleşir.
// Önce küçük bir görüntü (bir iki saniyede), sonra orta, sonra tam boy; her kademede örnek sayısı arttıkça görüntü yenilenir.
// İşçiler (Web Worker) bir kez kurulur ve sahne değiştikçe yeniden kullanılır; gürültü giderme ve son işlem ayrı bir işçide
// yapılır, böylece arayüz hiç takılmaz. Motor fotomotor.js içindedir (foto.js ile aynı motor, aynı işçi kaynağı).
import { rtDenoise, rtFF, rtPost } from './fotomotor.js';
import { ISCI } from './foto.js';

// Son işlem işçisi: parlama süzgeci → gürültü giderme → pozlama ve ton eşleme. Girdi dizileri kopyadır.
const SON = `const rtFF=${rtFF.toString()};const rtDenoise=${rtDenoise.toString()};const rtPost=${rtPost.toString()};onmessage=e=>{const m=e.data;rtFF(m.W,m.H,m.acc,m.cn,m.l2);const t=rtDenoise(m.W,m.H,m.acc,m.cn,m.l2,m.G);const o=rtPost(m.W,m.H,t,m.night).o;postMessage({n:m.n,W:m.W,H:m.H,o},[o.buffer])}`;

// Bir kademenin geçiş sayısı içinde görüntünün yenileneceği geçişler: 1, 2, 4, 8, … ve sonuncusu
export function yenilemeGecisleri(gecis) {
  const s = new Set([gecis]);
  for (let g = 1; g < gecis; g *= 2) s.add(g);
  return [...s].sort((a, b) => a - b);
}

// Sahne dökümünün parmak izi: aynı sahne ve aynı bakış yeniden çizilmesin diye (seçim değişince sahne yeniden kurulur ama döküm aynıdır)
export function sahneIzi(sc) {
  let h = 2166136261 >>> 0;
  const kat = dizi => { const u = new Uint32Array(dizi.buffer, dizi.byteOffset, dizi.byteLength >> 2); for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 16777619) >>> 0; } };
  kat(sc.boxes);
  kat(new Float32Array([...sc.cam.p, ...sc.cam.fw, ...sc.cam.rt, ...sc.cam.up, sc.cam.F / sc.cam.W, sc.cam.H / sc.cam.W, ...sc.sun, sc.led, sc.night ? 1 : 0, sc.inside ? 1 : 0, ...sc.pl, sc.texS || 0, sc.texG ? 1 : 0]));
  if (sc.shp) for (let i = 0; i < sc.shp.length; i++) if (sc.shp[i]) { h ^= sc.shp[i] + i * 7; h = Math.imul(h, 16777619) >>> 0; } // dekor cisimlerinin biçimi
  if (sc.tex) { const d = sc.tex.d; h ^= d.length; for (let i = 0; i < d.length; i += 29) { h ^= d[i]; h = Math.imul(h, 16777619) >>> 0; } } // tezgah plakası değişti mi
  return h;
}

// tuval: görüntünün çizileceği <canvas>. goster(bilgi): tuvale yeni görüntü konunca çağrılır
// (bilgi: { W, H, ornek, oran 0–1, bitti }). isciSayisi: verilmezse çekirdek sayısı − 1 (en çok 12).
// Dönen denetçi: cek(kademeler), durakla(), surdur(), birak(), kapat(), durum()
//   kademeler: [{ sc, ornek }, …] küçükten büyüğe; sc sahne.fotoSahne çıktısıdır (aynı bakış, artan genişlik)
export function fotoCanli({ tuval, goster, isciSayisi } = {}) {
  const ctx = tuval.getContext('2d');
  const KARE = 40, PER = 2;
  let isciler = [], son = null, sonMesgul = false, sonBekleyen = null, kurulamadi = false;
  let sayac = 0;          // her kademe başlangıcında artar; eski kademeden gelen yanıtlar bununla ayıklanır
  let is = null;          // süren iş: { kademeler, i, ... }
  let durakli = false;

  const kur = () => {
    if (isciler.length || kurulamadi) return;
    try {
      const adres = URL.createObjectURL(new Blob([ISCI], { type: 'text/javascript' })), sonAdres = URL.createObjectURL(new Blob([SON], { type: 'text/javascript' }));
      const adet = Math.max(1, Math.min(12, isciSayisi || (navigator.hardwareConcurrency || 4) - 1));
      for (let n = 0; n < adet; n++) {
        const w = new Worker(adres);
        const kayit = { w, no: n, hazir: false, bekleyenHazir: 0, mesgul: false };
        w.onmessage = e => yanit(kayit, e.data);
        w.onerror = () => { kayit.bozuk = true; };
        isciler.push(kayit);
      }
      son = new Worker(sonAdres);
      son.onmessage = e => sonYanit(e.data);
      const z = setTimeout(() => { URL.revokeObjectURL(adres); URL.revokeObjectURL(sonAdres); }, 10000);
      z?.unref?.(); // Node'daki sınamalar bu zamanlayıcıyı beklemesin (tarayıcıda etkisi yok)
    } catch { kurulamadi = true; isciler = []; }
  };

  // Kademe başlat: bütün işçilere yeni sahne gönderilir, iş kuyruğu kurulur
  const kademeBaslat = () => {
    const k = is.kademeler[is.i], sc = k.sc, W = sc.cam.W, H = sc.cam.H, N = W * H;
    const kareler = [];
    for (let y = 0; y < H; y += KARE) for (let x = 0; x < W; x += KARE) kareler.push([x, y, Math.min(KARE, W - x), Math.min(KARE, H - y)]);
    const gecis = Math.max(1, Math.ceil(k.ornek / PER));
    Object.assign(is, { no: ++sayac, sc, W, H, N, kareler, gecis, sira: 0, toplam: kareler.length * (gecis + 1), biten: 0, yenile: yenilemeGecisleri(gecis), gBiten: 0, gecisBiten: new Uint32Array(gecis), ertelenen: 0,
      acc: new Float32Array(N * 3), l2: new Float32Array(N), cn: new Float32Array(N), G: new Float32Array(N * 7) });
    for (const q of isciler) { q.hazir = false; q.bekleyenHazir++; q.w.postMessage({ t: 'init', sc: { ...sc, seed: q.no + 1 + is.i * 31 } }); }
  };

  // Bir işçiye sıradaki işi ver (önce yüzey bilgisi, sonra geçiş geçiş örnekler)
  const ver = q => {
    if (!is || durakli || q.mesgul || !q.hazir || q.bozuk || is.sira >= is.toplam) return;
    const j = is.sira++, K = is.kareler.length, k = j % K, p = Math.floor(j / K) - 1, t = is.kareler[k], kimlik = is.no * 100000 + k;
    q.mesgul = true; q.gecis = p;
    q.w.postMessage(p < 0 ? { t: 'g', k: kimlik, x: t[0], y: t[1], w: t[2], h: t[3] } : { t: 'tile', k: kimlik, x: t[0], y: t[1], w: t[2], h: t[3], spp: PER, sd: k * 7919 + p * 104729 + 1 + is.i * 15485863 });
  };

  const yanit = (q, m) => {
    if (m.t === 'ready') { q.bekleyenHazir--; if (q.bekleyenHazir === 0) { q.hazir = true; ver(q); } return; }
    q.mesgul = false;
    if (is && Math.floor(m.k / 100000) === is.no) {
      const [x, y, w, h] = is.kareler[m.k % 100000], { W, acc, l2, cn, G } = is, b = m.b;
      if (m.t === 'g') for (let j = 0; j < h; j++) G.set(b.subarray(j * w * 7, (j + 1) * w * 7), ((y + j) * W + x) * 7);
      else for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const p = (y + j) * W + x + i, o = p * 3, s = (j * w + i) * 4;
        acc[o] += b[s]; acc[o + 1] += b[s + 1]; acc[o + 2] += b[s + 2]; l2[p] += b[s + 3]; cn[p] += PER;
      }
      is.biten++;
      // Görüntü, bir geçişin bütün kareleri bittiğinde yenilenir (her pikselde örnek olsun); yüzey bilgisi eksikse o bitene dek bekletilir
      const K = is.kareler.length;
      if (m.t === 'g') is.gBiten++;
      else if (++is.gecisBiten[q.gecis] === K && is.yenile.includes(q.gecis + 1)) is.ertelenen = q.gecis + 1;
      if (is.ertelenen && is.gBiten === K) { const g = is.ertelenen; is.ertelenen = 0; goruntule(g === is.gecis); }
      if (is.biten >= is.toplam) { // kademe bitti: bir sonrakine geç ya da dur
        if (is.i + 1 < is.kademeler.length) { is.i++; kademeBaslat(); } else is.tamam = true;
        return;
      }
    }
    ver(q);
  };

  // Birikmiş örneklerin kopyası son işlem işçisine gider; işçi meşgulse yalnızca en yenisi bekletilir
  const goruntule = kademeSonu => {
    const { W, H, acc, l2, cn, G, sc, no } = is;
    const ileti = { n: no, W, H, acc: acc.slice(), l2: l2.slice(), cn: cn.slice(), G: G.slice(), night: !!sc.night, bilgi: { ornek: Math.round(cn[0]), kademe: is.i, kademeSayisi: is.kademeler.length, kademeSonu, oran: ilerleme() } };
    if (sonMesgul) sonBekleyen = ileti; else sonGonder(ileti);
  };
  let sonBilgi = new Map();
  const sonGonder = m => {
    sonMesgul = true;
    sonBilgi.set(m.n, m.bilgi);
    const { bilgi, ...veri } = m;
    son.postMessage(veri, [veri.acc.buffer, veri.l2.buffer, veri.cn.buffer, veri.G.buffer]);
  };
  const sonYanit = m => {
    sonMesgul = false;
    const bilgi = sonBilgi.get(m.n); sonBilgi.delete(m.n);
    // yalnızca süren işin kademelerinden gelen görüntü gösterilir (bırakılmış işin gecikmiş sonucu atılır)
    if (is && m.n >= is.ilkNo && m.n <= is.no && !is.birakildi) {
      if (tuval.width !== m.W || tuval.height !== m.H) { tuval.width = m.W; tuval.height = m.H; }
      ctx.putImageData(new ImageData(m.o, m.W, m.H), 0, 0);
      is.gosterilen = { W: m.W, H: m.H, ...bilgi };
      goster?.({ W: m.W, H: m.H, ...bilgi, bitti: !!is.tamam && bilgi.kademe === is.kademeler.length - 1 && bilgi.kademeSonu });
    }
    if (sonBekleyen) { const b = sonBekleyen; sonBekleyen = null; sonGonder(b); }
  };

  // Bütün kademelerin toplam işine göre ilerleme (piksel × örnek ağırlıklı)
  const ilerleme = () => {
    let toplam = 0, biten = 0;
    is.kademeler.forEach((k, i) => {
      const yuk = k.sc.cam.W * k.sc.cam.H * k.ornek;
      toplam += yuk;
      biten += i < is.i ? yuk : i === is.i ? yuk * is.biten / is.toplam : 0;
    });
    return toplam ? biten / toplam : 0;
  };

  return {
    // Yeni çekim: süren iş bırakılır
    cek(kademeler) {
      kur();
      if (kurulamadi || !isciler.length || !kademeler.length) return false;
      is = { kademeler, i: 0, ilkNo: sayac + 1, tamam: false, birakildi: false, gosterilen: null };
      durakli = false; sonBekleyen = null;
      kademeBaslat();
      return true;
    },
    durakla() { durakli = true; },
    surdur() { if (!is || is.tamam) return; durakli = false; for (const q of isciler) ver(q); },
    // Süren işi bırakır; işçiler bir sonraki çekim için açık kalır
    birak() { if (is) is.birakildi = true; is = null; sonBekleyen = null; durakli = false; },
    // İşçileri kapatır (kip kapatılınca)
    kapat() {
      this.birak();
      for (const q of isciler) { try { q.w.terminate(); } catch { /* zaten kapalı */ } }
      try { son?.terminate(); } catch { /* zaten kapalı */ }
      isciler = []; son = null; sonMesgul = false; sonBilgi = new Map();
    },
    durum() { return is ? { suruyor: !is.tamam, durakli, oran: is.tamam ? 1 : ilerleme(), gosterilen: is.gosterilen, tamam: is.tamam } : null; },
    get destek() { return !kurulamadi; },
  };
}
