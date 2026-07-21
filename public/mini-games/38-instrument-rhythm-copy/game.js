/* =========================================================
   GAME 38 — INSTRUMENT RHYTHM COPY
   The game plays a short pattern on colored xylophone pads
   (each pad = a note tone). Child repeats it by tapping the
   pads in the same order. Teaches rhythm & musical memory.
   Pattern grows 3 -> 5 beats over 5 rounds. Web Audio tones,
   fully offline — no audio files required.
   ASSETS (optional): assets/note-<i>.mp3 to replace tones.
   ========================================================= */
(function(){
  const PADS = [
    {c:'#ff6b6b', f:262, emo:'🔴'},  // C
    {c:'#ffd23f', f:330, emo:'🟡'},  // E
    {c:'#2fbf71', f:392, emo:'🟢'},  // G
    {c:'#4a7bff', f:523, emo:'🔵'}   // C (high)
  ];
  const G = mountGame({icon:'🎶', title:'Rhythm Copy'});
  let round=0, mistakes=0, seq=[], input=[], locked=true;
  const TOTAL=5;

  const status = el('.prompt',null,'Listen…');
  const padsRow = el('.pads');
  const padEls = PADS.map((p,i)=>{
    const pad = el('.pad',{style:`background:${p.c}`}, p.emo);
    pad.addEventListener('pointerdown',()=>tapPad(i));
    padsRow.appendChild(pad);
    return pad;
  });
  const replayBtn = el('button.btn.secondary',{onclick:()=>{ if(locked) return; playSeq(); }},'🔊 Hear again');
  G.body.appendChild(status);
  G.body.appendChild(padsRow);
  G.body.appendChild(replayBtn);

  function hit(i){
    const p=PADS[i];
    // real clip if present, else synth tone
    const a=new Audio('assets/note-'+i+'.mp3');
    a.volume = 1;   // max clip volume
    a.play().catch(()=>tone([p.f],.35));
    padEls[i].classList.add('lit');
    setTimeout(()=>padEls[i].classList.remove('lit'),260);
  }
  function playSeq(){
    locked=true; status.textContent='Listen…';
    seq.forEach((i,k)=>setTimeout(()=>{
      hit(i);
      if(k===seq.length-1) setTimeout(()=>{ locked=false; status.textContent='Now you! 👆'; }, 420);
    }, 600*(k+1)));
  }
  function tapPad(i){
    if(locked) return;
    hit(i); input.push(i);
    const k=input.length-1;
    if(input[k]!==seq[k]){
      mistakes++; gentleRetry(padEls[i]); input=[];
      status.textContent='Try again — listen! 👂';
      setTimeout(playSeq,700); return;
    }
    if(input.length===seq.length){
      locked=true; checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),650); }
      else setTimeout(newRound,700);
    }
  }
  function newRound(){
    round++; input=[];
    const len = 2+round;              // 3,4,5,6,7 beats
    seq = Array.from({length:len},()=>rand(0,PADS.length-1));
    G.setScore('Pattern '+round+' / '+TOTAL);
    setTimeout(playSeq,500);
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('👂 🔴🟡🟢 ➡️ 👆 🔴🟡🟢', start);
})();
