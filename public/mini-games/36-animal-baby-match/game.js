/* =========================================================
   GAME 36 — ANIMAL BABY MATCH
   An adult animal is shown; child taps its correct baby from
   3 choices. Baby name is shown + spoken. Teaches animal life
   vocabulary. 5 rounds.
   ASSETS: assets/<id>.png adult + assets/<id>-baby.png baby.
   ========================================================= */
(function(){
  const ANIMALS = [
    {id:'cow',   adult:'🐄', baby:'🐮', babyName:'Calf'},
    {id:'dog',   adult:'🐕', baby:'🐶', babyName:'Puppy'},
    {id:'cat',   adult:'🐈', baby:'🐱', babyName:'Kitten'},
    {id:'horse', adult:'🐎', baby:'🐴', babyName:'Foal'},
    {id:'sheep', adult:'🐑', baby:'🐏', babyName:'Lamb'},
    {id:'frog',  adult:'🐸', baby:'🐸', babyName:'Tadpole'},
    {id:'chicken',adult:'🐔', baby:'🐤', babyName:'Chick'}
  ];
  const G = mountGame({icon:'🐣', title:'Animal Baby Match'});
  let queue=[], idx=0, mistakes=0, correct=null;
  const TOTAL=5;

  const adult = el('div',{style:'font-size:130px'});
  const choices = el('.row',{style:'gap:18px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'Find this animal’s baby!'));
  G.body.appendChild(adult);
  G.body.appendChild(choices);

  function babyTile(a){
    const t = el('.tile',{style:'width:130px;height:140px;flex-direction:column;gap:4px'},[
      imgOrEmoji('assets/'+a.id+'-baby.png', a.baby, 84),
      el('div',{style:'font-size:15px;color:#4a4e73'}, a.babyName)
    ]);
    t.addEventListener('pointerdown',()=>guess(a,t));
    return t;
  }
  function newRound(){
    correct = queue[idx];
    G.setScore('Round '+(idx+1)+' / '+TOTAL);
    clear(adult); adult.appendChild(imgOrEmoji('assets/'+correct.id+'.png', correct.adult, 130));
    const others = shuffle(ANIMALS.filter(a=>a.id!==correct.id)).slice(0,2);
    clear(choices);
    shuffle([correct,...others]).forEach(a=>choices.appendChild(babyTile(a)));
    speak('Find the baby');
  }
  function guess(a,node){
    if(a===correct){
      flashGood(node); checkBurst(G.body); speak(correct.babyName);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),600); }
      else { idx++; setTimeout(newRound,700); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=shuffle(ANIMALS.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('🐄 ➡️ 🐮 (Calf)', start);
})();
