// Birden çok oda: bir projede mutfak, kiler, banyo gibi ayrı odalar tutulur.
// Açık odanın verisi her zaman p.oda, p.moduller, p.ayar.egim ve p.ayar.asmaTavan içindedir; böylece çizim,
// denetim ve aktarım kodu tek odalı projeyle aynı biçimde çalışır. p.odalar listesinde açık odanın yalnızca
// kimliği ve adı durur, diğer odaların verisi `veri` alanında saklanır. Renkler ve atölye standartları ortaktır.
import { yeniKimlik } from './moduller.js';

// Listeyi yoksa kurar (eski, tek odalı projeler) ve döndürür
export function odaListesi(p) {
  if (!Array.isArray(p.odalar) || !p.odalar.length) { p.odalar = [{ id: yeniKimlik(), ad: 'Oda 1' }]; p.aktifOda = 0; }
  if (!(p.aktifOda >= 0 && p.aktifOda < p.odalar.length)) p.aktifOda = 0;
  return p.odalar;
}

const veriAl = p => ({ oda: p.oda, moduller: p.moduller, egim: p.ayar?.egim || null, asmaTavan: p.ayar?.asmaTavan || 0, bakislar: p.bakislar || [] });
function veriKoy(p, v) {
  p.oda = v.oda; p.moduller = v.moduller; p.bakislar = v.bakislar || [];
  p.ayar = { ...(p.ayar || {}), egim: v.egim || null, asmaTavan: v.asmaTavan || 0 };
}

// i numaralı odayı açar: açık odanın verisi listeye yazılır, hedef odanınki projeye alınır
export function odaSec(p, i) {
  const liste = odaListesi(p);
  if (i === p.aktifOda || !liste[i]) return false;
  liste[p.aktifOda].veri = veriAl(p);
  veriKoy(p, liste[i].veri || { oda: { ...p.oda }, moduller: [] });
  delete liste[i].veri;
  p.aktifOda = i;
  return true;
}

// Boş yeni oda ekler ve açar
export function odaEkle(p, ad, oda) {
  const liste = odaListesi(p);
  liste[p.aktifOda].veri = veriAl(p);
  liste.push({ id: yeniKimlik(), ad: String(ad || '').trim().slice(0, 40) || `Oda ${liste.length + 1}` });
  p.aktifOda = liste.length - 1;
  veriKoy(p, { oda: { ...oda }, moduller: [] });
  return p.aktifOda;
}

// Odayı siler; son oda silinemez. Açık oda silinirse bir önceki açılır.
export function odaSil(p, i) {
  const liste = odaListesi(p);
  if (liste.length < 2 || !liste[i]) return false;
  if (i === p.aktifOda) odaSec(p, i === 0 ? 1 : i - 1);
  liste.splice(i, 1);
  if (p.aktifOda > i) p.aktifOda--;
  return true;
}

// Odayı içindekilerle çoğaltır ve kopyayı açar
export function odaKopyala(p, i) {
  const liste = odaListesi(p);
  if (!liste[i]) return -1;
  const v = JSON.parse(JSON.stringify(i === p.aktifOda ? veriAl(p) : liste[i].veri));
  for (const m of v.moduller) m.id = yeniKimlik();
  liste[p.aktifOda].veri = veriAl(p);
  liste.push({ id: yeniKimlik(), ad: (liste[i].ad + ' (kopya)').slice(0, 40) });
  p.aktifOda = liste.length - 1;
  veriKoy(p, v);
  return p.aktifOda;
}

// Açık odadaki modülleri başka bir odaya taşır. yerlestir(modül, hedefVeri) hedef odada boş yer bulup
// konum alanlarını döndürür (verilmezse konum aynen kalır). Dönen: taşınan modül sayısı
export function modulleriTasi(p, idler, j, yerlestir) {
  const liste = odaListesi(p), hedef = liste[j];
  if (!hedef || j === p.aktifOda || !hedef.veri) return 0;
  const kume = new Set(idler), tasinan = p.moduller.filter(m => kume.has(m.id));
  for (const m of tasinan) {
    const k = { ...m };
    if (yerlestir) Object.assign(k, yerlestir(k, hedef.veri));
    hedef.veri.moduller.push(k);
  }
  p.moduller = p.moduller.filter(m => !kume.has(m.id));
  return tasinan.length;
}

export function odaAdlandir(p, i, ad) {
  const liste = odaListesi(p), yeni = String(ad || '').trim().slice(0, 40);
  if (!liste[i] || !yeni) return false;
  liste[i].ad = yeni;
  return true;
}

// Her oda için tek odalı proje görünümü: teknik çizim ve sunum dosyası bütün odaları sırayla işler.
// Projeyi değiştirmez. Dönen: [{ ad, aktif, proje }]
export function odaGorunumleri(p) {
  const liste = Array.isArray(p.odalar) && p.odalar.length ? p.odalar : [{ ad: '' }];
  const aktif = liste.length > 1 ? Math.min(Math.max(p.aktifOda || 0, 0), liste.length - 1) : 0;
  return liste.map((o, i) => {
    const v = i === aktif || !o.veri ? veriAl(p) : o.veri;
    return { ad: liste.length > 1 ? o.ad : '', aktif: i === aktif,
      proje: { ...p, oda: v.oda, moduller: v.moduller, bakislar: v.bakislar || [], ayar: { ...(p.ayar || {}), egim: v.egim || null, asmaTavan: v.asmaTavan || 0 } } };
  });
}
