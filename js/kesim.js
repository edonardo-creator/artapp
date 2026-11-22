// Kesim listesi: çizimdeki dolapların levha parçaları (ölçü, adet, malzeme, kenar bandı), tezgahlar ve özet.
// Parçalar 3B çizimde kullanılan aynı parça üreticisinden (parcalar) gelir; çizim ile liste birbirini tutar.
import { TANIM, parcalar, projeAyarla, donanimAdi, modulKapakStili, T, ARK, TEZGAH_K, KAPAK_K, YENI_KURAL, RAY, RAY_OLCU, KOSE_KURAL, ARK_KANAL, KANAL_ARKA, KANAL_DERIN } from './moduller.js';
import { kapakStili, aluminyumMu, boyaliMi, camTuru } from './kapaklar.js';
import { DUVAR_LISTE, egikDuzlem, EGIK_OLUR } from './yerlesim.js';
import { parcaRengi, tezgahlar, adaEkleri, tezgahSupurgelikleri, yatayBoyEkseni, bazaKosuda, bazaKosulari } from './ortak.js';
import { kertmeOlculeri } from './kertme.js';
import { odaGorunumleri } from './odalar.js';
import { modulIslemleri, islemOzeti, islemeKurali } from './isleme.js';
import { taclar, tacParcalari, TAC_EN_UZUN, TAC_ALT_EN } from './tac.js';
import { uretimAyari, modulMalzemesi, ozelTur, BANTSIZ_KAPAK } from './uretim.js';

export const LEVHA = { boy: 2800, en: 2100, fire: 0.15 }; // tahmini levha sayısı için: levha ölçüsü ve fire payı
const dolapMi = m => ['alt', 'ust', 'boy'].includes(TANIM[m.tip].sinif);
const yuv = n => Math.round(n);
const kac = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Teknik çizimdeki numaralarla aynı sıra: arka, sol, sağ, ön, ada; her duvarda alttan üste ve soldan sağa
export function modulNumaralari(p) {
  const no = {}, sirali = [];
  let n = 0;
  for (const d of [...DUVAR_LISTE, 'ada'])
    for (const m of p.moduller.filter(o => o.duvar === d && dolapMi(o)).sort((a, b) => a.y - b.y || a.x - b.x)) { no[m.id] = ++n; sirali.push(m); }
  return { no, sirali };
}

// Bir modülün levha parçaları: [{ malzeme, tur, renk, kalinlik, ad, boy, en, adet, bant (mm) }] ve elle bakılacaklar.
// tur: gövde ve kapak parçasında malzeme türü (Suntalam, MDFlam, Lake…): modüle özel seçim, yoksa projenin türü; öbür malzemelerde boş.
export function modulKesimi(m, p) {
  const out = [], ozel = [], kavisli = [], mm = modulMalzemesi(m, p);
  const ekle = (malzeme, renk, kalinlik, ad, boy, en, bant = 0, adet = 1) => out.push({ malzeme, tur: malzeme === 'Gövde' ? mm.govde : malzeme === 'Kapak' ? mm.kapak : '', renk, kalinlik: yuv(kalinlik), ad, boy: yuv(boy), en: yuv(en), adet, bant: yuv(bant) });
  const r = p.renk || {};
  for (const q of parcalar(m)) {
    if (q.sus || q.tur === 'kulp' || q.tur === 'cihaz' || q.mat === 'tezgah') continue; // süsleme ayrı kesilen parça değildir
    if (q.camTur) { // katalogdan gelen kapak camı: türüyle birlikte yazılır (lakobel ve ayna da camdır)
      ekle('Cam', '', Math.min(q.sx, q.sy, q.sz), `${q.ad} · ${camTuru(q.camTur)[1]}`, q.sy, Math.max(Math.min(q.sx, q.sz) > 30 ? Math.min(q.sx, q.sz) : 0, q.sx > q.sz ? q.sx : q.sz));
      continue;
    }
    if (!['govde', 'kapak', 'baza', 'cam'].includes(q.mat)) continue;
    if (q.sekil) { kavisli.push(q.ad.toLocaleLowerCase('tr')); continue; }
    const renk = q.mat === 'cam' ? '' : parcaRengi(q, m, r);
    if (q.ad === 'Çekmece kasası') { // çizimde tek kutu; listede gövde levhasından kasa parçalarına açılır
      const ro = YENI_KURAL ? RAY_OLCU[RAY] : null; // ray türüne göre ölçü yalnızca yeni kurallarda
      if (ro?.kutu) { // metal yanlı hazır kutu çekmece: yan ve ön kesilmez; taban ve arka gövde levhasından (arka, sığan en yüksek hazır ölçüde)
        const ay = [...ro.arkaYuk].reverse().find(v => v <= q.sy) || ro.arkaYuk[0];
        ekle('Gövde', renk, T, 'Çekmece tabanı', q.sx, q.sz);
        ekle('Gövde', renk, T, 'Çekmece arkası', q.sx - ro.arkaFark, ay, q.sx - ro.arkaFark);
        continue;
      }
      ekle('Gövde', renk, T, 'Çekmece yanı', q.sz, q.sy, q.sz, 2);
      ekle('Gövde', renk, T, 'Çekmece ön–arka', q.sx - 2 * T, ro ? q.sy - ro.alt : q.sy, q.sx - 2 * T, 2); // yeni kuralda ön ve arka yandan alçak (teleskopik 10, gizli ray 20 mm)
      ekle('Arkalık', renk, ARK, 'Çekmece tabanı', YENI_KURAL ? q.sx : q.sz, YENI_KURAL ? q.sz : q.sx); // yeni kuralda genişlik önce (örnek CAM listesi: 538 × 500)
      continue;
    }
    const enKucuk = Math.min(q.sx, q.sy, q.sz);
    if (q.mat === 'baza') { // çizimde dolu blok; kesilecek olan ön yüzdeki baza levhasıdır
      if (q.sx > 25 && bazaKosuda(m)) continue; // duvara dayalı düz dolap (yeni kural): baza koşu olarak tek parça yazılır (kesimListesi)
      const bb = q.sx <= 25 ? q.sz : q.sx;
      ekle('Baza', renk, enKucuk <= 25 ? enKucuk : T, 'Baza önü', bb, q.sy, YENI_KURAL ? bb : 0); // yeni kuralda üst kenarı bantlı
      continue;
    }
    if (enKucuk > 25) { ozel.push(`${q.ad}: levha değil (${yuv(q.sx)} × ${yuv(q.sy)} × ${yuv(q.sz)} mm), elle bakın`); continue; }
    // kalınlık en küçük ölçüdür; dik duran parçada boy yüksekliktir (desen yönü), yatay gövde parçasında dolabın önüne bakan kenar, öbür yatay parçalarda uzun kenar
    const dik = q.sy !== enKucuk;
    const kalan = q.sx === enKucuk ? [q.sy, q.sz] : q.sy === enKucuk ? [q.sx, q.sz] : [q.sx, q.sy];
    // dar çıtada (çerçeve, kayıt) boy her zaman uzun kenardır
    const serit = Math.min(...kalan) < 120;
    let boy = dik && !serit ? q.sy : Math.max(...kalan), en = dik && !serit ? (q.sx === enKucuk ? q.sz : q.sx) : Math.min(...kalan);
    if (!dik && q.mat === 'govde') [boy, en] = yatayBoyEkseni(q, m) === 'x' ? [q.sx, q.sz] : [q.sz, q.sx]; // tabla ve raf: ön kenar boydur, bant oraya yazılır
    if (q.mat === 'cam') { ekle('Cam', '', enKucuk, q.ad, boy, en); continue; }
    // görünen yüz: dört kenar bantlı; boyalı (lake) kapakta bant yok; çerçeveli modelde kalınlık kapağın tam kalınlığıdır
    if (q.mat === 'kapak') { ekle('Kapak', renk, q.kk || enKucuk, q.ad, boy, en, q.bantsiz || BANTSIZ_KAPAK.has(mm.kapak) ? 0 : 2 * (boy + en)); continue; } // lake, membran ve masif kapakta bant yok
    if (enKucuk <= ARK + 0.5 && ARK < T) { ekle('Arkalık', renk, enKucuk, q.ad, boy, en); continue; }
    ekle('Gövde', renk, enKucuk, q.ad, boy, en, boy); // gövde parçası: öne bakan kenar (boy) bantlı
  }
  if (kavisli.length) ozel.push(`Kavisli parçalar şablonla kesilir, listede yok: ${[...new Set(kavisli)].join(', ')}`);
  // Köşe gövdesi kuralı (kanallı arkalık): föyde çıkmayan, elde yapılacak işler
  if (KOSE_KURAL && ARK_KANAL && String(m.tip).includes('kavis')) ozel.push(`Kavisli alt ve üst tablada arkalık kanalı elde açılır: arka kenardan ${String(KANAL_ARKA).replace('.', ',')} mm içeride, ${String(KANAL_DERIN).replace('.', ',')} mm derin`);
  if (KOSE_KURAL && ARK_KANAL && String(m.tip).endsWith('_lkose')) ozel.push('L köşe: iki arkalık köşede birbirine dayanır (orada kanal yoktur), elde tutturulur; raf iki parçadır');
  if (kertmeOlculeri(m, p).length) ozel.push('Kolon ya da kiriş için kertme var: ölçüsü teknik çizimde, modül ayrıntılarında');
  if (m.egikKes && EGIK_OLUR.has(m.tip) && egikDuzlem(m, p)) ozel.push('Üstü eğimli tavana göre kesilir: ölçü ve açı teknik çizimde');
  if (donanimAdi(m)) ozel.push('İç donanım: ' + donanimAdi(m) + ' (hazır alınır, listede yok)');
  { // kapak modeli düz değilse not düşülür: alüminyum çerçeve ayrıca sipariş edilir, lake kapak boyalıdır
    const stil = modulKapakStili(m), st = kapakStili(stil), onVar = out.some(s => s.malzeme === 'Kapak' || s.malzeme === 'Cam');
    if (onVar && aluminyumMu(stil)) ozel.push(`Kapak: ${st.ad}. Alüminyum profil ve cam ayrıca sipariş edilir; listede yalnızca cam ölçüsü var`);
    else if (onVar && boyaliMi(stil)) ozel.push(`Kapak modeli: ${st.ad}. Boyalı (lake) kapak, kenar bandı yok`);
    else if (onVar && st.gorunum !== 'duz') ozel.push(`Kapak modeli: ${st.ad}`);
  }
  for (const s of out) if (Math.max(s.boy, s.en) > LEVHA.boy || Math.min(s.boy, s.en) > LEVHA.en) ozel.push(`${s.ad} ${s.boy} × ${s.en} mm levhadan büyük: ekli yapılır`);
  return { parcalar: out, ozel };
}

// Aynı parçaları birleştirir: malzeme, tür, renk, kalınlık, ad ve ölçüsü aynı olanlar tek satır olur
function birlestir(liste) {
  const m = new Map();
  for (const s of liste) {
    const a = [s.malzeme, s.tur || '', s.renk, s.kalinlik, s.ad, s.boy, s.en].join('|');
    const k = m.get(a);
    if (k) { k.adet += s.adet; k.bant += s.bant * s.adet; if (s.no && !k.moduller.includes(s.no)) k.moduller.push(s.no); }
    else m.set(a, { ...s, bant: s.bant * s.adet, moduller: s.no ? [s.no] : [] });
  }
  const sira = ['Gövde', 'Kapak', 'Arkalık', 'Baza', 'Cam', 'Tezgah'];
  return [...m.values()].sort((a, b) => sira.indexOf(a.malzeme) - sira.indexOf(b.malzeme) || String(a.tur || '').localeCompare(b.tur || '') || String(a.renk).localeCompare(b.renk) || b.kalinlik - a.kalinlik || b.boy - a.boy || b.en - a.en || a.ad.localeCompare(b.ad, 'tr'));
}
export function ozetle(satirlar) {
  const m = new Map();
  for (const s of satirlar) {
    const a = [s.malzeme, s.tur || '', s.renk, s.kalinlik].join('|');
    const k = m.get(a) || m.set(a, { malzeme: s.malzeme, tur: s.tur || '', renk: s.renk, kalinlik: s.kalinlik, adet: 0, alan: 0, bant: 0 }).get(a);
    k.adet += s.adet; k.alan += s.boy * s.en * s.adet / 1e6; k.bant += s.bant / 1000;
  }
  return [...m.values()].map(k => ({ ...k, alan: Math.round(k.alan * 100) / 100, bant: Math.round(k.bant * 10) / 10,
    levha: ['Cam', 'Tezgah'].includes(k.malzeme) ? null : Math.ceil(k.alan / (LEVHA.boy * LEVHA.en / 1e6 * (1 - LEVHA.fire))) }));
}

// Tek odanın (tek oda görünümündeki projenin) kesim listesi
export function kesimListesi(p) {
  projeAyarla(p.ayar);
  const { no, sirali } = modulNumaralari(p), ham = [], ozel = [];
  for (const m of sirali) {
    const k = modulKesimi(m, p);
    for (const s of k.parcalar) ham.push({ ...s, no: no[m.id] });
    for (const o of k.ozel) ozel.push({ no: no[m.id], modul: TANIM[m.tip].ad, not: o });
  }
  const r = p.renk || {}, kapakBantsiz = BANTSIZ_KAPAK.has(uretimAyari(p).kapak); // projenin kapak türü bantsızsa taç ve ada panelleri de bantsızdır
  for (const b of bazaKosulari(p)) { // tek parça baza: bitişik dolaplar boyunca, levha boyundan uzunu bölünür; üst kenarı bantlı
    let kalan = b.boy;
    while (kalan > 0) { const L = Math.min(kalan, TAC_EN_UZUN); ham.push({ malzeme: 'Baza', renk: r.baza || '', kalinlik: yuv(T), ad: 'Baza', boy: L, en: b.h, adet: 1, bant: L }); kalan -= L; }
  }
  for (const t of tezgahlar(p)) {
    const a = t.x1 - t.x0, b = t.z1 - t.z0;
    ham.push({ malzeme: 'Tezgah', renk: r.tezgah || '', kalinlik: TEZGAH_K, ad: 'Tezgah', boy: yuv(Math.max(a, b)), en: yuv(Math.min(a, b)), adet: 1, bant: 0 });
  }
  for (const e of tezgahSupurgelikleri(p)) {
    const o = [e.x1 - e.x0, e.y1 - e.y0, e.z1 - e.z0].sort((a, b) => a - b);
    ham.push({ malzeme: 'Tezgah', renk: r.tezgah || '', kalinlik: yuv(o[0]), ad: 'Tezgah süpürgeliği', boy: yuv(o[2]), en: yuv(o[1]), adet: 1, bant: 0 });
  }
  for (const e of adaEkleri(p)) {
    const o = [e.x1 - e.x0, e.y1 - e.y0, e.z1 - e.z0].sort((a, b) => a - b);
    if (e.tur === 'bar') ham.push({ malzeme: 'Tezgah', renk: r.tezgah || '', kalinlik: yuv(o[0]), ad: 'Bar tablası', boy: yuv(o[2]), en: yuv(o[1]), adet: 1, bant: 0 });
    else ham.push({ malzeme: 'Kapak', renk: r.kapak || '', kalinlik: yuv(o[0]), ad: e.y0 > 0 ? 'Bar dikme paneli' : 'Ada bitiş paneli', boy: yuv(o[2]), en: yuv(o[1]), adet: 1, bant: kapakBantsiz ? 0 : 2 * yuv(o[2] + o[1]) });
  }
  { // Taç: düz MDF taç kapak levhasından, ön + alt iki parça kesilir (koşular ve açıkta kalan uçlardaki yan dönüşler); hazır (lake) taç listede yoktur, metresi not düşülür
    const tc = taclar(p);
    for (const t of tacParcalari(tc)) {
      const boyali = boyaliMi(modulKapakStili(t.ilk)) || kapakBantsiz;
      ham.push({ malzeme: 'Kapak', renk: t.renk || '', kalinlik: yuv(KAPAK_K), ad: t.ad, boy: t.boy, en: t.en, adet: 1, bant: boyali || t.alt ? 0 : 2 * (t.boy + t.en) }); // alt parça dolabın üstüne yatar: bantsız yazılır
    }
    const m = String(tc.metre).replace('.', ',');
    if (tc.ayar.hazir && tc.metre > 0) ozel.push({ no: '—', modul: 'Taç', not: `${tc.ayar.ad} (${tc.ayar.yuk} mm): ${m} m hazır alınır, listede yok. Fire ve köşe birleşimi payını ekleyin` });
    else if (tc.metre > 0) ozel.push({ no: '—', modul: 'Taç', not: `Düz MDF taç ${m} m (ön parça ${tc.ayar.yuk} mm + alt parça ${TAC_ALT_EN} mm): boylar görünen net boydur, köşe birleşimi (gönye) ve alıştırma payını ekleyin${tc.kosular.some(k => k.boy > TAC_EN_UZUN) ? `; ${TAC_EN_UZUN} mm'den uzun koşu ekli yapılır, parçaları ayrı yazıldı` : ''}` });
  }
  { const U = uretimAyari(p); for (const s of ham) if (s.tur == null) s.tur = s.malzeme === 'Gövde' ? U.govde : s.malzeme === 'Kapak' ? U.kapak : ''; } // dolaba bağlı olmayan parçalar (taç, ada paneli) projenin türündedir
  const satirlar = birlestir(ham);
  // her satırın işleme özeti (delik, yuva, kertme): aynı parça farklı dolaplarda farklı işleniyorsa hepsi yazılır
  const islem = new Map();
  const kural = islemeKurali(p);
  for (const m of sirali) for (const P of modulIslemleri(m, kural)) {
    const oz = islemOzeti(P);
    if (!oz) continue;
    const a = [P.malzeme, P.ad, P.boy, P.en, P.kalinlik].join('|'), k = islem.get(a) || islem.set(a, new Set()).get(a);
    k.add(oz);
  }
  for (const s of satirlar) s.islem = [...(islem.get([s.malzeme, s.ad, s.boy, s.en, s.kalinlik].join('|')) || [])].join(' / ');
  return { satirlar, ozel, ozet: ozetle(satirlar), modul: sirali.length };
}

export const BANT_YAZI = s => !s.bant ? '—' : s.malzeme === 'Kapak' ? '4 kenar' : s.malzeme === 'Baza' || /^Çekmece/.test(s.ad) ? '1 boy kenarı (üst)' : '1 boy kenarı (ön)';
// Parçanın küçük şeması: bantlanacak kenarlar kalın ve renkli (kapakta dört kenar, gövde parçasında öne bakan boy kenarı)
export function bantSema(s) {
  if (!s.bant) return '';
  const W = 34, H = 20, o = Math.max(0.3, Math.min(1, s.en / Math.max(1, s.boy))), w = W - 4, h = Math.max(5, Math.round((H - 4) * o)), x = 2, y = (H - h) / 2;
  const kenar = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1f7ae0" stroke-width="2.6" stroke-linecap="round"/>`;
  const dort = s.malzeme === 'Kapak';
  return `<svg class="bantSema" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#9aa3ad" stroke-width="1"/>${kenar(x, y + h, x + w, y + h)}${dort ? kenar(x, y, x + w, y) + kenar(x, y, x, y + h) + kenar(x + w, y, x + w, y + h) : ''}</svg>`;
}
const renkKutu = r => r ? `<i class="renkKutu" style="background:${kac(r)}"></i>` : '';

// Yazdırılabilir sayfalar: her oda için kesim listesi ve özet; birden çok oda varsa sonda toplam
export function kesimSayfa(p) {
  const tarih = new Date().toLocaleDateString('tr-TR'), odalar = odaGorunumleri(p), U = uretimAyari(p);
  const malzemeAdi = s => s.malzeme + (ozelTur(s, U) ? ' · ' + kac(s.tur) : ''); // projenin türünden farklı malzeme adıyla yazılır
  const baslik = (alt, oda) => `<header><h1>${kac(p.ad)}</h1><span>${oda ? kac(oda) + ' — ' : ''}${alt}</span><span>${tarih}</span></header>`;
  const ozetTablo = oz => `<table class="kesimOzet"><thead><tr><th>Malzeme</th><th>Kalınlık</th><th>Parça</th><th>Alan (m²)</th><th>Tahmini levha</th><th>Kenar bandı (m)</th></tr></thead><tbody>`
    + oz.map(k => `<tr><td>${renkKutu(k.renk)}${malzemeAdi(k)}</td><td>${k.kalinlik}</td><td>${k.adet}</td><td>${k.alan.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${k.levha ?? '—'}</td><td>${k.bant ? k.bant.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'}</td></tr>`).join('') + `</tbody></table>`;
  let h = '', hepsi = [];
  for (const g of odalar) {
    const k = kesimListesi(g.proje);
    if (!k.satirlar.length) continue;
    hepsi = hepsi.concat(k.satirlar);
    h += `<section class="sayfa">${baslik('Kesim listesi', g.ad)}
      <table class="kesim"><thead><tr><th>Malzeme</th><th>Parça</th><th>Boy</th><th>En</th><th>Kalınlık</th><th>Adet</th><th>Kenar bandı</th><th>İşleme</th><th>Modül no</th></tr></thead><tbody>`
      + k.satirlar.map(s => `<tr><td>${renkKutu(s.renk)}${malzemeAdi(s)}</td><td>${kac(s.ad)}</td><td>${s.boy}</td><td>${s.en}</td><td>${s.kalinlik}</td><td>${s.adet}</td><td>${bantSema(s)}${BANT_YAZI(s)}</td><td class="islemHucre">${kac(s.islem || '—')}</td><td>${s.moduller.join(', ')}</td></tr>`).join('')
      + `</tbody></table>
      <p class="aciklama">Ölçüler mm, bitmiş (bantlı) ölçüdür. Boy: dik parçada yükseklik; tabla ve rafta dolabın önüne bakan kenar (bant bu kenardadır, en ise derinliktir); öbür yatay parçalarda uzun kenar. Modül no teknik çizimdeki numaradır. ${k.modul} modül, ${k.satirlar.reduce((t, s) => t + s.adet, 0)} parça.</p></section>
      <section class="sayfa">${baslik('Kesim özeti', g.ad)}${ozetTablo(k.ozet)}
      ${k.ozel.length ? `<h2 class="araBaslik">Elle bakılacaklar</h2><table><thead><tr><th>Modül no</th><th>Modül</th><th>Not</th></tr></thead><tbody>${k.ozel.map(o => `<tr><td>${o.no}</td><td>${kac(o.modul)}</td><td>${kac(o.not)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${VARSAYIM}</section>`;
  }
  if (!h) return `<section class="sayfa">${baslik('Kesim listesi')}<p class="aciklama">Bu projede kesilecek dolap yok.</p></section>`;
  if (odalar.length > 1) h += `<section class="sayfa">${baslik('Kesim özeti — bütün odalar')}${ozetTablo(ozetle(hepsi))}${VARSAYIM}</section>`;
  return h;
}
const VARSAYIM = `<p class="aciklama"><b>Hesap varsayımları.</b> Levha kalınlıkları ve baza yüksekliği atölye standartlarından alınır. Tahmini levha sayısı ${LEVHA.boy} × ${LEVHA.en} mm levha ve %${LEVHA.fire * 100} fire payıyla alandan hesaplanır; kesin sayı kesim planıyla belli olur.
  Kenar bandı: kapak, çekmece önü ve bitiş panellerinde dört kenar; gövde parçalarında öne bakan kenar (listede “boy” yazan kenar). Çekmece kasaları gövde levhasından hesaplanır; hazır çekmece sistemi kullanıyorsanız bu satırları çıkarın.
  Arkalık ölçüsü “Atölye standartları”ndaki bağlantıya göredir: kanallıda kanalın dibine kadar girecek ölçüde, çakmada gövdenin dış ölçüsünde.
  Baza duvara dayalı bitişik dolaplarda tek parça yazılır (2780 mm'den uzunu bölünür) ve üst kenarı bantlıdır; L köşe, kavisli ve ada dolaplarında, ayrıca 22 Kasım 2026'dan önceki projelerde modül başına ayrı yazılır. Taç bitişik dolapların üstünde tek parça yazılır; açıkta kalan uçlara yan dönüş parçası eklenir. Düz MDF taç kapak levhasındandır ve iki parçadır: dört kenarı bantlı ön parça ve dolabın üstüne yatan, bantsız yazılan ${TAC_ALT_EN} mm'lik alt parça; lake taç hazır alınır.
  Menteşe, ray, kulp ve cihazlar bu listede yoktur.</p>`;

// Kesim programlarına ve Excel'e aktarmak için (noktalı virgülle ayrılmış, bütün odalar)
export function kesimCsv(p) {
  const s = ['Oda;Malzeme;Renk;Kalınlık;Parça;Boy;En;Adet;Kenar bandı;Modül no;İşleme'];
  for (const g of odaGorunumleri(p))
    for (const k of kesimListesi(g.proje).satirlar)
      s.push([g.ad || '', k.malzeme, k.renk || '', k.kalinlik, k.ad, k.boy, k.en, k.adet, BANT_YAZI(k), k.moduller.join(' '), k.islem || ''].map(v => /[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(';'));
  return '﻿' + s.join('\r\n') + '\r\n';
}
