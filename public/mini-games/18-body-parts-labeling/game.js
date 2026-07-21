/* =========================================================
   GAME 18 — BODY PARTS LABELING
   A cartoon character is shown. The game names a body part
   (text + spoken). Child taps the matching zone. Teaches
   anatomy basics. 6 prompts per round.
   Tap zones are %-positioned over the character, so they line
   up whether you use the emoji fallback or a real character
   image (assets/character.png). Adjust ZONES to match your art.
   ASSETS: assets/character.png (emoji 🧍 fallback).
   ========================================================= */
(function(){
  // x,y = center %, w,h = size % of the 280x520 stage.
  const ZONES = [
    {id:'head',    label:'Head',      icon:'🧠', x:50, y:14, w:42, h:16},
    {id:'eyes',    label:'Eyes',      icon:'👀', x:50, y:12, w:30, h:8},
    {id:'nose',    label:'Nose',      icon:'👃', x:50, y:17, w:14, h:7},
    {id:'mouth',   label:'Mouth',     icon:'👄', x:50, y:21, w:20, h:6},
    {id:'tummy',   label:'Tummy',     icon:'🫃', x:50, y:48, w:36, h:16},
    {id:'hands',   label:'Hands',     icon:'✋', x:15, y:50, w:20, h:12},
    {id:'legs',    label:'Legs',      icon:'🦵', x:50, y:74, w:34, h:16},
    {id:'feet',    label:'Feet',      icon:'🦶', x:50, y:92, w:34, h:10}
  ];
  const G = mountGame({icon:'🧍', title:'Body Parts'});
  let queue=[], idx=0, mistakes=0, target=null;
  const TOTAL=6;

  const prompt = el('.prompt');
  const stage = el('.char-stage');
  G.body.appendChild(prompt);
  G.body.appendChild(stage);

  function buildStage(){
    clear(stage);
    // character: real image if present, else big emoji
    const img = new Image();
    img.src='assets/character.png'; img.alt='character';
    img.onerror=()=>{ img.remove(); stage.appendChild(el('.char-emoji',null,'🧍')); };
    stage.appendChild(img);
    // tap zones
    ZONES.forEach(z=>{
      const zone = el('.zone',{style:
        `left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;`});
      zone.dataset.id=z.id;
      zone.addEventListener('pointerdown',()=>tap(z,zone));
      stage.appendChild(zone);
    });
  }
  function ask(){
    target = queue[idx];
    prompt.innerHTML = 'Touch the '+target.icon+' <b>'+target.label+'</b>';
    speak('Touch the '+target.label);
    G.setScore('Part '+(idx+1)+' / '+TOTAL);
  }
  function tap(z,node){
    if(z.id===target.id){
      node.classList.add('hit'); checkBurst(stage);
      setTimeout(()=>node.classList.remove('hit'),500);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else { idx++; setTimeout(ask,650); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){
    // 6 distinct parts per round
    queue = shuffle(ZONES.slice()).slice(0,TOTAL);
    idx=0; mistakes=0; buildStage(); ask();
  }

  G.instructions('👂 "Touch the nose" 👃', start);
})();
