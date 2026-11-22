// İlk kullanım turu: arayüzün bölümlerini sırayla vurgulayıp kısa açıklama gösterir.
// İlk açılışta bir kez kendiliğinden başlar; "?" penceresinden yeniden başlatılabilir.
const ANAHTAR = 'kurgu.rehber.v1';

const ADIMLAR = [
  // Telefonda ve dar ekranda paneller alt gezinme çubuğundan açılır; bu adım yalnızca çubuk görünürken gösterilir
  { sec: '#altGezinme', baslik: 'Bölümler', metin: 'Modüller, Oda, Görünüm ve Özellikler bu çubuktan açılır. Panel çizimin altına yerleşir; çizim görünmeye devam eder. Açık bölüme yeniden dokununca kapanır.' },
  { sec: '#oda', sekme: 'oda', baslik: 'Odayı tanımlayın', metin: '“Oda” sekmesinde duvar ve tavan ölçülerini milimetre olarak girin; müşteri bilgisi de burada. Renkler ve kaplamalar “Görünüm” sekmesinde.' },
  { sec: '#duvarSec', sekme: 'modul', baslik: 'Yeri seçin', metin: 'Modülü hangi duvara koyacağınızı seçin. “Ada” odanın ortasına serbest yerleştirir.' },
  { sec: '#katalog', sekme: 'modul', baslik: 'Modül ekleyin', metin: 'Bir modüle, sonra çizimde koymak istediğiniz duvara ya da zemine tıklayın: modül oraya oturur, sığmıyorsa ölçü önerir.' },
  { sec: '#tuval', baslik: 'Çizimde çalışın', metin: 'Modüle tıklayıp sürükleyerek taşıyın; komşusuna yapışır. Boş yerde sürükleyince görüş döner, tekerlek yakınlaştırır.',
    metinDar: 'Tek parmakla görüşü çevirin, iki parmakla yakınlaştırın. Modüle dokununca seçilir; seçili modülü sürükleyerek taşırsınız. Uzun basınca kopyalama menüsü açılır.' },
  { sec: '#sag', panel: 'ozellik', baslik: 'Özellikleri değiştirin', metin: 'Seçili modülün ölçüsü, kapak ve çekmece düzeni, kulpu, rengi ve notu burada.' },
  { sec: '.ust-arac', baslik: 'Görünümü seçin', metin: 'Gerçekçi, çizgili, şeffaf ya da tel görünüm; kapakları açma, ölçüler, akşam görünümü ve bakış yönü.',
    metinDar: 'Üstte bakış yönü: 3B, iç, ön, yan, plan. Yanındaki “Gösterim” düğmesi görünüm modunu, kapakları açmayı, ölçüleri, akşam görünümünü ve ölçü çizmeyi açar.' },
  { sec: '#denetimAc', baslik: 'Denetime bakın', metin: 'Çalışma üçgeni ve geçiş genişliği gibi ergonomi önerilerini listeler.' },
  { sec: '#teknikAc', baslik: 'Çıktı alın', metin: '“Teknik çizim” ölçülü plan ve görünüşleri, “Sunum PDF” müşteriye verilecek dosyayı hazırlar, “Görsel al” resim kaydeder. AutoCAD ve SketchUp aktarımı “⋯” menüsündedir.' },
  { sec: '#yeni', baslik: 'Hızlı başlangıç', metin: '“Yeni” düğmesi oda ölçüsünden hazır bir mutfak kurar. Her komuta Ctrl + K ile adını yazarak da ulaşabilirsiniz; kısayollar ve kılavuz “⋯” menüsünde.' },
  // Telefonda çıktı ve proje düğmeleri başlıkta değil, menüdedir
  { sec: '#digerAc', yoksa: '#yeni', baslik: 'Çıktı ve projeler', metin: 'Yeni mutfak, projeler, teknik çizim, Sunum PDF, görsel ve dışa aktarma bu menüde. Yanındaki büyüteç her komutu ve modülü adıyla bulur.' },
];

let kap = null, sira = 0, adimlar = [], panelAc = () => {};
const dar = () => gorunur(document.querySelector('#altGezinme'));

// Ekranda gerçekten görünen hedefler (dar ekranda gizli paneller atlanır)
function gorunur(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  // yalnızca yatayda bakılır: panelin içinde aşağıda kalan bölümler adım gösterilirken görünüme kaydırılır
  return r.width > 8 && r.height > 8 && r.right > 4 && r.left < innerWidth - 4;
}

function goster() {
  const a = adimlar[sira], pay = 6;
  panelAc(a.sekme || a.panel || 'cizim'); // hedef bir paneldeyse o panel (telefonda alttan) açılır
  a.el.scrollIntoView({ block: 'nearest' });
  const r = a.el.getBoundingClientRect();
  const delik = kap.querySelector('.rehber-delik'), kart = kap.querySelector('.rehber-kart');
  const x = Math.max(4, r.left - pay), y = Math.max(4, r.top - pay);
  const w = Math.min(innerWidth - 8 - x + 4, r.width + 2 * pay), h = Math.min(innerHeight - 8 - y + 4, r.height + 2 * pay);
  Object.assign(delik.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  kart.querySelector('h3').textContent = `${sira + 1} / ${adimlar.length} · ${a.baslik}`;
  kart.querySelector('p').textContent = (dar() && a.metinDar) || a.metin;
  kart.querySelector('[data-r=geri]').disabled = sira === 0;
  kart.querySelector('[data-r=ileri]').textContent = sira === adimlar.length - 1 ? 'Bitir' : 'İleri';
  // Kart: hedefin sağında, solunda, altında ya da üstünde; hiçbiri sığmazsa ekranın ortasında
  const kw = Math.min(320, innerWidth - 24), kh = kart.offsetHeight || 170, b = 12;
  let kx, ky;
  if (x + w + b + kw <= innerWidth) { kx = x + w + b; ky = y; }
  else if (x - b - kw >= 0) { kx = x - b - kw; ky = y; }
  else if (y + h + b + kh <= innerHeight) { kx = x; ky = y + h + b; }
  else if (y - b - kh >= 0) { kx = x; ky = y - b - kh; }
  else { kx = (innerWidth - kw) / 2; ky = (innerHeight - kh) / 2; }
  kart.style.width = kw + 'px';
  kart.style.left = Math.max(12, Math.min(kx, innerWidth - kw - 12)) + 'px';
  kart.style.top = Math.max(12, Math.min(ky, innerHeight - kh - 12)) + 'px';
  kart.querySelector('[data-r=ileri]').focus();
}

function kapat() {
  if (!kap) return;
  kap.remove(); kap = null;
  if (dar()) panelAc('cizim');
  document.removeEventListener('keydown', tus, true);
  removeEventListener('resize', goster);
  try { localStorage.setItem(ANAHTAR, '1'); } catch { /* depolama kapalı olabilir */ }
}

function tus(e) {
  if (e.key === 'Escape') { e.stopPropagation(); kapat(); }
  else if (e.key === 'ArrowRight') { e.stopPropagation(); ileri(1); }
  else if (e.key === 'ArrowLeft') { e.stopPropagation(); ileri(-1); }
}

function ileri(yon) {
  const yeni = sira + yon;
  if (yeni >= adimlar.length) return kapat();
  if (yeni < 0) return;
  sira = yeni;
  goster();
}

// panelFn(ad): hedefi bir panelin içinde olan adımlarda o paneli açar ('cizim': paneller kapalı)
export function rehberBaslat(panelFn) {
  kapat();
  if (panelFn) panelAc = panelFn;
  // panel içindeki hedefler o an gizli olabilir; panel adım gösterilirken açılır
  adimlar = ADIMLAR.map(a => ({ ...a, el: document.querySelector(a.sec) }))
    .filter(a => a.el && (a.sekme || a.panel || gorunur(a.el)) && !(a.yoksa && gorunur(document.querySelector(a.yoksa))));
  if (!adimlar.length) return;
  sira = 0;
  kap = document.createElement('div');
  kap.id = 'rehber';
  kap.innerHTML = `<div class="rehber-delik"></div>
    <div class="rehber-kart" role="dialog" aria-label="Kullanım turu">
      <h3></h3><p></p>
      <div class="dugmeler"><button data-r="kapat">Turu kapat</button><button data-r="geri">Geri</button><button data-r="ileri" class="ana">İleri</button></div>
    </div>`;
  kap.addEventListener('click', e => {
    const is = e.target.closest('[data-r]')?.dataset.r;
    if (is === 'kapat') kapat();
    if (is === 'geri') ileri(-1);
    if (is === 'ileri') ileri(1);
  });
  document.body.appendChild(kap);
  document.addEventListener('keydown', tus, true);
  addEventListener('resize', goster);
  goster();
}

// İlk açılışta bir kez
export function rehberGerekirse(panelFn) {
  let goruldu = false;
  try { goruldu = !!localStorage.getItem(ANAHTAR); } catch { goruldu = true; }
  if (!goruldu) rehberBaslat(panelFn);
}
