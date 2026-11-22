// Teklif dosyası: müşteriye verilecek fiyat teklifi (A4 dikey). Sayfa düzeni ve fiyat mantığı aynı sahibin eB Creator
// uygulamasındaki teklif dosyasıyla aynıdır: kapak, özet ve genel toplam, proje çizimleri, ölçü listesi, fiyat dökümü, şartlar, onay.
// Fiyat: dolaplar sıra (alt, üst, boy) ve kapak modeline göre metre (mtül) fiyatıyla, tezgah metreyle; cihazlar, iç donanım ve
// aksesuarlar adetle; montaj ve nakliye tek kalem. Ara toplamdan iskonto düşülür, üstüne KDV eklenir.
// Metre fiyatı girilmemişse ve maliyet sayfasında maliyet + kâr hesabı varsa mobilya tek kalem olarak o tutarla yazılır.
import { TANIM, projeAyarla, modulKapakStili } from './moduller.js';
import { KAPAK_MODELLERI, camliMi, camAyari, camTuru } from './kapaklar.js';
import { kulpAdi } from './kulplar.js';
import { kesimListesi } from './kesim.js';
import { odaGorunumleri } from './odalar.js';
import { cihazListesi } from './sunumdosya.js';
import { projeHirdavati, maliyet, maliyetAyari, tl } from './maliyet.js';
import { taclar } from './tac.js';
import { planSvg, gorunusSvg } from './teknik.js';
import { DUVARLAR, DUVAR_LISTE } from './yerlesim.js';
import { aksesuarListesi, aksesuarGrubu } from './aksesuarlar.js';
import { tezgahAdi } from './tezgahkatalog.js';
import { renkAdi } from './renkler.js';

const kac = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const yuv = n => Math.round(n * 100) / 100;
const sayi = (n, b = 2) => (Math.round(n * 10 ** b) / 10 ** b).toLocaleString('tr-TR');
const SIRA = { alt: 'Alt dolap', ust: 'Üst dolap', boy: 'Boy dolap' };
// Metre hesabına giren modüller: gövdeli dolaplar (cihaz yuvaları dahil); solo cihazlar, davlumbaz ve bitiş parçaları girmez
const metreyeGirer = m => { const t = TANIM[m.tip]; return !!t && ['alt', 'ust', 'boy'].includes(t.sinif) && !['Cihazlar', 'Bitiş parçaları'].includes(t.grup) && !['buzdolabi', 'davlumbaz', 'davlumbaz_ada'].includes(m.tip); };
const aksAdi = x => x.ad + ([x.kod, x.renk].filter(Boolean).length ? ` (${[x.kod, x.renk].filter(Boolean).join(', ')})` : '');

// Teklif numarası: projeye yazılmışsa o, yoksa tarih ve proje kimliğinden türetilir (aynı gün aynı proje için değişmez)
export function teklifNo(p, tarih = new Date()) {
  const yazili = String(p.ayar?.maliyet?.no || '').trim();
  if (yazili) return yazili.slice(0, 24);
  const g = `${tarih.getFullYear()}${String(tarih.getMonth() + 1).padStart(2, '0')}${String(tarih.getDate()).padStart(2, '0')}`;
  let h = 0;
  for (const c of String(p.id || p.ad || '')) h = (h * 31 + c.charCodeAt(0)) % 90;
  return `T-${g}-${h + 10}`;
}

// Teklifin kalemleri ve toplamları. fiyat: ortak fiyat listesi ({ anahtar: birim fiyat }).
// Dönen: { kalemler: [{ grup, anahtar, ad, miktar, birim, fiyat, tutar }], girisler (fiyatı listeden gelen bütün kalemler), aksesuar,
//          araToplam, iskonto, kdv, genelToplam, ayar, yontem: 'metre' | 'maliyet', fiyatsiz }
export function teklifVerisi(p, fiyat = {}) {
  const metre = new Map(), cihaz = new Map(), moduller = new Map(), tac = new Map();
  let tezgah = 0;
  for (const g of odaGorunumleri(p)) {
    projeAyarla(g.proje.ayar);
    for (const m of g.proje.moduller) {
      moduller.set(m.id, m);
      if (!metreyeGirer(m)) continue;
      const a = `mtul|${TANIM[m.tip].sinif}|${modulKapakStili(m)}`;
      metre.set(a, (metre.get(a) || 0) + m.w / 1000);
    }
    for (const c of cihazListesi(g.proje)) {
      const [, ad, n] = /^(.*?)(?: × (\d+))?$/.exec(c);
      if (!/^İç donanım/.test(ad)) cihaz.set(ad, (cihaz.get(ad) || 0) + (Number(n) || 1));
    }
    for (const s of kesimListesi(g.proje).satirlar) if (s.malzeme === 'Tezgah' && s.ad !== 'Tezgah süpürgeliği') tezgah += s.boy * s.adet / 1000;
    projeAyarla(g.proje.ayar);
    const tc = taclar(g.proje);
    if (tc.metre > 0) { const an = 'mtul|tac|' + tc.ayar.kod, e = tac.get(an) || tac.set(an, { ad: `Taç, ${tc.ayar.ad} (${tc.ayar.yuk} mm)`, m: 0 }).get(an); e.m += tc.metre; }
  }
  projeAyarla(p.ayar);
  const a = maliyetAyari(p), aksesuar = aksesuarListesi(p);
  const girisler = [];
  const ekle = (grup, anahtar, ad, miktar, birim) => {
    if (!(miktar > 0)) return;
    const f = Number(fiyat[anahtar]), bf = Number.isFinite(f) && f > 0 ? f : 0;
    girisler.push({ grup, anahtar, ad, miktar, birim, fiyat: bf, tutar: yuv(miktar * bf) });
  };
  for (const s of ['alt', 'ust', 'boy']) for (const [an, m] of metre) { const [, sira, stil] = an.split('|'); if (sira === s) ekle('Dolaplar', an, `${SIRA[s]}, ${KAPAK_MODELLERI[stil] || 'Düz'} kapak`, yuv(m), 'mtül'); }
  ekle('Dolaplar', 'mtul|tezgah', 'Tezgah, ' + tezgahAdi(p), yuv(tezgah), 'mtül');
  for (const [an, e] of tac) ekle('Dolaplar', an, e.ad, yuv(e.m), 'mtül');
  for (const [ad, n] of cihaz) ekle('Cihazlar', 'cihaz|' + ad, ad, n, 'adet');
  // katalogdan seçilip dolaba takılmış aksesuar o dolabın iç donanımıdır: genel iç donanım satırında ikinci kez sayılmaz
  const takili = new Map();
  for (const x of aksesuar) { const m = x.modul && moduller.get(x.modul); if (m && x.hareket && m.donanim === x.hareket) takili.set(x.hareket, (takili.get(x.hareket) || 0) + 1); }
  for (const h of projeHirdavati(p)) if (h.anahtar.startsWith('donanim|')) ekle('İç donanım', 'satis|' + h.anahtar, h.ad, h.miktar - (takili.get(h.anahtar.slice(8)) || 0), h.birim);
  projeAyarla(p.ayar);
  let kalemler = girisler.map(k => ({ ...k })), yontem = 'metre';
  if (!kalemler.some(k => k.grup === 'Dolaplar' && k.fiyat)) { // metre fiyatı yok: maliyet + kâr hesabı varsa mobilya tek kalem
    const M = maliyet(p, fiyat);
    projeAyarla(p.ayar);
    if (M.araToplam > 0) {
      yontem = 'maliyet';
      kalemler = [{ grup: 'Dolaplar', anahtar: '', ad: 'Mutfak mobilyası (dolaplar, tezgah, donanım, montaj ve nakliye)', miktar: 1, birim: 'takım', fiyat: M.araToplam, tutar: M.araToplam },
        ...kalemler.filter(k => k.grup !== 'Dolaplar')];
    }
  }
  for (const x of aksesuar) kalemler.push({ grup: 'Aksesuar', anahtar: '', ad: aksAdi(x), miktar: x.adet, birim: 'adet', fiyat: x.fiyat, tutar: yuv(x.adet * x.fiyat) });
  const aksToplam = aksesuar.reduce((t, x) => t + x.adet * x.fiyat, 0);
  if (a.aksIskonto > 0 && aksToplam > 0) kalemler.push({ grup: 'Aksesuar', anahtar: '', ad: `Aksesuar iskontosu %${sayi(a.aksIskonto)}`, miktar: 1, birim: '', fiyat: -yuv(aksToplam * a.aksIskonto / 100), tutar: -yuv(aksToplam * a.aksIskonto / 100), eksi: true });
  if (yontem === 'metre' && a.nakliye > 0) kalemler.push({ grup: 'Hizmet', anahtar: '', ad: 'Montaj ve nakliye', miktar: 1, birim: 'hizmet', fiyat: a.nakliye, tutar: a.nakliye });
  const araToplam = yuv(kalemler.reduce((t, k) => t + k.tutar, 0)), iskonto = yuv(araToplam * a.iskonto / 100), kdv = yuv((araToplam - iskonto) * a.kdv / 100);
  return { kalemler, girisler, aksesuar, araToplam, iskonto, kdv, genelToplam: yuv(araToplam - iskonto + kdv), ayar: a, yontem,
    fiyatsiz: girisler.filter(k => !k.fiyat && (yontem === 'metre' || k.grup !== 'Dolaplar')).length };
}

// Ölçü listesi satırları: her oda için modüller (yer, ad, ölçü cm, kapak modeli, kapak rengi)
function olcuSatirlari(p) {
  const out = [];
  for (const g of odaGorunumleri(p)) {
    projeAyarla(g.proje.ayar);
    for (const d of [...DUVAR_LISTE, 'ada']) for (const m of g.proje.moduller.filter(o => o.duvar === d).sort((x, y) => x.y - y.y || x.x - y.x)) {
      const t = TANIM[m.tip];
      if (!t || !['alt', 'ust', 'boy'].includes(t.sinif) || t.grup === 'Bitiş parçaları') continue;
      const stil = metreyeGirer(m) ? modulKapakStili(m) : '';
      const renk = stil ? (m.kapakRenk || (t.sinif === 'ust' ? g.proje.renk.ustKapak : g.proje.renk.kapak)) : '';
      out.push({ yer: (g.ad ? g.ad + ' · ' : '') + String(DUVARLAR[d] || '').replace(' (serbest)', ''), ad: t.ad, olcu: `${sayi(m.w / 10, 1)} × ${sayi(m.h / 10, 1)} × ${sayi(m.d / 10, 1)}`, kapak: stil ? KAPAK_MODELLERI[stil] : '—', renk });
    }
  }
  projeAyarla(p.ayar);
  return out;
}

// Teklif ayarları ve satış fiyatları: ekranda teklif sayfalarının üstünde görünür, baskıya çıkmaz.
// Kutular: data-fiyat (ortak fiyat listesi), data-maliyet (projenin teklif ayarı), data-aks="sıra.alan" (projedeki aksesuar)
export function teklifGiris(p, fiyat = {}) {
  const T = teklifVerisi(p, fiyat), a = T.ayar;
  const kutu = (tur, ad, deger, etiket, ek = '') => `<input class="fiyatGiris" type="number" inputmode="decimal" min="0" step="any" data-${tur}="${kac(ad)}" value="${deger || ''}" placeholder="0" aria-label="${kac(etiket)}" ${ek}>`;
  const metin = (ad, etiket, deger, yer, uz) => `<label class="alan genis"><span>${etiket}</span><input type="text" maxlength="${uz}" data-maliyet="${ad}" value="${kac(deger)}" placeholder="${kac(yer)}"></label>`;
  const sayiAlan = (ad, etiket, deger, birim) => `<label class="alan"><span>${etiket}</span><input type="number" min="0" step="any" inputmode="decimal" data-maliyet="${ad}" value="${deger || ''}" placeholder="0"><em>${birim}</em></label>`;
  let satirlar = '', grup = '';
  for (const k of T.girisler) {
    if (k.grup !== grup) { grup = k.grup; satirlar += `<tr class="grupSatir"><th colspan="5">${grup}</th></tr>`; }
    satirlar += `<tr><td>${kac(k.ad)}</td><td>${sayi(k.miktar)}</td><td>${k.birim}</td><td>${kutu('fiyat', k.anahtar, k.fiyat, k.ad + ' birim satış fiyatı')}</td><td>${k.fiyat ? tl(k.tutar) : '—'}</td></tr>`;
  }
  if (T.aksesuar.length) satirlar += '<tr class="grupSatir"><th colspan="5">Aksesuar</th></tr>' + T.aksesuar.map((x, i) => {
    const renkler = aksesuarGrubu(x.g)?.[3] || [];
    const renk = renkler.length > 1 ? `<select data-aks="${i}.renk" aria-label="Renk">${renkler.map(r => `<option${r === x.renk ? ' selected' : ''}>${kac(r)}</option>`).join('')}</select>` : '';
    return `<tr><td>${kac(x.ad)}${x.kod ? ` <small>${kac(x.kod)}${x.liste ? ' · liste ' + tl(x.liste) : ''}</small>` : ''} ${renk} <button type="button" class="mini" data-aks-sil="${i}" title="Bu aksesuarı projeden çıkarır">×</button></td>
      <td>${kutu('aks', i + '.adet', x.adet, x.ad + ' adedi', 'step="1"')}</td><td>adet</td><td>${kutu('aks', i + '.fiyat', x.fiyat, x.ad + ' birim fiyatı')}</td><td>${x.fiyat ? tl(x.adet * x.fiyat) : '—'}</td></tr>`;
  }).join('');
  return `<section class="sayfa maliyet tk-giris yazdirma"><header><h1>Teklif ayarları<small>Bu bölüm baskıya çıkmaz; müşteri yalnızca aşağıdaki sayfaları görür.</small></h1><span>Genel toplam ${T.genelToplam > 0 ? tl(T.genelToplam) : '—'}</span></header>
    <table class="maliyetTablo"><thead><tr><th>Kalem</th><th>Miktar</th><th>Birim</th><th>Birim satış fiyatı (TL)</th><th>Tutar</th></tr></thead><tbody>${satirlar || '<tr><td colspan="5">Bu projede fiyatlanacak dolap yok.</td></tr>'}</tbody></table>
    <p class="aciklama">${T.yontem === 'maliyet' ? '<b>Metre fiyatı girilmedi:</b> teklifte mobilya tek kalem olarak “Maliyet” sayfasındaki satış fiyatıyla (maliyet + kâr) yazılıyor. Dolap ve tezgah için metre fiyatı girerseniz döküm metre hesabına döner.'
      : 'Dolaplar genişliklerinin toplamıyla (metre), kapak modeline göre ayrı ayrı fiyatlanır. Fiyatı boş bırakılan dolap kalemi teklifte fiyatsız (—) görünür ve toplama girmez.'}
      Fiyatı girilmeyen cihaz teklife yazılmaz; fiyatı girilmeyen iç donanım “Dahil” olarak görünür.
      Buradaki satış fiyatları bütün projelerde ortaktır; aksesuar fiyatları bu projeye özeldir. Firma adı, iletişim satırı ve logo “Atölye standartları ve firma bilgisi” penceresinden gelir.</p>
    <div class="kagitAyar">
      ${sayiAlan('nakliye', 'Montaj ve nakliye', a.nakliye, 'TL')}${sayiAlan('iskonto', 'İskonto', a.iskonto, '%')}${sayiAlan('kdv', 'KDV', a.kdv, '%')}
      ${T.aksesuar.length ? sayiAlan('aksIskonto', 'Aksesuar iskontosu', a.aksIskonto, '%') : ''}${sayiAlan('gecerlilik', 'Geçerlilik', a.gecerlilik, 'gün')}
      <label class="alan"><span>Teklif no</span><input type="text" maxlength="24" data-maliyet="no" value="${kac(a.no)}" placeholder="${kac(teklifNo({ ...p, ayar: {} }))}"></label>
      ${metin('teslim', 'Teslim süresi', a.teslim, 'ör. onaydan sonra 4 hafta', 80)}${metin('odeme', 'Ödeme', a.odeme, 'ör. %50 peşin, kalanı teslimde', 200)}${metin('not', 'Not', a.not, 'teklife yazılacak ek not', 400)}
    </div>
    <div class="dugmeler"><button type="button" data-aks-ac="proje">Aksesuar kataloğu…</button><button type="button" data-teklif="gorsel" title="Kapaktaki ve özetteki görüntüyü ekrandaki bakıştan yeniden alır">Görüntüyü yenile</button></div></section>`;
}

// Teklif dosyasının sayfaları. firma: { ad, iletisim, logo }. gorsel: kapakta ve özette kullanılacak görüntü (data URL; boş olabilir).
export function teklifSayfa(p, fiyat = {}, firma = {}, gorsel = '') {
  const T = teklifVerisi(p, fiyat), a = T.ayar, b = p.bilgi || {}, no = teklifNo(p), tarih = new Date().toLocaleDateString('tr-TR');
  const logo = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(firma.logo || '') ? firma.logo : '';
  const firmaAd = kac(firma.ad || ''), iletisim = kac(firma.iletisim || '');
  const resim = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(gorsel) ? `<img src="${gorsel}" alt="3B görünüm">` : '<div class="tk-bos">Görüntü yok</div>';
  const sayfalar = [];
  const ust = baslik => `<div class="tk-ust"><div>${logo ? `<img src="${logo}" alt="">` : ''}<div><b>${firmaAd}</b><span>${iletisim}</span></div></div><div><b>${baslik}</b><span>${kac(no)} · ${tarih}</span></div></div>`;
  const sayfa = (baslik, govde) => sayfalar.push(`${ust(baslik)}<div class="tk-govde">${govde}</div>`);
  const ds = p.desen || {}, cam = camAyari(p.ayar);
  const stilAdi = alan => KAPAK_MODELLERI[p.ayar?.[alan]] || KAPAK_MODELLERI[p.ayar?.kapakModel] || KAPAK_MODELLERI.duz;
  const renkKutu = r => r ? `<i class="tk-renk" style="background:${kac(r)}"></i>` : '';
  const camli = ['kapakModel', 'kapakModelUst', 'kapakModelBoy'].some(x => camliMi(p.ayar?.[x] || ''));

  // 2. sayfa: özet ve genel toplam
  sayfa('FİYAT TEKLİFİ', `<h1>${kac(p.ad)}</h1><p class="tk-alt">${b.musteri ? 'Sayın ' + kac(b.musteri) : ''}${b.musteri && b.adres ? ' · ' : ''}${kac(b.adres || '')}</p>
    <div class="tk-resim">${resim}</div><p class="tk-not">3B görünüm. Görsel temsilidir.</p>
    <div class="tk-toplam"><div><span>Genel toplam (KDV dahil)</span><b>${T.genelToplam > 0 ? tl(T.genelToplam) : '—'}</b></div>
      <div><span>Teklif geçerliliği: ${sayi(a.gecerlilik, 0)} gün</span>${a.teslim ? `<span>Teslim: ${kac(a.teslim)}</span>` : ''}</div></div>
    <table class="tk-bilgi"><tbody>
      <tr><th>Kapak modeli</th><td>Alt: ${kac(stilAdi('kapakModel'))} · Üst: ${kac(stilAdi('kapakModelUst'))} · Boy: ${kac(stilAdi('kapakModelBoy'))}</td></tr>
      <tr><th>Renkler</th><td>${[['kapak', 'Alt kapak'], ['ustKapak', 'Üst kapak'], ['govde', 'Gövde']].map(([a, ad]) => renkKutu(p.renk?.[a]) + ad + (renkAdi(p.renk?.[a]) ? ' (' + kac(renkAdi(p.renk[a])) + ')' : '')).join(' · ')}</td></tr>
      <tr><th>Tezgah / kulp</th><td>${renkKutu(p.renk?.tezgah)}${kac(tezgahAdi(p, { kodlu: false }))} tezgah · ${kac(kulpAdi(p.ayar?.kulp || 'cubuk'))}</td></tr>
      ${camli ? `<tr><th>Cam</th><td>${kac(camTuru(cam.tur)[1])}</td></tr>` : ''}</tbody></table>`);

  // Proje çizimleri: her oda için plan ve duvar görünüşleri (sayfa başına iki çizim)
  const cizimler = [];
  for (const g of odaGorunumleri(p)) {
    if (!g.proje.moduller.length) continue;
    const on = g.ad ? kac(g.ad) + ' · ' : '';
    cizimler.push([on + 'Yerleşim planı (üstten görünüş)', planSvg(g.proje)]);
    for (const d of DUVAR_LISTE) { const s = gorunusSvg(g.proje, d); if (s) cizimler.push([`${on}${DUVARLAR[d]} görünüşü · ${sayi((d === 'arka' || d === 'on' ? g.proje.oda.w : g.proje.oda.d) / 10, 0)} cm`, s]); }
  }
  projeAyarla(p.ayar);
  for (let i = 0; i < cizimler.length; i += 2) sayfa('PROJE ÇİZİMLERİ', cizimler.slice(i, i + 2).map(([ad, svg]) => `<h3>${ad}</h3><div class="tk-cizim sayfa">${svg}</div>`).join('')
    + (i + 2 >= cizimler.length ? '<p class="tk-not">Çizim ölçüleri milimetredir. Kesin ölçüler yerinde ölçüm sonrası netleşir.</p>' : ''));

  // Ölçü listesi: sayfa başına 30 satır; aksesuar tablosu son sayfaya (sığmazsa yeni sayfaya)
  const olcu = olcuSatirlari(p), SATIR = 30;
  const aksTablo = T.aksesuar.length ? `<h2>Aksesuarlar</h2><table class="tk-tablo"><thead><tr><th>Ürün</th><th>Kod / renk</th><th>Adet</th></tr></thead><tbody>${T.aksesuar.map(x => `<tr><td>${kac(x.ad)}</td><td>${kac([x.kod, x.renk].filter(Boolean).join(', ') || '—')}</td><td>${x.adet}</td></tr>`).join('')}</tbody></table>` : '';
  const olcuSayfa = Math.max(1, Math.ceil(olcu.length / SATIR));
  for (let n = 0; n < olcuSayfa; n++) {
    const dilim = olcu.slice(n * SATIR, (n + 1) * SATIR), son = n === olcuSayfa - 1, sigar = son && dilim.length + T.aksesuar.length + 4 <= SATIR;
    sayfa('ÖLÇÜ LİSTESİ', `${n ? '' : '<h2>Modüller</h2>'}<table class="tk-tablo"><thead><tr><th>Yer</th><th>Modül</th><th>G × Y × D (cm)</th><th>Kapak</th><th>Renk</th></tr></thead><tbody>`
      + (dilim.map(s => `<tr><td>${kac(s.yer)}</td><td>${kac(s.ad)}</td><td>${s.olcu}</td><td>${kac(s.kapak)}</td><td>${renkKutu(s.renk) || '—'}</td></tr>`).join('') || '<tr><td colspan="5">Bu projede dolap yok.</td></tr>') + '</tbody></table>' + (sigar ? aksTablo : ''));
    if (son && !sigar && aksTablo) sayfa('ÖLÇÜ LİSTESİ', aksTablo);
  }

  // Fiyat dökümü, toplamlar ve şartlar: uzun dökümde toplam ve şartlar ayrı sayfaya geçer
  const satir = k => `<tr><td>${kac(k.ad)}</td><td>${k.eksi ? '' : sayi(k.miktar)}</td><td>${k.birim}</td><td>${k.eksi ? '' : k.fiyat ? tl(k.fiyat) : '—'}</td><td>${k.fiyat ? tl(k.tutar) : k.grup === 'İç donanım' ? 'Dahil' : '—'}</td></tr>`;
  // fiyatı girilmemiş cihaz teklife yazılmaz (kapsam dışı); fiyatsız iç donanım dolap fiyatına dahildir
  const dokum = T.kalemler.filter(k => k.fiyat || k.grup !== 'Cihazlar');
  const KALEM = 26, parca = [];
  for (let i = 0; i < Math.max(1, dokum.length); i += KALEM) parca.push(dokum.slice(i, i + KALEM));
  // son sayfaya toplamlar, şartlar ve onay da sığmalı: kalem ve şart satırlarının toplam yükü 15 satırı aşarsa bunlar yeni sayfaya geçer
  const satirYuku = t => t ? Math.ceil(t.length / 80) : 0;
  if (parca[parca.length - 1].length + (a.iskonto ? 1 : 0) + satirYuku(a.teslim) + satirYuku(a.odeme) + satirYuku(a.not) > 15) parca.push([]);
  const sonuc = `<table class="tk-sonuc"><tbody><tr><th>Ara toplam</th><td>${tl(T.araToplam)}</td></tr>
        ${a.iskonto ? `<tr><th>İskonto %${sayi(a.iskonto)}</th><td>−${tl(T.iskonto)}</td></tr>` : ''}
        <tr><th>KDV %${sayi(a.kdv)}</th><td>${tl(T.kdv)}</td></tr><tr class="tk-genel"><th>Genel toplam</th><td>${tl(T.genelToplam)}</td></tr></tbody></table>
      <h2>Şartlar</h2><table class="tk-bilgi"><tbody><tr><th>Geçerlilik</th><td>Bu teklif ${sayi(a.gecerlilik, 0)} gün geçerlidir.</td></tr>
        ${a.teslim ? `<tr><th>Teslim süresi</th><td>${kac(a.teslim)}</td></tr>` : ''}${a.odeme ? `<tr><th>Ödeme</th><td>${kac(a.odeme)}</td></tr>` : ''}${a.not ? `<tr><th>Not</th><td>${kac(a.not)}</td></tr>` : ''}
        <tr><th>Kapsam</th><td>Beyaz eşya, ankastre cihazlar, evye ve batarya fiyat dökümünde fiyatıyla yazmıyorsa teklife dahil değildir. Ölçü, renk ve malzeme bu dosyadaki tasarıma göredir; değişiklikte fiyat yeniden hesaplanır.</td></tr></tbody></table>
      <div class="tk-onay"><div>Firma onayı</div><div>Müşteri onayı</div></div>`;
  parca.forEach((kl, i) => {
    const son = i === parca.length - 1;
    sayfa('FİYAT TEKLİFİ', (kl.length || parca.length === 1 ? `${i ? '' : '<h2>Fiyat dökümü</h2>'}<table class="tk-tablo tk-fiyat"><thead><tr><th>Kalem</th><th>Miktar</th><th>Birim</th><th>Birim fiyat</th><th>Tutar</th></tr></thead><tbody>${kl.map(satir).join('') || '<tr><td colspan="5">Fiyat girilmedi.</td></tr>'}</tbody></table>` : '') + (son ? sonuc : ''));
  });

  const toplam = sayfalar.length + 1, adres = [firma.ad, firma.iletisim].filter(Boolean).map(kac).join(' · ');
  const kapak = `<section class="tk tk-kapak"><div class="tk-cerceve"><i class="tk-kose a"></i><i class="tk-kose b"></i><i class="tk-kose c"></i><i class="tk-kose d"></i>
    ${logo ? `<img class="tk-logo" src="${logo}" alt="">` : ''}${firmaAd ? `<p class="tk-firma">${firmaAd}</p>` : ''}<h1>Teklif Dosyası</h1><div class="tk-ayrac"></div>
    <table><tbody>${b.musteri ? `<tr><th>Sayın</th><td>${kac(b.musteri)}</td></tr>` : ''}<tr><th>Proje</th><td>${kac(p.ad)}</td></tr><tr><th>Teklif no</th><td>${kac(no)}</td></tr><tr><th>Tarih</th><td>${tarih}</td></tr></tbody></table>
    <div class="tk-resim">${resim}</div>
    <p class="tk-iletisim">${iletisim || '&nbsp;'}</p><p class="tk-gecerli">Bu teklif ${sayi(a.gecerlilik, 0)} gün geçerlidir.</p></div></section>`;
  return kapak + sayfalar.map((s, i) => `<section class="tk">${s}<div class="tk-alt2"><span>${adres}</span><span>Sayfa ${i + 2} / ${toplam}</span></div></section>`).join('');
}
