// Üretim ayarları: gövde ve kapak malzemesi türü, menteşe ve ray türü. Projeye yazılır (ayar.uretim); modül kendi gövde ve kapak
// malzemesini seçebilir (m.govdeMalzeme, m.kapakMalzeme): bir projede birden çok malzeme türü kullanılabilir.
// Hiçbir şeye bağlı değildir: kesim listesi, kesim planı, maliyet, CNC paketi ve CAM listesi buradan okur.
export const URETIM_SECENEK = {
  govde: ['Suntalam', 'MDFlam', 'Kontrplak'], kapak: ['MDFlam', 'Suntalam', 'Akrilik', 'Highgloss', 'Lake', 'Membran', 'Laminat', 'Masif'],
  mentese: [['frenli', 'Frenli'], ['frensiz', 'Frensiz']], ray: [['teleskopik', 'Teleskopik'], ['tandem', 'Gizli ray (tandem)'], ['tandembox', 'Kutu çekmece (tandembox)']],
};
export const BANTSIZ_KAPAK = new Set(['Lake', 'Membran', 'Masif']); // bu kapaklarda kenar bandı kalemi kendiliğinden kapanır
export function uretimAyari(p) {
  const u = p?.ayar?.uretim || {}, sec = (l, v) => (l.map(x => Array.isArray(x) ? x[0] : x).includes(v) ? v : (Array.isArray(l[0]) ? l[0][0] : l[0]));
  return { govde: sec(URETIM_SECENEK.govde, u.govde), kapak: sec(URETIM_SECENEK.kapak, u.kapak), mentese: sec(URETIM_SECENEK.mentese, u.mentese), ray: sec(URETIM_SECENEK.ray, u.ray) };
}
// Modülün gövde ve kapak malzemesi türü: modüle özel seçim geçerli bir türse o, değilse projenin türü
export function modulMalzemesi(m, p) {
  const U = uretimAyari(p);
  return { govde: URETIM_SECENEK.govde.includes(m?.govdeMalzeme) ? m.govdeMalzeme : U.govde, kapak: URETIM_SECENEK.kapak.includes(m?.kapakMalzeme) ? m.kapakMalzeme : U.kapak };
}
// Kesim satırının malzeme türü projenin türünden farklı mı (listelerde ve dosya adlarında yalnızca farklı olan yazılır)
export const ozelTur = (s, U) => !!s.tur && s.tur !== (s.malzeme === 'Kapak' ? U.kapak : s.malzeme === 'Gövde' ? U.govde : s.tur);
