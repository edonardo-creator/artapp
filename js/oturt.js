// Tıklanan yere oturtma: katalogdan seçilen modül, tıklanan duvar ya da zemin noktasına yerleştirilir.
// Tıklanan yerde modül olduğu gibi sığmıyorsa ölçü önerileri üretilir: boşluğa göre daralt, boşluğu doldur, kolona ya da kirişe göre kert,
// kirişin altına ya da tavana göre kısalt, en yakın boş yere kaydır. Pencere önü, kapı önü ve kapının açılma alanı boş bırakılır.
// İlk seçenek tıklamayla uygulanır; ötekiler kullanıcıya öneri olarak sunulur. Dolap kolona denk gelince ilk seçenek kertmeli oturtmadır.
// Köşe modülleri (L köşe, kör köşe) odanın köşesine, kavisli bitiş dolap sırasının açık ucuna oturur. "Boş yere koy" ve sürükleyip bırakma
// aynı kuralları kullanır (bosaOturt, tasimaOnerileri). 3B kütüphaneye bağlı değildir.
import { TANIM, KAPAK_K } from './moduller.js';
import { kutu, kesisir, duvarBoyu, xEksenli, DUVARLAR, serbestMi, tesisatMi, engelMi, kertilirMi, acikliklar, tasimaCoz, tavanYuksekligi, egikDuzlem, EGIK_OLUR, uyarilar } from './yerlesim.js';
import { tavanSiniri, DARALIR, enAzYukseklik } from './duzelt.js';
import { kertmeOlculeri } from './kertme.js';

export const DUVARA_YAKIN = 900; // zeminde duvara bu kadar yakın tıklama o duvara sayılır (dolap derinliği + pay)
export const EN_DAR = 200, EN_GENIS = 1200; // önerilen genişliğin sınırları
const YAKALA = 100;      // komşuya ya da duvar köşesine bu kadar yakın kalan modül ona dayanır (arada işe yaramaz boşluk kalmasın)
const ARTIK = 250;       // modülün yanında bundan dar kalan boşluk dolap almaz: genişletme önerilir
const KERTME_ON = 150;   // kertmeden sonra kolonun önünde en az bu kadar gövde derinliği kalmalı
const KAVIS_YAKALA = 300; // kavisli bitiş dolap sırasının ucuna daha uzaktan dayanır (yeri sıranın ucudur)

const dolapMi = m => ['alt', 'ust', 'boy'].includes(TANIM[m.tip].sinif);
const adaTipi = m => TANIM[m.tip].sinif === 'dekor' || m.tip === 'davlumbaz_ada';                       // yalnızca serbest durur
const duvarTipi = m => (TANIM[m.tip].sinif === 'ust' && m.tip !== 'davlumbaz_ada') || TANIM[m.tip].sinif === 'tesisat' || ['pencere', 'kapi', 'nis', 'girinti'].includes(m.tip); // yalnızca duvarda durur
const duvarAdi = d => DUVARLAR[d] || d;
const sinirla = (v, az, cok) => Math.min(Math.max(v, az), Math.max(az, cok));
const ALANLAR = ['duvar', 'x', 'z', 'rot', 'y', 'w', 'h', 'kapak', 'egikKes', 'korYon'];
const koseTipi = m => /_lkose$/.test(m.tip) || m.tip === 'alt_kose'; // yeri odanın köşesidir
const kavisTipi = m => m.tip.includes('kavis');                       // yeri dolap sırasının açık ucudur
// Modülün (önüne bakınca) hangi yanı duvarın sonuna, büyük koordinata bakar: sol ve ön duvarda sol yanı, arka ve sağ duvarda sağ yanı
const sonYan = d => d === 'sol' || d === 'on' ? 'sol' : 'sag';
const ters = y => y === 'sol' ? 'sag' : 'sol';
const KOMSU = { arka: ['sol', 'sag'], on: ['sol', 'sag'], sol: ['arka', 'on'], sag: ['arka', 'on'] }; // duvarın başındaki ve sonundaki komşu duvar
const ozet = m => Object.fromEntries(ALANLAR.filter(a => m[a] !== undefined).map(a => [a, m[a]]));

// Tıklanan nokta hangi duvara ya da zemindeki hangi yere karşılık gelir.
// nokta: { tur: 'duvar', duvar, a (duvar boyunca mm), y } ya da { tur: 'zemin', x, z }
export function hedefCoz(m, nokta, oda) {
  if (nokta.tur === 'duvar') {
    if (!adaTipi(m)) return { duvar: nokta.duvar, a: nokta.a, y: nokta.y };
    // serbest duran öğe duvara tıklanınca o duvarın dibine konur
    const [x, z] = nokta.duvar === 'arka' ? [nokta.a, 0] : nokta.duvar === 'on' ? [nokta.a, oda.d] : nokta.duvar === 'sol' ? [0, nokta.a] : [oda.w, nokta.a];
    return { duvar: 'ada', x, z };
  }
  if (adaTipi(m)) return { duvar: 'ada', x: nokta.x, z: nokta.z };
  const u = { arka: nokta.z, sol: nokta.x, sag: oda.w - nokta.x, on: oda.d - nokta.z };
  const yakin = Object.keys(u).sort((a, b) => u[a] - u[b])[0];
  if (duvarTipi(m) || u[yakin] <= DUVARA_YAKIN) return { duvar: yakin, a: xEksenli(yakin) ? nokta.x : nokta.z };
  return { duvar: 'ada', x: nokta.x, z: nokta.z };
}

// Modülün kotundaki ve derinliğindeki duvar şeridine giren engeller, duvar boyunca aralık olarak:
// [{ a, b, tur: 'modul' | 'kolon' | 'kiris' | 'pencere' | 'kapi', ad, kertme (dolap bu engele göre kertilebilir), alt (engelin alt kotu) }]
export function seritEngelleri(proje, aday) {
  const { oda } = proje, boy = duvarBoyu(aday.duvar, oda), [e0, e1] = xEksenli(aday.duvar) ? ['x0', 'x1'] : ['z0', 'z1'];
  const s = kutu({ ...aday, x: 0, w: boy }, oda, KAPAK_K), out = [];
  const ekle = (k, tur, ad, kertme = false) => {
    if (!kesisir(s, k)) return;
    const a = Math.max(0, k[e0]), b = Math.min(boy, k[e1]);
    if (b - a > 0.5) out.push({ a, b, tur, ad, kertme, alt: k.y0 });
  };
  for (const o of proje.moduller) {
    if (o.id === aday.id || tesisatMi(o)) continue;
    const tur = o.tip === 'kolon' ? 'kolon' : o.tip === 'kiris' ? 'kiris' : o.tip === 'pencere' ? 'pencere' : o.tip === 'kapi' ? 'kapi' : 'modul';
    const ad = tur === 'modul' ? TANIM[o.tip].ad + (o.duvar !== aday.duvar && o.duvar !== 'ada' ? ` (${duvarAdi(o.duvar).toLocaleLowerCase('tr')})` : '') : { kolon: 'kolon', kiris: 'kiriş', pencere: 'pencere', kapi: 'kapı' }[tur];
    ekle(kutu(o, oda, KAPAK_K), tur, ad, engelMi(o) && kertilirMi(aday));
  }
  for (const e of acikliklar(proje)) ekle(e.k, e.pencere ? 'pencere' : 'kapi', e.pencere ? 'pencere' : /açılma|kayma/.test(e.neden) ? 'kapının açılma alanı' : 'kapı');
  return out;
}

// Engellerin arasında kalan boşluklar: [{ g0, g1, sol, sag }] (sol ve sag: boşluğu sınırlayan engel; duvar köşesinde null)
export function bosluklar(engeller, boy) {
  const out = [];
  let bas = 0, sol = null;
  for (const e of [...engeller].sort((p, q) => p.a - q.a)) {
    if (e.a - bas >= 1) out.push({ g0: Math.ceil(bas - 0.01), g1: Math.floor(e.a + 0.01), sol, sag: e });
    if (e.b > bas) { bas = e.b; sol = e; }
  }
  if (boy - bas >= 1) out.push({ g0: Math.ceil(bas - 0.01), g1: Math.floor(boy + 0.01), sol, sag: null });
  return out;
}
const bosluktaki = (l, a) => l.find(g => a >= g.g0 && a <= g.g1) || [...l].sort((p, q) => Math.min(Math.abs(a - p.g0), Math.abs(a - p.g1)) - Math.min(Math.abs(a - q.g0), Math.abs(a - q.g1)))[0] || null;
// Boşluğun içinde tıklanan noktaya en yakın yer (10 mm'ye yuvarlanır); kenara YAKALA kadar yakınsa kenara dayanır. Sığmıyorsa null.
function yerlestir(g, a, w, yakala = YAKALA) {
  if (!g || g.g1 - g.g0 < w) return null;
  const x = sinirla(Math.round((a - w / 2) / 10) * 10, g.g0, g.g1 - w), sl = x - g.g0, sg = g.g1 - (x + w);
  return (Math.min(sl, sg) > yakala ? x : sl <= sg ? g.g0 : g.g1 - w) + 0; // + 0: eksi sıfır çıkmasın
}
const sinirAdi = e => e ? e.ad : 'duvar köşesi';

// Tavana göre yükseklik: sığıyorsa aynen; eğimli tavanda sade dolabın üstü eğik kesilir; olmuyorsa kısaltılır. Hiçbiri olmuyorsa null.
function tavanaGore(proje, aday) {
  const { oda } = proje, duz = proje.ayar?.asmaTavan && aday.duvar !== 'ada' ? oda.h - 150 : oda.h, sinir = tavanSiniri(proje, aday);
  if (aday.y + aday.h <= sinir + 0.5) return { aday, not: '' };
  if (!dolapMi(aday)) return { aday, not: '' }; // oda öğeleri ve dekor kısaltılmaz; uyarı çizimde görünür
  const egimli = proje.ayar?.egim?.duvar && tavanYuksekligi(proje, kutu(aday, oda)) < oda.h;
  if (egimli && EGIK_OLUR.has(aday.tip)) {
    const y = { ...aday, egikKes: 1 }, d = egikDuzlem(y, proje);
    if (d && Math.min(d.h0, d.h1) >= 250) { if (y.y + y.h > duz) y.h = Math.floor(duz - y.y); return { aday: y, not: 'üstü tavanın eğimine göre kesilir' }; }
  }
  const yh = Math.floor(sinir - aday.y);
  if (yh >= enAzYukseklik(aday) && yh < aday.h) return { aday: { ...aday, h: yh }, not: `${egimli ? 'eğimli tavana' : 'tavana'} göre ${yh} mm'ye kısaltılır` };
  return null;
}

// Bir dolabı duvarda tıklanan yere oturtur. Dönen: { secenekler, durum, mesaj }
function duvaraOturt(proje, m, duvar, a, ic = false) {
  const { oda, moduller } = proje, boy = duvarBoyu(duvar, oda), temel = { ...m, duvar, x: 0 };
  const engel = seritEngelleri(proje, temel), tum = bosluklar(engel, boy), kertmeli = bosluklar(engel.filter(e => !e.kertme), boy);
  const alanlar = acikliklar(proje), secenekler = [], daralir = DARALIR.has(m.tip), yakala = kavisTipi(m) ? KAVIS_YAKALA : YAKALA;
  // Köşe ve kavis yönü: kavis sıranın açık ucuna bakar (bir yanı dolu, öbür yanı boşsa); L köşede köşe duvarın başında sayılır
  const yonBul = aday => {
    if (m.tip.endsWith('_lkose')) return ters(sonYan(duvar));
    if (!kavisTipi(m)) return m.korYon;
    const basDolu = aday.x <= 0.5 || engel.some(e => Math.abs(e.b - aday.x) <= 1.5), sonDolu = aday.x + aday.w >= boy - 0.5 || engel.some(e => Math.abs(e.a - (aday.x + aday.w)) <= 1.5);
    return basDolu && !sonDolu ? sonYan(duvar) : sonDolu && !basDolu ? ters(sonYan(duvar)) : duvar === 'sol' ? 'sol' : 'sag';
  };
  const gecerli = (aday, kert) => aday.x >= 0 && aday.x + aday.w <= boy + 0.5 && serbestMi(aday, moduller, oda, !kert) && !alanlar.some(e => kesisir(e.k, kutu(aday, oda, KAPAK_K)));
  const ekle = (ad, aciklama, deg, kert = false) => {
    const aday0 = { ...temel, ...deg };
    if (deg.w != null && m.kapak) aday0.kapak = aday0.w >= 700 ? 2 : 1;
    const t = tavanaGore(proje, aday0);
    if (!t || !gecerli(t.aday, kert)) return false;
    if (m.korYon !== undefined) t.aday = { ...t.aday, korYon: yonBul(t.aday) };
    const o = ozet(t.aday);
    if (secenekler.some(s => JSON.stringify(s.deg) === JSON.stringify(o))) return false;
    secenekler.push({ ad, aciklama: [aciklama, t.not].filter(Boolean).join('; '), deg: o, ...(kert ? { kertme: true } : {}) });
    return true;
  };
  // kolona ya da kirişe göre kert: ölçü değişmez, gövde engelin çevresinden kesilir (kertme gövdeyi yutmuyorsa).
  // yalnizKolon: yalnızca kolona göre kertme (kirişe değen kertme sayılmaz). Eklendiyse true döner.
  const kertmeEkle = (yalnizKolon = false) => {
    const gk = bosluktaki(kertmeli, a), xk = kertilirMi(m) ? yerlestir(gk, a, m.w, yakala) : null;
    if (xk == null) return false;
    if (yalnizKolon && !engel.filter(e => e.kertme && e.a < xk + m.w - 0.5 && e.b > xk + 0.5).every(e => e.tur === 'kolon')) return false;
    const kert = kertmeOlculeri({ ...temel, x: xk }, proje);
    const kalir = k => k.derinlik + k.arkadan <= m.d - KERTME_ON; // engelin önünde gövde kalmalı: dolap kadar derin kolonda kapak kolona çarpar, kertme önerilmez
    return kert.length > 0 && kert.every(kalir) && ekle('Kertmeli oturt', `ölçü değişmez; gövde ${kert.map(k => k.metin).join(' ve ')} kertilir`, { x: xk }, true);
  };
  const g = bosluktaki(tum, a), G = g ? g.g1 - g.g0 : 0;
  const x0 = yerlestir(g, a, m.w, yakala);
  let durum = '';
  if (x0 != null) {
    const kaydi = Math.abs(x0 + m.w / 2 - a) > m.w / 2 + 1; // tıklanan nokta modülün dışında kaldı: orası doluydu
    const ustunde = engel.some(e => e.kertme && a >= e.a && a <= e.b); // kolonun ya da kirişin üstüne tıklandı
    // Kolonun üstüne tıklandı: önce kertmeli oturtulur (kullanıcının 2026-11-22 kararı); yanındaki boşluk öteki seçenek olur
    if (ustunde && kertmeEkle(true)) durum = 'Tıklanan yerde kolon var; dolap kolonun çevresinden kertilerek kondu.';
    else if (kaydi) durum = `Tıklanan yer dolu (${[...new Set(engel.filter(e => a >= e.a && a <= e.b).map(e => e.ad))].join(', ') || 'engel'}); modül yanındaki boşluğa kondu.`;
    ekle(`${m.w} mm, ${kaydi ? 'yanındaki boşluğa' : 'tıklanan yere'}`, 'ölçü değişmeden sığıyor', { x: x0 });
    const artik = G - m.w;
    if (daralir && artik > 0 && artik < ARTIK && G <= EN_GENIS) ekle(`Boşluğu doldur: ${G} mm`, `yanında ${artik} mm boşluk kalıyor, dolap almaz; genişletilirse boşluk kapanır`, { x: g.g0, w: G });
    if (ustunde) kertmeEkle(); // kirişin üstüne tıklandı: kertmeli de olur (kolon yukarıda ilk seçenek olarak eklendi)
  } else {
    durum = g ? `Tıklanan yerde ${G} mm yer var (bir yanı ${sinirAdi(g.sol)}, öbür yanı ${sinirAdi(g.sag)}); modül ${m.w} mm.` : `${duvarAdi(duvar)}da bu kotta boş yer yok.`;
    // 0) dolap kolona denk geliyor: önce kertmeli oturtulur (kullanıcının 2026-11-22 kararı); daraltma ve kaydırma öteki seçenek olur
    kertmeEkle(true);
    // 1) boşluğa göre daralt
    if (g && daralir && G >= EN_DAR && G < m.w) ekle(`Boşluğa sığdır: ${G} mm`, `${sinirAdi(g.sol)} ile ${sinirAdi(g.sag)} arasına göre daraltılır`, { x: g.g0, w: G });
    // 2) kirişin altına kısalt (kiriş çoğunlukla duvar boyuncadır: yana kaçmak çözmez)
    const kirisler = engel.filter(e => e.tur === 'kiris' && a >= e.a - m.w && a <= e.b + m.w);
    if (!ic && kirisler.length) {
      const yh = Math.floor(Math.min(...kirisler.map(e => e.alt)) - m.y);
      if (yh >= enAzYukseklik(m) && yh < m.h) {
        const alt = duvaraOturt(proje, { ...m, h: yh }, duvar, a, true).secenekler[0];
        if (alt) { secenekler.push({ ...alt, ad: `Kirişin altına kısalt: ${yh} mm yükseklik`, aciklama: `kirişe girmemesi için ${m.h} mm yerine ${yh} mm` + (alt.deg.w !== m.w ? `, genişlik ${alt.deg.w} mm` : '') }); }
      }
    }
    // 3) kirişe göre kert (kolon yukarıda ilk seçenek olarak eklendi)
    kertmeEkle();
    // 4) tam ölçüde en yakın boş yere kaydır
    const sigan = tum.filter(q => q.g1 - q.g0 >= m.w).map(q => ({ q, x: yerlestir(q, a, m.w, yakala) })).sort((p, q) => Math.abs(p.x + m.w / 2 - a) - Math.abs(q.x + m.w / 2 - a))[0];
    if (sigan) ekle(`${m.w} mm, en yakın boş yere`, `ölçü değişmez; tıklanan yerden ${Math.round(Math.abs(sigan.x + m.w / 2 - a))} mm öteye konur`, { x: sigan.x });
  }
  const mesaj = secenekler.length ? '' : `${duvarAdi(duvar)}: ${TANIM[m.tip].ad} için uygun yer yok. ${durum}`.trim();
  return { secenekler, durum, mesaj };
}

// Köşe modülü (L köşe, kör köşe): tıklanan duvarın yakın köşesine oturur, köşe yönü ona göre seçilir; öbür köşe ikinci seçenektir.
// İki köşe de doluysa duvarda boş yere konur.
function koseyeOturt(proje, m, duvar, a) {
  const { oda, moduller } = proje, boy = duvarBoyu(duvar, oda), alanlar = acikliklar(proje), bulunan = [];
  const uclar = [{ x: 0, korYon: ters(sonYan(duvar)), komsu: KOMSU[duvar][0] }, { x: Math.max(0, boy - m.w), korYon: sonYan(duvar), komsu: KOMSU[duvar][1] }]
    .sort((p, q) => Math.abs(p.x + m.w / 2 - a) - Math.abs(q.x + m.w / 2 - a));
  uclar.forEach((u, i) => {
    const t = tavanaGore(proje, { ...m, duvar, x: u.x, korYon: u.korYon });
    if (!t || t.aday.x + t.aday.w > boy + 0.5 || !serbestMi(t.aday, moduller, oda, true) || alanlar.some(e => kesisir(e.k, kutu(t.aday, oda, KAPAK_K)))) return;
    bulunan.push({ i, s: { ad: `${duvarAdi(duvar)} – ${duvarAdi(u.komsu)} köşesine`, aciklama: [i ? 'duvarın öbür köşesi' : 'tıklanan yere yakın köşe', t.not].filter(Boolean).join('; '), deg: ozet(t.aday) } });
  });
  if (bulunan.length) return { secenekler: bulunan.map(b => b.s), durum: bulunan[0].i ? 'Yakın köşe dolu; modül duvarın öbür köşesine kondu.' : '', mesaj: '' };
  const r = duvaraOturt(proje, m, duvar, a);
  return { ...r, durum: `${duvarAdi(duvar)}ın iki köşesi de dolu; köşe modülü duvarda boş yere kondu. ${r.durum}`.trim() };
}

// Serbest (ada) yerleşim: tıklanan nokta modülün ortasıdır; çakışıyorsa en yakın boş yere kayar
function adayaOturt(proje, m, x, z) {
  const { oda, moduller } = proje, rot = adaTipi(m) ? 0 : 2, temel = { ...m, duvar: 'ada', rot };
  const [gw, gd] = rot % 2 === 0 ? [m.w, m.d] : [m.d, m.w];
  const alanlar = acikliklar(proje).filter(e => dolapMi(m) || e.kapi), secenekler = [];
  const dene = (ax, az) => {
    const t = tavanaGore(proje, { ...temel, x: ax, z: az });
    if (!t) return null;
    const k = kutu(t.aday, oda, KAPAK_K);
    return k.x0 >= -0.5 && k.z0 >= -0.5 && k.x1 <= oda.w + 0.5 && k.z1 <= oda.d + 0.5 && serbestMi(t.aday, moduller, oda, true) && !alanlar.some(e => kesisir(e.k, k)) ? t : null;
  };
  const yuv = v => Math.round(v / 10) * 10;
  const ix = sinirla(yuv(x - gw / 2), 0, oda.w - gw), iz = sinirla(yuv(z - gd / 2), 0, oda.d - gd);
  const ilk = dene(ix, iz);
  if (ilk) secenekler.push({ ad: 'Tıklanan yere', aciklama: ['olduğu gibi sığıyor', ilk.not].filter(Boolean).join('; '), deg: ozet(ilk.aday) });
  else {
    let en = null;
    for (let ax = 0; ax <= oda.w - gw; ax += 50) for (let az = 0; az <= oda.d - gd; az += 50) {
      const u = Math.hypot(ax - ix, az - iz);
      if (en && u >= en.u) continue;
      const t = dene(ax, az);
      if (t) en = { u, t };
    }
    if (en) secenekler.push({ ad: 'En yakın boş yere', aciklama: [`tıklanan yer dolu; ${Math.round(en.u)} mm öteye konur`, en.t.not].filter(Boolean).join('; '), deg: ozet(en.t.aday) });
  }
  const durum = ilk ? '' : 'Tıklanan yer dolu ya da bir kapının önünde.';
  return { secenekler, durum, mesaj: secenekler.length ? '' : `${TANIM[m.tip].ad} için odada boş yer yok.` };
}

// Seçilen modülü (m: ölçüleri hazır şablon) tıklanan noktaya oturtur.
// Dönen: { hedef, secenekler: [{ ad, aciklama, deg, kertme? }], durum, mesaj }.
// secenekler[0] uygulanacak olandır; deg modüle yazılacak alanlardır (duvar, x, z, rot, y, w, h, kapak, egikKes).
export function oturt(proje, m, nokta) {
  const { oda, moduller } = proje, hedef = hedefCoz(m, nokta, oda);
  if (hedef.duvar === 'ada') return { hedef, ...adayaOturt(proje, m, hedef.x, hedef.z) };
  const boy = duvarBoyu(hedef.duvar, oda);
  if (dolapMi(m)) return { hedef, ...(koseTipi(m) ? koseyeOturt : duvaraOturt)(proje, m, hedef.duvar, sinirla(hedef.a, 0, boy)) };
  // oda öğeleri ve tesisat: tıklanan yere; tesisat tıklanan kota (10 mm'ye yuvarlanır), çakışan öğe en yakın boş kenara kayar
  const aday = { ...m, duvar: hedef.duvar, x: Math.round(sinirla(hedef.a - m.w / 2, 0, boy - m.w)) };
  if (TANIM[m.tip].sinif === 'tesisat') {
    if (hedef.y != null) aday.y = sinirla(Math.round((hedef.y - m.h / 2) / 10) * 10, 0, oda.h - m.h);
    return { hedef, secenekler: [{ ad: 'Tıklanan yere', aciklama: '', deg: ozet(aday) }], durum: '', mesaj: '' };
  }
  const yer = tasimaCoz(aday, { x: aday.x }, moduller, oda);
  if (yer) return { hedef, secenekler: [{ ad: 'Tıklanan yere', aciklama: '', deg: ozet({ ...aday, ...yer }) }], durum: '', mesaj: '' };
  return { hedef, secenekler: [{ ad: 'Tıklanan yere', aciklama: 'başka bir modülle çakışıyor', deg: ozet(aday) }], durum: 'Tıklanan yer dolu; öğe yine de kondu, çizimde uyarı görünür.', mesaj: '' };
}

// "Boş yere koy": duvarda baştan ilk uygun yer. Tıklamadaki kuralların aynısı gözetilir (pencere önü, kapı önü ve açılma alanı, kolon, kiriş, tavan);
// kertme yapılmaz, genişlik değişmez, yükseklik yalnızca tavan için kısalır. Köşe modülü ilk boş köşeye konur.
// Dönen: modüle yazılacak alanlar; uygun yer yoksa null.
export function bosaOturt(proje, m, duvar) {
  if (!dolapMi(m) || !DUVARLAR[duvar] || duvar === 'ada') return null;
  if (koseTipi(m)) return koseyeOturt(proje, m, duvar, 0).secenekler[0]?.deg || null;
  const boy = duvarBoyu(duvar, proje.oda);
  for (const g of bosluklar(seritEngelleri(proje, { ...m, duvar, x: 0 }), boy)) {
    if (g.g1 - g.g0 < m.w) continue;
    const s = duvaraOturt(proje, m, duvar, g.g0 + m.w / 2).secenekler.find(q => !q.kertme && q.deg.x === g.g0 && q.deg.w === m.w);
    if (s) return s.deg;
  }
  return null;
}

// Sürükleyip bırakılan dolap için öneriler. Şu durumlarda üretilir: bırakılmak istenen yer dar olduğu için modül oraya gidemedi;
// modül pencerenin önünde, kapı alanında ya da tavana sığmıyor; kolona ya da kirişe denk geliyor (kertiliyor); yanında dolap almayacak boşluk kalıyor.
// İlk seçenek "olduğu gibi kalsın"dır: hiçbir şey kendiliğinden değişmez. istenenX: sürüklemenin son istediği konum (modülün baş kenarı).
// Dönen: { secenekler, durum } ya da önerecek bir şey yoksa null.
export function tasimaOnerileri(proje, m, istenenX = m.x) {
  if (!dolapMi(m) || !DUVARLAR[m.duvar] || m.duvar === 'ada' || koseTipi(m)) return null;
  const boy = duvarBoyu(m.duvar, proje.oda), merkez = x => sinirla(x + m.w / 2, 0, boy);
  let r = null, engellendi = false;
  if (Math.abs(istenenX - m.x) > 60) { // istenen yer başkaydı: orası dar bir boşluksa öneriler oraya göre üretilir
    const q = duvaraOturt(proje, m, m.duvar, merkez(istenenX));
    if (/^Tıklanan yerde/.test(q.durum)) { r = q; engellendi = true; }
  }
  if (!r) r = duvaraOturt(proje, m, m.duvar, merkez(m.x));
  const sorun = [...new Set(uyarilar(proje).filter(u => u.id === m.id).map(u => u.mesaj))], kertik = kertmeOlculeri(m, proje).length > 0;
  const ayni = d => d.duvar === m.duvar && Math.abs(d.x - m.x) <= 10 && d.w === m.w && d.h === m.h && !d.egikKes === !m.egikKes;
  const diger = r.secenekler.filter(s => !ayni(s.deg)).map(s => ({ ...s, ad: s.ad.replace(/tıklanan yere$/, 'en yakın boş yere'), aciklama: s.aciklama.replace('tıklanan', 'bırakılan') }));
  const doldur = diger.some(s => s.ad.startsWith('Boşluğu doldur'));
  if (!diger.length || !(engellendi || sorun.length || kertik || doldur)) return null;
  const durum = engellendi ? r.durum.replace(/^Tıklanan/, 'Bırakmak istediğiniz')
    : sorun.length ? `Modül ${sorun.join(', ')}.` : kertik ? 'Modül kolona ya da kirişe denk geliyor; gövdesi kertiliyor.' : 'Modülün yanında dolap almayacak kadar dar bir boşluk kalıyor.';
  const simdi = { ad: 'Olduğu gibi kalsın', aciklama: `${m.w} mm, bırakıldığı yerde${kertik ? '; gövde kertilir' : ''}${sorun.length ? '; uyarı sürer' : ''}`, deg: ozet(m) };
  return { secenekler: [simdi, ...diger], durum };
}

// Seçeneği modüle yazar (eğik kesim işareti seçenekte yoksa kaldırılır)
export function secenekUygula(m, deg) {
  Object.assign(m, deg);
  if (!deg.egikKes) delete m.egikKes;
  return m;
}
