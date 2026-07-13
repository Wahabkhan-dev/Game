/* =========================================================
   GAME 33 — SEASONS SORT
   Drag clothing/activity items into the correct season bin
   (Spring, Summer, Fall, Winter). Teaches seasonal science.
   1 board of 6 items = 1 round.
   ASSETS: assets/<item>.png per item (emoji fallback).
   ========================================================= */
(function(){
  const SEASONS = [
    {id:'spring', label:'Spring', emo:'🌸', color:'#2fbf71'},
    {id:'summer', label:'Summer', emo:'☀️', color:'#ff8c33'},
    {id:'fall',   label:'Fall',   emo:'🍂', color:'#c0682b'},
    {id:'winter', label:'Winter', emo:'❄️', color:'#4a7bff'}
  ];
  const ITEMS = [
    {n:'Umbrella',  s:'spring', img:'assets/umbrella.png',  emo:'☔'},
    {n:'Flower',    s:'spring', img:'assets/flower.png',    emo:'🌷'},
    {n:'Kite',      s:'spring', img:'assets/kite.png',      emo:'🪁'},
    {n:'Swimsuit',  s:'summer', img:'assets/swimsuit.png',  emo:'🩳'},
    {n:'Sunglasses',s:'summer', img:'assets/sunglasses.png',emo:'🕶️'},
    {n:'Ice cream', s:'summer', img:'assets/icecream.png',  emo:'🍦'},
    {n:'Leaf',      s:'fall',   img:'assets/leaf.png',      emo:'🍂'},
    {n:'Pumpkin',   s:'fall',   img:'assets/pumpkin.png',   emo:'🎃'},
    {n:'Acorn',     s:'fall',   img:'assets/acorn.png',     emo:'🌰'},
    {n:'Mittens',   s:'winter', img:'assets/mittens.png',   emo:'🧤'},
    {n:'Snowman',   s:'winter', img:'assets/snowman.png',   emo:'⛄'},
    {n:'Coat',      s:'winter', img:'assets/coat.png',      emo:'🧥'}
  ];
  const G = mountGame({icon:'🍂', title:'Seasons Sort'});
  let mistakes=0, sorted=0, need=0;

  const binsRow = el('.row',{style:'gap:16px;flex-wrap:wrap;justify-content:center'});
  const bins={};
  SEASONS.forEach(s=>{
    const bin = el('.dropzone',{style:'width:150px;min-height:130px;flex-wrap:wrap;gap:5px;padding:10px;align-content:flex-start'});
    bin.dataset.cat=s.id; bins[s.id]=bin;
    binsRow.appendChild(el('div',null,[
      el('div',{style:'font-size:19px;font-weight:bold;margin-bottom:5px;color:'+s.color}, s.emo+' '+s.label),
      bin
    ]));
  });
  const tray = el('.row',{style:'gap:12px;flex-wrap:wrap;max-width:640px;margin-top:14px'});
  G.body.appendChild(el('.prompt',null,'Which season does each item belong to?'));
  G.body.appendChild(binsRow);
  G.body.appendChild(tray);

  function itemTile(it){
    const t = el('.tile',{style:'width:86px;height:86px;flex-direction:column;gap:2px'},[
      imgOrEmoji(it.img,it.emo,46), el('div',{style:'font-size:12px;color:#4a4e73'},it.n)
    ]);
    enableDrag(t,{onDrop:(under)=>{
      const bin = under && under.closest ? under.closest('.dropzone') : null;
      if(bin && bin.dataset.cat===it.s){
        bin.appendChild(imgOrEmoji(it.img,it.emo,34)); t.remove(); resetPos(t);
        sorted++; G.setScore('Sorted '+sorted+' / '+need); checkBurst(bin); flashGood(bin);
        if(sorted>=need){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,build),500); }
      }else{ if(bin){ mistakes++; gentleRetry(bin); } resetPos(t); }
    }});
    return t;
  }
  function build(){
    mistakes=0; sorted=0;
    SEASONS.forEach(s=>clear(bins[s.id])); clear(tray);
    // 6 items with a spread across seasons
    const items = shuffle(ITEMS.slice()).slice(0,6);
    need = items.length;
    G.setScore('Sorted 0 / '+need);
    items.forEach(it=>tray.appendChild(itemTile(it)));
  }

  G.instructions('☔🌸  ☀️🩳  🍂🎃  ❄️🧤', build);
})();
