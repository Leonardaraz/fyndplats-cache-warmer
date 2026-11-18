// iOS zoomar in hela sidan när ett fält får fokus, om fältets text är mindre
// än 16 punkter på skärmen. Alla fält har 16 px på mobilen (app/globals.css),
// men det räcker inte när kunden har Safaris sidzoom under 100 %: på 75 % är
// 16 px bara 12 punkter, och varje tryck i sökfältet zoomar in sidan, som sedan
// står kvar inzoomad också på nästa sida (Leonard 2026-11-18, mätt i hans
// skärmbilder: sidan ritad 524 px bred på en 393 px bred telefon).
//
// Skriptet lägger maximum-scale=1 i sidans viewport, bara på iOS. Där styr
// värdet zoomen vid fokus men inte kundens egen: Safari låter kunden nypa in
// sidan ändå (sedan iOS 10). I Android Chrome hade samma värde stängt av
// nypzoomen, så där rörs ingenting, och därför står det inte i sidans egen
// viewport (app/layout.tsx).
//
// Värdet sätts vid varje tryck på skärmen, inte vid laddningen. Trycket
// kommer före fokus, så det räcker, och det finns två skäl att vänta:
// ☠️ 1. Ändras taggen innan React har väckt sidan känner React inte igen den
//    och lägger in en egen bredvid: två viewport-taggar, där den sista (utan
//    taket) gäller (mätt 2026-11-18).
// ☠️ 2. React kan byta ut taggen vid ett mjukt sidbyte. Därför går skriptet
//    igenom ALLA viewport-taggar vid varje tryck, inte bara den första.
//
// Ren modul (node --test).

export const IOS_FOKUSZOOM_SKRIPT =
  "(function(){try{var n=navigator;" +
  "if(!/iP(hone|od|ad)/.test(n.userAgent)&&!(n.platform==='MacIntel'&&n.maxTouchPoints>1))return;" +
  "document.addEventListener('touchstart',function(){" +
  "var m=document.querySelectorAll('meta[name=\"viewport\"]');" +
  "for(var i=0;i<m.length;i++)if(m[i].content.indexOf('maximum-scale')<0)m[i].content+=', maximum-scale=1'" +
  "},{passive:true,capture:true})}catch(e){}})()";
