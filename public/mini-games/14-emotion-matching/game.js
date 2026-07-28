/* =========================================================
   GAME 14 — EMOTION MATCHING
   Show a face; child taps the matching emotion word from 3
   choices. Teaches emotional literacy. 5 rounds.
   ASSETS: assets/face-<emotion>.png (emoji fallback shown).
   ========================================================= */
(function(){
  const EMOTIONS = [
    {word:'HAPPY',    img:'assets/face-happy.png',    emo:'😀'},
    {word:'SAD',      img:'assets/face-sad.png',      emo:'😢'},
    {word:'ANGRY',    img:'assets/face-angry.png',    emo:'😠'},
    {word:'SURPRISED',img:'assets/face-surprised.png',emo:'😲'},
    {word:'SCARED',   img:'assets/face-scared.png',   emo:'😱'}
  ];
  const G = mountGame({icon:'😀', title:'Emotion Matching'});
  let round=0, mistakes=0, correct=null;
  let queue=[];
  const TOTAL=5;

  const face = el('div',{style:'font-size:130px'});
  const choices = el('.row',{style:'gap:14px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'How does this face feel?'));
  G.body.appendChild(face);
  G.body.appendChild(choices);

  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    // Draw from a shuffled-once queue (not a fresh pick(EMOTIONS) each round)
    // so the same emotion can't be the answer twice — EMOTIONS has exactly
    // 5 entries for 5 rounds.
    correct = queue.shift();
    const opts = shuffle([correct,...shuffle(EMOTIONS.filter(e=>e!==correct)).slice(0,2)]);
    clear(face); face.appendChild(imgOrEmoji(correct.img, correct.emo, 140));
    clear(choices);
    opts.forEach(o=>{
      const t = el('button.btn',{style:'min-width:150px'}, o.word);
      t.addEventListener('pointerdown',()=>guess(o,t));
      choices.appendChild(t);
    });
  }
  function guess(o,node){
    if(o===correct){
      flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; queue=shuffle(EMOTIONS.slice()); newRound(); }

  G.instructions('😀 ➡️ HAPPY', start);
})();
