// Hırdavat listesi, maliyet hesabı ve müşteri teklifi.
// Miktarlar çizimden gelir: levha sayısı kesim planından, kenar bandı ve tezgah kesim listesinden, donanım modüllerin parçalarından.
// Birim fiyatları kullanıcı girer (fiyat listesi bütün projelerde ortaktır); işçilik, kâr ve KDV projeye yazılır.
import { TANIM, parcalar, projeAyarla, donanimAdi } from './moduller.js';
import { kulpAdi } from './kulplar.js';
import { menteseSayisi } from './isleme.js';
export { menteseSayisi };
import { kesimListesi } from './kesim.js';
import { kesimPlani } from './kesimplan.js';
import { odaGorunumleri } from './odalar.js';
import { taclar } from './tac.js';

const kac = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dolapMi = m => ['alt', 'ust', 'boy'].includes(TANIM[m.tip]?.sinif);
export const MALIYET_VARSAYILAN = { iscilik: 0, nakliye: 0, kar: 0, kdv: 20, iskonto: 0, aksIskonto: 0, nakitIsk: 0, vadeFark: 0, kartKom: 0, gecerlilik: 15, teslim: '', odeme: '', not: '', no: '' };
const para = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
export const tl = n => para.format(Math.round((Number(n) || 0) * 100) / 100);
const sayi = (n, basamak = 1) => (Math.round(n * 10 ** basamak) / 10 ** basamak).toLocaleString('tr-TR');

// Kapak boyuna göre menteşe sayısı
// Üretim ayarları: gövde ve kapak malzemesi, menteşe ve ray türü (projeye yazılır: ayar.uretim)
import { URETIM_SECENEK, BANTSIZ_KAPAK, uretimAyari } from './uretim.js';
export { URETIM_SECENEK, uretimAyari };
// Lake boya sarfiyatı (boyanan m² başına kg): iki kat astar, iki kat son kat; tiner boya ve astarın %30'u
export const BOYA_SARF = { astar: 0.25, sonkat: 0.2, tiner: 0.3 };
// (uretimAyari ve seçenekler uretim.js içindedir)
// Proje analizi: gider grupları ve ağırlık hesabındaki yoğunluklar (kg/m³; yonga levha ve MDF ortalaması, düz cam)
const ANALIZ_GRUPLARI = ['Levha', 'Kenar bandı', 'Tezgah', 'Cam', 'Hırdavat', 'Fason', 'Boya'];
const SECMELI_GRUP = new Set(['Fason', 'Boya']); // fiyatı girilmese de "eksik fiyat" uyarısı vermeyen kalemler
const LEVHA_YOGUNLUK = 720, CAM_YOGUNLUK = 2500;
// (menteşe sayısı kuralı isleme.js içindedir; buradan da dışa verilir)

// Tek odanın donanımı: [{ anahtar, ad, birim, miktar }]
export function hirdavatListesi(p) {
  projeAyarla(p.ayar);
  const m = new Map();
  const ekle = (anahtar, ad, birim, miktar) => { if (miktar > 0) (m.get(anahtar) || m.set(anahtar, { anahtar, ad, birim, miktar: 0 }).get(anahtar)).miktar += miktar; };
  const U = uretimAyari(p), rayAd = Object.fromEntries(URETIM_SECENEK.ray);
  let vida = 0; // gövde birleşimi (yatay parçanın iki ucunda ikişer), menteşe (4), ray takımı (12) ve kulp (2) vidaları
  for (const o of p.moduller) {
    if (!dolapMi(o)) continue;
    const ps = parcalar(o), sinif = TANIM[o.tip].sinif;
    const govdeli = ps.some(q => q.ad === 'Alt tabla' || q.ad === 'Üst tabla');
    for (const q of ps) {
      const kapakMi = !q.onBagli && (q.mentese || (q.ad === 'Kapak' && q.mat === 'kapak') || q.ad === 'Kavisli kapak'); // mekanizmaya bağlı kapakta menteşe yok
      if (kapakMi && q.mentese === 'ust') ekle('kalkar', 'Kalkar kapak mekanizması', 'takım', 1); // yukarı açılan kapak: menteşe yerine mekanizma
      else if (kapakMi) ekle(U.mentese === 'frenli' ? 'mentese' : 'mentese|frensiz', `Menteşe (${U.mentese === 'frenli' ? 'frenli' : 'frensiz'})`, 'adet', menteseSayisi(Number.isFinite(q.sy) ? q.sy : o.h));
      if (q.ad === 'Çekmece kasası') { const boy = Math.min(600, Math.max(250, Math.floor(q.sz / 50) * 50)); ekle('ray|' + boy + (U.ray === 'teleskopik' ? '' : '|' + U.ray), `Çekmece rayı ${boy} mm${U.ray === 'teleskopik' ? '' : ' · ' + rayAd[U.ray].toLocaleLowerCase('tr')}`, 'takım', 1); }
      if (q.ad === 'Raf') ekle('rafpimi', 'Raf pimi', 'adet', 4);
      else if (q.mat === 'govde' && !q.sekil && !q.sus && Number.isFinite(q.sy) && q.sy <= 25 && q.sy <= q.sx && q.sy <= q.sz && q.ad !== 'Çekmece kasası') vida += 4;
      if (kapakMi && q.mentese !== 'ust') vida += 4 * menteseSayisi(Number.isFinite(q.sy) ? q.sy : o.h);
      if (q.ad === 'Çekmece kasası') vida += 12;
      if (q.tur === 'kulp' && q.mat === 'kulp' && !q.kulpEk) vida += 2;
      if (q.tur === 'kulp' && q.mat === 'kulp' && !q.kulpEk) { const kod = o.kulp || 'cubuk'; ekle('kulp|' + kod, kulpAdi(kod), 'adet', 1); } // çok parçalı kulp bir kez sayılır
    }
    if (o.kulp === 'gola' && ps.some(q => q.mat === 'kapak')) ekle('gola', 'Gola profili', 'm', o.w / 1000 * (ps.filter(q => q.ad === 'Çekmece önü').length > 1 ? 2 : 1));
    const baza = ps.filter(q => q.ad === 'Baza').length;
    if (baza && govdeli) { ekle('ayak', 'Dolap ayağı', 'adet', baza > 1 || o.w > 900 ? 6 : 4); ekle('bazaklips', 'Baza klipsi', 'adet', 2); }
    if (sinif === 'ust' && govdeli) ekle('aski', 'Üst dolap askısı', 'adet', 2);
    if (donanimAdi(o)) ekle('donanim|' + o.donanim, donanimAdi(o), 'adet', 1);
  }
  if (vida) ekle('vida', 'Vida (tahmini, %10 fire payıyla)', 'adet', Math.ceil(vida * 1.1 / 10) * 10);
  if (p.ayar?.led) ekle('led', 'LED şerit (tezgah ışığı)', 'm', p.moduller.filter(o => TANIM[o.tip].sinif === 'ust' && !o.tip.startsWith('davlumbaz')).reduce((t, o) => t + o.w, 0) / 1000);
  const sira = ['mentese', 'kalkar', 'ray', 'kulp', 'gola', 'ayak', 'bazaklips', 'aski', 'rafpimi', 'vida', 'led', 'donanim'];
  return [...m.values()].map(k => ({ ...k, miktar: Math.round(k.miktar * 10) / 10 }))
    .sort((a, b) => sira.indexOf(a.anahtar.split('|')[0]) - sira.indexOf(b.anahtar.split('|')[0]) || a.ad.localeCompare(b.ad, 'tr', { numeric: true }));
}

// Bütün odaların donanımı tek listede
export function projeHirdavati(p) {
  const m = new Map();
  for (const g of odaGorunumleri(p))
    for (const k of hirdavatListesi(g.proje)) { const e = m.get(k.anahtar); if (e) e.miktar = Math.round((e.miktar + k.miktar) * 10) / 10; else m.set(k.anahtar, { ...k }); }
  projeAyarla(p.ayar);
  return [...m.values()];
}

export function maliyetAyari(p) {
  const a = { ...MALIYET_VARSAYILAN, ...(p.ayar?.maliyet || {}) };
  for (const k of ['iscilik', 'nakliye', 'kar', 'kdv', 'iskonto', 'aksIskonto', 'nakitIsk', 'vadeFark', 'kartKom', 'gecerlilik']) { const v = Number(a[k]); a[k] = Number.isFinite(v) && v >= 0 ? v : MALIYET_VARSAYILAN[k]; }
  a.kar = Math.min(a.kar, 500); a.kdv = Math.min(a.kdv, 100); a.iskonto = Math.min(a.iskonto, 100); a.aksIskonto = Math.min(a.aksIskonto, 100); a.nakitIsk = Math.min(a.nakitIsk, 100); a.vadeFark = Math.min(a.vadeFark, 200); a.kartKom = Math.min(a.kartKom, 100);
  a.teslim = String(a.teslim || '').slice(0, 80); a.not = String(a.not || '').slice(0, 400);
  a.odeme = String(a.odeme || '').slice(0, 200); a.no = String(a.no || '').trim().slice(0, 24);
  return a;
}

// Maliyet hesabı. fiyat: { anahtar: birim fiyat (TL) }
export function maliyet(p, fiyat = {}) {
  const kalemler = [];
  const ekle = (grup, anahtar, ad, miktar, birim, renk = '') => {
    if (!(miktar > 0)) return;
    const f = Number(fiyat[anahtar]);
    const birimFiyat = Number.isFinite(f) && f > 0 ? f : 0;
    kalemler.push({ grup, anahtar, ad, renk, miktar, birim, fiyat: birimFiyat, tutar: Math.round(miktar * birimFiyat * 100) / 100 });
  };
  const plan = kesimPlani(p), U = uretimAyari(p);
  for (const g of plan.gruplar) { // levha fiyatı malzeme türüne göre ayrı tutulur (varsayılan türlerde eski anahtar korunur)
    // tür kesim planı grubundan gelir (modül kendi malzemesini seçmiş olabilir); yoksa projenin türü
    const tur = g.tur || (g.malzeme === 'Kapak' ? U.kapak : g.malzeme === 'Gövde' ? U.govde : ''), ozel = tur && tur !== (g.malzeme === 'Kapak' ? 'MDFlam' : 'Suntalam');
    const anahtar = `levha|${g.malzeme}|${g.kalinlik}${ozel ? '|' + tur : ''}`, var_ = kalemler.find(k => k.anahtar === anahtar && k.renk === g.renk);
    if (!var_) ekle('Levha', anahtar, `${g.malzeme} levhası ${g.kalinlik} mm${tur ? ' · ' + tur : ''}`, g.levhalar.length, 'levha', g.renk);
  }
  const bant = new Map(), diger = { tezgah: 0, tezgahSup: 0, cam: 0 }, hazirTac = new Map();
  let islemeli = 0, kapakAlan = 0, boyaliAlan = 0, laminatAlan = 0; // fason işleme, pres ve boya hesabı için
  let mtul = 0, agirlik = 0, hacim = 0; // proje analizi: dolap metresi, levha ve cam ağırlığı (kg), toplanmış dolapların hacmi (m³)
  for (const g of odaGorunumleri(p)) {
    for (const o of g.proje.moduller) if (dolapMi(o) && TANIM[o.tip].grup !== 'Bitiş parçaları' && !['buzdolabi', 'davlumbaz', 'davlumbaz_ada'].includes(o.tip)) { mtul += o.w / 1000; hacim += o.w * o.h * o.d / 1e9; }
    for (const s of kesimListesi(g.proje).satirlar) {
      const kapakTur = s.malzeme === 'Kapak' ? s.tur || U.kapak : ''; // satırın kendi kapak türü (modüle özel olabilir)
      if (s.bant && !(s.malzeme === 'Kapak' && BANTSIZ_KAPAK.has(kapakTur))) bant.set(s.malzeme, (bant.get(s.malzeme) || 0) + s.bant / 1000);
      if (s.islem) islemeli += s.adet;
      if (s.malzeme === 'Kapak') { const alan = s.boy * s.en * s.adet / 1e6; kapakAlan += alan; if (kapakTur === 'Lake' || (!s.bant && !BANTSIZ_KAPAK.has(kapakTur))) boyaliAlan += alan; /* boyalı: lake türü ya da boyalı (lake) kapak modeli; membran ve masif boyanmaz */ if (kapakTur === 'Laminat') laminatAlan += alan; }
      if (s.malzeme === 'Tezgah') diger[s.ad === 'Tezgah süpürgeliği' ? 'tezgahSup' : 'tezgah'] += s.boy * s.adet / 1000;
      if (s.malzeme === 'Cam') diger.cam += s.boy * s.en * s.adet / 1e6;
      if (s.malzeme !== 'Tezgah') agirlik += s.boy * s.en * s.adet / 1e6 * s.kalinlik / 1000 * (s.malzeme === 'Cam' ? CAM_YOGUNLUK : LEVHA_YOGUNLUK);
    }
    projeAyarla(g.proje.ayar);
    const tc = taclar(g.proje); // hazır (lake) taç: koşular ve yan dönüşlerin toplam boyu
    if (tc.ayar.hazir && tc.metre > 0) {
      const a = 'tac|' + tc.ayar.kod, e = hazirTac.get(a) || hazirTac.set(a, { ad: `Hazır taç · ${tc.ayar.ad} (${tc.ayar.yuk} mm)`, metre: 0 }).get(a);
      e.metre += tc.metre;
    }
  }
  for (const [malzeme, m] of bant) ekle('Kenar bandı', 'bant|' + malzeme, `${malzeme} kenar bandı`, Math.round(m * 10) / 10, 'm');
  ekle('Tezgah', 'tezgah', 'Tezgah', Math.round(diger.tezgah * 100) / 100, 'm');
  ekle('Tezgah', 'tezgahSup', 'Tezgah süpürgeliği', Math.round(diger.tezgahSup * 100) / 100, 'm');
  ekle('Cam', 'cam', 'Kapak camı', Math.round(diger.cam * 100) / 100, 'm²');
  for (const h of projeHirdavati(p)) ekle('Hırdavat', h.anahtar, h.ad, h.miktar, h.birim);
  for (const [a, e] of hazirTac) ekle('Hırdavat', a, e.ad, Math.round(e.metre * 100) / 100, 'm');
  // Fason: dışarıda yaptırılan kesim, bantlama, delik ve pres (fiyatı girilirse hesaba girer)
  ekle('Fason', 'fason|kesim', 'Fason kesim (ebatlama)', plan.levha, 'levha');
  ekle('Fason', 'fason|bant', 'Fason bantlama', Math.round([...bant.values()].reduce((t, m) => t + m, 0) * 10) / 10, 'm');
  ekle('Fason', 'fason|isleme', 'Fason delik ve işleme', islemeli, 'parça');
  if (laminatAlan > 0) ekle('Fason', 'fason|pres', 'Laminat pres (iki yüz)', Math.round(laminatAlan * 2 * 100) / 100, 'm²');
  // Lake boya: boyalı kapakların iki yüzü ve kenarları (alanın 2,1 katı)
  const boyaAlan = boyaliAlan * 2.1, kg = n => Math.round(n * 100) / 100;
  ekle('Boya', 'boya|astar', 'Astar', kg(boyaAlan * BOYA_SARF.astar), 'kg');
  ekle('Boya', 'boya|sonkat', 'Son kat boya', kg(boyaAlan * BOYA_SARF.sonkat), 'kg');
  ekle('Boya', 'boya|tiner', 'Tiner', kg(boyaAlan * (BOYA_SARF.astar + BOYA_SARF.sonkat) * BOYA_SARF.tiner), 'kg');
  projeAyarla(p.ayar);
  const a = maliyetAyari(p), y = n => Math.round(n * 100) / 100;
  const malzeme = y(kalemler.reduce((t, k) => t + k.tutar, 0));
  const maliyetToplam = y(malzeme + a.iscilik + a.nakliye), kar = y(maliyetToplam * a.kar / 100), araToplam = y(maliyetToplam + kar);
  const kdv = y(araToplam * a.kdv / 100);
  // Gider dağılımı: her grubun maliyet içindeki payı (sıra sabittir; tutarı olmayan grup sıfırla görünür)
  const grupTutar = g => kalemler.filter(k => k.grup === g).reduce((t, k) => t + k.tutar, 0);
  const dagilim = [...ANALIZ_GRUPLARI.map(g => [g, grupTutar(g)]), ['İşçilik', a.iscilik], ['Nakliye ve montaj', a.nakliye]]
    .map(([ad, t]) => ({ ad, tutar: y(t), oran: maliyetToplam > 0 ? Math.round(t / maliyetToplam * 1000) / 10 : 0 }));
  // Ödeme senaryoları: aynı genel toplamın nakit, vadeli ve kredi kartıyla karşılığı
  const gt = y(araToplam + kdv), finans = [['Nakit', -a.nakitIsk], ['Vadeli / çek', a.vadeFark], ['Kredi kartı', a.kartKom]].map(([ad, oran]) => ({ ad, oran, tutar: y(gt * (1 + oran / 100)) }));
  const analiz = { finans, boyaAlan: y(boyaAlan), uretim: U, dagilim, mtul: y(mtul), mtulMaliyet: mtul > 0 ? y(maliyetToplam / mtul) : 0, mtulSatis: mtul > 0 ? y(araToplam / mtul) : 0, agirlik: Math.round(agirlik), hacim: y(hacim) };
  return { kalemler, analiz, ayar: a, malzeme, maliyetToplam, kar, araToplam, kdv, genelToplam: y(araToplam + kdv),
    fiyatsiz: kalemler.filter(k => !k.fiyat && !SECMELI_GRUP.has(k.grup)).length, sigmayan: plan.gruplar.reduce((t, g) => t + g.sigmayan.length, 0) };
}

// Sayfadaki hesaplanan hücreler: { veri anahtarı: yazı }. Fiyat değişince sayfa yeniden kurulmadan bu hücreler güncellenir.
export function maliyetDegerleri(h) {
  const d = { iscilik: tl(h.ayar.iscilik), nakliye: tl(h.ayar.nakliye), malzeme: tl(h.malzeme), maliyetToplam: tl(h.maliyetToplam), kar: tl(h.kar), araToplam: tl(h.araToplam), kdv: tl(h.kdv), genelToplam: tl(h.genelToplam),
    karOran: sayi(h.ayar.kar), kdvOran: sayi(h.ayar.kdv), gecerlilik: sayi(h.ayar.gecerlilik, 0), teslim: h.ayar.teslim || '—', not: h.ayar.not,
    mtul: sayi(h.analiz.mtul, 2) + ' m', mtulMaliyet: h.analiz.mtulMaliyet ? tl(h.analiz.mtulMaliyet) : '—', mtulSatis: h.analiz.mtulSatis ? tl(h.analiz.mtulSatis) : '—',
    uyari: h.fiyatsiz ? `${h.fiyatsiz} kalemin birim fiyatı girilmedi; bu kalemler toplamda yok.` : '' };
  h.kalemler.forEach((k, i) => { d['tutar' + i] = k.fiyat ? tl(k.tutar) : '—'; });
  h.analiz.finans.forEach((f, i) => { d['finT' + i] = tl(f.tutar); });
  h.analiz.dagilim.forEach((g, i) => { d['dagT' + i] = tl(g.tutar); d['dagO' + i] = '%' + sayi(g.oran); d['dagW' + i] = Math.min(100, g.oran) + '%'; });
  return d;
}

// Yazdırılabilir sayfalar: hırdavat ve maliyet (atölye içi) ile müşteri teklifi
export function maliyetSayfa(p, fiyat = {}, firma = {}) {
  const h = maliyet(p, fiyat), d = maliyetDegerleri(h), a = h.ayar;
  const tarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const baslik = alt => `<header><h1>${kac(p.ad)}</h1><span>${alt}</span><span>${tarih}</span></header>`;
  const renkKutu = r => r ? `<i class="renkKutu" style="background:${kac(r)}"></i>` : '';
  const giris = (tur, ad, deger, ek = '') => `<input class="fiyatGiris" type="number" inputmode="decimal" min="0" step="any" data-${tur}="${kac(ad)}" value="${deger || ''}" placeholder="0" ${ek}>`;
  if (!h.kalemler.length) return `<section class="sayfa">${baslik('Maliyet')}<p class="aciklama">Bu projede fiyatlanacak dolap yok.</p></section>`;
  let satirlar = '', grup = '';
  h.kalemler.forEach((k, i) => {
    if (k.grup !== grup) { grup = k.grup; satirlar += `<tr class="grupSatir"><th colspan="5">${grup}</th></tr>`; }
    satirlar += `<tr><td>${renkKutu(k.renk)}${kac(k.ad)}</td><td>${sayi(k.miktar, 2)}</td><td>${k.birim}</td><td>${giris('fiyat', k.anahtar, k.fiyat, `aria-label="${kac(k.ad)} birim fiyatı"`)}</td><td data-d="tutar${i}">${d['tutar' + i]}</td></tr>`;
  });
  projeAyarla(p.ayar);
  const U = h.analiz.uretim, secenek = (ad, etiket, liste, deger) => `<label class="alan"><span>${etiket}</span><select data-uretim="${ad}">${liste.map(x => { const [k, v] = Array.isArray(x) ? x : [x, x]; return `<option value="${k}"${k === deger ? ' selected' : ''}>${v}</option>`; }).join('')}</select></label>`;
  return `<section class="sayfa maliyet">${baslik('Hırdavat ve maliyet — atölye içi')}
    <div class="kagitAyar yazdirma">${secenek('govde', 'Gövde malzemesi', URETIM_SECENEK.govde, U.govde)}${secenek('kapak', 'Kapak malzemesi', URETIM_SECENEK.kapak, U.kapak)}${secenek('mentese', 'Menteşe', URETIM_SECENEK.mentese, U.mentese)}${secenek('ray', 'Çekmece rayı', URETIM_SECENEK.ray, U.ray)}</div>
    <table class="maliyetTablo"><thead><tr><th>Kalem</th><th>Miktar</th><th>Birim</th><th>Birim fiyat (TL)</th><th>Tutar</th></tr></thead><tbody>${satirlar}</tbody>
      <tfoot>
        <tr><th colspan="4">Malzeme toplamı</th><td data-d="malzeme">${d.malzeme}</td></tr>
        <tr><th colspan="3">İşçilik</th><td>${giris('maliyet', 'iscilik', a.iscilik, 'aria-label="İşçilik (TL)"')}</td><td data-d="iscilik">${d.iscilik}</td></tr>
        <tr><th colspan="3">Nakliye ve montaj</th><td>${giris('maliyet', 'nakliye', a.nakliye, 'aria-label="Nakliye ve montaj (TL)"')}</td><td data-d="nakliye">${d.nakliye}</td></tr>
        <tr><th colspan="4">Maliyet</th><td data-d="maliyetToplam">${d.maliyetToplam}</td></tr>
        <tr><th colspan="3">Kâr (%)</th><td>${giris('maliyet', 'kar', a.kar, 'aria-label="Kâr yüzdesi"')}</td><td data-d="kar">${d.kar}</td></tr>
        <tr class="toplamSatir"><th colspan="4">Satış fiyatı (KDV hariç)</th><td data-d="araToplam">${d.araToplam}</td></tr>
        <tr><th colspan="3">KDV (%)</th><td>${giris('maliyet', 'kdv', a.kdv, 'aria-label="KDV yüzdesi"')}</td><td data-d="kdv">${d.kdv}</td></tr>
        <tr class="toplamSatir"><th colspan="4">Genel toplam (KDV dahil)</th><td data-d="genelToplam">${d.genelToplam}</td></tr>
      </tfoot></table>
    <p class="aciklama uyariYazi" data-d="uyari">${d.uyari}</p>
    <p class="aciklama"><b>Hesap varsayımları.</b> Levha sayısı kesim planından gelir${h.sigmayan ? ' (levhaya sığmayan parçalar hesapta yok)' : ''}; levha fiyatı malzeme ve kalınlığa göre girilir, renk ayrımı yapılmaz. Kenar bandı net metredir, fire payı eklenmemiştir.
      Taç: düz MDF taç kapak levhası, kenar bandı ve boya hesabının içindedir; hazır (lake) taç hırdavat grubunda net metreyle yazılır (koşular ve yan dönüşler), fire payı eklenmemiştir.
      Menteşe: kapak boyu 950 mm'ye kadar 2, 1500 mm'ye kadar 3, 2000 mm'ye kadar 4, üstünde 5 adet (eB Creator'daki kural); kalkar kapakta menteşe yerine bir takım kalkar mekanizması sayılır. Çekmece rayı kasa derinliğine göre 50 mm'lik adımla seçilir. Alt ve boy dolapta 4 ayak (900 mm'den geniş modülde 6) ve 2 baza klipsi, üst dolapta 2 askı, her raf için 4 raf pimi sayılır.
      Vida, kavela, minifiks ve tutkal gibi sarf malzemesi, cihazlar ve evye–batarya listede yoktur; işçilik satırına ya da kendi hesabınıza ekleyin. Birim fiyatlar bütün projelerde ortaktır: bir fiyatı değiştirince eski projelerin hesabı da yeni fiyatla yapılır.</p></section>
    <section class="sayfa maliyet analiz">${baslik('Proje analizi — atölye içi')}
      <div class="an-kutular"><div><span>Dolap metresi</span><b data-d="mtul">${d.mtul}</b></div><div><span>Metretül maliyeti</span><b data-d="mtulMaliyet">${d.mtulMaliyet}</b></div>
        <div><span>Metretül satış (KDV hariç)</span><b data-d="mtulSatis">${d.mtulSatis}</b></div><div><span>Yaklaşık ağırlık</span><b>${sayi(h.analiz.agirlik, 0)} kg</b></div><div><span>Toplanmış hacim</span><b>${sayi(h.analiz.hacim, 2)} m³</b></div></div>
      <h3 class="araBaslik">Gider dağılımı</h3>
      <table class="an-tablo"><tbody>${h.analiz.dagilim.map((g, i) => `<tr><th>${g.ad}</th><td class="an-cubuk"><i data-w="dagW${i}" style="width:${d['dagW' + i]}"></i></td><td data-d="dagO${i}">${d['dagO' + i]}</td><td data-d="dagT${i}">${d['dagT' + i]}</td></tr>`).join('')}
        <tr class="toplamSatir"><th>Maliyet</th><td></td><td>%100</td><td data-d="maliyetToplam">${d.maliyetToplam}</td></tr></tbody></table>
      <h3 class="araBaslik">Ödeme senaryoları</h3>
      <div class="kagitAyar yazdirma">
        <label class="alan"><span>Nakit iskontosu</span><input type="number" min="0" max="100" step="any" inputmode="decimal" data-maliyet="nakitIsk" value="${a.nakitIsk || ''}" placeholder="0"><em>%</em></label>
        <label class="alan"><span>Vade farkı (çek)</span><input type="number" min="0" max="200" step="any" inputmode="decimal" data-maliyet="vadeFark" value="${a.vadeFark || ''}" placeholder="0"><em>%</em></label>
        <label class="alan"><span>Kart komisyonu</span><input type="number" min="0" max="100" step="any" inputmode="decimal" data-maliyet="kartKom" value="${a.kartKom || ''}" placeholder="0"><em>%</em></label></div>
      <table class="an-finans"><tbody>${h.analiz.finans.map((f, i) => `<tr><th>${f.ad}</th><td data-d="finT${i}">${d['finT' + i]}</td></tr>`).join('')}</tbody></table>
      <p class="aciklama">Ödeme senaryoları KDV dahil genel toplam üzerinden hesaplanır: nakitte iskonto düşülür, vadeli ödemede vade farkı, kredi kartında komisyon eklenir.
        Fason ve boya kalemleri fiyatı yazılırsa maliyete girer; boş bırakılırsa hesaba katılmaz. Lake boya: boyalı kapakların iki yüzü ve kenarları (${sayi(h.analiz.boyaAlan, 2)} m²); m² başına ${String(BOYA_SARF.astar).replace('.', ',')} kg astar, ${String(BOYA_SARF.sonkat).replace('.', ',')} kg son kat, bunların %${BOYA_SARF.tiner * 100}'u kadar tiner.
        Kapak malzemesi lake, membran ya da masif seçilirse kapak kenar bandı kalemi kendiliğinden kapanır; laminat seçilirse pres kalemi açılır.</p>
      <p class="aciklama">Paylar maliyetin (malzeme + işçilik + nakliye ve montaj) içindeki orandır; fiyatı girilmemiş kalemler sıfır sayılır. Metretül: gövdeli dolapların genişlikleri toplamı; metretül maliyeti ve satışı toplamın bu metreye bölümüdür.
        Ağırlık: levha parçaları ${LEVHA_YOGUNLUK} kg/m³, cam ${CAM_YOGUNLUK} kg/m³ sayılarak; tezgah, cihazlar ve hırdavat dahil değildir. Hacim: dolapların toplanmış haldeki dış ölçüleri toplamı (araç ve taşıma planı için).
        Vida sayısı tahminidir: yatay gövde parçasının her ucunda 2, menteşe başına 4, çekmece rayı takımında 12, kulp başına 2 vida ve %10 fire payı.</p></section>
    <p class="aciklama yazdirma">Müşteriye verilecek teklif için menüden <b>Teklif dosyası</b>nı açın. Metre satış fiyatı girmezseniz teklif buradaki satış fiyatını (maliyet + kâr) kullanır.</p>`;
}

// Hırdavat ve maliyet tablosu (noktalı virgülle ayrılmış; Excel için)
export function maliyetCsv(p, fiyat = {}) {
  const h = maliyet(p, fiyat), s = ['Grup;Kalem;Miktar;Birim;Birim fiyat;Tutar'];
  const tr = n => String(n).replace('.', ',');
  for (const k of h.kalemler) s.push([k.grup, k.ad, tr(k.miktar), k.birim, tr(k.fiyat || ''), tr(k.fiyat ? k.tutar : '')].join(';'));
  s.push(['', 'Malzeme toplamı', '', '', '', tr(h.malzeme)].join(';'), ['', 'İşçilik', '', '', '', tr(h.ayar.iscilik)].join(';'), ['', 'Nakliye ve montaj', '', '', '', tr(h.ayar.nakliye)].join(';'),
    ['', `Kâr (%${tr(h.ayar.kar)})`, '', '', '', tr(h.kar)].join(';'), ['', 'Satış fiyatı (KDV hariç)', '', '', '', tr(h.araToplam)].join(';'), ['', `KDV (%${tr(h.ayar.kdv)})`, '', '', '', tr(h.kdv)].join(';'), ['', 'Genel toplam', '', '', '', tr(h.genelToplam)].join(';'));
  return '﻿' + s.join('\r\n') + '\r\n';
}
