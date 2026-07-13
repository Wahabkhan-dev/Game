/* =========================================================
   GAME 02 — NUMBER MATCH
   Drag the correct number of apples into the basket to match
   the numeral. Teaches counting (1-10). 5 rounds.
   No image assets required (apples are emoji).
   ========================================================= */
(function(){
  const G = mountGame({icon:'🔢', title:'Number Match'});

  let round=0, mistakes=0, target=0, inBasket=0;
  const TOTAL=5;

  const prompt = el('.prompt');
  const numeral = el('.big-target');
  const basket = el('.dropzone', {style:'width:340px;min-height:150px;flex-wrap:wrap;gap:8px;padding:12px;font-size:44px;'});
  const basketWrap = el('div', null, [el('div',{style:'font-size:22px;margin-bottom:6px'},'🧺 Basket'), basket]);
  const tray = el('.row', {style:'flex-wrap:wrap;max-width:520px;'});
  const checkBtn = el('button.btn.big', {onclick:check}, '✓ Check');

  G.body.appendChild(prompt);
  G.body.appendChild(numeral);
  G.body.appendChild(el('.row',{style:'align-items:flex-start;gap:40px;flex-wrap:wrap;justify-content:center'},[
    el('div',null,[el('div',{style:'font-size:22px;margin-bottom:6px'},'🍎 Apples'), tray]),
    basketWrap
  ]));
  G.body.appendChild(checkBtn);

  function makeApple(){
    const a = el('.tile', {style:'width:70px;height:70px;font-size:40px;border-radius:50%;'}, '🍎');
    enableDrag(a, {onDrop:(under)=>{
      if(under && (under===basket || basket.contains(under))){
        basket.appendChild(a); resetPos(a); a.style.cursor='default'; a.dataset.in='1'; recount();
      } else resetPos(a);
    }});
    return a;
  }
  function recount(){ inBasket = basket.querySelectorAll('.tile').length; }
  function newRound(){
    round++; inBasket=0;
    target = rand(1,10);
    prompt.textContent = 'Put this many apples in the basket:';
    numeral.textContent = target;
    clear(basket); clear(tray);
    const count = Math.min(10, Math.max(target+2,5));
    for(let i=0;i<count;i++) tray.appendChild(makeApple());
    G.setScore('Round '+round+' / '+TOTAL);
  }
  function check(){
    recount();
    if(inBasket===target){
      checkBurst(G.body); flashGood(numeral);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),500); }
      else setTimeout(newRound,500);
    }else{ mistakes++; gentleRetry(basket); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🔢🍎🧺', start);
})();
