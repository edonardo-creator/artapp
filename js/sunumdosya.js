// Müşteri sunum dosyası: kapak, her oda için 3B görüntüler ve sade plan, renk ve malzeme özeti, kapsam ve onay.
// Yazdırılabilir HTML üretir (teknik çizimle aynı katmanda gösterilir, "Yazdır / PDF" ile dosyaya çevrilir).
// Görüntüler dışarıdan verilir; bu dosya 3B kütüphaneye bağlı değildir.
import { TANIM, KAPAK_MODELLERI, projeAyarla, donanimAdi } from './moduller.js';
import { tezgahlar } from './ortak.js';
import { tacAyari } from './tac.js';
import { kulpAdi } from './kulplar.js';
import { planSvg } from './teknik.js';

const kac = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DESEN = { duz: 'düz renk', ahsap: 'ahşap desenli', mermer: 'mermer desenli', parke: 'parke', karo: 'karo', beton: 'beton', metro: 'metro fayans',
  fayans: 'kare fayans', mozaik: 'mozaik', tugla: 'tuğla', kagit: 'çizgili duvar kağıdı' };
const KULP = { cubuk: 'Çubuk kulp', boy: 'Boy kulp', gola: 'Gola (kulpsuz kanal)', yok: 'Kulpsuz' };
const EVYE = { tek: 'tek gözlü', genis: 'tek geniş gözlü', bucuk: 'bir buçuk gözlü', cift: 'çift gözlü', damla: 'damlalıklı', damlaSol: 'damlalıklı', yuvarlak: 'yuvarlak' };
const EVYE_MAT = { inox: 'paslanmaz çelik', granit: 'granit', beyaz: 'seramik' };
const OCAK = { gaz4: 'gazlı, 4 gözlü', gaz5: 'gazlı, 5 gözlü', cam4: 'cam / indüksiyon, 4 gözlü', gaz2: 'domino gazlı', cam2: 'domino cam' };
const BUZ = { alt: 'dondurucu altta', ust: 'dondurucu üstte', tek: 'tek kapılı', cift: 'gardırop tipi', fransiz: 'çift kapı + alt çekmece' };
const DAV = { baca: 'bacalı', kutu: 'kutu gövde', cam: 'siyah camlı', gomme: 'gömme' };

// Bir odadaki cihaz ve donanım satırları
export function cihazListesi(p) {
  const out = [];
  for (const m of p.moduller) {
    const ocakli = (m.tip === 'alt_ocak' || m.tip === 'alt_firin' || m.tip === 'alt_solo') && m.ocakTip !== 'yok';
    if (m.tip === 'alt_evye') out.push(`Evye: ${EVYE[m.evye] || EVYE.tek}, ${EVYE_MAT[m.evyeMat] || EVYE_MAT.inox}`);
    if (ocakli) out.push(`Ocak: ${OCAK[m.ocakTip] || OCAK.gaz4}`);
    if (m.tip === 'alt_firin') out.push('Ankastre fırın');
    if (m.tip === 'alt_solo') out.push('Solo fırın');
    if (m.tip === 'boy_firin') out.push(m.kule === 'firin' ? 'Ankastre fırın (kulede)' : m.kule === 'cift' ? 'Çift ankastre fırın (kulede)' : 'Ankastre fırın ve mikrodalga (kulede)');
    if (m.tip === 'alt_bulasik') out.push('Bulaşık makinesi');
    if (m.tip === 'alt_camasir') out.push('Çamaşır makinesi');
    if (m.tip === 'boy_camasir') out.push('Çamaşır ve kurutma makinesi (kulede)');
    if (m.tip === 'alt_sarap') out.push('Şarap dolabı');
    if (m.tip === 'ust_mikro') out.push('Mikrodalga');
    if (m.tip === 'buzdolabi') out.push(`Buzdolabı: ${BUZ[m.buzTip] || BUZ.alt}, ${m.w} mm`);
    if (m.tip === 'boy_ankastre') out.push('Ankastre buzdolabı');
    if (m.tip === 'davlumbaz') out.push(`Davlumbaz: ${DAV[m.davTip] || DAV.baca}, ${m.w} mm`);
    if (m.tip === 'davlumbaz_ada') out.push(`Ada davlumbazı, ${m.w} mm`);
    if (donanimAdi(m)) out.push('İç donanım: ' + donanimAdi(m));
  }
  // aynı satırlar tek satırda adetle
  const say = new Map();
  for (const s of out) say.set(s, (say.get(s) || 0) + 1);
  return [...say].map(([s, n]) => n > 1 ? `${s} × ${n}` : s);
}

// Bir odanın sayısal özeti
export function odaOzeti(p) {
  const say = s => p.moduller.filter(m => TANIM[m.tip].sinif === s && !['panel_yan', 'dolgu'].includes(m.tip)).length;
  const tezgah = tezgahlar(p).reduce((t, b) => t + Math.max(b.x1 - b.x0, b.z1 - b.z0), 0);
  return { alt: say('alt'), ust: say('ust'), boy: say('boy'), tezgahM: Math.round(tezgah / 100) / 10 };
}

// odalar: [{ ad, proje, gorseller: [{ ad, veri }] }]   veri: data URL (boş olabilir)
// firma: { ad, iletisim, logo } (hepsi isteğe bağlı)
export function sunumDosyasi(p, odalar, firma = {}) {
  const logoGuvenli = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(firma.logo || '') ? firma.logo : '';
  const firmaHtml = firma.ad || logoGuvenli ? `<div class="sd-firma">${logoGuvenli ? `<img src="${logoGuvenli}" alt="">` : ''}<div>${firma.ad ? `<b>${kac(firma.ad)}</b>` : ''}${firma.iletisim ? `<span>${kac(firma.iletisim)}</span>` : ''}</div></div>` : '';
  projeAyarla(p.ayar);
  const b = p.bilgi || {}, tarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const kimlik = [b.musteri, b.adres].filter(Boolean).map(kac).join(' · ');
  const baslik = alt => `<header><h1>${kac(p.ad)}${kimlik ? `<small>${kimlik}</small>` : ''}</h1><span>${alt}</span><span>${tarih}</span></header>`;
  const resim = (g, sinif = '') => g?.veri ? `<figure class="sd-resim ${sinif}"><img src="${g.veri}" alt="${kac(g.ad)}"><figcaption>${kac(g.ad)}</figcaption></figure>` : '';
  const kapakResmi = odalar[0]?.gorseller[0];

  let h = `<section class="sayfa sd-kapak">
    ${kapakResmi?.veri ? `<img src="${kapakResmi.veri}" alt="">` : ''}
    <div class="sd-kunye"><p class="sd-ust">Tasarım sunumu</p><h1>${kac(p.ad)}</h1>
    ${b.musteri ? `<p class="sd-musteri">${kac(b.musteri)}</p>` : ''}${b.adres ? `<p>${kac(b.adres)}</p>` : ''}<p>${tarih}</p>${firmaHtml}</div></section>`;

  for (const o of odalar) {
    const ad = o.ad ? kac(o.ad) : 'Görünüm', oz = odaOzeti(o.proje), { w, d, h: yuk } = o.proje.oda;
    // görüntüler ikişer ikişer sayfalanır: her sayfada iki büyük görüntü
    for (let i = 0; i < Math.max(1, o.gorseller.length); i += 2) {
      h += `<section class="sayfa sd-oda">${baslik(ad + ' — 3B görünüm')}<div class="sd-ikili">${resim(o.gorseller[i])}${resim(o.gorseller[i + 1])}</div></section>`;
    }
    const cihaz = cihazListesi(o.proje);
    h += `<section class="sayfa sd-plan">${baslik(ad + ' — yerleşim planı')}<div class="sd-yan">
      <div class="sd-planCizim">${planSvg(o.proje)}</div>
      <div class="sd-ozet"><h3>Oda</h3><p>${w} × ${d} mm, tavan ${yuk} mm</p>
        <h3>Dolaplar</h3><p>${oz.alt} alt · ${oz.ust} üst · ${oz.boy} boy modül${oz.tezgahM ? `<br>Tezgah: yaklaşık ${String(oz.tezgahM).replace('.', ',')} m` : ''}</p>
        ${cihaz.length ? `<h3>Cihaz ve donanım</h3><ul>${cihaz.map(c => `<li>${kac(c)}</li>`).join('')}</ul>` : ''}</div></div>
      <p class="aciklama">Plan üstten bakıştır, ölçüler milimetredir. Kalın çizgi: alt ve boy dolap · kesik çizgi: üst dolap · gri: tezgah.</p></section>`;
  }

  const r = p.renk, ds = p.desen || {};
  const renkler = [['Alt kapaklar', r.kapak, DESEN[ds.kapak]], ['Üst kapaklar', r.ustKapak, DESEN[ds.ustKapak]], ['Gövde', r.govde, ''],
    ['Tezgah', r.tezgah, DESEN[ds.tezgah]], ['Tezgah arası', (p.ayar?.arasi ?? 1) ? (r.arasi || '#e4e8e2') : null, ds.arasi && ds.arasi !== 'duz' ? DESEN[ds.arasi] : ''], ['Baza', r.baza, ''],
    ['Duvar', r.duvar, ds.duvar && ds.duvar !== 'duz' ? DESEN[ds.duvar] : ''], ['Zemin', r.zemin, DESEN[ds.zemin]]].filter(x => x[1]);
  const ayrinti = [['Kapak modeli', KAPAK_MODELLERI[p.ayar?.kapakModel] || KAPAK_MODELLERI.duz], ['Kulp', KULP[p.ayar?.kulp] || kulpAdi(p.ayar?.kulp || 'cubuk')]];
  if (KAPAK_MODELLERI[p.ayar?.kapakModelUst]) ayrinti.splice(1, 0, ['Üst kapak modeli', KAPAK_MODELLERI[p.ayar.kapakModelUst]]);
  if (KAPAK_MODELLERI[p.ayar?.kapakModelBoy]) ayrinti.splice(1, 0, ['Boy kapak modeli', KAPAK_MODELLERI[p.ayar.kapakModelBoy]]);
  if (p.ayar?.led) ayrinti.push(['Tezgah ışığı', 'LED şerit']);
  if (p.ayar?.tezgahKenar === 'yuvarlak') ayrinti.push(['Tezgah kenarı', 'Yuvarlak']);
  if (p.ayar?.tezgahKenar === 'damlalik') ayrinti.push(['Tezgah kenarı', 'Damlalıklı']);
  if (p.ayar?.tezgahSup) ayrinti.push(['Tezgah süpürgeliği', `${p.ayar.tezgahSup / 10} cm`]);
  if (p.ayar?.supurgelik) ayrinti.push(['Oda süpürgeliği', `${p.ayar.supurgelik / 10} cm`]);
  if (p.ayar?.kornis) ayrinti.push(['Taç', `${tacAyari(p).ad} (${tacAyari(p).yuk / 10} cm)`]);
  if (p.ayar?.bant) ayrinti.push(['Işık bandı', 'Üst dolapların altında']);
  if (p.ayar?.adaPanel) ayrinti.push(['Ada', 'Yan ve arka bitiş paneli']);
  if (p.ayar?.adaBar) ayrinti.push(['Ada barı', 'Bar yükseltisi (110 cm)']);
  h += `<section class="sayfa sd-malzeme">${baslik('Renk ve malzeme')}
    <div class="sd-renkler">${renkler.map(([ad, renk, desen]) => `<div class="sd-renk"><i style="background:${kac(renk)}"></i><b>${ad}</b><span>${kac(String(renk).toUpperCase())}${desen ? ' · ' + desen : ''}</span></div>`).join('')}</div>
    <table class="sd-tablo"><tbody>${ayrinti.map(([a, v]) => `<tr><th>${a}</th><td>${kac(v)}</td></tr>`).join('')}</tbody></table>
    ${b.not ? `<p class="projeNotu"><b>Proje notu:</b> ${kac(b.not)}</p>` : ''}
    <p class="aciklama">Ekrandaki ve baskıdaki renkler gerçek malzemeden farklı görünebilir; kesin seçim numune üzerinden yapılır.</p>
    <div class="sd-onay"><div><span>Müşteri onayı</span></div><div><span>Tarih</span></div><div><span>Hazırlayan${firma.ad ? ': ' + kac(firma.ad) : ''}</span></div></div>${firmaHtml}</section>`;
  return h;
}
