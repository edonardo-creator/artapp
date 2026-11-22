// Montaj şablonu: her dolap için tek sayfa. Üstte üç eş ölçekli (izometrik) görünüş: parçaları birbirinden ayrılmış (patlatılmış),
// kapaksız (iç düzen) ve bitmiş hali; altta o dolabın parça listesi ve hırdavatı. Yazdırılıp toplanmış modülün paketine konur.
// Çizim, 3B çizimle aynı parça üreticisinden (parcalar) gelir; ekran kartı gerektirmez (SVG).
import { TANIM, parcalar, projeAyarla, donanimAdi } from './moduller.js';
import { modulKesimi, modulNumaralari } from './kesim.js';
import { hirdavatListesi } from './maliyet.js';
import { parcaRengi, koyult } from './ortak.js';
import { odaGorunumleri } from './odalar.js';

const kac = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
// Eş ölçekli izdüşüm: x sağa–aşağı, z (dolabın önü) sola–aşağı, y yukarı. Görünen yüzler: üst, ön (z büyük) ve sağ yan (x büyük).
const iz = (x, y, z) => [(x - z) * C30, (x + z) * S30 - y];

// Kutuların izometrik çizimi. kutular: [{ x, y, z, sx, sy, sz, renk, saydam }]. Dönen: { svg içeriği, sınırlar }
export function izometrik(kutular) {
  const sirali = [...kutular].sort((a, b) => (a.x + a.sx / 2 + a.y + a.sy / 2 + a.z + a.sz / 2) - (b.x + b.sx / 2 + b.y + b.sy / 2 + b.z + b.sz / 2));
  let u0 = 1e9, v0 = 1e9, u1 = -1e9, v1 = -1e9, s = '';
  const nokta = (x, y, z) => { const [u, v] = iz(x, y, z); if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; return u.toFixed(1) + ',' + v.toFixed(1); };
  for (const k of sirali) {
    const { x, y, z, sx, sy, sz } = k, X = x + sx, Y = y + sy, Z = z + sz, op = k.saydam ? ' fill-opacity="0.35"' : '';
    const yuz = (n, renk) => `<polygon points="${n.join(' ')}" fill="${renk}"${op}/>`;
    s += yuz([nokta(x, Y, z), nokta(X, Y, z), nokta(X, Y, Z), nokta(x, Y, Z)], koyult(k.renk, 1.06))   // üst
      + yuz([nokta(x, y, Z), nokta(X, y, Z), nokta(X, Y, Z), nokta(x, Y, Z)], k.renk)                  // ön
      + yuz([nokta(X, y, z), nokta(X, y, Z), nokta(X, Y, Z), nokta(X, Y, z)], koyult(k.renk, 0.86));   // sağ yan
  }
  return { s, u0, v0, u1, v1 };
}

// Modülün parçaları → çizilecek kutular. kip: 'patlat' | 'ic' | 'bitmis'
function modulKutulari(m, p, kip) {
  const ps = parcalar(m), r = p.renk || {};
  const cx = m.w / 2, cy = m.h / 2, cz = m.d / 2, out = [];
  for (const q of ps) {
    if (q.sekil && q.sekil !== 'egik') continue;                     // silindir ve kavisli parça kutu olarak çizilmez
    if (!Number.isFinite(q.sx) || q.mat === 'tezgah') continue;
    const on = q.tur === 'kapak' || q.tur === 'kulp';
    if (kip !== 'bitmis' && (on || q.sus)) { if (kip === 'ic' || q.sus || q.tur === 'kulp') continue; }
    if (kip === 'patlat' && (q.tur === 'cihaz' || q.tur === 'dekor')) continue;
    let { x, y, z } = q;
    if (kip === 'patlat') { // parçalar dolabın ortasından dışa doğru açılır; kapak ve çekmece önleri ayrıca öne çekilir
      const px = x + q.sx / 2 - cx, py = y + q.sy / 2 - cy, pz = z + q.sz / 2 - cz, K = 0.55;
      x += px * K; y += py * K; z += pz * K + (on ? Math.max(160, m.d * 0.45) : 0);
    }
    const renk = q.renk || (q.mat === 'cam' ? '#bcd3dc' : q.mat === 'inox' ? '#b9bec4' : q.mat === 'siyah' || q.mat === 'koyu' ? '#3a3d42' : q.mat === 'kulp' ? (r.kulp || '#8a8f96') : parcaRengi(q, m, r));
    out.push({ x, y, z, sx: q.sx, sy: q.sy, sz: q.sz, renk: q.ton ? koyult(renk, q.ton) : renk, saydam: q.mat === 'cam' });
  }
  return out;
}

// Üç görünüş tek ölçekte, yan yana
function gorunusler(m, p) {
  const cizim = ['patlat', 'ic', 'bitmis'].map(k => izometrik(modulKutulari(m, p, k)));
  const olcek = Math.max(...cizim.map(c => Math.max(c.u1 - c.u0, c.v1 - c.v0, 1)));
  const adlar = ['Parçalar (patlatılmış)', 'Gövde ve iç düzen', 'Bitmiş hali'];
  return cizim.map((c, i) => {
    const w = c.u1 - c.u0, h = c.v1 - c.v0, pad = olcek * 0.04, kenar = Math.max(1.2, olcek / 420);
    return `<figure><svg viewBox="${(c.u0 - (olcek - w) / 2 - pad).toFixed(1)} ${(c.v0 - (olcek - h) / 2 - pad).toFixed(1)} ${(olcek + 2 * pad).toFixed(1)} ${(olcek + 2 * pad).toFixed(1)}" xmlns="http://www.w3.org/2000/svg" stroke="#1b2530" stroke-width="${kenar.toFixed(2)}" stroke-linejoin="round">${c.s}</svg><figcaption>${adlar[i]}</figcaption></figure>`;
  }).join('');
}

// Aynı ölçü ve donanımdaki dolaplar tek şablonda toplanır
const imza = m => JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k]) => !['id', 'x', 'duvar', 'not', 'z', 'aci'].includes(k)).sort(([a], [b]) => a.localeCompare(b))));

// Montaj şablonu sayfaları (bütün odalar). Dönen HTML teknik çizimle aynı katmanda gösterilir.
export function montajSayfa(p) {
  let h = '';
  const tarih = new Date().toLocaleDateString('tr-TR');
  for (const g of odaGorunumleri(p)) {
    const q = g.proje;
    projeAyarla(q.ayar);
    const { no, sirali } = modulNumaralari(q), gruplar = new Map();
    for (const m of sirali) { const a = imza(m); (gruplar.get(a) || gruplar.set(a, []).get(a)).push(m); }
    for (const liste of gruplar.values()) {
      const m = liste[0], t = TANIM[m.tip], nolar = liste.map(o => no[o.id]);
      const k = modulKesimi(m, q), parcaSatir = new Map();
      for (const s of k.parcalar) { const a = [s.malzeme, s.ad, s.boy, s.en, s.kalinlik].join('|'); const e = parcaSatir.get(a); if (e) e.adet += s.adet; else parcaSatir.set(a, { ...s }); }
      const hird = hirdavatListesi({ ...q, moduller: [m], ayar: { ...q.ayar, led: false } });
      projeAyarla(q.ayar);
      const ozellik = [m.kapak ? `${m.kapak} kapak` : '', m.cekmece ? `${m.cekmece} çekmece` : '', m.raf ? `${m.raf} raf` : '', donanimAdi(m)].filter(Boolean).join(' · ');
      h += `<section class="sayfa montaj"><header><h1>${kac(p.ad)}<small>${g.ad ? kac(g.ad) + ' · ' : ''}Montaj şablonu</small></h1>
          <span>No ${nolar.join(', ')} · ${kac(t.ad)}${liste.length > 1 ? ` × ${liste.length}` : ''}</span><span>${m.w} × ${m.h} × ${m.d} mm · ${tarih}</span></header>
        <div class="mt-gorunus">${gorunusler(m, q)}</div>
        <div class="mt-liste"><div><h3>Parçalar${liste.length > 1 ? ' (bir dolap için)' : ''}</h3><table><thead><tr><th>Parça</th><th>Malzeme</th><th>Boy</th><th>En</th><th>Kalınlık</th><th>Adet</th></tr></thead><tbody>${
          [...parcaSatir.values()].map(s => `<tr><td>${kac(s.ad)}</td><td>${s.malzeme}</td><td>${s.boy}</td><td>${s.en}</td><td>${s.kalinlik}</td><td>${s.adet}</td></tr>`).join('') || '<tr><td colspan="6">Levha parçası yok.</td></tr>'}</tbody></table></div>
          <div><h3>Hırdavat</h3><table><thead><tr><th>Kalem</th><th>Miktar</th><th>Birim</th></tr></thead><tbody>${
          hird.map(x => `<tr><td>${kac(x.ad)}</td><td>${String(x.miktar).replace('.', ',')}</td><td>${x.birim}</td></tr>`).join('') || '<tr><td colspan="3">Hırdavat yok.</td></tr>'}</tbody></table>
          ${ozellik ? `<p class="aciklama">${kac(ozellik)}</p>` : ''}${k.ozel.length ? `<p class="aciklama uyariYazi">${k.ozel.map(kac).join(' · ')}</p>` : ''}${m.not ? `<p class="projeNotu">${kac(m.not)}</p>` : ''}</div></div></section>`;
    }
  }
  projeAyarla(p.ayar);
  return h || '<section class="sayfa"><p class="aciklama">Bu projede dolap yok.</p></section>';
}
