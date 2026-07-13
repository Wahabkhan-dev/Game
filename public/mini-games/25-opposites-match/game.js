/* =========================================================
   GAME 25 — OPPOSITES MATCH
   A picture+word is shown; child picks its opposite from 3
   picture choices. Teaches antonyms/vocabulary. 5 rounds.
   ASSETS: assets/<word>.png per concept (emoji fallback).
   ========================================================= */
(function(){
  // each concept: word, picture. Pairs list links opposites.
  const C = {
    big:{img:'assets/big.png',emo:'🐘'},      small:{img:'assets/small.png',emo:'🐭'},
    hot:{img:'assets/hot.png',emo:'🔥'},      cold:{img:'assets/cold.png',emo:'❄️'},
    up:{img:'assets/up.png',emo:'⬆️'},        down:{img:'assets/down.png',emo:'⬇️'},
    fast:{img:'assets/fast.png',emo:'🐇'},     slow:{img:'assets/slow.png',emo:'🐢'},
    day:{img:'assets/day.png',emo:'☀️'},       night:{img:'assets/night.png',emo:'🌙'},
    happy:{img:'assets/happy.png',emo:'😀'},   sad:{img:'assets/sad.png',emo:'😢'}
  };
  const PAIRS = [['big','small'],['hot','cold'],['up','down'],['fast','slow'],['day','night'],['happy','sad']];
  const G = mountGame({icon:'↔️', title:'Opposites Match'});
  let queue=[], idx=0, mistakes=0, answer='';
  const TOTAL=5;

  const cue = el('div',{style:'display:flex;flex-direction:column;align-items:center;gap:6px'});
  const choices = el('.row',{style:'gap:18px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'Find the OPPOSITE!'));
  G.body.appendChild(cue);
  G.body.appendChild(choices);

  function conceptTile(word, big){
    const size = big?120:84;
    return el('.tile',{style:`width:${big?150:130}px;height:${big?150:130}px;flex-direction:column;gap:4px;`+(big?'border-color:var(--brand)':'')},[
      imgOrEmoji(C[word].img, C[word].emo, size),
      el('div',{style:'font-size:'+(big?20:16)+'px;color:#4a4e73;font-weight:bold'}, word.toUpperCase())
    ]);
  }
  function newRound(){
    const [a,b] = queue[idx];
    const showLeft = Math.random()<.5;
    const cueWord = showLeft?a:b;
    answer = showLeft?b:a;
    G.setScore('Round '+(idx+1)+' / '+TOTAL);
    clear(cue); cue.appendChild(conceptTile(cueWord,true));
    // choices = answer + 2 random other concepts
    const others = shuffle(Object.keys(C).filter(w=>w!==answer && w!==cueWord)).slice(0,2);
    clear(choices);
    shuffle([answer,...others]).forEach(w=>{
      const t = conceptTile(w,false);
      t.addEventListener('pointerdown',()=>guess(w,t));
      choices.appendChild(t);
    });
  }
  function guess(w,node){
    if(w===answer){
      flashGood(node); checkBurst(G.body);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else { idx++; setTimeout(newRound,600); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=shuffle(PAIRS.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('🐘 BIG ↔️ 🐭 SMALL', start);
})();
