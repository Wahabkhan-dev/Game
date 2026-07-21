/* =========================================================
   GAME 39 — NOCTURNAL vs DIURNAL SORT
   Drag each animal into the "Day" or "Night" bin based on
   when it is active. Teaches animal behavior science.
   1 board of 6 animals = 1 round.
   ASSETS: assets/<id>.png per animal (emoji fallback).
   ========================================================= */
(function(){
  const ANIMALS = [
    {n:'Owl',      when:'night', img:'assets/owl.png',      emo:'🦉'},
    {n:'Bat',      when:'night', img:'assets/bat.png',      emo:'🦇'},
    {n:'Hedgehog', when:'night', img:'assets/hedgehog.png', emo:'🦔'},
    {n:'Raccoon',  when:'night', img:'assets/raccoon.png',  emo:'🦝'},
    {n:'Rooster',  when:'day',   img:'assets/rooster.png',  emo:'🐓'},
    {n:'Squirrel', when:'day',   img:'assets/squirrel.png', emo:'🐿️'},
    {n:'Butterfly',when:'day',   img:'assets/butterfly.png',emo:'🦋'},
    {n:'Bee',      when:'day',   img:'assets/bee.png',      emo:'🐝'}
  ];
  const G = mountGame({icon:'🌗', title:'Day or Night'});
  let mistakes=0, sorted=0, need=0;

  const dayBin   = el('.dropzone.bin-day',{style:'width:230px;min-height:140px;flex-wrap:wrap;gap:6px;padding:12px;align-content:flex-start'});
  const nightBin = el('.dropzone.bin-night',{style:'width:230px;min-height:140px;flex-wrap:wrap;gap:6px;padding:12px;align-content:flex-start'});
  dayBin.dataset.cat='day'; nightBin.dataset.cat='night';
  const tray = el('.row',{style:'gap:12px;flex-wrap:wrap;max-width:640px;margin-top:14px'});

  G.body.appendChild(el('.prompt',null,'When is each animal awake?'));
  G.body.appendChild(el('.row',{style:'gap:40px;align-items:flex-start;flex-wrap:wrap;justify-content:center'},[
    el('div',null,[el('div',{style:'font-size:22px;margin-bottom:6px;color:#e0a020'},'☀️ Day'), dayBin]),
    el('div',null,[el('div',{style:'font-size:22px;margin-bottom:6px;color:var(--brand2)'},'🌙 Night'), nightBin])
  ]));
  G.body.appendChild(tray);

  function animalTile(a){
    const t = el('.tile',{style:'width:92px;height:92px;flex-direction:column;gap:2px'},[
      imgOrEmoji(a.img,a.emo,50), el('div',{style:'font-size:12px;color:#4a4e73'},a.n)
    ]);
    enableDrag(t,{onDrop:(under)=>{
      const bin = under && under.closest ? under.closest('.dropzone') : null;
      if(bin && bin.dataset.cat===a.when){
        bin.appendChild(imgOrEmoji(a.img,a.emo,40)); t.remove(); resetPos(t);
        sorted++; G.setScore('Sorted '+sorted+' / '+need); checkBurst(bin); flashGood(bin);
        if(sorted>=need){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,build),500); }
      }else{ if(bin){ mistakes++; gentleRetry(bin); } resetPos(t); }
    }});
    return t;
  }
  function build(){
    mistakes=0; sorted=0; clear(dayBin); clear(nightBin); clear(tray);
    const night = shuffle(ANIMALS.filter(a=>a.when==='night')).slice(0,3);
    const day   = shuffle(ANIMALS.filter(a=>a.when==='day')).slice(0,3);
    const items = shuffle([...night,...day]);
    need = items.length;
    G.setScore('Sorted 0 / '+need);
    items.forEach(a=>tray.appendChild(animalTile(a)));
  }

  G.instructions('🦉➡️🌙   🐓➡️☀️', build);
})();
