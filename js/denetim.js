// Ergonomi denetimi: çizimi yaygın mutfak tasarım ölçülerine göre kontrol eder.
// Sonuçlar öneridir; çizimi engellemez. Eşikler genel kabul gören değerlerdir, atölye tercihine göre değişebilir.
import { TANIM, TEZGAH_K, KAPAK_K } from './moduller.js';
import { kutu } from './yerlesim.js';

const merkez = (m, oda) => { const k = kutu(m, oda); return { x: (k.x0 + k.x1) / 2, z: (k.z0 + k.z1) / 2 }; };
const uzaklik = (a, b) => Math.round(Math.hypot(a.x - b.x, a.z - b.z));
const dolap = m => ['alt', 'boy'].includes(TANIM[m.tip].sinif);

// İki kutu arasındaki yatay açıklık (karşı karşıyaysa); değilse null
function aralik(a, b) {
  const xOrt = a.x0 < b.x1 && a.x1 > b.x0, zOrt = a.z0 < b.z1 && a.z1 > b.z0;
  if (xOrt && !zOrt) return Math.max(b.z0 - a.z1, a.z0 - b.z1);
  if (zOrt && !xOrt) return Math.max(b.x0 - a.x1, a.x0 - b.x1);
  return null;
}

// { maddeler: [{ tur: 'uyari' | 'iyi' | 'bilgi', mesaj, id? }], ucgen: [{x,z}, {x,z}, {x,z}] | null, kenarlar: [mm, mm, mm] }
export function denetle(p) {
  const { oda, moduller } = p, M = [];
  const ekle = (tur, mesaj, id) => M.push({ tur, mesaj, id });
  const evye = moduller.find(m => m.tip === 'alt_evye');
  const ocakMi = m => (m.tip === 'alt_ocak' || m.tip === 'alt_firin' || m.tip === 'alt_solo') && m.ocakTip !== 'yok';
  const ocak = moduller.find(ocakMi);
  const buz = moduller.find(m => m.tip === 'buzdolabi');
  if (!moduller.some(dolap)) return { maddeler: [{ tur: 'bilgi', mesaj: 'Denetlenecek dolap yok.' }], ucgen: null, kenarlar: [] };

  // Mutfak öğesi hiç yoksa (gardırop, banyo, TV ünitesi) mutfak denetimleri uygulanmaz
  if (!evye && !ocak && !buz) return { maddeler: [{ tur: 'bilgi', mesaj: 'Mutfak öğesi yok; ergonomi denetimi mutfaklar içindir.' }], ucgen: null, kenarlar: [] };
  if (!evye) ekle('bilgi', 'Evye dolabı yok.');
  if (!ocak) ekle('bilgi', 'Ocak yok.');
  if (!buz) ekle('bilgi', 'Buzdolabı yok.');

  // Çalışma üçgeni: evye, ocak, buzdolabı
  let ucgen = null, kenarlar = [];
  if (evye && ocak && buz) {
    const [e, o, b] = [evye, ocak, buz].map(m => merkez(m, oda));
    ucgen = [e, o, b];
    kenarlar = [uzaklik(e, o), uzaklik(o, b), uzaklik(b, e)];
    const adlar = ['Evye – ocak', 'Ocak – buzdolabı', 'Buzdolabı – evye'], idler = [evye.id, ocak.id, buz.id];
    let sorun = false;
    kenarlar.forEach((u, i) => {
      if (u < 1200) { sorun = true; ekle('uyari', `${adlar[i]} arası ${u} mm: çok yakın (en az 1200 önerilir).`, idler[i]); }
      else if (u > 2700) { sorun = true; ekle('uyari', `${adlar[i]} arası ${u} mm: uzak (en çok 2700 önerilir).`, idler[i]); }
    });
    const toplam = kenarlar.reduce((a, c) => a + c, 0);
    if (toplam > 7900) { sorun = true; ekle('uyari', `Çalışma üçgeni toplamı ${toplam} mm: fazla yürüme gerektirir (en çok 7900 önerilir).`); }
    if (!sorun) ekle('iyi', `Çalışma üçgeni uygun: ${kenarlar.join(' + ')} = ${toplam} mm.`);
  }

  // Ocak ve davlumbaz
  for (const o of moduller.filter(ocakMi)) {
    const k = kutu(o, oda), ust = o.h + TEZGAH_K;
    // duvar davlumbazı aynı duvarda ocağın üstünde; ada davlumbazı planda ocağın üstüne denk gelir
    const dav = moduller.find(m => m.tip === 'davlumbaz' && m.duvar === o.duvar && m.x < o.x + o.w && m.x + m.w > o.x)
      || moduller.find(m => { if (m.tip !== 'davlumbaz_ada') return false; const d = kutu(m, oda); return d.x0 < k.x1 && d.x1 > k.x0 && d.z0 < k.z1 && d.z1 > k.z0; });
    if (!dav) ekle('uyari', 'Ocağın üstünde davlumbaz yok.', o.id);
    else {
      const ara = dav.y - ust;
      if (ara < 600) ekle('uyari', `Davlumbaz ocağa ${ara} mm: çok yakın (650–750 önerilir).`, dav.id);
      else if (ara > 800) ekle('uyari', `Davlumbaz ocaktan ${ara} mm yukarıda: çekişi zayıflar (650–750 önerilir).`, dav.id);
    }
    // Ocağın yanında boy dolap ya da buzdolabı
    for (const b of moduller.filter(m => TANIM[m.tip].sinif === 'boy' && m.duvar === o.duvar)) {
      const fark = Math.min(Math.abs(b.x - (o.x + o.w)), Math.abs(o.x - (b.x + b.w)));
      if (fark < 300) { ekle('uyari', `Ocak ${TANIM[b.tip].ad.toLowerCase()} ile bitişik: arada en az 300 mm tezgah önerilir.`, o.id); break; }
    }
    if (evye && evye.duvar === o.duvar) {
      const fark = Math.max(o.x - (evye.x + evye.w), evye.x - (o.x + o.w));
      if (fark >= 0 && fark < 400) ekle('uyari', `Evye ile ocak arasında ${fark} mm tezgah var: en az 400 önerilir.`, o.id);
    }
    void k;
  }

  // Bulaşık makinesi evyeye yakın olmalı
  const bul = moduller.find(m => m.tip === 'alt_bulasik');
  if (bul && evye) {
    const u = uzaklik(merkez(bul, oda), merkez(evye, oda));
    if (u > 1500) ekle('uyari', `Bulaşık makinesi evyeden ${u} mm uzakta: yan yana olması önerilir.`, bul.id);
  }

  // Üst dolap ile tezgah arası
  for (const u of moduller.filter(m => TANIM[m.tip].sinif === 'ust' && m.tip !== 'davlumbaz' && m.duvar !== 'ada')) {
    const alt = moduller.find(m => TANIM[m.tip].sinif === 'alt' && m.duvar === u.duvar && m.x < u.x + u.w && m.x + m.w > u.x);
    if (!alt) continue;
    const ara = u.y - (alt.h + TEZGAH_K);
    if (ara < 450) { ekle('uyari', `Üst dolap tezgahtan ${ara} mm yukarıda: en az 450 önerilir.`, u.id); break; }
  }

  // Geçiş genişlikleri: ada ile karşı dolaplar, karşılıklı duvar sıraları
  const kutular = moduller.filter(dolap).map(m => ({ m, k: kutu(m, oda, KAPAK_K) }));
  let enDar = null;
  for (let i = 0; i < kutular.length; i++) {
    for (let j = i + 1; j < kutular.length; j++) {
      const a = kutular[i], b = kutular[j];
      // Yalnızca karşı karşıya duranlar: ada ile duvar dolabı, ya da sol ile sağ duvar sırası
      const adaCifti = (a.m.duvar === 'ada') !== (b.m.duvar === 'ada');
      const cift = [a.m.duvar, b.m.duvar].sort().join();
      const karsilikli = cift === 'sag,sol' || cift === 'arka,on';
      if (!adaCifti && !karsilikli) continue;
      const g = aralik(a.k, b.k);
      if (g != null && g > 50 && (!enDar || g < enDar.g)) enDar = { g: Math.round(g), id: a.m.duvar === 'ada' ? a.m.id : b.m.id };
    }
  }
  if (enDar) {
    if (enDar.g < 900) ekle('uyari', `En dar geçiş ${enDar.g} mm: rahat çalışma için en az 900, iki kişi için 1200 önerilir.`, enDar.id);
    else ekle('iyi', `En dar geçiş ${enDar.g} mm.`);
  }

  // Tezgah yüksekliği
  const yuk = [...new Set(moduller.filter(m => TANIM[m.tip].sinif === 'alt').map(m => m.h + TEZGAH_K))];
  if (yuk.length > 1) ekle('bilgi', `Tezgah yükseklikleri farklı: ${yuk.sort((a, b) => a - b).join(', ')} mm.`);
  else if (yuk.length && (yuk[0] < 850 || yuk[0] > 950)) ekle('uyari', `Tezgah yüksekliği ${yuk[0]} mm: genelde 850–950 arası kullanılır.`);

  return { maddeler: M, ucgen, kenarlar };
}
