// Fotoğrafik görüntü motoru: işlemcide çalışan yol izleyici (path tracer), parlama süzgeci, gürültü giderme ve son işlem.
// Buradaki dört işlev aynı sahibin eB Creator uygulamasından (EB Design) alınmıştır; kütüphane kullanmaz.
// ARTAPP eki (2026-11-21): makeTracer yuvarlak cisimleri de izler (dekor eşyaları için). Ek, "ARTAPP eki" yorumlarıyla işaretlidir;
// SC.shp verilmeyen (yalnızca kutulu) sahnelerde sonuç eB Creator'daki asıl motorla birebir aynıdır (test/foto.test.js bunu korur).
// rtDenoise, rtFF ve rtPost değiştirilmemiştir.
//   shp: Uint8Array, cisim başına biçim: 0 kutu, 1 elipsoit, 2 / 3 / 4 ekseni y / x / z olan silindir ya da kesik koni.
//        Yuvarlak cisim, boxes içindeki kutusunun içine tam oturur (kutu onun sınır kutusudur).
//        5: eğik elipsoit (yaprak, sap): kutusu sınır kutusudur; merkezi, yarıçapları ve üç ekseni shx içindedir, shq sırasını verir.
//   shx: Float32Array, eğik elipsoit başına 15 sayı: merkez x y z, yarıçap 3, birinci, ikinci ve üçüncü eksenin birim yönü (3'er sayı).
//   shq: Float32Array, kesik koninin daralması: 1 (ya da 0) düz silindir; 0–1 arası: eksenin büyük ucunda yarıçap bu oranda küçülür;
//        1–2 arası: küçük ucunda yarıçap (2 − değer) oranında küçülür.
//
// Sahne (makeTracer'a verilen SC):
//   boxes: Float32Array, kutu başına 10 sayı: x0 y0 z0 x1 y1 z1 r g b malzeme (ölçü santimetre, renk doğrusal 0–1), n: kutu sayısı
//   cam: { p: [x, y, z], fw, rt, up: birim yön vektörleri, W, H: piksel, F: odak uzaklığı (piksel) }
//   inside: kamera odanın içinde mi (dışarıdaysa tavan ilk ışında görünmez), night: akşam mı
//   sun: güneşe doğru birim vektör, sunC: güneş rengi, exp: gökyüzü parlaklık çarpanı, led: ışık veren yüzeylerin şiddeti
//   pl: nokta ışıklar, ışık başına 7 sayı: x y z r g b şiddet; seed: rastgele sayı tohumu
//   tex: { w, h, d: Uint8Array RGB } ya da null (malzeme 18 için resim dokusu), texS: dokunun yinelenme boyu (cm), texG: doku parlak mı
// Malzeme kodları:
//   1 lake ya da yarı mat boyalı yüzey      2 ahşap (damar dik)        3 benekli taş tezgah     4 parlak metal (kulp)
//   5 cam                                   6 parlak yüzey (siyah cam, lakobel, parlak kaplama)   7 parke zemin
//   8 koyu mat                              9 ışık veren yüzey (LED, ampul; alt yüzü aşağı bakar)
//   10 duvar                                11 fırçalı inox            12 ahşap tezgah          13 tavan
//   14 metro fayans (15 × 7,5 cm)           15 mermer zemin (120 × 60 cm karo)                  16 mermer
//   17 kumaş, yaprak (tam mat)              18 resim dokusu
//   ARTAPP eki (2026-11-22), duvar ve tezgah arası desenleri; yüzeyin yönüne göre döşenir (yan duvarlarda da doğru):
//   19 tuğla (25 × 7,5 cm, şaşırtmalı)      20 kare fayans (20 × 20)   21 mozaik (5 × 5)        22 çizgili duvar kağıdı (7,5 cm'de bir)
//   23 brüt beton (120 cm'de kalıp derzi)   24 metro fayans (15 × 7,5; 14'ün yöne duyarlısı)    25 tuğla, tezgah arası (20 × 6)
//   Bu kodlar eB Creator'daki asıl motorda yoktur; 1–18 arasındaki kodların sonucu değişmemiştir.
// makeTracer(SC) → { tile(x, y, w, h, örnek, tohum): Float32Array (piksel başına r g b ve parlaklık karesi toplamı),
//                    gbuf(x, y, w, h): Float32Array (piksel başına albedo r g b, normal x y z, derinlik) }
// rtFF(W, H, toplam, sayı, l2): tek tük aşırı parlak pikselleri bastırır.  rtDenoise(W, H, toplam, sayı, l2, G) → Float32Array renk.
// rtPost(W, H, renk, akşam) → { o: Uint8ClampedArray RGBA, ex: pozlama }: otomatik pozlama, parlama, ton eşleme, hafif keskinleştirme.
/* eslint-disable */
export function makeTracer(SC){
 const NB=SC.n,BX=SC.boxes,SH=SC.shp||null,SQ=SC.shq||null,SX=SC.shx||null;let seed=SC.seed>>>0||1;/* ARTAPP eki: SH, SQ */
 const rnd=()=>{seed^=seed<<13;seed>>>=0;seed^=seed>>>17;seed^=seed<<5;seed>>>=0;return seed/4294967296};
 const idx=new Int32Array(NB);for(let i=0;i<NB;i++)idx[i]=i;
 const nb=[],ni=[];
 const build=(s,e)=>{let x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9,cx0=1e9,cy0=1e9,cz0=1e9,cx1=-1e9,cy1=-1e9,cz1=-1e9;
  for(let k=s;k<e;k++){const o=idx[k]*10;x0=Math.min(x0,BX[o]);y0=Math.min(y0,BX[o+1]);z0=Math.min(z0,BX[o+2]);x1=Math.max(x1,BX[o+3]);y1=Math.max(y1,BX[o+4]);z1=Math.max(z1,BX[o+5]);
   const cx=(BX[o]+BX[o+3])/2,cy=(BX[o+1]+BX[o+4])/2,cz=(BX[o+2]+BX[o+5])/2;cx0=Math.min(cx0,cx);cy0=Math.min(cy0,cy);cz0=Math.min(cz0,cz);cx1=Math.max(cx1,cx);cy1=Math.max(cy1,cy);cz1=Math.max(cz1,cz)}
  const me=ni.length/2;nb.push(x0,y0,z0,x1,y1,z1);ni.push(0,0);
  if(e-s<=3){ni[me*2]=-(s+1);ni[me*2+1]=e-s;return me}
  const ex=[cx1-cx0,cy1-cy0,cz1-cz0],ax=ex[0]>=ex[1]&&ex[0]>=ex[2]?0:ex[1]>=ex[2]?1:2;
  const sub=Array.from(idx.subarray(s,e)).sort((a,b)=>(BX[a*10+ax]+BX[a*10+ax+3])-(BX[b*10+ax]+BX[b*10+ax+3]));for(let k=s;k<e;k++)idx[k]=sub[k-s];
  const m=(s+e)>>1,l=build(s,m),r=build(m,e);ni[me*2]=l;ni[me*2+1]=r;return me};
 build(0,NB);
 const NBf=new Float32Array(nb),NIi=new Int32Array(ni),stk=new Int32Array(128);
 const LEDS=[];for(let i=0;i<NB;i++)if(BX[i*10+9]==9)LEDS.push(i);
 let hT=0,hI=-1,hA=0,hS=0;
 // ARTAPP eki: yuvarlak cisim. hC=1 ise yüzey yönü hNx, hNy, hNz içindedir (hA en baskın eksen, hS onun işareti).
 let hC=0,hNx=0,hNy=0,hNz=0;
 const shape=(bi,q,ox,oy,oz,dx,dy,dz)=>{const s=SH[bi],x0=BX[q],y0=BX[q+1],z0=BX[q+2],x1=BX[q+3],y1=BX[q+4],z1=BX[q+5],cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2,rx=(x1-x0)/2,ry=(y1-y0)/2,rz=(z1-z0)/2;
  let t,nx,ny,nz;
  if(s==5){const e=(SQ[bi]|0)*15,vx=ox-SX[e],vy=oy-SX[e+1],vz=oz-SX[e+2],r0=SX[e+3],r1=SX[e+4],r2=SX[e+5];
   const X=(vx*SX[e+6]+vy*SX[e+7]+vz*SX[e+8])/r0,Y=(vx*SX[e+9]+vy*SX[e+10]+vz*SX[e+11])/r1,Z=(vx*SX[e+12]+vy*SX[e+13]+vz*SX[e+14])/r2;
   const DX=(dx*SX[e+6]+dy*SX[e+7]+dz*SX[e+8])/r0,DY=(dx*SX[e+9]+dy*SX[e+10]+dz*SX[e+11])/r1,DZ=(dx*SX[e+12]+dy*SX[e+13]+dz*SX[e+14])/r2;
   const a=DX*DX+DY*DY+DZ*DZ,b=X*DX+Y*DY+Z*DZ,c=X*X+Y*Y+Z*Z-1,D=b*b-a*c;if(D<0)return;
   const sq=Math.sqrt(D);t=(-b-sq)/a;if(t<=.015)t=(-b+sq)/a;if(t<=.015||t>=hT)return;
   const lx=(X+DX*t)/r0,ly=(Y+DY*t)/r1,lz=(Z+DZ*t)/r2;
   nx=lx*SX[e+6]+ly*SX[e+9]+lz*SX[e+12];ny=lx*SX[e+7]+ly*SX[e+10]+lz*SX[e+13];nz=lx*SX[e+8]+ly*SX[e+11]+lz*SX[e+14]}
  else if(s==1){const X=(ox-cx)/rx,Y=(oy-cy)/ry,Z=(oz-cz)/rz,DX=dx/rx,DY=dy/ry,DZ=dz/rz,a=DX*DX+DY*DY+DZ*DZ,b=X*DX+Y*DY+Z*DZ,c=X*X+Y*Y+Z*Z-1,D=b*b-a*c;if(D<0)return;
   const sq=Math.sqrt(D);t=(-b-sq)/a;if(t<=.015)t=(-b+sq)/a;if(t<=.015||t>=hT)return;
   nx=(X+DX*t)/rx;ny=(Y+DY*t)/ry;nz=(Z+DZ*t)/rz}
  else{let oa,ob,oc,da,db,dc,a0,a1,cb,cc,rb,rc;
   if(s==2){oa=oy;ob=ox;oc=oz;da=dy;db=dx;dc=dz;a0=y0;a1=y1;cb=cx;cc=cz;rb=rx;rc=rz}
   else if(s==3){oa=ox;ob=oy;oc=oz;da=dx;db=dy;dc=dz;a0=x0;a1=x1;cb=cy;cc=cz;rb=ry;rc=rz}
   else{oa=oz;ob=ox;oc=oy;da=dz;db=dx;dc=dy;a0=z0;a1=z1;cb=cx;cc=cy;rb=rx;rc=ry}
   const p=SQ?SQ[bi]:1,kb=p>1?2-p:1,kt=p>1?1:(p>0?p:1),h=a1-a0,B=(ob-cb)/rb,C=(oc-cc)/rc,DB=db/rb,DC=dc/rc,dk=(kt-kb)/h,K0=kb+dk*(oa-a0),K1=dk*da;
   let best=hT,bn=0;
   const qa=DB*DB+DC*DC-K1*K1,qb=B*DB+C*DC-K0*K1,qc=B*B+C*C-K0*K0;
   if(Math.abs(qa)>1e-12){const D=qb*qb-qa*qc;if(D>=0){const sq=Math.sqrt(D);for(let i=0;i<2;i++){const tt=(-qb+(i?sq:-sq))/qa;if(tt>.015&&tt<best){const a=oa+da*tt;if(a>=a0&&a<=a1&&K0+K1*tt>=0){best=tt;bn=1}}}}}
   if(da!=0){let tt=(a0-oa)/da;if(tt>.015&&tt<best){const b=B+DB*tt,c=C+DC*tt;if(b*b+c*c<=kb*kb){best=tt;bn=2}}
    tt=(a1-oa)/da;if(tt>.015&&tt<best){const b=B+DB*tt,c=C+DC*tt;if(b*b+c*c<=kt*kt){best=tt;bn=3}}}
   if(!bn)return;t=best;
   let na,nb,nc;if(bn==1){na=-(K0+K1*t)*dk;nb=(B+DB*t)/rb;nc=(C+DC*t)/rc}else{na=bn==2?-1:1;nb=0;nc=0}
   if(s==2){nx=nb;ny=na;nz=nc}else if(s==3){nx=na;ny=nb;nz=nc}else{nx=nb;ny=nc;nz=na}}
  const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;if(nx*dx+ny*dy+nz*dz>0){nx=-nx;ny=-ny;nz=-nz}
  hT=t;hI=bi;hC=1;hNx=nx;hNy=ny;hNz=nz;const ax=Math.abs(nx),ay=Math.abs(ny),az=Math.abs(nz);
  if(ax>=ay&&ax>=az){hA=0;hS=nx>0?1:-1}else if(ay>=az){hA=1;hS=ny>0?1:-1}else{hA=2;hS=nz>0?1:-1}};
 const isect=(ox,oy,oz,dx,dy,dz,tmax)=>{const ix=1/dx,iy=1/dy,iz=1/dz;let sp=0;stk[sp++]=0;hI=-1;hT=tmax;
  while(sp){const n=stk[--sp],o=n*6;
   let a=(NBf[o]-ox)*ix,b=(NBf[o+3]-ox)*ix,tn=Math.min(a,b),tf=Math.max(a,b);
   a=(NBf[o+1]-oy)*iy;b=(NBf[o+4]-oy)*iy;tn=Math.max(tn,Math.min(a,b));tf=Math.min(tf,Math.max(a,b));
   a=(NBf[o+2]-oz)*iz;b=(NBf[o+5]-oz)*iz;tn=Math.max(tn,Math.min(a,b));tf=Math.min(tf,Math.max(a,b));
   if(tf<Math.max(tn,0)||tn>hT)continue;
   const l=NIi[n*2],r=NIi[n*2+1];
   if(l<0){const s=-l-1;for(let k=s;k<s+r;k++){const bi=idx[k],q=bi*10;
     let t0x=(BX[q]-ox)*ix,t1x=(BX[q+3]-ox)*ix;if(t0x>t1x){const t=t0x;t0x=t1x;t1x=t}
     let t0y=(BX[q+1]-oy)*iy,t1y=(BX[q+4]-oy)*iy;if(t0y>t1y){const t=t0y;t0y=t1y;t1y=t}
     let t0z=(BX[q+2]-oz)*iz,t1z=(BX[q+5]-oz)*iz;if(t0z>t1z){const t=t0z;t0z=t1z;t1z=t}
     let tN=t0x,ax=0;if(t0y>tN){tN=t0y;ax=1}if(t0z>tN){tN=t0z;ax=2}
     const tF=Math.min(t1x,t1y,t1z);
     if(SH&&SH[bi]){if(tN<=tF&&tF>.015&&tN<hT)shape(bi,q,ox,oy,oz,dx,dy,dz)}/* ARTAPP eki */
     else if(tN<=tF&&tN>.015&&tN<hT){hT=tN;hI=bi;hA=ax;hC=0;hS=ax==0?(dx>0?-1:1):ax==1?(dy>0?-1:1):(dz>0?-1:1)}}}
   else{stk[sp++]=l;stk[sp++]=r}}
  return hI>=0};
 const vis=(ox,oy,oz,dx,dy,dz,tmax)=>{if(!isect(ox,oy,oz,dx,dy,dz,tmax))return true;const m=BX[hI*10+9];return m==5||m==9};
 const hsh=(x,y,z)=>{let h=(x*374761393+y*668265263+z*1274126177)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 const vn=(x,y,z)=>{const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),fx=x-X,fy=y-Y,fz=z-Z,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz);
  const L=(a,b,t)=>a+(b-a)*t;
  return L(L(L(hsh(X,Y,Z),hsh(X+1,Y,Z),u),L(hsh(X,Y+1,Z),hsh(X+1,Y+1,Z),u),v),L(L(hsh(X,Y,Z+1),hsh(X+1,Y,Z+1),u),L(hsh(X,Y+1,Z+1),hsh(X+1,Y+1,Z+1),u),v),w)};
 const wood=(u,v,w)=>{const n=vn(u*.012,v*.18,w*.18),r=Math.sin((v*1.25+w*.7+n*10+vn(u*.003,v*.04,w*.04)*16))*.5+.5,fine=vn(u*.5,v*4,w*4),pore=vn(u*.08,v*9,w*9);return .66+.27*Math.pow(r,.6)+.09*fine-.05*pore};
 // malzeme: albedo + parlaklık
 const M=new Float32Array(6),TX=SC.tex||null,LUT=new Float32Array(256);for(let i=0;i<256;i++)LUT[i]=Math.pow(i/255,2.2);// r g b sp rough metal
 const surf=(q,px,py,pz,ax)=>{const mat=BX[q+9];let ar=BX[q+6],ag=BX[q+7],ab=BX[q+8],rough=.6,sp=.03,metal=0;
  if(mat==2||mat==12||mat==7){let f;
   if(mat==7){const row=Math.floor(pz/19),off=hsh(row,7,3)*140,seg=Math.floor((px+off)/140),vv=.86+.24*hsh(seg,row,11);f=wood(px+off,pz*1.7,py)*vv;const fr=(pz/19)-row,fs=((px+off)/140)-seg;if(fr<.02||fs<.006)f*=.55;sp=.05;rough=.25}
   else if(mat==12){f=wood(px+pz*.1,pz,py);sp=.07;rough=.15}
   else{f=ax==0?wood(py,pz,px):ax==2?wood(py,px,pz):wood(px,pz,py);sp=.05;rough=.3}
   ar*=f;ag*=f;ab*=f}
  else if(mat==3){const n=vn(px*.09,py*.09,pz*.09)*.6+vn(px*.4,py*.4,pz*.4)*.4,f=.88+.24*n;ar*=f;ag*=f;ab*=f;if(hsh(Math.floor(px*1.8),Math.floor(py*1.8),Math.floor(pz*1.8))>.97){if(ar<.1){ar=ag=.2;ab=.21}else{ar*=1.25;ag*=1.25;ab*=1.25}}sp=.1;rough=.04}
  else if(mat==1){sp=.05;rough=.22}
  else if(mat==4){metal=1;rough=.16}
  else if(mat==11){metal=1;rough=.33}
  else if(mat==6){sp=.1;rough=.03}
  else if(mat==15||mat==16){const fl=mat==15,u=fl?px:px+pz,v=fl?pz:py,n=vn(u*.013,v*.013,(fl?0:pz)*.013)*.65+vn(u*.06,v*.06,py*.06)*.35;
   let tid=0;if(fl){const tx=Math.floor(px/120),tz=Math.floor(pz/60);tid=hsh(tx,tz,3);const fu=px/120-tx,fv=pz/60-tz;if(fu<.004||fu>.996||fv<.008||fv>.992){ar*=.82;ag*=.8;ab*=.78;sp=.02;rough=.6;M[0]=ar;M[1]=ag;M[2]=ab;M[3]=sp;M[4]=rough;M[5]=0;return}}
   const a1=Math.abs(Math.sin((u*.010+v*.006+tid*9)*6.3+n*7.5)),a2=Math.abs(Math.sin((u*.024-v*.017+tid*5)*5.1+n*11)),vein=Math.pow(1-a1,16)*.9+Math.pow(1-a2,34)*.6,f=.94+.09*n-.42*vein;
   ar*=f+vein*.08;ag*=f+vein*.03;ab*=f-vein*.04;sp=fl?.17:.1;rough=fl?.02:.03}
  else if(mat==18&&TX){let u,v;if(ax==1){u=px;v=pz}else if(ax==2){u=px;v=py}else{u=pz;v=py}/* ARTAPP eki: doku dört komşu noktadan yumuşatılarak okunur (yakından bakınca kareler görünmesin) */const TS=SC.texS||320,fu=((((u/TS)%1)+1)%1)*TX.w-.5,fv=((((v/TS*2)%1)+1)%1)*TX.h-.5,u0=Math.floor(fu),v0=Math.floor(fv),au=fu-u0,av=fv-v0,xa=((u0%TX.w)+TX.w)%TX.w,xb=(xa+1)%TX.w,ya=((v0%TX.h)+TX.h)%TX.h,yb=(ya+1)%TX.h,k00=(ya*TX.w+xa)*3,k10=(ya*TX.w+xb)*3,k01=(yb*TX.w+xa)*3,k11=(yb*TX.w+xb)*3,w00=(1-au)*(1-av),w10=au*(1-av),w01=(1-au)*av,w11=au*av;ar=LUT[TX.d[k00]]*w00+LUT[TX.d[k10]]*w10+LUT[TX.d[k01]]*w01+LUT[TX.d[k11]]*w11;ag=LUT[TX.d[k00+1]]*w00+LUT[TX.d[k10+1]]*w10+LUT[TX.d[k01+1]]*w01+LUT[TX.d[k11+1]]*w11;ab=LUT[TX.d[k00+2]]*w00+LUT[TX.d[k10+2]]*w10+LUT[TX.d[k01+2]]*w01+LUT[TX.d[k11+2]]*w11;if(SC.texG){sp=.1;rough=.02}else{sp=.04;rough=.38}}
  else if(mat==17){const f=.92+.1*vn(px*.9,py*.9,pz*.9);ar*=f;ag*=f;ab*=f;sp=0;rough=1}
  else if(mat==14){const tw=15,th=7.5,row=Math.floor(py/th),u=px+(row%2?tw/2:0),fu=u/tw-Math.floor(u/tw),fv=py/th-row,tv=.94+.06*hsh(Math.floor(u/tw),row,5);let f=tv;if(fu<.022||fu>.978||fv<.045||fv>.955){f=.62;sp=.01;rough=1}else{sp=.09;rough=.06}ar*=f;ag*=f;ab*=f}
  else if(mat>=19&&mat<=25){/* ARTAPP eki: duvar ve tezgah arası desenleri; u yatay, v düşey (yüzeyin eksenine göre) */
   let u,v;if(ax==1){u=px;v=pz}else if(ax==2){u=px;v=py}else{u=pz;v=py}
   if(mat==22){const s=u/7.5,fr=s-Math.floor(s),f=fr<.406?.84:fr>.625&&fr<.672?.75:1;ar*=f;ag*=f;ab*=f;sp=0;rough=1}
   else if(mat==23){const n=vn(u*.035,v*.035,3.1)*.6+vn(u*.16,v*.16,7.7)*.4,gu=u/120-Math.floor(u/120),gv=v/120-Math.floor(v/120);let f=.8+.2*n;if(gu<.004||gu>.996||gv<.004||gv>.996)f*=.78;ar*=f;ag*=f;ab*=f;sp=.015;rough=.85}
   else{const br=mat==19||mat==25,tw=mat==19?25:mat==21?5:mat==24?15:20,th=mat==19?7.5:mat==20?20:mat==21?5:mat==24?7.5:6,dz=mat==21?.3:br?.42:.24,
     row=Math.floor(v/th),uu=u+((br||mat==24)&&(row&1)?tw/2:0),col=Math.floor(uu/tw),du=uu-col*tw,dv=v-row*th;
    if(du<dz||du>tw-dz||dv<dz||dv>th-dz){const f=br?.7:.62;ar*=f;ag*=f;ab*=f;sp=.01;rough=1}
    else{const f=br?.75+.16*hsh(col,row,5):.94+.06*hsh(col,row,5);ar*=f;ag*=f;ab*=f;if(br){sp=.02;rough=.9}else{sp=.09;rough=.06}}}}
  else if(mat==10||mat==13){const f=.965+.05*vn(px*.05,py*.05,pz*.05)+.02*vn(px*.6,py*.6,pz*.6);ar*=f;ag*=f;ab*=f;sp=0;rough=1}
  else{sp=0;rough=1}
  if(!hC&&(mat==1||mat==2||mat==12)){let e=1;for(let a=0;a<3;a++){if(a==ax)continue;const lo=BX[q+a],hi=BX[q+3+a];if(hi-lo<1.2)continue;const p=a==0?px:a==1?py:pz,d=Math.min(p-lo,hi-p);if(d<.35)e=Math.min(e,.42+.58*d/.35)}ar*=e;ag*=e;ab*=e}
  M[0]=ar;M[1]=ag;M[2]=ab;M[3]=sp;M[4]=rough;M[5]=metal};
 const sunD=SC.sun,sunC=SC.sunC,cam=SC.cam,EX=SC.exp||1,LE=SC.led||7;
 const INS=SC.inside,NIGHT=SC.night,env=(dx,dy,dz)=>{if(NIGHT){if(dy<0)return[.012,.012,.012];const az=Math.atan2(dz,dx),th=.03+.11*vn(az*7+3,1,1)+.05*vn(az*23,2,2);if(dy<th)return[.012*EX,.02*EX,.012*EX];const t=Math.min(1,dy*2.2);return[(.85*(1-t)+.06*t)*.55*EX,(.48*(1-t)+.09*t)*.55*EX,(.26*(1-t)+.2*t)*.55*EX]}if(dy<0)return[.34*EX,.33*EX,.31*EX];const t=Math.pow(dy,.6);return[(1.05-.25*t)*EX,(1.06-.18*t)*EX,(1.08+.05*t)*EX]};
 const res=new Float32Array(3),BP=new Float64Array(3),BN=new Float64Array(3),PL=SC.pl||[],NP=PL.length/7;
 const radiance=(ox,oy,oz,dx,dy,dz)=>{let tr=1,tg=1,tb=1,lr=0,lg=0,lb=0,spec=true;
  let prim=true,skip=0;
  for(let depth=0;depth<6;depth++){
   if(!isect(ox,oy,oz,dx,dy,dz,1e6)){const e=env(dx,dy,dz);lr+=tr*e[0];lg+=tg*e[1];lb+=tb*e[2];break}
   const q=hI*10,mat=BX[q+9];
   const px=ox+dx*hT,py=oy+dy*hT,pz=oz+dz*hT;let nx=0,ny=0,nz=0;const cv=hC;if(cv){nx=hNx;ny=hNy;nz=hNz}else if(hA==0)nx=hS;else if(hA==1)ny=hS;else nz=hS;
   if(mat==13&&prim&&!INS&&skip<2){ox=px+dx*.06;oy=py+dy*.06;oz=pz+dz*.06;depth--;skip++;continue}
   if(!cv&&mat!=7&&mat!=10&&mat!=13&&mat!=14&&mat!=15&&mat!=17&&mat!=9&&mat!=5){BP[0]=px;BP[1]=py;BP[2]=pz;BN[0]=nx;BN[1]=ny;BN[2]=nz;let ch=0;
    for(let a=0;a<3;a++){if(a==hA)continue;const lo=BX[q+a],hi=BX[q+3+a],sz=hi-lo,r=Math.min(.45,sz*.3);if(r<.06)continue;const d0=BP[a]-lo,d1=hi-BP[a];if(d0<r){BN[a]-=(1-d0/r)*.9;ch=1}else if(d1<r){BN[a]+=(1-d1/r)*.9;ch=1}}
    if(ch){const l=Math.hypot(BN[0],BN[1],BN[2]);nx=BN[0]/l;ny=BN[1]/l;nz=BN[2]/l}}
   if(mat==9){if(spec){lr+=tr*BX[q+6]*LE;lg+=tg*BX[q+7]*LE;lb+=tb*BX[q+8]*LE}break}
   if(mat==5){const c=-(dx*nx+dy*ny+dz*nz),F=.04+.96*Math.pow(1-Math.abs(c),5);
    if(rnd()<F+.05){const k=2*(dx*nx+dy*ny+dz*nz);dx-=k*nx;dy-=k*ny;dz-=k*nz;ox=px+nx*.02;oy=py+ny*.02;oz=pz+nz*.02}
    else{tr*=.8*BX[q+6]+.2;tg*=.84*BX[q+7]+.16;tb*=.86*BX[q+8]+.14;ox=px+dx*.03;oy=py+dy*.03;oz=pz+dz*.03}
    continue}
   surf(q,px,py,pz,hA);const ar=M[0],ag=M[1],ab=M[2],sp=M[3],rough=M[4],metal=M[5];
   const cosi=-(dx*nx+dy*ny+dz*nz),Fr=metal?1:sp+(1-sp)*Math.pow(1-Math.max(0,cosi),5)*.5;
   let dWt=1;
   if(!metal&&(rough>=.1||BX[q+9]==6)&&Fr>0){// yarı mat lake: yansımayı tek örnekle ekle, rastgele seçme (daha az karıncalanma)
    const k=2*(dx*nx+dy*ny+dz*nz);let rx=dx-k*nx,ry=dy-k*ny,rz=dz-k*nz,jx,jy,jz;do{jx=rnd()*2-1;jy=rnd()*2-1;jz=rnd()*2-1}while(jx*jx+jy*jy+jz*jz>1);rx+=jx*rough;ry+=jy*rough;rz+=jz*rough;const l=Math.hypot(rx,ry,rz);rx/=l;ry/=l;rz/=l;
    if(rx*nx+ry*ny+rz*nz>0&&!isect(px+nx*.02,py+ny*.02,pz+nz*.02,rx,ry,rz,1e6)){const e=env(rx,ry,rz);lr+=tr*Fr*e[0];lg+=tg*Fr*e[1];lb+=tb*Fr*e[2]}
    dWt=1-Fr}
   else if(rnd()<Fr){const k=2*(dx*nx+dy*ny+dz*nz);let rx=dx-k*nx,ry=dy-k*ny,rz=dz-k*nz;
    if(rough>0){let jx,jy,jz;do{jx=rnd()*2-1;jy=rnd()*2-1;jz=rnd()*2-1}while(jx*jx+jy*jy+jz*jz>1);rx+=jx*rough;ry+=jy*rough;rz+=jz*rough;const l=Math.hypot(rx,ry,rz);rx/=l;ry/=l;rz/=l;if(rx*nx+ry*ny+rz*nz<=0){rx=dx-k*nx;ry=dy-k*ny;rz=dz-k*nz}}
    if(metal){tr*=ar;tg*=ag;tb*=ab}
    dx=rx;dy=ry;dz=rz;ox=px+nx*.02;oy=py+ny*.02;oz=pz+nz*.02;spec=rough<.2;prim=false;continue}
   const o2x=px+nx*.02,o2y=py+ny*.02,o2z=pz+nz*.02;
   // güneş
   let sx=sunD[0]+(rnd()-.5)*.06,sy=sunD[1]+(rnd()-.5)*.06,sz=sunD[2]+(rnd()-.5)*.06;const sl=Math.hypot(sx,sy,sz);sx/=sl;sy/=sl;sz/=sl;
   const nl=sx*nx+sy*ny+sz*nz;
   if(!NIGHT&&nl>0&&vis(o2x,o2y,o2z,sx,sy,sz,1e6)){lr+=tr*dWt*ar*sunC[0]*nl;lg+=tg*dWt*ag*sunC[1]*nl;lb+=tb*dWt*ab*sunC[2]*nl}
   // LED (doğrudan örnekleme)
   if(LEDS.length){const li=LEDS[(rnd()*LEDS.length)|0],e=li*10,lx=BX[e]+(BX[e+3]-BX[e])*rnd(),ly=BX[e+1]-.05,lz=BX[e+2]+(BX[e+5]-BX[e+2])*rnd();
    let ex=lx-o2x,ey=ly-o2y,ez=lz-o2z;const d2=ex*ex+ey*ey+ez*ez,d=Math.sqrt(d2);ex/=d;ey/=d;ez/=d;
    const cs=ex*nx+ey*ny+ez*nz,cl=ey;// LED alt yüzü aşağı bakar
    if(cs>0&&cl>0&&d>1&&vis(o2x,o2y,o2z,ex,ey,ez,d-.2)){const A=(BX[e+3]-BX[e])*(BX[e+5]-BX[e+2]),g=LE*A*cs*cl/(d2*Math.PI)*LEDS.length;
     lr+=tr*dWt*ar*BX[e+6]*g;lg+=tg*dWt*ag*BX[e+7]*g;lb+=tb*dWt*ab*BX[e+8]*g}}
   if(NP){const li=((rnd()*NP)|0)*7,lx=PL[li]+(rnd()-.5)*5,ly=PL[li+1],lz=PL[li+2]+(rnd()-.5)*5;let ex=lx-o2x,ey=ly-o2y,ez=lz-o2z;const d2=ex*ex+ey*ey+ez*ez,d=Math.sqrt(d2);ex/=d;ey/=d;ez/=d;
    const cs=ex*nx+ey*ny+ez*nz,f=ey>0?Math.pow(ey,2.2):0;if(cs>0&&f>0&&vis(o2x,o2y,o2z,ex,ey,ez,d-.5)){const g=PL[li+6]*f*cs/d2*NP;lr+=tr*dWt*ar*PL[li+3]*g;lg+=tg*dWt*ag*PL[li+4]*g;lb+=tb*dWt*ab*PL[li+5]*g}}
   tr*=ar*dWt;tg*=ag*dWt;tb*=ab*dWt;prim=false;
   const r1=rnd()*6.2831853,r2=rnd(),r2s=Math.sqrt(r2);let ux,uy,uz;if(Math.abs(nx)>.5){ux=0;uy=1;uz=0}else{ux=1;uy=0;uz=0}
   let vx=uy*nz-uz*ny,vy=uz*nx-ux*nz,vz=ux*ny-uy*nx;const vl=Math.hypot(vx,vy,vz);vx/=vl;vy/=vl;vz/=vl;const wx=ny*vz-nz*vy,wy=nz*vx-nx*vz,wz=nx*vy-ny*vx;
   const a=Math.cos(r1)*r2s,b=Math.sin(r1)*r2s,cc=Math.sqrt(1-r2);
   dx=vx*a+wx*b+nx*cc;dy=vy*a+wy*b+ny*cc;dz=vz*a+wz*b+nz*cc;ox=o2x;oy=o2y;oz=o2z;spec=false;
   if(depth>=2){const p=Math.max(tr,tg,tb);if(rnd()>p)break;tr/=p;tg/=p;tb/=p}}
  res[0]=lr;res[1]=lg;res[2]=lb;return res};
 const ray=(x,y)=>{const W=cam.W,H=cam.H,F=cam.F,fw=cam.fw,rt=cam.rt,up=cam.up,sx=(x-W/2)/F,sy=(H/2-y)/F;let dx=fw[0]+rt[0]*sx+up[0]*sy,dy=fw[1]+rt[1]*sx+up[1]*sy,dz=fw[2]+rt[2]*sx+up[2]*sy;const l=Math.hypot(dx,dy,dz);return[dx/l,dy/l,dz/l]};
 const tile=(x0,y0,w,h,spp,sd)=>{seed=(sd*2654435761)>>>0||7;const out=new Float32Array(w*h*4),P=cam.p;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){let r=0,g=0,b=0,l2=0;
   for(let s=0;s<spp;s++){const d=ray(x0+i+rnd(),y0+j+rnd());const c=radiance(P[0],P[1],P[2],d[0],d[1],d[2]);const cr=Math.min(c[0],6),cg=Math.min(c[1],6),cb=Math.min(c[2],6);r+=cr;g+=cg;b+=cb;const L=.2126*cr+.7152*cg+.0722*cb;l2+=L*L}
   const o=(j*w+i)*4;out[o]=r;out[o+1]=g;out[o+2]=b;out[o+3]=l2}
  return out};
 // G-tampon: albedo, normal, derinlik (ilk görünen yüzey; cam ve yansımalar içinden geçer)
 const gbuf=(x0,y0,w,h)=>{const out=new Float32Array(w*h*7),P=cam.p;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const d=ray(x0+i+.5,y0+j+.5);let ox=P[0],oy=P[1],oz=P[2],dx=d[0],dy=d[1],dz=d[2],o=(j*w+i)*7,tt=0;
   out[o]=out[o+1]=out[o+2]=1;out[o+6]=1e5;
   for(let k=0;k<4;k++){if(!isect(ox,oy,oz,dx,dy,dz,1e6))break;const q=hI*10,mat=BX[q+9],px=ox+dx*hT,py=oy+dy*hT,pz=oz+dz*hT;tt+=hT;
    if(mat==5||(mat==13&&!INS)){ox=px+dx*.05;oy=py+dy*.05;oz=pz+dz*.05;continue}
    if(mat==9){out[o]=out[o+1]=out[o+2]=1}else{surf(q,px,py,pz,hA);out[o]=Math.max(.02,M[0]);out[o+1]=Math.max(.02,M[1]);out[o+2]=Math.max(.02,M[2]);if(M[5]){out[o]=out[o+1]=out[o+2]=Math.max(.05,(M[0]+M[1]+M[2])/3)}}
    if(hC){out[o+3]=hNx;out[o+4]=hNy;out[o+5]=hNz}else{out[o+3]=hA==0?hS:0;out[o+4]=hA==1?hS:0;out[o+5]=hA==2?hS:0}out[o+6]=tt;break}}
  return out};
 return{tile,gbuf}}

export function rtDenoise(W,H,col,n,l2,G){
 const N=W*H,il=new Float32Array(N*3),va=new Float32Array(N);
 for(let p=0;p<N;p++){const k=n[p]||1,a=p*7;for(let c=0;c<3;c++)il[p*3+c]=col[p*3+c]/k/G[a+c];const m=(.2126*col[p*3]+.7152*col[p*3+1]+.0722*col[p*3+2])/k;va[p]=Math.max(0,l2[p]/k-m*m)/k}
 {const vb=new Float32Array(N);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s2=0,c=0;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const xx=x+i,yy=y+j;if(xx<0||yy<0||xx>=W||yy>=H)continue;s2+=va[yy*W+xx];c++}vb[y*W+x]=s2/c}va.set(vb)}
 const K=[1/16,1/4,3/8,1/4,1/16];let src=il,dst=new Float32Array(N*3),vs=va,vd=new Float32Array(N);
 for(let it=0;it<5;it++){const st=1<<it;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x,a=p*7,lp=.2126*src[p*3]+.7152*src[p*3+1]+.0722*src[p*3+2],sl=4*Math.sqrt(vs[p])+.03+.15*lp,zp=G[a+6];
   let sr=0,sg=0,sb=0,sw=0,sv=0;
   for(let j=-2;j<=2;j++){const yy=y+j*st;if(yy<0||yy>=H)continue;for(let i=-2;i<=2;i++){const xx=x+i*st;if(xx<0||xx>=W)continue;const q=yy*W+xx,b=q*7;
    const wn=G[a+3]*G[b+3]+G[a+4]*G[b+4]+G[a+5]*G[b+5];if(wn<.9&&!(i==0&&j==0))continue;
    const dz=Math.abs(G[b+6]-zp)/(zp*.02*st+1);if(dz>3)continue;
    const da=Math.abs(G[a]-G[b])+Math.abs(G[a+1]-G[b+1])+Math.abs(G[a+2]-G[b+2]);
    const lq=.2126*src[q*3]+.7152*src[q*3+1]+.0722*src[q*3+2];
    const w=K[i+2]*K[j+2]*Math.exp(-dz-Math.abs(lp-lq)/sl-da*6);
    sr+=src[q*3]*w;sg+=src[q*3+1]*w;sb+=src[q*3+2]*w;sv+=vs[q]*w*w;sw+=w}}
   dst[p*3]=sr/sw;dst[p*3+1]=sg/sw;dst[p*3+2]=sb/sw;vd[p]=sv/(sw*sw)}
  [src,dst]=[dst,src];[vs,vd]=[vd,vs]}
 const out=new Float32Array(N*3);for(let p=0;p<N;p++)for(let c=0;c<3;c++)out[p*3+c]=src[p*3+c]*G[p*7+c];return out}

export function rtFF(W,H,acc,cn,l2){const N=W*H,L=new Float32Array(N);for(let p=0;p<N;p++){const k=cn[p]||1;L[p]=(.2126*acc[p*3]+.7152*acc[p*3+1]+.0722*acc[p*3+2])/k}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x;let m1=0,m2=0;
  for(let j=-1;j<=1;j++){const yy=y+j;if(yy<0||yy>=H)continue;for(let i=-1;i<=1;i++){const xx=x+i;if((!i&&!j)||xx<0||xx>=W)continue;const v=L[yy*W+xx];if(v>m1){m2=m1;m1=v}else if(v>m2)m2=v}}
  const lim=m2*2+.02;if(L[p]>lim){const f=lim/L[p];acc[p*3]*=f;acc[p*3+1]*=f;acc[p*3+2]*=f;l2[p]*=f*f}}}

export function rtPost(W,H,src,night){const N=W*H;let ls=0;for(let p=0;p<N;p++){const L=.2126*src[p*3]+.7152*src[p*3+1]+.0722*src[p*3+2];ls+=Math.log(L+1e-3)}
 const key=Math.exp(ls/N),ex=Math.min(4,Math.max(.3,(night?.1:.16)/key)),bw=Math.max(1,W>>2),bh=Math.max(1,H>>2),bl=new Float32Array(bw*bh*3),tmp=new Float32Array(bw*bh*3);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x,q=(Math.min(bh-1,y>>2)*bw+Math.min(bw-1,x>>2))*3;for(let c=0;c<3;c++)bl[q+c]+=Math.max(0,src[p*3+c]*ex-1.2)/16}
 const blur=(a,b,dx,dy)=>{for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){let r=0,g=0,bb=0,w=0;for(let k=-4;k<=4;k++){const xx=x+k*dx,yy=y+k*dy;if(xx<0||yy<0||xx>=bw||yy>=bh)continue;const q=(yy*bw+xx)*3,wt=Math.exp(-k*k/8);r+=a[q]*wt;g+=a[q+1]*wt;bb+=a[q+2]*wt;w+=wt}const o=(y*bw+x)*3;b[o]=r/w;b[o+1]=g/w;b[o+2]=bb/w}};
 for(let it=0;it<2;it++){blur(bl,tmp,1,0);blur(tmp,bl,0,1)}
 const aces=v=>{const a=(v*(2.51*v+.03))/(v*(2.43*v+.59)+.14);return Math.min(1,Math.max(0,a))},t=new Float32Array(N*3);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x,fx=Math.min(bw-1.001,Math.max(0,x/4-.5)),fy=Math.min(bh-1.001,Math.max(0,y/4-.5)),ix=fx|0,iy=fy|0,ax=fx-ix,ay=fy-iy,i1=Math.min(bw-1,ix+1),j1=Math.min(bh-1,iy+1);
  const nx=x/W-.5,ny=y/H-.5,vg=1-.32*(nx*nx+ny*ny)*1.6;let r=0,g=0,b=0;
  for(let c=0;c<3;c++){const B=(bl[(iy*bw+ix)*3+c]*(1-ax)+bl[(iy*bw+i1)*3+c]*ax)*(1-ay)+(bl[(j1*bw+ix)*3+c]*(1-ax)+bl[(j1*bw+i1)*3+c]*ax)*ay;const v=src[p*3+c]*ex+B*.22;if(c==0)r=v;else if(c==1)g=v;else b=v}
  if(night){r*=1.06;b*=.92}else{r*=1.03;b*=.97}let R1=aces(r),G1=aces(g),B1=aces(b);const L=.2126*R1+.7152*G1+.0722*B1;R1=L+(R1-L)*1.07;G1=L+(G1-L)*1.07;B1=L+(B1-L)*1.07;
  const sc=v=>{v=Math.min(1,Math.max(0,v*vg));return v+.12*v*(1-v)*(2*v-1)*-1};t[p*3]=sc(R1);t[p*3+1]=sc(G1);t[p*3+2]=sc(B1)}
 const o=new Uint8ClampedArray(N*4);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x;for(let c=0;c<3;c++){const v=t[p*3+c],nb=(x>0?t[(p-1)*3+c]:v)+(x<W-1?t[(p+1)*3+c]:v)+(y>0?t[(p-W)*3+c]:v)+(y<H-1?t[(p+W)*3+c]:v);o[p*4+c]=Math.pow(Math.max(0,v+.22*(v-nb/4)),1/2.2)*255}o[p*4+3]=255}
 return{o,ex}}
