// Adeko ile çalışma: CAM parça adları, CAM parça listesi ve modül kod listesi.
// Kurallar kullanıcının kendi uygulaması eB Creator'dan alınmıştır (adkTag, adkCSV, ADA, adkModCSV); orada da atölyenin
// CAM programı işlerindeki etiketlerden ve Adeko çizim kütüphanesindeki modül kodlarından çıkarılmıştı.
//   CAM parça listesi   Adeko CAM'in "Kesim listesi" içe aktarımı için (eB Creator'da "deneme" olarak duruyordu; sütunlar orada da doğrulanmadı)
//   Modül kod listesi   Adeko çiziminde her dolap için "cc" yazıp kodu girerek aynı mutfağı kurmak için
// Modül kodları Adeko kütüphanesinin kodlarıdır (üçüncü taraf adları): uygulama başkalarına verilecekse kullanıcının kararıyla çıkarılır.
import { TANIM, projeAyarla } from './moduller.js';
import { modulNumaralari, modulKesimi, kesimListesi } from './kesim.js';
import { odaGorunumleri } from './odalar.js';
import { planAyari } from './kesimplan.js';
import { renkAdi } from './renkler.js';
import { DUVARLAR, DUVAR_LISTE } from './yerlesim.js';
import { uretimAyari, ozelTur } from './uretim.js';

export const CAM_BANT = 1; // CAM listesine yazılan kenar bandı kalınlığı (mm); eB Creator'daki varsayılan

// Parçanın CAM programındaki adları. İki ad dönerse parçalar ikisine eşit bölünür (yanlar sol ve sağ, çekmece ön ve arka).
export function camEtiketleri(ad, malzeme = '') {
  const n = String(ad);
  if (/^Sol yan/.test(n)) return ['SOL_PANEL'];
  if (/^Sağ yan/.test(n)) return ['SAG_PANEL'];
  if (n === 'Yan') return ['SOL_PANEL', 'SAG_PANEL'];
  if (/^Alt tabla/.test(n)) return ['ALT_PANEL'];
  if (/^Üst tabla/.test(n)) return ['UST_PANEL'];
  if (/kayıt$/.test(n)) return ['PN']; // ön ve arka kayıt (kuşak)
  if (/^Çekmece yanı/.test(n)) return ['YNK'];
  if (/^Çekmece ön.arka/.test(n)) return ['CEKMECE_KUTU_ON', 'CEKMECE_KUTU_ARKA'];
  if (/^Çekmece tabanı/.test(n)) return ['CEKMECE_TABAN'];
  if (/^Çekmece arkası/.test(n)) return ['CEKMECE_KUTU_ARKA']; // metal yanlı kutu çekmecenin arkası
  if (malzeme === 'Arkalık') return ['ARKALIK'];
  if (malzeme === 'Baza') return ['BAZA_'];
  if (n === 'Raf') return ['HAREKETLI_RAF'];
  if (/raf|tabla/i.test(n)) return ['SABIT_RAF']; // ara raf, ara tabla, şapkalık rafı
  if (malzeme === 'Kapak' && /^(Kapak|Çekmece önü|Makine önü)/.test(n)) return ['KAPAK'];
  return ['PANEL'];
}
export const camEtiketi = (ad, malzeme, sira = 0) => { const l = camEtiketleri(ad, malzeme); return l[sira % l.length]; };

// Dolabın Adeko modül kodu: modüle elle yazılmışsa (m.adk) o, yoksa türüne ve ölçüsüne göre öneri (ölçüler cm).
export function modulKodu(m) {
  if (m.adk && String(m.adk).trim()) return String(m.adk).trim().slice(0, 40);
  const w = Math.round(m.w / 10), d = Math.round(m.d / 10), n = m.kapak >= 2 ? 2 : 1, c = Number(m.cekmece) || 0;
  switch (m.tip) {
    case 'alt_kapak': return `A${n}K ${w}`;
    case 'alt_cekmece': return c ? `A${c}C ${w}` : `A${n}K ${w}`;
    case 'alt_evye': return `E${n}K ${w}`;
    case 'alt_ocak': return c ? `O${c}C ${w}` : `O${n}K ${w}`;
    case 'alt_firin': return `OFD ${w}`;
    case 'alt_bulasik': return `BMK ${w}`;
    case 'alt_kose': return `AKK ${w <= 110 ? 45 : w <= 125 ? 60 : 90}`;
    case 'alt_lkose': return `A2K ${w} ${d}`;
    case 'alt_sise': return `AS ${w}`;
    case 'ust_kapak': case 'ust_tepe': return m.kalkar ? `UTD${w >= 75 ? 90 : 60}` : `U${n}K ${w}`;
    case 'ust_cam': return `U${n}CK ${w}`;
    case 'ust_lkose': return `U2K ${w} ${d}`;
    case 'ust_acik': return `US ${w}`;
    case 'ust_buzustu': return `BDUM ${w}`;
    case 'davlumbaz': return `DVL ${w}`;
    case 'boy_kiler': return `B1K ${w}`;
    case 'boy_firin': return 'BAFM1K1C';
    case 'boy_ankastre': return `BZD KK ${w}`;
    case 'panel_yan': return m.h > 1500 ? 'DK20$B' : TANIM[m.tip].sinif === 'ust' || m.y > 300 ? 'DK20$U' : 'DK20$A';
  }
  return '';
}

// Levhanın adı: tür (gövde ve kapakta üretim ayarındaki malzeme), renk adı (katalogda yoksa renk kodu)
export function levhaTuru(s, ur) {
  const tur = s.malzeme === 'Gövde' ? 'Gövde ' + (s.tur || ur.govde) : s.malzeme === 'Kapak' ? 'Kapak ' + (s.tur || ur.kapak) : s.malzeme; // satırın kendi türü (modüle özel olabilir)
  return { tur, renk: renkAdi(s.renk) || (s.renk ? 'renk ' + String(s.renk).replace('#', '') : '') };
}

// CAM listesindeki malzeme adı, eB Creator'ın CAM listesindeki gibi: renk adı + kalınlık ("Mat beyaz 18mm").
// Renk katalogdan seçilmediyse adı yoktur: renk kodu yazılır ("Renk f1efe9 18mm"); renk hiç yoksa malzemenin türü.
// ur verilirse ve parçanın malzeme türü projenin türünden farklıysa (modüle özel malzeme) tür adın sonuna eklenir ("Mat beyaz 18mm Lake"):
// aynı renkte ama ayrı türde iki levha CAM'de aynı tabakaya düşmesin. Bu ek eB Creator'da yoktur (orada tek tür vardır).
export const camMalzemeAdi = (s, ur) => `${renkAdi(s.renk) || (s.renk ? 'Renk ' + String(s.renk).replace('#', '').toLowerCase() : s.malzeme)} ${s.kalinlik}mm${ur && ozelTur(s, ur) ? ' ' + s.tur : ''}`;

const csv = satirlar => '﻿' + satirlar.map(r => r.map(v => { v = String(v ?? ''); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';')).join('\r\n') + '\r\n';

// CAM parça listesi: her dolabın her parçası bir satır; sütun adları eB Creator'daki CAM listesiyle aynıdır.
// Ölçüler mm; Grain 1: desen yönü korunur (kesim planındaki "desen yönü" ayarına göre). Malzeme: renk adı + kalınlık (aynı renkteki gövde ve kapak aynı adı alır);
// bantsız (boyalı) kapakta "Ham MDF 18mm|renk 18mm" yazılır.
// Poz numarası: her dolap bir poz. Dolaba bağlı olmayan parçalar kendi pozunu alır (örnek CAM listesindeki düzen): baza koşuları bir poz,
// taç parçaları bir poz, öbür her parça (ada bitiş paneli, bar dikmesi) ayrı poz.
// camParcalari: CAM listesinin kaynağı; CAM parça listesi ve parça etiketleri buradan üretilir.
//   [{ kod, poz, aciklama, s (kesim parçası: malzeme, renk, kalinlik, ad, boy, en, adet, parça başına bant), oda, modulNo, modul }]
export function camParcalari(p) {
  const out = [], ur = uretimAyari(p);
  let poz = 0;
  for (const g of odaGorunumleri(p)) {
    projeAyarla(g.proje.ayar);
    const { no, sirali } = modulNumaralari(g.proje), oda = g.ad ? g.ad + ' · ' : '';
    for (const m of sirali) {
      // aynı parçalar tek satır, adediyle (iki "Yan" → bir sol, bir sağ panel)
      const tek = new Map();
      for (const s of modulKesimi(m, g.proje).parcalar) {
        if (s.malzeme === 'Cam') continue;
        const a = [s.malzeme, s.tur || '', s.renk, s.kalinlik, s.ad, s.boy, s.en, s.bant].join('|'), k = tek.get(a);
        if (k) k.adet += s.adet; else tek.set(a, { ...s });
      }
      const l = [...tek.values()];
      if (!l.length) continue;
      poz++;
      for (const s of l) out.push({ ur, kod: modulKodu(m), poz, aciklama: `${s.ad} · ${oda}${TANIM[m.tip].ad} No ${no[m.id]}`, s, oda: g.ad || '', modulNo: no[m.id], modul: TANIM[m.tip].ad });
    }
    const grupPoz = {};
    for (const s of kesimListesi(g.proje).satirlar) {
      if (s.moduller.length || ['Tezgah', 'Cam'].includes(s.malzeme)) continue;
      const tur = /^Taç/.test(s.ad) ? 'üst bitiş' : s.malzeme === 'Baza' ? 'baza' : 'ada';
      const n = tur === 'ada' ? ++poz : (grupPoz[tur] ||= ++poz);
      out.push({ ur, kod: '', poz: n, aciklama: `${s.ad} · ${oda}${tur}`, s: { ...s, bant: s.bant / (s.adet || 1) }, oda: g.ad || '', modulNo: 0, modul: tur === 'ada' ? 'Ada' : tur === 'baza' ? 'Baza' : 'Taç' });
    }
  }
  projeAyarla(p.ayar);
  return out;
}

// Bir kesim parçasının CAM listesindeki karşılığı: adları ve adetleri, malzeme adı, döndürülebilir mi (desen yönü yok),
// bantlı kenarlar [üst, alt, sol, sağ] (üst: boy, yani PartWidth boyunca uzanan kenar) ve kapak mı
export function camParcaBilgisi(s, yon, ur = null) {
  const l = camEtiketleri(s.ad, s.malzeme), kapak = l[0] === 'KAPAK' ? 1 : 0;
  // bantsız kapak boyalıdır: levhası ham MDF, görünen adı renk (eB Creator'daki kural); masif kapak ham MDF değildir
  const boyali = kapak && !s.bant && s.tur !== 'Masif', ad = camMalzemeAdi(s, ur), malzeme = boyali ? `Ham MDF ${s.kalinlik}mm|${ad}` : ad;
  const doner = yon === 'serbest' || (yon === 'kapak' && !['Kapak', 'Baza'].includes(s.malzeme)) || s.malzeme === 'Arkalık'; // baza da kapak gibi desen yönlüdür (örnek CAM listesi)
  const dort = s.malzeme === 'Kapak' && s.bant > 0, tek = s.malzeme !== 'Kapak' && s.bant > 0; // kapakta dört kenar, gövde parçasında öne bakan kenar
  const bol = l.length > 1 && s.adet % l.length === 0;
  return { adlar: (bol ? l : [l[0]]).map(e => [e, bol ? s.adet / l.length : s.adet]), malzeme, doner, bant: [dort || tek ? 1 : 0, dort ? 1 : 0, dort ? 1 : 0, dort ? 1 : 0], kapak };
}

export function camListesi(p) {
  const H = ['ModuleCode', 'ModulePoseNo', 'PartName', 'PartDescription', 'Material', 'MaterialThickness', 'PartWidth', 'PartHeight', 'Quantity', 'Grain',
    'TopEdgeBand.Thickness', 'BottomEdgeBand.Thickness', 'LeftEdgeBand.Thickness', 'RightEdgeBand.Thickness', 'IsDoor'];
  const satirlar = [H], yon = planAyari(p).yon;
  for (const r of camParcalari(p)) {
    const b = camParcaBilgisi(r.s, yon, r.ur);
    for (const [etiket, adet] of b.adlar) satirlar.push([r.kod, r.poz, etiket, r.aciklama, b.malzeme, r.s.kalinlik, r.s.boy, r.s.en, adet, b.doner ? 0 : 1, ...b.bant.map(v => v ? CAM_BANT : 0), b.kapak]);
  }
  return satirlar;
}
export const camListesiCsv = p => csv(camListesi(p));

// Modül kod listesi: Adeko çiziminde duvar duvar, soldan sağa girilecek kodlar (ölçüler cm).
export function modulKodListesi(p) {
  const satirlar = [['Oda', 'Duvar', 'Sıra', 'Satır', 'Duvar başından (cm)', 'Yerden (cm)', 'Modül kodu (cc)', 'Modül', 'No', 'Genişlik', 'Yükseklik', 'Derinlik', 'Köşe tarafı', 'Not']];
  const cm = v => Math.round(v) / 10;
  for (const g of odaGorunumleri(p)) {
    projeAyarla(g.proje.ayar);
    const { no } = modulNumaralari(g.proje);
    for (const d of [...DUVAR_LISTE, 'ada']) {
      for (const [satir, sinif] of [['alt ve boy', ['alt', 'boy']], ['üst', ['ust']]]) {
        const l = g.proje.moduller.filter(m => m.duvar === d && sinif.includes(TANIM[m.tip]?.sinif)).sort((a, b) => a.x - b.x || (a.z || 0) - (b.z || 0));
        l.forEach((m, i) => {
          const t = TANIM[m.tip], kod = modulKodu(m);
          satirlar.push([g.ad || '', (DUVARLAR[d] || d).replace(' (serbest)', ''), i + 1, t.sinif === 'boy' ? 'boy' : satir === 'üst' ? 'üst' : 'alt', cm(m.x), cm(m.y || 0), kod, t.ad, no[m.id] || '',
            cm(m.w), cm(m.h), cm(m.d), /kose|kavis/.test(m.tip) ? (m.korYon === 'sag' ? 'sağ' : 'sol') : '',
            [m.tip === 'buzdolabi' ? 'cihaz olarak eklenir' : !kod ? 'kod önerisi yok: çizim programının listesinden seçin' : m.adk ? 'kod elle yazıldı' : '', d === 'ada' ? `ada: önden ${cm(m.z || 0)} cm` : '', m.not || ''].filter(Boolean).join(' · ')]);
        });
      }
    }
  }
  projeAyarla(p.ayar);
  return satirlar;
}
export const modulKodListesiCsv = p => csv(modulKodListesi(p));
