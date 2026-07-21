/* =========================================================
   GAME 24 — TIME TELLING (CLOCK BASICS)
   A CSS analog clock shows a whole hour (e.g. 3:00). Child
   picks the matching digital time from 3 choices. 5 rounds.
   No image assets required (clock is pure CSS).
   ========================================================= */
(function(){
  const G = mountGame({icon:'🕐', title:'Time Telling'});
  let round=0, mistakes=0, hour=3;
  const TOTAL=5;

  const clock = el('.clock');
  const hourHand = el('.hand.hour');
  const minHand  = el('.hand.minute');
  const choices  = el('.row',{style:'gap:16px;margin-top:16px'});
  G.body.appendChild(el('.prompt',null,'What time is it?'));
  G.body.appendChild(clock);
  G.body.appendChild(choices);

  // draw the 12 numbers around the face once
  clock.appendChild(minHand); clock.appendChild(hourHand); clock.appendChild(el('.pin'));
  for(let n=1;n<=12;n++){
    const ang=(n/12)*2*Math.PI, r=88;
    const x=115+Math.sin(ang)*r, y=115-Math.cos(ang)*r;
    clock.appendChild(el('.num',{style:`left:${x}px;top:${y}px`}, n+''));
  }
  function setHands(h){
    minHand.style.transform='rotate(0deg)';           // whole hours => minute at 12
    hourHand.style.transform=`rotate(${(h%12)*30}deg)`;
  }
  const fmt = h => h+':00';
  function newRound(){
    round++; G.setScore('Round '+round+' / '+TOTAL);
    hour = rand(1,12); setHands(hour);
    const opts=new Set([hour]);
    while(opts.size<3) opts.add(rand(1,12));
    clear(choices);
    shuffle([...opts]).forEach(h=>{
      const b=el('button.btn.big',{style:'min-width:120px'}, fmt(h));
      b.addEventListener('pointerdown',()=>guess(h,b));
      choices.appendChild(b);
    });
  }
  function guess(h,node){
    if(h===hour){
      flashGood(node); checkBurst(G.body);
      if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else setTimeout(newRound,600);
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('🕒 ➡️ 3:00', start);
})();
