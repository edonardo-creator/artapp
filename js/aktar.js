// Dışa aktarım: AutoCAD için DXF (plan + duvar görünüşleri) ve SketchUp için Ruby betiği (3B model).
// Bu dosya 3B kütüphaneye bağlı değildir; Node ile de çalıştırılıp sınanabilir.
import { TANIM, TEZGAH_K, BAZA, projeAyarla, ozelSatirlar, ISARETLER, KALKAR_OLUR } from './moduller.js';
import { kutu, yerelKutu, yerelNokta, duvarBoyu, DUVARLAR, DUVAR_LISTE, egikDuzlem, EGIK_OLUR } from './yerlesim.js';
import { kertilmisParcalar } from './kertme.js';
import { tezgahlar, parcaRengi, SABIT, adaEkleri, egimCizgisi, egimGorunus, delikliDikler, BAR_KOTU } from './ortak.js';
import { odaGorunumleri } from './odalar.js';

const dolapMi = m => ['alt', 'ust', 'boy'].includes(TANIM[m.tip].sinif);
const yuv = v => Math.round(v * 10) / 10;
// DXF dosyası ASCII kalır; Türkçe harfler ve diğer özel işaretler \U+XXXX kaçışıyla yazılır.
// AutoCAD, CorelCAD ve benzerleri bunu TrueType yazı stilinde (aşağıdaki ARTAPP stili) doğru harfe çevirir.
const dxfMetin = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'));

function numaralar(p) {
  const no = {};
  let n = 0;
  for (const d of [...DUVAR_LISTE, 'ada']) {
    for (const m of p.moduller.filter(o => o.duvar === d && dolapMi(o)).sort((a, b) => a.y - b.y || a.x - b.x)) no[m.id] = ++n;
  }
  return no;
}

// ---- DXF ------------------------------------------------------------------------------
// Birim milimetre. Plan başlangıçta, duvar görünüşleri sağa doğru yan yana dizilir.
const KATMANLAR = { DUVAR: 7, ALT_DOLAP: 5, UST_DOLAP: 3, TEZGAH: 8, YAPI: 1, OLCU: 4, YAZI: 2, ACILIS: 9 };
// Kapak açılış yönü çizilen tipler: düz, tek sıra kapaklı dolaplar
const ACILISLI = new Set(['alt_kapak', 'ust_kapak', 'ust_tepe', 'ust_buzustu', 'ust_cam', 'alt_evye']);

export function dxf(proje) {
  projeAyarla(proje.ayar);
  const E = [];
  let OY = 0; // çok odalı projede her oda bir öncekinin altına çizilir
  // çizimin kapladığı alan: dosya açılınca tamamı ekrana sığsın diye başlığa ve görünüm tablosuna yazılır
  const sinir = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const kapsa = (x, y) => { sinir.x0 = Math.min(sinir.x0, x); sinir.x1 = Math.max(sinir.x1, x); sinir.y0 = Math.min(sinir.y0, y); sinir.y1 = Math.max(sinir.y1, y); };
  const cizgi = (x1, y1, x2, y2, k) => { kapsa(x1, y1 + OY); kapsa(x2, y2 + OY); E.push('0', 'LINE', '8', k, '10', yuv(x1), '20', yuv(y1 + OY), '11', yuv(x2), '21', yuv(y2 + OY)); };
  const dik = (x0, y0, x1, y1, k) => { cizgi(x0, y0, x1, y0, k); cizgi(x1, y0, x1, y1, k); cizgi(x1, y1, x0, y1, k); cizgi(x0, y1, x0, y0, k); };
  // hiza: 1 ortalı, 0 sola dayalı
  // hiza: 1 ortalı, 0 sola dayalı; aci: derece (90 = aşağıdan yukarı okunur)
  const yazi = (x, y, h, s, k = 'YAZI', hiza = 1, aci = 0) => {
    kapsa(x, y + OY); kapsa(x, y + OY + h);
    E.push('0', 'TEXT', '8', k, '10', yuv(x), '20', yuv(y + OY), '40', h, '1', dxfMetin(s), '7', 'ARTAPP');
    if (aci) E.push('50', aci);
    if (hiza) E.push('72', hiza, '11', yuv(x), '21', yuv(y + OY));
  };
  const olcuYatay = (kenarlar, x0, y) => {
    const k = [...new Set(kenarlar.map(v => Math.round(v)))].sort((a, b) => a - b);
    if (k.length < 2) return;
    cizgi(x0 + k[0], y, x0 + k[k.length - 1], y, 'OLCU');
    for (const v of k) cizgi(x0 + v - 30, y - 30, x0 + v + 30, y + 30, 'OLCU');
    for (let i = 1; i < k.length; i++) if (k[i] - k[i - 1] >= 1) yazi(x0 + (k[i] + k[i - 1]) / 2, y + 40, 70, k[i] - k[i - 1], 'OLCU');
  };
  const olcuDusey = (kenarlar, x, y0) => {
    const k = [...new Set(kenarlar.map(v => Math.round(v)))].sort((a, b) => a - b);
    if (k.length < 2) return;
    cizgi(x, y0 + k[0], x, y0 + k[k.length - 1], 'OLCU');
    for (const v of k) cizgi(x - 30, y0 + v - 30, x + 30, y0 + v + 30, 'OLCU');
    for (let i = 1; i < k.length; i++) if (k[i] - k[i - 1] >= 1) yazi(x - 130, y0 + (k[i] + k[i - 1]) / 2, 70, k[i] - k[i - 1], 'OLCU');
  };

  // Plan: y = -z (arka duvar üstte)
  const odaYaz = (p, odaAdi) => {
  const { oda } = p, no = numaralar(p);
  const W = oda.w, D = oda.d;
  yazi(W / 2, 900, 120, `${p.ad}${odaAdi ? ' - ' + odaAdi : ''} - PLAN`);
  const kimlik = [p.bilgi?.musteri, p.bilgi?.adres].filter(Boolean).join(' - ');
  if (kimlik) yazi(W / 2, 730, 80, kimlik);
  dik(0, -D, W, 0, 'DUVAR');
  for (const b of tezgahlar(p)) dik(b.x0, -b.z1, b.x1, -b.z0, 'TEZGAH');
  for (const m of p.moduller) {
    const t = TANIM[m.tip];
    if (t.sinif === 'dekor') continue;
    const katman = t.sinif === 'yapi' || t.sinif === 'tesisat' ? 'YAPI' : t.sinif === 'ust' ? 'UST_DOLAP' : 'ALT_DOLAP';
    const b = kutu(m, oda);
    const N = (lx, lz) => { const [x, z] = yerelNokta(m, oda, lx, lz); return [x, -z]; };
    const yol = (pts, kapali) => { // çokgen: ardışık çizgiler
      for (let i = 1; i < pts.length; i++) cizgi(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], katman);
      if (kapali) cizgi(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], katman);
    };
    if (m.tip.endsWith('_lkose')) { // L biçimi: köşe solda ise sol-arka köşeden başlayan altı köşeli çokgen
      const kd = Math.min(m.kol || 560, m.w - 150, m.d - 150), a = lx => m.korYon === 'sag' ? m.w - lx : lx;
      yol([[0, 0], [m.w, 0], [m.w, kd], [kd, kd], [kd, m.d], [0, m.d]].map(([lx, lz]) => N(a(lx), lz)), true);
    } else if (m.tip === 'alt_kavis' || m.tip === 'ust_kavis' || m.tip === 'ust_kavis_acik') { // dış ön köşe çeyrek daire
      const R = Math.min(m.w, m.d), ax = m.w - R, bz = m.d - R, a = lx => m.korYon === 'sol' ? m.w - lx : lx;
      const pts = [[0, 0], [m.w, 0], [m.w, bz]];
      for (let i = 1; i <= 12; i++) { const t = Math.PI / 2 * i / 12; pts.push([ax + R * Math.cos(t), bz + R * Math.sin(t)]); }
      pts.push([0, m.d]);
      yol(pts.map(([lx, lz]) => N(a(lx), lz)), true);
    } else dik(b.x0, -b.z1, b.x1, -b.z0, katman);
    if (m.tip === 'kapi' && m.kapiTip !== 'dis' && m.kapiTip !== 'surgu') { // açık kanat(lar) ve açılış yayı
      const kanat = (hx, yon, r) => {
        const pts = [[hx, 0]];
        for (let i = 0; i <= 12; i++) { const t = Math.PI / 2 * i / 12; pts.push([hx + yon * r * Math.sin(t), r * Math.cos(t)]); }
        yol(pts.map(([lx, lz]) => N(lx, lz)), false);
      };
      if (m.kapiTip === 'cift') { kanat(0, 1, m.w / 2); kanat(m.w, -1, m.w / 2); }
      else if (m.mentese !== 'sag') kanat(0, 1, m.w); else kanat(m.w, -1, m.w);
    }
    if (m.tip === 'nis') { const ic = yerelKutu(m, oda, 0, m.w, -Math.max(50, m.derin || 150), 0); dik(ic.x0, -ic.z1, ic.x1, -ic.z0, 'YAPI'); }
    if (no[m.id]) { // alt dolap numarası ön yarıda, üst dolap numarası duvar tarafında: üst üste binmesinler
      const yk = t.sinif === 'ust' ? yerelKutu(m, oda, 0, m.w, 0, Math.min(m.d, 320) * 0.6)
        : m.tip.endsWith('_lkose') ? yerelKutu(m, oda, m.korYon === 'sag' ? 0 : m.w * 0.5, m.korYon === 'sag' ? m.w * 0.5 : m.w, 300, 520)
          : yerelKutu(m, oda, 0, m.w, m.d * 0.5, m.d);
      yazi((yk.x0 + yk.x1) / 2, -(yk.z0 + yk.z1) / 2 - 35, 80, no[m.id]);
    }
  }
  for (const e of adaEkleri(p)) dik(e.x0, -e.z1, e.x1, -e.z0, e.tur === 'bar' ? 'TEZGAH' : 'ALT_DOLAP');
  const egP = egimCizgisi(p);
  if (egP) {
    cizgi(egP.x0, -egP.z0, egP.x1, -egP.z1, 'YAPI');
    // yazı çizgi boyunca, çizginin duvar tarafında durur
    const dikey = egP.x0 === egP.x1, kay = egP.duvar === 'arka' || egP.duvar === 'sag' ? 45 : -105;
    yazi((egP.x0 + egP.x1) / 2 + (dikey ? (egP.duvar === 'sag' ? 105 : -45) : 0), -(egP.z0 + egP.z1) / 2 + (dikey ? 0 : kay), 60,
      `EĞİMLİ TAVAN: DUVARDA ${egP.dusuk}, BU ÇİZGİDE ${oda.h}`, 'YAPI', 1, dikey ? 90 : 0);
  }
  const altKenar = d => p.moduller.filter(m => m.duvar === d && m.y === 0).flatMap(m => [m.x, m.x + m.w]);
  olcuYatay([0, W, ...altKenar('arka')], 0, 250); olcuYatay([0, W], 0, 520);
  olcuDusey([0, D, ...altKenar('sol')].map(v => -v), -250, 0); olcuDusey([0, -D], -560, 0);
  if (altKenar('sag').length) olcuDusey([0, D, ...altKenar('sag')].map(v => -v), W + 380, 0);
  if (altKenar('on').length) olcuYatay([0, W, ...altKenar('on')], 0, -D - 330);

  // Duvar görünüşleri
  let x0 = W + 2500;
  for (const d of DUVAR_LISTE) {
    const liste = p.moduller.filter(m => m.duvar === d && TANIM[m.tip].sinif !== 'dekor').sort((a, b) => a.x - b.x);
    if (!liste.length) continue;
    const L = duvarBoyu(d, oda), H = oda.h, y0 = -H; // görünüşün tabanı planın üst hizasının altında
    const X = (a, w) => d === 'sol' || d === 'on' ? L - a - w : a;
    yazi(x0 + L / 2, y0 + H + 900, 120, `${DUVARLAR[d]} GÖRÜNÜŞÜ`.toLocaleUpperCase('tr-TR'));
    dik(x0, y0, x0 + L, y0 + H, 'DUVAR');
    const altK = [0, L], ustK = [0, L];
    for (const m of liste) {
      const t = TANIM[m.tip], x = x0 + X(m.x, m.w), y = y0 + m.y;
      const katman = t.sinif === 'yapi' || t.sinif === 'tesisat' ? 'YAPI' : t.sinif === 'ust' ? 'UST_DOLAP' : 'ALT_DOLAP';
      if (m.tip === 'olcu_cizgi') { // kullanıcının ölçü çizgisi: çizgi, uç işaretleri ve değeri
        if (m.w >= m.h) { cizgi(x, y + m.h / 2, x + m.w, y + m.h / 2, 'OLCU'); for (const v of [x, x + m.w]) cizgi(v - 30, y + m.h / 2 - 30, v + 30, y + m.h / 2 + 30, 'OLCU'); yazi(x + m.w / 2, y + m.h / 2 + 40, 70, Math.round(m.w), 'OLCU'); }
        else { cizgi(x + m.w / 2, y, x + m.w / 2, y + m.h, 'OLCU'); for (const v of [y, y + m.h]) cizgi(x + m.w / 2 - 30, v - 30, x + m.w / 2 + 30, v + 30, 'OLCU'); yazi(x + m.w / 2 - 60, y + m.h / 2, 70, Math.round(m.h), 'OLCU', 1, 90); }
        continue;
      }
      const egik = m.egikKes && EGIK_OLUR.has(m.tip) ? egikDuzlem(m, p) : null;
      if (egik) { // üstü eğik kesilmiş dolap: yan yana eğimde yamuk, öne-arkaya eğimde ön yükseklik ve arka kot çizgisi
        const hs = Math.min(m.h, egik.eksen === 'x' ? egik.h0 : egik.h1), hd = Math.min(m.h, egik.h1);
        cizgi(x, y, x + m.w, y, katman); cizgi(x, y, x, y + hs, katman); cizgi(x + m.w, y, x + m.w, y + hd, katman); cizgi(x, y + hs, x + m.w, y + hd, katman);
        if (egik.eksen === 'z') cizgi(x, y + Math.min(m.h, egik.h0), x + m.w, y + Math.min(m.h, egik.h0), 'ACILIS');
        yazi(x + m.w / 2, y + Math.min(hs, hd) / 2 - 35, 80, no[m.id]);
        (m.y === 0 ? altK : ustK).push(X(m.x, m.w), X(m.x, m.w) + m.w);
        continue;
      }
      dik(x, y, x + m.w, y + m.h, katman);
      if (m.tip === 'not_yazi') yazi(x + m.w / 2, y + m.h + 40, 60, String(m.not || 'Not').slice(0, 60), 'YAZI');
      if (!dolapMi(m)) continue;
      const baza = t.sinif !== 'ust' && m.tip !== 'buzdolabi' && m.y === 0 ? BAZA : 0;
      if (baza) cizgi(x, y + baza, x + m.w, y + baza, katman);
      if (m.tip.startsWith('ozel_')) {
        ozelSatirlar(m).forEach((r, i) => {
          if (i) cizgi(x, y + r.y, x + m.w, y + r.y, katman);
          if (r.tur === 'kapak2' || (r.tur === 'cam' && m.w >= 600)) cizgi(x + m.w / 2, y + r.y, x + m.w / 2, y + r.y + r.h, katman);
        });
      } else if (m.cekmece) for (let i = 1; i < m.cekmece; i++) { const yy = y + baza + (m.h - baza) * i / m.cekmece; cizgi(x, yy, x + m.w, yy, katman); }
      else { const n = ((m.bolme || 0) + 1) * (m.kalkar && KALKAR_OLUR.has(m.tip) ? 1 : m.kapak || 1); for (let i = 1; i < n; i++) cizgi(x + m.w * i / n, y + baza, x + m.w * i / n, y + m.h, katman); }
      if (ACILISLI.has(m.tip) && !m.bolmeIc?.some(Boolean)) { // açılış yönü: üçgenin tepesi menteşe tarafında
        const kalkar = !!m.kalkar && KALKAR_OLUR.has(m.tip);
        const nk = kalkar ? 1 : m.kapak || 1, n = ((m.bolme || 0) + 1) * nk, dw = m.w / n, ya = y + baza, yu = y + m.h;
        for (let i = 0; i < n; i++) {
          if (kalkar) { cizgi(x + i * dw, ya, x + (i + 0.5) * dw, yu, 'ACILIS'); cizgi(x + (i + 0.5) * dw, yu, x + (i + 1) * dw, ya, 'ACILIS'); continue; } // kalkar kapak: tepe üstte
          const sol = nk === 1 ? m.mentese !== 'sag' : i % 2 === 0;
          const xh = x + (sol ? i : i + 1) * dw, xo = x + (sol ? i + 1 : i) * dw;
          cizgi(xo, ya, xh, (ya + yu) / 2, 'ACILIS'); cizgi(xh, (ya + yu) / 2, xo, yu, 'ACILIS');
        }
      }
      if (t.tezgah || m.tip === 'alt_lkose' || m.tip === 'alt_kavis') dik(x, y + m.h, x + m.w, y + m.h + TEZGAH_K, 'TEZGAH');
      yazi(x + m.w / 2, y + m.h / 2 - 35, 80, no[m.id]);
      (m.y === 0 ? altK : ustK).push(X(m.x, m.w), X(m.x, m.w) + m.w);
    }
    const egG = egimGorunus(p, d);
    if (egG) cizgi(x0 + egG.x0, y0 + egG.y0, x0 + egG.x1, y0 + egG.y1, 'YAPI');
    olcuYatay(altK, x0, y0 - 250); olcuYatay([0, L], x0, y0 - 520);
    if (ustK.length > 2) olcuYatay(ustK, x0, y0 + H + 250);
    olcuDusey([0, H, ...liste.flatMap(m => [m.y, m.y + m.h])], x0 + L + 380, y0);
    x0 += L + 2500;
  }

  // Ada görünüşleri: aynı yöne bakan ada dolapları ön yüzlerinden
  const ada = p.moduller.filter(m => m.duvar === 'ada' && dolapMi(m));
  for (let y = 0; y < 4; y++) {
    const grup = ada.filter(m => (m.rot || 0) === y);
    if (!grup.length) continue;
    const a = m => y % 2 === 0 ? m.x : m.z;
    const min = Math.min(...grup.map(a)), max = Math.max(...grup.map(m => a(m) + m.w)), L = max - min;
    const X = m => y === 0 || y === 3 ? a(m) - min : max - a(m) - m.w;
    const y0 = -oda.h, H = Math.max(...grup.map(m => m.y + m.h));
    yazi(x0 + L / 2, y0 + H + 700, 120, 'ADA GÖRÜNÜŞÜ - ' + ['ÖNE', 'SAĞA', 'ARKA DUVARA', 'SOLA'][y] + ' BAKAN YÜZ');
    cizgi(x0 - 200, y0, x0 + L + 200, y0, 'DUVAR');
    const kenar = [];
    for (const m of grup) {
      const x = x0 + X(m), yy = y0 + m.y;
      dik(x, yy, x + m.w, yy + m.h, 'ALT_DOLAP');
      if (m.y === 0) cizgi(x, yy + BAZA, x + m.w, yy + BAZA, 'ALT_DOLAP');
      if (m.cekmece) for (let i = 1; i < m.cekmece; i++) { const cy = yy + BAZA + (m.h - BAZA) * i / m.cekmece; cizgi(x, cy, x + m.w, cy, 'ALT_DOLAP'); }
      else { const n = ((m.bolme || 0) + 1) * (m.kapak || 1); for (let i = 1; i < n; i++) cizgi(x + m.w * i / n, yy + BAZA, x + m.w * i / n, yy + m.h, 'ALT_DOLAP'); }
      if (TANIM[m.tip].tezgah) dik(x, yy + m.h, x + m.w, yy + m.h + TEZGAH_K, 'TEZGAH');
      yazi(x + m.w / 2, yy + m.h / 2 - 35, 80, no[m.id]);
      kenar.push(X(m), X(m) + m.w);
    }
    const barli = grup.filter(m => TANIM[m.tip].tezgah && m.y === 0);
    if (p.ayar?.adaBar && barli.length) { // bar yükseltisi: dikme paneli ve tabla
      const b0 = x0 + Math.min(...barli.map(X)), b1 = x0 + Math.max(...barli.map(m => X(m) + m.w)), hh = Math.max(...barli.map(m => m.h));
      dik(b0, y0 + hh + TEZGAH_K, b1, y0 + BAR_KOTU - TEZGAH_K, 'ALT_DOLAP');
      dik(b0 - 20, y0 + BAR_KOTU - TEZGAH_K, b1 + 20, y0 + BAR_KOTU, 'TEZGAH');
    }
    olcuYatay(kenar, x0, y0 - 250);
    x0 += L + 2500;
  }

  // Modül listesi: planın altında tablo
  const sirali = p.moduller.filter(m => no[m.id]).sort((a, b) => no[a.id] - no[b.id]);
  let ty = -D - 1100;
  yazi(0, ty, 110, 'MODÜL LİSTESİ', 'YAZI', 0);
  ty -= 220;
  const sutun = [0, 350, 2300, 3500, 4700];
  const satir = h => { h.forEach((s, i) => yazi(sutun[i], ty, 80, s, 'YAZI', 0)); ty -= 150; };
  satir(['NO', 'MODÜL', 'YER', 'KONUM', 'G x Y x D']);
  for (const m of sirali) satir([no[m.id], TANIM[m.tip].ad, DUVARLAR[m.duvar], m.duvar === 'ada' ? `${m.x} / ${m.z}` : m.x, `${m.w} x ${m.h} x ${m.d}`]);
  // Tesisat noktaları: merkeze göre, duvara oda içinden bakışla soldan ve yerden
  const tesisat = p.moduller.filter(m => TANIM[m.tip].sinif === 'tesisat' && !ISARETLER.has(m.tip) && m.duvar !== 'ada');
  if (tesisat.length) {
    ty -= 200;
    yazi(0, ty, 110, 'TESİSAT NOKTALARI', 'YAZI', 0);
    ty -= 220;
    satir(['', 'TÜR', 'DUVAR', 'SOLDAN', 'YERDEN']);
    for (const m of tesisat) {
      const L = duvarBoyu(m.duvar, oda), cx = m.x + m.w / 2;
      satir([TANIM[m.tip].kisa, TANIM[m.tip].ad, DUVARLAR[m.duvar], Math.round(m.duvar === 'sol' || m.duvar === 'on' ? L - cx : cx), Math.round(m.y + m.h / 2)]);
    }
  }

  return Math.max(-ty, oda.h + 900) + 1100; // bu odanın çizimde kapladığı yükseklik
  };
  for (const g of odaGorunumleri(proje)) OY -= odaYaz(g.proje, g.ad) + 1500;

  const katmanlar = Object.entries(KATMANLAR).flatMap(([ad, renk]) => ['0', 'LAYER', '2', ad, '70', '0', '62', renk, '6', 'CONTINUOUS']);
  if (!Number.isFinite(sinir.x0)) Object.assign(sinir, { x0: 0, y0: 0, x1: 1000, y1: 1000 });
  const pay = 600, gen = sinir.x1 - sinir.x0 + 2 * pay, yuk = sinir.y1 - sinir.y0 + 2 * pay;
  // açılış görünümü: çizimin ortası, tamamı sığacak yükseklik (ekran 16:9 varsayılır)
  const gorunum = ['0', 'TABLE', '2', 'VPORT', '70', '1', '0', 'VPORT', '2', '*ACTIVE', '70', '0', '10', '0.0', '20', '0.0', '11', '1.0', '21', '1.0',
    '12', yuv((sinir.x0 + sinir.x1) / 2), '22', yuv((sinir.y0 + sinir.y1) / 2), '13', '0.0', '23', '0.0', '14', '10.0', '24', '10.0', '15', '10.0', '25', '10.0',
    '16', '0.0', '26', '0.0', '36', '1.0', '17', '0.0', '27', '0.0', '37', '0.0', '40', yuv(Math.max(yuk, gen / 1.7)), '41', '1.7', '42', '50.0', '43', '0.0', '44', '0.0',
    '50', '0.0', '51', '0.0', '71', '0', '72', '100', '73', '1', '74', '3', '75', '0', '76', '0', '77', '0', '78', '0', '0', 'ENDTAB'];
  return ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '9', '$INSUNITS', '70', '4',
    '9', '$EXTMIN', '10', yuv(sinir.x0), '20', yuv(sinir.y0), '9', '$EXTMAX', '10', yuv(sinir.x1), '20', yuv(sinir.y1), '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES', ...gorunum,
    '0', 'TABLE', '2', 'LTYPE', '70', '1', '0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0', '0', 'ENDTAB',
    '0', 'TABLE', '2', 'STYLE', '70', '1', '0', 'STYLE', '2', 'ARTAPP', '70', '0', '40', '0.0', '41', '1.0', '50', '0.0', '71', '0', '42', '2.5', '3', 'arial.ttf', '4', '', '0', 'ENDTAB',
    '0', 'TABLE', '2', 'LAYER', '70', Object.keys(KATMANLAR).length, ...katmanlar, '0', 'ENDTAB',
    '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES', ...E, '0', 'ENDSEC', '0', 'EOF', ''].join('\r\n');
}

// ---- SketchUp ----------------------------------------------------------------------------
// Eksenler: SketchUp X = oda x, Y = oda derinliği (arka duvar uzakta), Z = yükseklik.
export function sketchupBetigi(proje) {
  projeAyarla(proje.ayar);
  const renkler = [], gruplar = [];
  let ox = 0; // çok odalı projede odalar yan yana dizilir
  const X = v => yuv(v + ox);
  const ri = h => { let i = renkler.indexOf(h); if (i < 0) { renkler.push(h); i = renkler.length - 1; } return i; };
  for (const gor of odaGorunumleri(proje)) { odaYaz(gor.proje, gor.ad); ox += gor.proje.oda.w + 1500; }

  function odaYaz(p, odaAdi) {
  const { oda } = p, on = odaAdi ? odaAdi + ' - ' : '';
  const Y = z => yuv(oda.d - z);
  const kutuVer = (b, y0, y1, renk) => [X(b.x0), Y(b.z1), yuv(y0), X(b.x1), Y(b.z0), yuv(y1), ri(renk)];

  // Oda: zemin, arka ve sol duvar (ince levhalar)
  // Kapı, pencere ve niş için duvarda boşluk bırakılır; niş derinse duvar da o kadar kalın çizilir
  const kalin = 100 + Math.max(0, ...p.moduller.filter(m => m.tip === 'nis').map(m => Math.max(50, m.derin || 150) - 60));
  const odaK = [[X(0), 0, -20, X(oda.w), yuv(oda.d), 0, ri(p.renk.zemin)], [X(-kalin), yuv(oda.d), 0, X(0), yuv(oda.d + kalin), yuv(oda.h), ri(p.renk.duvar)]];
  for (const duvar of ['arka', 'sol']) {
    const L = duvar === 'arka' ? oda.w : oda.d;
    const delikler = p.moduller.filter(m => m.duvar === duvar && ['pencere', 'kapi', 'nis'].includes(m.tip))
      .map(m => ({ a0: Math.max(0, m.x), a1: Math.min(L, m.x + m.w), y0: Math.max(0, m.y), y1: Math.min(oda.h, m.y + m.h) }));
    for (const r of delikliDikler([{ a0: 0, a1: L, y0: 0, y1: oda.h }], delikler)) {
      odaK.push(duvar === 'arka' ? [X(r.a0), yuv(oda.d), yuv(r.y0), X(r.a1), yuv(oda.d + kalin), yuv(r.y1), ri(p.renk.duvar)]
        : [X(-kalin), Y(r.a1), yuv(r.y0), X(0), Y(r.a0), yuv(r.y1), ri(p.renk.duvar)]);
    }
  }
  gruplar.push({ ad: on + 'Oda', k: odaK });
  // Sağ ve ön duvar da aktarılır ama gizli gelir (modelin önünü kapatmasın); SketchUp'ta Düzenle > Göster ile açılır
  const gizliK = [];
  for (const duvar of ['sag', 'on']) {
    const L = duvar === 'sag' ? oda.d : oda.w;
    const delikler = p.moduller.filter(m => m.duvar === duvar && ['pencere', 'kapi', 'nis'].includes(m.tip))
      .map(m => ({ a0: Math.max(0, m.x), a1: Math.min(L, m.x + m.w), y0: Math.max(0, m.y), y1: Math.min(oda.h, m.y + m.h) }));
    for (const r of delikliDikler([{ a0: 0, a1: L, y0: 0, y1: oda.h }], delikler)) {
      gizliK.push(duvar === 'sag' ? [X(oda.w), Y(r.a1), yuv(r.y0), X(oda.w + 100), Y(r.a0), yuv(r.y1), ri(p.renk.duvar)]
        : [X(r.a0), -100, yuv(r.y0), X(r.a1), 0, yuv(r.y1), ri(p.renk.duvar)]);
    }
  }
  gruplar.push({ ad: on + 'Sağ ve ön duvar', gizli: 1, k: gizliK });

  for (const m of p.moduller) {
    const g = { ad: `${on}${TANIM[m.tip].ad} ${m.w}x${m.h}x${m.d}`, k: [], s: [], c: [] };
    for (const par of kertilmisParcalar(m, p)) {
      if (par.sus && par.mat === 'kapak') continue; // kapak süslemeleri (binlerce küçük kutu) modele aktarılmaz
      const renk = parcaRengi(par, m, p.renk);
      if (par.sekil === 'sil') {
        const [x, z] = yerelNokta(m, oda, par.x, par.z);
        g.s.push([X(x), Y(z), yuv(m.y + par.y), yuv(par.r), yuv(par.h), ri(renk)]);
      } else if (par.sekil === 'egik') { // sekiz köşe: önce alt dört, sonra üst dört
        const e = par.e, kose = [[0, 0], [1, 0], [1, 1], [0, 1]];
        const nokta = (kx, kz, ust) => {
          const [x, z] = yerelNokta(m, oda, par.x + kx * par.sx, par.z + kz * par.sz), t = e.eksen === 'x' ? kx : kz;
          return [X(x), Y(z), yuv(m.y + par.y + (ust ? e.u0 + (e.u1 - e.u0) * t : e.a0 + (e.a1 - e.a0) * t))];
        };
        (g.e ||= []).push([[...kose.map(([a, b]) => nokta(a, b, false)), ...kose.map(([a, b]) => nokta(a, b, true))], ri(renk)]);
      } else if (par.sekil === 'ceyrek') {
        const pts = [yerelNokta(m, oda, par.x, par.z)];
        for (let i = 0; i <= 10; i++) {
          const a = Math.PI / 2 * i / 10, lx = par.x + (par.ayna ? -1 : 1) * par.rx * Math.cos(a), lz = par.z + par.rz * Math.sin(a);
          pts.push(yerelNokta(m, oda, lx, lz));
        }
        g.c.push([pts.map(([x, z]) => [X(x), Y(z)]), yuv(m.y + par.y), yuv(par.h), ri(renk)]);
      } else {
        g.k.push(kutuVer(yerelKutu(m, oda, par.x, par.x + par.sx, par.z, par.z + par.sz), m.y + par.y, m.y + par.y + par.sy, renk));
      }
    }
    gruplar.push(g);
  }
  const tz = tezgahlar(p);
  if (tz.length) gruplar.push({ ad: on + 'Tezgah', k: tz.map(b => kutuVer(b, b.y, b.y + TEZGAH_K, p.renk.tezgah)) });

  const ekler = adaEkleri(p);
  if (ekler.length) gruplar.push({ ad: on + 'Ada ekleri', k: ekler.map(e => kutuVer(e, e.y0, e.y1, e.tur === 'bar' ? p.renk.tezgah : p.renk.kapak)) });
  const egS = egimCizgisi(p);
  if (egS) { // eğimli tavan: duvardaki alçak kenardan kırılma çizgisine uzanan tek yüzey
    const yatay = egS.duvar === 'arka' || egS.duvar === 'on';
    const d0 = egS.duvar === 'arka' || egS.duvar === 'sol' ? 0 : yatay ? oda.d : oda.w; // eğimli duvarın yeri
    const n = yatay ? [[0, d0, egS.dusuk], [oda.w, d0, egS.dusuk], [oda.w, egS.z0, oda.h], [0, egS.z0, oda.h]]
      : [[d0, 0, egS.dusuk], [d0, oda.d, egS.dusuk], [egS.x0, oda.d, oda.h], [egS.x0, 0, oda.h]];
    gruplar.push({ ad: on + 'Eğimli tavan', y: [[n.map(([x, z, yy]) => [X(x), Y(z), yuv(yy)]), ri(p.renk.duvar)]] });
  }
  }

  const veri = JSON.stringify({ ad: proje.ad, renkler, cam: SABIT.cam, gruplar });
  return `# encoding: UTF-8
# ARTAPP'tan aktarilan 3B model. Olculer milimetredir.
# SketchUp'ta calistirmak icin: Pencere > Ruby Konsolu acin ve su satiri yazin:
#   load "BU_DOSYANIN_TAM_YOLU"
require 'json'

module ArtappAktarim
  VERI = JSON.parse(<<'ARTAPP_JSON')
${veri}
ARTAPP_JSON

  def self.ciz
    model = Sketchup.active_model
    model.start_operation('ARTAPP aktarimi', true)
    renkler = VERI['renkler'].each_with_index.map do |h, i|
      m = model.materials.add("ARTAPP #{i + 1}")
      m.color = Sketchup::Color.new(h[1, 2].hex, h[3, 2].hex, h[5, 2].hex)
      m.alpha = 0.35 if h == VERI['cam']
      m
    end
    ana = model.active_entities.add_group
    ana.name = VERI['ad']
    VERI['gruplar'].each do |g|
      grup = ana.entities.add_group
      grup.name = g['ad']
      grup.hidden = true if g['gizli']
      e = grup.entities
      (g['k'] || []).each do |x0, y0, z0, x1, y1, z1, ri|
        next if x1 - x0 < 0.2 || y1 - y0 < 0.2 || z1 - z0 < 0.2
        kutu = e.add_group
        f = kutu.entities.add_face([x0.mm, y0.mm, z0.mm], [x1.mm, y0.mm, z0.mm], [x1.mm, y1.mm, z0.mm], [x0.mm, y1.mm, z0.mm])
        f.reverse! if f.normal.z < 0
        f.pushpull((z1 - z0).mm)
        kutu.material = renkler[ri]
      end
      (g['s'] || []).each do |cx, cy, cz, r, h, ri|
        sil = e.add_group
        f = sil.entities.add_face(sil.entities.add_circle([cx.mm, cy.mm, cz.mm], Z_AXIS, r.mm, 24))
        f.reverse! if f.normal.z < 0
        f.pushpull(h.mm)
        sil.material = renkler[ri]
      end
      (g['y'] || []).each do |noktalar, ri|
        begin
          f = e.add_face(noktalar.map { |x, y, z| [x.mm, y.mm, z.mm] })
          f.material = renkler[ri]
          f.back_material = renkler[ri]
        rescue StandardError
          # yüzey kurulamazsa aktarımın geri kalanı sürsün
        end
      end
      (g['e'] || []).each do |k, ri|
        eg = e.add_group
        [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].each do |yuz|
          begin
            f = eg.entities.add_face(yuz.map { |i| [k[i][0].mm, k[i][1].mm, k[i][2].mm] })
          rescue StandardError
            # yüzey kurulamazsa (çok ince parça) atlanır
          end
        end
        eg.material = renkler[ri]
      end
      (g['c'] || []).each do |noktalar, z0, h, ri|
        cg = e.add_group
        f = cg.entities.add_face(noktalar.map { |x, y| [x.mm, y.mm, z0.mm] })
        f.reverse! if f.normal.z < 0
        f.pushpull(h.mm)
        cg.material = renkler[ri]
      end
    end
    model.commit_operation
    ana
  end
end

ArtappAktarim.ciz
`;
}
