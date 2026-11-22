// Kesim planı: kesim listesindeki levha parçalarını levhalara yerleştirir, levha sayısını ve doluluğu verir.
// Yerleşim giyotin kesime uygundur: her kesim, kalan parçayı bir kenarından öbürüne ikiye böler (ebatlama makinesi).
// Bütün odaların parçaları birlikte planlanır; aynı malzeme, renk ve kalınlıktaki parçalar aynı levhalara girer.
import { kesimListesi } from './kesim.js';
import { odaGorunumleri } from './odalar.js';
import { projeAyarla } from './moduller.js';
import { uretimAyari, ozelTur } from './uretim.js';

export const PLAN_VARSAYILAN = { boy: 2800, en: 2100, testere: 4, kenar: 10, yon: 'kapak' };
export const PLAN_SINIR = { boy: [1000, 4200], en: [600, 2200], testere: [0, 10], kenar: [0, 30] }; // [en az, en çok] mm
export const YONLER = { kapak: 'Kapaklar döndürülmez (desen yönü korunur)', hepsi: 'Hiçbir parça döndürülmez', serbest: 'Bütün parçalar döndürülebilir' };
export const PLAN_MALZEME = ['Gövde', 'Kapak', 'Arkalık', 'Baza']; // levhadan kesilenler; tezgah ve cam plana girmez
const kac = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Projedeki kesim ayarı: eksik ya da sınır dışı değerler varsayılana ve sınıra çekilir
export function planAyari(p) {
  const k = p.ayar?.kesim || {}, a = {};
  for (const [ad, [az, cok]] of Object.entries(PLAN_SINIR)) {
    const v = Number(k[ad]);
    a[ad] = Number.isFinite(v) && k[ad] !== '' && k[ad] != null ? Math.min(cok, Math.max(az, Math.round(v))) : PLAN_VARSAYILAN[ad];
  }
  a.yon = YONLER[k.yon] ? k.yon : PLAN_VARSAYILAN.yon;
  if (a.en > a.boy) [a.boy, a.en] = [a.en, a.boy]; // boy her zaman uzun kenardır
  return a;
}

// Tek deneme. parcalar: [{ w, h, don }] (w: levha boyu yönünde), W × H: kullanılabilir alan, k: testere payı.
// secim: boş alan seçimi ('kisa': kısa kenarı en iyi uyan, 'alan': alanı en iyi uyan)
// bolme: artan alanın bölünme kuralı ('kisaEksen', 'uzunEksen', 'azAlan', 'cokAlan')
function dene(parcalar, W, H, k, secim, bolme) {
  const levhalar = [];
  for (const q of parcalar) {
    let en = null;
    const bak = l => {
      for (let bi = 0; bi < l.bos.length; bi++) {
        const b = l.bos[bi];
        for (const don of q.don ? [false, true] : [false]) {
          const w = (don ? q.h : q.w) + k, h = (don ? q.w : q.h) + k;
          if (w > b.w + 1e-6 || h > b.h + 1e-6) continue;
          const puan = secim === 'kisa' ? Math.min(b.w - w, b.h - h) : b.w * b.h - w * h;
          if (!en || puan < en.puan) en = { l, bi, don, w, h, puan };
        }
      }
    };
    for (const l of levhalar) { bak(l); if (en) break; } // önce açılmış levhalar doldurulur
    if (!en) { const l = { bos: [{ x: 0, y: 0, w: W + k, h: H + k }], konan: [] }; levhalar.push(l); bak(l); }
    if (!en) return null;
    const b = en.l.bos[en.bi], sag = b.w - en.w, ust = b.h - en.h;
    en.l.bos.splice(en.bi, 1);
    en.l.konan.push({ q, x: b.x, y: b.y, w: en.w - k, h: en.h - k, don: en.don });
    // yatay bölme: üstte kalan parça boydan boya; dikey bölme: sağda kalan parça boydan boya
    const yatay = bolme === 'kisaEksen' ? sag <= ust : bolme === 'uzunEksen' ? sag > ust : bolme === 'azAlan' ? en.w * ust > sag * en.h : en.w * ust <= sag * en.h;
    const sagParca = { x: b.x + en.w, y: b.y, w: sag, h: yatay ? en.h : b.h }, ustParca = { x: b.x, y: b.y + en.h, w: yatay ? b.w : en.w, h: ust };
    for (const y of [sagParca, ustParca]) if (y.w > k + 1 && y.h > k + 1) en.l.bos.push(y);
  }
  return levhalar;
}

// Parçaları levhalara yerleştirir. parcalar: [{ boy, en, adet, don, ... }]; ayar: planAyari() çıktısı.
// Birkaç sıralama ve bölme kuralı denenir; en az levha kullanan, eşitlikte en büyük artık parçayı bırakan seçilir.
export function yerlestir(parcalar, ayar) {
  const W = ayar.boy - 2 * ayar.kenar, H = ayar.en - 2 * ayar.kenar, k = ayar.testere;
  const tek = [], sigmayan = [];
  for (const s of parcalar) {
    const sigar = (s.boy <= W && s.en <= H) || (s.don && s.en <= W && s.boy <= H);
    if (!sigar) { sigmayan.push(s); continue; }
    for (let i = 0; i < (s.adet || 1); i++) tek.push({ w: s.boy, h: s.en, don: !!s.don, s });
  }
  if (!tek.length) return { levhalar: [], sigmayan };
  const siralar = [
    (a, b) => b.w * b.h - a.w * a.h || b.w - a.w,
    (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h,
    (a, b) => b.h - a.h || b.w - a.w,
    (a, b) => b.w - a.w || b.h - a.h,
  ];
  let iyi = null;
  for (const sira of siralar) {
    const dizi = [...tek].sort(sira);
    for (const secim of ['kisa', 'alan']) for (const bolme of ['kisaEksen', 'uzunEksen', 'azAlan', 'cokAlan']) {
      const l = dene(dizi, W, H, k, secim, bolme);
      if (!l) continue;
      const artik = Math.max(0, ...l.flatMap(x => x.bos.map(b => Math.max(0, b.w - k) * Math.max(0, b.h - k))));
      if (!iyi || l.length < iyi.l.length || (l.length === iyi.l.length && artik > iyi.artik)) iyi = { l, artik };
    }
  }
  const levhaAlan = ayar.boy * ayar.en / 1e6;
  return {
    sigmayan,
    levhalar: iyi.l.map(l => {
      const konan = l.konan.map(c => ({ x: c.x + ayar.kenar, y: c.y + ayar.kenar, w: c.w, h: c.h, don: c.don, ad: c.q.s.ad, boy: c.q.s.boy, en: c.q.s.en }));
      const dolu = konan.reduce((t, c) => t + c.w * c.h, 0) / 1e6;
      return { konan, dolu: Math.round(dolu * 100) / 100, doluluk: Math.round(dolu / levhaAlan * 100) };
    }),
  };
}

// Projenin (bütün odaların) kesim planı
// ekler: birlikte planlanacak başka projeler (toplu iş: aynı renk ve kalınlıktaki parçalar aynı levhalara dağılır, fire azalır).
// Ek proje varken parça adının sonuna projenin kısa adı yazılır. Levha ölçüsü ve paylar ana projenin ayarıdır.
export function kesimPlani(p, ekler = []) {
  const ayar = planAyari(p), m = new Map();
  const kisa = q => String(q.ad || 'proje').trim().slice(0, 12);
  for (const q of [p, ...ekler]) for (const g of odaGorunumleri(q)) {
    for (const s of kesimListesi(g.proje).satirlar) {
      if (!PLAN_MALZEME.includes(s.malzeme)) continue;
      const a = [s.malzeme, s.tur || '', s.renk, s.kalinlik].join('|'); // malzeme türü farklı parçalar aynı levhaya girmez
      const grup = m.get(a) || m.set(a, { malzeme: s.malzeme, tur: s.tur || '', renk: s.renk, kalinlik: s.kalinlik, parcalar: [] }).get(a);
      const don = ayar.yon === 'serbest' || (ayar.yon === 'kapak' && s.malzeme !== 'Kapak');
      grup.parcalar.push({ ad: ekler.length ? `${s.ad} · ${kisa(q)}` : s.ad, boy: s.boy, en: s.en, adet: s.adet, don });
    }
  }
  projeAyarla(p.ayar);
  const levhaAlan = ayar.boy * ayar.en / 1e6;
  const U = uretimAyari(p);
  const gruplar = [...m.values()].sort((a, b) => PLAN_MALZEME.indexOf(a.malzeme) - PLAN_MALZEME.indexOf(b.malzeme) || String(a.tur).localeCompare(b.tur) || String(a.renk).localeCompare(b.renk) || b.kalinlik - a.kalinlik).map(g => {
    const y = yerlestir(g.parcalar, ayar);
    const adet = y.levhalar.reduce((t, l) => t + l.konan.length, 0), alan = y.levhalar.reduce((t, l) => t + l.dolu, 0);
    return { malzeme: g.malzeme, tur: g.tur, ad: g.malzeme + (ozelTur(g, U) ? ' · ' + g.tur : ''), renk: g.renk, kalinlik: g.kalinlik, levhalar: y.levhalar, sigmayan: y.sigmayan, adet, alan: Math.round(alan * 100) / 100,
      doluluk: y.levhalar.length ? Math.round(alan / (y.levhalar.length * levhaAlan) * 100) : 0 };
  });
  // parça numarası: kesim sırasıyla (malzeme, levha, yerleşim); parça etiketleri aynı numarayı taşır
  let no = 0;
  for (const g of gruplar) for (const l of g.levhalar) for (const c of l.konan) c.no = ++no;
  return { ayar, gruplar, levha: gruplar.reduce((t, g) => t + g.levhalar.length, 0) };
}

// Bir levhanın çizimi (ölçüler mm; boy yatay)
export function levhaSvg(l, ayar) {
  const B = ayar.boy, E = ayar.en;
  let s = `<svg class="levha" viewBox="-12 -12 ${B + 24} ${E + 24}" role="img" aria-label="Levha yerleşimi"><rect class="lv" x="0" y="0" width="${B}" height="${E}"/>`;
  for (const c of l.konan) {
    s += `<rect class="pr" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}"/>`;
    const dik = c.h > c.w * 1.3, uz = dik ? c.h : c.w, kisa = dik ? c.w : c.h; // dar ve uzun parçada yazı kenar boyunca döner
    const olcu = `${c.boy} × ${c.en}`, noYazi = c.no ? `${c.no} · ` : '';
    const fs = Math.min(58, kisa * 0.42, uz / ((noYazi.length + olcu.length) * 0.6));
    if (fs < 17) { // ölçü sığmayan küçük parçada yalnızca numara
      const f2 = c.no ? Math.min(40, kisa * 0.7, uz / (String(c.no).length * 0.62)) : 0;
      if (f2 >= 9) { const dn = c.h > c.w * 1.3 && c.w < f2 * String(c.no).length * 0.62 ? ` transform="rotate(-90 ${c.x + c.w / 2} ${c.y + c.h / 2})"` : ''; s += `<text class="prNo" x="${c.x + c.w / 2}" y="${c.y + c.h / 2}" font-size="${f2.toFixed(1)}"${dn}>${c.no}</text>`; }
      continue;
    }
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2, don = dik ? ` transform="rotate(-90 ${cx} ${cy})"` : '';
    const adSigar = kisa >= fs * 2.5, ad = adSigar ? String(c.ad).slice(0, Math.max(3, Math.floor(uz / (fs * 0.5)))) : '';
    if (ad) s += `<text class="prAd" x="${cx}" y="${cy - fs * 0.62}" font-size="${(fs * 0.78).toFixed(1)}"${don}>${kac(ad)}</text>`;
    s += `<text class="prOlcu" x="${cx}" y="${cy + (ad ? fs * 0.55 : 0)}" font-size="${fs.toFixed(1)}"${don}>${c.no ? `<tspan class="prNo">${c.no}</tspan> · ` : ''}${olcu}</text>`;
  }
  return s + '</svg>';
}

const renkKutu = r => r ? `<i class="renkKutu" style="background:${kac(r)}"></i>` : '';

// Yazdırılabilir sayfalar: özet ve ayarlar, sonra her levha bir sayfa
// ekler: birlikte planlanan projeler; kitaplik: seçilebilecek projeler [{ id, ad, secili }] (ekranda işaret kutuları olarak görünür)
export function kesimPlaniSayfa(p, ekler = [], kitaplik = []) {
  const plan = kesimPlani(p, ekler), a = plan.ayar, tarih = new Date().toLocaleDateString('tr-TR');
  const baslik = alt => `<header><h1>${kac(p.ad)}</h1><span>${alt}</span><span>${tarih}</span></header>`;
  const sayi = (ad, etiket, birim = 'mm') => `<label class="alan"><span>${etiket}</span><input type="number" data-plan="${ad}" value="${a[ad]}" min="${PLAN_SINIR[ad][0]}" max="${PLAN_SINIR[ad][1]}" step="1" inputmode="numeric"><em>${birim}</em></label>`;
  const ayarHtml = `<form class="kagitAyar yazdirma" onsubmit="return false">
      ${sayi('boy', 'Levha boyu')}${sayi('en', 'Levha eni')}${sayi('testere', 'Testere payı')}${sayi('kenar', 'Kenar payı')}
      <label class="alan genis"><span>Desen yönü</span><select data-plan="yon">${Object.entries(YONLER).map(([k, v]) => `<option value="${k}"${k === a.yon ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
    </form>` + (kitaplik.length ? `<div class="kagitAyar yazdirma planEk"><b>Birlikte planla:</b>${kitaplik.map(k => `<label class="onay duz"><input type="checkbox" data-planek="${kac(k.id)}"${k.secili ? ' checked' : ''}> ${kac(k.ad)}</label>`).join('')}</div>` : '')
    + (ekler.length ? `<p class="aciklama"><b>${ekler.length + 1} proje birlikte planlandı:</b> ${[p, ...ekler].map(q => kac(q.ad)).join(' · ')}. Parçaların üstünde hangi projeye ait olduğu yazar.</p>` : '');
  if (!plan.gruplar.length) return `<section class="sayfa">${baslik('Kesim planı')}${ayarHtml}<p class="aciklama">Bu projede levhadan kesilecek parça yok.</p></section>`;
  const sigmayan = plan.gruplar.flatMap(g => g.sigmayan.map(s => `${g.ad} ${g.kalinlik} mm — ${s.ad} ${s.boy} × ${s.en} mm${s.adet > 1 ? ` (${s.adet} adet)` : ''}`));
  let h = `<section class="sayfa">${baslik('Kesim planı — özet')}${ayarHtml}
    <table class="kesimOzet"><thead><tr><th>Malzeme</th><th>Kalınlık</th><th>Parça</th><th>Parça alanı (m²)</th><th>Levha</th><th>Doluluk</th></tr></thead><tbody>`
    + plan.gruplar.map(g => `<tr><td>${renkKutu(g.renk)}${kac(g.ad)}</td><td>${g.kalinlik}</td><td>${g.adet}</td><td>${g.alan.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${g.levhalar.length}</td><td>%${g.doluluk}</td></tr>`).join('')
    + `</tbody><tfoot><tr><th>Toplam</th><th></th><th>${plan.gruplar.reduce((t, g) => t + g.adet, 0)}</th><th>${plan.gruplar.reduce((t, g) => t + g.alan, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</th><th>${plan.levha}</th><th></th></tr></tfoot></table>
    ${sigmayan.length ? `<h2 class="araBaslik">Levhaya sığmayan parçalar</h2><ul class="duzListe">${sigmayan.map(s => `<li>${kac(s)}</li>`).join('')}</ul><p class="aciklama">Bu parçalar plana girmedi: ekli yapılır ya da daha büyük levha seçilir.</p>` : ''}
    <p class="aciklama"><b>Plan nasıl okunur.</b> Levha ${a.boy} × ${a.en} mm; dört kenardan ${a.kenar} mm temizleme payı, parçalar arasında ${a.testere} mm testere payı bırakılır. Parçaların üstündeki ölçü bitmiş ölçüdür (boy × en, mm).
      Yerleşim giyotin kesime uygundur: her kesim parçayı bir kenardan öbürüne böler. Levhanın boyu yataydır; döndürülmeyen parçalarda parçanın boyu levhanın boyu yönündedir (desen yönü).
      Ölçünün önündeki kalın sayı parça numarasıdır; “Parça etiketleri” aynı numarayı taşır. Doluluk, parça alanının levha alanına oranıdır. Tezgah, cam ve kavisli parçalar plana girmez. Plan bir öneridir; kesimden önce ölçüleri kesim listesiyle karşılaştırın.</p></section>`;
  for (const g of plan.gruplar) g.levhalar.forEach((l, i) => {
    h += `<section class="sayfa levhaSayfa">${baslik(`${renkKutu(g.renk)}${kac(g.ad)} ${g.kalinlik} mm — levha ${i + 1} / ${g.levhalar.length}`)}
      ${levhaSvg(l, a)}<p class="aciklama">${l.konan.length} parça · doluluk %${l.doluluk} · levha ${a.boy} × ${a.en} mm</p></section>`;
  });
  return h;
}
