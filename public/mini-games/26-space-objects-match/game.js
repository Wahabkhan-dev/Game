/* =========================================================
   GAME 26 — SPACE OBJECTS MATCH
   A space word is shown + spoken; child taps the matching
   space picture from 4 choices. Teaches space vocabulary.
   5 rounds.
   ASSETS: assets/<id>.png per object (emoji fallback).
   ========================================================= */
(function(){
  const SPACE = [
    {id:'sun',      name:'Sun',       img:'assets/sun.png',       emo:'☀️'},
    {id:'moon',     name:'Moon',      img:'assets/moon.png',      emo:'🌙'},
    {id:'star',     name:'Star',      img:'assets/star.png',      emo:'⭐'},
    {id:'planet',   name:'Planet',    img:'assets/planet.png',    emo:'🪐'},
    {id:'rocket',   name:'Rocket',    img:'assets/rocket.png',    emo:'🚀'},
    {id:'comet',    name:'Comet',     img:'assets/comet.png',     emo:'☄️'},
    {id:'astronaut',name:'Astronaut', img:'assets/astronaut.png', emo:'👨‍🚀'}
  ];
  const G = mountGame({icon:'🚀', title:'Space Match'});
  let round=0, mistakes=0, correct=null;
  let queue=[];
  const TOTAL=5;

  const nameLbl = el('.big-target',{style:'font-size:56px'});
  const sayBtn = el('button.btn',{onclick:()=>speak(correct&&correct.name)},'🔊 Say it');
  const choices = el('.row',{style:'gap:18px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'Find this in space:'));
  G.body.appendChild(nameLbl);
  G.body.appendChild(sayBtn);
  G.body.appendChild(choices);

  function tile(o){
    const t = el('.tile',{style:'width:130px;height:130px'},[imgOrEmoji(o.img,o.emo,84)]);
    t.addEventListener('pointerdown',()=>guess(o,t));
    return t;
  }
  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    // Draw from a shuffled-once queue (not a fresh pick(SPACE) each round)
    // so the same object can't be the answer twice — SPACE has 7 entries
    // for only 5 rounds, so every round is guaranteed distinct.
    correct = queue.shift();
    const opts = shuffle([correct,...shuffle(SPACE.filter(s=>s!==correct)).slice(0,3)]);
    nameLbl.textContent = correct.name;
    clear(choices);
    opts.forEach(o=>choices.appendChild(tile(o)));
    setTimeout(()=>speak(correct.name),300);
  }
  function guess(o,node){
    if(o===correct){
      flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; queue=shuffle(SPACE.slice()); newRound(); }

  G.instructions('🔊 "Rocket" ➡️ 🚀', start);
})();
