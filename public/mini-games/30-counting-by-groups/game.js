/* =========================================================
   GAME 30 — COUNTING BY GROUPS
   Objects arranged in equal groups (e.g. 3 groups of 2). Child
   taps the correct total from 3 choices. Teaches skip-counting
   / grouping. 5 rounds. A single repeatable icon is reused.
   ASSETS: assets/item.png (emoji fallback, e.g. 🍎/⭐).
   ========================================================= */
(function(){
  const ICONS = ['🍎','⭐','🍌','🐟','🎈','🍓']; // rotate the reusable item
  const G = mountGame({icon:'🔢', title:'Counting by Groups'});
  let round=0, mistakes=0, total=0;
  const TOTAL=5;

  const prompt = el('.prompt');
  const groupsWrap = el('.row',{style:'gap:16px;flex-wrap:wrap;justify-content:center;max-width:640px'});
  const choices = el('.row',{style:'gap:16px;margin-top:16px'});
  G.body.appendChild(prompt);
  G.body.appendChild(groupsWrap);
  G.body.appendChild(choices);

  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    const groups = rand(2,4);      // number of groups
    const per = rand(2,5);         // items per group
    total = groups*per;
    const icon = pick(ICONS);
    prompt.innerHTML = groups+' groups of '+per+' — how many in all?';
    clear(groupsWrap);
    for(let g=0; g<groups; g++){
      const box = el('.grp');
      for(let i=0;i<per;i++) box.appendChild(imgOrEmoji('assets/item.png', icon, 40));
      groupsWrap.appendChild(box);
    }
    // choices: correct + 2 near distractors
    const opts=new Set([total]);
    while(opts.size<3){ const d=total+pick([-2,-1,1,2,per,-per]); if(d>0) opts.add(d); }
    clear(choices);
    shuffle([...opts]).forEach(v=>{
      const b=el('button.btn.big',{style:'min-width:90px'}, v+'');
      b.addEventListener('pointerdown',()=>guess(v,b));
      choices.appendChild(b);
    });
  }
  function guess(v,node){
    if(v===total){
      flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🍎🍎 🍎🍎 🍎🍎 ➡️ 6', start);
})();
