/* =========================================================
   GAME 12 — COIN COUNTING
   Drag 1c and 5c coins into the jar until the total matches
   the target. Teaches money math. 5 rounds. Running total
   shown. "Check" validates. Coins use image w/ emoji fallback.
   ASSETS: assets/coin-1.png, assets/coin-5.png, assets/jar.png
   ========================================================= */
(function(){
  const G = mountGame({icon:'🪙', title:'Coin Counting'});
  let round=0, mistakes=0, target=0, total=0;
  const TOTAL=5;

  const prompt = el('.prompt');
  // Prominent centered "target cents" badge — a big gold coin disc with a
  // large, bold, high-contrast number in the middle (replaces the old faint
  // gradient .big-target text that was hard to read on the brown modal).
  const targetBox = el('div',{style:
    'width:150px;height:150px;border-radius:50%;margin:6px auto;'+
    'display:flex;align-items:center;justify-content:center;'+
    'font-size:58px;font-weight:900;color:#4a2f00;'+
    'background:radial-gradient(circle at 38% 32%, #ffe9a0 0%, #ffd24a 46%, #e0a520 100%);'+
    'border:6px solid #b9860b;box-shadow:0 6px 18px rgba(0,0,0,.35), inset 0 3px 8px rgba(255,255,255,.5);'+
    'text-shadow:0 1px 1px rgba(255,255,255,.55);'});
  const totalLbl = el('div',{style:'font-size:26px;font-weight:bold;color:#ffe08a;text-shadow:0 2px 4px rgba(0,0,0,.6)'},'Jar total: 0¢');
  const jar = el('.dropzone',{style:'width:220px;min-height:200px;flex-wrap:wrap;gap:6px;padding:14px;position:relative'});
  // Fixed width (not max-width) so the tray's box never shrinks as coins are
  // dragged out of it — otherwise the tray+jar row's total width changes
  // live during play, flipping the layout between side-by-side and stacked
  // mid-game depending on how many coins are left.
  const tray = el('.row',{style:'gap:16px;flex-wrap:wrap;width:560px;align-content:flex-start'});
  const checkBtn = el('button.btn.big',{onclick:check},'✓ Check');

  G.body.appendChild(prompt);
  G.body.appendChild(targetBox);
  G.body.appendChild(el('.row',{style:'gap:40px;align-items:flex-start;flex-wrap:wrap;justify-content:center'},[
    el('div',null,[el('div',{style:'font-size:20px;margin-bottom:6px'},'Coins'), tray]),
    el('div',null,[el('div',{style:'font-size:20px;margin-bottom:6px'},'🏺 Jar'), jar, totalLbl])
  ]));
  G.body.appendChild(checkBtn);

  function makeCoin(val){
    const src = val===5?'assets/coin-5.png':'assets/coin-1.png';
    const emo = val===5?'🟡':'🪙';
    const c = el('.tile',{style:'width:74px;height:74px;border-radius:50%;position:relative'});
    c.appendChild(imgOrEmoji(src, emo, 60));
    c.appendChild(el('div',{style:'position:absolute;bottom:2px;right:6px;font-size:16px;font-weight:bold;color:#7a5b00'}, val+'¢'));
    c.dataset.val=val;
    enableDrag(c, {onDrop:(under)=>{
      // Two-way drag: drop ON the jar → into the jar; drop ANYWHERE else →
      // return the coin to the tray (its old home), so an overshoot is fixable.
      if(under && (under===jar || jar.contains(under))){
        jar.appendChild(c);
      } else {
        tray.appendChild(c);
      }
      resetPos(c);
      recount();
    }});
    return c;
  }
  function recount(){
    total = Array.from(jar.querySelectorAll('.tile')).reduce((s,c)=>s+(+c.dataset.val),0);
    totalLbl.textContent = 'Jar total: '+total+'¢';
  }
  function newRound(){
    round++; total=0; recount();
    // target as a mix reachable by 1s and 5s
    target = [7,10,12,15,8,11,6,13][rand(0,7)];
    prompt.textContent='Fill the jar to make:';
    targetBox.textContent=target+'¢';
    clear(jar); clear(tray);
    // supply plenty of coins: several 5s and 1s
    for(let i=0;i<3;i++) tray.appendChild(makeCoin(5));
    for(let i=0;i<8;i++) tray.appendChild(makeCoin(1));
    G.setScore('Round '+round+' / '+TOTAL);
  }
  function check(){
    recount();
    if(total===target){
      checkBurst(G.body); flashGood(targetBox);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(jar); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🪙🪙🟡 ➡️ 🏺', start);
})();
