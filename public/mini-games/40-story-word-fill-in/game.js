/* =========================================================
   GAME 40 — STORY WORD FILL-IN
   A sentence with one blank + a picture hint (also spoken).
   Child picks the missing word from 3 choices. Teaches
   reading comprehension. 5 rounds.
   ASSETS: assets/<id>.png picture hint (emoji fallback).
   ========================================================= */
(function(){
  // pre/post = text around the blank; answer = word; distractors from other rounds
  const SENTENCES = [
    {id:'sun',   pre:'The ',  post:' is yellow.',      answer:'sun',   img:'assets/sun.png',   emo:'☀️'},
    {id:'dog',   pre:'The ',  post:' says woof.',      answer:'dog',   img:'assets/dog.png',   emo:'🐶'},
    {id:'fish',  pre:'The ',  post:' swims in water.', answer:'fish',  img:'assets/fish.png',  emo:'🐟'},
    {id:'apple', pre:'I eat a red ', post:'.',          answer:'apple', img:'assets/apple.png', emo:'🍎'},
    {id:'car',   pre:'The ',  post:' goes fast.',      answer:'car',   img:'assets/car.png',   emo:'🚗'},
    {id:'moon',  pre:'The ',  post:' shines at night.',answer:'moon',  img:'assets/moon.png',  emo:'🌙'},
    {id:'cat',   pre:'The ',  post:' says meow.',      answer:'cat',   img:'assets/cat.png',   emo:'🐱'}
  ];
  const G = mountGame({icon:'📖', title:'Story Word Fill-In'});
  let queue=[], idx=0, mistakes=0, correct=null;
  const TOTAL=5;

  const pic = el('div',{style:'font-size:110px'});
  const sentence = el('.prompt',{style:'font-size:30px;max-width:560px'});
  const sayBtn = el('button.btn.secondary',{onclick:()=>speak(readSentence())},'🔊 Read it');
  const choices = el('.row',{style:'gap:16px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(pic);
  G.body.appendChild(sentence);
  G.body.appendChild(sayBtn);
  G.body.appendChild(choices);

  function readSentence(){ return correct ? correct.pre+correct.answer+correct.post : ''; }
  function renderSentence(fill){
    clear(sentence);
    sentence.appendChild(document.createTextNode(correct.pre));
    const blank = el('span',{style:'display:inline-block;min-width:90px;border-bottom:6px solid #c7ccf5;'
      +'font-weight:bold;color:var(--brand);text-align:center'}, fill||' ');
    sentence.appendChild(blank);
    sentence.appendChild(document.createTextNode(correct.post));
    return blank;
  }
  function newRound(){
    correct = queue[idx];
    G.setScore('Sentence '+(idx+1)+' / '+TOTAL);
    clear(pic); pic.appendChild(imgOrEmoji(correct.img, correct.emo, 120));
    renderSentence('');
    speak(correct.pre+' blank '+correct.post);
    const others = shuffle(SENTENCES.filter(s=>s.id!==correct.id)).slice(0,2).map(s=>s.answer);
    clear(choices);
    shuffle([correct.answer,...others]).forEach(w=>{
      const b=el('button.btn.big',{style:'min-width:130px'}, w);
      b.addEventListener('pointerdown',()=>guess(w,b));
      choices.appendChild(b);
    });
  }
  function guess(w,node){
    if(w===correct.answer){
      flashGood(node); checkBurst(G.body);
      renderSentence(w); speak(readSentence());
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),700); }
      else { idx++; setTimeout(newRound,800); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=shuffle(SENTENCES.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('☀️  The ___ is yellow', start);
})();
