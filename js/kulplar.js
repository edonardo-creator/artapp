// Kulp kataloğu: genel modeller, katalog satırları (biçim ve boy) ve bir kulpun parça kutuları.
// Liste ve biçim ölçüleri aynı sahibin eB Creator uygulamasındaki kulp seçimlerinden alınmıştır (orada santimetre, burada milimetre).
// Katalog satırlarında marka adı ve üretici kodu tutulmaz; eB Creator'da gösterilen aile adı ve ölçü etiketi tutulur.

// Kulp renkleri (yüzey): [kod, ad, renk]
export const KULP_RENKLERI = [['inox', 'Inox', '#AEB2B5'], ['krom', 'Krom', '#C9CCCF'], ['siyah', 'Siyah', '#161616'], ['pirinc', 'Pirinç', '#B8943F']];
// Biçim sınıfları
export const KULP_BICIMLERI = { bar: 'çubuk', bow: 'kavisli', u: 'köşeli', flat: 'yassı profil', classic: 'porselenli klasik', knob: 'düğme', ring: 'halka', cup: 'kepçe', tir: 'kenar profil' };
// Genel modeller: [kod, ad, biçim, boy (mm)]. 'boy', 'gola' ve 'yok' kulp parçası üretmez ya da kendi kuralıyla üretir (moduller.js).
export const KULP_GENEL = [['cubuk', 'Çubuk kulp 16 cm', 'bar', 160], ['c32', 'Uzun çubuk 32 cm', 'bar', 320], ['dug', 'Düğme kulp', 'knob', 26], ['tir', 'Kenar profil (tırnak)', 'tir', 200],
  ['boy', 'Boy kulp', 'boy', 0], ['gola', 'Gola (kulpsuz kanal)', 'gola', 0], ['yok', 'Kulpsuz', 'yok', 0]];
// Katalog grupları (eB Creator'daki adlarıyla)
export const KULP_GRUPLARI = ['Adlı modeller', 'Numaralı modeller', 'Seri kodlu', 'Genel'];
// Katalog: [kod, biçim, boy (mm), grup, aile adı, ölçü etiketi]
export const KULP_KATALOG = [
  ['k001', 'bow', 158, 'Adlı modeller', 'Abby', '128 mm'], ['k002', 'bow', 190, 'Adlı modeller', 'Abby', '160 mm'], ['k003', 'flat', 116, 'Adlı modeller', 'Alexis', '96 mm'],
  ['k004', 'flat', 148, 'Adlı modeller', 'Alexis', '128 mm'], ['k005', 'flat', 180, 'Adlı modeller', 'Alexis', '160 mm'], ['k006', 'flat', 212, 'Adlı modeller', 'Alexis', '192 mm'],
  ['k007', 'flat', 248, 'Adlı modeller', 'Alexis', '228 mm'], ['k008', 'flat', 340, 'Adlı modeller', 'Alexis', '320 mm'], ['k009', 'bow', 126, 'Adlı modeller', 'Anne Clair', '96 mm'],
  ['k010', 'bow', 158, 'Adlı modeller', 'Anne Clair', '128 mm'], ['k011', 'bow', 190, 'Adlı modeller', 'Anne Clair', '160 mm'], ['k012', 'flat', 148, 'Adlı modeller', 'Bella', '128 mm'],
  ['k013', 'flat', 212, 'Adlı modeller', 'Bella', '192 mm'], ['k014', 'flat', 276, 'Adlı modeller', 'Bella', '256 mm'], ['k015', 'bar', 184, 'Adlı modeller', 'Bernard', '160 mm'],
  ['k016', 'bar', 248, 'Adlı modeller', 'Bernard', '224 mm'], ['k017', 'classic', 131, 'Adlı modeller', 'Bertha', '96 mm'], ['k018', 'classic', 163, 'Adlı modeller', 'Bertha', '128 mm'],
  ['k019', 'knob', 40, 'Adlı modeller', 'Betty', 'Düğme'], ['k020', 'classic', 131, 'Adlı modeller', 'Betty', '96 mm'], ['k021', 'classic', 163, 'Adlı modeller', 'Betty', '128 mm'],
  ['k022', 'flat', 148, 'Adlı modeller', 'Brocke', '128 mm'], ['k023', 'flat', 180, 'Adlı modeller', 'Brocke', '160 mm'], ['k024', 'flat', 244, 'Adlı modeller', 'Brocke', '224 mm'],
  ['k025', 'flat', 308, 'Adlı modeller', 'Brocke', '288 mm'], ['k026', 'bow', 126, 'Adlı modeller', 'Ceressa', '96 mm'], ['k027', 'bow', 158, 'Adlı modeller', 'Ceressa', '128 mm'],
  ['k028', 'bow', 190, 'Adlı modeller', 'Ceressa', '160 mm'], ['k029', 'bow', 254, 'Adlı modeller', 'Ceressa', '224 mm'], ['k030', 'bow', 126, 'Adlı modeller', 'Chloe', '96 mm'],
  ['k031', 'u', 184, 'Adlı modeller', 'Cube', '160 mm'], ['k032', 'u', 216, 'Adlı modeller', 'Cube', '192 mm'], ['k033', 'u', 344, 'Adlı modeller', 'Cube', '320 mm'],
  ['k034', 'flat', 148, 'Adlı modeller', 'Dakota', '128 mm'], ['k035', 'flat', 180, 'Adlı modeller', 'Dakota', '160 mm'], ['k036', 'flat', 212, 'Adlı modeller', 'Dakota', '192 mm'],
  ['k037', 'flat', 244, 'Adlı modeller', 'Dakota', '224 mm'], ['k038', 'flat', 340, 'Adlı modeller', 'Dakota', '320 mm'], ['k039', 'knob', 45, 'Adlı modeller', 'Daphne', '64 mm'],
  ['k040', 'classic', 131, 'Adlı modeller', 'Dorothy', '96 mm'], ['k041', 'classic', 163, 'Adlı modeller', 'Dorothy', '128 mm'], ['k042', 'classic', 195, 'Adlı modeller', 'Dorothy', '160 mm'],
  ['k043', 'ring', 40, 'Adlı modeller', 'Drop', 'Düğme'], ['k044', 'ring', 45, 'Adlı modeller', 'Drop', '96 mm'], ['k045', 'ring', 45, 'Adlı modeller', 'Drop', '128 mm'],
  ['k046', 'flat', 148, 'Adlı modeller', 'Edna', '128 mm'], ['k047', 'flat', 180, 'Adlı modeller', 'Edna', '160 mm'], ['k048', 'flat', 148, 'Adlı modeller', 'Elmer', '128 mm'],
  ['k049', 'flat', 180, 'Adlı modeller', 'Elmer', '160 mm'], ['k050', 'flat', 276, 'Adlı modeller', 'Elmer', '256 mm'], ['k051', 'classic', 131, 'Adlı modeller', 'Elsie', '96 mm'],
  ['k052', 'classic', 163, 'Adlı modeller', 'Elsie', '128 mm'], ['k053', 'flat', 116, 'Adlı modeller', 'Enzo', '96 mm'], ['k054', 'flat', 148, 'Adlı modeller', 'Enzo', '128 mm'],
  ['k055', 'knob', 45, 'Adlı modeller', 'Flandra', 'Düğme'], ['k056', 'bow', 126, 'Adlı modeller', 'Flandra', '96 mm'], ['k057', 'bow', 158, 'Adlı modeller', 'Flandra', '128 mm'],
  ['k058', 'knob', 45, 'Adlı modeller', 'Flower', 'Düğme'], ['k059', 'bow', 190, 'Adlı modeller', 'Flower', '160 mm'], ['k060', 'bow', 126, 'Adlı modeller', 'Gestrud', '96 mm'],
  ['k061', 'bow', 158, 'Adlı modeller', 'Gestrud', '128 mm'], ['k062', 'knob', 28, 'Adlı modeller', 'Georgetown', 'Düğme'], ['k063', 'classic', 131, 'Adlı modeller', 'Georgetown', '96 mm'],
  ['k064', 'flat', 180, 'Adlı modeller', 'Hannah', '160 mm'], ['k065', 'flat', 212, 'Adlı modeller', 'Hannah', '192 mm'], ['k066', 'flat', 244, 'Adlı modeller', 'Hannah', '224 mm'],
  ['k067', 'knob', 26, 'Adlı modeller', 'Hazel', 'Düğme'], ['k068', 'classic', 131, 'Adlı modeller', 'Hazel', '96 mm'], ['k069', 'classic', 163, 'Adlı modeller', 'Hazel', '128 mm'],
  ['k070', 'knob', 36, 'Adlı modeller', 'Industry', 'Düğme'], ['k071', 'u', 184, 'Adlı modeller', 'Industry', '160 mm'], ['k072', 'flat', 180, 'Adlı modeller', 'Irene', '160 mm'],
  ['k073', 'flat', 244, 'Adlı modeller', 'Irene', '224 mm'], ['k074', 'flat', 340, 'Adlı modeller', 'Irene', '320 mm'], ['k075', 'knob', 45, 'Adlı modeller', 'Journey', 'Düğme'],
  ['k076', 'bow', 158, 'Adlı modeller', 'Journey', '128 mm'], ['k077', 'bar', 184, 'Adlı modeller', 'July', '160 mm'], ['k078', 'bar', 248, 'Adlı modeller', 'July', '224 mm'],
  ['k079', 'bar', 344, 'Adlı modeller', 'July', '320 mm'], ['k080', 'u', 152, 'Adlı modeller', 'Katarina', '128 mm'], ['k081', 'knob', 26, 'Adlı modeller', 'Kato', 'Düğme'],
  ['k082', 'bow', 126, 'Adlı modeller', 'Kato', '96 mm'], ['k083', 'flat', 180, 'Adlı modeller', 'Knite', '160 mm'], ['k084', 'flat', 276, 'Adlı modeller', 'Knite', '256 mm'],
  ['k085', 'knob', 45, 'Adlı modeller', 'Lean', 'Düğme'], ['k086', 'classic', 163, 'Adlı modeller', 'Lean', '128 mm'], ['k087', 'flat', 148, 'Adlı modeller', 'Lena2', '128 mm'],
  ['k088', 'flat', 212, 'Adlı modeller', 'Lena2', '192 mm'], ['k089', 'flat', 308, 'Adlı modeller', 'Lena2', '288 mm'], ['k090', 'u', 184, 'Adlı modeller', 'Liberta', '160 mm'],
  ['k091', 'u', 248, 'Adlı modeller', 'Liberta', '224 mm'], ['k092', 'u', 344, 'Adlı modeller', 'Liberta', '320 mm'], ['k093', 'bar', 152, 'Adlı modeller', 'Lindsey', '128 mm'],
  ['k094', 'bar', 184, 'Adlı modeller', 'Lindsey', '160 mm'], ['k095', 'bar', 248, 'Adlı modeller', 'Lindsey', '224 mm'], ['k096', 'bar', 312, 'Adlı modeller', 'Lindsey', '288 mm'],
  ['k097', 'ring', 42, 'Adlı modeller', 'Lone', 'Düğme'], ['k098', 'ring', 45, 'Adlı modeller', 'Lone', '32 mm'], ['k099', 'flat', 180, 'Adlı modeller', 'Marcello', '160 mm'],
  ['k100', 'flat', 212, 'Adlı modeller', 'Marcello', '192 mm'], ['k101', 'flat', 244, 'Adlı modeller', 'Marcello', '224 mm'], ['k102', 'flat', 340, 'Adlı modeller', 'Marcello', '320 mm'],
  ['k103', 'flat', 220, 'Adlı modeller', 'Mia', '200 mm'], ['k104', 'flat', 370, 'Adlı modeller', 'Mia', '350 mm'], ['k105', 'flat', 420, 'Adlı modeller', 'Mia', '400 mm'],
  ['k106', 'flat', 520, 'Adlı modeller', 'Mia', '500 mm'], ['k107', 'flat', 620, 'Adlı modeller', 'Mia', '600 mm'], ['k108', 'flat', 820, 'Adlı modeller', 'Mia', '800 mm'],
  ['k109', 'tir', 400, 'Adlı modeller', 'Mia Side', '400 mm'], ['k110', 'tir', 500, 'Adlı modeller', 'Mia Side', '500 mm'], ['k111', 'tir', 600, 'Adlı modeller', 'Mia Side', '600 mm'],
  ['k112', 'tir', 800, 'Adlı modeller', 'Mia Side', '800 mm'], ['k113', 'tir', 1000, 'Adlı modeller', 'Mia Side', '1000 mm'], ['k114', 'bar', 152, 'Adlı modeller', 'Molle', '128 mm'],
  ['k115', 'bar', 216, 'Adlı modeller', 'Molle', '192 mm'], ['k116', 'bar', 184, 'Adlı modeller', 'Norman', '160 mm'], ['k117', 'bar', 248, 'Adlı modeller', 'Norman', '224 mm'],
  ['k118', 'classic', 195, 'Adlı modeller', 'Olive', '160 mm'], ['k119', 'classic', 227, 'Adlı modeller', 'Olive', '192 mm'], ['k120', 'bow', 126, 'Adlı modeller', 'Passo', '96 mm'],
  ['k121', 'bow', 190, 'Adlı modeller', 'Passo', '160 mm'], ['k122', 'bow', 350, 'Adlı modeller', 'Passo', '320 mm'], ['k123', 'classic', 131, 'Adlı modeller', 'Paul', '96 mm'],
  ['k124', 'classic', 163, 'Adlı modeller', 'Paul', '128 mm'], ['k125', 'classic', 195, 'Adlı modeller', 'Paul', '160 mm'], ['k126', 'bow', 126, 'Adlı modeller', 'Peyton', '96 mm'],
  ['k127', 'bow', 158, 'Adlı modeller', 'Peyton', '128 mm'], ['k128', 'flat', 148, 'Adlı modeller', 'Rebecca', '128 mm'], ['k129', 'flat', 180, 'Adlı modeller', 'Rebecca', '160 mm'],
  ['k130', 'u', 152, 'Adlı modeller', 'Rigid', '128 mm'], ['k131', 'u', 248, 'Adlı modeller', 'Rigid', '224 mm'], ['k132', 'u', 312, 'Adlı modeller', 'Rigid', '288 mm'],
  ['k133', 'bow', 158, 'Adlı modeller', 'Root', '128 mm'], ['k134', 'bow', 190, 'Adlı modeller', 'Root', '160 mm'], ['k135', 'u', 120, 'Adlı modeller', 'Ryan', '96 mm'],
  ['k136', 'u', 152, 'Adlı modeller', 'Ryan', '128 mm'], ['k137', 'u', 216, 'Adlı modeller', 'Ryan', '192 mm'], ['k138', 'u', 312, 'Adlı modeller', 'Ryan', '288 mm'],
  ['k139', 'ring', 44, 'Adlı modeller', 'Satu', 'Düğme'], ['k140', 'ring', 45, 'Adlı modeller', 'Satu', '96 mm'], ['k141', 'classic', 131, 'Adlı modeller', 'Stone', '96 mm'],
  ['k142', 'classic', 163, 'Adlı modeller', 'Stone', '128 mm'], ['k143', 'bar', 120, 'Adlı modeller', 'Thor', '96 mm'], ['k144', 'bar', 152, 'Adlı modeller', 'Thor', '128 mm'],
  ['k145', 'bar', 184, 'Adlı modeller', 'Thor', '160 mm'], ['k146', 'bar', 216, 'Adlı modeller', 'Thor', '192 mm'], ['k147', 'bar', 280, 'Adlı modeller', 'Thor', '256 mm'],
  ['k148', 'u', 184, 'Adlı modeller', 'Umberto', '160 mm'], ['k149', 'u', 248, 'Adlı modeller', 'Umberto', '224 mm'], ['k150', 'u', 344, 'Adlı modeller', 'Umberto', '320 mm'],
  ['k151', 'u', 56, 'Adlı modeller', 'Vera', '32 mm'], ['k152', 'u', 216, 'Adlı modeller', 'Vera', '192 mm'], ['k153', 'bar', 120, 'Adlı modeller', 'Vienna', '96 mm'],
  ['k154', 'bar', 216, 'Adlı modeller', 'Vienna', '192 mm'], ['k155', 'bar', 344, 'Adlı modeller', 'Vienna', '320 mm'], ['k156', 'classic', 131, 'Adlı modeller', 'Violet', '96 mm'],
  ['k157', 'classic', 163, 'Adlı modeller', 'Violet', '128 mm'], ['k158', 'knob', 24, 'Adlı modeller', 'Arco', 'Düğme'], ['k159', 'bow', 158, 'Adlı modeller', 'Bloomsbury', '128 mm'],
  ['k160', 'flat', 180, 'Adlı modeller', 'Lennon', '160 mm'], ['k161', 'bow', 126, 'Adlı modeller', 'Nove', '96 mm'], ['k162', 'classic', 131, 'Adlı modeller', 'Roze', '96 mm'],
  ['k163', 'u', 120, 'Adlı modeller', 'Sophie', '96 mm'], ['k164', 'bow', 126, 'Adlı modeller', 'Zar', '96 mm'], ['k165', 'u', 184, 'Adlı modeller', 'Zeta', '160 mm'],
  ['k166', 'knob', 45, 'Adlı modeller', 'Blacky', 'Düğme'], ['k167', 'knob', 45, 'Adlı modeller', 'Dale', 'Düğme'], ['k168', 'knob', 28, 'Adlı modeller', 'Fungo', 'Düğme'],
  ['k169', 'knob', 35, 'Adlı modeller', 'Gelato', 'Düğme'], ['k170', 'ring', 38, 'Adlı modeller', 'Geraldine', 'Düğme'], ['k171', 'ring', 44, 'Adlı modeller', 'Hendel', '32 mm'],
  ['k172', 'knob', 40, 'Adlı modeller', 'Olifanta', 'Düğme'], ['k173', 'knob', 45, 'Adlı modeller', 'Flybo', 'Düğme'], ['k174', 'knob', 44, 'Adlı modeller', 'Opal', 'Düğme'],
  ['k175', 'knob', 45, 'Adlı modeller', 'Pearl', 'Düğme'], ['k176', 'knob', 36, 'Adlı modeller', 'Vasso', 'Düğme'], ['k177', 'u', 208, 'Genel', 'Kalın kulp A17', ''],
  ['k178', 'u', 94, 'Genel', 'Kulp 1', ''], ['k179', 'cup', 34, 'Genel', 'Kulp 2', ''], ['k180', 'bow', 173, 'Genel', 'Kulp 3', ''],
  ['k181', 'bow', 173, 'Genel', 'Kulp 4', ''], ['k182', 'bar', 304, 'Genel', 'Kulp 7', ''], ['k183', 'bow', 168, 'Genel', 'Kulp 11', ''],
  ['k184', 'bow', 168, 'Genel', 'Kulp 12', ''], ['k185', 'bow', 168, 'Genel', 'Kulp 12A', ''], ['k186', 'bow', 164, 'Genel', 'Kulp 13', ''],
  ['k187', 'bow', 178, 'Genel', 'Kulp 14', ''], ['k188', 'bow', 176, 'Genel', 'Kulp 16', ''], ['k189', 'bow', 168, 'Genel', 'Kulp 17', ''],
  ['k190', 'classic', 186, 'Genel', 'Kulp 18', ''], ['k191', 'bow', 190, 'Genel', 'Kulp 19', ''], ['k192', 'knob', 45, 'Genel', 'Kulp 20', ''],
  ['k193', 'bar', 154, 'Genel', 'Kulp 21', ''], ['k194', 'bow', 208, 'Genel', 'Kulp 41', ''], ['k195', 'bar', 184, 'Genel', 'Kulp 42', ''],
  ['k196', 'bow', 208, 'Genel', 'Kulp 43', ''], ['k197', 'bow', 168, 'Genel', 'Kulp 44', ''], ['k198', 'bow', 190, 'Genel', 'Kulp 45', ''],
  ['k199', 'knob', 45, 'Genel', 'Kulp 50', ''], ['k200', 'classic', 136, 'Genel', 'Rustik', ''], ['k201', 'cup', 128, 'Genel', 'İzmira', ''],
  ['k202', 'bar', 125, 'Genel', 'Lobut', ''], ['k203', 'bow', 168, 'Genel', 'Mostar', ''], ['k204', 'bow', 157, 'Genel', 'Bond', ''],
  ['k205', 'knob', 30, 'Genel', 'Fruko', ''], ['k206', 'knob', 40, 'Genel', 'Nokta', ''], ['k207', 'tir', 160, 'Genel', 'Tırtık', ''],
  ['k208', 'cup', 48, 'Genel', 'Tırtık 2', ''], ['k209', 'bow', 168, 'Genel', 'Yay', ''], ['k210', 'flat', 179, 'Genel', 'Aralık', ''],
  ['k211', 'classic', 160, 'Genel', 'İkili', ''], ['k212', 'tir', 160, 'Genel', 'Fuga', ''], ['k213', 'bow', 139, 'Genel', 'S kulp', ''],
  ['k214', 'bow', 168, 'Genel', 'Sivri', ''], ['k215', 'u', 304, 'Genel', 'Uzun kulp 52', ''], ['k216', 'u', 192, 'Genel', 'İnce kulp 53', ''],
  ['k217', 'bow', 160, 'Genel', 'Kavisli kulp 55', ''], ['k218', 'u', 200, 'Genel', 'Köşeli kulp 56', ''], ['k219', 'knob', 45, 'Genel', 'Bakır düğme 57', ''],
  ['k220', 'cup', 96, 'Genel', 'Bakır kulp 58', ''], ['k221', 'knob', 30, 'Genel', 'Yuvarlak düğme 59', ''], ['k222', 'knob', 40, 'Genel', 'Model 101', ''],
  ['k223', 'knob', 30, 'Genel', 'Model 102', ''], ['k224', 'knob', 40, 'Genel', 'Model 105', ''], ['k225', 'bow', 80, 'Genel', 'Model 201', ''],
  ['k226', 'bow', 173, 'Genel', 'Model 303', ''], ['k227', 'cup', 192, 'Genel', 'Model 305', ''], ['k228', 'bow', 160, 'Genel', 'Model 402', ''],
  ['k229', 'bow', 112, 'Genel', 'Model 403', ''], ['k230', 'bow', 96, 'Genel', 'Model 404', ''], ['k231', 'bar', 128, 'Genel', 'Model 409', ''],
  ['k232', 'u', 160, 'Genel', 'Model 410', ''], ['k233', 'bar', 176, 'Genel', 'Model 501', ''], ['k234', 'bow', 176, 'Genel', 'Model 502', ''],
  ['k235', 'u', 160, 'Genel', 'Model 503', ''], ['k236', 'u', 160, 'Genel', 'Model 507', ''], ['k237', 'bow', 112, 'Genel', 'Model 509', ''],
  ['k238', 'bow', 208, 'Genel', 'Model 701', ''], ['k239', 'classic', 144, 'Genel', 'Model 411', ''], ['k240', 'u', 176, 'Genel', 'Model 185', ''],
  ['k241', 'knob', 45, 'Genel', 'Model 108', ''], ['k242', 'u', 112, 'Genel', 'Model 301', ''], ['k243', 'bow', 144, 'Genel', 'Model 405', ''],
  ['k244', 'bar', 160, 'Genel', 'Model 511', ''], ['k245', 'bar', 192, 'Genel', 'Model 510', ''], ['k246', 'bar', 144, 'Genel', 'Model 805', ''],
  ['k247', 'bar', 208, 'Genel', 'Model 813', ''], ['k248', 'bar', 192, 'Genel', 'Model 804', ''], ['k249', 'classic', 144, 'Genel', 'Model 512', ''],
  ['k250', 'bar', 176, 'Genel', 'Model 806', ''], ['k251', 'knob', 40, 'Genel', 'Model 110', ''], ['k252', 'bow', 208, 'Genel', 'Model 703', ''],
  ['k253', 'knob', 40, 'Genel', 'Model 109', ''], ['k254', 'bow', 190, 'Seri kodlu', 'Seri 242', '160 mm'], ['k255', 'bow', 222, 'Seri kodlu', 'Seri 242', '192 mm'],
  ['k256', 'bow', 158, 'Seri kodlu', 'Seri 245', '128 mm'], ['k257', 'bow', 190, 'Seri kodlu', 'Seri 245', '160 mm'], ['k258', 'bow', 222, 'Seri kodlu', 'Seri 245', '192 mm'],
  ['k259', 'flat', 180, 'Seri kodlu', 'Seri 246', '160 mm'], ['k260', 'flat', 212, 'Seri kodlu', 'Seri 246', '192 mm'], ['k261', 'u', 152, 'Seri kodlu', 'Seri 248', '128 mm'],
  ['k262', 'u', 184, 'Seri kodlu', 'Seri 248', '160 mm'], ['k263', 'u', 216, 'Seri kodlu', 'Seri 248', '192 mm'], ['k264', 'bow', 190, 'Seri kodlu', 'Seri 249', '160 mm'],
  ['k265', 'bow', 222, 'Seri kodlu', 'Seri 249', '192 mm'], ['k266', 'u', 184, 'Seri kodlu', 'Seri 252', '160 mm'], ['k267', 'u', 216, 'Seri kodlu', 'Seri 252', '192 mm'],
  ['k268', 'u', 184, 'Seri kodlu', 'Seri 253', '160 mm'], ['k269', 'u', 216, 'Seri kodlu', 'Seri 253', '192 mm'], ['k270', 'knob', 30, 'Genel', 'Model 468032', ''],
  ['k271', 'knob', 35, 'Genel', 'Model 467032', ''], ['k272', 'cup', 32, 'Genel', 'Model 466032', ''], ['k273', 'knob', 30, 'Genel', 'Model 465025', ''],
  ['k274', 'knob', 30, 'Genel', 'Model 464025', ''], ['k275', 'bow', 190, 'Seri kodlu', 'Seri 286', '160 mm'], ['k276', 'bow', 222, 'Seri kodlu', 'Seri 269', '192 mm'],
  ['k277', 'bow', 190, 'Seri kodlu', 'Seri 269', '160 mm'], ['k278', 'cup', 148, 'Seri kodlu', 'Seri 268', '128 mm'], ['k279', 'u', 216, 'Seri kodlu', 'Seri 267', '192 mm'],
  ['k280', 'u', 184, 'Seri kodlu', 'Seri 267', '160 mm'], ['k281', 'bow', 190, 'Seri kodlu', 'Seri 258', '160 mm'], ['k282', 'flat', 148, 'Seri kodlu', 'Seri 262', '128 mm'],
  ['k283', 'flat', 116, 'Seri kodlu', 'Seri 262', '96 mm'], ['k284', 'bow', 222, 'Seri kodlu', 'Seri 258', '192 mm'], ['k285', 'cup', 180, 'Seri kodlu', 'Seri 266', '160 mm'],
  ['k286', 'cup', 180, 'Seri kodlu', 'Seri 265', '160 mm'], ['k287', 'cup', 180, 'Seri kodlu', 'Seri 264', '160 mm'], ['k288', 'bow', 128, 'Seri kodlu', 'Seri 263', '1'],
  ['k289', 'bow', 160, 'Seri kodlu', 'Seri 263', '2'], ['k290', 'bow', 176, 'Seri kodlu', 'Seri 263', '3'], ['k291', 'bow', 208, 'Seri kodlu', 'Seri 263', '4'],
  ['k292', 'flat', 192, 'Genel', 'Model 1110740415', ''], ['k293', 'u', 176, 'Genel', 'Model 1090940210', ''], ['k294', 'bow', 106, 'Genel', 'Model 103602014', ''],
  ['k295', 'bow', 155, 'Genel', 'Model 107186038', ''], ['k296', 'bar', 117, 'Genel', 'Model 102559016', ''], ['k297', 'bow', 165, 'Genel', 'Model 102274205', ''],
  ['k298', 'bow', 155, 'Genel', 'Model 103842047', ''], ['k299', 'bow', 155, 'Genel', 'Model 1097840311', ''], ['k300', 'ring', 30, 'Genel', 'Model 101181201', ''],
  ['k301', 'ring', 30, 'Genel', 'Model 105943502', ''], ['k302', 'ring', 30, 'Genel', 'Model 110760113', ''], ['k303', 'bow', 230, 'Numaralı modeller', 'No 242', '200 mm'],
  ['k304', 'bow', 260, 'Numaralı modeller', 'No 242', '230 mm'], ['k305', 'bow', 230, 'Numaralı modeller', 'No 247', '200 mm'], ['k306', 'bow', 270, 'Numaralı modeller', 'No 247', '240 mm'],
  ['k307', 'u', 204, 'Numaralı modeller', 'No 250', '180 mm'], ['k308', 'u', 244, 'Numaralı modeller', 'No 250', '220 mm'], ['k309', 'u', 204, 'Numaralı modeller', 'No 253', '180 mm'],
  ['k310', 'u', 234, 'Numaralı modeller', 'No 253', '210 mm'], ['k311', 'u', 184, 'Numaralı modeller', 'No 254', '160 mm'], ['k312', 'u', 214, 'Numaralı modeller', 'No 254', '190 mm'],
  ['k313', 'u', 244, 'Numaralı modeller', 'No 254', '220 mm'], ['k314', 'u', 204, 'Numaralı modeller', 'No 257', '180 mm'], ['k315', 'u', 234, 'Numaralı modeller', 'No 257', '210 mm'],
  ['k316', 'u', 264, 'Numaralı modeller', 'No 257', '240 mm'], ['k317', 'bow', 130, 'Numaralı modeller', 'No 263', '100 mm'], ['k318', 'bow', 190, 'Numaralı modeller', 'No 263', '160 mm'],
  ['k319', 'bow', 230, 'Numaralı modeller', 'No 263', '200 mm'], ['k320', 'bow', 260, 'Numaralı modeller', 'No 263', '230 mm'], ['k321', 'bow', 210, 'Numaralı modeller', 'No 833', '180 mm'],
  ['k322', 'bow', 190, 'Numaralı modeller', 'No 858', '160 mm'], ['k323', 'bow', 230, 'Numaralı modeller', 'No 858', '200 mm'], ['k324', 'bow', 190, 'Numaralı modeller', 'No 861', '160 mm'],
  ['k325', 'bow', 230, 'Numaralı modeller', 'No 861', '200 mm'], ['k326', 'bow', 230, 'Numaralı modeller', 'No 866', '200 mm'], ['k327', 'bow', 290, 'Numaralı modeller', 'No 866', '260 mm'],
  ['k328', 'bow', 230, 'Numaralı modeller', 'No 869', '200 mm'], ['k329', 'bow', 300, 'Numaralı modeller', 'No 869', '270 mm'], ['k330', 'u', 234, 'Numaralı modeller', 'No 874', '210 mm'],
  ['k331', 'u', 104, 'Numaralı modeller', 'No 874', '80 mm'], ['k332', 'u', 224, 'Numaralı modeller', 'No 875', '200 mm'], ['k333', 'u', 104, 'Numaralı modeller', 'No 875', '80 mm'],
  ['k334', 'bow', 210, 'Numaralı modeller', 'No 894', '180 mm'], ['k335', 'bow', 280, 'Numaralı modeller', 'No 894', '250 mm'], ['k336', 'bow', 350, 'Seri kodlu', 'Seri 256', '320 mm'],
  ['k337', 'bow', 222, 'Seri kodlu', 'Seri 256', '192 mm'], ['k338', 'bow', 190, 'Seri kodlu', 'Seri 256', '160 mm'], ['k339', 'bow', 470, 'Seri kodlu', 'Seri 879', '440 mm'],
  ['k340', 'bow', 370, 'Seri kodlu', 'Seri 879', '340 mm'], ['k341', 'bow', 250, 'Seri kodlu', 'Seri 879', '220 mm'], ['k342', 'bow', 210, 'Seri kodlu', 'Seri 879', '180 mm'],
  ['k343', 'bow', 470, 'Seri kodlu', 'Seri 883', '440 mm'], ['k344', 'bow', 370, 'Seri kodlu', 'Seri 883', '340 mm'], ['k345', 'bow', 240, 'Seri kodlu', 'Seri 883', '210 mm'],
  ['k346', 'flat', 340, 'Genel', 'L profil kulp', '320 mm'], ['k347', 'flat', 244, 'Genel', 'L profil kulp', '224 mm'], ['k348', 'flat', 148, 'Genel', 'L profil kulp', '128 mm'],
  ['k349', 'flat', 116, 'Genel', 'L profil kulp', '96 mm'], ['k350', 'bar', 344, 'Genel', 'Yuvarlak çubuk kulp', '320 mm'], ['k351', 'bar', 248, 'Genel', 'Yuvarlak çubuk kulp', '224 mm'],
  ['k352', 'bar', 152, 'Genel', 'Yuvarlak çubuk kulp', '128 mm'], ['k353', 'bar', 120, 'Genel', 'Yuvarlak çubuk kulp', '96 mm'],
];
const GENEL = Object.fromEntries(KULP_GENEL.map(k => [k[0], k])), KAT = Object.fromEntries(KULP_KATALOG.map(k => [k[0], k]));

// Kulp kodu → { kod, ad, bicim, boy, grup }. Bilinmeyen kod standart çubuk kulp sayılır.
export function kulpBilgisi(kod) {
  const g = GENEL[kod];
  if (g) return { kod, ad: g[1], bicim: g[2], boy: g[3], grup: 'Temel' };
  const k = KAT[kod];
  if (k) return { kod, ad: k[4] + (k[5] ? ' ' + k[5] : ''), bicim: k[1], boy: k[2], grup: k[3] };
  return { kod: 'cubuk', ad: GENEL.cubuk[1], bicim: 'bar', boy: 160, grup: 'Temel' };
}
export const kulpAdi = kod => kulpBilgisi(kod).ad;
// Katalog satırı ([kod, biçim, boy, grup, aile, ölçü etiketi]); genel modellerde null
export const kulpSatiri = kod => KAT[kod] || null;
// Parça üreten model mi (boy, gola ve kulpsuz dışındakiler)
export const kulpParcaliMi = kod => !['boy', 'gola', 'yok'].includes(kulpBilgisi(kod).bicim);

// Kulpun parçaları. (a0, b0)–(a1, b1): standart 16 cm çubuğun kapak üstündeki yeri (dikey ya da yatay); (X0, Y0)–(X1, Y1): kapak;
// z: kapağın ön yüzü. Kulp bu yerin ortasına göre kendi boyunda kurulur; kapağa sığmazsa kısalır, kenar profili kapağın kenarına oturur.
// Dönen parçalar: { ad: 'Kulp', x, y, z, sx, sy, sz, mat, tur: 'kulp' }; ilk parçada kulpKod, sonrakilerde kulpEk (hırdavat sayımı için).
// İlk parçada ayrıca kulpYer bulunur ({ cu, cv, L, dikey, z }: kulpun ortası (boyunca ve enine), boyu ve duruşu): 3B çizim kulpu bu
// yere gerçek biçimiyle (kulpmodel.js) koyar; kutular teknik çizimde, işleme föyünde ve hırdavat sayımında kullanılmaya devam eder.
export function kulpParcalari(kod, { a0, b0, a1, b1, X0, Y0, X1, Y1, z }) {
  const b = kulpBilgisi(kod), s = b.bicim, dikey = b1 - b0 > a1 - a0, mx = (a0 + a1) / 2, my = (b0 + b1) / 2, P = [];
  const son = yer => { if (P.length) P[0].kulpYer = { ...yer, z }; return P; };
  const k = (x, y, dz, sx, sy, sz, mat = 'kulp', ek = null) => { if (sx > 0 && sy > 0 && sz > 0) P.push({ ad: 'Kulp', x, y, z: z + dz, sx, sy, sz, mat, tur: 'kulp', ...(P.length ? { kulpEk: true } : { kulpKod: b.kod }), ...ek }); };
  const sinirla = (c, L, lo, hi) => Math.min(Math.max(c, lo + L / 2 + 30), hi - L / 2 - 30);
  // u: kulp boyunca, v: enine. Kutuyu kapak düzleminde (u, v) ölçüleriyle, ortası (cu, cv) olacak biçimde koyar
  const koy = (cu, cv, L, T, dz, sz, mat, ek) => dikey ? k(cv - T / 2, cu - L / 2, dz, T, L, sz, mat, ek) : k(cu - L / 2, cv - T / 2, dz, L, T, sz, mat, ek);
  if (s === 'knob' || s === 'ring') { // düğme: sap ve baş; halka: rozet ve sarkan halka
    const d = Math.min(45, Math.max(22, b.boy));
    if (s === 'knob') { k(mx - d * 0.3, my - d * 0.3, 0, d * 0.6, d * 0.6, 12); k(mx - d / 2, my - d / 2, 10, d, d, 14); }
    else { k(mx - d / 2, my - d / 2, 0, d, d, 8); k(mx - d * 0.42, my - d * 0.95, 8, d * 0.84, d * 0.9, 6, 'kulp'); k(mx - d * 0.24, my - d * 0.8, 8.5, d * 0.48, d * 0.6, 6, 'koyu'); }
    return son({ cu: mx, cv: my, L: b.boy, dikey: false });
  }
  const uzun = dikey ? Y1 - Y0 : X1 - X0;
  if (s === 'tir') { // kenar profil: kapağın en yakın kenarına oturan 12 mm'lik profil
    const L = Math.max(40, Math.min(b.boy, uzun - 80));
    if (dikey) { const c = sinirla(my, L, Y0, Y1), solda = mx < (X0 + X1) / 2; k(solda ? X0 : X1 - 12, c - L / 2, 0, 12, L, 12); return son({ cu: c, cv: solda ? X0 + 6 : X1 - 6, L, dikey }); }
    const c = sinirla(mx, L, X0, X1), altta = my < (Y0 + Y1) / 2; k(c - L / 2, altta ? Y0 : Y1 - 12, 0, L, 12, 12);
    return son({ cu: c, cv: altta ? Y0 + 6 : Y1 - 6, L, dikey });
  }
  const T = { bar: 12, bow: 14, u: 14, flat: 24, classic: 18, cup: 34 }[s] || 14;
  const L = Math.max(30, Math.min(b.boy, uzun - 80)), cu = dikey ? sinirla(my, L, Y0, Y1) : sinirla(mx, L, X0, X1), cv = dikey ? mx : my;
  const yer = { cu, cv, L, dikey };
  if (s === 'flat') { koy(cu, cv, L, T, 0, 14); return son(yer); } // yassı profil: kapağa yapışık geniş şerit
  if (s === 'cup') { // kepçe: yarım kabuk; altı (dikeyde yanı) oyuk görünür
    koy(cu, cv, L, T, 0, 22);
    koy(cu, cv - T * 0.22, L * 0.8, T * 0.4, 21, 1.5, 'koyu');
    return son(yer);
  }
  const ayak = Math.min(L * 0.5 - 6, Math.max(10, L * 0.1)); // ayakların uçtan uzaklığı
  if (s === 'u') { // köşeli: uçlarda ayak, arada düz çubuk
    koy(cu, cv, L, T, 14, 12);
    koy(cu - L / 2 + T / 2, cv, T, T, 0, 14, 'kulp'); koy(cu + L / 2 - T / 2, cv, T, T, 0, 14, 'kulp');
    return son(yer);
  }
  if (s === 'bow') { // kavisli: uçlar alçak, orta yüksek (üç basamak)
    koy(cu, cv, L * 0.56, T, 16, 12);
    koy(cu - L * 0.36, cv, L * 0.2, T, 9, 12, 'kulp'); koy(cu + L * 0.36, cv, L * 0.2, T, 9, 12, 'kulp');
    koy(cu - L / 2 + 6, cv, 12, T, 0, 12, 'kulp'); koy(cu + L / 2 - 6, cv, 12, T, 0, 12, 'kulp');
    return son(yer);
  }
  // çubuk ve porselenli klasik: iki ayak üstünde çubuk
  koy(cu, cv, L, T, 14, 12);
  koy(cu - L / 2 + ayak, cv, 10, Math.min(10, T), 0, 14, 'kulp'); koy(cu + L / 2 - ayak, cv, 10, Math.min(10, T), 0, 14, 'kulp');
  if (s === 'classic') koy(cu, cv, L * 0.5, T + 4, 13, 14, 'seramik', { renk: '#F1EDE3' }); // ortada porselen tutamak
  return son(yer);
}

// Kulpun küçük resmi: ön görünüş (yatay duruşta), kendi çizimimiz
export function kulpOnizleme(kod, renk = '#8a8f96') {
  const b = kulpBilgisi(kod);
  if (b.bicim === 'boy') return `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="16" width="108" height="8" rx="3" fill="${renk}"/></svg>`;
  if (b.bicim === 'gola') return `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="108" height="28" fill="none" stroke="#9aa3ad"/><rect x="6" y="6" width="108" height="7" fill="#3b3d42"/></svg>`;
  if (b.bicim === 'yok') return `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="108" height="28" fill="none" stroke="#9aa3ad" stroke-dasharray="4 3"/></svg>`;
  const G = 340, Y = 110, P = kulpParcalari(kod, { a0: G / 2 - 80, b0: Y / 2 - 6, a1: G / 2 + 80, b1: Y / 2 + 6, X0: -400, Y0: 0, X1: G + 400, Y1: Y, z: 0 }).sort((p, q) => (p.z + p.sz) - (q.z + q.sz));
  const sabit = { koyu: '#2a2c30', seramik: '#F1EDE3' };
  return `<svg viewBox="0 0 ${G} ${Y}" xmlns="http://www.w3.org/2000/svg">` + P.map(q => `<rect x="${q.x.toFixed(1)}" y="${(Y - q.y - q.sy).toFixed(1)}" width="${q.sx.toFixed(1)}" height="${q.sy.toFixed(1)}" rx="${Math.min(q.sx, q.sy) / 3}" fill="${q.renk || sabit[q.mat] || renk}" stroke="#1b2530" stroke-opacity=".35"/>`).join('') + '</svg>';
}
