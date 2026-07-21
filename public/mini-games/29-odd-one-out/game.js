/* =========================================================
   GAME 29 — ODD ONE OUT
   Four pictures: 3 belong to one group + 1 that doesn't.
   Child taps the one that doesn't belong. Teaches
   categorization/logic. 5 rounds from a rotating library.
   Each SET: group[] (3+ related) + odd (unrelated). Items are
   {emo, img} so real art can override the emoji later.
   ASSETS: optional assets/<name>.png (emoji fallback).
   ========================================================= */
(function(){
  // Helper to make an item with matching placeholder path from emoji name.
  function it(emo,name){ return {emo, img:'assets/'+name+'.png', name}; }
  const SETS = [
    {group:[it('🐶','dog'),it('🐱','cat'),it('🐰','rabbit')], odd:it('🚗','car')},
    {group:[it('🍎','apple'),it('🍌','banana'),it('🍇','grapes')], odd:it('🐟','fish')},
    {group:[it('🚗','car'),it('🚌','bus'),it('🚲','bike')], odd:it('🍎','apple')},
    {group:[it('⭐','star'),it('🌙','moon'),it('☀️','sun')], odd:it('🐶','dog')},
    {group:[it('🐟','fish'),it('🐙','octopus'),it('🦀','crab')], odd:it('🐦','bird')},
    {group:[it('🔴','red'),it('🟢','green'),it('🟡','yellow')], odd:it('🍕','pizza')},
    {group:[it('🌳','tree'),it('🌸','flower'),it('🌵','cactus')], odd:it('🚀','rocket')}
  ];
  const G = mountGame({icon:'🔍', title:'Odd One Out'});
  let queue=[], idx=0, mistakes=0, oddItem=null;
  const TOTAL=5;

  const grid = el('div',{style:'display:grid;grid-template-columns:repeat(2,140px);gap:18px'});
  G.body.appendChild(el('.prompt',null,'Which one does NOT belong?'));
  G.body.appendChild(grid);

  function tileFor(item){
    const t = el('.tile',{style:'width:140px;height:140px'},[imgOrEmoji(item.img,item.emo,84)]);
    t.addEventListener('pointerdown',()=>guess(item,t));
    return t;
  }
  function newRound(){
    const set = queue[idx];
    oddItem = set.odd;
    G.setScore('Round '+(idx+1)+' / '+TOTAL);
    const items = shuffle([...set.group.slice(0,3), set.odd]);
    clear(grid);
    items.forEach(i=>grid.appendChild(tileFor(i)));
  }
  function guess(item,node){
    if(item===oddItem){
      flashGood(node); checkBurst(G.body);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else { idx++; setTimeout(newRound,600); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=shuffle(SETS.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('🐶🐱🐰🚗 ➡️ 👆🚗', start);
})();
