/* =========================================================
   GAME 20 — MUSICAL INSTRUMENT MATCH
   Press play to hear an instrument; child taps the matching
   picture from 4 choices. Teaches sound recognition. 5 rounds.
   Sound now = Web Audio tone stand-in (offline). Swap in real
   clips later via assets/<id>.mp3.
   ASSETS: assets/<id>.png images (emoji fallback).
   AUDIO : optional assets/<id>.mp3 clips.
   ========================================================= */
(function(){
  // id, name, image, emoji, and a tone signature (freqs, dur)
  const INSTR = [
    {id:'drum',    name:'Drum',    img:'assets/drum.png',    emo:'🥁', freqs:[110,80], dur:.25},
    {id:'guitar',  name:'Guitar',  img:'assets/guitar.png',  emo:'🎸', freqs:[196,247,330], dur:.5},
    {id:'piano',   name:'Piano',   img:'assets/piano.png',   emo:'🎹', freqs:[262,330,392], dur:.5},
    {id:'trumpet', name:'Trumpet', img:'assets/trumpet.png', emo:'🎺', freqs:[466,587], dur:.5},
    {id:'violin',  name:'Violin',  img:'assets/violin.png',  emo:'🎻', freqs:[392,494], dur:.6}
  ];
  const G = mountGame({icon:'🥁', title:'Instrument Match'});
  let round=0, mistakes=0, correct=null;
  const TOTAL=5;

  const playBtn = el('button.btn.big',{onclick:play},'🔊 Play Sound');
  const choices = el('.row',{style:'gap:18px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'Which instrument made that sound?'));
  G.body.appendChild(playBtn);
  G.body.appendChild(choices);

  function play(){
    if(!correct) return;
    // Try a real clip first; if missing, use the tone stand-in.
    const audio = new Audio('assets/'+correct.id+'.mp3');
    audio.volume = 1;   // max clip volume
    audio.play().catch(()=>tone(correct.freqs, correct.dur));
    flashGood(playBtn);
  }
  function tile(inst){
    const t = el('.tile',{style:'width:130px;height:130px;flex-direction:column;gap:4px'},[
      imgOrEmoji(inst.img, inst.emo, 80), el('div',{style:'font-size:15px;color:#4a4e73'},inst.name)
    ]);
    t.addEventListener('pointerdown',()=>guess(inst,t));
    return t;
  }
  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    const opts = shuffle(INSTR.slice()).slice(0,4);
    correct = pick(opts);
    clear(choices);
    shuffle(opts).forEach(o=>choices.appendChild(tile(o)));
    setTimeout(play,350);
  }
  function guess(inst,node){
    if(inst===correct){
      flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🔊 ❓ 🥁 🎸 🎹 🎺', start);
})();
