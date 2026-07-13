/* =========================================================
   GAME 07 — SIMPLE ADDITION BUBBLES
   Tap two bubbles that add up to the target number.
   Teaches addition (1-10). 5 targets per game.
   No image assets required (bubbles are CSS).
   ========================================================= */
(function(){
  const G = mountGame({icon:'🫧', title:'Addition Bubbles'});

  let round=0, mistakes=0, target=0, selected=[];
  const TOTAL=5;
  const prompt = el('.prompt');
  const targetBox = el('.big-target');
  const arena = el('.row',{style:'gap:16px;flex-wrap:wrap;max-width:640px;min-height:220px;align-items:center;justify-content:center'});
  G.body.appendChild(prompt);
  G.body.appendChild(targetBox);
  G.body.appendChild(el('div',{style:'font-size:20px;color:#8a5bff'},'Pop TWO bubbles that add up to it!'));
  G.body.appendChild(arena);

  function newRound(){
    round++; selected=[]; G.setScore('Round '+round+' / '+TOTAL);
    target = rand(3,10);
    prompt.textContent='Make this number:';
    targetBox.textContent=target;
    const a = rand(1, target-1), b = target-a;
    let nums=[a,b];
    while(nums.length<8){ const n=rand(1,9); nums.push(n); }
    nums = shuffle(nums);
    clear(arena);
    nums.forEach(n=>{
      const hue=rand(0,360);
      const bub = el('.tile',{style:
        `width:96px;height:96px;border-radius:50%;font-size:40px;color:#fff;
         background:radial-gradient(circle at 30% 30%, hsl(${hue},90%,75%), hsl(${hue},80%,55%));`}, n);
      bub.dataset.n=n;
      bub.addEventListener('pointerdown',()=>popBubble(bub,n));
      arena.appendChild(bub);
    });
  }
  function popBubble(node,n){
    if(node.dataset.gone) return;
    if(selected.length>=2) return;
    node.dataset.picked='1'; node.style.outline='5px solid #5b6cff';
    selected.push({node,n});
    if(selected.length===2){
      const sum = selected[0].n+selected[1].n;
      if(sum===target){
        selected.forEach(s=>{ s.node.dataset.gone='1'; s.node.classList.add('flash-good'); s.node.style.visibility='hidden'; });
        checkBurst(G.body);
        if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),500); }
        else setTimeout(newRound,550);
      }else{
        mistakes++;
        selected.forEach(s=>{ gentleRetry(s.node); s.node.style.outline=''; delete s.node.dataset.picked; });
        selected=[];
      }
    }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🫧5➕🫧2🟰7', start);
})();
