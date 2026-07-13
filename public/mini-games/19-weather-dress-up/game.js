/* =========================================================
   GAME 19 — WEATHER DRESS-UP
   Weather is shown; child drags the RIGHT clothing onto the
   character. Correct items stick; wrong items bounce back.
   Teaches weather/seasons reasoning. 4 weather rounds, each
   needs 2 correct items.
   ASSETS: assets/character.png + clothing item PNGs + weather
   icons (all have emoji fallback).
   ========================================================= */
(function(){
  const WEATHER = [
    {id:'sun',  label:'Sunny', img:'assets/weather-sun.png',  emo:'☀️',
      right:[{n:'Sunglasses',img:'assets/item-sunglasses.png',emo:'🕶️'},{n:'T-shirt',img:'assets/item-tshirt.png',emo:'👕'}]},
    {id:'rain', label:'Rainy', img:'assets/weather-rain.png', emo:'🌧️',
      right:[{n:'Raincoat',img:'assets/item-raincoat.png',emo:'🧥'},{n:'Umbrella',img:'assets/item-umbrella.png',emo:'☂️'}]},
    {id:'snow', label:'Snowy', img:'assets/weather-snow.png', emo:'❄️',
      right:[{n:'Coat',img:'assets/item-coat.png',emo:'🧥'},{n:'Scarf',img:'assets/item-scarf.png',emo:'🧣'}]}
  ];
  // full pool of items (for distractors) — name+emoji+img
  const ALL_ITEMS = [
    {n:'Sunglasses',img:'assets/item-sunglasses.png',emo:'🕶️'},
    {n:'T-shirt',img:'assets/item-tshirt.png',emo:'👕'},
    {n:'Umbrella',img:'assets/item-umbrella.png',emo:'☂️'},
    {n:'Raincoat',img:'assets/item-raincoat.png',emo:'🧥'},
    {n:'Scarf',img:'assets/item-scarf.png',emo:'🧣'},
    {n:'Coat',img:'assets/item-coat.png',emo:'🧥'},
    {n:'Boots',img:'assets/item-boots.png',emo:'🥾'},
    {n:'Hat',img:'assets/item-hat.png',emo:'🧢'}
  ];
  const G = mountGame({icon:'🧥', title:'Weather Dress-Up'});
  let round=0, mistakes=0, need=0, got=0, cur=null;
  const TOTAL=4;

  const prompt = el('.prompt');
  const badge = el('.weather-badge');
  const character = el('.dressup-char');
  const worn = el('.worn'); character.appendChild(worn);
  const charEmoji = el('div',{style:'font-size:150px'},'🧒'); character.appendChild(charEmoji);
  const tray = el('.row',{style:'gap:16px;flex-wrap:wrap;max-width:560px'});

  G.body.appendChild(prompt);
  G.body.appendChild(badge);
  G.body.appendChild(character);
  G.body.appendChild(el('div',{style:'font-size:18px;color:#8a5bff'},'Drag the right clothes onto the child'));
  G.body.appendChild(tray);

  function itemTile(it){
    const t = el('.tile',{style:'width:96px;height:96px;flex-direction:column;gap:2px'},[
      imgOrEmoji(it.img,it.emo,54), el('div',{style:'font-size:13px;color:#4a4e73'},it.n)
    ]);
    t.dataset.name=it.n;
    enableDrag(t, {onDrop:(under)=>{
      const onChar = under && (under===character || character.contains(under));
      if(onChar && cur.right.some(r=>r.n===it.n)){
        // correct clothing
        worn.appendChild(imgOrEmoji(it.img,it.emo,34));
        t.remove(); resetPos(t); got++; flashGood(character); checkBurst(character);
        if(got>=need){
          if(round>=TOTAL){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
          else setTimeout(newRound,650);
        }
      }else{
        if(onChar){ mistakes++; gentleRetry(character); }
        resetPos(t);
      }
    }});
    return t;
  }
  function newRound(){
    round++; cur = WEATHER[(round-1)%WEATHER.length];
    need = cur.right.length; got=0;
    prompt.innerHTML = 'It is <b>'+cur.label+'</b> today';
    clear(badge); badge.appendChild(imgOrEmoji(cur.img,cur.emo,84));
    clear(worn);
    G.setScore('Round '+round+' / '+TOTAL);
    // tray = correct items + 2 distractors from other weathers
    const distract = shuffle(ALL_ITEMS.filter(a=>!cur.right.some(r=>r.n===a.n))).slice(0,2);
    clear(tray);
    shuffle([...cur.right,...distract]).forEach(it=>tray.appendChild(itemTile(it)));
  }
  function start(){ round=0; mistakes=0; newRound(); }

  G.instructions('☀️ ➡️ 🕶️👕   🌧️ ➡️ 🧥☂️', start);
})();
