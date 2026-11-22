// Ortak projeler: tarayıcıdaki proje kitaplığını ARTAPP sunucusundaki depoyla eşitler.
// Her cihaz kendi kopyasını tutar (bağlantı yokken de çalışır); bağlantı varken iki yan karşılaştırılır.
// Kitaplık kaydı: { id, ad, tarih, proje, es } — es: bu kaydın sunucuda olduğu bilinen sürümünün tarihi.
// Kural: hiçbir sürüm sessizce kaybolmaz. İki cihaz aynı projeyi ayrı ayrı değiştirdiyse yenisi asıl kalır,
// eskisi ayrı bir proje olarak saklanır.
import { yeniKimlik } from './moduller.js';

// ---- Karar (yan etkisiz; sınanabilir) ----
// yerel: [{ id, tarih, es }]   uzak: [{ id, tarih }]   silinen: { id: tarih }   bekleyen: { id: tarih } (bu cihazda silinip sunucuya henüz iletilmeyenler)
export function plan(yerel, uzak, silinen = {}, bekleyen = {}) {
  const is = [], u = new Map(uzak.map(k => [k.id, k])), y = new Map(yerel.map(k => [k.id, k]));
  for (const [id, t] of Object.entries(bekleyen)) {
    const k = u.get(id);
    if (k && k.tarih > t) is.push({ is: 'silme-vazgec', id }); // silindikten sonra başka cihazda değişmiş: proje korunur
    else { is.push({ is: 'sil-uzak', id, tarih: t }); u.delete(id); }
  }
  for (const k of u.values()) {
    const l = y.get(k.id);
    if (!l) is.push({ is: 'cek', id: k.id });
    else if (l.tarih === k.tarih) { if (l.es !== k.tarih) is.push({ is: 'esit', id: k.id, tarih: k.tarih }); }
    else if (l.es === k.tarih) is.push({ is: 'it', id: k.id, onceki: k.tarih });   // yalnızca bu cihazda değişti
    else if (l.es === l.tarih) is.push({ is: 'cek', id: k.id });                    // yalnızca başka cihazda değişti
    else is.push({ is: 'cakisma', id: k.id, kazanan: l.tarih > k.tarih ? 'yerel' : 'uzak', onceki: k.tarih });
  }
  for (const l of y.values()) {
    if (u.has(l.id) || bekleyen[l.id] !== undefined) continue;
    const s = silinen[l.id];
    if (s && l.tarih <= s) is.push({ is: 'sil-yerel', id: l.id });   // başka cihazda silinmiş
    else is.push({ is: 'it', id: l.id, onceki: 0 });                  // sunucuda yok: yeni proje (ya da silindikten sonra değişmiş)
  }
  return is;
}
// Kaydın yeni tarihi: saat geri kalmış bir cihazda bile bilinen sunucu sürümünden büyük olur
export const sonrakiTarih = (es, simdi = Date.now()) => Math.max(simdi, (Number(es) || 0) + 1);

// ---- Uygulama ----
const DURUM = 'kurgu.esit.v1';
const AYAR_ANAHTAR = { modullerim: 'kurgu.modullerim.v1', standart: 'kurgu.standart.v1', firma: 'kurgu.firma.v1', fiyat: 'kurgu.fiyat.v1' };
let kanca = null;          // { oku(), yaz(k), once(), sonra(sonuc) } — ana.js verir
// Sunucusuz kopya (internetteki yayın kopyası; index.html içinde ARTAPP_SUNUCUSUZ = true): ortak depo yoktur,
// projeler yalnızca açıldığı cihazda saklanır ve sunucuya hiç istek gönderilmez.
const SUNUCUSUZ = globalThis.ARTAPP_SUNUCUSUZ === true;
let baglanti = SUNUCUSUZ ? 'cihaz' : 'bilinmiyor'; // 'bagli' | 'yok' | 'bilinmiyor' | 'cihaz' (sunucusuz kopya)
let calisiyor = null, yeniden = false, zaman = null;

const durumOku = () => { try { const d = JSON.parse(localStorage.getItem(DURUM)); return { sil: {}, ayar: {}, ...(d && typeof d === 'object' ? d : {}) }; } catch { return { sil: {}, ayar: {} }; } };
const durumYaz = d => { try { localStorage.setItem(DURUM, JSON.stringify(d)); } catch { /* depolama kapalı olabilir */ } };

async function iste(yol, yontem = 'GET', govde) {
  const kes = new AbortController(), t = setTimeout(() => kes.abort(), 8000);
  try {
    const y = await fetch(yol, { method: yontem, cache: 'no-store', signal: kes.signal,
      headers: yontem === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-Artapp': '1' }, body: govde === undefined ? undefined : JSON.stringify(govde) });
    if (y.status === 409) return { cakisti: true };
    if (!y.ok) throw Object.assign(new Error('sunucu ' + y.status), { durum: y.status });
    return await y.json();
  } finally { clearTimeout(t); }
}

export function esitKur(k) {
  kanca = k;
  if (SUNUCUSUZ) { kanca.sonra({ baglanti }); return Promise.resolve(baglanti); } // ilk açılış beklemesi çözülsün; dinleyici ve yoklama kurulmaz
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') esitle(); });
  window.addEventListener('online', () => esitle());
  setInterval(() => { if (document.visibilityState === 'visible' && baglanti !== 'bilinmiyor') esitle(); }, 15000);
  return esitle();
}
export const esitDurum = () => baglanti;
export function esitPlanla(ms = 1500) { if (SUNUCUSUZ) return; clearTimeout(zaman); zaman = setTimeout(esitle, ms); }
export function esitSilindi(id, tarih = Date.now()) { if (SUNUCUSUZ) return; const d = durumOku(); d.sil[id] = tarih; durumYaz(d); esitPlanla(200); }
export function esitAyarDegisti(ad) { if (SUNUCUSUZ) return; const d = durumOku(); d.ayar[ad] = sonrakiTarih(d.ayar[ad]); durumYaz(d); esitPlanla(); }

// Aynı anda tek eşitleme çalışır; çalışırken gelen istek bitince bir kez daha çalıştırır
export function esitle() {
  if (!kanca || SUNUCUSUZ) return Promise.resolve(baglanti);
  if (calisiyor) { yeniden = true; return calisiyor; }
  calisiyor = birKez().catch(() => { baglanti = 'yok'; }).then(() => {
    calisiyor = null;
    if (yeniden) { yeniden = false; return esitle(); }
    return baglanti;
  });
  return calisiyor;
}

async function birKez() {
  const onceki = baglanti;
  let liste;
  try { liste = await iste('api/projeler'); } catch (h) { baglanti = 'yok'; if (onceki !== 'yok') kanca.sonra({ baglanti }); return; }
  if (!liste || !Array.isArray(liste.projeler)) { baglanti = 'yok'; if (onceki !== 'yok') kanca.sonra({ baglanti }); return; }
  baglanti = 'bagli';
  kanca.once(); // bekleyen yerel kayıt varsa önce o yazılsın
  const d = durumOku(), k = kanca.oku();
  const bas = new Map(k.map(e => [e.id, e.tarih])); // tur başındaki yerel tarihler: tur sürerken yapılan kayıtları ayırt etmek için
  const eklenen = new Set(), kaldirilan = new Set(), silCikar = [], ayarYeni = {};
  const bul = id => k.find(e => e.id === id);
  const sonuc = { baglanti, degisen: new Set(), silinen: new Set(), cakisma: [], ayar: new Set(), ilk: onceki !== 'bagli' };
  const it = async (e, oncekiTarih) => {
    const y = await iste('api/proje/' + e.id, 'PUT', { ad: e.ad, tarih: e.tarih, proje: e.proje, onceki: oncekiTarih });
    if (!y.cakisti) e.es = e.tarih; // çakıştıysa bir sonraki turda iki sürüm karşılaştırılır
  };
  const cek = async id => {
    const u = await iste('api/proje/' + id);
    const e = { id: u.id, ad: u.ad, tarih: u.tarih, proje: u.proje, es: u.tarih }, i = k.findIndex(x => x.id === id);
    if (i >= 0) k[i] = e; else { k.push(e); eklenen.add(id); }
    sonuc.degisen.add(id);
  };
  const kopya = (e, ek) => {
    const id = yeniKimlik(), ad = `${e.ad} (${ek})`.slice(0, 120);
    const yeni = { id, ad, tarih: Date.now(), proje: { ...JSON.parse(JSON.stringify(e.proje)), id, ad } };
    k.push(yeni); eklenen.add(id); sonuc.cakisma.push(e.ad);
    return yeni;
  };
  try {
    for (const a of plan(k, liste.projeler, liste.silinen || {}, d.sil)) {
      const e = bul(a.id);
      if (a.is === 'sil-uzak') { await iste(`api/proje/${a.id}?tarih=${a.tarih}`, 'DELETE'); silCikar.push(a.id); }
      else if (a.is === 'silme-vazgec') silCikar.push(a.id);
      else if (a.is === 'esit') e.es = a.tarih;
      else if (a.is === 'cek') await cek(a.id);
      else if (a.is === 'it') await it(e, a.onceki);
      else if (a.is === 'sil-yerel') { k.splice(k.indexOf(e), 1); kaldirilan.add(a.id); sonuc.silinen.add(a.id); }
      else if (a.is === 'cakisma' && a.kazanan === 'uzak') { // sunucudaki daha yeni: bu cihazdaki sürüm ayrı proje olarak saklanır
        await it(kopya(e, 'bu cihazdaki sürüm'), 0);
        await cek(a.id);
      } else if (a.is === 'cakisma') {                         // bu cihazdaki daha yeni: sunucudaki sürüm ayrı proje olarak saklanır
        const u = await iste('api/proje/' + a.id);
        await it(kopya({ ad: u.ad, proje: u.proje }, 'diğer cihazdaki sürüm'), 0);
        await it(e, a.onceki);
      }
    }
    await ayarlariEsitle(d, liste.ayarlar || {}, sonuc, ayarYeni);
  } finally {
    // Yarıda kesilse bile o ana kadar yapılanlar yazılır; kalanı bir sonraki tur tamamlar.
    // Tur sürerken kullanıcı çalışmaya devam etmiş olabilir: o sırada yapılan kayıt, silme ve yeni proje korunur.
    const simdi = kanca.oku(), sm = new Map(simdi.map(e => [e.id, e])), son = [];
    for (const e of k) {
      const c = sm.get(e.id);
      if (c && bas.has(e.id) && c.tarih !== bas.get(e.id)) { // tur sürerken bu cihazda değişti: yeni hali kalır
        if (sonuc.degisen.delete(e.id)) { /* çekilen sürüm uygulanmaz; sonraki turda iki sürüm karşılaştırılır */ } else c.es = e.es;
        son.push(c);
      } else if (!c && bas.has(e.id) && !eklenen.has(e.id)) { sonuc.degisen.delete(e.id); } // tur sürerken bu cihazda silindi
      else son.push(e);
    }
    for (const c of simdi) {
      if (son.some(e => e.id === c.id)) continue;
      if (kaldirilan.has(c.id)) { if (c.tarih === bas.get(c.id)) continue; sonuc.silinen.delete(c.id); } // silinecekti ama tur sürerken değişti: kalır
      else if (bas.has(c.id)) continue;
      son.push(c); // tur sürerken açılan yeni proje
    }
    kanca.yaz(son);
    const g = durumOku();
    for (const id of silCikar) delete g.sil[id];
    for (const [ad, t] of Object.entries(ayarYeni)) if ((g.ayar[ad] || 0) === (d.ayar[ad] || 0)) g.ayar[ad] = t; // tur sürerken değişen ayar sonraki turda gönderilir
    durumYaz(g);
    if (sonuc.ilk || sonuc.degisen.size || sonuc.silinen.size || sonuc.cakisma.length || sonuc.ayar.size) kanca.sonra(sonuc);
  }
}

// Ortak ayarlar (kayıtlı modüller, varsayılan atölye standardı, firma bilgisi): son yazan geçerli.
// İlk karşılaşmada iki yanda da liste varsa (kayıtlı modüller) birleştirilir, hiçbiri atılmaz.
async function ayarlariEsitle(d, uzakTarih, sonuc, ayarYeni) {
  for (const [ad, anahtar] of Object.entries(AYAR_ANAHTAR)) {
    let ham = null;
    try { ham = localStorage.getItem(anahtar); } catch { /* depolama kapalı */ }
    const yerelT = d.ayar[ad] || 0, uzakT = uzakTarih[ad] || 0;
    let deger = null;
    try { deger = ham ? JSON.parse(ham) : null; } catch { deger = null; }
    if (uzakT > yerelT) {
      const u = await iste('api/ayar/' + ad);
      let yeni = u.deger;
      if (!yerelT && Array.isArray(deger) && Array.isArray(yeni)) { // hiç eşitlenmemiş yerel liste: birleştir
        const var_ = new Set(yeni.map(e => e?.id));
        const ek = deger.filter(e => e?.id && !var_.has(e.id));
        if (ek.length) { yeni = [...yeni, ...ek]; const t = sonrakiTarih(u.tarih); await iste('api/ayar/' + ad, 'PUT', { tarih: t, deger: yeni }); u.tarih = t; }
      }
      try { localStorage.setItem(anahtar, JSON.stringify(yeni)); } catch { continue; }
      ayarYeni[ad] = u.tarih; sonuc.ayar.add(ad);
    } else if (deger !== null && (yerelT > uzakT || !yerelT)) {
      const t = yerelT || sonrakiTarih(uzakT);
      const y = await iste('api/ayar/' + ad, 'PUT', { tarih: t, deger });
      if (!y.cakisti) ayarYeni[ad] = t;
    }
  }
}
