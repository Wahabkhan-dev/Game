/* =========================================================
   GAME 04 — COLOR MIXING LAB
   Drag two primary colors into the pot to match the target
   secondary color. Teaches color theory. 4 rounds.
   No image assets required (colors are CSS).
   ========================================================= */
(function(){
  const PRIMARIES = { red:'#ff5a5a', blue:'#4a7bff', yellow:'#ffd23f' };
  const MIX = {
    'blue+yellow':{name:'GREEN', css:'#2fbf71'},
    'red+yellow':{name:'ORANGE', css:'#ff8c33'},
    'red+blue':{name:'PURPLE', css:'#9b59b6'}
  };
  function key(a,b){ return [a,b].sort().join('+'); }

  const G = mountGame({icon:'🎨', title:'Color Mixing Lab'});

  let round=0, mistakes=0, target=null, chosen=[];
  const TOTAL=4;
  const prompt = el('.prompt');
  const targetChip = el('div',{style:'width:120px;height:120px;border-radius:20px;box-shadow:var(--shadow);border:4px solid #fff;'});
  const pot = el('.dropzone',{style:'width:180px;height:180px;border-radius:50%;font-size:60px;'},'🍯');
  const source = el('.row',{style:'gap:22px;'});

  G.body.appendChild(prompt);
  G.body.appendChild(el('.row',{style:'gap:40px;align-items:center;flex-wrap:wrap;justify-content:center'},[
    el('div',null,[el('div',{style:'font-size:20px;margin-bottom:6px'},'Make this color:'),targetChip]),
    el('div',null,[el('div',{style:'font-size:20px;margin-bottom:6px'},'Mixing Pot'),pot])
  ]));
  G.body.appendChild(source);

  function blobs(){
    clear(source); chosen=[];
    pot.style.background=''; pot.textContent='🍯';
    Object.entries(PRIMARIES).forEach(([nm,css])=>{
      const b = el('.tile',{style:`width:90px;height:90px;border-radius:50%;background:${css};color:#fff;font-size:16px;`}, nm.toUpperCase());
      b.dataset.name=nm;
      enableDrag(b, {onDrop:(under)=>{
        if(under && (under===pot || pot.contains(under))) addColor(nm, css);
        resetPos(b);
      }});
      source.appendChild(b);
    });
  }
  function addColor(nm, css){
    if(chosen.length>=2 || chosen.includes(nm)) return;
    chosen.push(nm);
    pot.textContent='';
    pot.style.background = chosen.length===1 ? css
      : `linear-gradient(90deg, ${PRIMARIES[chosen[0]]}, ${PRIMARIES[chosen[1]]})`;
    if(chosen.length===2) setTimeout(checkMix, 350);
  }
  function checkMix(){
    const res = MIX[key(chosen[0],chosen[1])];
    if(res && res.name===target.name){
      pot.style.background=res.css; checkBurst(G.body); flashGood(pot);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,650);
    }else{
      mistakes++; gentleRetry(pot);
      setTimeout(()=>{ chosen=[]; pot.style.background=''; pot.textContent='🍯'; }, 500);
    }
  }
  function newRound(){
    round++;
    target = pick(Object.values(MIX));
    prompt.textContent='Mix two colors to make '+target.name+'!';
    targetChip.style.background=target.css;
    G.setScore('Round '+round+' / '+TOTAL);
    blobs();
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🔴➕🟡🟰🟠', start);
})();
