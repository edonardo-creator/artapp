// İşleme föyü (yazdırılabilir sayfalar) ve CNC paketi (parça başına DXF + liste, ZIP). Veri isleme.js'ten gelir.
import { TANIM, projeAyarla, ARK, ARK_KANAL, KANAL_ARKA, KANAL_DERIN, KOSE_KURAL } from './moduller.js';
import { modulIslemleri, islemOzeti, parcaDxf, delikKatmani, kanalKatmani, zipYap, ISLEME_KURAL, ISLEME_ALAN, islemeKurali } from './isleme.js';
import { modulNumaralari, modulKesimi, kesimListesi, BANT_YAZI } from './kesim.js';
import { uretimAyari } from './uretim.js';
import { camEtiketi, levhaTuru, camListesiCsv, modulKodListesiCsv } from './adeko.js';
import { odaGorunumleri } from './odalar.js';

const kac = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tr = n => String(Math.round(n * 10) / 10).replace('.', ',');
const imza = m => JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k]) => !['id', 'x', 'duvar', 'not', 'z', 'aci', 'adk'].includes(k)).sort(([a], [b]) => a.localeCompare(b))));
const RENK = i => i.cap >= 20 ? '#1a8a4a' : i.der ? '#d9741a' : '#1f7ae0'; // yuva yeşil, kör delik turuncu, boydan boya mavi

// Parçanın çizimi: X (boy) sağa, Y (en) yukarı; delikler gerçek çapında (çok küçükse görünür kalacak kadar büyütülür)
export function parcaSvg(P) {
  const pay = Math.max(P.boy, P.en) * 0.07 + 22, W = P.boy + 2 * pay, H = P.en + 2 * pay, yy = y => P.en - y, ince = Math.max(P.boy, P.en) / 380;
  let s = `<svg viewBox="${-pay} ${-pay} ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif"><rect x="0" y="0" width="${P.boy}" height="${P.en}" fill="#fff" stroke="#1b2530" stroke-width="${ince * 1.6}"/>`;
  for (const i of P.islem) {
    if (i.t === 'kertme') s += `<rect x="${i.x0}" y="${yy(i.y1)}" width="${i.x1 - i.x0}" height="${i.y1 - i.y0}" fill="#f3b9b9" stroke="#c0392b" stroke-width="${ince}" stroke-dasharray="${ince * 5} ${ince * 3}"/>`;
    else if (i.t === 'kanal') s += `<rect x="${i.x0}" y="${yy(i.y1)}" width="${i.x1 - i.x0}" height="${i.y1 - i.y0}" fill="#bcd6f5" stroke="#1653a0" stroke-width="${ince}"/>`;
    else if (i.t === 'cizgi') s += `<line x1="${i.x}" y1="0" x2="${i.x}" y2="${P.en}" stroke="#66727f" stroke-width="${ince}" stroke-dasharray="${ince * 7} ${ince * 4}"/>`;
    else { const r = Math.max(i.cap / 2, ince * 3.2); s += `<circle cx="${i.x}" cy="${yy(i.y)}" r="${r}" fill="${i.der ? RENK(i) : 'none'}" fill-opacity="0.35" stroke="${RENK(i)}" stroke-width="${ince * 1.5}"/>`; }
  }
  const f = pay * 0.42; // ölçüler ve eksen
  s += `<text x="${P.boy / 2}" y="${P.en + pay * 0.62}" font-size="${f}" text-anchor="middle" fill="#1653a0">${P.boy}</text><text x="${-pay * 0.3}" y="${P.en / 2}" font-size="${f}" text-anchor="middle" fill="#1653a0" transform="rotate(-90 ${-pay * 0.3} ${P.en / 2})">${P.en}</text>`
    + `<path d="M0 ${P.en} h${pay * 0.9} M0 ${P.en} v${-pay * 0.9}" stroke="#c0392b" stroke-width="${ince * 1.6}" fill="none"/><text x="${pay}" y="${P.en + f * 0.35}" font-size="${f * 0.8}" fill="#c0392b">X</text><text x="${-f * 0.3}" y="${P.en - pay}" font-size="${f * 0.8}" fill="#c0392b" text-anchor="middle">Y</text>`;
  return s + '</svg>';
}

// İşlemlerin yazılı dökümü: aynı çap, derinlik ve amaçtakiler tek satırda, koordinatlarıyla
function islemDokumu(P) {
  const g = new Map();
  for (const i of P.islem) {
    const a = i.t === 'delik' ? `<i class="if-nokta" style="background:${RENK(i)}"></i>Ø${tr(i.cap)} ${i.der ? tr(i.der) + ' mm derin' : 'boydan boya'} · ${kac(i.ac)}` : i.t === 'kertme' ? `<i class="if-nokta" style="background:#c0392b"></i>Kertme · ${kac(i.ac)}` : i.t === 'kanal' ? `<i class="if-nokta" style="background:#1653a0"></i>Kanal ${tr(Math.min(i.x1 - i.x0, i.y1 - i.y0))} mm geniş, ${tr(i.der)} mm derin · ${kac(i.ac)}` : `<i class="if-nokta" style="background:#66727f"></i>${kac(i.ac)}`;
    const d = i.t === 'delik' ? `(${tr(i.x)} ; ${tr(i.y)})` : i.t === 'kertme' || i.t === 'kanal' ? `X ${tr(i.x0)}–${tr(i.x1)}, Y ${tr(i.y0)}–${tr(i.y1)}` : `X ${tr(i.x)}`;
    (g.get(a) || g.set(a, []).get(a)).push(d);
  }
  return [...g].map(([a, l]) => `<li>${a}: <span>${l.join(' ')}</span></li>`).join('') + (P.alin ? `<li><i class="if-nokta" style="background:#8a929b"></i>Alın (kenar) vidası: ${P.alin} adet, yan panellerdeki vida deliklerinin karşısına</li>` : '') + (P.alinKavela ? `<li><i class="if-nokta" style="background:#8a929b"></i>Alın (kenar) kavelası Ø8 × 18: ${P.alinKavela} adet, yan panellerdeki kavela deliklerinin karşısına (yatay delme)</li>` : '');
}

// Modül grupları: aynı ölçü ve donanımdaki dolaplar bir kez
function gruplar(q) {
  const { no, sirali } = modulNumaralari(q), g = new Map();
  for (const m of sirali) { const a = imza(m); (g.get(a) || g.set(a, []).get(a)).push(m); }
  return [...g.values()].map(l => ({ m: l[0], nolar: l.map(o => no[o.id]) }));
}

export function islemeSayfa(p) {
  let h = '';
  const tarih = new Date().toLocaleDateString('tr-TR'), R = islemeKurali(p);
  // kurallar: ekranda değiştirilebilir, baskıya çıkmaz (değişen ölçü kalın yazılır)
  const ayarHtml = `<section class="sayfa yazdirma isleme"><header><h1>İşleme kuralları<small>Delik, yuva ve kertme ölçüleri. Değiştirdiğiniz ölçü bu projeye kaydedilir; föy, kesim listesi ve CNC paketi ona göre yeniden hesaplanır.</small></h1></header>
    <div class="kagitAyar">${Object.entries(ISLEME_ALAN).map(([k, [alt, ust, ad, birim]]) => `<label class="alan${R[k] !== ISLEME_KURAL[k] ? ' degisik' : ''}"><span>${ad}</span><input type="number" data-isleme="${k}" value="${R[k]}" min="${alt}" max="${ust}" step="0.5" inputmode="decimal"><em>${birim}</em></label>`).join('')}</div>
    <div class="dugmeler"><button type="button" data-isleme-is="varsayilan" title="Bu ölçüler bu cihazda açılan bütün projelerin başlangıç ölçüsü olur">Bu ölçüleri varsayılan yap</button><button type="button" data-isleme-is="sifirla" title="Bu projedeki ve bu cihazdaki değişiklikler silinir">Uygulamanın ölçülerine dön</button></div>
    <p class="aciklama">Menteşe sayısı ve kulp delik aralıkları eB Creator'daki kurallardan gelir: kapak boyu 95 cm'ye kadar 2, 150'ye kadar 3, 200'e kadar 4, üstünde 5 menteşe; kulp delik aralığı kulp kataloğunda yazan ölçüdür. Öbür ölçüler Adeko kütüphanenizdeki CAM ayarlarından alındı (kavela Ø8, vida Ø3, raf pimi Ø5 × 10, menteşe yuvası Ø35 × 15 ve kenardan 23 mm, kulp Ø5; arşiv 2020–2022 tarihli). Bugünkü ölçünüz farklıysa buradan yazabilirsiniz.</p></section>`;
  for (const g of odaGorunumleri(p)) {
    projeAyarla(g.proje.ayar);
    for (const { m, nolar } of gruplar(g.proje)) {
      // aynı ölçüde ve aynı işlemli parçalar tek kartta, adediyle
      const tekil = new Map();
      for (const P of modulIslemleri(m, R).filter(P => P.islem.length || P.alin || P.alinKavela)) { const a = JSON.stringify(P), e = tekil.get(a); if (e) e.adet++; else tekil.set(a, { ...P, adet: 1 }); }
      const paneller = [...tekil.values()];
      if (!paneller.length) continue;
      h += `<section class="sayfa isleme"><header><h1>${kac(p.ad)}<small>${g.ad ? kac(g.ad) + ' · ' : ''}İşleme föyü</small></h1><span>No ${nolar.join(', ')} · ${kac(TANIM[m.tip].ad)}${nolar.length > 1 ? ` × ${nolar.length}` : ''}</span><span>${m.w} × ${m.h} × ${m.d} mm · ${tarih}</span></header>
        <div class="if-izgara">${paneller.map(P => `<figure><figcaption><b>${kac(P.ad)}</b> ${P.boy} × ${P.en} × ${P.kalinlik} · ${P.malzeme}${P.adet > 1 ? ` · <b>${P.adet} adet</b>` : ''}<span>${P.yuz ? `İşlenen: ${P.yuz}` : ''}${P.kose ? ` · başlangıç: ${P.kose}` : ''}</span></figcaption>${P.islem.length ? parcaSvg(P) : ''}<ul>${islemDokumu(P)}</ul></figure>`).join('')}</div></section>`;
    }
  }
  projeAyarla(p.ayar);
  if (!h) return '<section class="sayfa"><p class="aciklama">Bu projede işlenecek dolap parçası yok.</p></section>';
  return ayarHtml + h + `<section class="sayfa isleme"><header><h1>${kac(p.ad)}<small>İşleme föyü</small></h1><span>Kurallar</span><span>${tarih}</span></header>
    <p class="aciklama"><b>Okuma.</b> Her parça işlenen yüzüne karşıdan bakılarak çizilmiştir: X parçanın boyu, Y eni boyunca ölçülür; kırmızı köşe başlangıç noktasıdır. Sol ve sağ yan birbirinin aynasıdır. Koordinatlar (X ; Y) olarak milimetredir. Mavi halka: boydan boya delik · turuncu: kör delik · yeşil: menteşe yuvası · kırmızı taralı: kertme · açık mavi şerit: arkalık kanalı · kesik çizgi: ray hizası.</p>
    <p class="aciklama"><b>Bu projedeki kurallar.</b> Gövde birleşimi: yatay parçanın iki ucunda, yan panelin iç yüzünde ${R.kavelaCap ? `Ø${tr(R.kavelaCap)}, ${tr(R.kavelaDerin)} mm derin kavela deliği (ön ve arka kenardan ${R.kavelaKenar} mm) ve ` : ''}boydan boya Ø${tr(R.vidaCap)} vida deliği (ön ve arka kenardan ${R.vidaKenar} mm). ${R.kucukParca} mm'den kısa birleşimde (kayıt) ortada tek kavela, uçlardan ${R.kucukVidaKenar} mm içeride iki vida. Yatay parçanın alnındaki kavela deliği (Ø${tr(R.kavelaCap)} × ${R.kavelaAlin}) yatay delmedir.
      Raf pimi: Ø${tr(R.pimCap)}, ${R.pimDerin} mm derin; rafın ön ve arka kenarından ${R.pimKenar} mm içeride; raf hizasında ve ${R.pimAdim} mm aşağı–yukarısında.
      Menteşe yuvası: Ø${R.yuvaCap}, ${R.yuvaDerin} mm derin; kapak kenarından merkeze ${tr(R.yuvaKenar)} mm; alttan ve üstten ${R.yuvaUc} mm. Yuvanın ${tr(R.yuvaVida)} mm içerisinde ${R.yuvaVidaAralik} mm aralıklı iki vida işareti (Ø${tr(R.isaretCap)}, ${R.isaretDerin} mm). Menteşe tabanı: yan panelde ön kenardan ${R.tabanOn} mm içeride, yuva hizasının ${R.tabanAralik / 2} mm altında ve üstünde Ø${tr(R.tabanCap)}, ${R.tabanDerin} mm derin işaret.
      Kulp: Ø${tr(R.kulpCap)} boydan boya. Gola: yan panelin ön kenarında ${R.golaDerin} × ${R.golaL} mm L kertme, ara profilde ${R.golaDerin} × ${R.golaC} mm C kertme. ${ARK_KANAL ? `Arkalık kanallıdır: yan panellerin iç yüzünde, alt tablanın üst ve üst tablanın alt yüzünde arka kenardan ${tr(KANAL_ARKA)} mm içeride, ${tr(ARK + 0.5)} mm geniş, ${tr(KANAL_DERIN)} mm derin kanal; arkalık kanalın dibine kadar girer. Kayıtlı (üst tablasız) dolapta arkalık üst kenara kadar çıkar ve arka kayıta arkadan tutturulur. ${KOSE_KURAL ? 'L köşe dolabında iki kolun arkalık kanalı da çizilir; köşede iki arkalık birbirine dayanır (orada kanal yoktur). Kavisli dolapta yan panelin kanalı föydedir, kavisli tablaların kanalı elde açılır.' : 'Bu projede L köşe ve kavisli dolapta arkalık çakmadır (23 Kasım 2026 öncesinin kurgusu).'} Bağlantı ve kanal ölçüleri “Atölye standartları”ndan değiştirilir.` : 'Arkalık çakmadır (kanal açılmaz); kanallı yapmak için “Atölye standartları”ndan arkalık bağlantısını değiştirin.'} Çekmece rayının delikleri ray türüne göre değiştiği için yalnızca kasa altı hizası işaretlenir.
      Menteşe sayısı ve kulp delik aralığı eB Creator'daki kurallardır; öbür ölçüler Adeko kütüphanenizdeki CAM ayarlarından alınmıştır ve “İşleme kuralları” bölümünden değiştirilir.</p></section>`;
}

// CNC paketi: kesilecek her levha parçası için bir DXF (işlemesi olmayan parça yalnız dış hat) ve parça listesi.
// Klasörler levha türüne göredir (malzeme, kalınlık, renk): bir klasördeki bütün parçalar aynı levhadan kesilir; yerleştirmeyi CAM programı yapar.
// Hedef: kullanıcının Adeko CAM'i (Poyraz Vigor 2136). Dosya adında parçanın CAM programındaki adı yazar (SOL_PANEL, KAPAK…; adeko.js).
// Yanında Adeko CAM "Kesim listesi" içe aktarımı için CAM parça listesi ve Adeko çizimi için modül kod listesi vardır.
// Dönen: { ad, veri: Uint8Array (ZIP), parca: sayı, klasor: sayı }
const TR_HARF = { ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' };
const duz = s => String(s).replace(/[çÇğĞıİöÖşŞüÜ]/g, c => TR_HARF[c]).replace(/[^\x20-\x7e]/g, '-'); // Türkçe harfsiz düz yazı (OKU.txt)
const dosyaAdi = s => duz(s).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'parca';
const csv = l => l.map(v => /[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(';');
export function cncPaketi(p) {
  const kural = islemeKurali(p), ur = uretimAyari(p), dosyalar = [], adlar = new Map(), katman = new Map(), klasorler = new Map();
  const liste = ['Klasör (levha);Oda;Modül no;Modül;Parça;CAM etiketi;Malzeme;Renk;Boy (X);En (Y);Kalınlık;Kenar bandı;İşlenen yüz;Başlangıç köşesi;İşlemler;Dosya'];
  const say = (k, cap, der) => { const e = katman.get(k) || katman.set(k, { adet: 0, cap, der }).get(k); e.adet++; };
  // s: kesim listesi satırı (renk, bant), P: işlemeli parça (yoksa yalnız dış hat)
  const ekle = (oda, no, modul, s, P, sira = 0) => {
    const { tur, renk } = levhaTuru(s, ur), etiket = camEtiketi(P.ad, s.malzeme, sira);
    const klasor = dosyaAdi(`${tur} ${P.kalinlik}mm ${renk}`), temel = `${klasor}/${oda ? dosyaAdi(oda) + '-' : ''}${no ? 'M' + String(no).padStart(2, '0') + '-' : ''}${etiket.replace(/_$/, '')}-${P.boy}x${P.en}x${P.kalinlik}`;
    const n = (adlar.get(temel) || 0) + 1, ad = `${temel}${n > 1 ? '-' + n : ''}.dxf`;
    adlar.set(temel, n); klasorler.set(klasor, (klasorler.get(klasor) || 0) + 1);
    say('KONTUR');
    for (const i of P.islem) i.t === 'delik' ? say(delikKatmani(i), i.cap, i.der) : i.t === 'kanal' ? say(kanalKatmani(i), 0, i.der) : say(i.t === 'kertme' ? 'KERTME' : 'ISARET');
    dosyalar.push({ ad, veri: parcaDxf(P) });
    liste.push(csv([klasor, oda || '', no || '', modul, P.ad, no ? `${etiket}$${no}` : etiket, tur, renk, P.boy, P.en, P.kalinlik, BANT_YAZI(s), P.yuz || '', P.kose || '', islemOzeti(P), ad]));
  };
  const bos = s => ({ ad: s.ad, malzeme: s.malzeme, boy: s.boy, en: s.en, kalinlik: s.kalinlik, islem: [], yuz: '', kose: '', alin: 0, alinKavela: 0 });
  for (const g of odaGorunumleri(p)) {
    projeAyarla(g.proje.ayar);
    const { no, sirali } = modulNumaralari(g.proje);
    for (const m of sirali) {
      // işlemeli parçalar, kesim listesindeki satırlarla ad ve ölçüden eşleşir; eşleşmeyen satır (arkalık, baza, çekmece parçası) düz dikdörtgendir
      const havuz = new Map(), sira = new Map(), anahtar = s => [s.malzeme, s.ad, s.boy, s.en, s.kalinlik].join('|');
      for (const P of modulIslemleri(m, kural)) (havuz.get(anahtar(P)) || havuz.set(anahtar(P), []).get(anahtar(P))).push(P);
      for (const s of modulKesimi(m, g.proje).parcalar) {
        if (s.malzeme === 'Cam') continue;
        for (let i = 0; i < s.adet; i++) { const n = sira.get(s.ad) || 0; sira.set(s.ad, n + 1); ekle(g.ad, no[m.id], TANIM[m.tip].ad, s, havuz.get(anahtar(s))?.shift() || bos(s), n); } // n: bu dolapta aynı adlı kaçıncı parça (yan → sol, sağ)
      }
      for (const kalan of havuz.values()) for (const P of kalan) ekle(g.ad, no[m.id], TANIM[m.tip].ad, { malzeme: P.malzeme, renk: '', bant: 0 }, P);
    }
    // dolaba bağlı olmayan levha parçaları (ada bitiş paneli, bar dikmesi, düz MDF taç)
    for (const s of kesimListesi(g.proje).satirlar) if (!s.moduller.length && !['Tezgah', 'Cam'].includes(s.malzeme)) for (let i = 0; i < s.adet; i++) ekle(g.ad, 0, '', s, bos(s));
  }
  projeAyarla(p.ayar);
  const parca = dosyalar.length, sirala = [...katman].sort((a, b) => (a[0] === 'KONTUR' ? -1 : b[0] === 'KONTUR' ? 1 : 0) || a[0].localeCompare(b[0]));
  const katmanSatiri = ([k, e]) => '  ' + k.padEnd(22) + String(e.adet).padStart(5) + '   ' + (k === 'KONTUR' ? 'dis hat: parcayi levhadan kesen takim' : k === 'KERTME' ? 'kesilip atilacak bolge (gola profili), boydan boya' : k === 'ISARET' ? 'isaret cizgisi (cekmece rayi hizasi): islem atanmaz' : k.startsWith('KANAL_') ? `arkalik kanali: kapali cizgi kanalin bolgesidir, ${R_(e.der)} mm derin (freze)` : `delik: cap ${R_(e.cap)} mm, ${e.der ? R_(e.der) + ' mm derin' : 'boydan boya'}`);
  dosyalar.push({ ad: 'parca-listesi.csv', veri: '\ufeff' + liste.join('\r\n') + '\r\n' });
  dosyalar.push({ ad: 'cam-parca-listesi.csv', veri: camListesiCsv(p) }, { ad: 'modul-kod-listesi.csv', veri: modulKodListesiCsv(p) });
  dosyalar.push({ ad: 'OKU.txt', veri: [
    `ARTAPP CNC paketi - ${duz(p.ad)}`,
    'Hazirlandigi yer: Adeko CAM (adekoCAM) ve yerlestirmeli (nesting) CNC. Katman adini okuyan baska CAM programlarinda da kullanilir.',
    '',
    'ICINDEKILER',
    `  ${parca} parca, ${klasorler.size} klasor. Her DXF tek bir parcadir; ayni parcadan uc tane gerekiyorsa uc dosya vardir.`,
    '  Klasorler levha turune goredir (malzeme, kalinlik, renk). Bir klasordeki butun parcalar ayni levhadan kesilir:',
    ...[...klasorler].map(([k, n]) => '    ' + k.padEnd(40) + String(n).padStart(4) + ' parca'),
    '  parca-listesi.csv: butun parcalar, kenar bandi ve islemleriyle (Excel ile acilir).',
    '  cam-parca-listesi.csv: Adeko CAM "Kesim listesi" ice aktarimi icin parca listesi (olculer mm, kenar bantlari ve desen yonuyle).',
    '  modul-kod-listesi.csv: Adeko ciziminde cc komutuyla girilecek modul kodlari, duvar duvar ve soldan saga.',
    '  Dosya adinda parcanin CAM programindaki adi yazar (SOL_PANEL, SAG_PANEL, ALT_PANEL, UST_PANEL, HAREKETLI_RAF, SABIT_RAF, PN, YNK, KAPAK...).',
    '  Cam, tezgah ve hazir alinan donanim pakette yoktur. Kavisli parcalar sablonla kesilir, pakette yoktur.',
    '',
    'DXF KURALLARI',
    '  Birim milimetre. Baslangic (0,0) parcanin sol alt kosesi; X parcanin boyu, Y eni.',
    '  Parca, islenen yuzune karsidan bakilarak cizilmistir (islenen yuz ve baslangic kosesi listede yazar). Sol ve sag yan birbirinin aynasidir.',
    '  Dis hat, kertme ve kanal kapali coklu cizgidir (POLYLINE), delikler dairedir (CIRCLE).',
    '  Derinlik iki yerde yazar: katman adinda (..._Z12 = 12 mm, ..._BOYDAN = boydan boya) ve nesnenin kalinlik alaninda (DXF grup 39).',
    '  Boydan boya islemde ve dis hatta kalinlik alani levha kalinligidir.',
    '',
    'BU PAKETTEKI KATMANLAR (katman, adet, anlami)',
    ...sirala.map(katmanSatiri),
    '',
    'ADEKO ILE UC YOL (zip dosyasini once bir klasore acin)',
    '  A. Adeko cizimi uzerinden: modul-kod-listesi.csv dosyasindaki kodlari Adeko\'da cc yazip sirayla girin, dolaplari duvar basindan olcuye yerlestirin.',
    '     Adeko projeyi Adeko CAM\'e kendisi gonderir; delikler ve baglantilar Adeko\'nun kendi kurallariyla gelir. Kodlar oneridir: uymayani Adeko listesinden secin.',
    '  B. Kesim listesi olarak: cam-parca-listesi.csv dosyasini Adeko CAM\'de "Kesim listesi" ice aktarimiyla alin. Parcalar dikdortgen gelir, delik tasimaz.',
    '     Sutunlar eB Creator\'daki CAM listesiyle aynidir; uyusmayan sutun olursa bildirin.',
    '  C. DXF olarak: delikli parcalar icin. Adeko CAM\'de DXF ice aktarin; her levha klasorunu kendi malzemesi ve kalinligi ile alin.',
    '     Prosedurde yukaridaki katmanlara operasyon ve takim atayin (ornek: DELIK_D5_Z12 = 5 mm matkap, KONTUR = dis kesim freze); proseduru saklayin.',
    '  Kesim plani, takim yolu ve makine kodu (NC) her yolda Adeko CAM\'de, makinenizin post islemcisiyle uretilir.',
    '  Ilk kullanimda tek bir dolapla deneyin.',
    '',
    `Bu projedeki olculer: ${kural.kavelaCap ? `kavela ${R_(kural.kavelaCap)} x ${R_(kural.kavelaDerin)} mm, ` : ''}vida deligi ${R_(kural.vidaCap)} mm, raf pimi ${R_(kural.pimCap)} x ${R_(kural.pimDerin)} mm, mentese yuvasi ${R_(kural.yuvaCap)} x ${R_(kural.yuvaDerin)} mm (kenardan ${R_(kural.yuvaKenar)} mm), kulp deligi ${R_(kural.kulpCap)} mm. ${ARK_KANAL ? `Arkalik kanalli: kanal arka kenardan ${R_(KANAL_ARKA)} mm iceride, ${R_(ARK + 0.5)} mm genis, ${R_(KANAL_DERIN)} mm derin.` : 'Arkalik cakma.'}`,
    'Bu dosyalar makine kodu (G kodu) degildir.',
  ].join('\r\n') + '\r\n' });
  return { ad: dosyaAdi(p.ad) + '-cnc.zip', veri: zipYap(dosyalar), parca, klasor: klasorler.size };
}
const R_ = n => String(n).replace('.', ',');
