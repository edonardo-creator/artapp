// Parça etiketleri: kesim planındaki her parça için 70 × 70 mm bir etiket (her sayfa bir etiket; etiket yazıcısı için).
// Düzen kullanıcının kendi uygulaması eB Creator'daki parça etiketinden alınmıştır (parça çizimi, bantlı kenarlar kalın, ölçü oku,
// proje, modül, parça, ölçüler); orada da atölyenin CAM programındaki etiket örneğinden kurulmuştu.
// Etiketin numarası kesim planındaki parça numarasıdır; dolap, poz ve CAM adı CAM parça listesiyle aynı kaynaktan gelir.
import { kesimPlani } from './kesimplan.js';
import { camParcalari, camParcaBilgisi, camEtiketi, camMalzemeAdi } from './adeko.js';
import { projeAyarla } from './moduller.js';

export const ETIKET_MM = 70;
const kac = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const anahtar = (malzeme, tur, renk, kalinlik, ad, boy, en) => [malzeme, tur || '', renk, kalinlik, ad, boy, en].join('|');

// Projenin etiketleri: kesim planındaki sırayla (levha levha). Levhaya sığmayan parçalar sona, levhasız eklenir.
// Her etiket: { no, levha, levhaSayisi, malzeme, renk, kalinlik, ad, boy, en, cam, poz, kod, oda, modulNo, modul, malzemeAdi, bant: [üst, alt, sol, sağ], desen }
export function parcaEtiketleri(p) {
  const plan = kesimPlani(p), yon = plan.ayar.yon;
  // kimlik havuzu: ölçüsü ve malzemesi aynı parçalar birbirinin yerine geçer; etiketler bu parçaların dolaplarına sırayla dağıtılır
  const havuz = new Map();
  for (const r of camParcalari(p)) {
    const b = camParcaBilgisi(r.s, yon, r.ur), a = anahtar(r.s.malzeme, r.s.tur, r.s.renk, r.s.kalinlik, r.s.ad, r.s.boy, r.s.en);
    const kuyruk = havuz.get(a) || havuz.set(a, []).get(a);
    for (const [cam, adet] of b.adlar) for (let i = 0; i < adet; i++)
      kuyruk.push({ cam, poz: r.poz, kod: r.kod, oda: r.oda, modulNo: r.modulNo, modul: r.modul, malzemeAdi: b.malzeme, bant: b.bant, desen: !b.doner });
  }
  projeAyarla(p.ayar);
  const etiketler = [];
  const ekle = (g, c, levha) => {
    const k = havuz.get(anahtar(g.malzeme, g.tur, g.renk, g.kalinlik, c.ad, c.boy, c.en))?.shift();
    const s = { malzeme: g.malzeme, tur: g.tur, renk: g.renk, kalinlik: g.kalinlik, ad: c.ad, boy: c.boy, en: c.en };
    etiketler.push({ no: c.no, levha, levhaSayisi: g.levhalar.length, ...s,
      ...(k || { cam: camEtiketi(c.ad, g.malzeme), poz: 0, kod: '', oda: '', modulNo: 0, modul: '', malzemeAdi: camMalzemeAdi(s), bant: [0, 0, 0, 0], desen: false }) });
  };
  for (const g of plan.gruplar) g.levhalar.forEach((l, i) => { for (const c of l.konan) ekle(g, c, i + 1); });
  let no = etiketler.length;
  for (const g of plan.gruplar) for (const s of g.sigmayan) for (let i = 0; i < (s.adet || 1); i++) ekle(g, { ...s, no: ++no }, 0);
  return { plan, etiketler };
}

// Yazı: genişliği tahmin edilir; sığmıyorsa sıkıştırılır (çok uzunsa sonu kesilir)
function yazi(t, x, y, boyut, { kalin = false, en = 0, hiza = 'start', renk = '#000' } = {}) {
  t = String(t ?? '');
  const harf = boyut * (kalin ? 0.58 : 0.53);
  if (en && t.length * harf > en * 1.7) t = t.slice(0, Math.max(3, Math.floor(en * 1.7 / harf) - 1)) + '…';
  const sik = en && t.length * harf > en ? ` textLength="${en}" lengthAdjust="spacingAndGlyphs"` : '';
  return `<text x="${x}" y="${y}" font-size="${boyut}"${kalin ? ' font-weight="700"' : ''}${hiza !== 'start' ? ` text-anchor="${hiza}"` : ''}${renk !== '#000' ? ` fill="${renk}"` : ''}${sik}>${kac(t)}</text>`;
}
const BANT_YAZISI = b => { const n = b.filter(Boolean).length; return n >= 4 ? '4 kenar' : n ? '1 boy kenarı' : 'yok'; };

// Tek etiketin çizimi (ölçüler mm; 70 × 70). logo: 'tanim' (resim bu etikette tanımlanır), 'kullan' (ilk etiketteki resim kullanılır) ya da boş (firma adı yazılır)
export function etiketSvg(e, bilgi = {}, logo = '') {
  const M = ETIKET_MM, gri = '#333';
  let s = `<svg viewBox="0 0 ${M} ${M}" width="${M}mm" height="${M}mm" role="img" aria-label="Parça etiketi ${e.no}" font-family="Arial, Helvetica, sans-serif">`;
  if (logo === 'tanim') s += `<defs><image id="etkLogo" href="${kac(bilgi.logo)}" width="30" height="8.5" preserveAspectRatio="xMinYMid meet"/></defs>`;
  // üst satır: firma, parça numarası
  s += logo ? '<use href="#etkLogo" x="3" y="2"/>' : yazi(bilgi.firma || 'ARTAPP', 3, 8, 4, { kalin: true, en: 36 });
  s += yazi('No', 67 - String(e.no).length * 4.2 - 1.2, 9, 2.6, { hiza: 'end', renk: gri }) + yazi(e.no, 67, 9, 7, { kalin: true, hiza: 'end' });
  s += `<path d="M3 12.2H67" stroke="#000" stroke-width=".2"/>`;
  // parça çizimi: boy yatay; bantlı kenar kalın çizgi; desen yönü korunuyorsa ortada çift yönlü ok
  const k = Math.min(38 / e.boy, 15 / e.en), rw = Math.max(6, e.boy * k), rh = Math.max(2.2, e.en * k), rx = 4, ry = 15.5 + (15 - rh) / 2;
  s += `<rect x="${rx}" y="${ry.toFixed(2)}" width="${rw.toFixed(2)}" height="${rh.toFixed(2)}" fill="none" stroke="#000" stroke-width=".25"/>`;
  const kenar = [[rx, ry, rx + rw, ry], [rx, ry + rh, rx + rw, ry + rh], [rx, ry, rx, ry + rh], [rx + rw, ry, rx + rw, ry + rh]];
  const kalin = kenar.filter((_, i) => e.bant[i]).map(([a, b, c, d]) => `M${a.toFixed(2)} ${b.toFixed(2)}L${c.toFixed(2)} ${d.toFixed(2)}`).join('');
  if (kalin) s += `<path d="${kalin}" stroke="#000" stroke-width=".9" stroke-linecap="square"/>`;
  if (e.desen && rh >= 3) {
    const cx = rx + rw / 2, cy = ry + rh / 2, a = Math.min(4, rw / 4);
    s += `<path d="M${(cx - a).toFixed(2)} ${cy.toFixed(2)}H${(cx + a).toFixed(2)}" stroke="#000" stroke-width=".3"/>`
      + [-1, 1].map(d => `<path d="M${(cx + d * a).toFixed(2)} ${cy.toFixed(2)}l${-d * 1.1} -.7v1.4z"/>`).join('');
  }
  // ölçüler: boy altta (oklu), en sağda
  const oy = ry + rh + 3.2;
  s += `<path d="M${rx} ${oy.toFixed(2)}H${(rx + rw).toFixed(2)}" stroke="#000" stroke-width=".15"/>`
    + `<path d="M${rx} ${oy.toFixed(2)}l2 -.6v1.2z"/><path d="M${(rx + rw).toFixed(2)} ${oy.toFixed(2)}l-2 -.6v1.2z"/>`
    + yazi(e.boy, rx + rw / 2, oy + 3.6, 3.4, { hiza: 'middle' }) + yazi(e.en, rx + rw + 1.6, ry + rh / 2 + 1.2, 3.4);
  // sağ sütun: levha ve kalınlık
  s += yazi('LEVHA', 67, 17.5, 2.1, { hiza: 'end', renk: gri }) + yazi(e.levha ? `${e.levha} / ${e.levhaSayisi}` : '—', 67, 22.6, 4.6, { kalin: true, hiza: 'end' })
    + yazi('KALINLIK', 67, 28.2, 2.1, { hiza: 'end', renk: gri }) + yazi(`${e.kalinlik} mm`, 67, 33.2, 4.2, { kalin: true, hiza: 'end' });
  s += `<path d="M3 39.8H67" stroke="#000" stroke-width=".2"/>`;
  // alanlar
  const modul = e.modulNo ? `${e.oda ? e.oda + ' · ' : ''}No ${e.modulNo} · ${e.modul}` : `${e.oda ? e.oda + ' · ' : ''}${e.modul || 'Serbest parça'}`;
  const satir = [['Proje', [bilgi.proje, bilgi.musteri].filter(Boolean).join(' · ') || 'Proje', true], ['Modül', modul, true], ['Parça', e.ad, true],
    ['Ölçü', `${e.boy} × ${e.en} × ${e.kalinlik} mm`, true], ['Malzeme', e.malzemeAdi, false], ['Bant', BANT_YAZISI(e.bant), false]];
  satir.forEach(([ad, deger, kalinYazi], i) => { const y = 44.4 + i * 4.55; s += yazi(ad, 3, y, 2.5, { renk: gri }) + yazi(deger, 16, y, 3.1, { kalin: kalinYazi, en: 51 }); });
  // CAM adı: CAM parça listesindeki parça adı $ poz numarası, yanında dolabın Adeko kodu
  s += yazi(`${e.cam}${e.poz ? '$' + e.poz : ''}${e.kod ? ' · ' + e.kod : ''}`, 67, 68.4, 2.3, { hiza: 'end', renk: gri, en: 30 });
  return s + '</svg>';
}

// Ekranda ızgara, kağıtta her sayfa bir etiket (kagit.css: @page etiket 70 × 70 mm)
export function etiketSayfa(p, firma = {}) {
  const { plan, etiketler } = parcaEtiketleri(p), tarih = new Date().toLocaleDateString('tr-TR');
  const baslik = `<header><h1>${kac(p.ad)}</h1><span>Parça etiketleri</span><span>${tarih}</span></header>`;
  if (!etiketler.length) return `<section class="sayfa">${baslik}<p class="aciklama">Bu projede etiketlenecek levha parçası yok.</p></section>`;
  const bilgi = { firma: firma.ad || '', logo: firma.logo || '', proje: p.ad || '', musteri: p.bilgi?.musteri || '' };
  const ilk = new Map(), son = new Map();
  for (const e of etiketler) { const a = [e.malzeme, e.tur || '', e.renk, e.kalinlik].join('|'); if (!ilk.has(a)) ilk.set(a, e.no); son.set(a, e.no); }
  const sigmayan = etiketler.filter(e => !e.levha).length;
  const ozet = plan.gruplar.map(g => { const a = [g.malzeme, g.tur || '', g.renk, g.kalinlik].join('|');
    return `<tr><td>${g.renk ? `<i class="renkKutu" style="background:${kac(g.renk)}"></i>` : ''}${kac(camMalzemeAdi(g))}</td><td>${kac(g.ad || g.malzeme)}</td><td>${g.levhalar.length}</td><td>${g.adet}</td><td>${ilk.has(a) ? `${ilk.get(a)} – ${son.get(a)}` : '—'}</td></tr>`; }).join('');
  return `<section class="sayfa yazdirma">${baslik}
    <table class="kesimOzet"><thead><tr><th>Levha</th><th>Tür</th><th>Levha sayısı</th><th>Parça</th><th>Etiket numaraları</th></tr></thead><tbody>${ozet}</tbody>
    <tfoot><tr><th>Toplam</th><th></th><th>${plan.levha}</th><th>${etiketler.length}</th><th></th></tr></tfoot></table>
    <p class="aciklama"><b>${etiketler.length} etiket, her biri ${ETIKET_MM} × ${ETIKET_MM} mm.</b> Yazdırınca her sayfa bir etikettir: yazdır penceresinde kağıt boyutunu ${ETIKET_MM} × ${ETIKET_MM} mm, ölçeği %100, kenar boşluğunu “yok” seçin.
      Etiketler kesim sırasındadır (levha levha). <b>No</b>, “Kesim planı”nda parçanın üstünde yazan numaradır; plan başka projelerle birlikte kurulmuşsa numaralar tutmaz, bu sayfa projeyi tek başına planlar.
      Çizimde boy yataydır, kalın kenar bantlı kenardır, ortadaki ok desen yönüdür. Sağ alttaki ad CAM parça listesindeki parça adı ve poz numarasıdır.
      Ölçüsü ve malzemesi aynı parçalar birbirinin yerine geçer: etiket hangisine yapıştırılırsa o parça o dolabındır.${sigmayan ? ` Levhaya sığmayan ${sigmayan} parçanın etiketinde levha numarası yoktur.` : ''}
      Tezgah, cam ve kavisli parçalara etiket çıkmaz.</p></section>
    <div class="etkIzgara">${etiketler.map((e, i) => `<figure class="etk">${etiketSvg(e, bilgi, bilgi.logo ? (i ? 'kullan' : 'tanim') : '')}</figure>`).join('')}</div>`;
}
