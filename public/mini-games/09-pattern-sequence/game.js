/* =========================================================
   GAME 09 — PATTERN SEQUENCE
   Show a repeating pattern with a "?" — pick what comes next.
   Teaches logical sequencing. 5 rounds.
   No image assets required (items are emoji).
   ========================================================= */
(function(){
  const SETS = [
    ['🔴','🔵'], ['🟢','🟡'], ['⭐','🌙'], ['🐶','🐱'],
    ['🔺','⬛'], ['🍎','🍌','🍇'], ['❤️','💙','💚']
  ];
  const G = mountGame({icon:'🔁', title:'Pattern Sequence'});

  let round=0, mistakes=0, answer='';
  const TOTAL=5;
  const seqRow = el('.row',{style:'gap:12px;font-size:64px;flex-wrap:wrap;justify-content:center'});
  const choiceRow = el('.row',{style:'gap:16px;margin-top:16px;'});
  G.body.appendChild(el('.prompt',null,'What comes next?'));
  G.body.appendChild(seqRow);
  G.body.appendChild(choiceRow);

  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    const base = pick(SETS);
    const reps = rand(2,3);
    const full = [];
    for(let i=0;i<reps;i++) full.push(...base);
    const nextIdx = full.length % base.length;
    answer = base[nextIdx];
    clear(seqRow);
    full.forEach(x=>seqRow.appendChild(el('div',null,x)));
    const q = el('div',{style:'color:var(--brand)'},'❓'); seqRow.appendChild(q);
    clear(choiceRow);
    shuffle(Array.from(new Set(base))).forEach(opt=>{
      const c = el('.tile',{style:'width:100px;height:100px;font-size:56px;'}, opt);
      c.addEventListener('pointerdown',()=>guess(opt,c,q));
      choiceRow.appendChild(c);
    });
  }
  function guess(opt,node,q){
    if(opt===answer){
      q.textContent=opt; q.classList.add('flash-good'); flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),500); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🔴🔵🔴🔵❓', start);
})();
