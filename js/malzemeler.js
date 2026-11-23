// Gerçek malzeme kataloğu: levha ve kapak dekorları, tezgahlar, zemin ve duvar kaplamaları; gerçek doku resimleriyle.
// Veri ve resimler proje kökündeki malzeme-uret.mjs ile üretilir (kaynak: kurulu Adeko 22 malzeme kitaplığı).
//
// Malzemenin kimliği renktir: her malzemenin, başka hiçbir malzemede ve uygulamanın kendi renklerinde bulunmayan bir imza rengi
// vardır (ortalama renginden gözle ayırt edilemeyecek kadar kaydırılmış). Bir yüzeyin rengi (proje.renk.kapak, modülün kapakRenk
// alanı…) bu imza olduğunda çizim o malzemenin dokusunu kullanır, listeler malzemenin adını yazar. Böylece proje dosyasının yapısı
// değişmez; rengi elle değiştirmek malzemeyi kendiliğinden kaldırır, geri al / yinele ve hazır görünümler olduğu gibi çalışır.
import { MALZEME, MALZEME_BOLUMLERI } from './malzeme-veri.js';
export { MALZEME_BOLUMLERI };

// Yayın kopyasında (internet) false yapılır: doku ve önizleme resimleri orada yoktur; malzemeler adlarıyla ve imza rengiyle görünür.
export const MALZEME_RESIMLI = false;

const kayit = k => ({ id: k[0], bolum: k[1], marka: k[2], ad: k[3], renk: k[4], en: k[5], boy: k[6], damar: k[7], parlak: !!k[8], dokulu: !!k[9] && MALZEME_RESIMLI });
const renkten = new Map(MALZEME.map(k => [k[4], k]));
const hexDuz = h => String(h || '').toLowerCase();

// Renk bir malzemenin imzasıysa o malzemenin kaydı, değilse null
export const malzemeRenkten = hex => { const k = renkten.get(hexDuz(hex)); return k ? kayit(k) : null; };
// Listelerde ve CAM parça listesinde yazılan ad (yalnızca ürün adı); tam ad markayı da içerir
export const malzemeAdi = hex => renkten.get(hexDuz(hex))?.[3] || '';
export const malzemeTamAdi = hex => { const k = renkten.get(hexDuz(hex)); return k ? `${k[3]} · ${k[2]}` : ''; };
// Resim yolları (dokusuz, düz renkli malzemede resim yoktur)
export const malzemeOnizleme = m => m?.dokulu ? `img/malzeme/k/${m.id}.jpg` : '';
export const malzemeDokusu = m => m?.dokulu ? `img/malzeme/d/${m.id}.jpg` : '';

// Bölümdeki markalar: [[marka, adet], …]
export function malzemeMarkalari(bolum) {
  const say = new Map();
  for (const k of MALZEME) if (k[1] === bolum) say.set(k[2], (say.get(k[2]) || 0) + 1);
  return [...say];
}
const sade = s => String(s).toLocaleLowerCase('tr').replace(/[çğıöşü]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]));
// Bölüme, markaya ve yazıya göre süzer. Yazı adın ya da markanın içinde geçer; birden çok sözcük yazılırsa hepsi aranır.
// Bölüm boşsa bütün bölümlerde arar.
export function malzemeAra(bolum = '', marka = '', yazi = '') {
  const sozcukler = sade(yazi).split(/\s+/).filter(Boolean);
  return MALZEME.filter(k => (!bolum || k[1] === bolum) && (!marka || k[2] === marka) && sozcukler.every(s => sade(k[3] + ' ' + k[2]).includes(s))).map(kayit);
}
export const malzemeSayisi = () => MALZEME.length;

// Dokunun bir yüzeye oturtulması: yüzeyin iki kenarı (u, v; mm) ve damarın yüzeyde uzanması istenen yön ('u' | 'v').
// Resimdeki damar yönü istenen yöne uymuyorsa doku çeyrek tur döner. Dönen: { don, ru, rv } (ru, rv: three.js yineleme sayıları).
export function dokuYerlesimi(m, uMm, vMm, damarYon = 'v') {
  const don = !!m.damar && ((m.damar === 'y') !== (damarYon === 'v'));
  const adim = v => Math.max(0.05, Math.round(v * 20) / 20);
  // three.js'te dönmüş dokuda resmin eni yüzeyin v kenarı, boyu u kenarı boyunca ilerler
  return { don, ru: adim((don ? vMm : uMm) / m.en), rv: adim((don ? uMm : vMm) / m.boy) };
}
