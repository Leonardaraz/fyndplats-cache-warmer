// tools/sidhuvud-prov/bygg.cjs
//
// Bygger en fristående provsida för telefonens sidhuvud (lib/huvud-gom.ts,
// components/huvud-gom.tsx) med ett självprov som skriver resultatet på sidan
// och i sidans titel ("OK 19" eller "FEL n"). Se README.md här intill.
//
//   node tools/sidhuvud-prov/bygg.cjs <utmapp>
//
// Skriver prov.html (hela sidan) och adress.txt (en adress som går att öppna i
// en riktig telefon utan egen server: en liten laddsida i ett ekosvar, och
// provsidan gzip-packad i adressens fragment, som aldrig skickas till servern).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { stripTypeScriptTypes } = require('node:module');

const UT = process.argv[2];
if (!UT) { console.error('Ange en utmapp: node tools/sidhuvud-prov/bygg.cjs <utmapp>'); process.exit(1); }
// Räkningen läses ur källan varje gång, så att provsidan aldrig provar en gammal kopia.
const lib = stripTypeScriptTypes(fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'huvud-gom.ts'), 'utf8'))
  .replace(/^\/\/.*$/gm, '').replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/^export /gm, '').replace(/\n\s*\n+/g, '\n');
const sida = `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sidhuvudsprov</title>
<style>
html{-webkit-text-size-adjust:100%}body{margin:0;font:16px -apple-system,system-ui,sans-serif;background:#fff}
.promo{height:46.4px;background:#1b2440;color:#fff;font-size:12px;text-align:center;line-height:46px}
header{position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid #d8d2c8;height:132px;box-sizing:content-box;font-weight:700;font-size:22px;padding:0 14px}
header::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:linear-gradient(90deg,#c2410c,#f6c36b)}
header i{display:block;margin-top:8px;height:44px;border-radius:22px;background:#f3ede4;font:400 15px/44px -apple-system,sans-serif;padding:0 16px;color:#666}
.huvudspar{display:contents}
.huvudspar[data-spar]{display:block;pointer-events:none;overflow-anchor:none}
.huvudspar[data-spar]>header{pointer-events:auto;will-change:transform}
.rad{height:100px;box-sizing:border-box;border-bottom:1px solid #ddd;padding:8px 14px;color:#444}
.rad:nth-child(odd){background:#faf7f2}
#ut{position:fixed;left:0;right:0;bottom:0;max-height:66vh;overflow:auto;background:rgba(10,14,24,.93);color:#d7ffd7;font:11.5px/1.32 ui-monospace,Menlo,monospace;padding:6px 8px;z-index:999;white-space:pre-wrap}
#ut b{color:#ff8080}#ut em{color:#ffd76a;font-style:normal}
</style></head><body>
<div class="promo">remsa 46,4 px</div>
<div class="huvudspar"><header><div style="padding-top:14px">Fyndplats (prov)</div><i>Sök</i></header></div>
<main id="m"></main>
<div id="ut">självprovet startar…</div>
<script>
(function(){
var m=document.getElementById('m');for(var i=0;i<90;i++){var d=document.createElement('div');d.className='rad';d.textContent='rad '+i;m.appendChild(d)}
${lib}
var rot=document.documentElement,huvud=document.querySelector('.huvudspar > header'),spar=huvud.parentElement;
var pa=false,lage={hb:0,y:0,rikt:0},ram=0,vilar=0,fingret=false,glid=null,glidvakt=0,hojd=0,landar=false,skrivn=0,logg=[];
var VILA_MS=130,SLAPP_MS=70,GLIDKURVA='cubic-bezier(.4,0,.2,1)';
function matt(){return{y:window.scrollY,hojd:window.innerHeight,sidhojd:rot.scrollHeight,h:huvud.getBoundingClientRect().height,topp:spar.getBoundingClientRect().top+window.scrollY}}
function skriv(hb,h){spar.style.height=hb+'px';spar.style.marginBottom=(h-hb)+'px';hojd=h;skrivn++}
function utanGlid(){if(glidvakt)clearTimeout(glidvakt);glidvakt=0;huvud.style.transition='';huvud.style.transform='';glid=null}
function stanna(){if(!glid)return;var mm=matt(),hb=sparAvbrutet(lage,mm,new DOMMatrixReadOnly(getComputedStyle(huvud).transform).m42);utanGlid();lage={hb:hb,y:lage.y,rikt:lage.rikt};skriv(lage.hb,mm.h);logg.push('avbrutet glid')}
function klart(){if(!glid)return;var mal=glid,mm=matt();utanGlid();lage={hb:mal.hb,y:lage.y,rikt:lage.rikt};skriv(lage.hb,mm.h)}
function vila(){vilar=0;if(!pa||glid)return;var mm=matt();if(mm.h<1)return;var v=sparVila(lage,mm);
 if(!v){var hb=sparRast(lage,mm);if(hb!==lage.hb){lage={hb:hb,y:lage.y,rikt:lage.rikt};skriv(hb,mm.h)}return}
 if(fingret){vilar=setTimeout(vila,VILA_MS);return}
 glid=v;var ms=glidMs(v.flytt);huvud.style.transition='transform '+ms+'ms '+GLIDKURVA;huvud.style.transform='translate3d(0,'+v.flytt+'px,0)';glidvakt=setTimeout(klart,ms+200)}
function fram(){var mm=matt();if(mm.h<1)return;utanGlid();lage=sparStart(mm);skriv(lage.hb,mm.h)}
function rakna(){ram=0;if(!pa)return;var mm=matt();if(mm.h<1)return;if(landar){fram();return}
 if(glid&&mm.y!==lage.y)stanna();var nytt=sparSteg(lage,mm);if(nytt.hb!==lage.hb)skriv(nytt.hb,mm.h);lage=nytt;if(vilar)clearTimeout(vilar);vilar=setTimeout(vila,VILA_MS)}
addEventListener('scroll',function(){if(!ram)ram=requestAnimationFrame(rakna)},{passive:true});
addEventListener('touchstart',function(){fingret=true;landar=false},{passive:true});
function upp(){fingret=false;if(!vilar)return;clearTimeout(vilar);vilar=setTimeout(vila,SLAPP_MS)}
addEventListener('touchend',upp,{passive:true});addEventListener('touchcancel',upp,{passive:true});
huvud.addEventListener('transitionend',function(e){if(e.target===huvud&&e.propertyName==='transform')klart()});
pa=true;skriv(huvud.getBoundingClientRect().height,huvud.getBoundingClientRect().height);spar.setAttribute('data-spar','');fram();

// ── självprovet ──
var ut=document.getElementById('ut'),rader=[],fel=0,antal=0;
function r1(n){return Math.round(n*10)/10}
function B(){return r1(huvud.getBoundingClientRect().bottom)}
function visa(){ut.innerHTML=rader.join('\\n')}
function prov(namn,ok,info){antal++;if(!ok)fel++;rader.push((ok?'OK  ':'<b>FEL </b>')+namn+(info?'  <em>'+info+'</em>':''));visa()}
function ruta(){return new Promise(function(r){requestAnimationFrame(function(){r()})})}
function vanta(ms){return new Promise(function(r){setTimeout(r,ms)})}
// Flyttar sidan dy px med steg px per bildruta. Läser läget i början av varje bildruta (efter förra rutans räkning).
// ☠️ En telefon utför inte alltid varje liten förflyttning (iOS 16.4 på en iPhone 14: sidan gick
// 272 px av 400 när varje bildruta bad om 8 px till). Därför styr draget mot ett mål i sidan och
// läser det verkliga läget i varje bildruta, väntar tills läget stått still i tre bildrutor, och
// proven räknar med hur långt sidan faktiskt gick (p.gick), inte hur långt den ombads gå.
async function flytta(dy,steg){var y0=scrollY,langst=Math.max(0,rot.scrollHeight-innerHeight),mal=Math.min(langst,Math.max(0,y0+dy)),rikt=dy<0?-1:1,prover=[],varv=0;
 while(Math.abs(mal-scrollY)>0.4&&varv++<900){await ruta();prover.push([r1(scrollY),B(),skrivn]);scrollTo(0,scrollY+rikt*Math.min(steg,Math.abs(mal-scrollY)))}
 for(var stilla=0,n=0;stilla<3&&n<40;n++){var f=scrollY;await ruta();prover.push([r1(scrollY),B(),skrivn]);stilla=scrollY===f?stilla+1:0}
 prover.gick=r1(Math.abs(scrollY-y0));return prover}
async function folj(ms){var p=[],t0=performance.now();while(performance.now()-t0<ms){await ruta();p.push([Math.round(performance.now()-t0),B()])}return p}
function summor(p){var s=p.filter(function(x){return x[1]>0.5&&x[1]<132.5}).map(function(x){return r1(x[0]+x[1])});return s}
function spann(a){return a.length?r1(Math.max.apply(null,a)-Math.min.apply(null,a)):0}
(async function(){
 try{
 await vanta(400);
 var rad5=function(){return r1(document.querySelectorAll('.rad')[5].getBoundingClientRect().top+scrollY)},rad0=rad5(),hojd0=rot.scrollHeight;
 rader.push(navigator.userAgent.replace(/Mozilla\\/5\\.0 /,'').slice(0,110));rader.push('skärm '+innerWidth+'×'+innerHeight+', dpr '+devicePixelRatio);
 prov('A start: sidhuvudet på sin plats i sidan',Math.abs(B()-179.4)<0.6&&spar.style.height.indexOf('226.6')===0,'botten '+B()+', omslag '+spar.style.height);
 // ☠️ Zonen läses när sidan stannat, vid 60 och 130 px. Medan scrollTo flyttar sidan står det fästa
 // sidhuvudets AVLÄSTA läge en bildruta efter sidans i Safari 27 (125 i stället för 133 vid 8 px per
 // bildruta, i varje ruta i zonen). På skärmen sitter det fäst. Hur många rutor som låg efter skrivs ut.
 var s0=skrivn,p1=await flytta(60,8),vid60=B(),p2=await flytta(70,8),vid130=B(),p=await flytta(270,8);
 var efter=p1.concat(p2).filter(function(x){return x[0]>50&&x[0]<=140&&Math.abs(x[1]-133)>=0.6});
 p.gick=r1(p1.gick+p2.gick+p.gick);
 prov('B ner 400: fäst överst inom 140 px',Math.abs(vid60-133)<0.6&&Math.abs(vid130-133)<0.6,'stilla vid 60: '+vid60+', vid 130: '+vid130+(efter.length?', avläst läge efter sidans i '+efter.length+' rutor under rörelsen (t.ex. '+efter[0][0]+':'+efter[0][1]+')':''));
 prov('B ur bild vid 400, inget skrivet på vägen',p.gick>=390&&p[p.length-1][1]<=0&&p[p.length-1][2]===s0,'sidan gick '+p.gick+', botten '+p[p.length-1][1]+', skrivningar '+(p[p.length-1][2]-s0));
 await vanta(450);prov('B vila: fästet strax ovanför kanten',Math.abs(B()+2)<0.6,'botten '+B());
 s0=skrivn;p=await flytta(-60,3);var su=summor(p);
 prov('C upp 60 efter vila: följer sidan pixel för pixel',su.length>10&&spann(su)<=0.6&&Math.abs(p[p.length-1][1]-(p.gick-2))<=0.6,'rutor '+su.length+', spann '+spann(su)+' px, sidan gick '+p.gick+', botten '+p[p.length-1][1]);
 prov('C ingenting skrevs under draget',p[p.length-1][2]===s0,'skrivningar '+(p[p.length-1][2]-s0));
 var g=await folj(700),steg=[];for(var i=1;i<g.length;i++)steg.push(r1(g[i][1]-g[i-1][1]));
 var forst=g.findIndex(function(x,i){return i>0&&x[1]!==g[0][1]}),rorliga=steg.filter(function(x){return x!==0});
 prov('D vila: glider fram helt',Math.abs(B()-133)<0.6,'botten '+B());
 prov('D glidet börjar stilla och går aldrig bakåt',rorliga.length>4&&rorliga[0]<=3&&rorliga.every(function(x){return x>-0.3}),'steg '+rorliga.slice(0,9).join(' ')+' … start efter '+(forst>0?g[forst][0]:'?')+' ms, störst '+Math.max.apply(null,rorliga));
 p=await flytta(20,2);await vanta(750);prov('E ner 20: glider tillbaka fram',Math.abs(B()-133)<0.6,'direkt '+p[p.length-1][1]+', sedan '+B());
 p=await flytta(80,4);var dir=p[p.length-1][1];await vanta(750);prov('F ner 80: glider undan',Math.abs(B()+2)<0.6,'direkt '+dir+', sedan '+B());
 p=await flytta(-10,1);dir=p[p.length-1][1];await vanta(750);prov('G upp 10: en darrning, undan igen',Math.abs(B()+2)<0.6,'direkt '+dir+', sedan '+B());
 await flytta(500,20);await vanta(450);
 s0=skrivn;p=await flytta(-300,10);su=summor(p);
 prov('H upp 300: in pixel för pixel, sedan fäst överst',spann(su)<=0.6&&Math.abs(p[p.length-1][1]-133)<0.6,'rutor på väg in '+su.length+', spann '+spann(su)+', skrivningar '+(p[p.length-1][2]-s0));
 await vanta(400);var foreI='y '+scrollY+' botten '+B()+' omslag '+spar.style.height+' glid '+(glid?'ja':'nej')+' vilar '+vilar;
 p=await flytta(20,1);var su2=p.map(function(x){return r1(x[0]+x[1])});
 prov('I ner 20 efter vila: lämnar från första pixeln',spann(su2.slice(1))<=0.6&&p.gick>=15&&Math.abs(p[p.length-1][1]-(133-p.gick))<=0.6,'sidan gick '+p.gick+', botten '+p[p.length-1][1]+', spann '+spann(su2.slice(1))+(spann(su2.slice(1))>0.6?' RUTOR '+p.map(function(x){return x[0]+':'+x[1]+'/'+x[2]}).join(' ')+' omslag '+spar.style.height+' FÖRE '+foreI:''));
 await vanta(750);
 await flytta(600,20);s0=skrivn;p=await flytta(-120,6);var syn=p.map(function(x){return Math.max(0,x[1])}),hopp=0;
 for(i=1;i<p.length;i++){var eget=Math.abs((syn[i]-syn[i-1])+(p[i][0]-p[i-1][0]));hopp=Math.max(hopp,Math.min(Math.abs(syn[i]-syn[i-1]),eget))}
 prov('J vändning utan vila: kommer in från vändningen',p.gick>=100&&p[p.length-1][1]>=p.gick-16&&hopp<=8.5,'sidan gick '+p.gick+', botten '+p[p.length-1][1]+', största egna steg '+r1(hopp)+', skrivningar '+(p[p.length-1][2]-s0));
 await vanta(750);
 await flytta(300,15);await vanta(450);
 // Långsamt uppåt, 1 px per bildruta: mindre än marginalen ovanför kanten (UR_BILD_PX).
 s0=skrivn;p=await flytta(-14,1);prov('K långsamt drag uppåt (1 px per ruta, mindre än marginalen): kommer in',p.gick>=10&&Math.abs(p[p.length-1][1]-(p.gick-2))<=0.6&&p[p.length-1][2]===s0,'sidan gick '+p.gick+', botten '+p[p.length-1][1]+', skrivningar '+(p[p.length-1][2]-s0));
 await vanta(750);
 // Avbrutet glid.
 await flytta(300,15);await vanta(450);await flytta(-50,5);await vanta(150);var mitt=B(),tr=getComputedStyle(huvud).transform;
 p=await flytta(60,6);var syn2=p.map(function(x){return x[1]}),h2=0;for(i=1;i<p.length;i++)h2=Math.max(h2,Math.abs((syn2[i]-syn2[i-1])+(p[i][0]-p[i-1][0])));
 prov('L avbrutet glid: står kvar och följer sidan',tr!=='none'&&h2<=16,'mitt i glidet '+mitt+' ('+(tr==='none'?'inget glid pågick':'glid pågick')+'), största egna steg '+r1(h2));
 await vanta(750);
 scrollTo(0,rot.scrollHeight);await vanta(600);prov('M sidans botten: ur bild',B()<=0,'botten '+B()+', y '+r1(scrollY));
 scrollTo(0,0);await vanta(600);prov('N sidans topp: på sin plats',Math.abs(B()-179.4)<0.6,'botten '+B());
 prov('O sidan under stod still',rad5()===rad0&&rot.scrollHeight===hojd0,'rad 5: '+rad0+' → '+rad5()+', höjd '+hojd0+' → '+rot.scrollHeight);
 rader.push((fel?'<b>'+fel+' FEL av '+antal+'</b>':'ALLT OK: '+antal+' av '+antal)+'  ·  skrivningar '+skrivn+(logg.length?'  ·  '+logg.join(', '):''));visa();document.title=fel?'FEL '+fel:'OK '+antal;
 }catch(e){rader.push('<b>AVBRUTET: '+String(e).slice(0,200)+'</b>');visa();document.title='AVBRUTET'}
})();
})();
</script></body></html>`;
fs.mkdirSync(UT, { recursive: true });
fs.writeFileSync(path.join(UT, 'prov.html'), sida);
// Adressen: laddsidan ligger i frågesträngen till en ekotjänst som svarar med vald innehållstyp,
// och skriver ut det som står i fragmentet. Inga dubbla citattecken i skriptet: svaret är JSON.
const packad = zlib.gzipSync(Buffer.from(sida.replace(/^\s*\/\/.*$/gm, '').replace(/\n\s+/g, '\n').replace(/\n+/g, '\n'), 'utf8'), { level: 9 }).toString('base64');
const laddare = "<script>(async function(){var b=atob(location.hash.slice(1)),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);var t=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();document.open();document.write(t);document.close()})().catch(function(e){document.title='LADDFEL '+e})</script>";
const adress = 'https://postman-echo.com/response-headers?Content-Type=' + encodeURIComponent('text/html; charset=utf-8') + '&x=' + encodeURIComponent(laddare) + '#' + packad;
fs.writeFileSync(path.join(UT, 'adress.txt'), adress);
console.log(`prov.html: ${sida.length} tecken. adress.txt: ${adress.length} tecken.`);
