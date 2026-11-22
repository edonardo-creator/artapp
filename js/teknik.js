// Teknik çizim: 3B modelden ölçülü plan, duvar görünüşleri ve modül listesi üretir (SVG, yazdırılabilir).
import { TANIM, TEZGAH_K, BAZA, KAPAK_K, projeAyarla, donanimAdi, ozelSatirlar, ISARETLER, KALKAR_OLUR } from './moduller.js';
import { kulpAdi } from './kulplar.js';
import { kutu, yerelKutu, yerelNokta, duvarBoyu, DUVARLAR, DUVAR_LISTE, xEksenli, egikDuzlem, EGIK_OLUR } from './yerlesim.js';
import { tezgahlar, adaEkleri, egimCizgisi, egimGorunus, BAR_KOTU } from './ortak.js';
import { taclar, tacCizgileri } from './tac.js';
import { kertmeOlculeri } from './kertme.js';
import { odaGorunumleri } from './odalar.js';

const kac = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dolapMi = m => ['alt', 'ust', 'boy'].includes(TANIM[m.tip].sinif);
const YAZI = 'font-family="system-ui,Segoe UI,sans-serif"';

// Ölçü zincirleri -------------------------------------------------------------------
const tekil = a => [...new Set(a.map(v => Math.round(v)))].sort((p, q) => p - q);

function olcuYatay(kenarlar, y, yaziUstte = true) {
  const k = tekil(kenarlar);
  if (k.length < 2) return '';
  let s = `<line x1="${k[0]}" y1="${y}" x2="${k[k.length - 1]}" y2="${y}" class="olcu"/>`;
  for (const x of k) s += `<line x1="${x - 28}" y1="${y + 28}" x2="${x + 28}" y2="${y - 28}" class="olcu"/>`;
  for (let i = 1; i < k.length; i++) {
    const u = k[i] - k[i - 1];
    if (u < 1) continue;
    s += `<text x="${(k[i] + k[i - 1]) / 2}" y="${yaziUstte ? y - 32 : y + 92}" class="olcuYazi${u < 260 ? ' dar' : ''}">${u}</text>`;
  }
  return s;
}
function olcuDusey(kenarlar, x, yaziSolda = true) {
  const k = tekil(kenarlar);
  if (k.length < 2) return '';
  let s = `<line x1="${x}" y1="${k[0]}" x2="${x}" y2="${k[k.length - 1]}" class="olcu"/>`;
  for (const y of k) s += `<line x1="${x - 28}" y1="${y + 28}" x2="${x + 28}" y2="${y - 28}" class="olcu"/>`;
  for (let i = 1; i < k.length; i++) {
    const u = k[i] - k[i - 1];
    if (u < 1) continue;
    const tx = yaziSolda ? x - 34 : x + 92, ty = (k[i] + k[i - 1]) / 2;
    s += `<text x="${tx}" y="${ty}" transform="rotate(-90 ${tx} ${ty})" class="olcuYazi${u < 260 ? ' dar' : ''}">${u}</text>`;
  }
  return s;
}
// Eğik kesimli dolabın ölçü notu: iki uçtaki yükseklik ve kesim açısı
export function egikNotu(m, p) {
  const d = m.egikKes && EGIK_OLUR.has(m.tip) ? egikDuzlem(m, p) : null;
  if (!d) return '';
  const a = Math.round(Math.min(m.h, d.h0)), b = Math.round(Math.min(m.h, d.h1)), boy = d.eksen === 'x' ? m.w : m.d;
  const aci = Math.round(Math.atan2(Math.abs(d.h1 - d.h0), boy) * 180 / Math.PI * 10) / 10;
  return `Eğik kesim: ${d.eksen === 'x' ? `solda ${a}, sağda ${b}` : `arkada ${a}, önde ${b}`} mm; açı ${String(aci).replace('.', ',')}°`;
}
const numara = (x, y, n) => n == null ? '' : `<text x="${x}" y="${y + 26}" class="no">${n}</text>`;

// Plan --------------------------------------------------------------------------------
function plan(p, no) {
  const { w: W, d: D } = p.oda, pad = 720;
  const dik = (b, sinif, ek = '') => `<rect x="${b.x0}" y="${b.z0}" width="${b.x1 - b.x0}" height="${b.z1 - b.z0}" class="${sinif}" ${ek}/>`;
  let s = `<svg viewBox="${-pad} ${-pad} ${W + 2 * pad} ${D + 2 * pad}" xmlns="http://www.w3.org/2000/svg" ${YAZI}>`;
  s += `<rect x="0" y="0" width="${W}" height="${D}" class="oda"/>`;
  for (const b of tezgahlar(p)) s += dik(b, 'tezgah');
  const sira = { dekor: 0, alt: 1, boy: 1, yapi: 2, ust: 3, tesisat: 4 };
  const liste = [...p.moduller].sort((a, b) => sira[TANIM[a.tip].sinif] - sira[TANIM[b.tip].sinif]);
  for (const m of liste) {
    const t = TANIM[m.tip];
    const kutular = m.tip.endsWith('_lkose') ? lKollar(m, p.oda) : [kutu(m, p.oda)];
    const sinif = t.sinif === 'yapi' ? 'yapi ' + m.tip : t.sinif;
    if (m.tip === 'kapi') { // açık kanat ve açılış yayı
      const solM = m.mentese !== 'sag', N = (lx, lz) => yerelNokta(m, p.oda, lx, lz).map(v => Math.round(v)).join(' ');
      const hx = solM ? 0 : m.w, r = m.w / 2;
      if (m.kapiTip === 'cift') { // iki yarım kanat
        s += `<path d="M ${N(0, 0)} L ${N(0, r)} A ${r} ${r} 0 0 0 ${N(r, 0)}" class="kapiYay"/>`;
        s += `<path d="M ${N(m.w, 0)} L ${N(m.w, r)} A ${r} ${r} 0 0 1 ${N(r, 0)}" class="kapiYay"/>`;
      } else if (m.kapiTip !== 'dis' && m.kapiTip !== 'surgu') {
        s += `<path d="M ${N(hx, 0)} L ${N(hx, m.w)} A ${m.w} ${m.w} 0 0 ${solM ? 0 : 1} ${N(solM ? m.w : 0, 0)}" class="kapiYay"/>`;
      }
    }
    if (m.tip === 'nis') s += dik(yerelKutu(m, p.oda, 0, m.w, -Math.max(50, m.derin || 150), 0), 'nisIc'); // duvarın içindeki boşluk
    if (m.tip === 'alt_kavis') s += kavisYolu(m, p.oda);
    else for (const b of kutular) s += dik(b, 'p-' + sinif);
    if (no[m.id]) {
      // alt dolap numarası ön yarıda, üst dolap numarası duvar tarafında: üst üste binmesinler
      const y = t.sinif === 'ust' ? yerelKutu(m, p.oda, 0, m.w, 0, Math.min(m.d, 320) * 0.6)
        : m.tip.endsWith('_lkose') ? yerelKutu(m, p.oda, m.korYon === 'sag' ? 0 : m.w * 0.5, m.korYon === 'sag' ? m.w * 0.5 : m.w, 300, 520)
          : yerelKutu(m, p.oda, 0, m.w, m.d * 0.5, m.d);
      s += numara((y.x0 + y.x1) / 2, (y.z0 + y.z1) / 2, no[m.id]);
    }
  }
  for (const e of adaEkleri(p)) s += dik(e, e.tur === 'bar' ? 'bar' : 'p-alt');
  const eg = egimCizgisi(p);
  if (eg) {
    const dikey = eg.x0 === eg.x1, tx = (eg.x0 + eg.x1) / 2 + (dikey ? (eg.duvar === 'sol' ? -40 : 110) : 0), ty = (eg.z0 + eg.z1) / 2 + (dikey ? 0 : (eg.duvar === 'arka' ? -40 : 110));
    s += `<line x1="${eg.x0}" y1="${eg.z0}" x2="${eg.x1}" y2="${eg.z1}" class="egim"/>`
      + `<text x="${tx}" y="${ty}" class="egimYazi"${dikey ? ` transform="rotate(-90 ${tx} ${ty})"` : ''}>Eğimli tavan: duvarda ${eg.dusuk}, bu çizgide ${p.oda.h}</text>`;
  }
  const altKenar = d => p.moduller.filter(m => m.duvar === d && m.y === 0).flatMap(m => [m.x, m.x + m.w]);
  s += olcuYatay([0, W, ...altKenar('arka')], -200) + olcuYatay([0, W], -470);
  s += olcuDusey([0, D, ...altKenar('sol')], -200) + olcuDusey([0, D], -470);
  if (altKenar('sag').length) s += olcuDusey([0, D, ...altKenar('sag')], W + 200, false);
  if (altKenar('on').length) s += olcuYatay([0, W, ...altKenar('on')], D + 200, false);
  return s + '</svg>';
}

// Kavisli bitiş dolabının plandaki gerçek biçimi (dış ön köşe çeyrek daire)
function kavisYolu(m, oda) {
  const R = Math.min(m.w, m.d), a = m.w - R, b = m.d - R, sol = m.korYon === 'sol';
  const N = (lx, lz) => yerelNokta(m, oda, sol ? m.w - lx : lx, lz).map(v => Math.round(v)).join(' ');
  // yerelden odaya dönüş el yönünü korur; aynalı (sol) halde yay yönü ters döner
  return `<path d="M ${N(0, 0)} L ${N(m.w, 0)} L ${N(m.w, b)} A ${R} ${R} 0 0 ${sol ? 0 : 1} ${N(a, m.d)} L ${N(0, m.d)} Z" class="p-alt"/>`;
}

function lKollar(m, oda) {
  const kd = Math.min(m.kol || 560, m.w - 150, m.d - 150), sag = m.korYon === 'sag';
  return [yerelKutu(m, oda, 0, m.w, 0, kd), yerelKutu(m, oda, sag ? m.w - kd : 0, sag ? m.w : kd, kd, m.d)];
}

// Modülün ön yüzündeki bölünmeler: baza, dikmeler, kapak ve çekmece çizgileri, açık bölmede raflar.
// x: modülün kağıttaki sol kenarı, Y: oda yüksekliğini kağıt y'sine çeviren işlev.
function icDuzen(m, x, Y) {
  const t = TANIM[m.tip];
  const cz = (x1, y1, x2, y2, sinif = 'ince') => `<line x1="${x1}" y1="${Y(y1)}" x2="${x2}" y2="${Y(y2)}" class="${sinif}"/>`;
  const baza = t.sinif !== 'ust' && m.tip !== 'buzdolabi' && m.y === 0 ? BAZA : 0;
  const y0 = m.y + baza, y1 = m.y + m.h;
  let s = baza ? cz(x, m.y + baza, x + m.w, m.y + baza) : '';
  const yatay = (xa, xb, n) => { let o = ''; for (let i = 1; i < n; i++) { const yy = y0 + (y1 - y0) * i / n; o += cz(xa, yy, xb, yy); } return o; };
  if (m.tip.startsWith('ozel_')) { // özel modül: bölme sınırları, çift kapakta orta çizgi, açık bölmede çapraz
    ozelSatirlar(m).forEach((r, i) => {
      const ya = m.y + r.y, yb = ya + r.h;
      if (i) s += cz(x, ya, x + m.w, ya);
      if (r.tur === 'kapak2' || (r.tur === 'cam' && m.w >= 600)) s += cz(x + m.w / 2, ya, x + m.w / 2, yb);
      if (r.tur === 'acik') s += cz(x, ya, x + m.w, yb, 'ince kesik');
    });
    return s;
  }
  if (m.cekmece) return s + yatay(x, x + m.w, m.cekmece);
  const b = m.bolme || 0, bw = m.w / (b + 1);
  for (let i = 0; i <= b; i++) {
    const xa = x + i * bw, ic = b ? m.bolmeIc?.[i] : null;
    if (i) s += cz(xa, y0, xa, y1);
    if (ic === 'cekmece' && t.sinif !== 'ust') s += yatay(xa, xa + bw, 3);
    else if (ic === 'acik' || m.tip === 'ust_acik' || m.tip === 'alt_sise') {
      for (let r = 1; r <= (m.raf || 0); r++) { const yy = y0 + (y1 - y0) * r / ((m.raf || 0) + 1); s += cz(xa, yy, xa + bw, yy, 'ince kesik'); }
    } else {
      const n = m.kalkar && KALKAR_OLUR.has(m.tip) ? 1 : ic === 'kapak1' ? 1 : ic === 'kapak2' ? 2 : (m.kapak || 1);
      for (let k = 1; k < n; k++) s += cz(xa + bw * k / n, y0, xa + bw * k / n, y1);
    }
  }
  return s;
}

// Ada görünüşü: aynı yöne bakan ada dolapları ön yüzlerinden çizilir
function adaGorunusleri(p, no) {
  const ada = p.moduller.filter(m => m.duvar === 'ada' && dolapMi(m)), out = [];
  const YON = ['Öne bakan yüz', 'Sağa bakan yüz', 'Arka duvara bakan yüz', 'Sola bakan yüz'];
  for (let y = 0; y < 4; y++) {
    const grup = ada.filter(m => (m.rot || 0) === y);
    if (!grup.length) continue;
    const a = m => y % 2 === 0 ? m.x : m.z;
    const min = Math.min(...grup.map(a)), max = Math.max(...grup.map(m => a(m) + m.w));
    const X = m => y === 0 || y === 3 ? a(m) - min : max - a(m) - m.w; // izleyicinin solundan sağına
    const bar = !!p.ayar?.adaBar && grup.some(m => TANIM[m.tip].tezgah), panel = !!p.ayar?.adaPanel;
    const L = max - min, H = Math.max(...grup.map(m => m.y + m.h), bar ? BAR_KOTU : 0) + TEZGAH_K + 150, pad = 520, Y = v => H - v;
    // kısa ada görünüşü sayfayı doldurup devleşmesin: genişliği uzunluğuyla orantılı, ortalı
    const genis = Math.min(100, Math.round((L + 2 * pad) / 60));
    let s = `<svg viewBox="${-pad} ${-pad / 2} ${L + 2 * pad} ${H + pad * 1.6}" xmlns="http://www.w3.org/2000/svg" ${YAZI} style="max-width:${genis}%;margin:0 auto">`;
    s += `<line x1="${-200}" y1="${H}" x2="${L + 200}" y2="${H}" class="olcu" style="stroke:#1b2530"/>`;
    const kenar = [], yuk = [0];
    for (const m of grup.sort((p1, p2) => X(p1) - X(p2))) {
      const x = X(m);
      s += `<rect x="${x}" y="${Y(m.y + m.h)}" width="${m.w}" height="${m.h}" class="g-dolap"/>` + icDuzen(m, x, Y);
      if (TANIM[m.tip].tezgah) { s += `<rect x="${x}" y="${Y(m.h + TEZGAH_K)}" width="${m.w}" height="${TEZGAH_K}" class="tezgah"/>`; yuk.push(m.h + TEZGAH_K); }
      s += numara(x + m.w / 2, Y(m.y + m.h / 2), no[m.id]);
      kenar.push(x, x + m.w); yuk.push(m.y, m.y + m.h);
    }
    // Bar yükseltisi (arkada, kesik çizgi) ve iki uçtaki bitiş paneli: aynı hizadaki bitişik dolaplar bir koşudur
    const tezgahli = grup.filter(m => TANIM[m.tip].tezgah && m.y === 0).sort((p1, p2) => X(p1) - X(p2));
    for (let i = 0; i < tezgahli.length;) {
      let j = i;
      while (j + 1 < tezgahli.length && Math.abs(X(tezgahli[j + 1]) - X(tezgahli[j]) - tezgahli[j].w) < 2 && tezgahli[j + 1].h === tezgahli[i].h) j++;
      const x0 = X(tezgahli[i]), x1 = X(tezgahli[j]) + tezgahli[j].w, hh = tezgahli[i].h;
      if (panel) s += `<rect x="${x0 - KAPAK_K}" y="${Y(hh)}" width="${KAPAK_K}" height="${hh}" class="g-dolap"/><rect x="${x1}" y="${Y(hh)}" width="${KAPAK_K}" height="${hh}" class="g-dolap"/>`;
      if (bar) {
        s += `<rect x="${x0}" y="${Y(BAR_KOTU - TEZGAH_K)}" width="${x1 - x0}" height="${BAR_KOTU - TEZGAH_K - hh - TEZGAH_K}" class="bar"/>`
          + `<rect x="${x0 - 20}" y="${Y(BAR_KOTU)}" width="${x1 - x0 + 40}" height="${TEZGAH_K}" class="tezgah"/>`;
        yuk.push(BAR_KOTU);
      }
      i = j + 1;
    }
    s += olcuYatay(kenar, H + 190, false) + olcuDusey(yuk.map(Y), L + 190, false);
    out.push({ ad: 'Ada — ' + YON[y], svg: s + '</svg>' });
  }
  return out;
}

// Modül ayrıntı kartı: ön yüz küçük çizimi ve özellikleri
function modulKarti(m, n, p) {
  const t = TANIM[m.tip], Y = v => m.y + m.h - v, pay = 60;
  const sv = `<svg viewBox="${-pay} ${-pay} ${m.w + 2 * pay} ${m.h + 2 * pay}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${m.w}" height="${m.h}" class="g-dolap ${m.tip}"/>${icDuzen(m, 0, Y)}</svg>`;
  const oz = [];
  if (m.tip.startsWith('ozel_')) oz.push(`${ozelSatirlar(m).length} bölme`);
  else if (m.cekmece) oz.push(`${m.cekmece} çekmece`);
  else if (m.kapak) oz.push(((m.bolme || 0) + 1) * m.kapak + ' kapak');
  if (m.bolme) oz.push(`${m.bolme} dikme`);
  if (donanimAdi(m)) oz.push(donanimAdi(m)); else if (m.raf) oz.push(`${m.raf} raf`);
  if (m.kulp && m.kulp !== 'cubuk') oz.push({ boy: 'boy kulp', gola: 'gola', yok: 'kulpsuz' }[m.kulp] || kulpAdi(m.kulp));
  const kert = kertmeOlculeri(m, p);
  // kertme ön yüz çiziminde taralı dikdörtgen olarak gösterilir
  const kertSvg = kert.map(k => `<rect x="${k.soldan}" y="${m.h - k.ust}" width="${k.genislik}" height="${k.ust - k.alt}" class="kertme"/>`).join('');
  const svg2 = sv.replace('</svg>', kertSvg + '</svg>');
  return `<figure>${svg2}<figcaption><b>${n} · ${kac(t.ad)}</b><span>${m.w} × ${m.h} × ${m.d}</span><span>${oz.join(' · ') || '—'}</span>${
    kert.map(k => `<em>Kertme: ${k.metin}</em>`).join('')}${egikNotu(m, p) ? `<em>${egikNotu(m, p)}</em>` : ''}${m.not ? `<em>${kac(m.not)}</em>` : ''}</figcaption></figure>`;
}

// Duvar görünüşü ------------------------------------------------------------------------
function gorunus(p, duvar, no) {
  const { oda } = p, L = duvarBoyu(duvar, oda), H = oda.h, pad = 560;
  const Y = y => H - y;
  // Kağıttaki x: duvara içeriden bakınca soldan sağa
  const X = (a, w) => duvar === 'sol' || duvar === 'on' ? L - a - w : a;
  let s = `<svg viewBox="${-pad} ${-pad} ${L + 2 * pad} ${H + 2 * pad}" xmlns="http://www.w3.org/2000/svg" ${YAZI}>`;
  s += `<rect x="0" y="0" width="${L}" height="${H}" class="oda"/>`;
  const altK = [0, L], ustK = [], yK = [0, H];

  // Komşu duvarların bu duvara dayanan modülleri (köşe): gri kesit
  for (const m of p.moduller) {
    if (m.duvar === duvar || !dolapMi(m)) continue;
    const k = kutu(m, oda);
    const dayali = duvar === 'arka' ? k.z0 < 1 : duvar === 'sol' ? k.x0 < 1 : duvar === 'sag' ? k.x1 > oda.w - 1 : k.z1 > oda.d - 1;
    if (!dayali) continue;
    const [a, b] = xEksenli(duvar) ? [k.x0, k.x1] : [k.z0, k.z1];
    s += `<rect x="${X(a, b - a)}" y="${Y(m.y + m.h)}" width="${b - a}" height="${m.h}" class="komsu"/>`;
    if (m.y === 0) altK.push(X(a, b - a), X(a, b - a) + (b - a));
  }

  // dolaplar önce, kolon/kiriş/kapı/pencere sonra çizilir: kertme yapılan yerde engel üstte görünür
  const sira = m => ({ yapi: 1, tesisat: 2 }[TANIM[m.tip].sinif] || 0); // tesisat en üstte görünsün
  const liste = p.moduller.filter(m => m.duvar === duvar).sort((a, b) => sira(a) - sira(b) || a.x - b.x);
  for (const m of liste) {
    const t = TANIM[m.tip], x = X(m.x, m.w), y = Y(m.y + m.h);
    if (m.tip === 'not_yazi') {
      s += `<rect x="${x}" y="${y}" width="${m.w}" height="${m.h}" class="tesisat"/><text x="${x + m.w / 2}" y="${y - 22}" class="tesisatYazi">${kac(String(m.not || 'Not').slice(0, 60))}</text>`;
      continue;
    }
    if (m.tip === 'olcu_cizgi') { // kullanıcının kendi ölçü çizgisi
      s += m.w >= m.h ? olcuYatay([x, x + m.w], y + m.h / 2) : olcuDusey([y, y + m.h], x + m.w / 2);
      continue;
    }
    if (t.sinif === 'tesisat') { // işaret + kısa ad + soldan / yerden ölçüsü (merkeze göre)
      const cx = x + m.w / 2, cy = y + m.h / 2;
      s += `<rect x="${x}" y="${y}" width="${m.w}" height="${m.h}" class="tesisat"/>`
        + `<text x="${cx}" y="${y - 22}" class="tesisatYazi">${t.kisa} ${Math.round(cx)} / ${Math.round(m.y + m.h / 2)}</text>`;
      continue;
    }
    const sinif = t.sinif === 'yapi' ? 'yapi ' + m.tip : t.sinif === 'dekor' ? 'dekor' : 'g-dolap ' + m.tip;
    const egik = m.egikKes && EGIK_OLUR.has(m.tip) ? egikDuzlem(m, p) : null;
    if (egik) { // üstü eğik kesilmiş dolap: yamuk dış çizgi; iç bölünmeler bu biçimin içinde kalır
      const hs = Math.min(m.h, egik.eksen === 'x' ? egik.h0 : egik.h1), hd = Math.min(m.h, egik.h1);
      const kose = `${x},${Y(m.y)} ${x + m.w},${Y(m.y)} ${x + m.w},${Y(m.y + hd)} ${x},${Y(m.y + hs)}`;
      s += `<clipPath id="kes-${duvar}-${m.id}"><polygon points="${kose}"/></clipPath><polygon points="${kose}" class="g-dolap ${m.tip}"/>`
        + `<g clip-path="url(#kes-${duvar}-${m.id})">${icDuzen(m, x, Y)}</g>`;
      if (egik.eksen === 'z') s += `<line x1="${x}" y1="${Y(m.y + Math.min(m.h, egik.h0))}" x2="${x + m.w}" y2="${Y(m.y + Math.min(m.h, egik.h0))}" class="ince kesik"/>`;
      s += numara(x + m.w / 2, Y(m.y + Math.min(hs, hd) / 2), no[m.id]);
      yK.push(m.y, m.y + hs, m.y + hd);
      (m.y === 0 ? altK : ustK).push(x, x + m.w);
      continue;
    }
    s += `<rect x="${x}" y="${y}" width="${m.w}" height="${m.h}" class="${sinif}"/>`;
    if (m.tip === 'nis') s += `<text x="${x + m.w / 2}" y="${y + m.h / 2 + 24}" class="tesisatYazi">Niş · derinlik ${Math.max(50, m.derin || 150)}</text>`;
    yK.push(m.y, m.y + m.h);
    if (!dolapMi(m)) continue;
    s += icDuzen(m, x, Y);
    if (t.tezgah || m.tip === 'alt_lkose' || m.tip === 'alt_kavis') { s += `<rect x="${x}" y="${Y(m.h + TEZGAH_K)}" width="${m.w}" height="${TEZGAH_K}" class="tezgah"/>`; yK.push(m.h + TEZGAH_K); }
    s += numara(x + m.w / 2, y + m.h / 2, no[m.id]);
    (m.y === 0 ? altK : ustK).push(x, x + m.w);
  }
  { // taç: bu duvardaki koşular, seçilen modelin profil çizgileriyle
    const tc = taclar(p), pc = tacCizgileri(tc.ayar.kod);
    for (const k of tc.kosular) {
      if (k.duvar !== duvar) continue;
      const w = k.a1 - k.a0, x = X(k.a0, w), y = Y(k.y1), h = k.y1 - k.y0;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="g-dolap tac"/>` + pc.cizgi.map(o => `<line x1="${x}" y1="${y + h * o}" x2="${x + w}" y2="${y + h * o}" class="ince"/>`).join('');
      if (pc.dis) for (let a = x + 10; a + pc.dis.en < x + w; a += pc.dis.adim) s += `<rect x="${a}" y="${y + h * pc.dis.ust}" width="${pc.dis.en}" height="${h * (pc.dis.alt - pc.dis.ust)}" class="ince" fill="none"/>`;
      yK.push(k.y1);
    }
    for (const d of tc.dolgular) { // L köşe dolabının köşe karesi: bu duvara değiyorsa taç köşeye kadar görünür
      const degiyor = duvar === 'arka' ? d.z0 < 2 : duvar === 'on' ? d.z1 > oda.d - 2 : duvar === 'sol' ? d.x0 < 2 : d.x1 > oda.w - 2;
      if (!degiyor) continue;
      const [a0, a1] = xEksenli(duvar) ? [d.x0, d.x1] : [d.z0, d.z1];
      s += `<rect x="${X(a0, a1 - a0)}" y="${Y(d.y1)}" width="${a1 - a0}" height="${d.y1 - d.y0}" class="g-dolap tac"/>`;
    }
  }
  const eg = egimGorunus(p, duvar);
  if (eg) { // tavanın altında kalan kullanılamaz bölge taralı, sınırı kesik çizgi
    const kose = eg.ayni ? `${eg.x0},${Y(H)} ${eg.x1},${Y(H)} ${eg.x1},${Y(eg.y1)} ${eg.x0},${Y(eg.y0)}` : `${eg.x0},${Y(H)} ${eg.x1},${Y(eg.y1)} ${eg.x0},${Y(eg.y0)}`;
    s += `<polygon points="${kose}" class="egimAlan"/><line x1="${eg.x0}" y1="${Y(eg.y0)}" x2="${eg.x1}" y2="${Y(eg.y1)}" class="egim"/>`;
    yK.push(eg.y0);
  }
  s += olcuYatay(altK, H + 190, false) + olcuYatay([0, L], H + 430, false);
  if (ustK.length) s += olcuYatay([0, L, ...ustK], -150);
  s += olcuDusey(yK.map(Y), L + 190, false);
  return s + '</svg>';
}

// Sunum dosyası için numarasız, sade plan
export function planSvg(p) {
  projeAyarla(p.ayar);
  return plan(p, {});
}

// Teklif dosyası için tek duvarın numarasız görünüşü (duvarda dolap yoksa boş döner)
export function gorunusSvg(p, duvar) {
  if (!p.moduller.some(m => m.duvar === duvar && dolapMi(m))) return '';
  projeAyarla(p.ayar);
  return gorunus(p, duvar, {});
}

// Sayfa -------------------------------------------------------------------------------------
// Birden çok odalı projede her oda kendi sayfalarıyla, oda adı başlıkta yazılı olarak art arda gelir
export function teknikSayfa(p) {
  return odaGorunumleri(p).map(g => odaSayfalari(g.proje, g.ad)).join('');
}

function odaSayfalari(p, odaAdi) {
  projeAyarla(p.ayar); // projenin atölye standartlarıyla çiz
  // Dolapları sırayla numarala: arka, sol, sağ, ada
  const no = {};
  let n = 0;
  const sirali = [];
  for (const d of [...DUVAR_LISTE, 'ada']) {
    for (const m of p.moduller.filter(o => o.duvar === d && dolapMi(o)).sort((a, b) => a.y - b.y || a.x - b.x)) { no[m.id] = ++n; sirali.push(m); }
  }
  const tarih = new Date().toLocaleDateString('tr-TR');
  const bilgi = p.bilgi || {};
  const kimlik = [bilgi.musteri, bilgi.adres].filter(Boolean).map(kac).join(' · ');
  const baslik = alt => `<header><h1>${kac(p.ad)}${kimlik ? `<small>${kimlik}</small>` : ''}</h1><span>${odaAdi ? kac(odaAdi) + ' — ' : ''}${alt}</span><span>Oda ${p.oda.w} × ${p.oda.d} × ${p.oda.h} mm · ${tarih}</span></header>`;
  let h = `<section class="sayfa">${baslik('Plan')}${plan(p, no)}
    <p class="aciklama">Ölçüler mm. Kalın çizgi: alt ve boy dolap · kesik çizgi: üst dolap · gri: tezgah.${p.ayar?.egim?.duvar ? ' Kırmızı kesik çizgi: eğimli tavanın tam yüksekliğe ulaştığı yer.' : ''}${p.ayar?.adaBar ? ' Adadaki kesik dikdörtgen: bar tablası.' : ''}</p>
    ${bilgi.not ? `<p class="projeNotu"><b>Proje notu:</b> ${kac(bilgi.not)}</p>` : ''}</section>`;
  for (const d of DUVAR_LISTE) {
    if (!p.moduller.some(m => m.duvar === d)) continue;
    h += `<section class="sayfa">${baslik(DUVARLAR[d] + ' görünüşü')}${gorunus(p, d, no)}
      <p class="aciklama">Duvara oda içinden bakış. Açık gri: komşu duvardaki dolabın kesiti.</p></section>`;
  }
  const tesisat = p.moduller.filter(m => TANIM[m.tip].sinif === 'tesisat' && !ISARETLER.has(m.tip));
  if (tesisat.length) {
    h += `<section class="sayfa">${baslik('Tesisat noktaları')}<table><thead><tr><th>İşaret</th><th>Tür</th><th>Duvar</th><th>Soldan (merkez)</th><th>Yerden (merkez)</th></tr></thead><tbody>`
      + tesisat.map(m => {
        const L = duvarBoyu(m.duvar, p.oda), cx = m.x + m.w / 2;
        // duvara içeriden bakınca soldan ölçü (görünüş çizimiyle aynı yön)
        const soldan = m.duvar === 'sol' || m.duvar === 'on' ? L - cx : cx;
        return `<tr><td>${TANIM[m.tip].kisa}</td><td>${kac(TANIM[m.tip].ad)}</td><td>${DUVARLAR[m.duvar]}</td><td>${Math.round(soldan)}</td><td>${Math.round(m.y + m.h / 2)}</td></tr>`;
      }).join('') + `</tbody></table><p class="aciklama">Ölçüler noktanın merkezine, duvara oda içinden bakışa göredir. Görünüş çizimlerinde “işaret soldan / yerden” olarak yazar.</p></section>`;
  }
  for (const a of adaGorunusleri(p, no)) {
    h += `<section class="sayfa">${baslik(a.ad)}${a.svg}<p class="aciklama">Ada dolaplarına ön yüzlerinden bakış.${p.ayar?.adaPanel ? ` Adanın iki yanında ve arkasında bitiş paneli var.` : ''}${p.ayar?.adaBar ? ` Arka kenarda bar yükseltisi: üst kotu ${BAR_KOTU} mm, tabla derinliği 340 mm.` : ''}</p></section>`;
  }
  if (sirali.length) {
    h += `<section class="sayfa">${baslik('Modül ayrıntıları')}<div class="kartIzgara">${sirali.map(m => modulKarti(m, no[m.id], p)).join('')}</div>
      <p class="aciklama">Her modülün ön yüzü: kapak, çekmece ve dikme bölünmeleri. Kesik çizgi: açık bölmedeki raf.</p></section>`;
  }
  h += `<section class="sayfa">${baslik('Modül listesi')}<table><thead><tr><th>No</th><th>Modül</th><th>Yer</th><th>Konum</th><th>Genişlik</th><th>Yükseklik</th><th>Derinlik</th><th>Not</th></tr></thead><tbody>`;
  for (const m of sirali) {
    const konum = m.duvar === 'ada' ? `${m.x} / ${m.z}` : m.x;
    h += `<tr><td>${no[m.id]}</td><td>${kac(TANIM[m.tip].ad)}</td><td>${DUVARLAR[m.duvar]}</td><td>${konum}</td><td>${m.w}</td><td>${m.h}</td><td>${m.d}</td><td>${[egikNotu(m, p), donanimAdi(m) ? 'İç donanım: ' + kac(donanimAdi(m)) : '', kac(m.not || ''), ...kertmeOlculeri(m, p).map(k => 'Kertme: ' + k.metin)].filter(Boolean).join('<br>')}</td></tr>`;
  }
  return h + `</tbody></table><p class="aciklama">${sirali.length} modül. Konum: duvar boyunca köşeden uzaklık (mm); adada soldan / arkadan.</p></section>`;
}
