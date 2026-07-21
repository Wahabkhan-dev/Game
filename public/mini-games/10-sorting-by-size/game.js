/* =========================================================
   GAME 10 — SORTING BY SIZE
   Tap the balls in order from smallest to largest.
   Teaches size comparison & ordering. 4 rounds.
   No image assets required (balls are CSS).
   ========================================================= */
(function(){
  const G = mountGame({icon:'📏', title:'Sorting by Size'});

  let round=0, mistakes=0, next=0, order=[];
  const TOTAL=4;
  const arena = el('.row',{style:'gap:20px;flex-wrap:wrap;min-height:240px;align-items:center;justify-content:center'});
  const hint = el('div',{style:'font-size:22px;color:#8a5bff'},'Tap smallest ➡️ largest');
  G.body.appendChild(el('.prompt',null,'Put them in order by size!'));
  G.body.appendChild(hint);
  G.body.appendChild(arena);

  function newRound(){
    round++; next=0; G.setScore('Round '+round+' / '+TOTAL);
    clear(arena);
    const n = rand(4,5);
    const sizes = shuffle(Array.from({length:n},(_,i)=>60+i*34));
    order = sizes.slice().sort((a,b)=>a-b);
    const hue=rand(0,360);
    sizes.forEach(sz=>{
      const ball = el('.tile',{style:
        `width:${sz}px;height:${sz}px;border-radius:50%;font-size:${Math.round(sz/3)}px;color:#fff;
         background:radial-gradient(circle at 32% 30%, hsl(${hue},85%,72%), hsl(${hue},75%,50%));`}, '');
      ball.dataset.size=sz;
      ball.addEventListener('pointerdown',()=>tap(ball,sz));
      arena.appendChild(ball);
    });
  }
  function tap(ball,sz){
    if(ball.dataset.done) return;
    if(sz===order[next]){
      ball.dataset.done='1'; ball.textContent=(next+1); flashGood(ball);
      ball.style.outline='6px solid #2fbf71';
      next++;
      if(next>=order.length){
        checkBurst(G.body);
        if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),500); }
        else setTimeout(newRound,600);
      }
    }else{ mistakes++; gentleRetry(ball); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🔵➡️🔵➡️🔵 (small→big)', start);
})();
