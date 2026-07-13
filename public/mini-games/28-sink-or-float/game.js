/* =========================================================
   GAME 28 — SINK OR FLOAT PREDICTION
   An object is shown above a water tank. Child predicts SINK
   or FLOAT with two big buttons, then watches the object
   animate to the right spot. Teaches buoyancy. 6 rounds.
   ASSETS: assets/<id>.png everyday objects (emoji fallback).
   ========================================================= */
(function(){
  const OBJECTS = [
    {id:'rock',    name:'Rock',    img:'assets/rock.png',    emo:'🪨', floats:false},
    {id:'leaf',    name:'Leaf',    img:'assets/leaf.png',    emo:'🍃', floats:true},
    {id:'ball',    name:'Ball',    img:'assets/ball.png',    emo:'⚽', floats:true},
    {id:'spoon',   name:'Spoon',   img:'assets/spoon.png',   emo:'🥄', floats:false},
    {id:'boat',    name:'Boat',    img:'assets/boat.png',    emo:'⛵', floats:true},
    {id:'key',     name:'Key',     img:'assets/key.png',     emo:'🔑', floats:false},
    {id:'duck',    name:'Duck',    img:'assets/duck.png',    emo:'🦆', floats:true},
    {id:'brick',   name:'Brick',   img:'assets/brick.png',   emo:'🧱', floats:false}
  ];
  const G = mountGame({icon:'💧', title:'Sink or Float'});
  let queue=[], idx=0, mistakes=0, cur=null, busy=false;
  const TOTAL=6;

  const prompt = el('.prompt');
  const tank = el('.tank');
  const water = el('.water');
  const obj = el('.obj');
  tank.appendChild(water); tank.appendChild(obj);
  const btns = el('.row',{style:'gap:18px;margin-top:16px'});
  const floatBtn = el('button.btn.big',{onclick:()=>predict(true)},'🎈 Float');
  const sinkBtn  = el('button.btn.big.secondary',{onclick:()=>predict(false)},'⬇️ Sink');
  btns.appendChild(floatBtn); btns.appendChild(sinkBtn);

  G.body.appendChild(prompt);
  G.body.appendChild(tank);
  G.body.appendChild(btns);

  function newRound(){
    busy=false; cur=queue[idx];
    G.setScore('Object '+(idx+1)+' / '+TOTAL);
    prompt.innerHTML='Will the <b>'+cur.name+'</b> sink or float?';
    obj.className='obj'; obj.style.top='12px';
    clear(obj); obj.appendChild(imgOrEmoji(cur.img,cur.emo,64));
  }
  function predict(guessFloat){
    if(busy) return; busy=true;
    const right = (guessFloat===cur.floats);
    // animate to actual result regardless (shows the truth)
    obj.classList.add(cur.floats?'float':'sink');
    if(right){
      checkBurst(tank);
      setTimeout(()=>{
        if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; G.result(stars,start); }
        else { idx++; newRound(); }
      },1400);
    }else{
      mistakes++; gentleRetry(tank);
      // gentle: still show the truth, then move on so there's no "fail"
      setTimeout(()=>{
        if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; G.result(stars,start); }
        else { idx++; newRound(); }
      },1600);
    }
  }
  function start(){ queue=shuffle(OBJECTS.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('💧 🪨⬇️  🍃🎈', start);
})();
