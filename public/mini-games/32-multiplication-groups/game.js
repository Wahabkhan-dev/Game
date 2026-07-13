/* =========================================================
   GAME 32 — MULTIPLICATION GROUPS (INTRO)
   Visual groups of objects (e.g. 3 groups of 5 stars). Child
   taps the correct product from 3 choices. Limited to the
   2x, 5x and 10x tables. Teaches early multiplication.
   5 rounds.
   ASSETS: assets/item.png repeatable icon (emoji fallback).
   ========================================================= */
(function(){
  const ICONS = ['⭐','🍎','🎈','🍓'];
  const G = mountGame({icon:'✖️', title:'Multiplication Groups'});
  let round=0, mistakes=0, product=0;
  const TOTAL=5;

  const prompt = el('.prompt');
  const groupsWrap = el('.row',{style:'gap:14px;flex-wrap:wrap;justify-content:center;max-width:660px'});
  const choices = el('.row',{style:'gap:16px;margin-top:16px'});
  G.body.appendChild(prompt);
  G.body.appendChild(groupsWrap);
  G.body.appendChild(choices);

  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    const factor = pick([2,5,10]);     // 2x / 5x / 10x tables
    const groups = rand(2,5);          // how many groups
    product = groups*factor;
    const icon = pick(ICONS);
    prompt.innerHTML = groups+' groups of '+factor+' = ?';
    clear(groupsWrap);
    for(let g=0; g<groups; g++){
      const box = el('.mgrp');
      for(let i=0;i<factor;i++) box.appendChild(imgOrEmoji('assets/item.png', icon, factor>=10?26:34));
      groupsWrap.appendChild(box);
    }
    const opts=new Set([product]);
    while(opts.size<3){ const d=product+pick([-factor,factor,-2,2,-5,5]); if(d>0 && d!==product) opts.add(d); }
    clear(choices);
    shuffle([...opts]).forEach(v=>{
      const b=el('button.btn.big',{style:'min-width:90px'}, v+'');
      b.addEventListener('pointerdown',()=>guess(v,b));
      choices.appendChild(b);
    });
  }
  function guess(v,node){
    if(v===product){
      flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('⭐⭐ ⭐⭐ ⭐⭐ ➡️ 6', start);
})();
