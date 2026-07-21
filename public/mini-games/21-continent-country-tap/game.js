/* =========================================================
   GAME 21 — CONTINENT / COUNTRY MAP TAP
   A world map is shown. The game names a continent (text +
   spoken); child taps the matching region. 6 prompts/round.
   Tap zones are %-positioned over the map, so they line up
   whether you use the emoji fallback or a real map image.
   Tune the ZONES x/y/w/h to match your art.
   ASSETS: assets/world-map.png (emoji 🗺️ fallback).
   ========================================================= */
(function(){
  // x,y = center %, w,h = size % of the 2:1 map stage
  const ZONES = [
    {id:'north-america', label:'North America', icon:'🍁', x:22, y:33, w:22, h:34},
    {id:'south-america', label:'South America', icon:'🌴', x:31, y:70, w:16, h:34},
    {id:'europe',        label:'Europe',        icon:'🏰', x:50, y:30, w:12, h:16},
    {id:'africa',        label:'Africa',        icon:'🦁', x:52, y:58, w:16, h:34},
    {id:'asia',          label:'Asia',          icon:'🐼', x:70, y:34, w:24, h:34},
    {id:'australia',     label:'Australia',     icon:'🦘', x:82, y:73, w:16, h:22},
    {id:'antarctica',    label:'Antarctica',    icon:'🐧', x:50, y:94, w:60, h:10}
  ];
  const G = mountGame({icon:'🗺️', title:'Continent Tap'});
  let queue=[], idx=0, mistakes=0, target=null;
  const TOTAL=6;

  const prompt = el('.prompt');
  const stage = el('.map-stage');
  G.body.appendChild(prompt);
  G.body.appendChild(stage);

  function buildStage(){
    clear(stage);
    const img = new Image();
    img.src='assets/world-map.png'; img.alt='world map';
    img.onerror=()=>{ img.remove(); stage.appendChild(el('.map-emoji',null,'🗺️')); };
    stage.appendChild(img);
    ZONES.forEach(z=>{
      const zone = el('.map-zone',{style:`left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;`}, z.icon);
      zone.dataset.id=z.id;
      zone.addEventListener('pointerdown',()=>tap(z,zone));
      stage.appendChild(zone);
    });
  }
  function ask(){
    target = queue[idx];
    prompt.innerHTML = 'Find '+target.icon+' <b>'+target.label+'</b>';
    speak('Find '+target.label);
    G.setScore('Place '+(idx+1)+' / '+TOTAL);
  }
  function tap(z,node){
    if(z.id===target.id){
      node.classList.add('hit'); checkBurst(stage);
      setTimeout(()=>node.classList.remove('hit'),500);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else { idx++; setTimeout(ask,650); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=shuffle(ZONES.slice()).slice(0,TOTAL); idx=0; mistakes=0; buildStage(); ask(); }

  G.instructions('🗺️ 👆 "Find Africa" 🦁', start);
})();
