// Kulp katalog resimleri: hangi kulp satırının resmi var. Resimler img/kulp klasöründedir (dosya adı kulp kodu).
// Resimler aynı sahibin eB Creator uygulamasındaki kulp kataloğu görselleridir (üreticinin ürün görselleri); eb/kulp-resim.mjs ile çıkarılır.
// Uygulama başkalarına verilecekse bu görseller kullanıcının kararıyla çıkarılır ya da değiştirilir. Elle düzenlemeyin.
export const KULP_RESIMLI = new Set([]);
export const kulpResmi = kod => KULP_RESIMLI.has(kod) ? `img/kulp/${kod}.jpg` : '';
