/* =========================================================
   GAME 37 — SIMPLE FRACTIONS (PIZZA SLICE)
   A target fraction is named (1/2, 1/3, 1/4); child taps the
   pizza/pie showing that much shaded. Teaches early fractions.
   5 rounds. Pies are pure CSS (conic-gradient) — no assets.
   ========================================================= */
(function(){
  const FRACS = [
    {label:'1/2', val:1/2},
    {label:'1/3', val:1/3},
    {label:'1/4', val:1/4},
    {label:'3/4', val:3/4},
    {label:'2/3', val:2/3}
  ];
  const G = mountGame({icon:'🍕', title:'Simple Fractions'});
  let round=0, mistakes=0, target=null;
  const TOTAL=5;

  const prompt = el('.prompt');
  const targetLbl = el('.big-target',{style:'font-size:80px'});
  const choices = el('.row',{style:'gap:22px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(prompt);
  G.body.appendChild(targetLbl);
  G.body.appendChild(choices);

  // build a pie showing fraction `f` shaded (cheese slice = shaded)
  function pie(f){
    const deg = Math.round(f*360);
    const t = el('.tile.pie-tile');
    const p = el('.pie',{style:`background:conic-gradient(#ffcf33 0 ${deg}deg, #fff6df ${deg}deg 360deg);`});
    t.appendChild(p);
    return {tile:t};
  }
  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    // pick 3 distinct fractions incl. the target
    const opts = shuffle(FRACS.slice()).slice(0,3);
    target = pick(opts);
    prompt.textContent = 'Which pizza shows this much?';
    targetLbl.textContent = target.label;
    clear(choices);
    shuffle(opts).forEach(f=>{
      const {tile}=pie(f.val);
      tile.addEventListener('pointerdown',()=>guess(f,tile));
      choices.appendChild(tile);
    });
  }
  function guess(f,node){
    if(f===target){
      flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🍕 half = 1/2', start);
})();
