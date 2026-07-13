/* =========================================================
   GAME 15 — RHYME TIME
   Target word shown + spoken (offline browser speech). Child
   taps the picture that RHYMES with it, from 3 choices.
   Teaches phonemic awareness. 5 rounds.
   ASSETS: assets/<word>.png per object (emoji fallback).
   AUDIO : spoken via speechSynthesis now; optional real clips
           assets/say-<word>.mp3 can replace it later.
   ========================================================= */
(function(){
  // Each item: word + picture. Rhyme groups share an ending.
  const ITEMS = {
    CAT:{img:'assets/cat.png',emo:'🐱'}, HAT:{img:'assets/hat.png',emo:'🎩'}, BAT:{img:'assets/bat.png',emo:'🦇'},
    DOG:{img:'assets/dog.png',emo:'🐶'}, FROG:{img:'assets/frog.png',emo:'🐸'},
    SUN:{img:'assets/sun.png',emo:'☀️'}, BUN:{img:'assets/bun.png',emo:'🍔'},
    STAR:{img:'assets/star.png',emo:'⭐'}, CAR:{img:'assets/car.png',emo:'🚗'},
    BEE:{img:'assets/bee.png',emo:'🐝'}, TREE:{img:'assets/tree.png',emo:'🌳'},
    MOUSE:{img:'assets/mouse.png',emo:'🐭'}, HOUSE:{img:'assets/house.png',emo:'🏠'}
  };
  // rhyme pairs (target -> rhyming answer). Distractors picked from other words.
  const ROUNDS = [
    {target:'CAT', rhyme:'HAT'}, {target:'DOG', rhyme:'FROG'},
    {target:'SUN', rhyme:'BUN'}, {target:'STAR', rhyme:'CAR'},
    {target:'BEE', rhyme:'TREE'}, {target:'MOUSE', rhyme:'HOUSE'},
    {target:'BAT', rhyme:'CAT'}
  ];
  const G = mountGame({icon:'🎵', title:'Rhyme Time'});
  let queue=[], idx=0, mistakes=0, correctWord='';
  const TOTAL=5;

  const targetLbl = el('.big-target',{style:'font-size:64px'});
  const playBtn = el('button.btn.big',{onclick:say},'🔊 Say it');
  const choices = el('.row',{style:'gap:18px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'Which picture RHYMES with:'));
  G.body.appendChild(targetLbl);
  G.body.appendChild(playBtn);
  G.body.appendChild(choices);

  function say(){ const w=queue[idx].target; speak(w); flashGood(playBtn); }
  function pictureTile(word){
    const it = ITEMS[word];
    const t = el('.tile',{style:'width:130px;height:130px;flex-direction:column;gap:4px'},[
      imgOrEmoji(it.img, it.emo, 84),
      el('div',{style:'font-size:16px;color:#4a4e73'}, word)
    ]);
    t.addEventListener('pointerdown',()=>guess(word,t));
    return t;
  }
  function newRound(){
    const r = queue[idx];
    correctWord = r.rhyme;
    G.setScore('Word '+(idx+1)+' / '+TOTAL);
    targetLbl.textContent = r.target;
    // build 3 choices: the rhyme + 2 non-rhyming distractors
    const distract = shuffle(Object.keys(ITEMS).filter(w=>w!==r.rhyme && w!==r.target)).slice(0,2);
    clear(choices);
    shuffle([r.rhyme,...distract]).forEach(w=>choices.appendChild(pictureTile(w)));
    setTimeout(say,350);
  }
  function guess(word,node){
    if(word===correctWord){
      flashGood(node); checkBurst(G.body);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else { idx++; setTimeout(newRound,600); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=shuffle(ROUNDS.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('🎵 CAT ↔ 🎩 HAT', start);
})();
