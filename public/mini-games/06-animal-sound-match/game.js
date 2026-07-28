/* =========================================================
   GAME 06 — ANIMAL SOUND MATCH
   Press 🔊 to hear the sound (browser speech, offline), then
   tap the matching animal. Listening + recognition. 5 rounds.
   Sound word is also shown as a text fallback.
   No image assets required (animals are emoji).
   ========================================================= */
(function(){
  const ANIMALS = [
    {a:'🐄',name:'Cow',sound:'Moo'},
    {a:'🐶',name:'Dog',sound:'Woof woof'},
    {a:'🐱',name:'Cat',sound:'Meow'},
    {a:'🐸',name:'Frog',sound:'Ribbit'},
    {a:'🦆',name:'Duck',sound:'Quack quack'},
    {a:'🐑',name:'Sheep',sound:'Baa'},
    {a:'🐔',name:'Hen',sound:'Cluck cluck'},
    {a:'🦁',name:'Lion',sound:'Roar'}
  ];
  const G = mountGame({icon:'🔊', title:'Animal Sound Match'});

  let round=0, mistakes=0, correct=null;
  let queue=[];
  const TOTAL=5;
  const soundWord = el('div',{style:'font-size:26px;color:#8a5bff;font-weight:bold;min-height:34px'});
  const playBtn = el('button.btn.big',{onclick:play},'🔊 Play Sound');
  const choices = el('.row',{style:'gap:18px;flex-wrap:wrap;margin-top:10px;'});
  G.body.appendChild(el('.prompt',null,'Which animal makes this sound?'));
  G.body.appendChild(playBtn);
  G.body.appendChild(soundWord);
  G.body.appendChild(choices);

  function play(){
    if(!correct) return;
    speak(correct.sound);
    soundWord.textContent = '“'+correct.sound+'”';
    flashGood(playBtn);
  }
  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    soundWord.textContent='';
    // Draw the correct animal from a shuffled-once queue (not a fresh pick()
    // each round) so the same animal can't be the answer twice in a session.
    correct = queue.shift();
    const opts = shuffle([correct, ...shuffle(ANIMALS.filter(a=>a!==correct)).slice(0,3)]);
    clear(choices);
    opts.forEach(o=>{
      const c = el('.tile',{style:'width:120px;height:120px;font-size:70px;'}, o.a);
      c.addEventListener('pointerdown',()=>guess(o,c));
      choices.appendChild(c);
    });
    setTimeout(play, 350);
  }
  function guess(o,node){
    if(o===correct){
      flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),500); }
      else setTimeout(newRound,550);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; queue=shuffle(ANIMALS.slice()); newRound(); }

  G.instructions('🔊❓🐄🐶🐱', start);
})();
