// Tezgah kataloğu: temel renkler ve iki üreticinin plaka renkleri (veri tezgah-veri.js içinde, resimler img/tezgah klasöründe).
// Projede seçim ayar.tezgahSec içinde tutulur: { id, yuzey, kalinlik }. Katalogdan bir plaka seçildiğinde tezgah rengi plakanın
// ortalama rengine çekilir (plan, DXF ve resmin yüklenemediği durumlar için); 3B çizimde ve fotoğrafta plakanın resmi doku olur.
import { TEZGAH_TEMEL, TEZGAH_MARKALARI, TEZGAH_GRUPLARI, TEZGAH_YUZEYLERI, TEZGAH_KATALOG } from './tezgah-veri.js';
import { malzemeRenkten } from './malzemeler.js';

export { TEZGAH_TEMEL, TEZGAH_MARKALARI, TEZGAH_GRUPLARI, TEZGAH_YUZEYLERI, TEZGAH_KATALOG };

const kayit = k => k && { id: k[0], marka: k[1], grup: k[2], ad: k[3], renk: k[4], yuzeyler: k[5], olcek: k[6] || 320, not: k[7], resim: '' };
export const tezgahBilgisi = id => kayit(TEZGAH_KATALOG.find(k => k[0] === id)) || null;
// Markanın bir grubundaki plakalar (grup boşsa markanın hepsi)
export const tezgahListesi = (marka, grup = '') => TEZGAH_KATALOG.filter(k => k[1] === marka && (!grup || k[2] === grup)).map(kayit);

// Projedeki katalog seçimi, geçerli biçimde: yüzey ve kalınlık katalogda yoksa ilk seçeneğe çekilir. Seçim yoksa null.
export function tezgahSecimi(p) {
  const s = p?.ayar?.tezgahSec, b = s && tezgahBilgisi(s.id);
  if (!b) return null;
  const yuzeyler = Object.keys(b.yuzeyler), yuzey = yuzeyler.includes(s.yuzey) ? s.yuzey : yuzeyler[0];
  const kalinliklar = Object.keys(b.yuzeyler[yuzey] || {}), kalinlik = kalinliklar.includes(String(s.kalinlik)) ? String(s.kalinlik) : kalinliklar.includes('20') ? '20' : kalinliklar[kalinliklar.length - 1];
  return { ...b, yuzey, kalinlik, kod: b.yuzeyler[yuzey]?.[kalinlik] || '', parlak: yuzey === 'POLISHED' || yuzey === 'GLOSSY MIRROR' };
}

// Tezgahın müşteri belgelerinde yazılacak adı
export function tezgahAdi(p, { kodlu = true } = {}) {
  const s = tezgahSecimi(p);
  if (s) return `${TEZGAH_MARKALARI[s.marka]} ${s.ad}` + ` · ${String(TEZGAH_YUZEYLERI[s.yuzey] || s.yuzey).replace(/ \(.*\)$/, '')} · ${s.kalinlik} mm` + (kodlu && s.kod ? ` · kod ${s.kod}` : '');
  const md = malzemeRenkten(p?.renk?.tezgah); // renk ve malzeme kataloğundan seçilmiş gerçek tezgah malzemesi
  if (md) return `${md.ad} · ${md.marka}`;
  const renk = String(p?.renk?.tezgah || '').toLowerCase(), temel = TEZGAH_TEMEL.find(t => t[1] === renk && t[2] === (p?.desen?.tezgah || 'duz'));
  return temel ? temel[0] : ({ mermer: 'Mermer desenli', ahsap: 'Ahşap desenli' }[p?.desen?.tezgah] || 'Düz renk');
}
