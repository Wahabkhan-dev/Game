/* =========================================================
   GAME 22 — FRUIT & VEGETABLE SORT
   Drag each food item into the "Fruit" or "Vegetable" bin.
   Teaches food categorization. 1 board of 6 items = 1 round.
   ASSETS: assets/<item>.png per food (emoji fallback).
   ========================================================= */
(function(){
  const FOODS = [
    {n:'Apple',      cat:'fruit', img:'assets/apple.png',      emo:'🍎'},
    {n:'Banana',     cat:'fruit', img:'assets/banana.png',     emo:'🍌'},
    {n:'Grapes',     cat:'fruit', img:'assets/grapes.png',     emo:'🍇'},
    {n:'Strawberry', cat:'fruit', img:'assets/strawberry.png', emo:'🍓'},
    {n:'Orange',     cat:'fruit', img:'assets/orange.png',     emo:'🍊'},
    {n:'Carrot',     cat:'veg',   img:'assets/carrot.png',     emo:'🥕'},
    {n:'Broccoli',   cat:'veg',   img:'assets/broccoli.png',   emo:'🥦'},
    {n:'Corn',       cat:'veg',   img:'assets/corn.png',       emo:'🌽'},
    {n:'Potato',     cat:'veg',   img:'assets/potato.png',     emo:'🥔'},
    {n:'Pepper',     cat:'veg',   img:'assets/pepper.png',     emo:'🫑'}
  ];
  const G = mountGame({icon:'🍎', title:'Fruit & Veg Sort'});
  let mistakes=0, sorted=0, need=0;
  const PER=6;

  const fruitBin = el('.dropzone',{style:'width:220px;min-height:150px;flex-wrap:wrap;gap:6px;padding:12px;align-content:flex-start'});
  const vegBin   = el('.dropzone',{style:'width:220px;min-height:150px;flex-wrap:wrap;gap:6px;padding:12px;align-content:flex-start'});
  fruitBin.dataset.cat='fruit'; vegBin.dataset.cat='veg';
  const tray = el('.row',{style:'gap:14px;flex-wrap:wrap;max-width:620px;margin-top:14px'});

  G.body.appendChild(el('.prompt',null,'Sort the food into the right bin!'));
  G.body.appendChild(el('.row',{style:'gap:40px;align-items:flex-start;flex-wrap:wrap;justify-content:center'},[
    el('div',null,[el('div',{style:'font-size:22px;margin-bottom:6px;color:var(--good)'},'🍓 Fruit'), fruitBin]),
    el('div',null,[el('div',{style:'font-size:22px;margin-bottom:6px;color:#ff8c33'},'🥦 Vegetable'), vegBin])
  ]));
  G.body.appendChild(tray);

  function foodTile(f){
    const t = el('.tile',{style:'width:92px;height:92px;flex-direction:column;gap:2px'},[
      imgOrEmoji(f.img,f.emo,52), el('div',{style:'font-size:13px;color:#4a4e73'},f.n)
    ]);
    enableDrag(t,{onDrop:(under)=>{
      const bin = under && under.closest ? under.closest('.dropzone') : null;
      if(bin && bin.dataset.cat===f.cat){
        bin.appendChild(imgOrEmoji(f.img,f.emo,40)); t.remove(); resetPos(t);
        sorted++; checkBurst(bin); flashGood(bin);
        if(sorted>=need){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,build),500); }
      }else{ if(bin){ mistakes++; gentleRetry(bin); } resetPos(t); }
    }});
    return t;
  }
  function build(){
    mistakes=0; sorted=0;
    clear(fruitBin); clear(vegBin); clear(tray);
    // pick 3 fruit + 3 veg
    const fruits = shuffle(FOODS.filter(f=>f.cat==='fruit')).slice(0,3);
    const vegs   = shuffle(FOODS.filter(f=>f.cat==='veg')).slice(0,3);
    const items = shuffle([...fruits,...vegs]);
    need = items.length; // 6
    G.setScore('Sorted 0 / '+need);
    items.forEach(f=>tray.appendChild(foodTile(f)));
  }
  // live score
  const _cb=checkBurst; // (score updated inside foodTile via sorted var)
  const obs=new MutationObserver(()=>G.setScore('Sorted '+sorted+' / '+need));
  obs.observe(tray,{childList:true});

  G.instructions('🍎➡️🍓  🥕➡️🥦', build);
})();
