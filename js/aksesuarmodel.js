// Aksesuar modelleri: katalogdan dolaba takılan iç donanımın (kiler, çekmece sepeti, şişelik, deterjanlık, çöp kovası, körköşe,
// döner sepet, tabaklık) gerçek biçimi. Biçimler ARTAPP'in kendi modellemesidir: katalog resmine bakılarak ve katalogdaki ölçülerle
// (genişlik × derinlik × yükseklik) kurulmuştur; üreticinin teknik çizimi değildir.
// Çıktı kutu parçalardır (hepsi süsleme sayılır: kesim listesine girmez, 3B çizimde malzeme başına tek ağda toplanır); her parça
// "kapaklar açık" gösterimdeki hareketini kendi taşır (cek: öne çekilme, kay: yana kayma, ac: düşey eksen çevresinde dönme).
import { aksesuarGrubu } from './aksesuarlar.js';

export const AKSESUAR_RENK = { Antrasit: '#2F3134', Krom: '#C9CCD0', Beyaz: '#ECECE8', Gri: '#A2A5A8', Paslanmaz: '#B7BABD', 'Şeffaf': '#DCE4E8' };
const CEVIZ = '#6B4A33', KOVA_ACIK = '#C4C7C9', KOVA_KOYU = '#3A3D40', YESIL = '#2F7D5B', SARI = '#D3A92B';

// ---- Aileler: kimlik → [düzen, seçenekler] ---------------------------------------
// kapak: ön kapak mekanizmaya bağlıdır (menteşeyle açılmaz, donanımla birlikte dışarı çıkar)
const M = {};
const koy = (ids, duzen, o = {}) => { for (const i of ids) M['a' + String(i).padStart(3, '0')] = [duzen, o]; };
koy([1, 5, 8, 11], 'kilerIkiz');
koy([14, 16, 18, 20], 'kilerFrenli', { kapak: 1 });
koy([22], 'kilerTeleskopik');
koy([28, 29, 30, 31, 32], 'cekmece');
koy([33], 'cekmece', { kapak: 1 });
koy([34, 35, 36], 'cekmece', { eviye: 1 });
koy([37], 'cekmece', { eviye: 1, kapak: 1 });
koy([38], 'cekmece', { kapak: 1, tabak: 1 });
koy([39, 42, 43], 'zemin', { kapak: 1, tabak: 1 });
koy([40, 41], 'zemin', { kapak: 1 });
koy([44, 45, 46, 47, 48, 62], 'dar', { kapak: 1, kat: 2 });
koy([49], 'dar', { kapak: 1, kat: 2, sise: 1 });
koy([50, 51], 'dar', { kapak: 1, kat: 1, dik: 1 });
koy([52, 53, 54, 55, 56, 57, 58], 'dar', { kapak: 1, kat: 2, sise: 1 });
koy([59, 60], 'dar', { kapak: 1, kat: 3, sise: 1 });
koy([61], 'dar', { kapak: 1, kat: 4, sise: 1 });
koy([63, 64, 65, 66, 67, 68], 'dar', { kapak: 1, kat: 2 });
koy([69], 'dar', { kat: 2, tasinir: 1 });
koy([70], 'tepsi');
koy([100], 'tepsi', { tup: 1 });
koy([75, 76], 'cop', { kova: [1], kapak: 1, buyuk: 1 });
koy([77, 79], 'cop', { kova: [1, 1, 1], kapak: 1, alcak: 1 });
koy([78, 80], 'cop', { kova: [1, 1], kapak: 1, alcak: 1, sepet: 1 });
koy([81, 83], 'cop', { kova: [1] });
koy([82, 84], 'cop', { kova: [1], celik: 1 });
koy([85], 'cop', { kova: [1, 0.35] });
koy([86], 'cop', { kova: [1, 0.35], celik: 1 });
koy([87], 'cop', { kova: [1, 1] });
koy([88], 'cop', { kova: [1, 1], celik: 1 });
koy([89], 'cop', { kova: [1, 1], buyuk: 1, arka: 1 });
koy([90], 'cop', { kova: [1, 1], buyuk: 1, arka: 1, kapak: 1 });
koy([91], 'cop', { kova: [1, 0.3], buyuk: 1 });
koy([92], 'cop', { kova: [1, 0.3], buyuk: 1, kapak: 1 });
koy([93, 95], 'cop', { kova: [1, 1] });
koy([94, 96], 'cop', { kova: [1, 1], kapak: 1 });
koy([101, 102, 103], 'korDoner');
koy([104, 105, 106, 107, 108], 'korSepet');
koy([109, 110, 111, 112, 113], 'korSepet', { kapak: 1 });
koy([114, 115], 'doner', { pay: 0.5 });
koy([116, 117, 118], 'doner', { pay: 0.75 });
koy([119, 120, 121], 'doner', { pay: 1 });
koy([137, 138], 'tabaklik', { tabak: 1 });
koy([139], 'tabaklik', { bardak: 1 });
koy([140, 141], 'tabaklik', { tabak: 1, bardak: 1, tepsi: 1 });
// Düzenin takılabildiği iç donanım türü (moduller.js: DONANIMLAR)
const TUR = { kilerIkiz: 'kiler', kilerFrenli: 'kiler', kilerTeleskopik: 'kiler', cekmece: 'sepet', zemin: 'sepet', tepsi: 'sepet', dar: ['baharat', 'deterjan'], cop: 'cop', korDoner: 'sihirli', korSepet: 'sihirli', doner: 'doner', tabaklik: 'tabaklik' };

// Bir ailenin modeli: { duzen, o, seri ('wood' ahşap yanlı, 'box' sac yanlı, 'cam' cam yanlı, 'tel'), tabla (ahşap tabanlı), ad } ya da null
export function aksesuarModeli(g) {
  const t = M[g], a = t && aksesuarGrubu(g);
  if (!a) return null;
  const ad = a[2];
  return { duzen: t[0], o: t[1], ad, seri: /Unique Wood/.test(ad) ? 'wood' : /Unique Box/.test(ad) ? 'box' : /Premium/.test(ad) ? 'cam' : 'tel', tabla: /Ahşap Tabl|Ahşap Taban/.test(ad), turler: [].concat(TUR[t[0]]) };
}
// "380 × 510 × 1250-1400" → [380, 510, 1250]; okunamayan ölçü 0
const olcuCoz = s => { const p = String(s || '').replace(/Ø/g, '').split('×').map(v => Number(/(\d+)/.exec(v)?.[1]) || 0); return [p[0] || 0, p[1] || 0, p[2] || 0]; };

// Dolaba takılı ürünün parçaları. urun: projedeki aksesuar kaydı ({ g, kod, renk }). c: dolabın ölçüleri
//   { w, h, d, T, y0, y1 (iç boşluğun altı ve üstü), z0 (arkalığın önü), kapi: { x0, x1 } (kör köşede kapağın yeri), mil: { x, z, r }
//   (L köşede döner tablanın merkezi ve yarıçapı), sagda (kör taraf sağda) }
// Dönen: { parcalar, kapakCek (kapak ve kulp bu kadar öne çıkar; menteşesiz), kapakAc (kapak bu eksende döner) } ya da null (model yok)
export function aksesuarParcalari(urun, c) {
  const md = aksesuarModeli(urun?.g);
  if (!md) return null;
  const a = aksesuarGrubu(urun.g), kalem = a[5].find(k => k[0] === urun.kod) || a[5][0], [og, od, oy] = olcuCoz(kalem[2]);
  const renkAdi = AKSESUAR_RENK[urun.renk] ? urun.renk : a[3].find(r => AKSESUAR_RENK[r]) || 'Antrasit', renk = AKSESUAR_RENK[renkAdi], metal = renkAdi === 'Krom' || renkAdi === 'Paslanmaz' ? 'inox' : 'koyu';
  const { w, d, T, y0, y1, z0 } = c, P = [], x0 = T + 8, ww = w - 2 * T - 16, zOn = d - 14, dd = zOn - z0, o = md.o, sonuc = { parcalar: P, kapakCek: 0, kapakAc: null };
  let hareket = null; // sıradaki parçalara yazılacak hareket bilgisi
  const kutu = (ad, x, y, z, sx, sy, sz, mat = metal, rk = renk) => { if (sx > 0.2 && sy > 0.2 && sz > 0.2) P.push({ ad, x, y, z, sx, sy, sz, mat, tur: 'cihaz', sus: true, renk: rk, ...hareket }); };
  const silindir = (ad, x, y, z, r, hh, mat = metal, rk = renk) => P.push({ ad, sekil: 'sil', x, y, z, r, h: hh, mat, tur: 'cihaz', renk: rk, ...hareket });
  const tel = (x, y, z, sx, sy, sz) => kutu('Tel', x, y, z, sx, sy, sz);

  // Tel sepet: üstte ve altta çember, köşe dikmeleri, tabanda teller (ya da ahşap / sac taban), yanlarda seyrek dikmeler
  const telSepet = (x, y, z, gen, der, yuk, taban = md.tabla ? 'ahsap' : 'tel') => {
    const t = 5;
    for (const yy of yuk > 75 ? [y, y + yuk / 2 - t / 2, y + yuk - t] : [y, y + yuk - t]) { tel(x, yy, z, gen, t, t); tel(x, yy, z + der - t, gen, t, t); tel(x, yy, z + t, t, t, der - 2 * t); tel(x + gen - t, yy, z + t, t, t, der - 2 * t); }
    for (const [px, pz] of [[x, z], [x + gen - t, z], [x, z + der - t], [x + gen - t, z + der - t]]) tel(px, y, pz, t, yuk, t);
    if (taban === 'ahsap') kutu('Sepet tabanı', x + t, y + t, z + t, gen - 2 * t, 9, der - 2 * t, 'govde', CEVIZ);
    else if (taban === 'sac') kutu('Sepet tabanı', x + t, y + t, z + t, gen - 2 * t, 2.5, der - 2 * t);
    else { const n = Math.max(2, Math.round(gen / 32)); for (let i = 1; i < n; i++) tel(x + gen * i / n - 1.5, y + 1, z + t, 3, 3, der - 2 * t); }
    const nx = Math.max(1, Math.round(gen / 70)), nz = Math.max(1, Math.round(der / 70));
    for (let i = 1; i < nx; i++) { tel(x + gen * i / nx - 1.5, y, z + 1, 3, yuk, 3); tel(x + gen * i / nx - 1.5, y, z + der - 4, 3, yuk, 3); }
    for (let i = 1; i < nz; i++) { tel(x + 1, y, z + der * i / nz - 1.5, 3, yuk, 3); tel(x + gen - 4, y, z + der * i / nz - 1.5, 3, yuk, 3); }
  };
  // Kutu sepet (çekmece): seri 'wood' ahşap yanlı sac çerçeve, 'box' sac yanlı, 'cam' cam yanlı ve madeni korkuluklu
  const kutuSepet = (x, y, z, gen, der, yuk) => {
    if (md.seri === 'tel') return telSepet(x, y, z, gen, der, yuk);
    kutu('Sepet tabanı', x, y, z, gen, 3, der);
    if (md.seri === 'wood') { kutu('Sepet yanı', x, y + 3, z, 11, yuk - 3, der, 'govde', CEVIZ); kutu('Sepet yanı', x + gen - 11, y + 3, z, 11, yuk - 3, der, 'govde', CEVIZ); kutu('Sepet önü', x + 11, y + 3, z + der - 3, gen - 22, yuk - 3, 3); kutu('Sepet arkası', x + 11, y + 3, z, gen - 22, yuk - 3, 3); }
    else if (md.seri === 'box') { for (const [px, pz, sx, sz] of [[x, z, 3, der], [x + gen - 3, z, 3, der], [x + 3, z, gen - 6, 3], [x + 3, z + der - 3, gen - 6, 3]]) kutu('Sepet yanı', px, y + 3, pz, sx, yuk - 3, sz); }
    else { // cam yanlı: alt ve üst madeni çıta, arada cam
      for (const [px, pz, sx, sz] of [[x, z, 5, der], [x + gen - 5, z, 5, der], [x + 5, z, gen - 10, 5], [x + 5, z + der - 5, gen - 10, 5]]) { kutu('Sepet camı', px, y + 3, pz, sx, yuk - 9, sz, 'cam', '#BFD3DB'); kutu('Korkuluk', px - (sx < 6 ? 1 : 0), y + yuk - 7, pz - (sz < 6 ? 1 : 0), sx + (sx < 6 ? 2 : 0), 7, sz + (sz < 6 ? 2 : 0)); }
    }
  };
  // Çöp kovası: gövde, renkli ağız çemberi ve tutamak
  const kova = (x, y, z, gen, der, yuk, vurgu = YESIL) => {
    const govde = o.celik ? AKSESUAR_RENK.Paslanmaz : renkAdi === 'Antrasit' ? KOVA_KOYU : KOVA_ACIK;
    kutu('Çöp kovası', x + 3, y, z + 3, gen - 6, yuk - 12, der - 6, o.celik ? 'inox' : 'koyu', govde);
    kutu('Kova ağzı', x, y + yuk - 12, z, gen, 12, der, 'koyu', o.celik ? KOVA_KOYU : vurgu);
    kutu('Kova içi', x + 8, y + yuk - 1, z + 8, gen - 16, 1.2, der - 16, 'koyu', '#1E2022');
  };
  // Yuvarlak tabla (dilimlerle): pay 1 tam daire, 0,75 dörtte biri kesik, 0,5 yarım ay. kes: kesik kısmın yönü [x işareti, z işareti]
  const tabla = (cx, y, cz, r, pay = 1, kes = [1, 1], kenar = 34) => {
    const N = 18, s = 2 * r / N, taban = md.tabla || md.seri !== 'tel';
    for (let i = 0; i < N; i++) {
      const xa = -r + i * s, xm = xa + s / 2, hz = Math.sqrt(Math.max(0, r * r - xm * xm));
      let za = -hz, zb = hz;
      if (pay === 0.5) { if (kes[1] > 0) zb = Math.min(zb, 0); else za = Math.max(za, 0); }
      else if (pay === 0.75 && xm * kes[0] > 0) { if (kes[1] > 0) zb = Math.min(zb, 0); else za = Math.max(za, 0); }
      if (zb - za < 1) continue;
      kutu('Döner tabla', cx + xa, y, cz + za, s + 0.3, taban ? 10 : 4, zb - za, taban && md.seri !== 'box' ? 'govde' : metal, taban && md.seri !== 'box' ? CEVIZ : renk);
      for (const zz of [za, zb - 5]) if (Math.abs(Math.abs(zz + (zz === za ? 0 : 5)) - hz) < 1) kutu('Tabla korkuluğu', cx + xa, y + (taban ? 10 : 4), cz + zz, s + 0.3, kenar, 5);
    }
  };

  const yuk = y1 - y0;
  switch (md.duzen) {
    case 'cekmece': { // tezgah altı çift açılım çekmece sepetleri: altta derin, üstte alçak; lavabo altı modelinde üst sepet sifonun çevresinde U biçimindedir
      const gen = Math.min(ww, og || ww), x = x0 + (ww - gen) / 2, der = Math.min(dd, od || dd), ha = Math.min(oy || 150, yuk * 0.34), cek = Math.min(d - 120, 400);
      hareket = { cek }; kutu('Ray', x, y0 + 22, z0 + 10, gen, 8, der - 10, 'koyu', '#3A3D40'); kutuSepet(x, y0 + 30, zOn - der, gen, der, ha);
      if (o.tabak) { const n = Math.max(5, Math.floor(gen / 34)); for (let i = 0; i <= n; i++) tel(x + 8 + (gen - 20) * i / n, y0 + 34, zOn - der * 0.7, 3, ha + 40, 3); }
      hareket = { cek: cek - 110 }; const yu = y0 + yuk * 0.52, hu = Math.min(ha * 0.75, 110);
      kutu('Ray', x, yu - 8, z0 + 10, gen, 8, der - 10, 'koyu', '#3A3D40');
      if (o.eviye) { const yan = gen * 0.3; kutuSepet(x, yu, zOn - der, yan, der, hu); kutuSepet(x + gen - yan, yu, zOn - der, yan, der, hu); kutuSepet(x + yan, yu, zOn - der * 0.42, gen - 2 * yan, der * 0.42, hu); }
      else kutuSepet(x, yu, zOn - der, gen, der, hu);
      if (o.kapak) sonuc.kapakCek = cek;
      break;
    }
    case 'zemin': { // zemine bağlı dar ünite: çerçeve ve iki kat (tabaklıkta teller)
      const gen = Math.min(ww, og || 258), x = x0 + (ww - gen) / 2, der = Math.min(dd, od || dd), cek = Math.min(d - 100, 430);
      hareket = { cek }; kutu('Taban rayı', x, y0 + 4, zOn - der, gen, 10, der, 'koyu', '#3A3D40');
      for (const px of [x, x + gen - 8]) kutu('Çerçeve', px, y0 + 14, zOn - 10, 8, Math.min(yuk - 40, (oy || 490)), 8);
      for (const [i, yy] of [y0 + 30, y0 + 30 + Math.min(yuk - 60, oy || 490) * 0.5].entries()) {
        telSepet(x + 8, yy, zOn - der + 6, gen - 16, der - 16, i ? 90 : 110);
        if (o.tabak && i) { const n = Math.max(4, Math.floor((der - 40) / 28)); for (let j = 0; j <= n; j++) tel(x + 12, yy + 6, zOn - der + 20 + (der - 50) * j / n, gen - 24, 150, 3); }
      }
      sonuc.kapakCek = cek;
      break;
    }
    case 'dar': { // dar çekmeli ünite (şişelik, deterjanlık, yandan raylı ünite): ön kapağa bağlı çerçeve ve katlar
      // Dar dolapta (30 cm'e kadar) ünite ortadadır ve ön kapak üniteye bağlıdır; geniş dolapta (lavabo altı) sol yana oturur, kapaklar menteşeli kalır
      const genis = w > 320, gen = Math.min(ww, og || 150), x = genis ? x0 + 6 : x0 + (ww - gen) / 2, der = Math.min(dd, od || dd), top = Math.min(yuk - 30, (oy || 500) + 40), kat = o.kat || 2, cek = Math.min(d - 110, genis ? 380 : 430);
      hareket = { cek };
      if (o.tasinir) { // taşınabilir sepetli deterjanlık: rayda duran saplı sepet ve alt sepet
        kutu('Ray', x, y0 + 10, zOn - der, gen, 8, der, 'koyu', '#3A3D40'); telSepet(x, y0 + 20, zOn - der, gen, der, 120);
        telSepet(x + 10, y0 + 170, zOn - der + 30, gen - 20, der * 0.6, 130); tel(x + gen / 2 - 3, y0 + 300, zOn - der + 30, 6, 60, 6); tel(x + gen / 2 - 3, y0 + 300, zOn - der * 0.4 + 24, 6, 60, 6); tel(x + gen / 2 - 3, y0 + 356, zOn - der + 30, 6, 6, der * 0.6);
        break;
      }
      for (const px of [x, x + gen - 7]) { kutu('Çerçeve', px, y0 + 12, zOn - 9, 7, top, 7); kutu('Çerçeve', px, y0 + 12, zOn - der, 7, top, 7); }
      kutu('Taban rayı', x, y0 + 4, zOn - der, gen, 8, der, 'koyu', '#3A3D40'); kutu('Üst bağlantı', x, y0 + 12 + top - 7, zOn - der, 7, 7, der); kutu('Üst bağlantı', x + gen - 7, y0 + 12 + top - 7, zOn - der, 7, 7, der);
      for (let i = 0; i < kat; i++) {
        const yy = y0 + 22 + (top - 30) * i / kat, hs = o.dik ? Math.min(top - 60, 420) : o.sise ? 70 : 85;
        if (o.dik) { for (let j = 0; j < 3; j++) { tel(x + 7, yy + 4, zOn - der + 20 + (der - 60) * j / 2, gen - 14, 5, 5); tel(x + 7, yy + hs, zOn - der + 20 + (der - 60) * j / 2, gen - 14, 5, 5); } kutu('Taban', x + 7, yy, zOn - der + 6, gen - 14, 4, der - 14); }
        else kutuSepet(x + 7, yy, zOn - der + 7, gen - 14, der - 16, hs);
        if (o.sise && !o.dik) tel(x + 7, yy + 150, zOn - der + 7, gen - 14, 4, 4), tel(x + 7, yy + 150, zOn - 13, gen - 14, 4, 4), tel(x + 7, yy + 150, zOn - der + 7, 4, 4, der - 16), tel(x + gen - 11, yy + 150, zOn - der + 7, 4, 4, der - 16);
      }
      if (!genis) sonuc.kapakCek = cek;
      break;
    }
    case 'tepsi': { // raylı taşıyıcı tepsi (tüpçekte üstünde tüp)
      const gen = Math.min(ww, og || 300), x = x0 + (ww - gen) / 2, der = Math.min(dd, od || dd), cek = Math.min(d - 120, 380);
      hareket = { cek }; kutu('Ray', x, y0 + 8, zOn - der, gen, 8, der, 'koyu', '#3A3D40'); kutu('Tepsi', x, y0 + 16, zOn - der, gen, 6, der); for (const px of [x, x + gen - 5]) kutu('Tepsi kenarı', px, y0 + 22, zOn - der, 5, 30, der); kutu('Tepsi kenarı', x, y0 + 22, zOn - 5, gen, 30, 5);
      if (o.tup) { const r = Math.min(gen, der) * 0.42; silindir('Tüp', x + gen / 2, y0 + 24, zOn - der / 2, r, Math.min(yuk - 120, 330), 'inox', '#9EA3A8'); silindir('Tüp boynu', x + gen / 2, y0 + 24 + Math.min(yuk - 120, 330), zOn - der / 2, r * 0.3, 50, 'inox', '#8A8F94'); }
      break;
    }
    case 'cop': { // çöp kovaları: rayda taşıyıcı çerçeve ve kovalar (yan yana ya da arka arkaya)
      const gen = Math.min(ww, og || 260), x = x0 + (ww - gen) / 2, der = Math.min(dd, od || dd), cek = Math.min(d - 110, 430);
      const hk = Math.min(yuk - 110, o.alcak ? 250 : o.buyuk ? 470 : Math.max(240, (oy || 400) - 70));
      hareket = { cek }; kutu('Ray', x, y0 + 6, zOn - der, gen, 10, der, 'koyu', '#3A3D40');
      for (const px of [x, x + gen - 6]) kutu('Taşıyıcı', px, y0 + 16, zOn - der, 6, 8, der); kutu('Taşıyıcı', x, y0 + 16, zOn - 6, gen, hk * 0.5, 6); kutu('Taşıyıcı', x, y0 + 16 + hk * 0.5 - 6, zOn - der, gen, 6, 6);
      const top = o.kova.reduce((s, v) => s + v, 0), ic = (o.arka ? der : gen) - 16;
      let p = 8;
      o.kova.forEach((v, i) => {
        const b = ic * v / top - (o.kova.length > 1 ? 6 : 0), vurgu = i ? SARI : YESIL, hv = v < 0.5 ? hk * 0.45 : hk;
        if (o.arka) kova(x + 8, y0 + 24, zOn - der + p, gen - 16, b, hv, vurgu); else kova(x + p, y0 + 24, zOn - der + 10, b, der - 22, hv, vurgu);
        p += ic * v / top;
      });
      if (o.sepet) telSepet(x + 8, y0 + 24, zOn - der + 10, gen * 0.28, der - 22, 120);
      if (!o.kapak && !o.alcak) { hareket = null; kutu('Kova kapağı', x + 6, y0 + 24 + hk + 34, z0 + 20, gen - 12, 8, der - 30, 'koyu', o.celik ? KOVA_KOYU : renkAdi === 'Antrasit' ? KOVA_KOYU : KOVA_ACIK); } // rayda kalan kapak
      if (o.kapak) sonuc.kapakCek = cek;
      break;
    }
    case 'kilerFrenli': case 'kilerTeleskopik': case 'kilerIkiz': { // boy dolapta kiler
      const frenli = md.duzen === 'kilerFrenli', ikiz = md.duzen === 'kilerIkiz', n = Math.max(3, Math.min(7, Math.round(yuk / 330)));
      const gen = frenli ? Math.min(ww, Math.max(og || 230, ww * 0.82)) : ww, x = x0 + (ww - gen) / 2, cek = Math.min(d - 100, 460);
      if (frenli) { // öne çekilen çerçeve, kapağa bağlı; sepetler çerçevede
        hareket = { cek };
        for (const px of [x, x + gen - 8]) { kutu('Çerçeve', px, y0 + 10, zOn - 10, 8, yuk - 20, 8); kutu('Çerçeve', px, y0 + 10, z0 + 10, 8, yuk - 20, 8); }
        for (const yy of [y0 + 10, y1 - 18]) { kutu('Çerçeve', x, yy, z0 + 10, 8, 8, dd - 10); kutu('Çerçeve', x + gen - 8, yy, z0 + 10, 8, 8, dd - 10); }
        for (let i = 0; i < n; i++) kutuSepet(x + 8, y0 + 30 + (yuk - 60) * i / n, z0 + 18, gen - 16, dd - 28, 95);
        sonuc.kapakCek = cek;
      } else if (ikiz) { // kapak arkasında dar sepetler (kapakla döner), içeride geniş sepetler (öne gelir)
        const kd = 115, ky = c.kapakYon === 'sag' ? 'sag' : 'sol';
        hareket = { cek: Math.min(d - 200, 260) };
        for (const px of [x, x + gen - 8]) kutu('Çerçeve', px, y0 + 10, z0 + 10, 8, yuk - 20, 8);
        for (let i = 0; i < n; i++) kutuSepet(x + 8, y0 + 30 + (yuk - 60) * i / n, z0 + 14, gen - 16, dd - kd - 40, 90);
        hareket = { ac: { x: ky === 'sol' ? 0 : w, z: d, yon: ky } };
        for (const px of [x + 14, x + gen - 22]) kutu('Kapak çerçevesi', px, y0 + 10, zOn - kd, 8, yuk - 20, 8);
        for (let i = 0; i < n; i++) kutuSepet(x + 22, y0 + 40 + (yuk - 60) * i / n, zOn - kd, gen - 44, kd - 6, 70);
      } else { // teleskopik: her sepet kendi rayında; üsttekiler az, alttakiler çok çekilir
        for (let i = 0; i < n; i++) { hareket = { cek: Math.max(120, cek - 90 - i * 45) }; const yy = y0 + 30 + (yuk - 60) * i / n; kutu('Ray', x, yy - 8, z0 + 10, gen, 6, dd - 14, 'koyu', '#3A3D40'); telSepet(x + 4, yy, z0 + 12, gen - 8, dd - 20, 90); }
      }
      break;
    }
    case 'korDoner': case 'korSepet': { // kör köşe: kapak tarafı ve kör bölüm
      const kp = c.kapi || { x0: w / 2, x1: w - T }, kg = kp.x1 - kp.x0 - 16, sagKapi = (kp.x0 + kp.x1) / 2 > w / 2, kx = kp.x0 + 8, korX = sagKapi ? T + 10 : kp.x1 + 8, korG = (sagKapi ? kp.x0 : w - T) - korX - 12;
      const katlar = [y0 + 30, y0 + yuk * 0.52];
      if (md.duzen === 'korDoner') { // böbrek biçimli iki tabla, kapak tarafındaki dikmede döner
        const px = sagKapi ? kp.x0 + 30 : kp.x1 - 30, pz = zOn - 40, r1 = Math.min((dd - 24) / 2, 250, (sagKapi ? px - T : w - T - px) / 2.3), cz = z0 + 12 + r1, yon = sagKapi ? 1 : -1;
        hareket = null; silindir('Mekanizma mili', px, y0, pz, 13, yuk);
        katlar.forEach((yy, i) => {
          hareket = { ac: { x: px + i * 0.5, z: pz, yon: 'don', aci: yon * (i ? 1.75 : 2.1) } };
          tabla(px - yon * r1 * 1.25, yy, cz, r1, 1, [1, 1], 44); tabla(px - yon * r1 * 0.35, yy, cz + r1 * 0.18, r1 * 0.72, 1, [1, 1], 44);
        });
      } else { // dört sepet: kapak tarafındakiler öne çıkar, kör bölümdekiler boşalan yere kayar
        const cek = Math.min(d - 100, 430);
        for (const yy of katlar) {
          hareket = { cek }; kutuSepet(kx, yy, z0 + 16, kg, dd - 26, 95);
          hareket = { kay: (sagKapi ? 1 : -1) * (Math.abs((kp.x0 + kp.x1) / 2 - (korX + korG / 2))) }; kutuSepet(korX, yy, z0 + 16, Math.min(korG, kg), dd - 26, 95);
        }
        hareket = { cek }; for (const px of [kx, kx + kg - 8]) kutu('Çerçeve', px, y0 + 10, zOn - 10, 8, yuk - 20, 8);
        if (o.kapak) sonuc.kapakCek = cek;
      }
      break;
    }
    case 'doner': { // L köşede döner tablalar
      const ml = c.mil || { x: w / 2, z: d / 2, r: Math.min(w, d) * 0.3 }, yon = c.sagda ? -1 : 1, r = Math.min(ml.r, og ? og / 2 : ml.r);
      const ac = { x: ml.x, z: ml.z, yon: 'don', aci: yon * (o.pay === 0.5 ? 1.6 : 2.2) };
      hareket = o.pay === 0.5 ? null : { ac }; silindir('Döner mil', ml.x, y0, ml.z, 14, yuk);
      hareket = { ac };
      for (const yy of [y0 + 30, y0 + yuk * 0.52]) tabla(ml.x, yy, ml.z, r, o.pay, [c.sagda ? -1 : 1, 1], md.seri === 'tel' && !md.tabla ? 60 : 36);
      if (o.pay !== 0.5) sonuc.kapakAc = ac; // tam ve dörtte üç tablada kapaklar tablaya bağlıdır
      break;
    }
    case 'tabaklik': { // üst dolapta tabaklık / bardaklık ve damlalık tepsisi
      const gen = ww, x = x0, der = Math.min(dd, od ? od + 20 : dd), z = z0 + 6;
      hareket = null;
      if (o.tepsi || o.tabak) kutu('Damlalık tepsisi', x, y0 + 4, z, gen, 9, der, 'koyu', renkAdi === 'Krom' ? '#D9DCDE' : '#3A3D40');
      const ray = yy => { tel(x, yy, z + 24, gen, 5, 5); tel(x, yy, z + der - 30, gen, 5, 5); tel(x, yy, z + 24, 5, 5, der - 54); tel(x + gen - 5, yy, z + 24, 5, 5, der - 54); };
      let yy = y0 + 46;
      if (o.tabak) { ray(yy); const n = Math.max(6, Math.floor(gen / 26)); for (let i = 0; i <= n; i++) { tel(x + 4 + (gen - 12) * i / n, yy, z + 24, 3.5, 115, 3.5); tel(x + 4 + (gen - 12) * i / n, yy, z + 24, 3.5, 3.5, der - 54); } yy = y0 + yuk * 0.56; }
      if (o.bardak) { ray(yy); const n = Math.max(5, Math.floor(gen / 34)); for (let i = 0; i <= n; i++) tel(x + 4 + (gen - 12) * i / n, yy, z + 24, 3.5, 3.5, der - 54); for (let j = 1; j < 4; j++) tel(x, yy + 2, z + 24 + (der - 54) * j / 4, gen, 3.5, 3.5); }
      break;
    }
    default: return null;
  }
  return sonuc;
}
