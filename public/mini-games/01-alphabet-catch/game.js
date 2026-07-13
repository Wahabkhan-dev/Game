/* =========================================================
   GAME 01 — ALPHABET CATCH
   Letters fall; tap the one matching the target letter.
   Teaches letter recognition. 6 targets per round.
   Uses shared engine (mountGame, flashGood, checkBurst...).
   No image assets required.
   ========================================================= */
(function(){
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const G = mountGame({icon:'🔤', title:'Alphabet Catch'});

  const arena = el('div', {style:'position:relative;width:100%;flex:1;overflow:hidden;min-height:420px;'});
  const targetLine = el('.prompt', null, '');
  G.body.appendChild(targetLine);
  G.body.appendChild(arena);

  let falling=[], target='', done=0, mistakes=0, raf=0, spawnT=0, running=false;
  const TOTAL=6;

  function newTarget(){
    target = pick(LETTERS);
    targetLine.innerHTML = 'Catch the letter: <span class="big-target" style="font-size:64px">'+target+'</span>';
  }
  function spawn(){
    const L = Math.random()<0.45 ? target : pick(LETTERS);
    const span = el('div', {style:
      `position:absolute;top:-70px;left:${rand(2,88)}%;font-size:56px;font-weight:bold;
       cursor:pointer;color:hsl(${rand(0,360)},70%,55%);user-select:none;`}, L);
    span.dataset.letter=L;
    span.y=-70; span.vy=rand(90,150)/100;
    span.addEventListener('pointerdown', ()=>hit(span));
    arena.appendChild(span);
    falling.push(span);
  }
  function hit(span){
    if(!running) return;
    if(span.dataset.letter===target){
      flashGood(span); checkBurst(arena);
      span.remove(); falling=falling.filter(s=>s!==span);
      done++; G.setScore('✅ '+done+' / '+TOTAL);
      if(done>=TOTAL){ finish(); return; }
      newTarget();
    }else{ mistakes++; gentleRetry(span); }
  }
  function loop(){
    if(!running) return;
    spawnT++;
    if(spawnT%42===0) spawn();
    falling.forEach(s=>{
      s.y += s.vy*4; s.style.top=s.y+'px';
      if(s.y>arena.clientHeight+40){ s.remove(); }
    });
    falling = falling.filter(s=>s.isConnected);
    raf=requestAnimationFrame(loop);
  }
  function finish(){
    running=false; cancelAnimationFrame(raf);
    falling.forEach(s=>s.remove()); falling=[];
    const stars = mistakes===0?3:mistakes<=3?2:1;
    G.result(stars, run);
  }
  function run(){
    falling.forEach(s=>s.remove()); falling=[]; done=0; mistakes=0; spawnT=0;
    G.setScore('✅ 0 / '+TOTAL);
    newTarget(); running=true; spawn(); loop();
  }

  G.instructions('🔤⬇️👆', run);
})();
