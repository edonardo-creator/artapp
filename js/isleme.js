// Parça işleme: her levha parçasının delikleri, menteşe yuvaları, kulp delikleri, gola kertmeleri ve ray hizaları.
// Ölçüler parçanın kendi yüzünde verilir: X parçanın boyu, Y eni boyunca; başlangıç köşesi ve işlenen yüz parçada yazar.
// Koordinatlar işlenen yüze karşıdan bakışa göredir (sol ve sağ yan birbirinin aynasıdır); CNC dosyası aynı veriyi kullanır.
// Varsayılan kurallar atölyenin Adeko kütüphanesindeki Part2CAM ayarlarından alınmıştır (MODULER arşivi, 2020–2022;
// DEFAULT_HELPERS/(DEFAULT) içindeki CONNECTORS, DOWEL, SCREW, HINGE, ASHELF_AND_DIVIDER, HANDLE ayarları). Hepsi ISLEME_KURAL içindedir:
//   gövde birleşimi: kavela + vida. Yan panelin iç yüzünde Ø8, 14 mm derin kavela deliği (ön ve arka kenardan 50 mm) ve Ø3 boydan boya vida deliği
//     (ön ve arka kenardan 82 mm; vida 4 × 50). 200 mm'den kısa birleşimde (kayıt) ortada tek kavela, uçlardan 15 mm içeride iki vida; 79 mm'den kısada işlem yok.
//     Yatay parçanın alnındaki kavela deliği (Ø8, 18 mm) yatay delmedir; yerleştirmeli CNC'de delinmez, föyde adet olarak yazar.
//   raf pimi: Ø5, 10 mm derin; rafın ön ve arka kenarından 50 mm içeride; raf hizasında ve 32 mm aşağı–yukarısında (üç kademe)
//   menteşe yuvası: Ø35, 15 mm derin; kapağın kenarından merkeze 23 mm; alttan ve üstten 100 mm, aradakiler eşit aralıklı.
//     Yuvanın 9,5 mm içerisinde, 45 mm aralıklı iki vida işareti (Ø3, 1 mm)
//   menteşe tabanı: yan panelde ön kenardan 37 mm içeride, yuva hizasının 16 mm altında ve üstünde Ø3, 1 mm derin iki işaret deliği
//   kulp: Ø5 boydan boya; delik aralığı kulp kataloğundaki (eB Creator'dan gelen) değerdir; temel modellerde 16 cm çubuk 128, 32 cm çubuk 288 mm
//   menteşe sayısı: eB Creator'daki kural (kapak boyu 95 cm'ye kadar 2, 150'ye kadar 3, 200'e kadar 4, üstünde 5)
//   gola: yan panelin ön üst köşesinde 26 × 58 mm L kertme; ara profilde 26 × 73 mm C kertme (Adeko'dan alınmadı: arşivde kertme ölçüsü yok, yalnızca iç köşe yarıçapı 15 mm)
//   çekmece rayı (Adeko DRAWER_DEFAULT, RAIL_HOLES): yan panelin iç yüzünde Ø3, 2 mm derin iki işaret deliği; ön kenardan 37 mm ve 293 mm (37 + 256),
//     çekmece önünün alt kenarından 60 mm yukarıda. Arşivde bütün ray boylarında aynı koordinat yazılıdır (hazır ayar); rayYuk 0 yapılırsa delinmez.
//   raf bağlantısı: pim (başlangıç) ya da rafix (Adeko RAFIX_DEFAULT; arşivde raf işlemi "RAFIX" seçilidir). Rafixte rafın alt yüzünde, yan kenardan 9,5 mm içeride
//     Ø20, 14 mm derin yuva; yan panelde raf kalınlığının ortasında Ø5, 14 mm derin cıvata deliği; ikisi de rafın ön ve arka kenarından 50 mm içeride (ayar kademesi yok).
//   baza ayağı delikleri: arşivde kapalıdır (ARE_PLINTH_LEG_HOLES_AVAILABLE nil); ARTAPP'te de yoktur.
//   arkalık kanalı (Adeko GROOVES ve BACK_PANEL ayarları): yan panellerin iç yüzünde, alt tablanın üst ve üst tablanın alt yüzünde;
//     arka kenardan 11,5 mm içeride, arkalık kalınlığı + 0,5 mm geniş (8 mm arkalıkta 8,5), 8 mm derin. Ölçüler atölye standartlarındadır (moduller.js);
//     kanal, çizimde arkalığın levhaya girdiği yerden hesaplanır. Arkalık çakma seçilirse ya da gövde L köşe / kavisliyse kanal açılmaz.
import { TANIM, parcalar, T, ARK } from './moduller.js';
import { yatayBoyEkseni } from './ortak.js';
import { kulpBilgisi } from './kulplar.js';

export const ISLEME_KURAL = { vidaCap: 3, vidaKenar: 82, vidaOrta: 6000, kavelaCap: 8, kavelaDerin: 14, kavelaAlin: 18, kavelaKenar: 50, kucukParca: 200, kucukVidaKenar: 15, islemsiz: 79,
  pimCap: 5, pimDerin: 10, pimKenar: 50, pimAdim: 32,
  yuvaCap: 35, yuvaDerin: 15, yuvaKenar: 23, yuvaUc: 100, yuvaVida: 9.5, yuvaVidaAralik: 45, isaretCap: 3, isaretDerin: 1,
  tabanCap: 3, tabanDerin: 1, tabanOn: 37, tabanAralik: 32, kulpCap: 5, golaDerin: 26, golaL: 58, golaC: 73,
  rayCap: 3, rayDerin: 2, rayOn: 37, rayAralik: 256, rayYuk: 60,
  rafBag: 0, rafixCap: 20, rafixDerin: 14, rafixKenar: 9.5, rafixCivata: 5, rafixCivataDerin: 14 };
// Kurallar projede değiştirilebilir (ayar.isleme); [en küçük, en büyük, ad, birim]. Cihazın varsayılanı islemeVarsayilanKoy ile verilir.
export const ISLEME_ALAN = {
  vidaCap: [2, 10, 'Vida deliği çapı', 'mm'], vidaKenar: [20, 150, 'Vida: ön ve arka kenardan', 'mm'],
  kavelaCap: [0, 12, 'Kavela çapı (0: kavela yok)', 'mm'], kavelaDerin: [5, 16, 'Kavela derinliği (yan panelde)', 'mm'], kavelaKenar: [20, 150, 'Kavela: ön ve arka kenardan', 'mm'],
  pimCap: [3, 10, 'Raf pimi çapı', 'mm'], pimDerin: [5, 16, 'Raf pimi derinliği', 'mm'], pimKenar: [20, 150, 'Raf pimi: kenardan', 'mm'], pimAdim: [0, 64, 'Raf pimi kademe aralığı', 'mm'],
  yuvaCap: [20, 40, 'Menteşe yuvası çapı', 'mm'], yuvaDerin: [8, 16, 'Menteşe yuvası derinliği', 'mm'], yuvaKenar: [15, 30, 'Yuva merkezi: kapak kenarından', 'mm'], yuvaUc: [50, 250, 'Yuva: alttan ve üstten', 'mm'],
  tabanOn: [20, 80, 'Menteşe tabanı: ön kenardan', 'mm'], tabanAralik: [0, 64, 'Menteşe tabanı delik aralığı', 'mm'], kulpCap: [3, 8, 'Kulp deliği çapı', 'mm'],
  golaDerin: [10, 60, 'Gola kertme derinliği', 'mm'], golaL: [20, 120, 'Gola L kertme yüksekliği', 'mm'], golaC: [20, 150, 'Gola C kertme yüksekliği', 'mm'],
  rayYuk: [0, 200, 'Ray deliği: çekmece önünün altından (0: delik yok)', 'mm'], rayOn: [10, 100, 'Ray deliği: ön kenardan', 'mm'], rayAralik: [0, 480, 'Ray deliği: ikinci delik aralığı (0: tek delik)', 'mm'],
  rafBag: [0, 1, 'Raf bağlantısı (0: pim, 1: rafix)', ''],
};
let cihazVarsayilani = {};
const gecerli = kaynak => { const o = {}; for (const [k, [alt, ust]] of Object.entries(ISLEME_ALAN)) { const v = Number(kaynak?.[k]); if (kaynak?.[k] !== '' && kaynak?.[k] != null && Number.isFinite(v)) o[k] = Math.min(ust, Math.max(alt, v)); } return o; };
export function islemeVarsayilanKoy(o) { cihazVarsayilani = gecerli(o); }
// Projenin işleme kuralları: uygulamanın ölçüleri ← bu cihazın varsayılanı ← projeye yazılan ölçüler
export const islemeKurali = p => ({ ...ISLEME_KURAL, ...cihazVarsayilani, ...gecerli(p?.ayar?.isleme) });
// Kapak boyuna göre menteşe sayısı: eB Creator'daki kural (95 cm'ye kadar 2, 150'ye kadar 3, 200'e kadar 4, üstünde 5)
export const menteseSayisi = boy => boy <= 950 ? 2 : boy <= 1500 ? 3 : boy <= 2000 ? 4 : 5;
const yuv = n => Math.round(n * 10) / 10;
const KULP_ARALIK = [96, 128, 160, 192, 224, 256, 288, 320, 480, 640];

// Bir modülün levha parçaları ve işlemleri.
// Dönen: [{ ad, malzeme: 'Gövde' | 'Kapak', boy, en, kalinlik, yuz: işlenen yüz, kose: X ve Y'nin başladığı köşe,
//   islem: [{ t: 'delik', x, y, cap, der (0: boydan boya), ac } | { t: 'kertme', x0, y0, x1, y1, ac } | { t: 'kanal', x0, y0, x1, y1, der, ac } | { t: 'cizgi', x, ac }] }]
export function modulIslemleri(m, kural) {
  const t = TANIM[m.tip];
  if (!t || !['alt', 'ust', 'boy'].includes(t.sinif)) return [];
  const R = kural || { ...ISLEME_KURAL, ...cihazVarsayilani }, ps = parcalar(m).filter(q => !q.sus && !q.sekil && Number.isFinite(q.sx));
  const paneller = [];
  for (const q of ps) {
    if (q.mat !== 'govde' && q.mat !== 'kapak') continue;
    const k = Math.min(q.sx, q.sy, q.sz);
    if (k > 25 || q.ad === 'Çekmece kasası') continue;
    const eks = q.sx === k ? 'x' : q.sy === k ? 'y' : 'z';
    if (q.mat === 'govde' && k <= ARK + 0.5 && ARK < T) continue; // arkalığın kendisi işlenmez
    // parçanın düzlemi: u = boy yönü, v = en yönü (kesim listesiyle aynı kural)
    let u, v;
    if (eks === 'y') [u, v] = (q.mat === 'govde' ? yatayBoyEkseni(q, m) === 'x' : q.sx >= q.sz) ? ['x', 'z'] : ['z', 'x'];
    else { const yatay = eks === 'x' ? 'z' : 'x', serit = Math.min(q.sy, q['s' + yatay]) < 120; [u, v] = serit && q['s' + yatay] > q.sy ? [yatay, 'y'] : ['y', yatay]; }
    const P = { q, eks, u, v, ad: q.ad, malzeme: q.mat === 'kapak' ? 'Kapak' : 'Gövde', boy: Math.round(q['s' + u]), en: Math.round(q['s' + v]), kalinlik: Math.round(q.kk || k), islem: [], yuz: '', kose: '', ters: false };
    paneller.push(P);
  }
  const yanlar = paneller.filter(P => P.eks === 'x' && P.malzeme === 'Gövde'), yataylar = paneller.filter(P => P.eks === 'y' && P.malzeme === 'Gövde');
  const merkezX = m.w / 2;
  // Yan panel: iç yüz işlenir. Sol yanda Y arkadan, sağ yanda önden ölçülür (yüze karşıdan bakınca X sağa, Y yukarı)
  for (const S of yanlar) {
    const solda = S.q.x + S.q.sx / 2 < merkezX;
    S.icYon = solda ? 1 : -1; // iç yüzün x yönü
    S.ters = !solda; S.yuz = 'iç yüz'; S.kose = S.u === 'y' ? (solda ? 'alt – arka köşe' : 'alt – ön köşe') : 'sol alt köşe';
  }
  for (const H of yataylar) { H.yuz = 'alt yüz'; H.kose = H.u === 'x' ? 'sol – arka köşe' : 'arka – sol köşe'; }
  for (const K of paneller.filter(P => P.malzeme === 'Kapak')) { K.yuz = 'arka yüz'; K.kose = 'alt – sol köşe (arkadan bakışta)'; K.ters = true; }
  // Arkalık kanalı: kanallı arkalığın (gövdenin arkasından içeride duran) girdiği yan panellere ve tablalara açılır.
  // Tablada kanal iç yüzdedir: alt tablada üst yüz, üst tablada alt yüz; işlenen yüz ve başlangıç köşesi buna göre seçilir.
  const kanallar = []; // [panel, modül koordinatında iki karşı köşe, derinlik]
  for (const A of ps.filter(q => q.mat === 'govde' && q.ad === 'Arkalık' && q.sz <= ARK + 0.5 && ARK < T && q.z > 0.5)) {
    const z0 = A.z, z1 = A.z + A.sz + 0.5;
    for (const S of yanlar) {
      const gir = Math.min(A.x + A.sx, S.q.x + S.q.sx) - Math.max(A.x, S.q.x);
      if (gir < 0.5 || gir > S.q.sx - 2 || S.q.z > z0 || S.q.z + S.q.sz < z1) continue;
      const ya = Math.max(A.y, S.q.y), yb = Math.min(A.y + A.sy, S.q.y + S.q.sy);
      if (yb - ya > 20) kanallar.push([S, { x: 0, y: ya, z: z0 }, { x: 0, y: yb, z: z1 }, gir]);
    }
    for (const H of yataylar) {
      const gir = Math.min(A.y + A.sy, H.q.y + H.q.sy) - Math.max(A.y, H.q.y);
      if (gir < 0.5 || gir > H.q.sy - 2 || H.q.z > z0 || H.q.z + H.q.sz < z1) continue;
      const xa = Math.max(A.x, H.q.x), xb = Math.min(A.x + A.sx, H.q.x + H.q.sx);
      if (xb - xa <= 20) continue;
      const ustYuz = A.y + A.sy / 2 > H.q.y + H.q.sy / 2; // arkalık parçanın üstünde duruyorsa kanal üst yüzdedir
      H.yuz = ustYuz ? 'üst yüz' : 'alt yüz'; H.ters = (H.u === 'x') === ustYuz;
      H.kose = H.u === 'x' ? (ustYuz ? 'sol – ön köşe' : 'sol – arka köşe') : (ustYuz ? 'arka – sol köşe' : 'arka – sağ köşe');
      kanallar.push([H, { x: xa, y: 0, z: z0 }, { x: xb, y: 0, z: z1 }, gir]);
    }
  }
  // modül koordinatındaki noktayı parçanın yüzündeki (x, y)'ye çevirir
  const yerel = (P, n) => { const x = n[P.u] - P.q[P.u]; let y = n[P.v] - P.q[P.v]; if (P.ters) y = P.q['s' + P.v] - y; return [yuv(x), yuv(y)]; };
  const delik = (P, n, cap, der, ac) => { const [x, y] = yerel(P, n); if (x < -0.5 || y < -0.5 || x > P.boy + 0.5 || y > P.en + 0.5) return; P.islem.push({ t: 'delik', x, y, cap, der, ac }); };
  const dokunur = (a, b) => Math.abs(a - b) < 1.6;
  for (const [P, a, b, der] of kanallar) {
    const [xa, ya] = yerel(P, a), [xb, yb] = yerel(P, b);
    P.islem.push({ t: 'kanal', x0: Math.max(0, Math.min(xa, xb)), y0: Math.min(ya, yb), x1: Math.min(P.boy, Math.max(xa, xb)), y1: Math.max(ya, yb), der: yuv(der), ac: 'arkalık kanalı' });
  }
  // Birleşim noktaları (Adeko'daki sabit ölçülü düzen): kısa birleşimde ortada tek kavela ve uçlarda iki vida, çok kısada işlem yok
  const noktalar = (z0, z1) => {
    const L = z1 - z0;
    if (L < R.islemsiz) return { kavela: [], vida: [] };
    if (L <= R.kucukParca) return { kavela: [z0 + L / 2], vida: [z0 + R.kucukVidaKenar, z1 - R.kucukVidaKenar] };
    return { kavela: [z0 + R.kavelaKenar, z1 - R.kavelaKenar], vida: L > R.vidaOrta ? [z0 + R.vidaKenar, z0 + L / 2, z1 - R.vidaKenar] : [z0 + R.vidaKenar, z1 - R.vidaKenar] };
  };

  // 1) Gövde birleşimi ve raf pimleri
  for (const S of yanlar) for (const H of yataylar) {
    const sag = dokunur(H.q.x, S.q.x + S.q.sx), sol = dokunur(H.q.x + H.q.sx, S.q.x);
    if (!sag && !sol) continue;
    if (H.q.y < S.q.y - 1 || H.q.y + H.q.sy > S.q.y + S.q.sy + 1) continue;
    const z0 = Math.max(H.q.z, S.q.z), z1 = Math.min(H.q.z + H.q.sz, S.q.z + S.q.sz), L = z1 - z0;
    if (L < 40) continue;
    const raf = /raf/i.test(H.ad);
    if (raf) {
      const zs = L < 2.8 * R.pimKenar ? [z0 + L / 2] : [z0 + R.pimKenar, z1 - R.pimKenar];
      if (R.rafBag >= 0.5) { // rafix: yan panelde cıvata deliği (raf kalınlığının ortası), rafın alt yüzünde yuva (yan kenardan içeride)
        for (const z of zs) {
          delik(S, { x: 0, y: H.q.y + H.q.sy / 2, z }, R.rafixCivata, R.rafixCivataDerin, 'rafix cıvatası');
          delik(H, { x: sag ? H.q.x + R.rafixKenar : H.q.x + H.q.sx - R.rafixKenar, y: 0, z }, R.rafixCap, R.rafixDerin, 'rafix yuvası');
        }
      } else for (const dy of [-R.pimAdim, 0, R.pimAdim]) for (const z of zs) delik(S, { x: 0, y: H.q.y - R.pimCap / 2 + dy, z }, R.pimCap, R.pimDerin, dy ? 'raf pimi (ayar)' : 'raf pimi');
    } else {
      const n = noktalar(z0, z1), y = H.q.y + H.q.sy / 2, ad = H.ad.toLocaleLowerCase('tr');
      for (const z of n.vida) delik(S, { x: 0, y, z }, R.vidaCap, 0, 'vida: ' + ad);
      if (R.kavelaCap) for (const z of n.kavela) delik(S, { x: 0, y, z }, R.kavelaCap, R.kavelaDerin, 'kavela: ' + ad);
      H.alin = (H.alin || 0) + n.vida.length; if (R.kavelaCap) H.alinKavela = (H.alinKavela || 0) + n.kavela.length;
    }
  }
  // dikme (ara bölme) uçları: üstündeki ve altındaki yatay parçadan vidalanır
  for (const S of yanlar) for (const H of yataylar) {
    const alt = dokunur(S.q.y, H.q.y + H.q.sy), ust = dokunur(S.q.y + S.q.sy, H.q.y);
    if (!alt && !ust) continue;
    if (S.q.x < H.q.x - 1 || S.q.x + S.q.sx > H.q.x + H.q.sx + 1) continue;
    const z0 = Math.max(H.q.z, S.q.z), z1 = Math.min(H.q.z + H.q.sz, S.q.z + S.q.sz), L = z1 - z0;
    if (L < 40) continue;
    for (const z of L < 140 ? [z0 + L / 2] : noktalar(z0, z1).vida) delik(H, { x: S.q.x + S.q.sx / 2, y: 0, z }, R.vidaCap, 0, 'vida: ' + S.ad.toLocaleLowerCase('tr'));
  }
  // 2) Menteşe yuvası (kapak) ve menteşe tabanı (yan panel)
  for (const K of paneller.filter(P => P.malzeme === 'Kapak')) {
    const yon = K.q.mentese;
    if (yon !== 'sol' && yon !== 'sag' || K.q.onBagli) continue;
    const n = menteseSayisi(K.q.sy), uc = Math.min(R.yuvaUc, K.q.sy * 0.2), kenarX = yon === 'sol' ? K.q.x : K.q.x + K.q.sx;
    const yan = yanlar.map(S => [S, Math.abs(S.q.x + S.q.sx / 2 - kenarX)]).filter(e => e[1] < 60 && e[0].q.y <= K.q.y + 5 && e[0].q.y + e[0].q.sy >= K.q.y + K.q.sy - 5).sort((a, b) => a[1] - b[1])[0]?.[0];
    for (let i = 0; i < n; i++) {
      const y = K.q.y + uc + (K.q.sy - 2 * uc) * (n === 1 ? 0.5 : i / (n - 1));
      delik(K, { x: kenarX + (yon === 'sol' ? R.yuvaKenar : -R.yuvaKenar), y, z: 0 }, R.yuvaCap, R.yuvaDerin, 'menteşe yuvası');
      if (R.yuvaVida) for (const dy of [-R.yuvaVidaAralik / 2, R.yuvaVidaAralik / 2]) delik(K, { x: kenarX + (yon === 'sol' ? 1 : -1) * (R.yuvaKenar + R.yuvaVida), y: y + dy, z: 0 }, R.isaretCap, R.isaretDerin, 'menteşe vidası (işaret)');
      if (yan) for (const dy of [-R.tabanAralik / 2, R.tabanAralik / 2]) delik(yan, { x: 0, y: y + dy, z: yan.q.z + yan.q.sz - R.tabanOn }, R.tabanCap, R.tabanDerin, 'menteşe tabanı');
    }
  }
  // 3) Kulp delikleri
  const kulpKod = m.kulp || 'cubuk';
  if (!['gola', 'yok', 'boy', 'tir'].includes(kulpKod)) for (const k of ps.filter(q => q.tur === 'kulp' && q.mat === 'kulp' && !q.kulpEk)) {
    const cx = k.x + k.sx / 2, cy = k.y + k.sy / 2;
    const K = paneller.filter(P => P.malzeme === 'Kapak' && cx > P.q.x - 1 && cx < P.q.x + P.q.sx + 1 && cy > P.q.y - 1 && cy < P.q.y + P.q.sy + 1).sort((a, b) => a.q.sx * a.q.sy - b.q.sx * b.q.sy)[0];
    if (!K) continue;
    const dikey = k.sy > k.sx, uzun = Math.max(k.sx, k.sy), bilgi = kulpBilgisi(kulpKod), yazili = Number(/(\d{2,4})\s*mm/.exec(bilgi?.ad || '')?.[1]) || 0;
    const tek = kulpKod === 'dug' || bilgi?.bicim === 'knob' || uzun < 60;
    const tam = bilgi?.boy > 0 ? bilgi.boy : uzun; // kulbun tam boyu (katalogdan); çok parçalı kulpta çizimdeki ana parça daha kısadır
    const aralik = tek ? 0 : yazili ? yazili : [...KULP_ARALIK].reverse().find(a => a <= tam - 16) || Math.max(32, tam - 32);
    for (const s of tek ? [0] : [-aralik / 2, aralik / 2]) delik(K, { x: cx + (dikey ? 0 : s), y: cy + (dikey ? s : 0), z: 0 }, R.kulpCap, 0, tek ? 'kulp' : `kulp (aralık ${aralik})`);
  }
  // 4) Gola kertmeleri: yan panelin ön kenarında
  if (kulpKod === 'gola') for (const g of ps.filter(q => q.ad === 'Gola kanalı')) {
    for (const S of yanlar.filter(S => S.u === 'y' && S.q.y <= g.y && S.q.y + S.q.sy >= g.y + g.sy - 1)) {
      const ust = S.q.y + S.q.sy, enUst = g.y + g.sy > ust - 40, h = enUst ? R.golaL : R.golaC, y1 = enUst ? ust : g.y + g.sy / 2 + h / 2;
      const [x0, ya] = yerel(S, { x: 0, y: y1 - h, z: S.q.z + S.q.sz - R.golaDerin }), [x1, yb] = yerel(S, { x: 0, y: y1, z: S.q.z + S.q.sz });
      S.islem.push({ t: 'kertme', x0: Math.max(0, Math.min(x0, x1)), y0: Math.min(ya, yb), x1: Math.min(S.boy, Math.max(x0, x1)), y1: Math.max(ya, yb), ac: enUst ? 'gola L profili' : 'gola C profili' });
    }
  }
  // 5) Çekmece rayı hizası: kasanın alt kenarı (ray türüne göre delikler ayrıca işaretlenir)
  // Ray vidası işaretleri (Adeko'daki düzen): ön kenardan rayOn ve rayOn + rayAralik, çekmece önünün alt kenarından rayYuk yukarıda
  const onler = ps.filter(q => q.ad === 'Çekmece önü');
  for (const c of ps.filter(q => q.ad === 'Çekmece kasası')) for (const S of yanlar.filter(S => S.u === 'y' && Math.min(Math.abs(S.q.x + S.q.sx - c.x), Math.abs(c.x + c.sx - S.q.x)) < 45)) {
    const x = yuv(c.y - S.q.y);
    if (x > 0 && x < S.boy && !S.islem.some(i => i.t === 'cizgi' && Math.abs(i.x - x) < 1)) S.islem.push({ t: 'cizgi', x, ac: 'çekmece rayı hizası (kasa altı)' });
    const on = onler.find(q => Math.abs(q.y + 20 - c.y) < 1.5 && q.x < c.x + 1 && q.x + q.sx > c.x + c.sx - 1);
    if (!on || !(R.rayYuk > 0)) continue;
    const zf = S.q.z + S.q.sz;
    for (const z of R.rayAralik > 0 ? [zf - R.rayOn, zf - R.rayOn - R.rayAralik] : [zf - R.rayOn]) if (z > Math.max(c.z, S.q.z) + 5) delik(S, { x: 0, y: on.y + R.rayYuk, z }, R.rayCap, R.rayDerin, 'ray vidası (işaret)');
  }
  return paneller.map(P => ({ ad: P.ad, malzeme: P.malzeme, boy: P.boy, en: P.en, kalinlik: P.kalinlik, yuz: P.yuz, kose: P.kose, alin: P.alin || 0, alinKavela: P.alinKavela || 0,
    islem: P.islem.sort((a, b) => (a.t > b.t ? 1 : a.t < b.t ? -1 : 0) || (a.x ?? a.x0) - (b.x ?? b.x0) || (a.y ?? a.y0 ?? 0) - (b.y ?? b.y0 ?? 0)) }));
}

// Parçanın işlemlerinin kısa özeti: "8 delik Ø5 · 2 yuva Ø35 · 1 kertme"
export function islemOzeti(P) {
  const say = new Map();
  for (const i of P.islem) {
    const a = i.t === 'delik' ? (i.cap >= 20 ? `yuva Ø${i.cap}` : `delik Ø${String(i.cap).replace('.', ',')}`) : i.t === 'kertme' ? 'kertme' : i.t === 'kanal' ? 'kanal' : 'ray hizası';
    say.set(a, (say.get(a) || 0) + 1);
  }
  if (P.alin) say.set('alın vidası', P.alin);
  if (P.alinKavela) say.set('alın kavelası', P.alinKavela);
  return [...say].map(([a, n]) => `${n} ${a}`).join(' · ');
}

// Deliğin katman adı: çap ve derinlik adın içindedir (DELIK_D5_Z12, DELIK_D4_5_BOYDAN)
export const delikKatmani = i => `DELIK_D${String(i.cap).replace('.', '_')}_${i.der ? 'Z' + String(i.der).replace('.', '_') : 'BOYDAN'}`;

// Kanalın katman adı: derinlik adın içindedir (KANAL_Z8)
export const kanalKatmani = i => `KANAL_Z${String(i.der).replace('.', '_')}`;

// Parçanın DXF çizimi (R12). X parçanın boyu, Y eni; birim milimetre; başlangıç sol alt köşe.
//   KONTUR  dış hat: kapalı çoklu çizgi (POLYLINE); kalınlık alanı (grup 39) levha kalınlığıdır
//   DELIK_… delikler: CIRCLE; çap ve derinlik katman adında, derinlik ayrıca kalınlık alanında (boydan boya delikte levha kalınlığı)
//   KERTME  kesilip atılacak bölge: kapalı çoklu çizgi, kalınlık alanı levha kalınlığı
//   KANAL_… arkalık kanalı: kanalın bölgesi kapalı çoklu çizgi; derinlik katman adında ve kalınlık alanında
//   ISARET  işaret çizgisi (kesilmez)
// Adeko CAM parçayı "kapalı çoklu çizgi + kalınlık" olarak tanımlar ve geometrinin derinliğini DXF'in kalınlık alanında tutar
// (Adeko yardım belgesi: "Feeding With Data", setThickness); katmanlara takım prosedürde atanır. Katman adını okuyan programlar da aynı dosyayı kullanır.
export function parcaDxf(P) {
  const katmanlar = new Map([['KONTUR', 7]]), e = [], say = n => Math.round(n * 1000) / 1000;
  const katman = (ad, renk) => { if (!katmanlar.has(ad)) katmanlar.set(ad, renk); return ad; };
  const kapali = (k, der, noktalar) => {
    e.push('0', 'POLYLINE', '8', k, '66', 1, '10', 0, '20', 0, '30', 0, '39', say(der), '70', 1);
    for (const [x, y] of noktalar) e.push('0', 'VERTEX', '8', k, '10', say(x), '20', say(y), '30', 0);
    e.push('0', 'SEQEND', '8', k);
  };
  kapali('KONTUR', P.kalinlik, [[0, 0], [P.boy, 0], [P.boy, P.en], [0, P.en]]);
  for (const i of P.islem) {
    if (i.t === 'delik') e.push('0', 'CIRCLE', '8', katman(delikKatmani(i), i.cap >= 20 ? 5 : i.der ? 3 : 2), '39', say(i.der || P.kalinlik), '10', say(i.x), '20', say(i.y), '30', 0, '40', say(i.cap / 2));
    else if (i.t === 'kertme') kapali(katman('KERTME', 1), P.kalinlik, [[i.x0, i.y0], [i.x1, i.y0], [i.x1, i.y1], [i.x0, i.y1]]);
    else if (i.t === 'kanal') kapali(katman(kanalKatmani(i), 4), i.der, [[i.x0, i.y0], [i.x1, i.y0], [i.x1, i.y1], [i.x0, i.y1]]);
    else e.push('0', 'LINE', '8', katman('ISARET', 8), '10', say(i.x), '20', 0, '30', 0, '11', say(i.x), '21', P.en, '31', 0);
  }
  const tablo = [...katmanlar].flatMap(([ad, renk]) => ['0', 'LAYER', '2', ad, '70', 0, '62', renk, '6', 'CONTINUOUS']);
  return ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '9', '$EXTMIN', '10', 0, '20', 0, '30', 0, '9', '$EXTMAX', '10', P.boy, '20', P.en, '30', 0, '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', katmanlar.size, ...tablo, '0', 'ENDTAB', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES', ...e, '0', 'ENDSEC', '0', 'EOF'].join('\r\n') + '\r\n';
}

// Sıkıştırmasız ZIP (kütüphanesiz): [{ ad, veri: string | Uint8Array }] → Uint8Array
export function zipYap(dosyalar) {
  const tablo = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = tablo[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const kod = new TextEncoder(), parcalar = [], merkez = [];
  let konum = 0;
  const yaz16 = (d, o, v) => { d[o] = v & 255; d[o + 1] = (v >>> 8) & 255; }, yaz32 = (d, o, v) => { yaz16(d, o, v & 0xFFFF); yaz16(d, o + 2, v >>> 16); };
  for (const f of dosyalar) {
    const ad = kod.encode(f.ad), veri = typeof f.veri === 'string' ? kod.encode(f.veri) : f.veri, c = crc(veri);
    const yerel = new Uint8Array(30 + ad.length);
    yaz32(yerel, 0, 0x04034b50); yaz16(yerel, 4, 20); yaz16(yerel, 6, 0x0800); yaz16(yerel, 12, 0x21); /* tarih: 1980-01-01 */ yaz32(yerel, 14, c); yaz32(yerel, 18, veri.length); yaz32(yerel, 22, veri.length); yaz16(yerel, 26, ad.length); yerel.set(ad, 30);
    const m = new Uint8Array(46 + ad.length);
    yaz32(m, 0, 0x02014b50); yaz16(m, 4, 20); yaz16(m, 6, 20); yaz16(m, 8, 0x0800); yaz16(m, 14, 0x21); yaz32(m, 16, c); yaz32(m, 20, veri.length); yaz32(m, 24, veri.length); yaz16(m, 28, ad.length); yaz32(m, 42, konum); m.set(ad, 46);
    parcalar.push(yerel, veri); merkez.push(m); konum += yerel.length + veri.length;
  }
  const mBoy = merkez.reduce((t, m) => t + m.length, 0), son = new Uint8Array(22);
  yaz32(son, 0, 0x06054b50); yaz16(son, 8, dosyalar.length); yaz16(son, 10, dosyalar.length); yaz32(son, 12, mBoy); yaz32(son, 16, konum);
  const out = new Uint8Array(konum + mBoy + 22);
  let o = 0;
  for (const b of [...parcalar, ...merkez, son]) { out.set(b, o); o += b.length; }
  return out;
}
