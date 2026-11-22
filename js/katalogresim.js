// Katalog resimleri: hangi kapak modelinin ve hangi aksesuar ailesinin resmi var. Resimler img/kapak ve img/aksesuar klasörlerindedir.
// Resimler aynı sahibin eB Creator uygulamasındaki katalog görselleridir (üreticilerin ürün görselleri); eb/resim-cikar.mjs ile çıkarılır.
// Uygulama başkalarına verilecekse bu görseller kullanıcının kararıyla çıkarılır ya da değiştirilir. Elle düzenlemeyin.
export const KAPAK_RESIMLI = new Set([]);
export const AKSESUAR_RESIMLI = new Set([]);
export const kapakResmi = kod => KAPAK_RESIMLI.has(kod) ? `img/kapak/${kod}.jpg` : '';
export const aksesuarResmi = kimlik => AKSESUAR_RESIMLI.has(kimlik) ? `img/aksesuar/${kimlik}.jpg` : '';
