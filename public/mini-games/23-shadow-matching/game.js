/* =========================================================
   GAME 23 — SHADOW MATCHING
   A colored object is shown; child taps its matching black
   silhouette from 3 choices. Teaches shape/visual reasoning.
   5 rounds. The shadow is the same art with a brightness(0)
   filter, so the emoji fallback ALSO produces a real
   silhouette — and a dedicated shadow PNG can override it.
   ASSETS: assets/<id>.png (color) + assets/<id>-shadow.png.
   ========================================================= */
(function(){
  const OBJECTS = [
    {id:'cat',  emo:'🐱', img:'assets/cat.png',  shadow:'assets/cat-shadow.png'},
    {id:'car',  emo:'🚗', img:'assets/car.png',  shadow:'assets/car-shadow.png'},
    {id:'tree', emo:'🌳', img:'assets/tree.png', shadow:'assets/tree-shadow.png'},
    {id:'star', emo:'⭐', img:'assets/star.png', shadow:'assets/star-shadow.png'},
    {id:'duck', emo:'🦆', img:'assets/duck.png', shadow:'assets/duck-shadow.png'},
    {id:'house',emo:'🏠', img:'assets/house.png',shadow:'assets/house-shadow.png'},
    {id:'fish', emo:'🐟', img:'assets/fish.png', shadow:'assets/fish-shadow.png'},
    {id:'boat', emo:'⛵', img:'assets/boat.png', shadow:'assets/boat-shadow.png'}
  ];
  const G = mountGame({icon:'🌑', title:'Shadow Matching'});
  let queue=[], idx=0, mistakes=0, correct=null;
  const TOTAL=5;

  const object = el('div',{style:'font-size:120px'});
  const choices = el('.row',{style:'gap:18px;flex-wrap:wrap;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'Which shadow matches?'));
  G.body.appendChild(object);
  G.body.appendChild(choices);

  function shadowTile(o){
    const t = el('.tile',{style:'width:130px;height:130px;background:#eef0ff'});
    const view = imgOrEmoji(o.shadow, o.emo, 84); // real shadow PNG if present
    view.classList.add('shadow-view');            // else emoji -> brightness(0)
    t.appendChild(view);
    t.addEventListener('pointerdown',()=>guess(o,t));
    return t;
  }
  function newRound(){
    const opts = shuffle(OBJECTS.slice()).slice(0,3);
    correct = pick(opts);
    G.setScore('Round '+(idx+1)+' / '+TOTAL);
    clear(object); object.appendChild(imgOrEmoji(correct.img, correct.emo, 130));
    clear(choices);
    shuffle(opts).forEach(o=>choices.appendChild(shadowTile(o)));
  }
  function guess(o,node){
    if(o===correct){
      flashGood(node); checkBurst(G.body);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else { idx++; setTimeout(newRound,600); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=OBJECTS.slice(); idx=0; mistakes=0; newRound(); }

  G.instructions('🐱 ➡️ 🌑', start);
})();
