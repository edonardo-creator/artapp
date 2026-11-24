// Modül kataloğu ve parametrik parça üretimi. Tüm ölçüler milimetredir.
// Yerel eksen: x = genişlik, y = yükseklik, z = derinlik (arka 0, ön +z).
// Her modül gerçek panellerden (yan, tabla, raf, kapak...) kurulur; ileride
// kesim listesi doğrudan bu parçalardan çıkarılabilir.

import { KAPAK_MODELLERI, kapakParcalari, kapakStili, camliMi, kulpsuzMu, camAyari } from './kapaklar.js';
import { kulpParcaliMi, kulpParcalari } from './kulplar.js';
import { aksesuarModeli, aksesuarParcalari } from './aksesuarmodel.js';

// Atölye standartları. Projeye göre değişebilir: standartAyarla() ile güncellenir ve bu dosyayı
// içe aktaran her yer yeni değeri görür (canlı bağlama). Varsayılanlar STANDART_VARSAYILAN'da.
// Arkalık bağlantısı: arkalikKanal 1 ise arkalık yanların ve tablaların kanalına girer (atölyenin Adeko kütüphanesindeki düzen:
// kanal arka kenardan 11,5 mm içeride, 8 mm derin; genişlik arkalık kalınlığı + 0,5 mm), 0 ise gövdenin arkasına çakılır.
// Başlangıç ölçüleri atölyenin kendi standardıdır (2026-11-22; kaynak: "benim projem" içindeki atolye-standartlari.json, kullanıcı onaylı):
// baza 150, alt dolap gövdesi 720 yüksek ve 580 derin, tezgah 30 kalın ve 630 geniş (580 + 50 taşma), üst dolap 720 yüksek ve 330 derin (gövde),
// dolap bitişi (genel yükseklik) 2220, taç 80 (taç dahil mutfak bitişi 2300). altGovde, altDerin, ustYuk ve ustDerin yalnızca yeni eklenen dolabın ölçüsünü belirler (yeniModul).
export const STANDART_VARSAYILAN = { govde: 18, arkalik: 8, kapak: 18, baza: 150, altGovde: 720, altDerin: 580, tezgah: 30, tezgahTasma: 50, bosluk: 1.5,
  ustKot: 1500, ustYuk: 720, ustDerin: 330, ustHat: 2220, tac: 80, arkalikKanal: 1, kanalArka: 11.5, kanalDerin: 8 };
// 2026-11-22'den önceki başlangıç ölçüleri. Ölçü sürümü taşımayan (o günden önce kaydedilmiş) projede std içinde bulunmayan alanlar buradan
// okunur; böylece eski projelerin parça ölçüleri değişmez ve onlara eklenen dolap eski ölçüsünde gelir. O projelerde alt dolabın bazalı
// yüksekliği sabit 860 mm idi: baza değiştirilmişse gövde 860 − baza olur.
export const STANDART_ONCEKI = { ...STANDART_VARSAYILAN, baza: 100, altGovde: 760, altDerin: 560, tezgah: 40, tezgahTasma: 40, bosluk: 2, ustYuk: 700, ustDerin: 320, ustHat: 2200, tac: 50 };
const ONCEKI_ALT_YUK = 860;
export const OLCU_SURUM = 3; // yeni projenin ayar.olcu değeri. 2: yeni ölçü kuralları (2026-11-22). 3: ayrıca köşe gövdesi kuralı (2026-11-23)
const YENI_KURAL_SURUM = 2;   // bu sürümden itibaren std içinde eksik alan başlangıç ölçüsünden okunur ve yeni ölçü kuralları geçerlidir
const KOSE_KURAL_SURUM = 3;   // bu sürümden itibaren L köşe ve kavisli gövdede arkalık kanallıdır, raf hareketli raf ölçüsündedir
export const STANDART_SINIR = { // [en az, en çok]
  govde: [12, 25], arkalik: [3, 18], kapak: [16, 25], baza: [60, 200], tezgah: [12, 80], tezgahTasma: [20, 80], bosluk: [1, 5], ustKot: [1200, 1800], ustHat: [1900, 2700],
  altGovde: [400, 1000], altDerin: [300, 800], ustYuk: [300, 1200], ustDerin: [200, 600], tac: [20, 200],
  arkalikKanal: [0, 1], kanalArka: [5, 40], kanalDerin: [3, 12],
};
export let T = 18;        // gövde levha kalınlığı
export let ARK = 8;       // arkalık kalınlığı
export let ARK_KANAL = true;  // arkalık kanala mı girer (false: arkadan çakılır)
export let KANAL_ARKA = 11.5; // kanalın arka kenardan uzaklığı
export let KANAL_DERIN = 8;   // kanal derinliği (arkalığın levhaya girdiği pay)
export let GZ = 0;        // gövdenin çevre parçalarının (yan, alt ve üst tabla) başladığı derinlik: çakmada arkalığın önü, kanallıda 0
export let IC = 20;       // dolabın içinin başladığı derinlik (arkalığın ön yüzü); raf, dikme, kayıt ve çekmece buradan başlar
export let KAPAK_K = 18;  // kapak kalınlığı
export let BAZA = 100;    // baza yüksekliği (buradaki ilk değerler önceki ölçülerdir; proje açılınca projeAyarla ile değişir)
export let ALT_GOVDE = 760;   // yeni alt dolabın gövde yüksekliği (bazasız)
export let ALT_DERIN = 560;   // yeni alt ve boy dolabın gövde derinliği (kapaksız)
export let UST_YUK = 700;     // yeni üst dolabın yüksekliği
export let UST_DERIN = 320;   // yeni üst dolabın gövde derinliği
export let TEZGAH_K = 40; // tezgah kalınlığı
export let TEZGAH_TASMA = 40; // tezgahın gövdeden öne taşması (kapak dahil)
export let UST_KOT = 1500;    // üst dolapların alt kotu (yeni eklenenler için)
export let UST_HAT = 2200;    // genel yükseklik: üst ve boy dolapların üst kenarının hizalandığı kot
export let TAC = 50;          // taç (kornis) yüksekliği: "Kornis" açıkken üst ve boy dolabın üstüne çizilir; mutfak bitişi = genel yükseklik + taç
let B = 2;                // kapak boşluğu: kapağın her kenarındaki pay
// Yeni ölçü kuralları (2026-11-22, eB Creator'ın örnek CAM listesinden): yalnızca yeni ölçü sürümündeki projelerde etkindir (ayar.olcu >= OLCU_SURUM).
// İki kapak arası 2 × boşluk, hareketli raf iç genişlikten 2 mm dar ve gövdeden 20 mm kısa, üç çekmecede 1/2 + 1/4 + 1/4, çekmece kutusu ray boyunda,
// duvara dayalı dolaplarda baza tek parça (kesim listesi). Eski projeler önceki kurallarla kalır: parça ölçüleri değişmez.
export let YENI_KURAL = false;
// Köşe gövdesi kuralı (2026-11-23): L köşe ve kavisli bitiş dolabında arkalık, düz gövdedeki gibi yanların ve tablaların kanalına girer
// (atölye standardında arkalık kanallıysa) ve raf hareketli raf ölçüsünde kesilir (yanlardan 1 mm dar, önden 20 mm kısa, arkalığa dayalı).
// Yalnızca ayar.olcu >= 3 olan projelerde etkindir; önceki projelerde köşe gövdesi çakma arkalıklı ve tabla ölçüsünde raflı kalır.
export let KOSE_KURAL = false;
// Ray türüne göre çekmece kutusu (yalnızca yeni ölçü kurallarında). Kaynak: atölyenin Adeko kütüphanesindeki ray ayarları
// (DEFAULT_HELPERS/CEKMECE BLUM TANDEM …, CEKMECE BLUM TANDEMBOX …/DRAWER_DEFAULT: DRAWER_TOTAL_GAP_WID, DRAWER_PANELS_WID_DIFF, DRAWER_PANELS_HEI_DIFF_BOTTOM);
// teleskopik rayda eB Creator'ın örnek CAM listesindeki ölçü (her yanda 13 mm) korunur: arşivdeki teleskopik kaydı gizli rayın kopyasıdır (toplam 10 mm), teleskopik raya uymaz.
//   bosluk: gövde iç genişliği − kutu genişliği (tabanın eni); alt: ön ve arka parçanın yandan alçaklığı;
//   kutu: metal yanlı hazır kutu çekmece (yan ve ön kesilmez; taban ve arka gövde levhasından); arkaFark: arkanın tabandan darlığı; arkaYuk: hazır arka yükseklikleri
export const RAY_OLCU = {
  teleskopik: { bosluk: 26, alt: 10 },
  tandem: { bosluk: 10, alt: 20 },
  tandembox: { bosluk: 75, alt: 0, kutu: true, arkaFark: 10, arkaYuk: [69, 84, 116, 199] },
};
export let RAY = 'teleskopik'; // projenin ray türü (ayar.uretim.ray); projeAyarla ile etkinleşir

// Kapak modeli (stil): projenin tüm kapak ve çekmece önlerine uygulanır; üst ve boy dolaplara ayrı model seçilebilir,
// modül de kendi modelini seçebilir. Stil listesi kapaklar.js içindedir.
export { KAPAK_MODELLERI };
export let KAPAK_MODEL = 'duz';
let KAPAK_MODEL_UST = '', KAPAK_MODEL_BOY = '', CAM_AYAR = camAyari(null);

// Projenin ayarlarını (atölye standartları, kapak modelleri, cam ve alüminyum seçimi) etkin kılar.
// Çizim, teknik çizim ve aktarım bunu çağırır.
export function projeAyarla(ayar) {
  KAPAK_MODEL = KAPAK_MODELLERI[ayar?.kapakModel] ? ayar.kapakModel : 'duz';
  KAPAK_MODEL_UST = KAPAK_MODELLERI[ayar?.kapakModelUst] ? ayar.kapakModelUst : '';
  KAPAK_MODEL_BOY = KAPAK_MODELLERI[ayar?.kapakModelBoy] ? ayar.kapakModelBoy : '';
  CAM_AYAR = camAyari(ayar);
  RAY = RAY_OLCU[ayar?.uretim?.ray] ? ayar.uretim.ray : 'teleskopik';
  return standartAyarla(ayar?.std, ayar?.olcu);
}
// Modülün kapak stili: modüle özel seçim, yoksa sırasına (üst, boy) özel proje seçimi, yoksa projenin genel modeli
export function modulKapakStili(m) {
  if (KAPAK_MODELLERI[m.kapakModel]) return m.kapakModel;
  const s = TANIM[m.tip]?.sinif;
  return (s === 'ust' && KAPAK_MODEL_UST) || (s === 'boy' && KAPAK_MODEL_BOY) || KAPAK_MODEL;
}

// Verilen standartları (eksik ya da sınır dışı değerlerde varsayılanı) etkin kılar; etkin değerleri döndürür.
// surum: projenin ayar.olcu değeri. 2'den küçükse (eski proje) eksik alanlar önceki ölçülerden okunur; 3'ten küçükse köşe gövdesi önceki kurgudadır.
export function standartAyarla(s = {}, surum = 0) {
  const eski = !(surum >= YENI_KURAL_SURUM);
  YENI_KURAL = !eski; KOSE_KURAL = surum >= KOSE_KURAL_SURUM;
  const al = ad => {
    const v = Number(s?.[ad]), [a, b] = STANDART_SINIR[ad];
    if (Number.isFinite(v) && v >= a && v <= b) return v;
    if (!eski) return STANDART_VARSAYILAN[ad];
    return ad === 'altGovde' ? ONCEKI_ALT_YUK - BAZA : STANDART_ONCEKI[ad];
  };
  T = al('govde'); ARK = al('arkalik'); KAPAK_K = al('kapak'); BAZA = al('baza');
  ALT_GOVDE = al('altGovde'); ALT_DERIN = al('altDerin'); UST_YUK = al('ustYuk'); UST_DERIN = al('ustDerin');
  ARK_KANAL = al('arkalikKanal') >= 0.5 && ARK < T; KANAL_ARKA = al('kanalArka'); KANAL_DERIN = Math.min(al('kanalDerin'), T - 5);
  GZ = ARK_KANAL ? 0 : ARK; IC = ARK_KANAL ? KANAL_ARKA + ARK + 0.5 : ARK; // kanallıda kanalın ön kenarı
  TEZGAH_K = al('tezgah'); TEZGAH_TASMA = al('tezgahTasma'); B = al('bosluk'); UST_KOT = al('ustKot'); UST_HAT = al('ustHat'); TAC = al('tac');
  return { govde: T, arkalik: ARK, kapak: KAPAK_K, baza: BAZA, altGovde: ALT_GOVDE, altDerin: ALT_DERIN, tezgah: TEZGAH_K, tezgahTasma: TEZGAH_TASMA, bosluk: B,
    ustKot: UST_KOT, ustYuk: UST_YUK, ustDerin: UST_DERIN, ustHat: UST_HAT, tac: TAC,
    arkalikKanal: ARK_KANAL ? 1 : 0, kanalArka: KANAL_ARKA, kanalDerin: KANAL_DERIN };
}
export const BOLMELI = new Set(['alt_kapak', 'ust_kapak', 'ust_tepe', 'ust_cam', 'ust_acik', 'boy_kiler', 'boy_gardirop']);
// Kalkar kapak (yukarı açılan tek kapak) seçilebilen üst dolaplar
export const KALKAR_OLUR = new Set(['ust_kapak', 'ust_tepe', 'ust_buzustu', 'ust_cam']);

// grup: alt | ust | boy | cihaz   —   tezgah: üstüne tezgah gelir mi
// Dolap ölçüleri başlangıç standardıyla (STANDART_VARSAYILAN) yazılıdır; yeni modül projenin etkin standardına çevrilir (standartOlcu).
export const KATALOG = [
  { tip: 'alt_kapak',   ad: 'Alt dolap',            grup: 'Alt dolaplar', sinif: 'alt', w: 600, h: 870, d: 580, y: 0, kapak: 1, raf: 1, tezgah: true },
  { tip: 'alt_cekmece', ad: 'Çekmeceli dolap',      grup: 'Alt dolaplar', sinif: 'alt', w: 600, h: 870, d: 580, y: 0, cekmece: 3, tezgah: true },
  { tip: 'alt_evye',    ad: 'Evye dolabı',          grup: 'Alt dolaplar', sinif: 'alt', w: 800, h: 870, d: 580, y: 0, kapak: 2, raf: 0, tezgah: true },
  { tip: 'alt_ocak',    ad: 'Ocak dolabı',          grup: 'Alt dolaplar', sinif: 'alt', w: 900, h: 870, d: 580, y: 0, cekmece: 2, tezgah: true },
  { tip: 'alt_firin',   ad: 'Ankastre fırın (alt)', grup: 'Alt dolaplar', sinif: 'alt', w: 600, h: 870, d: 580, y: 0, tezgah: true },
  { tip: 'alt_bulasik', ad: 'Bulaşık makinesi',     grup: 'Alt dolaplar', sinif: 'alt', w: 600, h: 870, d: 580, y: 0, tezgah: true },
  { tip: 'alt_kose',    ad: 'Kör köşe dolabı',      grup: 'Alt dolaplar', sinif: 'alt', w: 1050, h: 870, d: 580, y: 0, raf: 1, tezgah: true, korYon: 'sol' },
  { tip: 'alt_lkose',   ad: 'L köşe dolabı',        grup: 'Alt dolaplar', sinif: 'alt', w: 900, h: 870, d: 900, kol: 580, y: 0, raf: 1, korYon: 'sol' },
  { tip: 'alt_kavis',   ad: 'Kavisli bitiş dolabı', grup: 'Alt dolaplar', sinif: 'alt', w: 580, h: 870, d: 580, y: 0, raf: 1, korYon: 'sag' },

  { tip: 'alt_camasir', ad: 'Çamaşır makinesi',     grup: 'Cihazlar', sinif: 'alt', w: 600, h: 870, d: 580, y: 0, tezgah: true },
  { tip: 'alt_sarap',   ad: 'Şarap dolabı',         grup: 'Cihazlar', sinif: 'alt', w: 300, h: 870, d: 580, y: 0, tezgah: true },
  { tip: 'alt_solo',    ad: 'Solo fırın (ocaklı)',  grup: 'Cihazlar', sinif: 'alt', w: 600, h: 850, d: 600, y: 0 },
  { tip: 'boy_camasir', ad: 'Çamaşır + kurutma kulesi', grup: 'Cihazlar', sinif: 'boy', w: 650, h: 2220, d: 600, y: 0 },
  { tip: 'alt_sise',    ad: 'Şişelik (açık)',       grup: 'Alt dolaplar', sinif: 'alt', w: 300, h: 870, d: 580, y: 0, raf: 5, tezgah: true },

  { tip: 'ust_kavis',   ad: 'Kavisli üst bitiş',    grup: 'Üst dolaplar', sinif: 'ust', w: 330, h: 720, d: 330, y: 1500, raf: 2, korYon: 'sag' },
  { tip: 'ust_kavis_acik', ad: 'Kavisli açık raf',  grup: 'Üst dolaplar', sinif: 'ust', w: 330, h: 720, d: 330, y: 1500, raf: 2, korYon: 'sag' },
  { tip: 'ust_mikro',   ad: 'Mikrodalga dolabı',    grup: 'Üst dolaplar', sinif: 'ust', w: 600, h: 900, d: 380, y: 1320, kapak: 1 },
  { tip: 'ust_lkose',   ad: 'L köşe üst dolap',    grup: 'Üst dolaplar', sinif: 'ust', w: 650, h: 720, d: 650, kol: 330, y: 1500, raf: 2, korYon: 'sol' },
  { tip: 'ust_kapak',   ad: 'Üst dolap',           grup: 'Üst dolaplar', sinif: 'ust', w: 600, h: 720, d: 330, y: 1500, kapak: 1, raf: 2 },
  // Buzdolabının üstünü kapatır: derin gövde, üst kenarı genel yükseklik hattına hizalanır
  { tip: 'ust_buzustu', ad: 'Buzdolabı üstü dolap', grup: 'Üst dolaplar', sinif: 'ust', w: 700, h: 320, d: 580, y: 1900, kapak: 2, raf: 0 },
  { tip: 'ust_tepe',    ad: 'Tepe dolabı',         grup: 'Üst dolaplar', sinif: 'ust', w: 600, h: 500, d: 330, y: 2220, kapak: 1, raf: 0 },
  { tip: 'ust_cam',     ad: 'Camlı üst dolap',     grup: 'Üst dolaplar', sinif: 'ust', w: 800, h: 720, d: 330, y: 1500, kapak: 2, raf: 2 },
  { tip: 'ust_acik',    ad: 'Açık raf',             grup: 'Üst dolaplar', sinif: 'ust', w: 600, h: 720, d: 300, y: 1500, raf: 2 },
  { tip: 'davlumbaz',   ad: 'Davlumbaz',            grup: 'Üst dolaplar', sinif: 'ust', w: 900, h: 720, d: 480, y: 1500 },

  { tip: 'davlumbaz_ada', ad: 'Ada davlumbazı',     grup: 'Üst dolaplar', sinif: 'ust', w: 900, h: 1100, d: 600, y: 1600 },

  { tip: 'boy_kiler',   ad: 'Boy dolap (kiler)',   grup: 'Boy dolaplar', sinif: 'boy', w: 600, h: 2220, d: 580, y: 0, kapak: 1, raf: 4 },
  { tip: 'boy_firin',   ad: 'Fırın + mikrodalga kulesi', grup: 'Boy dolaplar', sinif: 'boy', w: 600, h: 2220, d: 580, y: 0 },
  { tip: 'buzdolabi',   ad: 'Buzdolabı',            grup: 'Boy dolaplar', sinif: 'boy', w: 700, h: 1900, d: 640, y: 0 },
  { tip: 'boy_ankastre', ad: 'Ankastre buzdolabı dolabı', grup: 'Boy dolaplar', sinif: 'boy', w: 600, h: 2220, d: 580, y: 0 },

  // Mutfak dışı mobilya
  { tip: 'boy_gardirop', ad: 'Gardırop',            grup: 'Diğer mobilya', sinif: 'boy', w: 1000, h: 2400, d: 600, y: 0, kapak: 2, raf: 0 },
  { tip: 'boy_vestiyer', ad: 'Vestiyer',            grup: 'Diğer mobilya', sinif: 'boy', w: 900, h: 2200, d: 380, y: 0, kapak: 2 },
  { tip: 'alt_tv',      ad: 'TV ünitesi',           grup: 'Diğer mobilya', sinif: 'alt', w: 1800, h: 480, d: 420, y: 0, kapak: 1 },
  { tip: 'alt_banyo',   ad: 'Banyo dolabı (lavabolu)', grup: 'Diğer mobilya', sinif: 'alt', w: 800, h: 550, d: 460, y: 300, cekmece: 2 },
  { tip: 'ust_ayna',    ad: 'Aynalı dolap',         grup: 'Diğer mobilya', sinif: 'ust', w: 800, h: 700, d: 150, y: 1250, kapak: 2, raf: 2 },
  { tip: 'tv',          ad: 'Televizyon',           grup: 'Diğer mobilya', sinif: 'dekor', w: 1250, h: 720, d: 60, y: 950 },

  // Serbest ölçülü özel modül: bölmelerini (alttan üste) kullanıcı kurar
  { tip: 'ozel_alt',    ad: 'Özel modül (alt)',     grup: 'Özel modül', sinif: 'alt', w: 600, h: 870, d: 580, y: 0, tezgah: true },
  { tip: 'ozel_ust',    ad: 'Özel modül (üst)',     grup: 'Özel modül', sinif: 'ust', w: 600, h: 720, d: 330, y: 1500 },
  { tip: 'ozel_boy',    ad: 'Özel modül (boy)',     grup: 'Özel modül', sinif: 'boy', w: 600, h: 2220, d: 580, y: 0 },

  // Ölçü ve not: duvardaki işaretler; çakışma sayılmaz, teknik çizimde ve DXF'te görünür
  { tip: 'not_yazi',    ad: 'Yazılı not',           grup: 'Ölçü ve not', sinif: 'tesisat', w: 120, h: 120, d: 6, y: 1700, kisa: 'N' },
  { tip: 'olcu_cizgi',  ad: 'Ölçü çizgisi',         grup: 'Ölçü ve not', sinif: 'tesisat', w: 1000, h: 40, d: 6, y: 1200, kisa: 'Ö' },

  // Bitiş parçaları: sıranın ucunu kapatır ya da dolap ile duvar arasını doldurur
  { tip: 'panel_yan',   ad: 'Yan bitiş paneli',     grup: 'Bitiş parçaları', sinif: 'alt', w: 18, h: 870, d: 600, y: 0, tezgah: true },
  { tip: 'dolgu',       ad: 'Duvar dolgusu',        grup: 'Bitiş parçaları', sinif: 'alt', w: 80, h: 870, d: 580, y: 0, tezgah: true },

  // Tesisat noktaları: duvardaki işaretler. Dolaplarla çakışma sayılmaz; priz ve anahtar dolap arkasında kalırsa uyarı verir.
  { tip: 'priz',        ad: 'Priz',                 grup: 'Tesisat', sinif: 'tesisat', w: 80, h: 80, d: 12, y: 1100, kisa: 'P' },
  { tip: 'anahtar',     ad: 'Anahtar',              grup: 'Tesisat', sinif: 'tesisat', w: 80, h: 80, d: 12, y: 1050, kisa: 'A' },
  { tip: 'su_giris',    ad: 'Su girişi (sıcak/soğuk)', grup: 'Tesisat', sinif: 'tesisat', w: 160, h: 60, d: 30, y: 550, kisa: 'S' },
  { tip: 'gider',       ad: 'Pis su gideri',        grup: 'Tesisat', sinif: 'tesisat', w: 90, h: 90, d: 30, y: 400, kisa: 'G' },
  { tip: 'dogalgaz',    ad: 'Doğalgaz noktası',     grup: 'Tesisat', sinif: 'tesisat', w: 70, h: 110, d: 40, y: 700, kisa: 'DG' },

  // Yapı öğeleri: dolap değildir, ama aynı şekilde yerleşir ve dolapların çakışmasını engeller
  { tip: 'pencere',     ad: 'Pencere',              grup: 'Oda öğeleri', sinif: 'yapi', w: 1200, h: 1200, d: 40, y: 1000 },
  { tip: 'kapi',        ad: 'Kapı',                 grup: 'Oda öğeleri', sinif: 'yapi', w: 900, h: 2100, d: 40, y: 0 },
  { tip: 'kolon',       ad: 'Kolon / çıkıntı',      grup: 'Oda öğeleri', sinif: 'yapi', w: 400, h: 2700, d: 400, y: 0 },
  { tip: 'kiris',       ad: 'Kiriş',                grup: 'Oda öğeleri', sinif: 'yapi', w: 2000, h: 400, d: 300, y: 2300 },
  // Duvarın içine gömülü raf boşluğu. d odaya taşan pay (yok denecek kadar), derin duvarın içindeki derinliktir.
  { tip: 'nis',         ad: 'Niş (duvar içi)',      grup: 'Oda öğeleri', sinif: 'yapi', w: 600, h: 400, d: 10, y: 1100, derin: 150 },
  // Köşeye konan dolu blok: dikdörtgen odayı L biçimine çevirir. Dolap bununla kertilmez, çakışamaz.
  { tip: 'girinti',     ad: 'Oda girintisi (L oda)', grup: 'Oda öğeleri', sinif: 'yapi', w: 1500, h: 2700, d: 1200, y: 0 },

  // Dekor: sunum içindir, serbest yerleşir, parça listesine girmez
  { tip: 'tabure',      ad: 'Bar taburesi',         grup: 'Dekor', sinif: 'dekor', w: 380, h: 750, d: 380, y: 0 },
  { tip: 'masa',        ad: 'Yemek masası',         grup: 'Dekor', sinif: 'dekor', w: 1400, h: 750, d: 800, y: 0 },
  { tip: 'sandalye',    ad: 'Sandalye',             grup: 'Dekor', sinif: 'dekor', w: 450, h: 860, d: 480, y: 0 },
  { tip: 'sarkit',      ad: 'Sarkıt lamba',         grup: 'Dekor', sinif: 'dekor', w: 300, h: 700, d: 300, y: 2000 },
  { tip: 'spot',        ad: 'Tavan spotu',          grup: 'Dekor', sinif: 'dekor', w: 100, h: 20, d: 100, y: 2680 },
  { tip: 'plafonyer',   ad: 'Tavan lambası',        grup: 'Dekor', sinif: 'dekor', w: 400, h: 70, d: 400, y: 2630 },
];

export const TANIM = Object.fromEntries(KATALOG.map(k => [k.tip, k]));

let sayac = 0;
export function yeniKimlik() {
  sayac += 1;
  return 'm' + Date.now().toString(36) + sayac.toString(36);
}

// Katalogdaki standart ölçüler projenin etkin standardına çevrilir: katalogda başlangıç standardındaki değeri taşıyan ölçü
// (alt dolap yüksekliği ve derinliği, üst dolap yüksekliği, derinliği ve kotu, boy dolap yüksekliği) etkin değeri alır,
// kendine özgü ölçüler (cihaz, mutfak dışı mobilya) olduğu gibi kalır. Böylece başka ölçüyle çalışan ya da önceki ölçülerle
// kaydedilmiş projeye eklenen dolap o projenin ölçüsünde gelir.
function standartOlcu(k) {
  const V = STANDART_VARSAYILAN, es = (v, std, etkin) => v === std ? etkin : v;
  let { w, h, d, y, kol } = k;
  const kavis = k.tip.includes('kavis');
  if (k.sinif === 'alt') {
    h = es(h, V.baza + V.altGovde, BAZA + ALT_GOVDE);
    d = k.tip === 'panel_yan' ? es(d, V.altDerin + V.kapak + 2, ALT_DERIN + KAPAK_K + 2) : es(d, V.altDerin, ALT_DERIN); // yan panel kapağı da örter
    kol = es(kol, V.altDerin, ALT_DERIN);
    if (kavis) w = es(w, V.altDerin, ALT_DERIN);
  } else if (k.sinif === 'ust') {
    h = es(h, V.ustYuk, UST_YUK);
    d = d === V.ustDerin ? UST_DERIN : es(d, V.altDerin, ALT_DERIN); // buzdolabı üstü dolap alt dolap derinliğindedir
    kol = es(kol, V.ustDerin, UST_DERIN);
    if (kavis) w = es(w, V.ustDerin, UST_DERIN);
    if (y === V.ustKot) y = UST_KOT;                                  // üst dolap standart kota konur
    else if (k.tip === 'ust_tepe') y = UST_HAT;                       // tepe dolabı genel yüksekliğin üstünde başlar
    else if (k.tip === 'ust_mikro') y = UST_HAT - h;                  // üst kenarı genel yükseklikte
    else if (k.tip === 'ust_buzustu') h = Math.max(150, UST_HAT - y); // buzdolabının üstünden genel yüksekliğe
  } else if (k.sinif === 'boy') {
    h = es(h, V.ustHat, UST_HAT); d = es(d, V.altDerin, ALT_DERIN);
  }
  return { w, h, d, y, kol };
}

export function yeniModul(tip) {
  const k = TANIM[tip], o = standartOlcu(k);
  const m = { id: yeniKimlik(), tip, duvar: 'arka', x: 0, z: 0, rot: 0,
    w: o.w, h: o.h, d: o.d, y: o.y, kulp: 'cubuk', mentese: 'sol',
    govdeRenk: null, kapakRenk: null };
  if (k.kapak != null) m.kapak = k.kapak;
  if (k.cekmece != null) m.cekmece = k.cekmece;
  if (k.raf != null) m.raf = k.raf;
  if (k.korYon) m.korYon = k.korYon;
  if (k.kol) m.kol = o.kol;
  if (k.derin) m.derin = k.derin;
  if (OZEL_VARSAYILAN[tip]) m.satirlar = OZEL_VARSAYILAN[tip].map(s => ({ ...s }));
  return m;
}

// Özel modül: bölmeler alttan üste sıralanır. Her bölmenin türü ve (istenirse) yüksekliği vardır;
// yüksekliği boş bırakılan bölmeler kalan yeri eşit paylaşır.
export const OZEL_TURLER = { acik: 'Açık (raf)', kapak1: 'Tek kapak', kapak2: 'Çift kapak', cam: 'Camlı kapak', cekmece: 'Çekmece' };
export const ISARETLER = new Set(['not_yazi', 'olcu_cizgi']);
const OZEL_VARSAYILAN = {
  ozel_alt: [{ tur: 'kapak1' }, { tur: 'cekmece', h: 180 }],
  ozel_ust: [{ tur: 'kapak1' }, { tur: 'acik', h: 250 }],
  ozel_boy: [{ tur: 'kapak1', h: 760 }, { tur: 'acik', h: 400 }, { tur: 'kapak1' }],
};
// Dönen: [{ y, h, tur }]  y: modülün altından bölmenin altına (baza dahil)
export function ozelSatirlar(m) {
  const taban = TANIM[m.tip].sinif !== 'ust' && m.y === 0 ? BAZA : 0;
  const liste = (Array.isArray(m.satirlar) && m.satirlar.length ? m.satirlar : [{ tur: 'kapak1' }]).slice(0, 8);
  const ic = Math.max(100, m.h - taban);
  let sabit = 0, oto = 0;
  for (const s of liste) { if (s.h > 0) sabit += s.h; else oto++; }
  const oran = sabit > ic - oto * 80 ? Math.max(0.05, (ic - oto * 80) / sabit) : 1; // sığmayan ölçüler orantılı küçülür
  const otoH = oto ? (ic - sabit * oran) / oto : 0;
  const out = [];
  let y = taban;
  liste.forEach((s, i) => {
    const hh = i === liste.length - 1 ? m.h - y : (s.h > 0 ? s.h * oran : otoH); // son bölme kalanı alır
    out.push({ y, h: hh, tur: OZEL_TURLER[s.tur] ? s.tur : 'acik' });
    y += hh;
  });
  return out;
}

// Dolap içi donanım: modül tipine göre takılabilecek hazır aksesuarlar. Kapaklar açıkken ya da gizliyken görünür,
// teknik çizimde ve sunum dosyasında adıyla yazar. Donanım takılan dolapta raf çizilmez.
export const DONANIMLAR = {
  sepet: 'Tel sepetler (çekmeli)', cop: 'Çöp kovası (çekmeli)', baharat: 'Baharatlık / şişelik (çekmeli)', deterjan: 'Deterjanlık ve çöp kovası',
  tabaklik: 'Tabaklık (damlalıklı)', sihirli: 'Sihirli köşe', doner: 'Döner sepet', kiler: 'Kiler sepetleri (çekmeli)',
};
const DONANIM_TIP = {
  alt_kapak: ['sepet', 'cop', 'baharat'], alt_evye: ['deterjan', 'cop'], ust_kapak: ['tabaklik'], ust_cam: ['tabaklik'],
  alt_kose: ['sihirli'], alt_lkose: ['doner'], boy_kiler: ['kiler'],
};
// Bir tipe takılabilen donanımlar: { anahtar: ad } ya da hiç yoksa null
export function donanimSecenekleri(tip) {
  const l = DONANIM_TIP[tip];
  return l ? Object.fromEntries(l.map(a => [a, DONANIMLAR[a]])) : null;
}
export const donanimAdi = m => (m.donanim && donanimSecenekleri(m.tip)?.[m.donanim]) || '';

// Katalogdan dolaba takılmış aksesuarlar (modül kimliği → projedeki aksesuar kaydı). 3B çizim, parçaları üretmeden önce projeyi
// bağlar ve iş bitince çözer (aksesuarBagla(null)): bağlıyken iç donanım ürünün gerçek biçimiyle (aksesuarmodel.js) üretilir.
// Bağlı değilken (teknik çizim, montaj şablonu, kesim, maliyet) iç donanım eskisi gibi genel biçimiyle üretilir.
let AKS_BAG = new Map();
export function aksesuarBagla(p) {
  AKS_BAG = new Map();
  for (const x of Array.isArray(p?.aksesuar) ? p.aksesuar : []) if (x && x.modul && x.g) AKS_BAG.set(x.modul, x);
}

// Bir modülün tüm parçalarını üretir.
// Parça: { ad, x, y, z, sx, sy, sz, mat, tur }  veya silindir: { sekil:'sil', x, y, z, r, h, mat, tur }
// mat: govde | kapak | baza | inox | siyah | koyu | cam | kulp     tur: govde | kapak | kulp | cihaz
export function parcalar(m) {
  const donanimli = !!donanimAdi(m);
  if (donanimli && m.raf) m = { ...m, raf: 0 }; // donanım rafların yerini alır
  const P = [];
  const { w, h, d } = m;
  const k = (ad, x, y, z, sx, sy, sz, mat, tur = 'govde') => {
    if (sx > 0 && sy > 0 && sz > 0) P.push({ ad, x, y, z, sx, sy, sz, mat, tur });
  };
  const sil = (ad, x, y, z, r, hh, mat) => P.push({ ad, sekil: 'sil', x, y, z, r, h: hh, mat, tur: 'cihaz' });
  // Kulp: cubuk | boy (boydan boya) | gola (kulpsuz, üstte kanal) | yok
  const kulpTip = m.kulp || 'cubuk';
  const kulpYeni = kulpTip !== 'cubuk' && kulpParcaliMi(kulpTip); // katalogdan ya da yeni genel modellerden seçilmiş kulp
  const kulpVar = kulpTip === 'cubuk' || kulpTip === 'boy' || kulpYeni;
  const gola = kulpTip === 'gola';

  // Gövde (kasa): y0 kotundan başlayan hh yüksekliğinde kutu
  // Arkalık: çakmada gövdenin arkasına çakılır (dış ölçüde). Kanallıda yanların ve tablaların kanalına girer (kanalın dibine kadar);
  // üst tablası olmayan (kayıtlı) gövdede üst kenara kadar çıkar ve arka kayıta arkadan tutturulur.
  const arkalik = (y0, hh, ustTam = true) => {
    if (!ARK_KANAL) { k('Arkalık', 0, y0, 0, w, hh, ARK, 'govde'); return; }
    const et = T - KANAL_DERIN; // kanalın dibinde levhadan kalan et
    k('Arkalık', et, y0 + et, KANAL_ARKA, w - 2 * et, hh - et - (ustTam ? et : 0), ARK, 'govde');
  };
  // Hareketli raf. Yeni kuralda iç genişlikten 2 mm dar (her yanda 1 mm), gövde derinliğinden 20 mm kısa, arkalığa dayalı.
  const rafKoy = y => YENI_KURAL ? k('Raf', T + 1, y, IC, w - 2 * T - 2, T, Math.min(d - 20, d - IC), 'govde') : k('Raf', T, y, IC + 10, w - 2 * T, T, d - IC - 40, 'govde');
  const kasa = (y0, hh, ustTam, raf = 0) => {
    arkalik(y0, hh, ustTam);
    k('Sol yan', 0, y0, GZ, T, hh, d - GZ, 'govde');
    k('Sağ yan', w - T, y0, GZ, T, hh, d - GZ, 'govde');
    k('Alt tabla', T, y0, GZ, w - 2 * T, T, d - GZ, 'govde');
    if (ustTam) k('Üst tabla', T, y0 + hh - T, GZ, w - 2 * T, T, d - GZ, 'govde');
    else {
      k('Ön kayıt', T, y0 + hh - T, d - 100, w - 2 * T, T, 100, 'govde');
      k('Arka kayıt', T, y0 + hh - T, IC, w - 2 * T, T, 100, 'govde');
    }
    for (let i = 1; i <= raf; i++) {
      const y = y0 + T + (hh - 2 * T) * i / (raf + 1);
      rafKoy(y);
    }
    // Dikmeler: tek gövdeyi eşit bölmelere ayırır (yekpare geniş modül)
    for (let i = 1; i <= bolme; i++) k('Dikme', w * i / (bolme + 1) - T / 2, y0 + T, IC, T, hh - 2 * T, d - IC, 'govde');
  };
  const bolme = BOLMELI.has(m.tip) ? Math.max(0, m.bolme || 0) : 0;
  // Her bölmeye ayrı kapak takımı
  const bolmeKapak = (y0, hh, kulpKot, cam = false) => {
    const bw = w / (bolme + 1);
    for (let i = 0; i <= bolme; i++) {
      // Bölmeye özel iç düzen: kapak1 | kapak2 | cekmece | acik; yoksa modülün genel kapak ayarı
      const ic = bolme ? m.bolmeIc?.[i] : null;
      if (ic === 'acik') continue;
      if (ic === 'cekmece' && kulpKot === 'ust') cekmeceler(y0, hh, 3, i * bw, bw); // çekmece yalnızca alt sırada
      else kapaklar(i * bw, y0, bw, hh, ic === 'kapak1' ? 1 : ic === 'kapak2' ? 2 : ic === 'cekmece' ? 1 : m.kapak, kulpKot, cam);
    }
  };
  const baza = () => k('Baza', 0, 0, 40, w, BAZA, d - 90, 'baza');

  // Kapak(lar): x0'dan başlayan ww genişliğinde, y0 kotunda hh yüksekliğinde
  // kulpKot: 'ust' | 'alt' | 'orta'
  // Kapak modeli: modüle özel seçim yoksa projenin modeli
  const model = modulKapakStili(m), KK = kapakStili(model).kalinlik || KAPAK_K; // KK: bu modelin kapak kalınlığı (22 mm'lik modeller var)
  const ustSira = TANIM[m.tip]?.sinif === 'ust', kulpTak = kulpVar && !kulpsuzMu(model); // kendinden kulplu modele kulp takılmaz
  // Ön panel (kapak ya da çekmece önü): parçaları kapak kataloğundan gelir. İlk parça her zaman tam boydadır.
  const onPanel = (ad, x, y, pw, ph, d = m.d) => { // d: panelin durduğu ön yüz (varsayılan gövde derinliği)
    for (const q of kapakParcalari(model, { ad, x, y, pw, ph, d, K: KK, altKulp: ustSira, cam: CAM_AYAR })) P.push(q);
  };
  // Yana (+x) bakan ön panel: L köşe dolabının ikinci kolundaki kapak. pd: panelin z boyunca genişliği.
  // Öne bakan panel gibi kurulur, sonra genişlik ekseni z'ye, kalınlık ekseni x'e çevrilir.
  const yanPanel = (ad, x, y, z, pd, ph) => {
    for (const q of kapakParcalari(model, { ad, x: z, y, pw: pd, ph, d: x, K: KK, altKulp: ustSira, cam: CAM_AYAR })) P.push({ ...q, x: q.z, z: q.x, sx: q.sz, sz: q.sx });
  };
  const kapaklar = (x0, y0, ww, hh, n, kulpKot, cam = false) => {
    const citali = !cam && model === 'cita'; // cam çıtalı: camlı kapak + ortadan artı biçiminde çıta
    if (citali) cam = true;
    const kalkar = !!m.kalkar && KALKAR_OLUR.has(m.tip); // yukarı açılan tek kapak: menteşe üstte, kulp altta yatay
    if (kalkar) n = 1;
    const ara = YENI_KURAL ? 2 * B : B, dw = (ww - 2 * B - ara * (n - 1)) / n; // yeni kuralda her kapak kendi yerinden 2 × boşluk küçüktür
    const g = gola && kulpKot === 'ust' ? 30 : 0; // gola kanalı alt dolap kapağının üstünde
    if (g) k('Gola kanalı', x0 + B, y0 + hh - B - g, d, ww - 2 * B, g, 5, 'koyu', 'kapak');
    for (let i = 0; i < n; i++) {
      const x = x0 + B + i * (dw + ara), y = y0 + B, kh = hh - 2 * B - g;
      const menteseYan = kalkar ? 'ust' : n === 1 ? m.mentese : i === 0 ? 'sol' : 'sag';
      const ilk = P.length; // bu kapağa ait parçalar (kapak, çerçeve, cam, kulp) birlikte açılır
      if (cam && !camliMi(model)) { // camlı dolabın kendi çerçevesi; model camlıysa çerçeve ve cam katalogdan gelir
        const c = 55;
        k('Kapak çerçeve', x, y, d, c, kh, KAPAK_K, 'kapak', 'kapak');
        k('Kapak çerçeve', x + dw - c, y, d, c, kh, KAPAK_K, 'kapak', 'kapak');
        k('Kapak çerçeve', x + c, y, d, dw - 2 * c, c, KAPAK_K, 'kapak', 'kapak');
        k('Kapak çerçeve', x + c, y + kh - c, d, dw - 2 * c, c, KAPAK_K, 'kapak', 'kapak');
        if (citali && dw > 2 * c + 80 && kh > 2 * c + 80) {
          k('Kapak çıtası', x + dw / 2 - 10, y + c, d + 4, 20, kh - 2 * c, KAPAK_K - 6, 'kapak', 'kapak');
          k('Kapak çıtası', x + c, y + kh / 2 - 10, d + 4, dw - 2 * c, 20, KAPAK_K - 6, 'kapak', 'kapak');
        }
        k('Kapak camı', x, y, d + 6, dw, kh, 5, 'cam', 'kapak');
        P[P.length - 1].mentese = menteseYan; // açılış yönü gösterimi için
      } else {
        onPanel('Kapak', x, y, dw, kh);
        P[ilk].mentese = menteseYan; // ilk parça tam boy panel
      }
      if (kulpTak && kalkar) {
        const boy = kulpTip === 'boy' ? dw - 24 : Math.min(200, dw - 120);
        k('Kulp', x + dw / 2 - boy / 2, y + 28, d + KK, boy, 12, 26, 'kulp', 'kulp');
      } else if (kulpTak) {
        // tek kapakta menteşenin karşı tarafına, çift kapakta ortaya
        const sagda = menteseYan === 'sol';
        const kx = sagda ? x + dw - 40 : x + 28;
        const uzun = kulpTip === 'boy';
        const boy = uzun ? kh - 24 : Math.min(160, kh - 60);
        const ky = uzun ? y + 12 : kulpKot === 'ust' ? y + kh - 40 - boy : kulpKot === 'alt' ? y + 40 : y + kh / 2 - boy / 2;
        k('Kulp', kx, ky, d + KK, 12, boy, 26, 'kulp', 'kulp');
      }
      const ac = kalkar ? { x, y: y + kh, z: d, yon: 'ust' } : { x: menteseYan === 'sol' ? x : x + dw, z: d, yon: menteseYan };
      for (let j = ilk; j < P.length; j++) P[j].ac = ac;
    }
  };
  // x0, ww: çekmecelerin kapladığı yatay aralık (varsayılan tüm gövde; bölmeli dolapta tek bölme)
  const cekmeceler = (y0, hh, n, x0 = 0, ww = w) => {
    // Yeni kuralda üç çekmecenin alttaki yüksek (1/2), üsttekiler alçaktır (1/4 + 1/4); her ön kendi yerinden 2 × boşluk küçüktür.
    const oran = YENI_KURAL && n === 3 ? [0.5, 0.25, 0.25] : Array(n).fill(1 / n), esit = (hh - B * (n + 1)) / n;
    let yer = y0;
    for (let i = 0; i < n; i++) {
      const ch = YENI_KURAL ? hh * oran[i] - 2 * B : esit, y = YENI_KURAL ? yer + B : y0 + B + i * (esit + B);
      yer += hh * oran[i];
      const g = gola ? 24 : 0;
      const ilk = P.length;
      onPanel('Çekmece önü', x0 + B, y, ww - 2 * B, ch - g);
      if (g) k('Gola kanalı', x0 + B, y + ch - g, d, ww - 2 * B, g, 5, 'koyu', 'kapak');
      if (YENI_KURAL) { // kutu: yan boşluk ray türüne göre (teleskopik her yanda 13 mm), yükseklik önden 57 mm az, derinlik ray boyuna (50 mm adım) iner
        const bos = d - IC - 40, kd = bos >= 250 ? Math.floor(bos / 50) * 50 : bos, yb = RAY_OLCU[RAY].bosluk / 2;
        k('Çekmece kasası', x0 + T + yb, y + 20, d - 10 - kd, ww - 2 * T - 2 * yb, Math.max(40, ch - 57), kd, 'govde');
      } else k('Çekmece kasası', x0 + T + 12, y + 20, IC + 30, ww - 2 * T - 24, Math.max(40, ch - 60), d - IC - 40, 'govde');
      if (kulpTak) {
        const boy = kulpTip === 'boy' ? ww - 2 * B - 24 : Math.min(200, ww - 120);
        k('Kulp', x0 + ww / 2 - boy / 2, y + ch - 45, d + KK, boy, 12, 26, 'kulp', 'kulp');
      }
      // açık gösterimde çekmece öne çekilir; üstteki daha az, alttaki daha çok
      for (let j = ilk; j < P.length; j++) P[j].cek = 140 + (n - 1 - i) * 90;
    }
  };
  // Ankastre fırın veya mikrodalga önü
  const cihazOnu = (y0, hh, ad) => {
    k(ad, B, y0 + B, d, w - 2 * B, hh - 2 * B, KAPAK_K, 'siyah', 'cihaz');
    k(ad + ' paneli', B + 10, y0 + hh - 70, d + KAPAK_K, w - 2 * B - 20, 50, 3, 'inox', 'cihaz');
    k(ad + ' kulpu', 50, y0 + hh - 110, d + KAPAK_K, w - 100, 14, 30, 'inox', 'cihaz');
  };

  const ustKot = h + TEZGAH_K; // tezgah üstü (alt modüller için)

  switch (m.tip) {
    case 'alt_kapak':
      baza(); kasa(BAZA, h - BAZA, false, m.raf);
      bolmeKapak(BAZA, h - BAZA, 'ust');
      break;
    case 'alt_cekmece':
      baza(); kasa(BAZA, h - BAZA, false, 0);
      cekmeceler(BAZA, h - BAZA, m.cekmece);
      break;
    case 'alt_evye': {
      baza(); kasa(BAZA, h - BAZA, false, 0);
      kapaklar(0, BAZA, w, h - BAZA, m.kapak, 'ust');
      evye();
      break;
    }
    case 'alt_ocak': {
      baza(); kasa(BAZA, h - BAZA, false, 0);
      cekmeceler(BAZA, h - BAZA, m.cekmece);
      ocak();
      break;
    }
    case 'alt_firin': {
      baza(); kasa(BAZA, h - BAZA, false, 0);
      const fh = Math.min(595, h - BAZA - 60);
      const ch = h - BAZA - fh;
      k('Çekmece önü', B, BAZA + B, d, w - 2 * B, ch - B, KAPAK_K, 'kapak', 'kapak');
      cihazOnu(BAZA + ch, fh, 'Fırın');
      ocak();
      break;
    }
    case 'alt_camasir': // tezgah altında duran makine: gövde, camlı kapak, kumanda şeridi
      makine(0, Math.min(h - 10, 850));
      break;
    case 'boy_camasir': { // altta çamaşır, üstte kurutma makinesi; en üstte kapaklı bölme
      baza(); kasa(BAZA, h - BAZA, true, 0);
      const mh = Math.min(850, (h - BAZA - 200) / 2);
      makine(BAZA + T, mh, 30);
      k('Ara raf', T, BAZA + T + mh, IC, w - 2 * T, T, d - IC, 'govde');
      makine(BAZA + 2 * T + mh, mh, 30);
      k('Ara raf', T, BAZA + 2 * T + 2 * mh, IC, w - 2 * T, T, d - IC, 'govde');
      const kalan = h - (BAZA + 3 * T + 2 * mh);
      if (kalan > 80) kapaklar(0, h - kalan, w, kalan, w >= 600 ? 2 : 1, 'alt');
      break;
    }
    case 'alt_sarap': { // camlı kapak, ahşap raflar
      baza();
      k('Şarap dolabı gövdesi', 2, BAZA, 20, w - 4, h - BAZA - 4, d - 20, 'siyah', 'cihaz');
      const n = Math.max(3, Math.round((h - BAZA) / 130));
      for (let i = 1; i < n; i++) k('Şişe rafı', 22, BAZA + (h - BAZA) * i / n, d - 6, w - 44, 10, 4, 'ahsap', 'cihaz');
      k('Cam kapak', B + 14, BAZA + 20, d + 2, w - 2 * B - 28, h - BAZA - 44, 6, 'cam', 'cihaz');
      k('Kapak çerçevesi', B, BAZA + B, d, w - 2 * B, 20, 12, 'siyah', 'cihaz');
      k('Kapak çerçevesi', B, h - 26, d, w - 2 * B, 20, 12, 'siyah', 'cihaz');
      k('Kapak çerçevesi', B, BAZA + B, d, 14, h - BAZA - 8, 12, 'siyah', 'cihaz');
      k('Kapak çerçevesi', w - B - 14, BAZA + B, d, 14, h - BAZA - 8, 12, 'siyah', 'cihaz');
      k('Kulp', w - B - 34, BAZA + (h - BAZA) / 2 - 150, d + 12, 12, 300, 26, 'inox', 'cihaz');
      break;
    }
    case 'alt_solo': { // kendi ayağında duran fırın: üstünde ocak, önünde düğmeler
      const cm = cihazMat('inox');
      k('Fırın gövdesi', 2, 0, 20, w - 4, h - 6, d - 20, cm, 'cihaz');
      k('Fırın camı', 30, 150, d, w - 60, h - 330, 4, 'siyah', 'cihaz');
      k('Fırın kulpu', 50, h - 190, d + 4, w - 100, 14, 30, 'inox', 'cihaz');
      k('Düğme paneli', 2, h - 130, d, w - 4, 120, 6, cm, 'cihaz');
      for (let i = 0; i < 5; i++) k('Düğme', w * (i + 0.5) / 5 - 14, h - 85, d + 6, 28, 28, 18, 'koyu', 'cihaz');
      k('Alt çekmece', 6, 20, d, w - 12, 120, 4, cm, 'cihaz');
      ocak(h - 6, d - 110);
      break;
    }
    case 'alt_bulasik':
      baza(); kasa(BAZA, h - BAZA, false, 0);
      k('Makine önü', B, BAZA + B, d, w - 2 * B, h - BAZA - 2 * B - 60, KAPAK_K, 'kapak', 'kapak');
      k('Kontrol paneli', B, h - 60, d, w - 2 * B, 60 - B, KAPAK_K, 'inox', 'cihaz');
      if (kulpVar) k('Kulp', w / 2 - 100, h - 120, d + KAPAK_K, 200, 12, 26, 'kulp', 'kulp');
      break;
    case 'alt_kose': {
      baza(); kasa(BAZA, h - BAZA, false, m.raf);
      const kw = Math.min(450, w - 300), kor = w - kw; // kör bölüm komşu duvarın dolabının arkasında kalır
      const solKor = m.korYon === 'sol';
      k('Kör panel', solKor ? 0 : kw, BAZA, d, kor, h - BAZA, KAPAK_K, 'govde');
      const eski = m.mentese;
      m.mentese = solKor ? 'sol' : 'sag';
      kapaklar(solKor ? kor : 0, BAZA, kw, h - BAZA, 1, 'ust');
      m.mentese = eski;
      break;
    }
    case 'alt_lkose': case 'ust_lkose': {
      // L gövde: A kolu duvar boyunca (x 0..w, z 0..kd), B kolu komşu duvar boyunca (x 0..kd, z kd..d).
      // Köşe varsayılan olarak solda; korYon 'sag' ise tüm parçalar aynalanır.
      const ust = m.tip === 'ust_lkose';
      const y0 = ust ? 0 : BAZA, hh = h - y0, kd = Math.min(m.kol || 560, w - 150, d - 150);
      if (!ust) {
        k('Baza', 0, 0, 40, w, BAZA, kd - 90, 'baza');
        k('Baza', 40, 0, kd - 50, kd - 90, BAZA, d - kd + 50, 'baza');
      }
      // Arkalık iki parçadır (iki duvara bakar). Önceki projelerde ve çakma standardında gövdenin arkasına çakılır.
      // Köşe gövdesi kuralında (kanallı): yanlar ve tablalar duvara kadar uzanır, arkalıklar onların kanalına girer;
      // A kolundaki arkalık köşeye kadar gider, B kolundaki ona önden dayanır (köşede iki arkalık birbirine tutturulur).
      const kanalli = KOSE_KURAL && ARK_KANAL, g = kanalli ? 0 : ARK; // g: gövde parçalarının duvardan başladığı yer
      if (kanalli) {
        const et = T - KANAL_DERIN; // kanalın dibinde levhadan kalan et
        // boylar tam milimetredir: kanala giren uç tam ölçüde, köşedeki uçta 1 mm'den az pay kalır
        const uzA = Math.floor(w - et - KANAL_ARKA), uzB = Math.floor(d - et - KANAL_ARKA - ARK);
        k('Arkalık', w - et - uzA, y0 + et, KANAL_ARKA, uzA, hh - 2 * et, ARK, 'govde');
        k('Arkalık', KANAL_ARKA, y0 + et, d - et - uzB, ARK, hh - 2 * et, uzB, 'govde');
      } else {
        k('Arkalık', 0, y0, 0, w, hh, ARK, 'govde');
        k('Arkalık', 0, y0, ARK, ARK, hh, d - ARK, 'govde');
      }
      k('Yan', w - T, y0, g, T, hh, kd - g, 'govde');
      k('Yan', g, y0, d - T, kd - g, hh, T, 'govde');
      const tabla = (ad, y) => {
        k(ad, g, y, g, w - T - g, T, kd - g, 'govde');
        k(ad, g, y, kd, kd - g, T, d - kd - T, 'govde');
      };
      tabla('Alt tabla', y0); tabla('Üst tabla', y0 + hh - T);
      // Raf iki parçadır. Köşe gövdesi kuralında düz gövdedeki hareketli raf gibi: yan panelden 1 mm dar, önden 20 mm kısa, arkalığa dayalı
      const lRaf = y => {
        if (!KOSE_KURAL) { tabla('Raf', y); return; }
        const ic = kanalli ? IC : ARK, on = kd - 20;
        k('Raf', ic, y, ic, w - T - 1 - ic, T, on - ic, 'govde');
        k('Raf', ic, y, on, on - ic, T, d - T - 1 - on, 'govde');
      };
      for (let i = 1; i <= (m.raf || 0); i++) lRaf(y0 + T + (hh - 2 * T) * i / (m.raf + 1));
      const ky = y0 + B, kh = hh - 2 * B;
      onPanel('Kapak', kd + KAPAK_K, ky, w - kd - KAPAK_K - B, kh, kd);
      yanPanel('Kapak', kd, ky, kd, d - kd - B, kh);
      if (kulpVar) {
        const boy = Math.min(160, kh - 60), kyy = ust ? ky + 40 : ky + kh - 40 - boy;
        k('Kulp', w - 45, kyy, kd + KAPAK_K, 12, boy, 26, 'kulp', 'kulp');
        k('Kulp', kd + KAPAK_K, kyy, d - 57, 26, boy, 12, 'kulp', 'kulp');
      }
      if (m.korYon === 'sag') aynala(0);
      break;
    }
    case 'boy_gardirop': { // üstte şapkalık rafı, altında askı borusu
      baza(); kasa(BAZA, h - BAZA, true, 0);
      k('Şapkalık rafı', T, h - 380, IC + 10, w - 2 * T, T, d - IC - 40, 'govde');
      k('Askı borusu', T, h - 470, d / 2, w - 2 * T, 25, 25, 'inox', 'cihaz');
      for (let i = 1; i <= (m.raf || 0); i++) rafKoy(BAZA + T + (h - 500 - BAZA) * i / (m.raf + 1));
      bolmeKapak(BAZA, h - BAZA, 'orta');
      break;
    }
    case 'boy_vestiyer': { // altta ayakkabılık, ortada askılı sırt paneli, üstte açık raf
      const altH = 480, ustH = 340;
      baza();
      k('Sırt paneli', 0, BAZA, 0, w, h - BAZA, T, 'govde');
      k('Sol yan', 0, BAZA, T, T, h - BAZA, d - T, 'govde');
      k('Sağ yan', w - T, BAZA, T, T, h - BAZA, d - T, 'govde');
      for (const y of [BAZA, BAZA + altH, h - ustH, h - T]) k('Tabla', T, y, T, w - 2 * T, T, d - T, 'govde');
      kapaklar(0, BAZA, w, altH + T, m.kapak, 'ust');
      const n = Math.max(3, Math.round(w / 220));
      for (let i = 0; i < n; i++) k('Askı', w * (i + 0.5) / n - 12, h - ustH - 220, T, 24, 24, 70, 'inox', 'cihaz');
      break;
    }
    case 'alt_tv': { // alçak ünite: ayaklı, üç bölmeli
      const ay = 80;
      for (const x of [40, w - 90]) for (const z of [40, d - 90]) k('Ayak', x, 0, z, 50, ay, 50, 'koyu', 'cihaz');
      arkalik(ay, h - ay - (ARK_KANAL ? T : 0), false);
      k('Sol yan', 0, ay, GZ, T, h - ay, d - GZ, 'govde');
      k('Sağ yan', w - T, ay, GZ, T, h - ay, d - GZ, 'govde');
      k('Alt tabla', T, ay, GZ, w - 2 * T, T, d - GZ, 'govde');
      k('Üst tabla', 0, h - T, 0, w, T, d + KAPAK_K, 'kapak');
      for (const i of [1, 2]) k('Dikme', w * i / 3 - T / 2, ay + T, IC, T, h - ay - 2 * T, d - IC, 'govde');
      for (let i = 0; i < 3; i++) kapaklar(i * w / 3, ay, w / 3, h - ay - T, i === 1 ? 2 : 1, 'ust');
      break;
    }
    case 'alt_banyo': { // duvara asılı; üstünde lavabo ve batarya
      kasa(0, h, true, 0);
      cekmeceler(0, h, m.cekmece);
      k('Lavabo tablası', -10, h, 0, w + 20, 30, d + 30, 'seramik', 'cihaz');
      k('Lavabo çanağı', w * 0.2, h + 30, 110, w * 0.6, 2, d - 170, 'inox', 'cihaz');
      sil('Batarya', w / 2, h + 30, 60, 15, 190, 'inox');
      k('Batarya ağzı', w / 2 - 8, h + 200, 60, 16, 14, 130, 'inox', 'cihaz');
      break;
    }
    case 'ust_ayna': {
      kasa(0, h, true, m.raf);
      const dw = w / m.kapak;
      for (let i = 0; i < m.kapak; i++) {
        const ilk = P.length, yan = m.kapak === 1 ? m.mentese : i === 0 ? 'sol' : 'sag';
        k('Aynalı kapak', i * dw + B, B, d, dw - 2 * B, h - 2 * B, KAPAK_K, 'ayna', 'kapak');
        P[P.length - 1].mentese = yan;
        const ac = { x: yan === 'sol' ? i * dw + B : (i + 1) * dw - B, z: d, yon: yan };
        for (let j = ilk; j < P.length; j++) P[j].ac = ac;
      }
      break;
    }
    case 'ozel_alt': case 'ozel_ust': case 'ozel_boy': {
      const satirlar = ozelSatirlar(m), y0 = satirlar[0].y;
      if (y0 > 0) baza();
      kasa(y0, h - y0, m.tip !== 'ozel_alt', 0);
      satirlar.forEach((r, i) => {
        if (i) k('Ara tabla', T, r.y - T / 2, IC, w - 2 * T, T, d - IC, 'govde');
        const kot = m.y + r.y + r.h / 2 < 1100 ? 'ust' : 'alt'; // kulp: alçak bölmede üstte, yüksek bölmede altta
        if (r.tur === 'cekmece') cekmeceler(r.y, r.h, 1);
        else if (r.tur === 'kapak1' || r.tur === 'kapak2') kapaklar(0, r.y, w, r.h, r.tur === 'kapak2' ? 2 : 1, kot);
        else if (r.tur === 'cam') kapaklar(0, r.y, w, r.h, w >= 600 ? 2 : 1, kot, true);
      });
      break;
    }
    case 'not_yazi':
      k('Not etiketi', 0, 0, 0, w, h, d, 'sari', 'tesisat');
      break;
    case 'olcu_cizgi':
      if (w >= h) { // yatay ölçü: çizgi ve iki uçta işaret
        k('Ölçü çizgisi', 0, h / 2 - 3, 0, w, 6, d, 'mavi', 'tesisat');
        k('Ölçü ucu', 0, 0, 0, 6, h, d, 'mavi', 'tesisat'); k('Ölçü ucu', w - 6, 0, 0, 6, h, d, 'mavi', 'tesisat');
      } else {
        k('Ölçü çizgisi', w / 2 - 3, 0, 0, 6, h, d, 'mavi', 'tesisat');
        k('Ölçü ucu', 0, 0, 0, w, 6, d, 'mavi', 'tesisat'); k('Ölçü ucu', 0, h - 6, 0, w, 6, d, 'mavi', 'tesisat');
      }
      break;
    case 'priz':
      k('Priz kapağı', 0, 0, 0, w, h, d, 'dograma', 'tesisat');
      k('Priz yuvası', w * 0.2, h * 0.2, d, w * 0.6, h * 0.6, 2, 'koyu', 'tesisat');
      break;
    case 'anahtar':
      k('Anahtar kapağı', 0, 0, 0, w, h, d, 'dograma', 'tesisat');
      k('Anahtar tuşu', w * 0.3, h * 0.15, d, w * 0.4, h * 0.7, 4, 'inox', 'tesisat');
      break;
    case 'su_giris':
      k('Soğuk su', 0, 0, 0, w * 0.35, h, d, 'mavi', 'tesisat');
      k('Sıcak su', w * 0.65, 0, 0, w * 0.35, h, d, 'kirmizi', 'tesisat');
      break;
    case 'gider':
      k('Gider', 0, 0, 0, w, h, d, 'koyu', 'tesisat');
      k('Gider ağzı', w * 0.2, h * 0.2, d, w * 0.6, h * 0.6, 3, 'siyah', 'tesisat');
      break;
    case 'dogalgaz':
      k('Gaz borusu', w * 0.3, 0, 0, w * 0.4, h, d * 0.6, 'sari', 'tesisat');
      k('Gaz vanası', 0, h * 0.35, d * 0.5, w, h * 0.3, d * 0.5, 'sari', 'tesisat');
      break;
    case 'spot':
      sil('Spot gövdesi', w / 2, 6, d / 2, w / 2, h - 6, 'inox');
      sil('Spot ışığı', w / 2, 0, d / 2, w * 0.36, 6, 'isik');
      break;
    case 'plafonyer':
      sil('Lamba tabanı', w / 2, h - 16, d / 2, w * 0.3, 16, 'inox');
      sil('Lamba camı', w / 2, 0, d / 2, w / 2, h - 16, 'isik');
      break;
    case 'tv':
      k('Ekran çerçevesi', 0, 0, 0, w, h, d, 'siyah', 'dekor');
      k('Ekran', 18, 18, d, w - 36, h - 36, 2, 'koyu', 'dekor');
      break;
    case 'panel_yan':
      k('Yan bitiş paneli', 0, 0, 0, w, h, d, 'kapak', 'kapak');
      break;
    case 'dolgu': // yalnızca ön yüzde şerit; arkası boş (duvar payı)
      k('Dolgu baza', 0, 0, d - 50, w, BAZA, T, 'baza');
      k('Duvar dolgusu', 0, m.y === 0 ? BAZA : 0, d, w, m.y === 0 ? h - BAZA : h, KAPAK_K, 'kapak', 'kapak');
      break;
    case 'alt_sise': // dar açık şişelik: kapaksız, sık raflı
      baza(); kasa(BAZA, h - BAZA, false, m.raf);
      break;
    case 'ust_mikro': { // altta mikrodalga nişi, üstte kapaklı bölme
      kasa(0, h, true, 0);
      const nis = Math.min(400, h - 200);
      k('Ara raf', T, nis, IC, w - 2 * T, T, d - IC, 'govde');
      k('Mikrodalga', T + 20, T + 4, 40, w - 2 * T - 40, nis - T - 30, d - 50, 'siyah', 'cihaz');
      k('Mikrodalga camı', T + 40, T + 30, d - 9, (w - 2 * T) * 0.62, nis - T - 80, 3, 'koyu', 'cihaz');
      k('Mikrodalga kulpu', w - T - 70, T + 40, d - 9, 14, nis - T - 100, 26, 'inox', 'cihaz');
      kapaklar(0, nis + T, w, h - nis - T, m.kapak, 'alt');
      break;
    }
    case 'boy_ankastre': { // ankastre buzdolabı dolabı: iki boydan kapak
      baza(); kasa(BAZA, h - BAZA, true, 0);
      const altH = Math.round((h - BAZA) * 0.36);
      k('Ara raf', T, BAZA + altH - T, IC, w - 2 * T, T, d - IC, 'govde');
      kapaklar(0, BAZA, w, altH, 1, 'ust');
      kapaklar(0, BAZA + altH, w, h - BAZA - altH, 1, 'orta');
      break;
    }
    case 'alt_kavis': case 'ust_kavis': case 'ust_kavis_acik': {
      // Bitiş dolabı: dış ön köşe çeyrek daire. a: düz bölüm, b: kavisin duvara uzaklığı. Kavis varsayılan sağda.
      const R = Math.min(w, d), a = w - R, b = d - R;
      const cey = (ad, y, hh, rx, rz, mat, tur = 'govde') =>
        P.push({ ad, sekil: 'ceyrek', x: a, y, z: b, rx, rz, h: hh, mat, tur });
      const dilim = (ad, y, hh, mat, tur, tas = 0) => {
        k(ad, 0, y, 0, a, hh, d + tas, mat, tur);
        k(ad, a, y, 0, R, hh, b, mat, tur);
        cey(ad, y, hh, R, R + tas, mat, tur);
      };
      // Alt: bazalı, kapaklı, tezgahlı. Üst: bazasız. Açık: kapaksız kavisli raf.
      const altMi = m.tip === 'alt_kavis', acik = m.tip === 'ust_kavis_acik', Y0 = altMi ? BAZA : 0;
      if (altMi) {
        k('Baza', 0, 0, 40, a, BAZA, d - 90, 'baza');
        k('Baza', a, 0, 40, R - 50, BAZA, b - 40, 'baza');
        cey('Baza', 0, BAZA, R - 50, R - 50, 'baza');
      }
      // Köşe gövdesi kuralında (kanallı): yan panel duvara kadar uzanır, arkalık yanın ve tablaların kanalına girer.
      // Kavis tarafında yan panel yoksa (kavis duvara kadar iniyorsa) arkalığın o ucu serbesttir, alt ve üst tablanın kanalı taşır.
      const kanalli = KOSE_KURAL && ARK_KANAL, g = kanalli ? 0 : ARK;
      if (kanalli) {
        const et = T - KANAL_DERIN, sagYan = b >= KANAL_ARKA + ARK + 10; // kavis tarafında kanal açılacak kadar derin yan panel var mı
        k('Arkalık', et, Y0 + et, KANAL_ARKA, (sagYan ? w - et : w - 1) - et, h - Y0 - 2 * et, ARK, 'govde');
      } else k('Arkalık', 0, Y0, 0, w, h - Y0, ARK, 'govde');
      k('Yan', 0, Y0, g, T, h - Y0, d - g, 'govde');
      k('Yan', w - T, Y0, g, T, h - Y0, b - g, 'govde');
      dilim('Alt tabla', Y0, T, 'govde', 'govde');
      dilim('Üst tabla', h - T, T, 'govde', 'govde');
      // Raf: köşe gövdesi kuralında yan panelden 1 mm içeride başlar, arkalığa dayanır, ön kenarı (kavis dahil) 20 mm içeridedir
      const kavisRaf = y => {
        if (!KOSE_KURAL) { dilim('Raf', y, T, 'govde', 'govde'); return; }
        const ic = kanalli ? IC : ARK, x0 = T + 1, cx = Math.max(a, x0), cz = Math.max(b, ic), ucX = a + R - 20, ucZ = b + R - 20;
        k('Raf', x0, y, ic, a - x0, T, d - 20 - ic, 'govde');
        k('Raf', cx, y, ic, ucX - cx, T, cz - ic, 'govde');
        if (ucX - cx > 0 && ucZ - cz > 0) P.push({ ad: 'Raf', sekil: 'ceyrek', x: cx, y, z: cz, rx: ucX - cx, rz: ucZ - cz, h: T, mat: 'govde', tur: 'govde' });
      };
      for (let i = 1; i <= (m.raf || 0); i++) kavisRaf(Y0 + T + (h - Y0 - 2 * T) * i / (m.raf + 1));
      const ky = Y0 + B, kh = h - Y0 - 2 * B;
      if (!acik) {
        if (a >= 150) {
          onPanel('Kapak', B, ky, a - 2 * B, kh);
          if (kulpVar) { const boy = Math.min(160, kh - 60); k('Kulp', 28, altMi ? ky + kh - 40 - boy : ky + 40, d + KAPAK_K, 12, boy, 26, 'kulp', 'kulp'); }
        } else k('Dolgu', 0, ky, d, a, kh, KAPAK_K, 'kapak', 'kapak');
        cey('Kavisli kapak', ky, kh, R + 2, R + KAPAK_K, 'kapak', 'kapak');
        // Kapak modeli kavisli yüzeyde: çerçeveli modellerde alt ve üst kuşak ile iki uçta dikme, kanallıda dikey kanallar
        const c = model === 'cerceve' ? 70 : model === 'ince' ? 28 : 0;
        if (c && kh > 2 * c + 40 && R > 2 * c + 40) {
          cey('Kapak çerçevesi', ky, c, R + 8, R + KAPAK_K + 6, 'kapak', 'kapak');
          cey('Kapak çerçevesi', ky + kh - c, c, R + 8, R + KAPAK_K + 6, 'kapak', 'kapak');
          k('Kapak çerçevesi', a + R + 2, ky + c, b, 6, kh - 2 * c, c, 'kapak', 'kapak');
          k('Kapak çerçevesi', a, ky + c, b + R + KAPAK_K, c, kh - 2 * c, 6, 'kapak', 'kapak');
        } else if (model === 'kanal') {
          const n = Math.max(3, Math.round(R * Math.PI / 2 / 70));
          for (let i = 1; i < n; i++) {
            const t = Math.PI / 2 * i / n;
            k('Kanal', a + (R + 2) * Math.cos(t) - 1.5, ky + 4, b + (R + KAPAK_K) * Math.sin(t) - 1.5, 3, kh - 8, 3, 'koyu', 'kapak');
          }
        }
      }
      if (altMi) dilim('Tezgah', h, TEZGAH_K, 'tezgah', 'tezgah', TEZGAH_TASMA);
      if (m.korYon === 'sol') aynala(0);
      break;
    }
    case 'ust_kapak': case 'ust_tepe': case 'ust_buzustu':
      kasa(0, h, true, m.raf);
      bolmeKapak(0, h, 'alt');
      break;
    case 'ust_cam':
      kasa(0, h, true, m.raf);
      bolmeKapak(0, h, 'alt', true);
      break;
    case 'ust_acik':
      kasa(0, h, true, m.raf);
      break;
    case 'davlumbaz': {
      const bw = Math.min(300, w - 100), tur = m.davTip || 'baca';
      if (tur === 'gomme') { // aspiratör dolabın içinde: dışarıdan üst dolap gibi görünür
        const gd = Math.min(d, 320);
        arkalik(40, h - 40, true);
        k('Sol yan', 0, 40, GZ, T, h - 40, gd - GZ, 'govde');
        k('Sağ yan', w - T, 40, GZ, T, h - 40, gd - GZ, 'govde');
        k('Alt tabla', T, 40, GZ, w - 2 * T, T, gd - GZ, 'govde');
        k('Üst tabla', T, h - T, GZ, w - 2 * T, T, gd - GZ, 'govde');
        const n = w >= 700 ? 2 : 1, ara = YENI_KURAL ? 2 * B : B, dw = (w - 2 * B - ara * (n - 1)) / n; // yeni kuralda iki kapak arası 2 × boşluk
        for (let i = 0; i < n; i++) {
          k('Kapak', B + i * (dw + ara), 40 + B, gd, dw, h - 40 - 2 * B, KAPAK_K, 'kapak', 'kapak');
          if (kulpVar) k('Kulp', n === 1 ? B + dw - 40 : i === 0 ? B + dw - 40 : B + ara + dw + 28, 40 + B + 40, gd + KAPAK_K, 12, 160, 26, 'kulp', 'kulp');
        }
        k('Aspiratör', 20, 0, 30, w - 40, 40, gd - 10, 'inox', 'cihaz');
        k('Filtre', 50, -4, 60, w - 100, 4, gd - 80, 'koyu', 'cihaz');
      } else if (tur === 'kutu') { // kutu gövde: kalın paslanmaz blok + baca
        k('Davlumbaz gövdesi', 0, 0, 0, w, 260, d, 'inox', 'cihaz');
        k('Filtre', 40, -4, 60, w - 80, 4, d - 120, 'koyu', 'cihaz');
        k('Baca', (w - bw) / 2, 260, 0, bw, h - 260, 260, 'inox', 'cihaz');
      } else if (tur === 'cam') { // dikey siyah camlı duvar tipi
        k('Davlumbaz gövdesi', 0, 80, 0, w, 420, 110, 'siyah', 'cihaz');
        k('Davlumbaz camı', 30, 110, 110, w - 60, 360, 5, 'koyu', 'cihaz');
        k('Emiş ağzı', 20, 40, 0, w - 40, 40, 200, 'inox', 'cihaz');
        k('Baca', (w - bw) / 2, 500, 0, bw, h - 500, 220, 'inox', 'cihaz');
      } else {
        k('Davlumbaz gövdesi', 0, 0, 0, w, 60, d, 'inox', 'cihaz');
        k('Filtre', 40, -4, 60, w - 80, 4, d - 120, 'koyu', 'cihaz');
        k('Baca', (w - bw) / 2, 60, 0, bw, h - 60, 260, 'inox', 'cihaz');
      }
      break;
    }
    case 'davlumbaz_ada': { // tavandan sarkar: gövde altta ortalı, baca tavana kadar
      k('Davlumbaz gövdesi', 0, 0, 0, w, 70, d, 'inox', 'cihaz');
      k('Filtre', 50, -4, 50, w - 100, 4, d - 100, 'koyu', 'cihaz');
      const bw = Math.min(320, w - 120, d - 120);
      k('Baca', (w - bw) / 2, 70, (d - bw) / 2, bw, h - 70, bw, 'inox', 'cihaz');
      break;
    }
    case 'boy_kiler': {
      baza(); kasa(BAZA, h - BAZA, true, m.raf);
      const altH = Math.round((h - BAZA) * 0.6);
      bolmeKapak(BAZA, altH, 'ust');
      bolmeKapak(BAZA + altH, h - BAZA - altH, 'alt');
      break;
    }
    case 'boy_firin': {
      baza(); kasa(BAZA, h - BAZA, true, 0);
      // kule: ikili (fırın + mikrodalga) | firin (yalnız fırın) | cift (iki fırın)
      const altH = m.kule === 'cift' ? 420 : 620, fh = 595, mh = m.kule === 'firin' ? 0 : m.kule === 'cift' ? 595 : 390;
      k('Çekmece önü', B, BAZA + B, d, w - 2 * B, altH - 2 * B, KAPAK_K, 'kapak', 'kapak');
      if (kulpVar) k('Kulp', w / 2 - 100, BAZA + altH - 50, d + KAPAK_K, 200, 12, 26, 'kulp', 'kulp');
      k('Ara raf', T, BAZA + altH - T, IC, w - 2 * T, T, d - IC, 'govde');
      cihazOnu(BAZA + altH, fh, 'Fırın');
      if (mh) cihazOnu(BAZA + altH + fh, mh, m.kule === 'cift' ? 'Üst fırın' : 'Mikrodalga');
      k('Ara raf', T, BAZA + altH + fh + mh, IC, w - 2 * T, T, d - IC, 'govde');
      const kalan = h - BAZA - altH - fh - mh;
      if (kalan > 80) kapaklar(0, h - kalan, w, kalan, 1, 'alt');
      break;
    }
    case 'buzdolabi': {
      // buzTip: alt (dondurucu altta) | ust (dondurucu üstte) | tek (tek kapı) | cift (gardırop tipi) | fransiz (üstte çift kapı, altta çekmece)
      const cm = cihazMat('inox'), km = cm === 'siyah' ? 'inox' : 'koyu', tur = m.buzTip || 'alt';
      k('Buzdolabı gövdesi', 5, 0, 20, w - 10, h, d - 20, 'koyu', 'cihaz');
      const kapi = (ad, x, y, ww, hh) => k(ad, x, y, d, ww, hh, 40, cm, 'cihaz');
      const kulp = (x, y, boy) => k('Kulp', x, y, d + 40, 14, boy, 30, km, 'cihaz');
      const yari = (w - 14) / 2;
      if (tur === 'tek') { kapi('Buzdolabı kapağı', 5, 20, w - 10, h - 24); kulp(45, h * 0.35, Math.min(600, h * 0.35)); }
      else if (tur === 'cift') {
        kapi('Dondurucu kapağı', 5, 20, yari, h - 24); kapi('Soğutucu kapağı', 9 + yari, 20, yari, h - 24);
        kulp(yari - 25, h * 0.3, Math.min(700, h * 0.4)); kulp(yari + 25, h * 0.3, Math.min(700, h * 0.4));
        k('Su sebili', 5 + yari * 0.25, h * 0.58, d + 40, yari * 0.5, 230, 3, 'koyu', 'cihaz');
      } else if (tur === 'fransiz') {
        const dh = Math.round(h * 0.34);
        k('Dondurucu çekmecesi', 5, 20, d, w - 10, dh - 24, 40, cm, 'cihaz');
        k('Kulp', 60, dh - 70, d + 40, w - 120, 14, 30, km, 'cihaz');
        kapi('Soğutucu kapağı', 5, dh, yari, h - dh - 4); kapi('Soğutucu kapağı', 9 + yari, dh, yari, h - dh - 4);
        kulp(yari - 25, dh + 60, Math.min(600, h - dh - 200)); kulp(yari + 25, dh + 60, Math.min(600, h - dh - 200));
      } else {
        const ustte = tur === 'ust', dh = Math.round(h * (ustte ? 0.7 : 0.36)); // dh: iki kapağın birleştiği kot
        kapi(ustte ? 'Soğutucu kapağı' : 'Dondurucu kapağı', 5, 20, w - 10, dh - 24);
        kapi(ustte ? 'Dondurucu kapağı' : 'Soğutucu kapağı', 5, dh, w - 10, h - dh - 4);
        kulp(45, dh - Math.min(320, dh * 0.5), Math.min(280, dh * 0.4)); kulp(45, dh + 40, Math.min(420, (h - dh) * 0.6));
      }
      break;
    }
    case 'pencere': {
      const c = 60;
      // Duvarda gerçek boşluk açılır (sahne.js); burada yalnızca doğrama ve cam var
      k('Kasa', 0, 0, 3, c, h, d - 3, 'dograma', 'yapi');
      k('Kasa', w - c, 0, 3, c, h, d - 3, 'dograma', 'yapi');
      k('Kasa', c, 0, 3, w - 2 * c, c, d - 3, 'dograma', 'yapi');
      k('Kasa', c, h - c, 3, w - 2 * c, c, d - 3, 'dograma', 'yapi');
      // pencereTip: cift (ortada bir kayıt) | tek (sabit, kayıtsız) | uc (iki kayıt, üç bölme)
      // pencereTip: cift | tek | uc | surme (iki kanat, biri diğerinin önünde kayar)
      const bolmeSayisi = m.pencereTip === 'tek' ? 1 : m.pencereTip === 'uc' ? 3 : m.pencereTip === 'surme' ? 2 : (w > 900 ? 2 : 1);
      if (m.pencereTip === 'surme') { // öndeki kanadın çerçevesi: sağ yarıyı kaplar, biraz önde durur
        k('Sürme kanat', w / 2 - 20, c, d, 45, h - 2 * c, 14, 'dograma', 'yapi'); k('Sürme kanat', w - c - 45, c, d, 45, h - 2 * c, 14, 'dograma', 'yapi');
        k('Sürme kanat', w / 2 + 25, c, d, w / 2 - c - 70, 45, 14, 'dograma', 'yapi'); k('Sürme kanat', w / 2 + 25, h - c - 45, d, w / 2 - c - 70, 45, 14, 'dograma', 'yapi');
        k('Sürme kolu', w / 2 - 12, h / 2 - 60, d + 14, 14, 120, 22, 'kulp', 'kulp');
      }
      for (let i = 1; i < bolmeSayisi; i++) k('Orta kayıt', w * i / bolmeSayisi - c / 2, c, 3, c, h - 2 * c, d - 3, 'dograma', 'yapi');
      k('Cam', c, c, d / 2, w - 2 * c, h - 2 * c, 5, 'cam', 'yapi');
      if (m.denizlik) k('Denizlik', -40, -32, 0, w + 80, 32, 190, 'seramik', 'yapi'); // pencerenin altında, odaya taşan mermer tabla
      // perde: stor (üstten inen düz kumaş) | jaluzi (yatay şeritler) | tul (kornişten yere inen tül)
      if (m.perde === 'stor') {
        k('Stor kasası', 0, h - 75, d, w, 75, 70, 'dograma', 'yapi');
        k('Stor', 15, Math.round(h * 0.52), d + 22, w - 30, h - 75 - Math.round(h * 0.52), 4, 'kumas', 'yapi');
        k('Stor çıtası', 15, Math.round(h * 0.52) - 22, d + 16, w - 30, 22, 16, 'dograma', 'yapi');
      } else if (m.perde === 'jaluzi') {
        k('Jaluzi kasası', 10, h - 50, d, w - 20, 50, 50, 'dograma', 'yapi');
        const n = Math.min(40, Math.floor((h - 90) / 42));
        for (let i = 0; i < n; i++) k('Jaluzi şeridi', 25, 40 + i * (h - 90) / n, d + 12, w - 50, 3, 26, 'dograma', 'yapi');
      } else if (m.perde === 'tul') {
        k('Korniş', -120, h + 70, d + 50, w + 240, 28, 36, 'inox', 'yapi');
        k('Tül', -100, 40 - m.y, d + 62, w + 200, m.y + h + 30, 10, 'tul', 'yapi');
      }
      break;
    }
    case 'kapi': {
      const c = 70;
      k('Kasa', 0, 0, 0, c, h, d, 'dograma', 'yapi');
      k('Kasa', w - c, 0, 0, c, h, d, 'dograma', 'yapi');
      k('Kasa', c, h - c, 0, w - 2 * c, c, d, 'dograma', 'yapi');
      // Kanat kapalı çizilir. "Kapakları aç" seçilince içe açılan kanatlar menteşesinden odaya doğru döner;
      // açılma alanı ayrıca uyarılarda ve çakışma gidermede boş tutulur.
      // kapiTip: ic (içe açılan, varsayılan) | cift (çift kanat, içe) | dis (dışa açılan) | surgu (sürgülü)
      const kanat = w - 2 * c, solM = m.mentese !== 'sag', kal = 36, kz = d - kal;
      // x0'dan başlayan gen genişliğinde kanat; mSol: menteşesi solda mı; acilir: içe döner mi
      const kanatEkle = (x0, gen, mSol, acilir) => {
        const ilk = P.length, kh = h - c, model = m.kapiTip === 'balkon' ? 'balkon' : m.kapiModel || 'duz';
        if (model === 'balkon' || model === 'camli') {
          // çerçeveli kanat: balkon kapısında doğrama rengi ve boydan cam; camlı iç kapıda altı dolu, üstü cam
          const cer = model === 'balkon' ? 85 : 110, mat = model === 'balkon' ? 'dograma' : 'ahsap', altDolu = model === 'balkon' ? 0 : Math.round(kh * 0.38);
          k('Kapı kanadı', x0, 0, kz, cer, kh, kal, mat, 'yapi'); k('Kapı kanadı', x0 + gen - cer, 0, kz, cer, kh, kal, mat, 'yapi');
          k('Kapı kanadı', x0 + cer, 0, kz, gen - 2 * cer, Math.max(cer, altDolu), kal, mat, 'yapi'); k('Kapı kanadı', x0 + cer, kh - cer, kz, gen - 2 * cer, cer, kal, mat, 'yapi');
          k('Kapı camı', x0 + cer, Math.max(cer, altDolu), kz + kal / 2 - 3, gen - 2 * cer, kh - cer - Math.max(cer, altDolu), 6, 'cam', 'yapi');
        } else {
          k('Kapı kanadı', x0, 0, kz, gen, kh, kal, 'ahsap', 'yapi');
          if (model === 'panelli' && gen > 360) { // iki kabartma tabla: altta kısa, üstte uzun
            const pay = 110, pg = gen - 2 * pay, altH = Math.round(kh * 0.3);
            k('Kapı tablası', x0 + pay, pay, d, pg, altH, 7, 'ahsap', 'yapi');
            k('Kapı tablası', x0 + pay, pay + altH + 110, d, pg, kh - 2 * pay - altH - 110, 7, 'ahsap', 'yapi');
          }
        }
        k('Kapı kolu', mSol ? x0 + gen - 130 : x0 + 40, 1000, d, 90, 18, 45, 'kulp', 'kulp');
        if (acilir) { const ac = { x: mSol ? x0 : x0 + gen, z: d, yon: mSol ? 'sol' : 'sag' }; for (let j = ilk; j < P.length; j++) P[j].ac = ac; }
      };
      if (m.kapiTip === 'cift') { kanatEkle(c, kanat / 2 - 1, true, true); kanatEkle(c + kanat / 2 + 1, kanat / 2 - 1, false, true); }
      else if (m.kapiTip === 'dis') { k('Eşik', c, 0, 0, kanat, 12, d, 'dograma', 'yapi'); kanatEkle(c, kanat, solM, false); } // dışa açılır: içeriden kapalı görünür
      else if (m.kapiTip === 'surgu') { // kanat açıklığı kapatır; ray kayacağı yana doğru uzanır
        k('Sürgü rayı', solM ? -kanat : c, h - c + 10, d, kanat * 2 + c, 40, 30, 'inox', 'yapi');
        k('Kapı kanadı', c - 20, 0, d + 4, kanat + 40, h - c, 36, 'ahsap', 'yapi');
        k('Kapı kolu', solM ? w - c - 60 : c + 20, 950, d + 40, 20, 220, 30, 'kulp', 'kulp');
      } else kanatEkle(c, kanat, solM, true);
      break;
    }
    case 'nis': { // duvar yüzeyinin (z = 0) arkasında kalan kutu: arka, iki yan, alt ve üst
      const g = Math.max(50, m.derin || 150), e = 12;
      k('Niş arkası', 0, 0, -g, w, h, e, 'duvar', 'yapi');
      k('Niş yanı', 0, 0, -g + e, e, h, g - e, 'duvar', 'yapi');
      k('Niş yanı', w - e, 0, -g + e, e, h, g - e, 'duvar', 'yapi');
      k('Niş tabanı', e, 0, -g + e, w - 2 * e, e, g - e, 'ahsap', 'yapi');
      k('Niş üstü', e, h - e, -g + e, w - 2 * e, e, g - e, 'duvar', 'yapi');
      break;
    }
    case 'kolon': case 'kiris': case 'girinti':
      k(TANIM[m.tip].ad, 0, 0, 0, w, h, d, 'duvar', 'yapi');
      break;
    case 'tabure': {
      const r = Math.min(w, d) / 2;
      sil('Taban', w / 2, 0, d / 2, r * 0.9, 16, 'koyu');
      sil('Ayak', w / 2, 16, d / 2, 22, h - 76, 'inox');
      sil('Ayaklık', w / 2, h * 0.36, d / 2, r * 0.7, 12, 'inox');
      sil('Oturak', w / 2, h - 60, d / 2, r, 60, 'siyah');
      break;
    }
    case 'masa': {
      const a = 60;
      k('Tabla', 0, h - 36, 0, w, 36, d, 'ahsap', 'dekor');
      for (const [x, z] of [[40, 40], [w - 40 - a, 40], [40, d - 40 - a], [w - 40 - a, d - 40 - a]]) k('Ayak', x, 0, z, a, h - 36, a, 'koyu', 'dekor');
      break;
    }
    case 'sandalye': {
      const oy = Math.min(460, h - 300), a = 36; // sırtlık arkada (z=0), oturak öne bakar
      k('Oturak', 0, oy, 30, w, 50, d - 30, 'koyu', 'dekor');
      k('Sırtlık', 20, oy + 180, 0, w - 40, h - oy - 180, 32, 'koyu', 'dekor');
      k('Sırt ayağı', 20, 0, 0, a, oy + 180, a, 'ahsap', 'dekor');
      k('Sırt ayağı', w - 20 - a, 0, 0, a, oy + 180, a, 'ahsap', 'dekor');
      k('Ön ayak', 20, 0, d - a - 10, a, oy, a, 'ahsap', 'dekor');
      k('Ön ayak', w - 20 - a, 0, d - a - 10, a, oy, a, 'ahsap', 'dekor');
      break;
    }
    case 'sarkit': {
      const r = Math.min(w, d) / 2, ah = Math.min(180, h * 0.4);
      sil('Kablo', w / 2, ah, d / 2, 5, h - ah, 'koyu');
      sil('Abajur', w / 2, 0, d / 2, r, ah, 'koyu');
      sil('Ampul', w / 2, -14, d / 2, r * 0.45, 14, 'isik');
      break;
    }
  }
  if (donanimli) { const bas = P.length, urun = AKS_BAG.get(m.id), ozel = urun ? urunDonanimi(urun) : null; if (ozel) urunHareketi(ozel, bas); else { donanim(); donanimHareketi(bas); } }
  // Katalogdan seçilmiş kulp: önce standart çubuk yerine konur, sonra o çubuğun durduğu yere göre seçilen modelin parçalarıyla
  // değiştirilir. Kulpun kapağı, aynı açılış (ya da çekilme) bilgisini taşıyan ön panel parçalarından bulunur.
  if (kulpYeni) for (let i = 0; i < P.length; i++) {
    const q = P[i];
    if (q.tur !== 'kulp' || q.mat !== 'kulp' || q.sekil || q.kulpKod || q.kulpEk || q.sz !== 26) continue; // yana bakan kapağın kulpu olduğu gibi kalır
    const es = P.filter(r => r !== q && r.tur === 'kapak' && (q.ac ? r.ac === q.ac : q.cek != null && r.cek === q.cek));
    const X0 = es.length ? Math.min(...es.map(r => r.x)) : q.x - 200, X1 = es.length ? Math.max(...es.map(r => r.x + r.sx)) : q.x + q.sx + 200;
    const Y0 = es.length ? Math.min(...es.map(r => r.y)) : q.y - 200, Y1 = es.length ? Math.max(...es.map(r => r.y + r.sy)) : q.y + q.sy + 200;
    const yeni = kulpParcalari(kulpTip, { a0: q.x, b0: q.y, a1: q.x + q.sx, b1: q.y + q.sy, X0, Y0, X1, Y1, z: q.z })
      .map(r => ({ ...r, ...(q.ac ? { ac: q.ac } : null), ...(q.cek != null ? { cek: q.cek } : null) }));
    P.splice(i, 1, ...yeni);
    i += yeni.length - 1;
  }
  return P;

  // Katalogdan takılmış ürün: gerçek biçimi (aksesuarmodel.js). Ürünün düzeni dolabın iç donanım türüne uymuyorsa null (genel biçim çizilir).
  function urunDonanimi(urun) {
    const md = aksesuarModeli(urun.g);
    if (!md || !md.turler.includes(m.donanim)) return null;
    const ust = TANIM[m.tip].sinif === 'ust', kapi = P.find(q => q.ad === 'Kapak' && q.tur === 'kapak'), kd = Math.min(m.kol || 560, w - 150, d - 150), cx0 = kd * 0.66;
    return aksesuarParcalari(urun, { w, h, d, T, y0: (ust ? 0 : BAZA) + T, y1: h - T, z0: IC + 12, kapi: kapi ? { x0: kapi.x, x1: kapi.x + kapi.sx } : null,
      mil: { x: m.korYon === 'sag' ? w - cx0 : cx0, z: kd * 0.66, r: Math.min(kd * 0.62, 330) }, sagda: m.korYon === 'sag', kapakYon: m.mentese });
  }
  // Ürünün parçaları eklenir; ön kapak mekanizmaya bağlıysa menteşeyle açılmaz, donanımla birlikte hareket eder
  function urunHareketi(s, bas) {
    const onler = P.slice(0, bas).filter(q => q.tur === 'kapak' || q.tur === 'kulp');
    P.push(...s.parcalar);
    if (s.kapakCek) for (const q of onler) { delete q.ac; delete q.mentese; q.cek = s.kapakCek; if (q.tur === 'kapak') q.onBagli = true; }
    if (s.kapakAc) for (const q of onler) { delete q.mentese; q.ac = s.kapakAc; if (q.tur === 'kapak') q.onBagli = true; }
  }

  // Dolap içi donanım parçaları (hepsi paslanmaz tel ya da koyu plastik; kertmeye ve ölçüye etkisi yok)
  function donanim() {
    const ust = TANIM[m.tip].sinif === 'ust', y0 = (ust ? 0 : BAZA) + T, y1 = h - T;
    const x0 = T + 14, ww = w - 2 * T - 28, z0 = IC + 20, dd = d - IC - 50;
    const tel = (ad, x, y, z, sx, sy, sz) => k(ad, x, y, z, sx, sy, sz, 'inox', 'cihaz');
    const sepet = (y, yuk = 90, x = x0, gen = ww, zz = z0, der = dd) => {
      tel('Sepet tabanı', x, y, zz, gen, 5, der);
      tel('Sepet önü', x, y, zz + der - 6, gen, yuk, 6); tel('Sepet arkası', x, y, zz, gen, yuk, 6);
      tel('Sepet yanı', x, y, zz, 6, yuk, der); tel('Sepet yanı', x + gen - 6, y, zz, 6, yuk, der);
    };
    const kova = (x, gen) => k('Çöp kovası', x, y0 + 18, z0 + 20, gen, Math.min(380, y1 - y0 - 90), dd - 40, 'koyu', 'cihaz');
    switch (m.donanim) {
      case 'sepet':
        for (let i = 0; i < 3; i++) sepet(y0 + 20 + (y1 - y0 - 40) * i / 3);
        break;
      case 'kiler': {
        const n = Math.max(3, Math.round((y1 - y0) / 380));
        for (let i = 0; i < n; i++) sepet(y0 + 20 + (y1 - y0 - 40) * i / n, 110);
        break;
      }
      case 'cop':
        sepet(y0 + 8, 40);
        if (ww >= 360) { kova(x0 + 10, ww / 2 - 16); kova(x0 + ww / 2 + 6, ww / 2 - 16); } else kova(x0 + 10, ww - 20);
        break;
      case 'deterjan':
        sepet(y0 + 8, 40);
        kova(x0 + 10, ww * 0.5 - 16);
        sepet(y0 + 30, 130, x0 + ww * 0.55, ww * 0.45);
        break;
      case 'baharat':
        tel('Taşıyıcı çerçeve', x0, y0 + 10, z0 + dd - 8, 8, y1 - y0 - 20, 8); tel('Taşıyıcı çerçeve', x0 + ww - 8, y0 + 10, z0 + dd - 8, 8, y1 - y0 - 20, 8);
        for (let i = 0; i < 3; i++) sepet(y0 + 20 + (y1 - y0 - 40) * i / 3, 70);
        break;
      case 'tabaklik': {
        k('Damlalık tepsisi', x0, y0 + 6, z0, ww, 10, dd, 'koyu', 'cihaz');
        const n = Math.max(4, Math.floor(ww / 30));
        tel('Tabaklık rayı', x0, y0 + 50, z0 + 30, ww, 5, 5); tel('Tabaklık rayı', x0, y0 + 50, z0 + dd - 40, ww, 5, 5);
        for (let i = 0; i <= n; i++) tel('Tabak teli', x0 + (ww - 4) * i / n, y0 + 50, z0 + 30, 4, 120, 4);
        sepet(y0 + (y1 - y0) * 0.55, 30); // bardaklık
        break;
      }
      case 'sihirli': { // iki katta ikişer tepsi: biri kapak tarafında, biri kör bölümde
        const yari = w / 2 - T - 24;
        for (const y of [y0 + 30, y0 + (y1 - y0) * 0.52]) { sepet(y, 80, T + 14, yari); sepet(y, 80, w / 2 + 10, yari); }
        tel('Mekanizma mili', w / 2 - 8, y0, z0 + dd / 2, 16, y1 - y0, 16);
        break;
      }
      case 'doner': { // köşede dönen iki yuvarlak tabla
        const kd = Math.min(m.kol || 560, w - 150, d - 150), r = Math.min(kd * 0.62, 330);
        const cx0 = kd * 0.66, cx = m.korYon === 'sag' ? w - cx0 : cx0, cz = kd * 0.66;
        P.push({ ad: 'Döner mil', sekil: 'sil', x: cx, y: y0, z: cz, r: 14, h: y1 - y0, mat: 'inox', tur: 'cihaz' });
        for (const y of [y0 + 30, y0 + (y1 - y0) * 0.52]) {
          P.push({ ad: 'Döner tabla', sekil: 'sil', x: cx, y, z: cz, r, h: 8, mat: 'inox', tur: 'cihaz' });
          P.push({ ad: 'Tabla kenarı', sekil: 'sil', x: cx, y: y + 8, z: cz, r: r, h: 3, mat: 'koyu', tur: 'cihaz' });
        }
        break;
      }
    }
  }

  // Donanımın "açık" gösterimdeki hareketi. bas: donanım parçalarının P içindeki başlangıcı.
  //   cek: öne çekilme (mm)   kay: yana kayma (mm)   ac: { x, z, yon: 'don', aci } düşey eksen çevresinde dönme
  // Çekmeli donanımda (çöp kovası, baharatlık, kiler) kapak mekanizmaya bağlıdır: menteşeyle açılmaz, donanımla birlikte dışarı çıkar.
  function donanimHareketi(bas) {
    const don = P.slice(bas), onler = P.slice(0, bas).filter(q => q.tur === 'kapak' || q.tur === 'kulp');
    const birlikte = mm => { for (const q of [...onler, ...don]) { delete q.ac; delete q.mentese; q.cek = mm; if (q.tur === 'kapak') q.onBagli = true; } }; // onBagli: kapak mekanizmaya bağlı, menteşe gerekmez
    const kat = q => q.y; // aynı kattaki sepet parçaları aynı kadar çıkar
    switch (m.donanim) {
      case 'cop': case 'baharat': birlikte(Math.min(d - 120, 430)); break;
      case 'kiler': birlikte(Math.min(d - 100, 460)); break;
      case 'sepet': { // menteşeli kapağın arkasındaki tel sepetler: üstteki az, alttaki çok çekilir
        const katlar = [...new Set(don.map(q => Math.round(kat(q) / 60)))].sort((a, b) => a - b);
        for (const q of don) q.cek = Math.min(d - 150, 360) - katlar.indexOf(Math.round(kat(q) / 60)) * 70;
        break;
      }
      case 'deterjan': for (const q of don) q.cek = Math.min(d - 180, 300); break;
      case 'sihirli': { // kapak tarafındaki tepsiler kapakla birlikte dışarı çıkar, kör bölümdekiler boşalan yere kayar
        const kapi = onler.find(q => q.ad === 'Kapak');
        if (!kapi) break;
        const k0 = kapi.x, k1 = kapi.x + kapi.sx, km = (k0 + k1) / 2;
        for (const q of don) {
          const orta = q.x + q.sx / 2;
          if (q.ad === 'Mekanizma mili') continue;
          if (orta > k0 && orta < k1) q.cek = Math.min(d - 100, 430); else q.kay = (km > w / 2 ? 1 : -1) * (w / 2 - 20);
        }
        for (const q of onler) if (q.ac || q.mentese) { delete q.ac; delete q.mentese; q.cek = Math.min(d - 100, 430); if (q.tur === 'kapak') q.onBagli = true; }
        break;
      }
      case 'doner': { // köşe döner sepet: iki kapak tablalara bağlıdır, hepsi mil çevresinde içeri döner; tablalar öne gelir
        const mil = don.find(q => q.ad === 'Döner mil');
        if (!mil) break;
        const ac = { x: mil.x, z: mil.z, yon: 'don', aci: m.korYon === 'sag' ? -2.2 : 2.2 };
        for (const q of [...onler, ...don]) { delete q.mentese; q.ac = ac; if (q.tur === 'kapak') q.onBagli = true; }
        break;
      }
    }
  }

  // bas'tan sonraki parçaları x ekseninde aynalar
  function aynala(bas) {
    for (let i = bas; i < P.length; i++) {
      const p = P[i];
      if (p.sekil === 'ceyrek') { p.x = w - p.x; p.ayna = true; }
      else if (p.sekil === 'sil') p.x = w - p.x;
      else p.x = w - p.x - p.sx;
    }
  }

  // Cihaz gövde rengi: modüle özel seçim yoksa tipin varsayılanı
  function cihazMat(varsayilan) {
    return { inox: 'inox', siyah: 'siyah', beyaz: 'seramik' }[m.cihazRenk] || varsayilan;
  }

  // Çamaşır / kurutma makinesi önü: y0 kotunda hh yüksekliğinde; ic: gövdenin kasa içinde kalan payı
  function makine(y0, hh, ic = 0) {
    const cm = cihazMat('seramik'), x0 = ic ? T + 4 : 2, ww = w - 2 * x0, cer = cm === 'siyah' ? 'koyu' : 'inox';
    k('Makine gövdesi', x0, y0, 20, ww, hh, d - 20, cm, 'cihaz');
    const c = Math.min(ww - 120, hh - 260, 380), cx = x0 + (ww - c) / 2, cy = y0 + (hh - 130 - c) / 2 + 20;
    k('Kapak çerçevesi', cx - 22, cy - 22, d, c + 44, c + 44, 14, cer, 'cihaz');
    k('Kapak camı', cx, cy, d + 14, c, c, 6, 'koyu', 'cihaz');
    k('Kumanda paneli', x0, y0 + hh - 110, d, ww, 100, 6, cer, 'cihaz');
    k('Program düğmesi', x0 + ww - 110, y0 + hh - 90, d + 6, 60, 60, 20, 'koyu', 'cihaz');
    k('Ekran', x0 + 40, y0 + hh - 80, d + 6, Math.min(160, ww * 0.3), 40, 2, 'siyah', 'cihaz');
  }

  // Ocak. ocakTip: gaz4 | gaz5 (geniş, ortada wok gözü) | cam4 (cam seramik / indüksiyon) | gaz2, cam2 (domino) | yok
  function ocak(y = ustKot, derinlik = 500) {
    const tur = m.ocakTip || 'gaz4';
    if (tur === 'yok') return;
    const cam = tur.startsWith('cam');
    const ow = Math.min(w - 20, tur === 'gaz5' ? 860 : tur.endsWith('2') ? 290 : 580), od = derinlik, ox = (w - ow) / 2, oz = 60;
    k('Ocak', ox, y, oz, ow, cam ? 4 : 6, od, 'siyah', 'cihaz');
    const g = tur === 'gaz5' ? [[0.16, 0.28, 70], [0.16, 0.72, 60], [0.5, 0.48, 105], [0.84, 0.28, 60], [0.84, 0.72, 70]]
      : tur.endsWith('2') ? [[0.5, 0.27, 75], [0.5, 0.7, 60]]
      : [[0.27, 0.28, 85], [0.73, 0.28, 70], [0.27, 0.74, 70], [0.73, 0.74, 85]];
    if (cam) { // düz cam: ısıtma bölgeleri ince halka, önde dokunmatik şerit
      for (const [fx, fz, r] of g) sil('Isıtma bölgesi', ox + ow * fx, y + 4, oz + od * fz * 0.9, r + 10, 0.8, 'koyu');
      k('Dokunmatik kumanda', ox + ow * 0.3, y + 4, oz + od - 50, ow * 0.4, 0.8, 26, 'koyu', 'cihaz');
    } else {
      for (const [fx, fz, r] of g) {
        sil('Ocak gözü', ox + ow * fx, y + 6, oz + od * fz * 0.9, r, 4, 'koyu');
        sil('Bek', ox + ow * fx, y + 10, oz + od * fz * 0.9, r * 0.4, 6, 'inox');
      }
      const n = g.length; // düğmeler ön kenarda
      for (let i = 0; i < n; i++) sil('Ocak düğmesi', ox + ow / 2 + (i - (n - 1) / 2) * 42, y + 6, oz + od - 28, 14, 16, 'inox');
    }
  }

  // Evye. evye: tek | genis | bucuk | cift | damla (damlalık sağda) | damlaSol | yuvarlak    evyeMat: inox | granit | beyaz
  function evye() {
    const tur = m.evye || 'tek', pm = m.evyeMat === 'granit' ? 'siyah' : m.evyeMat === 'beyaz' ? 'seramik' : 'inox';
    const im = pm === 'seramik' ? 'inox' : 'koyu'; // tekne içi
    const ed = 440, ez = 70;
    const batarya = (x, z) => {
      sil('Batarya', x, ustKot + 3, z, 16, 260, 'inox');
      k('Batarya ağzı', x - 8, ustKot + 245, z, 16, 16, 190, 'inox', 'cihaz');
    };
    if (tur === 'yuvarlak') {
      const r = Math.min(225, w / 2 - 60);
      sil('Evye', w / 2, ustKot, ez + ed / 2 + 20, r, 3, pm);
      sil('Evye teknesi', w / 2, ustKot + 3, ez + ed / 2 + 20, r - 25, 1.5, im);
      batarya(w / 2, ez + 20);
      return;
    }
    const ew = Math.min(w - 120, 760), ex = (w - ew) / 2;
    // tekneler: [başlangıç oranı, genişlik oranı]; batarya yeri; batarya arkada mı (tekne arkadan kısalır)
    const tekGenis = [[[0.04, 0.92]], 0.5, true];
    const [tekneler, bx, arkada] = { genis: tekGenis, damla: tekGenis, damlaSol: tekGenis,
      bucuk: [[[0.04, 0.54], [0.62, 0.34]], 0.6, true], cift: [[[0.04, 0.44], [0.52, 0.44]], 0.5, true] }[tur] || [[[0.04, 0.55]], 0.78, false];
    k('Evye', ex, ustKot, ez, ew, 3, ed, pm, 'cihaz');
    for (const [a, g] of tekneler) k('Evye teknesi', ex + ew * a, ustKot + 3, ez + (arkada ? 85 : 25), ew * g, 1.5, ed - (arkada ? 110 : 50), im, 'cihaz');
    batarya(ex + ew * bx, ez + 40);
    if (tur === 'damla' || tur === 'damlaSol') { // damlalık komşu dolabın üstüne uzanır
      const dw = 420, dx = tur === 'damla' ? ex + ew : ex - dw;
      k('Damlalık', dx, ustKot, ez, dw, 3, ed, pm, 'cihaz');
      for (let i = 1; i <= 6; i++) k('Damlalık oluğu', dx + dw * i / 7 - 6, ustKot + 3, ez + 40, 12, 1.2, ed - 80, im, 'cihaz');
    }
  }
}

// Modül tipine göre düzenlenebilen alanlar (dinamik özellik paneli için)
export function alanlar(m) {
  const a = { donanim: donanimSecenekleri(m.tip), kapak: false, cekmece: false, raf: false, kulp: true, mentese: false, korYon: false, kapakRenk: true, govdeRenk: true,
    bolme: BOLMELI.has(m.tip) };
  switch (m.tip) {
    case 'kapi':
      a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; a.mentese = m.kapiTip !== 'cift' && m.kapiTip !== 'dis'; a.kapiTip = true; a.kapiModel = m.kapiTip !== 'surgu' && m.kapiTip !== 'balkon'; break;
    case 'pencere':
      a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; a.pencereTip = true; break;
    case 'ozel_alt': case 'ozel_ust': case 'ozel_boy': a.ozel = true; a.mentese = true; break;
    case 'not_yazi': case 'olcu_cizgi':
    case 'priz': case 'anahtar': case 'su_giris': case 'gider': case 'dogalgaz':
      a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; break;
    case 'kolon': case 'kiris': case 'girinti': case 'nis':
    case 'tabure': case 'masa': case 'sandalye': case 'sarkit': case 'spot': case 'plafonyer':
      a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; break;
    case 'alt_kapak': case 'ust_kapak': case 'ust_tepe': case 'ust_buzustu': case 'ust_cam': case 'boy_kiler':
      a.kapak = true; a.raf = true; a.mentese = m.kapak === 1; break;
    case 'alt_evye': a.kapak = true; a.mentese = m.kapak === 1; a.evye = true; break;
    case 'alt_ocak': a.cekmece = true; a.ocak = true; break;
    case 'alt_firin': a.ocak = true; break;
    case 'alt_solo': a.ocak = true; a.cihazRenk = true; a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; break;
    case 'alt_camasir': a.cihazRenk = true; a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; break;
    case 'boy_camasir': a.cihazRenk = true; break;
    case 'alt_sarap': a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; break;
    case 'boy_firin': a.kule = true; break;
    case 'alt_cekmece': a.cekmece = true; break;
    case 'alt_kose': case 'alt_lkose': case 'ust_lkose': case 'alt_kavis': case 'ust_kavis': a.raf = true; a.korYon = true; break;
    case 'ust_kavis_acik': a.raf = true; a.korYon = true; a.kulp = false; a.kapakRenk = false; break;
    case 'alt_sise': a.raf = true; a.kulp = false; a.kapakRenk = false; break;
    case 'boy_gardirop': a.kapak = true; a.raf = true; a.mentese = m.kapak === 1; break;
    case 'boy_vestiyer': a.kapak = true; a.mentese = m.kapak === 1; break;
    case 'alt_banyo': a.cekmece = true; break;
    case 'ust_ayna': a.kapak = true; a.raf = true; a.mentese = m.kapak === 1; a.kulp = false; a.kapakRenk = false; break;
    case 'tv': a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; break;
    case 'panel_yan': a.kulp = false; a.govdeRenk = false; break;
    case 'dolgu': a.kulp = false; a.govdeRenk = false; break;
    case 'ust_mikro': a.kapak = true; a.mentese = m.kapak === 1; break;
    case 'boy_ankastre': a.mentese = true; break;
    case 'ust_acik': a.raf = true; a.kulp = false; a.kapakRenk = false; break;
    case 'davlumbaz': a.davTip = true; if (m.davTip !== 'gomme') { a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; } break;
    case 'buzdolabi': a.buzTip = true; a.cihazRenk = true; a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; break;
    case 'davlumbaz_ada': a.kulp = false; a.kapakRenk = false; a.govdeRenk = false; break;
  }
  if (KALKAR_OLUR.has(m.tip)) { a.kalkar = true; if (m.kalkar) a.mentese = false; }
  return a;
}
