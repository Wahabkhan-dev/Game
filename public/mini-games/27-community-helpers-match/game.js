/* =========================================================
   GAME 27 — COMMUNITY HELPERS MATCH
   A worker is shown; child taps the tool/workplace that goes
   with them, from 3 choices. Teaches social studies basics.
   5 rounds.
   ASSETS: assets/<worker>.png + assets/<tool>.png (emoji fallback).
   ========================================================= */
(function(){
  const HELPERS = [
    {id:'firefighter', name:'Firefighter', wimg:'assets/firefighter.png', wemo:'🧑‍🚒',
      tool:{id:'firetruck', timg:'assets/firetruck.png', temo:'🚒'}},
    {id:'doctor', name:'Doctor', wimg:'assets/doctor.png', wemo:'🧑‍⚕️',
      tool:{id:'stethoscope', timg:'assets/stethoscope.png', temo:'🩺'}},
    {id:'teacher', name:'Teacher', wimg:'assets/teacher.png', wemo:'🧑‍🏫',
      tool:{id:'books', timg:'assets/books.png', temo:'📚'}},
    {id:'police', name:'Police Officer', wimg:'assets/police.png', wemo:'👮',
      tool:{id:'policecar', timg:'assets/policecar.png', temo:'🚓'}},
    {id:'chef', name:'Chef', wimg:'assets/chef.png', wemo:'🧑‍🍳',
      tool:{id:'cooking', timg:'assets/cooking.png', temo:'🍳'}},
    {id:'farmer', name:'Farmer', wimg:'assets/farmer.png', wemo:'🧑‍🌾',
      tool:{id:'tractor', timg:'assets/tractor.png', temo:'🚜'}}
  ];
  const G = mountGame({icon:'👷', title:'Community Helpers'});
  let queue=[], idx=0, mistakes=0, correct=null;
  const TOTAL=5;

  const worker = el('div',{style:'display:flex;flex-direction:column;align-items:center;gap:4px'});
  const choices = el('.row',{style:'gap:18px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'What does this helper use?'));
  G.body.appendChild(worker);
  G.body.appendChild(choices);

  function toolTile(h){
    const t = el('.tile',{style:'width:130px;height:130px'},[imgOrEmoji(h.tool.timg,h.tool.temo,84)]);
    t.addEventListener('pointerdown',()=>guess(h,t));
    return t;
  }
  function newRound(){
    correct = queue[idx];
    G.setScore('Round '+(idx+1)+' / '+TOTAL);
    clear(worker);
    worker.appendChild(imgOrEmoji(correct.wimg,correct.wemo,120));
    worker.appendChild(el('div',{style:'font-size:20px;font-weight:bold;color:#4a4e73'}, correct.name));
    speak(correct.name);
    // choices = correct tool + 2 other tools
    const others = shuffle(HELPERS.filter(h=>h.id!==correct.id)).slice(0,2);
    clear(choices);
    shuffle([correct,...others]).forEach(h=>choices.appendChild(toolTile(h)));
  }
  function guess(h,node){
    if(h===correct){
      flashGood(node); checkBurst(G.body);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else { idx++; setTimeout(newRound,600); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=shuffle(HELPERS.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('🧑‍🚒 ➡️ 🚒', start);
})();
