/* =========================================================
   GAME 11 — MISSING LETTER FILL
   Word with one letter blanked (C_T). Picture hint confirms
   the word. Tap the correct letter from 3 choices. 5 rounds.
   Uses shared engine (buildGame/mountGame, imgOrEmoji, etc.)
   ASSETS (emoji fallback until added): assets/<word>.png
   ========================================================= */
(function(){
  // word, picture path, emoji fallback
  const WORDS = [
    {w:'CAT', img:'assets/cat.png', emo:'🐱'},
    {w:'DOG', img:'assets/dog.png', emo:'🐶'},
    {w:'SUN', img:'assets/sun.png', emo:'☀️'},
    {w:'BUS', img:'assets/bus.png', emo:'🚌'},
    {w:'HAT', img:'assets/hat.png', emo:'🎩'},
    {w:'PIG', img:'assets/pig.png', emo:'🐷'},
    {w:'BEE', img:'assets/bee.png', emo:'🐝'},
    {w:'CAR', img:'assets/car.png', emo:'🚗'}
  ];
  const ALPHA='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const G = mountGame({icon:'🔤', title:'Missing Letter Fill'});
  let queue=[], idx=0, mistakes=0, answer='', blankPos=0, cur=null;
  const TOTAL=5;

  const hint = el('div',{style:'font-size:110px'});
  const wordRow = el('.row',{style:'gap:8px;font-size:72px;font-weight:bold;color:#4a4e73'});
  const choices = el('.row',{style:'gap:16px;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'Which letter is missing?'));
  G.body.appendChild(hint);
  G.body.appendChild(wordRow);
  G.body.appendChild(choices);

  function newRound(){
    cur = queue[idx];
    G.setScore('Word '+(idx+1)+' / '+TOTAL);
    clear(hint); hint.appendChild(imgOrEmoji(cur.img, cur.emo, 120));
    blankPos = rand(0, cur.w.length-1);
    answer = cur.w[blankPos];
    // render word with a blank slot
    clear(wordRow);
    cur.w.split('').forEach((ch,i)=>{
      wordRow.appendChild(el('div',{style:i===blankPos?
        'min-width:56px;border-bottom:8px solid #c7ccf5':''}, i===blankPos?' ':ch));
    });
    // 3 choices: answer + 2 distractors
    const opts = [answer];
    while(opts.length<3){ const c=pick(ALPHA); if(!opts.includes(c)) opts.push(c); }
    clear(choices);
    shuffle(opts).forEach(c=>{
      const t = el('.tile',{style:'width:90px;height:90px;font-size:48px;color:var(--brand)'}, c);
      t.addEventListener('pointerdown',()=>guess(c,t));
      choices.appendChild(t);
    });
  }
  function guess(c,node){
    if(c===answer){
      flashGood(node); checkBurst(G.body);
      // fill the blank visibly
      wordRow.children[blankPos].textContent=c;
      wordRow.children[blankPos].style.borderBottom='';
      if(idx>=TOTAL-1){
        const stars = mistakes===0?3:mistakes<=2?2:1;
        setTimeout(()=>G.result(stars,start),550);
      }else{ idx++; setTimeout(newRound,650); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=shuffle(WORDS.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('🐱  C _ T  ➡️  A', start);
})();
