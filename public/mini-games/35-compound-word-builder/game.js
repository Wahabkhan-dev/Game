/* =========================================================
   GAME 35 — COMPOUND WORD BUILDER
   Two empty slots + a picture of the finished word. Drag the
   correct first-half and second-half word tiles into the
   slots to build the compound word. Teaches vocabulary.
   5 rounds. Picture confirms the answer.
   ASSETS: assets/<compound>.png picture (emoji fallback).
   ========================================================= */
(function(){
  const WORDS = [
    {a:'sun',   b:'flower', img:'assets/sunflower.png',  emo:'🌻'},
    {a:'rain',  b:'bow',    img:'assets/rainbow.png',    emo:'🌈'},
    {a:'foot',  b:'ball',   img:'assets/football.png',   emo:'⚽'},
    {a:'snow',  b:'man',    img:'assets/snowman.png',    emo:'⛄'},
    {a:'star',  b:'fish',   img:'assets/starfish.png',   emo:'⭐'},
    {a:'butter',b:'fly',    img:'assets/butterfly.png',  emo:'🦋'},
    {a:'cup',   b:'cake',   img:'assets/cupcake.png',    emo:'🧁'},
    {a:'tooth', b:'brush',  img:'assets/toothbrush.png', emo:'🪥'}
  ];
  const G = mountGame({icon:'🔗', title:'Compound Words'});
  let queue=[], idx=0, mistakes=0, cur=null, placed=0;
  const TOTAL=5;

  const pic = el('div',{style:'font-size:110px'});
  const slotA = el('.dropzone',{style:'width:150px;height:80px;font-size:26px;font-weight:bold'});
  const slotB = el('.dropzone',{style:'width:150px;height:80px;font-size:26px;font-weight:bold'});
  slotA.dataset.want='a'; slotB.dataset.want='b';
  const slotRow = el('.row',{style:'gap:10px;align-items:center;font-size:34px'},[slotA, el('div',null,'+'), slotB]);
  const tray = el('.row',{style:'gap:12px;flex-wrap:wrap;margin-top:14px;max-width:600px'});
  G.body.appendChild(el('.prompt',null,'Build the word for this picture!'));
  G.body.appendChild(pic);
  G.body.appendChild(slotRow);
  G.body.appendChild(tray);

  function halfTile(text, role){
    const t = el('.tile',{style:'width:130px;height:72px;font-size:24px;font-weight:bold;color:var(--brand)'}, text);
    t.dataset.role=role; // 'a' | 'b' | 'x' (distractor)
    enableDrag(t,{onDrop:(under)=>{
      const slot = under && under.closest ? under.closest('.dropzone') : null;
      if(slot && !slot.dataset.filled && slot.dataset.want===role){
        slot.dataset.filled='1'; slot.textContent=text; slot.classList.add('flash-good');
        t.remove(); resetPos(t); placed++;
        if(placed>=2){
          checkBurst(G.body);
          if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
          else { idx++; setTimeout(newRound,650); }
        }
      }else{ if(slot){ mistakes++; gentleRetry(slot); } resetPos(t); }
    }});
    return t;
  }
  function newRound(){
    cur = queue[idx]; placed=0;
    G.setScore('Word '+(idx+1)+' / '+TOTAL);
    clear(pic); pic.appendChild(imgOrEmoji(cur.img, cur.emo, 120));
    slotA.textContent=''; slotB.textContent=''; delete slotA.dataset.filled; delete slotB.dataset.filled;
    // tiles: correct a + correct b + 2 distractor halves from other words
    const others = shuffle(WORDS.filter(w=>w!==cur));
    const distract = [others[0].a, others[1].b];
    clear(tray);
    const tiles = shuffle([
      halfTile(cur.a,'a'), halfTile(cur.b,'b'),
      halfTile(distract[0],'x'), halfTile(distract[1],'x')
    ]);
    tiles.forEach(t=>tray.appendChild(t));
  }
  function start(){ queue=shuffle(WORDS.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('sun + flower ➡️ 🌻', start);
})();
