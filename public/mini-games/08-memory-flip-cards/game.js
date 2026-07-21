/* =========================================================
   GAME 08 — MEMORY FLIP CARDS
   Classic memory match with kid-friendly icons.
   Teaches memory & pattern recognition. 6 pairs.
   No image assets required (icons are emoji).
   ========================================================= */
(function(){
  const ICONS = ['🐶','🐱','🦊','🐸','🐵','🐧','🍎','🍌','🍓','⭐','🌈','🚗','🎈','🌸'];
  const G = mountGame({icon:'🃏', title:'Memory Flip Cards'});

  const PAIRS=6;
  let first=null, lock=false, matched=0, tries=0;
  const grid = el('div',{style:'display:grid;grid-template-columns:repeat(4,110px);gap:14px;'});
  G.body.appendChild(el('.prompt',null,'Find all the matching pairs!'));
  G.body.appendChild(grid);

  function card(icon){
    const c = el('.tile',{style:'width:110px;height:130px;font-size:60px;background:linear-gradient(135deg,#5b6cff,#8a5bff);color:#fff;'},'❓');
    c.dataset.icon=icon; c.dataset.state='down';
    c.addEventListener('pointerdown',()=>flip(c));
    return c;
  }
  function flip(c){
    if(lock||c.dataset.state!=='down') return;
    c.textContent=c.dataset.icon; c.dataset.state='up';
    c.style.background='#fff'; c.style.color='inherit';
    if(!first){ first=c; return; }
    tries++;
    if(first.dataset.icon===c.dataset.icon){
      first.dataset.state=c.dataset.state='matched';
      flashGood(first); flashGood(c);
      first=null; matched++;
      if(matched>=PAIRS){ const stars=tries<=PAIRS+1?3:tries<=PAIRS+4?2:1; setTimeout(()=>G.result(stars,build),500); }
    }else{
      lock=true; const a=first, b=c; first=null;
      setTimeout(()=>{
        [a,b].forEach(x=>{ x.textContent='❓'; x.dataset.state='down';
          x.style.background='linear-gradient(135deg,#5b6cff,#8a5bff)'; x.style.color='#fff'; });
        lock=false;
      },800);
    }
  }
  function build(){
    first=null; lock=false; matched=0; tries=0;
    G.setScore('Pairs 0 / '+PAIRS);
    clear(grid);
    const chosen = shuffle(ICONS.slice()).slice(0,PAIRS);
    shuffle([...chosen,...chosen]).forEach(ic=>grid.appendChild(card(ic)));
  }
  // keep score pill live
  const obs = new MutationObserver(()=>G.setScore('Pairs '+matched+' / '+PAIRS));
  obs.observe(grid,{subtree:true,attributes:true,attributeFilter:['data-state']});

  G.instructions('🃏🔁🐶🐶', build);
})();
