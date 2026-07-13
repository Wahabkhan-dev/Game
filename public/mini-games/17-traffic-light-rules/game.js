/* =========================================================
   GAME 17 — TRAFFIC LIGHT RULES
   A CSS traffic light shows red/yellow/green. Child taps the
   correct action: STOP / SLOW / GO. Teaches road safety.
   6 rounds. Light + lamps are pure CSS (no image needed);
   optional street background asset can be added.
   ASSETS (optional): assets/street-bg.png
   ========================================================= */
(function(){
  const RULES = {
    red:    {action:'STOP', icon:'✋', cls:'tl-red'},
    yellow: {action:'SLOW', icon:'⚠️', cls:'tl-yellow'},
    green:  {action:'GO',   icon:'🚶', cls:'tl-green'}
  };
  const G = mountGame({icon:'🚦', title:'Traffic Light Rules'});
  let round=0, mistakes=0, current='red';
  const TOTAL=6;

  const lampR = el('.tl-lamp.tl-red'), lampY = el('.tl-lamp.tl-yellow'), lampG = el('.tl-lamp.tl-green');
  const pole = el('.tl-pole',null,[lampR,lampY,lampG]);
  const choices = el('.row',{style:'gap:16px;margin-top:16px'});
  G.body.appendChild(el('.prompt',null,'What should you do?'));
  G.body.appendChild(pole);
  G.body.appendChild(choices);

  function showLight(color){
    [lampR,lampY,lampG].forEach(l=>l.classList.remove('on'));
    ({red:lampR,yellow:lampY,green:lampG})[color].classList.add('on');
  }
  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    current = pick(['red','yellow','green']);
    showLight(current);
    clear(choices);
    shuffle(Object.values(RULES)).forEach(r=>{
      const b = el('button.btn.big',{style:'min-width:150px'}, r.icon+' '+r.action);
      b.addEventListener('pointerdown',()=>guess(r.action,b));
      choices.appendChild(b);
    });
  }
  function guess(action,node){
    if(action===RULES[current].action){
      flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🔴 STOP · 🟡 SLOW · 🟢 GO', start);
})();
