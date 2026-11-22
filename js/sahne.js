// 3B sahne: çizim, seçim ve sürükleme. Sahne kökü milimetre ölçeğindedir (0.001).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { parcalar, TANIM, TEZGAH_K, TEZGAH_TASMA, KAPAK_K } from './moduller.js';
import { donusum, yerelKutu, yon, kutu, engelMi, xEksenli, DUVAR_LISTE } from './yerlesim.js';
import { kertilmisParcalar, cikar, KERTME_PAYI } from './kertme.js';
import { tezgahSecimi } from './tezgahkatalog.js';
import { dekorUret } from './dekor.js';
import { tezgahlar, parcaRengi, adaEkleri, supurgelikler, tezgahSupurgelikleri, tezgahDamlaliklari, delikliDikler } from './ortak.js';
import { taclar, tacKutulari } from './tac.js';

const KUTU = new THREE.BoxGeometry(1, 1, 1);
const KENAR = new THREE.EdgesGeometry(KUTU);
const SIL = new THREE.CylinderGeometry(0.5, 0.5, 1, 28);
// Birim çeyrek daire dilimi: planda +x/+z çeyreği, yarıçap 1, yükseklik y 0..1
const CEYREK = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(1, 0); s.absarc(0, 0, 1, 0, Math.PI / 2, false); s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 20 });
  g.rotateX(Math.PI / 2); g.translate(0, 1, 0);
  return g;
})();
const CEYREK_KENAR = new THREE.EdgesGeometry(CEYREK, 35);
// Aynalı çeyrek (-x tarafı). Eksi ölçek yerine ayrı geometri: eksi ölçekli ağlar tıklamayla seçilemiyor.
const CEYREK_AYNA = (() => {
  const g = CEYREK.clone().toNonIndexed();
  g.scale(-1, 1, 1);
  for (const ad of ['position', 'normal', 'uv']) { // üçgen yönünü geri çevir
    const a = g.getAttribute(ad);
    if (!a) continue;
    const n = a.itemSize, d = a.array;
    for (let i = 0; i < d.length; i += 3 * n) {
      for (let j = 0; j < n; j++) { const t = d[i + n + j]; d[i + n + j] = d[i + 2 * n + j]; d[i + 2 * n + j] = t; }
    }
    a.needsUpdate = true;
  }
  return g;
})();
const CEYREK_AYNA_KENAR = new THREE.EdgesGeometry(CEYREK_AYNA, 35);

// Gerçekçi görünümde ön yüzler (kapak, tezgah, cihaz, kulp) keskin köşeli kutu yerine kenarları hafif yuvarlatılmış
// kutuyla çizilir: kenarlar ışığı yakalar, kapak araları gerçek mobilyadaki gibi okunur. Geometri gerçek ölçüde
// (mm) üretilir ve ölçüye göre önbellekte tutulur.
const yuvarlakOnbellek = new Map();
const kutuGeo = new WeakSet(); // yuvarlatılmış kutu geometrileri (fotoğraf dökümünde kutu sayılır)
function yuvarlakKutu(sx, sy, sz, r) {
  const yuv = v => Math.round(v * 2) / 2;
  sx = yuv(sx); sy = yuv(sy); sz = yuv(sz);
  r = Math.min(r, sx / 2 - 0.05, sy / 2 - 0.05, sz / 2 - 0.05);
  const anahtar = sx + '|' + sy + '|' + sz + '|' + r;
  let g = yuvarlakOnbellek.get(anahtar);
  if (g) return g;
  if (yuvarlakOnbellek.size > 1500) { for (const e of yuvarlakOnbellek.values()) e.dispose(); yuvarlakOnbellek.clear(); }
  const n = 5; // her kenarda 5 dilim: ortadaki düz yüz, yanlardaki ikişer dilim yuvarlatma
  g = new THREE.BoxGeometry(1, 1, 1, n, n, n).toNonIndexed();
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  const yari = new THREE.Vector3(sx / 2 - r, sy / 2 - r, sz / 2 - r), hs = 0.5 / n, yuzKose = pos.count / 6;
  const p = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    v.set(p.x - Math.sign(p.x) * hs, p.y - Math.sign(p.y) * hs, p.z - Math.sign(p.z) * hs).normalize();
    const X = yari.x * Math.sign(p.x) + v.x * r, Y = yari.y * Math.sign(p.y) + v.y * r, Z = yari.z * Math.sign(p.z) + v.z * r;
    pos.setXYZ(i, X, Y, Z); nor.setXYZ(i, v.x, v.y, v.z);
    const yuz = Math.floor(i / yuzKose); // 0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z: doku yüzün tamamına yayılır
    if (yuz < 2) uv.setXY(i, 0.5 + (yuz === 0 ? -1 : 1) * Z / sz, 0.5 + Y / sy);
    else if (yuz < 4) uv.setXY(i, 0.5 + X / sx, 0.5 + (yuz === 2 ? -1 : 1) * Z / sz);
    else uv.setXY(i, 0.5 + (yuz === 4 ? 1 : -1) * X / sx, 0.5 + Y / sy);
  }
  g.computeBoundingBox(); g.computeBoundingSphere();
  kutuGeo.add(g);
  yuvarlakOnbellek.set(anahtar, g);
  return g;
}
const doluMod = () => durum.mod === 'kati' || durum.mod === 'gercek';

// Kutu listesinden tek geometri: [x, y, z, sx, sy, sz, ...]. Kapak süslemeleri (çıta, kafes, kemer noktaları) tek tek ağ yerine
// malzeme başına tek ağ olarak çizilir; yüzlerce küçük kutu tek çizim çağrısına iner.
const KUTU_YUZ = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
function kutulardanGeo(a) {
  const n = a.length / 6, pos = new Float32Array(n * 72), nor = new Float32Array(n * 72), uv = new Float32Array(n * 48), ix = new Uint32Array(n * 36);
  for (let b = 0; b < n; b++) {
    const x = a[b * 6], y = a[b * 6 + 1], z = a[b * 6 + 2], c = [a[b * 6 + 3], a[b * 6 + 4], a[b * 6 + 5]];
    KUTU_YUZ.forEach((nr, f) => {
      const e = nr[0] ? 0 : nr[1] ? 1 : 2, u = (e + 1) % 3, v = (e + 2) % 3, poz = nr[e] > 0;
      for (let k = 0; k < 4; k++) {
        const q = [0, 0, 0], o = (b * 24 + f * 4 + k) * 3;
        q[e] = poz ? c[e] : 0; q[u] = k === 1 || k === 2 ? c[u] : 0; q[v] = k >= 2 ? c[v] : 0;
        pos[o] = x + q[0]; pos[o + 1] = y + q[1]; pos[o + 2] = z + q[2];
        nor[o] = nr[0]; nor[o + 1] = nr[1]; nor[o + 2] = nr[2];
      }
      const t = b * 24 + f * 4, i = (b * 6 + f) * 6;
      if (poz) { ix[i] = t; ix[i + 1] = t + 1; ix[i + 2] = t + 2; ix[i + 3] = t; ix[i + 4] = t + 2; ix[i + 5] = t + 3; }
      else { ix[i] = t; ix[i + 1] = t + 2; ix[i + 2] = t + 1; ix[i + 3] = t; ix[i + 4] = t + 3; ix[i + 5] = t + 2; }
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(ix, 1));
  return g;
}

let kirli = true; // bir sonraki karede yeniden çizim gerekli mi
const gecici = [];
// Lamba tipi: [gündüz şiddeti, akşam şiddeti, erişim (m)]
const ISIKLAR = { sarkit: [0.8, 2.4, 5], spot: [0.25, 0.9, 4.5], plafonyer: [1.2, 4.5, 7] };
let hemi, gunesIsik, dolguIsik, ortamTex;
const LED_MAT =new THREE.MeshBasicMaterial({ color: '#fff1c8' });
let VURGU = 0x1f7ae0; // seçili modülün çerçeve rengi: arayüz temasının vurgu rengi (vurguRengi ile verilir)
const UYARI = 0xd93a3a;
export function vurguRengi(hex) { const c = new THREE.Color(hex); VURGU = c.getHex(); kirli = true; }

let renderer, scene, cam, ortho, aktifKam, controls, kok, cb;
let durum = { mod: 'kati', kapakGizle: false };
let proje = null, secili = null, uyariSet = new Set();
const matOnbellek = new Map();
const ray = new THREE.Raycaster();
const fare = new THREE.Vector2();
let surukle = null;

export function kur(canvas, geriCagri) {
  cb = geriCagri;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // parlak yerler yanmadan yumuşar
  renderer.toneMappingExposure = 0.92;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9ecef');
  // Ortam ışığı ve yansımalar için küçük bir stüdyo ortamı: açık bir kutu ve birkaç ışık paneli.
  // Parlak yüzeyler (tezgah, inox, cam) bunu yansıtır.
  {
    const ortam = new THREE.Scene();
    ortam.add(new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10),
      new THREE.MeshBasicMaterial({ color: 0xa3a09a, side: THREE.BackSide })));
    // şerit ışıklar: metal ve parlak yüzeylerde uzun, net yansıma çizgileri verir
    for (const [x, z, w, d] of [[-2.2, -3.5, 0.35, 5], [2.4, 3.2, 5, 0.3], [4.2, -1, 0.3, 4]]) {
      const serit = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5, 4.8), side: THREE.DoubleSide }));
      serit.position.set(x, 2.9, z); serit.rotation.x = Math.PI / 2; ortam.add(serit);
    }
    const panel = (x, y, z, w, h, renk, bak) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: renk, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(...bak); ortam.add(m);
    };
    panel(0, 2.95, 0, 6, 6, 0xffffff, [0, 0, 0]);       // tavan ışığı
    panel(-4.9, 0.5, 0, 5, 3, 0xdfe9ff, [0, 0.5, 0]);   // soldan pencere ışığı
    panel(3, 0.5, 4.9, 4, 2.5, 0xfff0d6, [0, 0.5, 0]);  // önden sıcak dolgu
    const pmrem = new THREE.PMREMGenerator(renderer);
    ortamTex = pmrem.fromScene(ortam, 0.03).texture;
    scene.environment = ortamTex;
    pmrem.dispose();
  }
  cam = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
  ortho = new THREE.OrthographicCamera(-3, 3, 3, -3, -50, 100);
  aktifKam = cam;

  hemi = new THREE.HemisphereLight(0xffffff, 0xb9b3a8, 0.55); // ortam haritası da ışık verdiği için kısık
  scene.add(hemi);
  const gunes = gunesIsik = new THREE.DirectionalLight(0xfff4e2, 1.9);
  gunes.shadow.radius = 5;
  gunes.position.set(4, 7, 6);
  gunes.castShadow = true;
  gunes.shadow.mapSize.set(2048, 2048);
  Object.assign(gunes.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 });
  gunes.shadow.bias = -0.0004;
  scene.add(gunes, gunes.target);
  const dolgu = dolguIsik = new THREE.DirectionalLight(0xdfe9ff, 0.45);
  dolgu.position.set(-5, 4, 3);
  dolgu.shadow.mapSize.set(2048, 2048); dolgu.shadow.radius = 9; dolgu.shadow.bias = -0.0005; dolgu.shadow.normalBias = 0.03;
  scene.add(dolgu, dolgu.target);

  kok = new THREE.Group();
  kok.scale.setScalar(0.001);
  scene.add(kok);

  controls = new OrbitControls(cam, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 0.6;
  controls.maxDistance = 25;

  canvas.style.touchAction = 'none';
  // Telefon: gölge haritası ve durgun karedeki üst örnekleme küçük tutulur (bellek ve pil)
  hafif = (navigator.maxTouchPoints || 0) > 0 && Math.min(screen.width, screen.height) <= 820;
  // Dokunmatik: ekrandaki parmaklar izlenir. Yakalama aşamasında dinlenir ki kamera denetiminden önce çalışsın:
  // ikinci parmak inince modül taşıma bırakılır, iki parmak görüşü yakınlaştırır ve kaydırır.
  canvas.parentElement?.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || e.target !== canvas) return;
    parmak.add(e.pointerId);
    if (parmak.size > 1 && surukle) {
      const s = surukle; surukle = null; controls.enabled = true;
      if (s.oynadi) cb.tasiBitti(s.id);
    }
  }, true);
  for (const ad of ['pointerup', 'pointercancel']) window.addEventListener(ad, e => parmak.delete(e.pointerId), true);
  canvas.addEventListener('pointerdown', bas);
  canvas.addEventListener('pointermove', oynat);
  canvas.addEventListener('pointerup', birak);
  canvas.addEventListener('pointercancel', birak);
  canvas.addEventListener('pointerleave', () => { if (yerOnizle) { cancelAnimationFrame(onizleKare); hayalet(null); } });

  const boyutla = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const onceki = cam.aspect;
    cam.aspect = w / h; cam.updateProjectionMatrix();
    // Dik (dar) çizim alanında odayı yatay görüş açısı sığdırır. Alanın boyu değişince (telefonda panel açılıp
    // kapanınca) kamera aynı oranda yaklaşır ya da uzaklaşır; oda ekranda aynı genişlikte kalır, küçülmez.
    if (proje && onceki !== cam.aspect) {
      const dusey = THREE.MathUtils.degToRad(cam.fov) / 2, sig = o => Math.sin(Math.min(dusey, Math.atan(Math.tan(dusey) * o)));
      const k = sig(onceki) / sig(cam.aspect);
      if (Math.abs(k - 1) > 0.01) {
        const v = cam.position.clone().sub(controls.target);
        v.setLength(Math.min(controls.maxDistance, Math.max(controls.minDistance, v.length() * k)));
        cam.position.copy(controls.target).add(v);
      }
    }
    orthoAyarla();
    kirli = true;
  };
  new ResizeObserver(boyutla).observe(canvas);
  boyutla();

  // Yalnızca bir şey değiştiğinde çizilir (kamera hareketi, yeni çizim, boyut değişimi, sunum dönüşü).
  // Boşta işlemci ve pil harcanmaz; gölge haritası da yalnızca sahne değişince yenilenir.
  renderer.shadowMap.autoUpdate = false;
  // Netlik: hareket sırasında ekran çözünürlüğünde, sahne durunca bir kez daha yüksek çözünürlükte (üst örnekleme)
  // çizilir; kenarlardaki tırtıklar ve ince çizgilerdeki kırılma kaybolur. En çok 9 milyon piksel.
  const tabanOran = Math.min(window.devicePixelRatio || 1, 2);
  let net = false, sonCizim = 0, hareketli = true;
  const netOran = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    return Math.max(tabanOran, Math.min(hafif ? 2.5 : 3, tabanOran * (hafif ? 1.25 : 2), Math.sqrt((hafif ? 4e6 : 9e6) / (w * h))));
  };
  const oranKoy = o => { renderer.setPixelRatio(o); renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); };
  const dongu = () => {
    if (renderde) { requestAnimationFrame(dongu); return; } // yüksek kalite görüntü alınırken ekran çizimi bekler
    const oynadi = controls.update(), simdi = performance.now();
    if (oynadi || kirli || controls.autoRotate) {
      if (net) { oranKoy(tabanOran); net = false; }
      kirli = false;
      gorunurluk();
      renderer.render(scene, aktifKam);
      sonCizim = simdi;
      hareketli = true; cb.cizildi?.(oynadi || controls.autoRotate); // canlı fotoğraf: kamera oynadıysa ya da sahne değiştiyse fotoğraf geçersiz
    } else {
      if (!net && !surukle && simdi - sonCizim > 220 && netOran() > tabanOran + 0.1 && canvas.clientWidth) {
        oranKoy(netOran()); net = true;
        gorunurluk();
        kareCiz();
      }
      if (hareketli && !surukle && simdi - sonCizim > 380) { hareketli = false; cb.durgun?.(); } // sahne durdu
    }
    requestAnimationFrame(dongu);
  };
  dongu();
}

// Kamera bir duvarın belirgin biçimde arkasına geçince o duvarın dolapları da (duvarın kendisi gibi) gizlenir;
// böylece öndeki duvarın dolapları mutfağın içini kapatmaz. Plan görünüşünde uygulanmaz.
function gorunurluk() {
  if (!proje) return;
  const gizli = new Set();
  if (aktifKam === cam) {
    const W = proje.oda.w / 1000, D = proje.oda.d / 1000, H = proje.oda.h / 2000, c = cam.position;
    const bak = (ad, mx, mz, nx, nz) => {
      const vx = c.x - mx, vy = c.y - H, vz = c.z - mz, u = Math.hypot(vx, vy, vz) || 1;
      if ((vx * nx + vz * nz) / u > 0.5) gizli.add(ad); // yaklaşık 60°'den dik bakışta gizle; yandan bakışta görünür kalsın
    };
    bak('arka', W / 2, 0, 0, -1); bak('on', W / 2, D, 0, 1);
    bak('sol', 0, D / 2, -1, 0); bak('sag', W, D / 2, 1, 0);
  }
  // duvara asılı dekor (tablo, saat): kamera o duvarın arkasındaysa duvar görünmez, asılı eşya da havada kalmasın
  const W2 = proje.oda.w / 1000, D2 = proje.oda.d / 1000, k = aktifKam.position;
  const arkasinda = aktifKam === cam ? { arka: k.z < 0, on: k.z > D2, sol: k.x < 0, sag: k.x > W2 } : {};
  for (const o of kok.children) {
    const d = o.userData.duvar;
    if (d) o.visible = !gizli.has(d) && !(o.userData.asili && arkasinda[d]);
  }
}

// Sunum modu: kamera odanın çevresinde kendiliğinden döner
export function sunum(acik) {
  controls.autoRotate = acik;
  controls.autoRotateSpeed = 0.9;
}

function orthoAyarla() {
  if (!proje) return;
  const c = renderer.domElement, oran = c.clientWidth / Math.max(1, c.clientHeight);
  const yari = Math.max(proje.oda.d, proje.oda.w / oran) / 2000 * 1.12;
  ortho.left = -yari * oran; ortho.right = yari * oran; ortho.top = yari; ortho.bottom = -yari;
  ortho.updateProjectionMatrix();
}

// ---- Malzeme -----------------------------------------------------------------

// Desenler: açık zeminli gri tonlu dokular; malzeme rengiyle çarpılır, böylece renk seçimi korunur.
const desenOnbellek = {};
function desenTex(ad) {
  if (desenOnbellek[ad]) return desenOnbellek[ad];
  const c = document.createElement('canvas');
  c.width = c.height = 1024; // çizim 512'lik koordinatta yapılır, tuval iki kat çözünürlüktedir: yakından da net
  const g = c.getContext('2d');
  g.scale(2, 2);
  let s = ad.length * 9973 + 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#f7f5f1'; g.fillRect(0, 0, 512, 512);
  const damar = (n, a0, a1, kalin) => { // dikey ahşap damarı
    for (let i = 0; i < n; i++) {
      let x = rnd() * 512;
      g.strokeStyle = `rgba(70,45,20,${a0 + rnd() * a1})`; g.lineWidth = 0.6 + rnd() * kalin;
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 64; y <= 512; y += 64) { x += (rnd() - 0.5) * 7; g.lineTo(x, y); }
      g.stroke();
    }
  };
  if (ad === 'ahsap') {
    for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(70,45,20,${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * 512, 0, 10 + rnd() * 50, 512); }
    damar(230, 0.04, 0.17, 2.2);
  } else if (ad === 'mermer') {
    g.fillStyle = '#fcfcfb'; g.fillRect(0, 0, 512, 512);
    // bulutlu zemin: çok saydam, büyük lekeler
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 512, y = rnd() * 512, r = 30 + rnd() * 110, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(120,126,138,${0.02 + rnd() * 0.035})`); gr.addColorStop(1, 'rgba(120,126,138,0)');
      g.fillStyle = gr;
      for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) { g.setTransform(2, 0, 0, 2, dx * 2, dy * 2); g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    }
    // damarlar: çapraz akan, hafifçe kıvrılan, yer yer dallanan ince çizgiler; her birinin çevresinde yumuşak bir hale.
    // Doku kenarlarında dikiş olmasın diye her damar dokuz kaydırılmış kopyayla çizilir.
    const yollar = [];
    const damarYolu = (x, y, aci, adim, n, sapma) => {
      const yol = [[x, y]];
      for (let i = 0; i < n; i++) { aci += (rnd() - 0.5) * sapma; x += Math.cos(aci) * adim; y += Math.sin(aci) * adim; yol.push([x, y]); }
      return yol;
    };
    const ana = 0.9 + rnd() * 0.5; // damarların ortak akış yönü
    for (let i = 0; i < 7; i++) {
      const yol = damarYolu(rnd() * 512, rnd() * 512, ana + (rnd() - 0.5) * 0.5, 16, 34, 0.45);
      yollar.push({ yol, kalin: 0.7 + rnd() * 1.6, alfa: 0.16 + rnd() * 0.2 });
      for (let k = 4; k < yol.length; k += 5 + Math.floor(rnd() * 6)) { // dallar
        yollar.push({ yol: damarYolu(yol[k][0], yol[k][1], ana + (rnd() < 0.5 ? 1 : -1) * (0.5 + rnd() * 0.6), 9, 8 + Math.floor(rnd() * 10), 0.6), kalin: 0.4 + rnd() * 0.5, alfa: 0.08 + rnd() * 0.1 });
      }
    }
    g.lineCap = g.lineJoin = 'round';
    for (const { yol, kalin, alfa } of yollar) {
      for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) {
        g.setTransform(2, 0, 0, 2, dx * 2, dy * 2);
        for (const [gen, a] of [[kalin * 9, alfa * 0.1], [kalin * 3.5, alfa * 0.25], [kalin, alfa]]) {
          g.strokeStyle = `rgba(92,98,110,${a})`; g.lineWidth = gen;
          g.beginPath(); g.moveTo(yol[0][0], yol[0][1]);
          for (let i = 1; i < yol.length; i++) g.lineTo(yol[i][0], yol[i][1]);
          g.stroke();
        }
      }
    }
    g.setTransform(2, 0, 0, 2, 0, 0);
  } else if (ad === 'parke') {
    const kol = 6, en = 512 / kol;
    for (let k = 0; k < kol; k++) {
      const kay = rnd() * 256;
      for (let y = -256 + kay; y < 512; y += 256) {
        g.fillStyle = `rgba(70,40,12,${rnd() * 0.16})`; g.fillRect(k * en, y, en, 256);
        g.strokeStyle = 'rgba(35,22,10,0.5)'; g.lineWidth = 1.5; g.strokeRect(k * en, y, en, 256);
      }
    }
    damar(150, 0.03, 0.1, 1.4);
  } else if (ad === 'karo') {
    g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(90,90,90,${rnd() * 0.035})`; g.fillRect(rnd() * 512, rnd() * 512, 20 + rnd() * 60, 20 + rnd() * 60); }
    g.strokeStyle = 'rgba(70,70,70,0.5)'; g.lineWidth = 5;
    for (const v of [0, 256, 512]) { g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 512); g.moveTo(0, v); g.lineTo(512, v); g.stroke(); }
  }
  else if (ad === 'metro' || ad === 'fayans' || ad === 'mozaik' || ad === 'tugla') {
    // Karo örgüleri. Doku 600 mm'lik (tuğlada 750 mm) bir kareyi kaplar; derz açık gri.
    const [kol, sat, kaydir] = { metro: [4, 8, true], fayans: [3, 3, false], mozaik: [12, 12, false], tugla: [3, 10, true] }[ad];
    const en = 512 / kol, boy = 512 / sat, derz = ad === 'mozaik' ? 3 : ad === 'tugla' ? 6 : 4;
    g.fillStyle = ad === 'tugla' ? '#d9d6d0' : '#dcdcd8'; g.fillRect(0, 0, 512, 512);
    for (let r = 0; r < sat; r++) {
      const kay = kaydir && r % 2 ? en / 2 : 0;
      for (let k = -1; k <= kol; k++) {
        const ton = 247 + Math.round(rnd() * 8) - (ad === 'tugla' ? 10 + Math.round(rnd() * 14) : 0);
        g.fillStyle = `rgb(${ton},${ton},${ton - 2})`;
        g.fillRect(k * en + kay + derz / 2, r * boy + derz / 2, en - derz, boy - derz);
      }
    }
  } else if (ad === 'kagit') { // ince dikey çizgili duvar kağıdı
    g.fillStyle = '#fbfaf8'; g.fillRect(0, 0, 512, 512);
    for (let x = 0; x < 512; x += 64) { g.fillStyle = 'rgba(60,60,70,0.10)'; g.fillRect(x, 0, 26, 512); g.fillStyle = 'rgba(60,60,70,0.16)'; g.fillRect(x + 40, 0, 3, 512); }
  } else if (ad === 'beton') { // brüt beton: bulutlu yüzey, kalıp derzleri
    g.fillStyle = '#eeeeec'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 420; i++) { g.fillStyle = `rgba(60,60,60,${rnd() * 0.05})`; g.beginPath(); g.arc(rnd() * 512, rnd() * 512, 6 + rnd() * 46, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(40,40,40,0.22)'; g.lineWidth = 2;
    for (const v of [0, 512]) { g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 512); g.moveTo(0, v); g.lineTo(512, v); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return (desenOnbellek[ad] = t);
}
const tekrar = v => Math.max(0.25, Math.round(v * 4) / 4);

// Katalogdan seçilmiş tezgah plakası: resmi bir kez yüklenir; 3B çizimde doku, fotoğrafta motorun resim dokusu (malzeme 18) olur.
// Resim gelene dek tezgah plakanın ortalama rengiyle düz çizilir; gelince sahne kendiliğinden yeniden kurulur.
let plakaSec = null, sonOps = null;
const plakaOnbellek = new Map();
function plaka(id) {
  let k = plakaOnbellek.get(id);
  if (k) return k;
  k = { tex: null, veri: null, hazir: false };
  plakaOnbellek.set(id, k);
  const im = new Image();
  im.onload = () => {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    try {
      const d = g.getImageData(0, 0, c.width, c.height).data, o = new Uint8Array(c.width * c.height * 3);
      for (let i = 0, j = 0; i < d.length; i += 4) { o[j++] = d[i]; o[j++] = d[i + 1]; o[j++] = d[i + 2]; }
      k.veri = { w: c.width, h: c.height, d: o };
    } catch { /* piksel okunamadıysa fotoğrafta düz renk kullanılır */ }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    k.tex = t; k.hazir = true;
    if (proje && sonOps && plakaSec?.id === id) ciz(proje, sonOps);
  };
  /* yayın kopyasında plaka resmi yok: tezgah katalog rengiyle çizilir */
  return k;
}

function mat(renk, tur, desen, ru = 1, rv = 1) {
  let plk = null;
  if (tur === 'tezgah' && plakaSec && durum.mod !== 'tel') { // katalog plakası: renk dokudan gelir; resim 'olcek' cm genişliği, yarısı kadar derinliği kaplar
    const k = plaka(plakaSec.id);
    if (k.hazir) {
      plk = k; renk = '#ffffff'; desen = `plaka:${plakaSec.id}:${plakaSec.parlak ? 1 : 0}`;
      ru = Math.max(0.05, Math.round(ru * 1200 / (plakaSec.olcek * 10) * 20) / 20); rv = Math.max(0.05, Math.round(rv * 1200 / (plakaSec.olcek * 5) * 20) / 20);
    } else desen = 'duz';
  }
  const d = desen && desen !== 'duz' && durum.mod !== 'tel' ? desen : '';
  const anahtar = [renk, tur, durum.mod, d, d ? ru : 1, d ? rv : 1].join('|');
  let m = matOnbellek.get(anahtar);
  if (m) return m;
  if (matOnbellek.size > 600) { // renk sürüklerken biriken malzemeleri boşalt
    for (const e of matOnbellek.values()) { e.map?.dispose(); e.dispose(); }
    matOnbellek.clear();
  }
  const metal = tur === 'inox' || tur === 'kulp';
  // Pürüzlülük yüzeye göre: tezgah ve siyah cam parlak, kapak yarı mat, gövde mat
  const puruz = metal ? 0.28 : tur === 'siyah' ? 0.12 : tur === 'tezgah' ? 0.22 : tur === 'kapak' ? 0.48
    : tur === 'arasi' ? 0.3 : tur === 'ayna' ? 0.03 : 0.75;
  if (durum.mod === 'gercek') {
    // Gerçekçi görünüm: fiziksel malzeme. Lake kapak ve taş tezgahta ince bir vernik katı, metalde daha net yansıma,
    // desenli yüzeylerde dokunun kabartması.
    m = new THREE.MeshPhysicalMaterial({
      color: renk, metalness: tur === 'ayna' ? 1 : metal ? 0.92 : 0,
      roughness: metal ? 0.24 : tur === 'siyah' ? 0.07 : tur === 'tezgah' ? 0.2 : tur === 'kapak' ? (d === 'ahsap' ? 0.6 : 0.4) : tur === 'arasi' ? 0.22 : tur === 'ayna' ? 0.02 : tur === 'seramik' ? 0.25 : tur === 'koyu' ? 0.5 : 0.72,
      clearcoat: tur === 'tezgah' ? 0.55 : tur === 'siyah' ? 1 : tur === 'kapak' && d !== 'ahsap' ? 0.22 : tur === 'arasi' || tur === 'seramik' ? 0.5 : 0,
      clearcoatRoughness: tur === 'siyah' ? 0.04 : 0.2,
      envMapIntensity: tur === 'ayna' ? 1.4 : metal ? 1.35 : tur === 'siyah' ? 1.2 : tur === 'tezgah' || tur === 'arasi' ? 0.8 : tur === 'kapak' ? 0.55 : 0.4,
    });
  } else {
    m = new THREE.MeshStandardMaterial({
      color: renk, roughness: puruz, metalness: tur === 'ayna' ? 1 : metal ? 0.75 : 0,
      envMapIntensity: tur === 'ayna' ? 1.3 : metal ? 1.1 : 0.75,
    });
  }
  if (plk) { // katalog plakası: parlak yüzeyde vernikli ve net yansımalı, mat yüzeyde yumuşak
    const t = plk.tex.clone(); t.repeat.set(ru, rv); t.needsUpdate = true; m.map = t;
    m.roughness = plakaSec.parlak ? 0.1 : 0.5;
    if (m.isMeshPhysicalMaterial) { m.clearcoat = plakaSec.parlak ? 0.7 : 0.06; m.envMapIntensity = plakaSec.parlak ? 0.95 : 0.55; }
  } else if (d) {
    const t = desenTex(d).clone(); t.repeat.set(ru, rv); t.needsUpdate = true; m.map = t;
    if (durum.mod === 'gercek' && d !== 'mermer') { m.bumpMap = t; m.bumpScale = d === 'ahsap' ? 0.35 : 0.8; } // damar ve derz hafif kabarık
  }
  if (tur === 'cambuzlu') { m.transparent = true; m.opacity = 0.62; m.roughness = 0.6; m.depthWrite = false; } // nervürlü, satina ve buzlu cam: içerisi seçilmez
  if (tur === 'cam') { m.transparent = true; m.opacity = durum.mod === 'gercek' ? 0.24 : 0.32; m.roughness = durum.mod === 'gercek' ? 0.02 : 0.05; m.depthWrite = false; if (durum.mod === 'gercek') m.envMapIntensity = 1.6; }
  if (tur === 'tul') { m.transparent = true; m.opacity = 0.5; m.depthWrite = false; m.roughness = 0.95; } // tül: arkası seçilir
  if (durum.mod === 'seffaf') { m.transparent = true; m.opacity = tur === 'cam' ? 0.15 : 0.3; m.depthWrite = false; }
  if (durum.mod === 'tel') { m.transparent = true; m.opacity = 0; m.depthWrite = false; }
  m.userData.tur = tur; m.userData.desen = d; // fotoğraf dökümü malzemeyi bu iki bilgiden tanır
  matOnbellek.set(anahtar, m);
  return m;
}

const cizgiMat = {};
function cizgi(renk, opak) {
  const a = renk + '|' + opak;
  return cizgiMat[a] || (cizgiMat[a] = new THREE.LineBasicMaterial({ color: renk, transparent: opak < 1, opacity: opak }));
}

const renkBul = (p, m) => parcaRengi(p, m, proje.renk);

// r: kenar yuvarlatma yarıçapı (mm); yalnızca gerçekçi görünümde ve yeterince kalın parçalarda uygulanır
function kutuEkle(grup, x, y, z, sx, sy, sz, malzeme, kenarMat, golge = true, r = 0) {
  const yuvarlak = r > 0 && durum.mod === 'gercek' && Math.min(sx, sy, sz) >= 2.2 * r;
  const mesh = new THREE.Mesh(yuvarlak ? yuvarlakKutu(sx, sy, sz, r) : KUTU, malzeme);
  if (!yuvarlak) mesh.scale.set(sx, sy, sz);
  mesh.position.set(x + sx / 2, y + sy / 2, z + sz / 2);
  const katı = doluMod();
  mesh.castShadow = katı && golge; mesh.receiveShadow = katı;
  grup.add(mesh);
  if (kenarMat) {
    const l = new THREE.LineSegments(KENAR, kenarMat);
    const pay = yuvarlak ? 0.9 : 0; // yuvarlatılmış parçada çizgi yüzeyin hemen dışında dursun, titreşmesin
    l.scale.set(sx + pay, sy + pay, sz + pay); l.position.copy(mesh.position);
    l.raycast = () => {};
    grup.add(l);
  }
  return mesh;
}

// ---- Sahne dekoru ---------------------------------------------------------------
// dekor.js'in ürettiği cisimler (kutu, elipsoit, silindir, kesik koni) çizilir. Aynı biçim ve malzemedeki cisimler tek çizim
// çağrısında toplanır (InstancedMesh), renk cisim başına verilir. Duvara dayalı gruplar o duvarın dolaplarıyla birlikte gizlenir.
// Fotoğraf dökümü aynı listeyi kullanır: yuvarlak cisimler fotoğrafta da yuvarlaktır.
const DEKOR_GEO = new Map(), DEKOR_MAT = new Map();
let dekorAglar = [];
function dekorGeo(s, k) {
  const a = s === 0 ? 'k' : s === 1 || s === 5 ? 'e' : 's' + Math.round((k || 1) * 50);
  let g = DEKOR_GEO.get(a);
  if (!g) {
    if (s === 0) g = KUTU;
    else if (s === 1 || s === 5) g = new THREE.SphereGeometry(0.5, 22, 16);
    else { const p = k || 1, kb = p > 1 ? 2 - p : 1, kt = p > 1 ? 1 : p; g = new THREE.CylinderGeometry(0.5 * kt, 0.5 * kb, 1, 28); }
    DEKOR_GEO.set(a, g);
  }
  return g;
}
function dekorMat(kod) { // kod: fotoğraf motorunun malzeme kodu
  let m = DEKOR_MAT.get(kod);
  if (m) return m;
  if (kod === 9) m = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  else m = new THREE.MeshPhysicalMaterial({ color: '#ffffff', envMapIntensity: kod === 4 || kod === 11 ? 1.3 : kod === 6 ? 0.8 : 0.45,
    ...(kod === 4 ? { metalness: 1, roughness: 0.18 } : kod === 11 ? { metalness: 0.9, roughness: 0.34 } : kod === 6 ? { roughness: 0.14, clearcoat: 0.8, clearcoatRoughness: 0.1 }
      : kod === 5 ? { roughness: 0.03, transparent: true, opacity: 0.34, depthWrite: false } : kod === 8 ? { roughness: 0.8 } : kod === 17 ? { roughness: 1 } : kod === 2 ? { roughness: 0.6 } : kod === 3 ? { roughness: 0.3 } : { roughness: 0.45 }) });
  DEKOR_MAT.set(kod, m);
  return m;
}
const DEKOR_QX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2), DEKOR_QZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2), DEKOR_Q0 = new THREE.Quaternion();
function dekorCiz(p) {
  for (const a of dekorAglar) a.dispose();
  dekorAglar = [];
  const liste = durum.mod === 'gercek' ? dekorUret(p) : [], gruplar = new Map();
  for (const d of liste) { const a = [d.d, d.as ? 1 : 0, d.s === 5 ? 1 : d.s, d.s >= 2 && d.s <= 4 ? Math.round((d.k || 1) * 50) : 0, d.m].join('|'); (gruplar.get(a) || gruplar.set(a, []).get(a)).push(d); }
  const M4 = new THREE.Matrix4(), P3 = new THREE.Vector3(), S3 = new THREE.Vector3(), rk = new THREE.Color();
  for (const l of gruplar.values()) {
    const d0 = l[0], ag = new THREE.InstancedMesh(dekorGeo(d0.s, d0.k), dekorMat(d0.m), l.length);
    l.forEach((d, i) => {
      const [x0, y0, z0, x1, y1, z1] = d.b, sx = x1 - x0, sy = y1 - y0, sz = z1 - z0;
      P3.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      if (d.s === 5) { // eğik elipsoit: üç ekseni ve yarıçaplarıyla
        const e = d.e;
        M4.set(e[6] * 2 * e[3], e[9] * 2 * e[4], e[12] * 2 * e[5], e[0], e[7] * 2 * e[3], e[10] * 2 * e[4], e[13] * 2 * e[5], e[1], e[8] * 2 * e[3], e[11] * 2 * e[4], e[14] * 2 * e[5], e[2], 0, 0, 0, 1);
        ag.setMatrixAt(i, M4);
      } else {
        if (d.s === 3) S3.set(sy, sx, sz); else if (d.s === 4) S3.set(sx, sz, sy); else S3.set(sx, sy, sz); // yatay silindirde geometrinin ekseni döndürülür
        ag.setMatrixAt(i, M4.compose(P3, d.s === 3 ? DEKOR_QX : d.s === 4 ? DEKOR_QZ : DEKOR_Q0, S3));
      }
      ag.setColorAt(i, rk.set(d.r));
    });
    ag.instanceMatrix.needsUpdate = true;
    if (ag.instanceColor) ag.instanceColor.needsUpdate = true;
    ag.castShadow = d0.m !== 5 && d0.m !== 9; ag.receiveShadow = d0.m !== 9;
    ag.frustumCulled = false; ag.raycast = () => {};
    ag.userData.dekor = l;
    if (d0.d) ag.userData.duvar = d0.d;
    if (d0.as) ag.userData.asili = true;
    kok.add(ag); dekorAglar.push(ag);
  }
}

// ---- Çizim --------------------------------------------------------------------

export function ciz(p, ops = {}) {
  proje = p; sonOps = ops; plakaSec = tezgahSecimi(p);
  secili = ops.secili ?? null;
  seciliKume = ops.secililer || new Set();
  uyariSet = ops.uyari || new Set();
  durum.mod = ops.mod || 'kati';
  durum.kapakGizle = !!ops.kapakGizle;
  kok.clear();
  for (const g of gecici) g.dispose(); // önceki çizimin tek kullanımlık geometrileri
  gecici.length = 0;
  const { oda, renk } = p;
  // Akşam görünümü: gün ışığı ve ortam ışığı kısılır, lambalar öne çıkar
  const aksam = !!ops.aksam && durum.mod !== 'tel';
  scene.background.set(durum.mod === 'tel' ? '#10161d' : aksam ? '#141a22' : '#e9ecef');
  const gercek = durum.mod === 'gercek';
  hemi.intensity = aksam ? 0.07 : gercek ? 0.2 : 0.55; gunesIsik.intensity = aksam ? 0.05 : gercek ? 2.9 : 1.9; dolguIsik.intensity = aksam ? 0.04 : gercek ? 0.7 : 0.45;
  scene.environment = aksam ? null : ortamTex;
  renderer.toneMappingExposure = aksam ? 0.8 : gercek ? 0.9 : 0.92;
  const tel = durum.mod === 'tel';
  { // Gölge alanı odaya göre daraltılır: aynı gölge haritası daha küçük alana yayıldığı için gölgeler keskinleşir
    const R = Math.hypot(oda.w, oda.d, oda.h) / 2000 + 0.4, merkez = new THREE.Vector3(oda.w / 2000, oda.h / 2000, oda.d / 2000);
    const yerlestir = (isik, yon, boyut) => {
      isik.target.position.copy(merkez);
      isik.position.copy(merkez).addScaledVector(yon.normalize(), R * 2 + 3);
      Object.assign(isik.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 0.5, far: R * 4 + 6 });
      isik.shadow.camera.updateProjectionMatrix();
      if (isik.shadow.mapSize.x !== boyut) { isik.shadow.mapSize.set(boyut, boyut); isik.shadow.map?.dispose(); isik.shadow.map = null; }
    };
    yerlestir(gunesIsik, new THREE.Vector3(4, 7, 6), gercek && !hafif ? 4096 : 2048);
    yerlestir(dolguIsik, new THREE.Vector3(-5, 4, 3), 2048);
    gunesIsik.shadow.radius = gercek ? 3.5 : 5; gunesIsik.shadow.normalBias = 0.02;
    dolguIsik.castShadow = gercek && !aksam; // ikinci, yumuşak gölge: köşelerde ve dolap altlarında derinlik verir
  }

  // Oda: zemin ve içe bakan dört duvar (dışarıdan bakınca öndeki duvar görünmez)
  const ds = p.desen || {};
  const zm = new THREE.MeshStandardMaterial({ color: renk.zemin, roughness: 0.85, transparent: tel, opacity: tel ? 0.06 : 1 });
  if (!tel && ds.zemin && ds.zemin !== 'duz') {
    const t = desenTex(ds.zemin).clone();
    // döşeme yönü: 0 yan duvar boyunca, 90 arka duvar boyunca, 45 çapraz
    const yon = Number(ds.zeminYon) || 0;
    t.center.set(0.5, 0.5); t.rotation = yon * Math.PI / 180;
    t.repeat.set(oda.w / 1200, oda.d / 1200); t.needsUpdate = true; zm.map = t;
    if (gercek) { zm.bumpMap = t; zm.bumpScale = 0.6; }
  }
  if (gercek) { zm.roughness = ds.zemin === 'mermer' || ds.zemin === 'karo' ? 0.28 : 0.55; zm.envMapIntensity = 0.45; }
  const zemin = new THREE.Mesh(new THREE.PlaneGeometry(oda.w, oda.d), zm);
  zemin.rotation.x = -Math.PI / 2; zemin.position.set(oda.w / 2, 0, oda.d / 2);
  zemin.receiveShadow = !tel; zemin.userData.zemin = true; zemin.userData.yapi = true;
  kok.add(zemin);
  // Tavan: aşağı bakan tek yüzlü düzlem; yukarıdan bakınca görünmez, iç görünüşte görünür
  const tavan = new THREE.Mesh(new THREE.PlaneGeometry(oda.w, oda.d),
    new THREE.MeshStandardMaterial({ color: '#fbfaf7', roughness: 0.95, transparent: tel, opacity: tel ? 0.03 : 1 }));
  tavan.rotation.x = Math.PI / 2; tavan.position.set(oda.w / 2, oda.h, oda.d / 2);
  tavan.raycast = () => {}; tavan.userData.yapi = true;
  kok.add(tavan);
  // Asma tavan: duvar boyunca düşük kuşak. Alt yüz aşağı, iç yüz odaya bakar; her parça kendi duvarıyla birlikte gizlenir.
  if (p.ayar?.asmaTavan && !tel) {
    const en = Math.min(500, oda.w / 3, oda.d / 3), dus = 150, y = oda.h - dus, am = tavan.material;
    const parca = (ad, w, d, x, z, donY) => {
      const alt = new THREE.Mesh(new THREE.PlaneGeometry(w, d), am);
      alt.rotation.x = Math.PI / 2; alt.position.set(x, y, z);
      const ic = new THREE.Mesh(new THREE.PlaneGeometry(donY % Math.PI === 0 ? w : d, dus), am);
      ic.rotation.y = donY;
      ic.position.set(ad === 'sol' ? en : ad === 'sag' ? oda.w - en : x, y + dus / 2, ad === 'arka' ? en : ad === 'on' ? oda.d - en : z);
      for (const o of [alt, ic]) { o.userData.duvar = ad; o.userData.yapi = true; o.raycast = () => {}; gecici.push(o.geometry); kok.add(o); }
    };
    parca('arka', oda.w, en, oda.w / 2, en / 2, 0);
    parca('on', oda.w, en, oda.w / 2, oda.d - en / 2, Math.PI);
    parca('sol', en, oda.d, en / 2, oda.d / 2, Math.PI / 2);
    parca('sag', en, oda.d, oda.w - en / 2, oda.d / 2, -Math.PI / 2);
  }
  // Eğimli tavan: seçili duvarda `dusuk` yüksekliğinden başlayıp `mesafe` sonra oda yüksekliğine ulaşan düzlem.
  // Aşağı bakan tek yüz: yukarıdan bakınca görünmez, iç görünüşte görünür.
  const eg = p.ayar?.egim;
  if (eg?.duvar && !tel) {
    const x = eg.duvar === 'sol' || eg.duvar === 'sag', boy = x ? oda.d : oda.w;
    const mes = Math.min(eg.mesafe, x ? oda.w : oda.d), yuk = oda.h - eg.dusuk;
    const egim = new THREE.Mesh(new THREE.PlaneGeometry(boy, Math.hypot(mes, yuk)), tavan.material);
    gecici.push(egim.geometry);
    const aci = Math.atan2(yuk, mes); // yataydan yukarı açı
    // Düzlemin merkezi: duvardan mes/2 içeride, eğimin orta yüksekliğinde
    const orta = eg.dusuk + yuk / 2;
    if (eg.duvar === 'arka') { egim.position.set(oda.w / 2, orta, mes / 2); egim.rotation.set(Math.PI / 2 - aci, 0, 0); }
    if (eg.duvar === 'on') { egim.position.set(oda.w / 2, orta, oda.d - mes / 2); egim.rotation.set(Math.PI / 2 + aci, 0, 0); }
    if (eg.duvar === 'sol') { egim.rotation.order = 'YXZ'; egim.position.set(mes / 2, orta, oda.d / 2); egim.rotation.set(Math.PI / 2 - aci, Math.PI / 2, 0); }
    if (eg.duvar === 'sag') { egim.rotation.order = 'YXZ'; egim.position.set(oda.w - mes / 2, orta, oda.d / 2); egim.rotation.set(Math.PI / 2 - aci, -Math.PI / 2, 0); }
    egim.userData.duvar = eg.duvar; egim.userData.yapi = true; egim.raycast = () => {};
    kok.add(egim);
  }
  const dm = new THREE.MeshStandardMaterial({ color: renk.duvar, roughness: 0.95, transparent: tel, opacity: tel ? 0.04 : 1 });
  if (gercek) dm.envMapIntensity = 0.3; // duvar ortam ışığından az pay alsın: dolap gölgeleri ve hacim belirginleşir
  if (!tel && ds.duvar && ds.duvar !== 'duz') { // duvar yüzeyinin doku koordinatı milimetredir: doku 600 mm'de (tuğla ve beton 750 / 1200 mm) bir yinelenir
    const t = desenTex(ds.duvar).clone(), periyot = ds.duvar === 'tugla' ? 750 : ds.duvar === 'beton' ? 1200 : 600;
    t.repeat.set(1 / periyot, 1 / periyot); t.needsUpdate = true; dm.map = t;
    gecici.push(t);
  }
  // Duvar: içe bakan tek yüz; o duvardaki kapı ve pencereler için gerçek boşluk açılır.
  // aralik(m): modülün duvar yüzeyindeki [x0, x1] aralığı (duvara içeriden bakınca soldan sağa)
  const duvar = (ad, L, konum, donus, aralik) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(L, 0); s.lineTo(L, oda.h); s.lineTo(0, oda.h); s.closePath();
    for (const m of p.moduller) {
      if (m.duvar !== ad || (m.tip !== 'pencere' && m.tip !== 'kapi' && m.tip !== 'nis')) continue;
      const [a, b] = aralik(m);
      const x0 = Math.max(1, a), x1 = Math.min(L - 1, b), y0 = Math.max(1, m.y), y1 = Math.min(oda.h - 1, m.y + m.h);
      if (x1 - x0 < 10 || y1 - y0 < 10) continue;
      const delik = new THREE.Path();
      delik.moveTo(x0, y0); delik.lineTo(x0, y1); delik.lineTo(x1, y1); delik.lineTo(x1, y0); delik.closePath();
      s.holes.push(delik);
    }
    const geo = new THREE.ShapeGeometry(s);
    gecici.push(geo);
    const d = new THREE.Mesh(geo, dm);
    d.position.set(...konum); d.rotation.y = donus; d.receiveShadow = !tel;
    d.raycast = () => {}; d.userData.yapi = true;
    kok.add(d);
  };
  duvar('arka', oda.w, [0, 0, 0], 0, m => [m.x, m.x + m.w]);
  duvar('sol', oda.d, [0, 0, oda.d], Math.PI / 2, m => [oda.d - m.x - m.w, oda.d - m.x]);
  duvar('sag', oda.d, [oda.w, 0, 0], -Math.PI / 2, m => [m.x, m.x + m.w]);
  duvar('on', oda.w, [oda.w, 0, oda.d], Math.PI, m => [oda.w - m.x - m.w, oda.w - m.x]);
  const cerceve = new THREE.LineSegments(KENAR, cizgi(tel ? 0x6f8296 : 0x9aa3ad, 1));
  cerceve.scale.set(oda.w, oda.h, oda.d); cerceve.position.set(oda.w / 2, oda.h / 2, oda.d / 2);
  cerceve.raycast = () => {};
  if (!gercek) kok.add(cerceve);

  // Modüller
  let ledSayisi = 0, isikSayisi = 0, lambaSira = 0;
  const lambaAdet = p.moduller.filter(m => ISIKLAR[m.tip] && (ops.aksam || m.tip !== 'spot')).length;
  const lambaAdim = Math.max(1, Math.ceil(lambaAdet / 8));
  for (const m of p.moduller) {
    const g = new THREE.Group();
    const t = donusum(m, oda);
    g.position.set(...t.p); g.rotation.y = t.r;
    g.userData.id = m.id;
    if (m.duvar !== 'ada') g.userData.duvar = m.duvar;
    const sec = m.id === secili || !!ops.secililer?.has(m.id), uy = uyariSet.has(m.id);
    // gerçekçi görünümde kenar çizgisi yalnızca seçili ya da uyarılı modülde çizilir
    const km = uy ? cizgi(UYARI, 1) : sec ? cizgi(VURGU, 1) : gercek ? null : cizgi(tel ? 0xcfd8e3 : 0x23272d, tel ? 0.9 : 0.35);
    const kapakCizgi = gercek && !km ? cizgi(0x0c0f13, 0.3) : null; // kapak ve çekmece araları ince gölge çizgisiyle okunur
    const yr = par => par.tur === 'kapak' ? 2.5 : par.tur === 'kulp' ? 4 : par.tur === 'cihaz' ? 4 : par.mat === 'tezgah' ? 1.5 : par.tur === 'dekor' ? 5 : 0;
    const acilis = [], eksenler = new Map(), susKova = new Map();
    for (const par of kertilmisParcalar(m, p)) {
      if (durum.kapakGizle && (par.tur === 'kapak' || par.tur === 'kulp')) continue;
      if (ops.acilis && par.mentese && !ops.kapakAcik) {
        // Açılış üçgeni: tepe noktası menteşe tarafında
        const z = par.z + par.sz + 2, ym = par.y + par.sy / 2;
        if (par.mentese === 'ust') { // kalkar kapak: tepe üst kenarın ortasında
          const xm = par.x + par.sx / 2, yu = par.y + par.sy;
          acilis.push(par.x, par.y, z, xm, yu, z, xm, yu, z, par.x + par.sx, par.y, z);
        } else {
          const xh = par.mentese === 'sol' ? par.x : par.x + par.sx, xo = par.mentese === 'sol' ? par.x + par.sx : par.x;
          acilis.push(xo, par.y, z, xh, ym, z, xh, ym, z, xo, par.y + par.sy, z);
        }
      }
      if (par.sus && !par.sekil) { // süsleme: modül ve malzeme başına birleştirilmiş tek ağda toplanır
        let ana = g, ox = par.x + (ops.kapakAcik && par.kay ? par.kay : 0), oy = par.y, oz = par.z + (ops.kapakAcik && par.cek ? par.cek : 0);
        if (ops.kapakAcik && par.ac) { // kapağıyla birlikte açılır
          const a = par.ac, ust = a.yon === 'ust', anahtar = a.x + '|' + a.z + '|' + a.yon + (ust ? '|' + a.y : '');
          let eksen = eksenler.get(anahtar);
          if (!eksen) {
            eksen = new THREE.Group();
            eksen.position.set(ust ? 0 : a.x, ust ? a.y : 0, a.z);
            if (ust) eksen.rotation.x = -1.2; else eksen.rotation.y = a.aci ?? (a.yon === 'sol' ? -1.75 : 1.75);
            eksenler.set(anahtar, eksen);
            g.add(eksen);
          }
          ana = eksen; ox = ust ? par.x : par.x - a.x; oy = ust ? par.y - a.y : par.y; oz = par.z - a.z;
        }
        const srk = renkBul(par, m), kovaAd = ana.uuid + '|' + srk + '|' + par.mat;
        let kova = susKova.get(kovaAd);
        if (!kova) susKova.set(kovaAd, kova = { ana, malzeme: mat(srk, par.mat), kutular: [] });
        kova.kutular.push(ox, oy, oz, par.sx, par.sy, par.sz);
        continue;
      }
      const duz = !par.sekil || par.sekil === 'egik', rk = renkBul(par, m);
      const malzeme = duz && par.mat === 'kapak'
        ? mat(rk, 'kapak', TANIM[m.tip].sinif === 'ust' ? ds.ustKapak : ds.kapak, tekrar(Math.max(par.sx, par.sz) / 500), tekrar(par.sy / 1000))
        : duz && par.mat === 'tezgah'
          ? mat(rk, 'tezgah', ds.tezgah, tekrar(par.sx / 1200), tekrar(par.sz / 1200))
          : mat(rk, par.mat === 'cam' && par.camYuzey && par.camYuzey !== 'duz' ? 'cambuzlu' : par.mat);
      if (par.sekil === 'sil') {
        const s = new THREE.Mesh(SIL, malzeme);
        s.scale.set(par.r * 2, par.h, par.r * 2);
        s.position.set(par.x, par.y + par.h / 2, par.z + (ops.kapakAcik && par.cek ? par.cek : 0));
        if (ops.kapakAcik && par.ac && par.ac.yon !== 'ust') { // dönen donanım (köşe döner sepet): mil çevresindeki eksene bağlanır
          const a = par.ac, anahtar = a.x + '|' + a.z + '|' + a.yon;
          let eksen = eksenler.get(anahtar);
          if (!eksen) { eksen = new THREE.Group(); eksen.position.set(a.x, 0, a.z); eksen.rotation.y = a.aci ?? (a.yon === 'sol' ? -1.75 : 1.75); eksenler.set(anahtar, eksen); g.add(eksen); }
          s.position.set(par.x - a.x, par.y + par.h / 2, par.z - a.z);
          eksen.add(s);
        } else g.add(s);
      } else if (par.sekil === 'egik') { // üstü (ve eğimli tablada altı) eğik kutu: köşeleri tek tek yerleştirilir
        const geo = KUTU.clone(), pos = geo.attributes.position, e = par.e;
        for (let i = 0; i < pos.count; i++) {
          const px = pos.getX(i) + 0.5, py = pos.getY(i), pz = pos.getZ(i) + 0.5, t = e.eksen === 'x' ? px : pz;
          pos.setXYZ(i, px * par.sx, py < 0 ? e.a0 + (e.a1 - e.a0) * t : e.u0 + (e.u1 - e.u0) * t, pz * par.sz);
        }
        geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
        gecici.push(geo);
        const ek = new THREE.Mesh(geo, malzeme);
        ek.position.set(par.x, par.y, par.z);
        ek.castShadow = ek.receiveShadow = doluMod();
        g.add(ek);
        const kenar = par.tur === 'kulp' ? null : km || (par.tur === 'kapak' ? kapakCizgi : null);
        if (kenar) {
          const kg = new THREE.EdgesGeometry(geo);
          gecici.push(kg);
          const l = new THREE.LineSegments(kg, kenar);
          l.position.copy(ek.position); l.raycast = () => {};
          g.add(l);
        }
      } else if (par.sekil === 'ceyrek') {
        const c = new THREE.Mesh(par.ayna ? CEYREK_AYNA : CEYREK, malzeme);
        c.scale.set(par.rx, par.h, par.rz);
        c.position.set(par.x, par.y, par.z);
        c.castShadow = c.receiveShadow = doluMod();
        g.add(c);
        if (km) { // gerçekçi görünümde kenar çizgisi çizilmez
          const l = new THREE.LineSegments(par.ayna ? CEYREK_AYNA_KENAR : CEYREK_KENAR, km);
          l.scale.copy(c.scale); l.position.copy(c.position);
          l.raycast = () => {};
          g.add(l);
        }
      } else if (ops.kapakAcik && par.ac) {
        // Kapak menteşe ekseni etrafında dışarı döner
        const a = par.ac, ust = a.yon === 'ust', anahtar = a.x + '|' + a.z + '|' + a.yon + (ust ? '|' + a.y : '');
        let eksen = eksenler.get(anahtar);
        if (!eksen) {
          eksen = new THREE.Group();
          eksen.position.set(ust ? 0 : a.x, ust ? a.y : 0, a.z);
          if (ust) eksen.rotation.x = -1.2; // kalkar kapak üst kenarı etrafında yukarı kalkar
          else eksen.rotation.y = a.aci ?? (a.yon === 'sol' ? -1.75 : 1.75);
          eksenler.set(anahtar, eksen);
          g.add(eksen);
        }
        kutuEkle(eksen, ust ? par.x : par.x - a.x, ust ? par.y - a.y : par.y, par.z - a.z, par.sx, par.sy, par.sz, malzeme, par.tur === 'kulp' ? null : km || (par.tur === 'kapak' ? kapakCizgi : null), true, yr(par));
      } else {
        const cek = ops.kapakAcik && par.cek ? par.cek : 0, kay = ops.kapakAcik && par.kay ? par.kay : 0;
        kutuEkle(g, par.x + kay, par.y, par.z + cek, par.sx, par.sy, par.sz, malzeme, par.tur === 'kulp' ? null : km || (par.tur === 'kapak' || par.tur === 'cihaz' ? kapakCizgi : null), true, yr(par));
      }
    }
    for (const kova of susKova.values()) { // toplanan süslemeler: malzeme başına tek ağ
      const geo = kutulardanGeo(kova.kutular);
      gecici.push(geo);
      const ag = new THREE.Mesh(geo, kova.malzeme);
      ag.receiveShadow = doluMod();
      ag.userData.kutular = kova.kutular; // fotoğraf dökümü kutuları buradan okur
      kova.ana.add(ag);
    }
    if (m.tip === 'not_yazi' || m.tip === 'olcu_cizgi') { // yazısı duvarın önünde, her açıdan okunur
      const etiket = etiketSprite(m.tip === 'olcu_cizgi' ? String(Math.round(Math.max(m.w, m.h))) : String(m.not || 'Not').slice(0, 40), m.tip === 'olcu_cizgi');
      etiket.position.set(m.w / 2, m.h + (m.tip === 'olcu_cizgi' && m.h > m.w ? -m.h / 2 : 95), 70);
      g.add(etiket);
    }
    // Lambalar gerçek ışık verir (en çok 14 ışık; fazlası yalnızca şekil olarak kalır). Akşam görünümünde güçlenir.
    // Gündüz yalnızca sarkıt ve tavan lambası ışık verir (spotların katkısı görünmez, kareyi yavaşlatır)
    // Çok lamba varsa her lamba ışık vermez: en çok 8 ışık, aralıklı seçilir ve şiddeti buna göre artırılır.
    if (!tel && ISIKLAR[m.tip] && (ops.aksam || m.tip !== 'spot') && (lambaSira++ % lambaAdim === 0) && isikSayisi < 8) {
      isikSayisi++;
      const [gunduz, aksam, uzak] = ISIKLAR[m.tip];
      const isik = new THREE.PointLight(0xffe4b8, (ops.aksam ? aksam : gunduz) * Math.min(lambaAdim, 3), uzak + (lambaAdim > 1 ? 1.5 : 0), 1.7);
      isik.position.set(m.w / 2, -60, m.d / 2);
      g.add(isik);
    }
    // Işık bandı (üst dolabın altında perde): kapak renginde, modül boyunca. Taç aşağıda koşu olarak çizilir.
    {
      const tk2 = TANIM[m.tip], duzUst = tk2.sinif === 'ust' && !['davlumbaz', 'davlumbaz_ada', 'ust_lkose', 'ust_kavis', 'ust_kavis_acik', 'ust_ayna'].includes(m.tip);
      if (p.ayar?.bant && duzUst && m.y >= 1100 && m.y <= 1900) kutuEkle(g, 0, -45, m.d, m.w, 45, KAPAK_K, mat(renkBul({ mat: 'kapak' }, m), 'kapak'), km);
    }
    // Tezgah aydınlatması: üst dolabın altında LED şerit ve yumuşak ışık (ilk 10 dolap gerçek ışık verir)
    const tn = TANIM[m.tip];
    if (p.ayar?.led && !tel && tn.sinif === 'ust' && !m.tip.startsWith('davlumbaz') && m.y >= 1100 && m.y <= 1900) {
      const lk = m.tip === 'ust_lkose', dd = lk ? Math.min(m.kol || 320, m.d) : m.d;
      const serit = new THREE.Mesh(KUTU, LED_MAT);
      serit.scale.set(m.w - 60, 6, 14); serit.position.set(m.w / 2, -3, dd - 60);
      serit.raycast = () => {};
      g.add(serit);
      if (ledSayisi < 6) {
        ledSayisi++;
        const isik = new THREE.PointLight(0xffe2ad, ops.aksam ? 1.5 : 0.55, 1.5, 1.6);
        isik.position.set(m.w / 2, -90, dd - 120);
        g.add(isik);
      }
    }
    if (acilis.length) {
      const ag = new THREE.BufferGeometry();
      ag.setAttribute('position', new THREE.Float32BufferAttribute(acilis, 3));
      const al = new THREE.LineSegments(ag, cizgi(tel ? 0xffd27a : 0xd9731a, 1));
      al.raycast = () => {};
      g.add(al);
    }
    if (m.id === secili) g.add(etiket(`${m.w} × ${m.h} × ${m.d}`, m.w / 2, m.h + 170, m.d / 2));
    kok.add(g);
  }

  // Tezgahlar
  const tk = gercek ? null : cizgi(tel ? 0xcfd8e3 : 0x23272d, tel ? 0.9 : 0.35);
  const kolonlar = p.moduller.filter(engelMi).map(o => {
    const k = kutu(o, oda), g = KERTME_PAYI;
    return { x0: k.x0 - g, x1: k.x1 + g, y0: k.y0 - g, y1: k.y1 + g, z0: k.z0 - g, z1: k.z1 + g };
  });
  for (const b of tezgahlar(p)) {
    // Tezgah da kolonların çevresinden kesilir
    let parca = [{ x: b.x0, y: b.y, z: b.z0, sx: b.x1 - b.x0, sy: TEZGAH_K, sz: b.z1 - b.z0 }];
    for (const e of kolonlar) parca = parca.flatMap(q => cikar(q, e));
    for (const q of parca) {
      const tm = mat(renk.tezgah, 'tezgah', ds.tezgah, tekrar(q.sx / 1200), tekrar(q.sz / 1200));
      const tz = kutuEkle(kok, q.x, q.y, q.z, q.sx, q.sy, q.sz, tm, tk, true, p.ayar?.tezgahKenar === 'yuvarlak' ? Math.max(1.5, Math.min(14, TEZGAH_K / 2 - 2)) : 1.5);
      tz.raycast = () => {};
      // tezgah, dayandığı duvarın dolaplarıyla birlikte gizlenir (kenar çizgisi kok'a hemen ardından eklenir)
      const dv = b.z0 < 1 ? 'arka' : b.x0 < 1 ? 'sol' : b.x1 > oda.w - 1 ? 'sag' : b.z1 > oda.d - 1 ? 'on' : null;
      if (dv) { tz.userData.duvar = dv; kok.children[kok.children.length - 1].userData.duvar = dv; }
    }
  }
  // Bitiş ayrıntıları: tezgah süpürgeliği ve damlalıklı kenar (tezgah malzemesinde), oda süpürgeliği
  {
    const ekle = (e, m, r) => {
      const o = kutuEkle(kok, e.x0, e.y0, e.z0, e.x1 - e.x0, e.y1 - e.y0, e.z1 - e.z0, m, tk, true, r);
      o.raycast = () => {};
      if (e.duvar) { o.userData.duvar = e.duvar; if (tk) kok.children[kok.children.length - 1].userData.duvar = e.duvar; }
    };
    const ayrinti = [...tezgahSupurgelikleri(p), ...tezgahDamlaliklari(p)];
    if (ayrinti.length) { const tm = mat(renk.tezgah, 'tezgah'); for (const e of ayrinti) ekle(e, tm, 2); }
    const sup = supurgelikler(p);
    if (sup.length) { const sm = mat(renk.supurgelik || '#f3f2ee', 'govde'); for (const e of sup) ekle(e, sm, 1.5); }
  }
  // Ada ekleri: yan ve arka bitiş paneli (kapak renginde) ve arka kenarda bar yükseltisi (tezgah malzemesinde)
  if (p.ayar?.adaPanel || p.ayar?.adaBar) {
    const pm = mat(renk.kapak, 'kapak', ds.kapak, 1, 1), bm = mat(renk.tezgah, 'tezgah'), K = KAPAK_K;
    for (const e of adaEkleri(p)) {
      const o = kutuEkle(kok, e.x0, e.y0, e.z0, e.x1 - e.x0, e.y1 - e.y0, e.z1 - e.z0, e.tur === 'bar' ? bm : pm, tk);
      o.raycast = () => {};
    }
  }
  // Taç: üst ve boy dolapların üstünde, seçilen modelin profiliyle ve seçilen kapak renginde; kesim listesiyle aynı hesaptan gelir
  if (p.ayar?.kornis) {
    for (const e of tacKutulari(taclar(p))) {
      const o = kutuEkle(kok, e.x0, e.y0, e.z0, e.x1 - e.x0, e.y1 - e.y0, e.z1 - e.z0, mat(e.renk, 'kapak'), tk);
      o.raycast = () => {};
      if (e.duvar) { o.userData.duvar = e.duvar; if (tk) kok.children[kok.children.length - 1].userData.duvar = e.duvar; }
    }
  }
  // Tezgah arası: duvara dayalı tezgahların üstünde, üst dolap altına kadar kaplama
  if (p.ayar?.arasi ?? 1) {
    const ad = ds.arasi && ds.arasi !== 'duz' ? ds.arasi : '', periyot = ad === 'mermer' ? 1200 : 600;
    const duzAm = mat(renk.arasi || '#e4e8e2', 'arasi');
    const amYap = (uz, yuk) => ad ? mat(renk.arasi || '#e4e8e2', 'arasi', ad, tekrar(uz / periyot), tekrar(yuk / periyot)) : duzAm;
    for (const b of tezgahlar(p)) {
      const y = b.y + TEZGAH_K, H = Math.min(560, oda.h - y), K = 10;
      if (H <= 0) continue;
      const parca = [];
      if (b.z0 < 1) parca.push([b.x0, 0, b.x1 - b.x0, K]);
      if (b.x0 < 1) parca.push([0, b.z0, K, b.z1 - b.z0]);
      if (b.x1 > oda.w - 1) parca.push([oda.w - K, b.z0, K, b.z1 - b.z0]);
      if (b.z1 > oda.d - 1) parca.push([b.x0, oda.d - K, b.x1 - b.x0, K]);
      for (const [x, z, sx, sz] of parca) {
        const dv = z < 1 && sz === K ? 'arka' : x < 1 && sx === K ? 'sol' : sx === K ? 'sag' : 'on';
        const boyuna = dv === 'arka' || dv === 'on'; // kaplama duvar boyunca x ekseninde mi uzanıyor
        // Niş ve pencerenin önü açık kalır: kaplama o dikdörtgenlerin çevresinden dolanır
        let dikler = [{ a0: boyuna ? x : z, a1: boyuna ? x + sx : z + sz, y0: y, y1: y + H }];
        for (const m of p.moduller) {
          if (m.duvar !== dv || (m.tip !== 'nis' && m.tip !== 'pencere')) continue;
          const d = { a0: m.x, a1: m.x + m.w, y0: m.y, y1: m.y + m.h }, yeni = [];
          for (const r of dikler) {
            if (d.a0 >= r.a1 || d.a1 <= r.a0 || d.y0 >= r.y1 || d.y1 <= r.y0) { yeni.push(r); continue; }
            if (d.y0 > r.y0) yeni.push({ ...r, y1: d.y0 });
            if (d.y1 < r.y1) yeni.push({ ...r, y0: d.y1 });
            const ya = Math.max(r.y0, d.y0), yb = Math.min(r.y1, d.y1);
            if (d.a0 > r.a0) yeni.push({ a0: r.a0, a1: d.a0, y0: ya, y1: yb });
            if (d.a1 < r.a1) yeni.push({ a0: d.a1, a1: r.a1, y0: ya, y1: yb });
          }
          dikler = yeni;
        }
        for (const r of dikler) {
          if (r.a1 - r.a0 < 1 || r.y1 - r.y0 < 1) continue;
          const am = amYap(r.a1 - r.a0, r.y1 - r.y0);
          const ar = boyuna ? kutuEkle(kok, r.a0, r.y0, z, r.a1 - r.a0, r.y1 - r.y0, sz, am, tk, false)
            : kutuEkle(kok, x, r.y0, r.a0, sx, r.y1 - r.y0, r.a1 - r.a0, am, tk, false);
          ar.raycast = () => {};
          ar.userData.duvar = dv; kok.children[kok.children.length - 1].userData.duvar = dv;
        }
      }
    }
  }
  if (ops.olculer) olcuCiz(p);
  // Çalışma üçgeni: evye, ocak ve buzdolabı arasında tezgah üstü hizasında çizgi ve mesafeler
  if (ops.ucgen) {
    const y = 960, n = ops.ucgen.noktalar, pts = [];
    for (let i = 0; i < 3; i++) {
      const a = n[i], b = n[(i + 1) % 3];
      pts.push(a.x, y, a.z, b.x, y, b.z);
      const s = yaziSprite(String(ops.ucgen.kenarlar[i]), tel);
      s.position.set((a.x + b.x) / 2, y + 120, (a.z + b.z) / 2);
      kok.add(s);
    }
    const ug = new THREE.BufferGeometry();
    ug.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const ul = new THREE.LineSegments(ug, new THREE.LineBasicMaterial({ color: 0xe0661f, depthTest: false }));
    ul.renderOrder = 8; ul.raycast = () => {};
    kok.add(ul);
  }
  dekorCiz(p);
  orthoAyarla();
  kok.updateMatrixWorld(true); // sonraki kare beklenmeden tıklama/sürükleme doğru çalışsın
  gorunurluk();
  renderer.shadowMap.needsUpdate = true;
  kirli = true;
}

// Duvar boyunca ölçü zincirleri: zeminde alt sıra (boşluklar dahil), duvarda üst sıra
function olcuCiz(p) {
  const { oda } = p, tel = durum.mod === 'tel';
  const noktalar = [];
  const cizgiEkle = (a, b) => noktalar.push(...a, ...b);
  const zincir = (duvar, liste, y, uzak, yerde) => {
    const boy = xEksenli(duvar) ? oda.w : oda.d;
    const sinir = v => Math.max(0, Math.min(boy, v));
    const kenar = [...new Set([0, boy, ...liste.flatMap(m => [sinir(m.x), sinir(m.x + m.w)])])].sort((a, b) => a - b);
    const P3 = (a, kay = 0) => {
      const u = yerde ? uzak + kay : uzak, yy = yerde ? y : y + kay;
      return duvar === 'arka' ? [a, yy, u] : duvar === 'sol' ? [u, yy, a] : duvar === 'sag' ? [oda.w - u, yy, a] : [a, yy, oda.d - u];
    };
    cizgiEkle(P3(0), P3(boy));
    for (const k of kenar) cizgiEkle(P3(k, -45), P3(k, 45));
    for (let i = 1; i < kenar.length; i++) {
      const uz = kenar[i] - kenar[i - 1];
      if (uz < 1) continue;
      const s = yaziSprite(String(Math.round(uz)), tel);
      s.position.set(...P3((kenar[i] + kenar[i - 1]) / 2, 140));
      kok.add(s);
    }
  };
  for (const d of DUVAR_LISTE) {
    const hepsi = p.moduller.filter(m => m.duvar === d);
    const alt = hepsi.filter(m => m.y === 0), ust = hepsi.filter(m => m.y > 0 && TANIM[m.tip].sinif === 'ust');
    if (alt.length || d === 'arka') zincir(d, alt, 6, Math.max(700, ...alt.map(m => m.d + 140)), true);
    if (ust.length) zincir(d, ust, Math.max(...ust.map(m => m.y + m.h)) + 70, 12, false);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(noktalar, 3));
  const l = new THREE.LineSegments(g, cizgi(tel ? 0xe8eef5 : 0x1b2530, 1));
  l.raycast = () => {};
  kok.add(l);
}

const yaziOnbellek = new Map();
// Not ve ölçü etiketi: yazının uzunluğuna göre genişleyen, zeminli etiket
function etiketSprite(yazi, olcu) {
  const a = 'etiket|' + yazi + '|' + olcu;
  let malzeme = yaziOnbellek.get(a);
  if (!malzeme) {
    const c = document.createElement('canvas'), g = c.getContext('2d'), font = '600 44px system-ui, sans-serif';
    g.font = font;
    c.width = Math.min(1024, Math.ceil(g.measureText(yazi).width) + 44); c.height = 72;
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = olcu ? '#1f7ae0' : '#ffe08a'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = olcu ? '#ffffff' : '#3a2a00'; g.fillText(yazi, c.width / 2, 38, c.width - 20);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    malzeme = new THREE.SpriteMaterial({ map: t, depthTest: false });
    malzeme.userData.oran = c.width / c.height;
    yaziOnbellek.set(a, malzeme);
  }
  const s = new THREE.Sprite(malzeme);
  s.scale.set(130 * malzeme.userData.oran, 130, 1); s.renderOrder = 9;
  s.raycast = () => {};
  return s;
}

function yaziSprite(yazi, acik) {
  const a = yazi + '|' + acik;
  let malzeme = yaziOnbellek.get(a);
  if (!malzeme) {
    const c = document.createElement('canvas');
    c.width = 192; c.height = 80;
    const g = c.getContext('2d');
    g.font = '600 50px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 9; g.strokeStyle = acik ? '#10161d' : '#ffffff'; g.strokeText(yazi, 96, 42);
    g.fillStyle = acik ? '#ffffff' : '#1b2530'; g.fillText(yazi, 96, 42);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    malzeme = new THREE.SpriteMaterial({ map: t, depthTest: false });
    yaziOnbellek.set(a, malzeme);
  }
  const s = new THREE.Sprite(malzeme);
  s.scale.set(430, 180, 1); s.renderOrder = 9;
  s.raycast = () => {};
  return s;
}


function etiket(yazi, x, y, z) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(20,28,38,0.9)';
  g.beginPath(); g.roundRect(4, 4, 504, 88, 22); g.fill();
  g.fillStyle = '#fff'; g.font = '600 46px system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(yazi + ' mm', 256, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
  s.scale.set(640, 120, 1); s.position.set(x, y, z); s.renderOrder = 10;
  s.raycast = () => {};
  return s;
}

// ---- Etkileşim ------------------------------------------------------------------

function isin(e) {
  const r = renderer.domElement.getBoundingClientRect();
  fare.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  aktifKam.updateMatrixWorld();
  ray.setFromCamera(fare, aktifKam);
}

function modulBul(e) {
  isin(e);
  for (const h of ray.intersectObjects(kok.children, true)) {
    let o = h.object;
    while (o && !o.userData.id) o = o.parent;
    if (o && !o.visible) continue; // kamera arkasında kaldığı için gizlenen duvarın modülü
    if (o) return { id: o.userData.id, nokta: h.point.clone().multiplyScalar(1000) };
    if (h.object.userData.zemin) return null;
  }
  return null;
}

// İşaretçinin altındaki duvar noktası: { duvar, a: duvar boyunca konum (mm), y: yerden (mm) }.
// Kameraya en uzak geçerli duvar alınır (öndeki duvar gizli olduğu için içerideki, görünen duvar budur).
function duvarNoktasi(e) {
  isin(e);
  const o = ray.ray.origin.clone().multiplyScalar(1000), d = ray.ray.direction, { w: W, d: D, h: H } = proje.oda;
  let en = null;
  for (const [duvar, eksen, deger] of [['arka', 'z', 0], ['on', 'z', D], ['sol', 'x', 0], ['sag', 'x', W]]) {
    if (Math.abs(d[eksen]) < 1e-6) continue;
    const t = (deger - o[eksen]) / d[eksen];
    if (t <= 0) continue;
    const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
    if (y < 0 || y > H || x < -1 || x > W + 1 || z < -1 || z > D + 1) continue;
    if (!en || t > en.t) en = { t, duvar, a: eksen === 'z' ? x : z, y };
  }
  return en ? { duvar: en.duvar, a: en.a, y: en.y } : null;
}
let noktaAlici = null;
// Bir sonraki tıklamalar seçim yerine duvar noktası olarak verilir (iki noktayla ölçü çizmek için); null ile kapanır
export function noktaIste(fn) { noktaAlici = fn; renderer.domElement.style.cursor = fn ? 'crosshair' : ''; }
// Yerleştirme kipi: sürüklenmeden bırakılan tıklama seçim yerine oda yüzeyindeki nokta olarak verilir (kamera bu sırada çevrilebilir).
// onizle: işaretçi gezerken noktayla (ya da null ile) çağrılır; yerleşecek kutuyu hayalet() ile gösterir.
let yerAlici = null, yerOnizle = null, hayaletAg = null, hayaletIz = '', onizleKare = 0;
export function yerIste(fn, onizle = null) {
  yerAlici = fn; yerOnizle = fn ? onizle : null;
  renderer.domElement.style.cursor = fn ? 'copy' : '';
  if (!fn) hayalet(null);
}
// İşaretçinin altındaki oda yüzeyi: oda içinde zemin { tur: 'zemin', x, z } ya da duvar { tur: 'duvar', duvar, a, y }
function yuzeyNoktasi(e) {
  isin(e);
  const v = new THREE.Vector3();
  if (ray.ray.intersectPlane(ZEMIN, v)) {
    v.multiplyScalar(1000);
    if (v.x > 0 && v.x < proje.oda.w && v.z > 0 && v.z < proje.oda.d) return { tur: 'zemin', x: v.x, z: v.z };
  }
  const n = duvarNoktasi(e);
  return n ? { tur: 'duvar', ...n } : null;
}
// Yerleştirme önizlemesi: kutu (mm, oda ekseninde) yarı saydam çizilir; null ile gizlenir
export function hayalet(k, renk = VURGU) {
  const iz = k ? [k.x0, k.x1, k.y0, k.y1, k.z0, k.z1, renk].map(Math.round).join() : '';
  if (iz === hayaletIz) return;
  hayaletIz = iz;
  if (!k) { if (hayaletAg) hayaletAg.visible = false; kirli = true; return; }
  if (!hayaletAg) {
    hayaletAg = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: renk, transparent: true, opacity: 0.32, depthWrite: false }));
    const cizgi = new THREE.LineSegments(new THREE.EdgesGeometry(hayaletAg.geometry), new THREE.LineBasicMaterial({ color: renk }));
    cizgi.raycast = () => {};
    hayaletAg.add(cizgi);
    hayaletAg.raycast = () => {}; hayaletAg.renderOrder = 9;
    scene.add(hayaletAg);
  }
  hayaletAg.material.color.setHex(renk); hayaletAg.children[0].material.color.setHex(renk);
  hayaletAg.position.set((k.x0 + k.x1) / 2000, (k.y0 + k.y1) / 2000, (k.z0 + k.z1) / 2000);
  hayaletAg.scale.set(Math.max(1, k.x1 - k.x0) / 1000, Math.max(1, k.y1 - k.y0) / 1000, Math.max(1, k.z1 - k.z0) / 1000);
  hayaletAg.visible = true; kirli = true;
}
// Ekran noktasındaki modülün kimliği (sağ tık menüsü için)
export function modulKimligi(e) { return modulBul(e)?.id || null; }

let hafif = false;
const parmak = new Set(); // ekrana değen parmaklar (pointerId)
function bas(e) {
  if (renderde) return;
  if (e.button !== 0) return;
  const dokun = e.pointerType === 'touch';
  if (dokun && parmak.size > 1) { surukle = null; return; } // ikinci parmak: görüş hareketi, seçim ya da taşıma yok
  if (noktaAlici) { const n = duvarNoktasi(e); if (n) noktaAlici(n); surukle = null; return; }
  if (yerAlici) { surukle = { x: e.clientX, y: e.clientY, oynadi: false, id: null, esik: dokun ? 10 : 5, yer: true }; return; } // bırakınca yerleştirilir; sürüklenirse görüş döner
  const h = modulBul(e);
  surukle = { x: e.clientX, y: e.clientY, oynadi: false, id: h?.id || null, esik: dokun ? 10 : 5 }; // parmak fareden daha çok titrer
  if (!h) return;
  // Dokunmatik: seçili olmayan modül sürüklenmez. Parmak görüşü çevirir; dokunup bırakınca modül seçilir,
  // seçili modül sürüklenince taşınır. Böylece görüşü çevirirken dolaplar yanlışlıkla yerinden oynamaz.
  if (dokun && secili !== h.id && !secimde(h.id)) { surukle.dokunSec = true; return; }
  const m = proje.moduller.find(o => o.id === h.id);
  if (!m) return;
  // Sürükleme düzlemi: duvar modülünde duvara paralel düşey düzlem, adada yatay düzlem
  const n = m.duvar === 'ada' ? new THREE.Vector3(0, 1, 0)
    : xEksenli(m.duvar) ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
  const nokta = h.nokta.clone().multiplyScalar(0.001);
  surukle.duzlem = new THREE.Plane().setFromNormalAndCoplanarPoint(n, nokta);
  surukle.bas = h.nokta;
  surukle.ilk = { x: m.x, z: m.z };
  surukle.duvar = m.duvar;
  controls.enabled = false;
  try { renderer.domElement.setPointerCapture(e.pointerId); } catch { /* işaretçi artık geçerli değilse yakalama olmadan sürer */ }
  if (e.shiftKey) cb.sec(h.id, true); // Shift: seçime ekle / çıkar
  else if (secili !== h.id && !secimde(h.id)) cb.sec(h.id);
}
let seciliKume = new Set();
const secimde = id => seciliKume.has(id);
const ZEMIN = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const duvarNormali = d => xEksenli(d) ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);

function oynat(e) {
  if (yerOnizle && !surukle && e.pointerType !== 'touch') { // yerleştirme kipinde işaretçi gezerken modülün oturacağı yer gösterilir
    cancelAnimationFrame(onizleKare);
    onizleKare = requestAnimationFrame(() => { if (yerOnizle) yerOnizle(yuzeyNoktasi(e)); });
    return;
  }
  if (!surukle || !surukle.duzlem) return;
  if (!surukle.oynadi && Math.hypot(e.clientX - surukle.x, e.clientY - surukle.y) < surukle.esik) return;
  if (!surukle.oynadi) { surukle.oynadi = true; cb.tasiBasla(surukle.id); }
  isin(e);
  // Duvar modülü zeminde başka bir duvarın dibine sürüklenirse o duvara geçer
  if (surukle.duvar !== 'ada') {
    const z = new THREE.Vector3();
    if (ray.ray.intersectPlane(ZEMIN, z)) {
      z.multiplyScalar(1000);
      const W = proje.oda.w, D = proje.oda.d;
      if (z.x > 0 && z.x < W && z.z > 0 && z.z < D) {
        const u = { arka: z.z, sol: z.x, sag: W - z.x, on: D - z.z };
        const yakin = Object.keys(u).sort((a, b) => u[a] - u[b])[0];
        if (yakin !== surukle.duvar && u[yakin] < 350 && u[surukle.duvar] > 700) {
          const m = proje.moduller.find(o => o.id === surukle.id);
          const yeniX = m ? cb.duvarDegis(surukle.id, yakin, (xEksenli(yakin) ? z.x : z.z) - m.w / 2) : null;
          if (yeniX != null) {
            surukle.duvar = yakin; surukle.ilk = { x: yeniX }; surukle.bas = z.clone();
            surukle.duzlem = new THREE.Plane().setFromNormalAndCoplanarPoint(duvarNormali(yakin), z.clone().multiplyScalar(0.001));
            return;
          }
        }
      }
    }
  }
  const v = new THREE.Vector3();
  if (!ray.ray.intersectPlane(surukle.duzlem, v)) return;
  v.multiplyScalar(1000);
  const dx = v.x - surukle.bas.x, dz = v.z - surukle.bas.z;
  if (surukle.duvar === 'ada') cb.tasi(surukle.id, { x: surukle.ilk.x + dx, z: surukle.ilk.z + dz });
  else cb.tasi(surukle.id, { x: surukle.ilk.x + (xEksenli(surukle.duvar) ? dx : dz) });
}

function birak(e) {
  if (!surukle) return;
  const s = surukle; surukle = null;
  controls.enabled = true;
  if (s.yer) {
    if (yerAlici && e.type === 'pointerup' && Math.hypot(e.clientX - s.x, e.clientY - s.y) < s.esik) { const n = yuzeyNoktasi(e); if (n) yerAlici(n); }
    return;
  }
  if (s.oynadi) cb.tasiBitti(s.id);
  else if (e.type === 'pointerup' && Math.hypot(e.clientX - s.x, e.clientY - s.y) < s.esik) {
    if (!s.id) cb.sec(null);
    else if (s.dokunSec) cb.sec(s.id);
  }
}

// ---- Kamera ve çıktı ---------------------------------------------------------------

export function kamera(ad) {
  if (!proje) return;
  kirli = true;
  const W = proje.oda.w / 1000, D = proje.oda.d / 1000, H = proje.oda.h / 1000;
  const hedef = new THREE.Vector3(W / 2, H * 0.36, D * 0.4);
  aktifKam = cam;
  controls.object = cam;
  controls.enableRotate = true;
  const uzak = Math.max(W, D);
  if (ad === 'ust') {
    aktifKam = ortho;
    ortho.position.set(W / 2, 20, D / 2); ortho.up.set(0, 0, -1);
    ortho.lookAt(W / 2, 0, D / 2); ortho.zoom = 1; orthoAyarla();
    controls.object = ortho; controls.enableRotate = false;
    controls.target.set(W / 2, 0, D / 2);
    controls.update();
    return;
  }
  cam.fov = ad === 'ic' ? 74 : 42; // iç görünüşte geniş açı
  cam.updateProjectionMatrix();
  if (ad === 'ic') { // ön duvarın önünden, göz hizasında arka duvara bakış
    cam.up.set(0, 1, 0);
    cam.position.set(W * 0.5, Math.min(1.6, H * 0.62), D * 0.97);
    controls.target.set(W * 0.5, Math.min(1.25, H * 0.5), D * 0.3);
    controls.update();
    return;
  }
  if (ad === 'kose') { // dolapların en uzağındaki köşeden, göz hizasında dolaplara bakış (sunum görüntüsü için)
    const dolap = proje.moduller.filter(m => ['alt', 'ust', 'boy'].includes(TANIM[m.tip].sinif));
    let cx = W / 2, cz = D * 0.4;
    if (dolap.length) {
      cx = 0; cz = 0;
      for (const m of dolap) { const k = kutu(m, proje.oda); cx += (k.x0 + k.x1) / 2000; cz += (k.z0 + k.z1) / 2000; }
      cx /= dolap.length; cz /= dolap.length;
    }
    const pay = 0.25;
    let en = null;
    for (const [x, z] of [[pay, pay], [W - pay, pay], [pay, D - pay], [W - pay, D - pay]]) {
      const u = Math.hypot(x - cx, z - cz);
      if (!en || u > en.u) en = { x, z, u };
    }
    cam.fov = 68; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
    cam.position.set(en.x, Math.min(1.6, H * 0.62), en.z);
    controls.target.set(cx, Math.min(1.1, H * 0.45), cz);
    controls.update();
    return;
  }
  // Odanın tamamı görünecek uzaklık (dar ekranlarda yatay görüş açısı belirler)
  const dusey = THREE.MathUtils.degToRad(cam.fov) / 2;
  const yatay = Math.atan(Math.tan(dusey) * cam.aspect);
  const yaricap = 0.5 * Math.hypot(W, D, H);
  const mesafe = yaricap / Math.sin(Math.min(dusey, yatay)) * 0.92;
  const bak = ad === 'on' ? new THREE.Vector3(0, 0.12, 1)
    : ad === 'sol' ? new THREE.Vector3(1, 0.12, 0) : new THREE.Vector3(0.55, 0.6, 0.78);
  hedef.set(W / 2, H * 0.4, D / 2);
  cam.position.copy(hedef).addScaledVector(bak.normalize(), mesafe);
  controls.target.copy(hedef);
  cam.up.set(0, 1, 0);
  controls.update();
}

// Kayıtlı bakış: kameranın yeri, baktığı nokta (metre) ve görüş açısı. Plan görünüşü kaydedilmez.
export function bakisAl() {
  if (aktifKam !== cam) return null;
  controls.update();
  const yuv = v => Math.round(v * 1000) / 1000;
  return { pos: cam.position.toArray().map(yuv), hedef: controls.target.toArray().map(yuv), fov: cam.fov };
}
export function bakisKoy(b) {
  if (!b || !Array.isArray(b.pos) || !Array.isArray(b.hedef)) return false;
  aktifKam = cam; controls.object = cam; controls.enableRotate = true;
  cam.fov = b.fov || 42; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
  cam.position.fromArray(b.pos); controls.target.fromArray(b.hedef);
  controls.update();
  kirli = true;
  return true;
}

// ---- Ortam gölgesi --------------------------------------------------------------------
// Gerçekçi görünümün durgun karesinde sahne önce bir ara yüzeye çizilir, sonra derinlik bilgisinden köşelerin,
// dolap altlarının ve kapak aralarının ne kadar kapalı kaldığı hesaplanıp oralar hafifçe koyulaştırılır
// (ekran uzayında ortam gölgesi). Hareket sırasında uygulanmaz; yalnızca sahne durunca ve görüntü alınırken.
let aoHedef = null, aoSahne = null, aoKam = null, aoMat = null;
function aoKur() {
  aoHedef = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(4, 4) });
  aoHedef.depthTexture.type = THREE.UnsignedIntType;
  aoMat = new THREE.ShaderMaterial({
    uniforms: { tRenk: { value: aoHedef.texture }, tDerinlik: { value: aoHedef.depthTexture }, proj: { value: new THREE.Matrix4() },
      invProj: { value: new THREE.Matrix4() }, yaricap: { value: 0.22 }, siddet: { value: 1.15 }, agirlik: { value: 1 }, tohum: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tRenk; uniform sampler2D tDerinlik; uniform mat4 proj; uniform mat4 invProj; uniform float yaricap; uniform float siddet; uniform float agirlik; uniform float tohum;
      varying vec2 vUv;
      vec3 konum(vec2 uv) { float d = texture2D(tDerinlik, uv).x; vec4 v = invProj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return v.xyz / v.w; }
      float rastgele(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec4 renk = texture2D(tRenk, vUv);
        float golge = 0.0;
        if (texture2D(tDerinlik, vUv).x < 0.99999) {
          vec3 P = konum(vUv);
          vec3 n = normalize(cross(dFdx(P), dFdy(P)));
          float aci = rastgele(gl_FragCoord.xy + tohum) * 6.2832;
          for (int i = 0; i < 24; i++) {
            float t = (float(i) + 0.5) / 24.0, a = aci + t * 6.2832 * 5.0;
            vec3 S = P + vec3(cos(a), sin(a), 0.0) * yaricap * sqrt(t);
            vec4 c = proj * vec4(S, 1.0);
            vec2 uv = c.xy / c.w * 0.5 + 0.5;
            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) continue;
            vec3 v = konum(uv) - P;
            float u = length(v);
            golge += max(0.0, dot(n, v) / (u + 0.0001) - 0.12) * smoothstep(yaricap * 1.6, 0.0, u);
          }
          golge = clamp(siddet * golge / 24.0, 0.0, 0.75);
        }
        gl_FragColor = vec4(renk.rgb * (1.0 - golge) * agirlik, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  });
  aoSahne = new THREE.Scene();
  const dortgen = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), aoMat);
  dortgen.frustumCulled = false;
  aoSahne.add(dortgen);
  aoKam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
}
// Bir kare çizer: gerçekçi görünümde ortam gölgeli, diğerlerinde doğrudan
function kareCiz() {
  if (durum.mod !== 'gercek') { renderer.render(scene, aktifKam); return; }
  if (!aoHedef) aoKur();
  const b = renderer.getDrawingBufferSize(new THREE.Vector2());
  if (aoHedef.width !== b.x || aoHedef.height !== b.y) aoHedef.setSize(b.x, b.y);
  renderer.setRenderTarget(aoHedef);
  renderer.render(scene, aktifKam);
  renderer.setRenderTarget(null);
  aoMat.uniforms.proj.value.copy(aktifKam.projectionMatrix);
  aoMat.uniforms.invProj.value.copy(aktifKam.projectionMatrixInverse);
  renderer.render(aoSahne, aoKam);
}

// ---- Yüksek kalite görüntü ------------------------------------------------------------
// Aynı bakış birçok kez çizilip ortalaması alınır. Her çizimde güneş ve dolgu ışığı biraz kaydırılır (ışık bir
// noktadan değil geniş bir yüzeyden geliyormuş gibi: gölgelerin kenarı uzaklaştıkça yumuşar), kamera piksel altı
// kaydırılır (kenarlar pürüzsüzleşir) ve ortam gölgesinin örnekleme deseni değişir (kumlanma kaybolur).
let renderde = false, birikim = null, sonMat = null, sonSahne = null;
const halton = (i, taban) => { let f = 1, r = 0; while (i > 0) { f /= taban; r += f * (i % taban); i = Math.floor(i / taban); } return r; };
export const renderSuruyor = () => renderde;
// genislik: görüntü genişliği (px), ornek: çizim sayısı, ilerleme(0..1): her birkaç çizimde çağrılır. Dönen: PNG (data URL)
export async function render({ genislik = 3840, ornek = 48, ilerleme } = {}) {
  if (renderde) return null;
  renderde = true;
  const c = renderer.domElement, w = c.clientWidth, h = c.clientHeight, oran = renderer.getPixelRatio();
  const sinir = renderer.capabilities.maxTextureSize || 4096;
  // en ve boy birlikte ekran kartının doku sınırına sığar (dik ekranda boy sınırı aşabiliyordu)
  const olcek = Math.min(1, sinir / Math.round(genislik), sinir / Math.max(1, Math.round(genislik * h / w)));
  const G = Math.max(1, Math.round(genislik * olcek)), Y = Math.max(1, Math.round(G * h / w));
  const gPos = gunesIsik.position.clone(), dPos = dolguIsik.position.clone(), gR = gunesIsik.shadow.radius, dR = dolguIsik.shadow.radius;
  const otoTemizle = renderer.autoClear;
  let veri = null;
  try {
    controls.enabled = false;
    renderer.setPixelRatio(1); renderer.setSize(G, Y, false);
    aktifKam.updateMatrixWorld(); gorunurluk();
    if (!aoHedef) aoKur();
    aoHedef.setSize(G, Y);
    if (!birikim) {
      birikim = new THREE.WebGLRenderTarget(G, Y, { type: THREE.HalfFloatType, depthBuffer: false });
      sonMat = new THREE.ShaderMaterial({
        uniforms: { tBirikim: { value: birikim.texture }, carpan: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `uniform sampler2D tBirikim; uniform float carpan; varying vec2 vUv;
          void main() { gl_FragColor = vec4(texture2D(tBirikim, vUv).rgb * carpan, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
        depthTest: false, depthWrite: false,
      });
      sonSahne = new THREE.Scene();
      const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sonMat); d.frustumCulled = false; sonSahne.add(d);
    }
    birikim.setSize(G, Y);
    renderer.setRenderTarget(birikim); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.setRenderTarget(null);
    // ışığın geldiği yöne dik iki eksen: ışık kaynağı bu düzlemde bir daire içinde gezdirilir
    const eksenler = (isik) => {
      const yon = isik.position.clone().sub(isik.target.position).normalize();
      const u = new THREE.Vector3(0, 1, 0).cross(yon).normalize(), v = yon.clone().cross(u).normalize();
      return [u, v];
    };
    const [gu, gv] = eksenler(gunesIsik), [du, dv] = eksenler(dolguIsik);
    const gercek = durum.mod === 'gercek';
    aoMat.uniforms.siddet.value = gercek ? 1.15 : 0;
    aoMat.blending = THREE.CustomBlending; aoMat.blendEquation = THREE.AddEquation; aoMat.blendSrc = THREE.OneFactor; aoMat.blendDst = THREE.OneFactor;
    aoMat.uniforms.agirlik.value = 1 / ornek;
    gunesIsik.shadow.radius = 1.6; dolguIsik.shadow.radius = 3;
    const goster = n => { sonMat.uniforms.carpan.value = ornek / n; renderer.autoClear = true; renderer.setRenderTarget(null); renderer.render(sonSahne, aoKam); };
    for (let i = 0; i < ornek; i++) {
      const r = Math.sqrt(halton(i + 1, 2)), a = halton(i + 1, 3) * Math.PI * 2;
      gunesIsik.position.copy(gPos).addScaledVector(gu, Math.cos(a) * r * 0.42).addScaledVector(gv, Math.sin(a) * r * 0.42);
      dolguIsik.position.copy(dPos).addScaledVector(du, Math.cos(a + 2) * r * 0.9).addScaledVector(dv, Math.sin(a + 2) * r * 0.9);
      aktifKam.setViewOffset(G, Y, halton(i + 1, 5) - 0.5, halton(i + 1, 7) - 0.5, G, Y);
      renderer.shadowMap.needsUpdate = true;
      renderer.autoClear = true;
      renderer.setRenderTarget(aoHedef); renderer.render(scene, aktifKam);
      aoMat.uniforms.proj.value.copy(aktifKam.projectionMatrix); aoMat.uniforms.invProj.value.copy(aktifKam.projectionMatrixInverse);
      aoMat.uniforms.tohum.value = i * 7.31;
      renderer.autoClear = false;
      renderer.setRenderTarget(birikim); renderer.render(aoSahne, aoKam);
      if (i % 4 === 3 && i < ornek - 1) { goster(i + 1); ilerleme?.((i + 1) / ornek); await new Promise(f => requestAnimationFrame(f)); }
    }
    goster(ornek);
    veri = c.toDataURL('image/png');
    ilerleme?.(1);
  } finally {
    aktifKam.clearViewOffset();
    gunesIsik.position.copy(gPos); dolguIsik.position.copy(dPos); gunesIsik.shadow.radius = gR; dolguIsik.shadow.radius = dR;
    if (aoMat) { aoMat.blending = THREE.NormalBlending; aoMat.uniforms.agirlik.value = 1; aoMat.uniforms.tohum.value = 0; aoMat.uniforms.siddet.value = 1.15; }
    renderer.autoClear = otoTemizle; renderer.setRenderTarget(null);
    renderer.setPixelRatio(oran); renderer.setSize(w, h, false);
    renderer.shadowMap.needsUpdate = true;
    controls.enabled = true;
    renderde = false; kirli = true;
  }
  return veri;
}

// Bir karenin çizim süresi (ms, ekran kartı bitene kadar) ve çizim çağrısı sayısı; hız ölçümü için
export function kareOlc(n = 10) {
  const gl = renderer.getContext(), t = performance.now();
  for (let i = 0; i < n; i++) { renderer.render(scene, aktifKam); gl.finish(); }
  return { ms: Math.round((performance.now() - t) / n * 10) / 10, cagri: renderer.info.render.calls, ucgen: renderer.info.render.triangles };
}

// Oda koordinatındaki (mm) bir noktanın ekrandaki yeri; sınama için
export function ekranNoktasi(x, y, z) {
  controls.update(); aktifKam.updateMatrixWorld();
  const v = new THREE.Vector3(x / 1000, y / 1000, z / 1000).project(aktifKam);
  const r = renderer.domElement.getBoundingClientRect();
  return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, arkada: !(v.z > -1 && v.z < 1) }; // arkada: nokta kameranın arkasında
}

// Görsel: ekrandaki bakışı verilen genişlikte (varsayılan 2560 px) yeniden çizer; ekran boyutu değişmez
export function png(genislik = 2560, tur = 'image/png') {
  const c = renderer.domElement, w = c.clientWidth, h = c.clientHeight, oran = renderer.getPixelRatio();
  try {
    renderer.setPixelRatio(1);
    renderer.setSize(genislik, Math.round(genislik * h / w), false);
    aktifKam.updateMatrixWorld(); gorunurluk(); // kamera az önce değiştiyse duvar gizleme güncel olsun
    kareCiz();
    return c.toDataURL(tur, 0.9);
  } finally {
    renderer.setPixelRatio(oran);
    renderer.setSize(w, h, false);
    renderer.render(scene, aktifKam);
  }
}

// ---- Fotoğrafik görüntü için sahne dökümü ----------------------------------------------------
// Ekranda çizili sahneyi yol izleyicinin (fotomotor.js) anladığı biçime çevirir: eksenlere paralel kutular (santimetre),
// malzeme kodları, ışıklar ve kamera. Dolap parçaları çizilmiş ağlardan okunur; ekranda ne varsa fotoğrafta da o olur.
// Duvar, zemin ve tavan proje verisinden kalınlıklı kutular olarak kurulur (ekranda bunlar kalınlıksız yüzeylerdir).
const FOTO_KOD = { cambuzlu: 5, govde: 1, kapak: 1, baza: 1, dograma: 1, seramik: 1, tezgah: 3, inox: 11, kulp: 4, ayna: 4, siyah: 6, arasi: 6, koyu: 8, cam: 5, isik: 9, duvar: 10, ahsap: 2, tul: 17 };
// Parçanın malzeme türü ve deseni → motorun malzeme kodu (0: fotoğrafa girmez; tesisat ve not işaretleri)
// Tezgah arası ve duvar desenlerinin motordaki kodları (fotomotor.js, 19–25: ARTAPP eki); desensiz arası parlak yüzey (6), desensiz duvar 10
const FOTO_ARASI = { mermer: 16, metro: 24, fayans: 20, mozaik: 21, tugla: 25 }, FOTO_DUVAR = { kagit: 22, tugla: 19, beton: 23, fayans: 20 };
const fotoKod = (tur, d) => tur === 'kapak' ? (d === 'ahsap' ? 2 : 1) : tur === 'tezgah' ? (d === 'mermer' ? 16 : d === 'ahsap' ? 12 : 3)
  : tur === 'arasi' ? (FOTO_ARASI[d] || (d ? 14 : 6)) : tur === 'sari' || tur === 'mavi' || tur === 'kirmizi' ? 0 : FOTO_KOD[tur] || 1;

// Kutu olmayan ağ (silindir, çeyrek daire, eğik kesilmiş kutu): bir eksen boyunca dilimlere ayrılır, her dilim ağın o aralıkta
// kalan kısmının sınır kutusudur. Üç eksen de denenir; toplam hacmi en küçük olan (ağa en iyi oturan) seçilir. Ölçü: cm.
function fotoDilimle(o) {
  const pos = o.geometry.attributes.position, ix = o.geometry.index, v = new THREE.Vector3();
  const P = new Float32Array(pos.count * 3), alt = [1e9, 1e9, 1e9], ust = [-1e9, -1e9, -1e9];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
    P[i * 3] = v.x * 100; P[i * 3 + 1] = v.y * 100; P[i * 3 + 2] = v.z * 100;
    for (let a = 0; a < 3; a++) { alt[a] = Math.min(alt[a], P[i * 3 + a]); ust[a] = Math.max(ust[a], P[i * 3 + a]); }
  }
  const ucgen = Math.floor((ix ? ix.count : pos.count) / 3), kose = (t, k) => (ix ? ix.getX(t * 3 + k) : t * 3 + k) * 3;
  let iyi = null;
  for (let e = 0; e < 3; e++) {
    const boy = ust[e] - alt[e];
    if (boy < 0.05) continue;
    const N = Math.max(6, Math.min(48, Math.ceil(boy / 1))); // dilim kalınlığı yaklaşık 1 cm (en çok 48 dilim): yuvarlak parçalar basamaklı görünmesin
    const dilim = Array.from({ length: N }, () => [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]);
    for (let t = 0; t < ucgen; t++) for (let k = 0; k < 3; k++) {
      const a = kose(t, k), b = kose(t, (k + 1) % 3), a0 = P[a + e], b0 = P[b + e], kucuk = Math.min(a0, b0), buyuk = Math.max(a0, b0);
      const i0 = Math.max(0, Math.min(N - 1, Math.floor((kucuk - alt[e]) / boy * N))), i1 = Math.max(0, Math.min(N - 1, Math.ceil((buyuk - alt[e]) / boy * N) - 1));
      for (let i = i0; i <= i1; i++) {
        const lo = alt[e] + boy * i / N, hi = alt[e] + boy * (i + 1) / N, d = dilim[i];
        for (const s of [Math.max(lo, kucuk), Math.min(hi, buyuk)]) { // kenarın bu dilimde kalan parçasının iki ucu
          const u = buyuk - kucuk < 1e-9 ? 0 : (s - a0) / (b0 - a0);
          for (let c = 0; c < 3; c++) { const q = P[a + c] + (P[b + c] - P[a + c]) * u; if (q < d[c]) d[c] = q; if (q > d[c + 3]) d[c + 3] = q; }
        }
      }
    }
    let hacim = 0;
    const kutular = [];
    for (let i = 0; i < N; i++) {
      const d = dilim[i];
      if (d[3] < d[0]) continue;
      d[e] = alt[e] + boy * i / N; d[e + 3] = alt[e] + boy * (i + 1) / N;
      hacim += (d[3] - d[0]) * (d[4] - d[1]) * (d[5] - d[2]);
      kutular.push(d);
    }
    if (kutular.length && (!iyi || hacim < iyi.hacim)) iyi = { hacim, kutular };
  }
  return iyi ? iyi.kutular : [[...alt, ...ust]];
}

// W: görüntü genişliği (px); yükseklik ekrandaki çizim alanının oranından gelir. aksam: akşam ışığı. spot: projede lamba yoksa
// tavana kendiliğinden spot dizilir. Plan görünüşünde (perspektifsiz) null döner.
export function fotoSahne({ W = 1200, H: Histenen = 0, aksam = false, spot = true } = {}) {
  if (!proje || aktifKam !== cam) return null;
  kok.updateMatrixWorld(true); cam.updateMatrixWorld(); gorunurluk();
  // H verilmişse aynen kullanılır (canlı fotoğraf ekrandaki bakışla birebir örtüşmeli); verilmezse ekran oranından, en çok 1,5 kat boy
  const c = renderer.domElement, H = Histenen > 0 ? Math.round(Histenen) : Math.max(240, Math.round(W * Math.min(1.5, c.clientHeight / Math.max(1, c.clientWidth))));
  const { oda } = proje, ow = oda.w / 10, oh = oda.h / 10, od = oda.d / 10, K = 10, out = [], rk = new THREE.Color();
  const ekle = (x0, y0, z0, x1, y1, z1, r, g, b, kod) => {
    if (!(x1 - x0 >= 0 && y1 - y0 >= 0 && z1 - z0 >= 0)) return;
    const ince = 0.02; // sıfır kalınlıklı kutu ışını kaçırır
    if (x1 - x0 < ince) { x0 -= ince / 2; x1 += ince / 2; }
    if (y1 - y0 < ince) { y0 -= ince / 2; y1 += ince / 2; }
    if (z1 - z0 < ince) { z0 -= ince / 2; z1 += ince / 2; }
    out.push(x0, y0, z0, x1, y1, z1, r, g, b, kod);
  };
  const renkli = (k, hex, kod) => { rk.set(hex); ekle(k[0], k[1], k[2], k[3], k[4], k[5], rk.r, rk.g, rk.b, kod); };

  // Çizilmiş parçalar
  const fotoTex = plakaSec ? plaka(plakaSec.id).veri : null; // katalog tezgahının resmi (yüklüyse)
  const bicim = [], daralma = [], egik = []; // dekor: cisim başına biçim ve koni daralması (kutularda boş kalır); eğik elipsoitlerin ek verisi
  const b3 = new THREE.Box3();
  const gorunur = o => { for (let a = o; a && a !== scene; a = a.parent) if (!a.visible) return false; return true; };
  kok.traverse(o => {
    if (!o.isMesh || o.userData.yapi || !gorunur(o)) return;
    if (o.userData.dekor) { // dekor grubu: cisimler kendi biçimleriyle (yuvarlaklar yuvarlak) eklenir
      for (const d of o.userData.dekor) {
        const n0 = out.length;
        rk.set(d.r);
        ekle(d.b[0] / 10, d.b[1] / 10, d.b[2] / 10, d.b[3] / 10, d.b[4] / 10, d.b[5] / 10, rk.r, rk.g, rk.b, d.m);
        if (out.length > n0 && d.s === 5) { bicim[n0 / 10] = 5; daralma[n0 / 10] = egik.length / 15; for (let i = 0; i < 15; i++) egik.push(i < 6 ? d.e[i] / 10 : d.e[i]); }
        else if (out.length > n0 && d.s) { bicim[n0 / 10] = d.s; daralma[n0 / 10] = d.k || 1; }
      }
      return;
    }
    const mt = o.material;
    if (!mt || !mt.color || mt.opacity === 0) return;
    const plakali = mt.userData.tur === 'tezgah' && String(mt.userData.desen).startsWith('plaka:');
    const kod = mt === LED_MAT ? 9 : plakali ? (fotoTex ? 18 : 3) : fotoKod(mt.userData.tur, mt.userData.desen);
    if (!kod) return;
    const e = o.matrixWorld.elements, k = plakali && !fotoTex ? rk.set(plakaSec.renk) : mt.color;
    if (o.userData.kutular) { // birleştirilmiş süsleme ağı: her kutu ayrı ayrı dünya koordinatına çevrilir
      const a = o.userData.kutular, v0 = new THREE.Vector3(), v1 = new THREE.Vector3();
      for (let i = 0; i < a.length; i += 6) {
        v0.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(o.matrixWorld); v1.set(a[i] + a[i + 3], a[i + 1] + a[i + 4], a[i + 2] + a[i + 5]).applyMatrix4(o.matrixWorld);
        ekle(Math.min(v0.x, v1.x) * 100, Math.min(v0.y, v1.y) * 100, Math.min(v0.z, v1.z) * 100, Math.max(v0.x, v1.x) * 100, Math.max(v0.y, v1.y) * 100, Math.max(v0.z, v1.z) * 100, k.r, k.g, k.b, kod);
      }
      return;
    }
    // dönüş 90°'nin katıysa (duvar ve ada modülleri) kutu eksenlere paraleldir
    const duz = [0, 1, 2].every(i => { const a = [Math.abs(e[i]), Math.abs(e[4 + i]), Math.abs(e[8 + i])].sort((x, y) => y - x); return a[1] < a[0] * 1e-3; });
    if (duz && (o.geometry === KUTU || kutuGeo.has(o.geometry))) {
      b3.setFromObject(o);
      ekle(b3.min.x * 100, b3.min.y * 100, b3.min.z * 100, b3.max.x * 100, b3.max.y * 100, b3.max.z * 100, k.r, k.g, k.b, kod);
    } else if (duz && o.geometry === SIL) { // silindir (tabure, sarkıt, ayak, batarya): motora gerçek silindir olarak gider, basamaklı görünmez
      const ey = [Math.abs(e[4]), Math.abs(e[5]), Math.abs(e[6])], n0 = out.length;
      b3.setFromObject(o);
      ekle(b3.min.x * 100, b3.min.y * 100, b3.min.z * 100, b3.max.x * 100, b3.max.y * 100, b3.max.z * 100, k.r, k.g, k.b, kod);
      if (out.length > n0) { bicim[n0 / 10] = ey[1] >= ey[0] && ey[1] >= ey[2] ? 2 : ey[0] >= ey[2] ? 3 : 4; daralma[n0 / 10] = 1; }
    } else for (const d of fotoDilimle(o)) ekle(d[0], d[1], d[2], d[3], d[4], d[5], k.r, k.g, k.b, kod);
  });

  // Oda: zemin, tavan, duvarlar (kapı, pencere ve niş boşluklarıyla). Kameranın arkasında kaldığı duvar kurulmaz; içerisi oradan görünür.
  const kx = cam.position.x * 100, ky = cam.position.y * 100, kz = cam.position.z * 100;
  const icerde = kx > 0 && kx < ow && ky > 0 && ky < oh && kz > 0 && kz < od;
  const ds = proje.desen || {}, rn = proje.renk || {};
  renkli([-K, -4, -K, ow + K, 0, od + K], rn.zemin || '#c9a77c', ds.zemin === 'parke' ? 7 : ds.zemin === 'mermer' || ds.zemin === 'karo' ? 15 : 10);
  renkli([-K, oh, -K, ow + K, oh + 4, od + K], '#fbfaf7', 13);
  // Dışarıdan bakışta oda açık renkli geniş bir zemine oturur (stüdyo zemini): gölgesi düşer, arka plan boşlukta kalmaz
  if (!icerde) renkli([-3000, -6, -3000, ow + 3000, -4.05, od + 3000], '#e3e5e8', 10);
  const delik = { arka: [], on: [], sol: [], sag: [] };
  for (const m of proje.moduller) {
    if (!delik[m.duvar] || (m.tip !== 'pencere' && m.tip !== 'kapi' && m.tip !== 'nis')) continue;
    const q = kutu(m, oda), x = xEksenli(m.duvar);
    delik[m.duvar].push({ a0: (x ? q.x0 : q.z0) / 10, a1: (x ? q.x1 : q.z1) / 10, y0: m.y / 10, y1: (m.y + m.h) / 10 });
  }
  const acik = { arka: kz < 0, on: kz > od, sol: kx < 0, sag: kx > ow };
  const duvarKutu = { arka: r => [r.a0, r.y0, -K, r.a1, r.y1, 0], on: r => [r.a0, r.y0, od, r.a1, r.y1, od + K], sol: r => [-K, r.y0, r.a0, 0, r.y1, r.a1], sag: r => [ow, r.y0, r.a0, ow + K, r.y1, r.a1] };
  for (const ad of DUVAR_LISTE) {
    if (acik[ad]) continue;
    const L = ad === 'arka' || ad === 'on' ? ow : od;
    for (const r of delikliDikler([{ a0: 0, a1: L, y0: 0, y1: oh }], delik[ad])) renkli(duvarKutu[ad](r), rn.duvar || '#f4f1ea', FOTO_DUVAR[ds.duvar] || 10); // duvar deseni fotoğrafa da taşınır
  }
  if (proje.ayar?.asmaTavan) { // duvar boyunca düşük kuşak
    const en = Math.min(50, ow / 3, od / 3), y = oh - 15;
    for (const q of [[0, y, 0, ow, oh, en], [0, y, od - en, ow, oh, od], [0, y, 0, en, oh, od], [ow - en, y, 0, ow, oh, od]]) renkli(q, '#fbfaf7', 13);
  }
  const eg = proje.ayar?.egim;
  if (eg?.duvar) { // eğimli tavan: motor yalnızca eksenlere paralel kutu bildiği için ince basamaklarla kurulur
    const x = eg.duvar === 'sol' || eg.duvar === 'sag', mes = Math.min(eg.mesafe, x ? oda.w : oda.d) / 10, dusuk = eg.dusuk / 10, B = 24;
    for (let i = 0; i < B; i++) {
      const a = mes * i / B, b = mes * (i + 1) / B, y = dusuk + (oh - dusuk) * i / B;
      renkli(eg.duvar === 'arka' ? [0, y, a, ow, oh, b] : eg.duvar === 'on' ? [0, y, od - b, ow, oh, od - a] : eg.duvar === 'sol' ? [a, y, 0, b, oh, od] : [ow - b, y, 0, ow - a, oh, od], '#fbfaf7', 13);
    }
  }

  // Işıklar: projedeki lambalar; tavanda spot ya da tavan lambası yoksa (ve isteniyorsa) eşit aralıklı spotlar eklenir.
  // Sarkıt tek başına odayı aydınlatmaya yetmediği için spot sayılmaz.
  const SI = aksam ? 1 : 0.4, pl = [], tavanIsigi = proje.moduller.some(m => m.tip === 'spot' || m.tip === 'plafonyer');
  for (const m of proje.moduller) {
    const guc = m.tip === 'sarkit' ? 5000 : m.tip === 'spot' ? 20000 : m.tip === 'plafonyer' ? 26000 : 0;
    if (!guc) continue;
    const q = kutu(m, oda), sarkit = m.tip === 'sarkit';
    pl.push((q.x0 + q.x1) / 20, (m.y - 60) / 10, (q.z0 + q.z1) / 20, 1, sarkit ? 0.78 : 0.86, sarkit ? 0.55 : 0.7, guc * SI);
  }
  if (spot && !tavanIsigi) {
    const nx = Math.max(1, Math.round(ow / 120)), nz = Math.max(1, Math.round(od / 120));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = ow * (i + 0.5) / nx, z = od * (j + 0.5) / nz;
      pl.push(x, oh - 1, z, 1, 0.86, 0.7, 20000 * SI);
      // spotun gövdesi yalnızca içeriden bakışta çizilir: dışarıdan bakışta tavan görünmediği için havada asılı kalırdı
      if (icerde) renkli([x - 4, oh - 0.4, z - 4, x + 4, oh, z + 4], aksam ? '#fff1dc' : '#f4f3ef', aksam ? 9 : 1);
    }
  }
  if (!pl.length) pl.push(0, 0, 0, 0, 0, 0, 0); // motor en az bir ışık kaydı bekler
  // Güneş: en büyük pencerenin dışından, çapraz ve yukarıdan gelir; pencere yoksa önden soldan
  let gunes = [-0.5, 0.42, 0.76];
  const pencere = proje.moduller.filter(m => m.tip === 'pencere').sort((a, b) => b.w * b.h - a.w * a.h)[0];
  const dis = pencere && { arka: [0, -1], on: [0, 1], sol: [-1, 0], sag: [1, 0] }[pencere.duvar];
  if (dis) gunes = [dis[0] * 0.72 + (dis[1] ? 0.45 : 0), 0.42, dis[1] * 0.72 + (dis[0] ? 0.45 : 0)];
  const gb = Math.hypot(gunes[0], gunes[1], gunes[2]);
  gunes = gunes.map(v => v / gb);

  // Kamera: ekrandaki bakış
  const fw = new THREE.Vector3();
  cam.getWorldDirection(fw);
  const rt = new THREE.Vector3(-fw.z, 0, fw.x);
  if (rt.lengthSq() < 1e-10) rt.set(1, 0, 0);
  rt.normalize();
  const up = new THREE.Vector3().crossVectors(rt, fw);
  const N = out.length / 10, yuvarlakVar = bicim.length > 0;
  return {
    shp: yuvarlakVar ? Uint8Array.from({ length: N }, (_, i) => bicim[i] || 0) : null, shq: yuvarlakVar ? Float32Array.from({ length: N }, (_, i) => bicim[i] === 5 ? daralma[i] : daralma[i] || 1) : null, shx: egik.length ? new Float32Array(egik) : null,
    boxes: new Float32Array(out), n: out.length / 10,
    cam: { p: [kx, ky, kz], fw: fw.toArray(), rt: rt.toArray(), up: up.toArray(), W, H, F: (H / 2) / Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) },
    inside: icerde, sun: gunes, sunC: [3.4, 3.05, 2.6], exp: 1.15, led: aksam ? 40 : 12, seed: 1, pl, night: aksam, tex: fotoTex, texG: fotoTex && plakaSec.parlak ? 1 : 0, texS: fotoTex ? plakaSec.olcek : 320,
  };
}
