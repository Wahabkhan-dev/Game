/* =========================================================
   GAME 16 — PLANT GROWTH SEQUENCE
   Drag the 4 plant-stage pictures into the correct order:
   seed -> sprout -> small plant -> flower. Teaches life
   cycles. Ordered slots 1..4; wrong slot = gentle retry.
   ASSETS: assets/plant-<stage>.png (emoji fallback).
   ========================================================= */
(function(){
  const STAGES = [
    {id:0, name:'Seed',   img:'assets/plant-seed.png',   emo:'🌰'},
    {id:1, name:'Sprout', img:'assets/plant-sprout.png', emo:'🌱'},
    {id:2, name:'Plant',  img:'assets/plant-small.png',  emo:'🪴'},
    {id:3, name:'Flower', img:'assets/plant-flower.png', emo:'🌸'}
  ];
  const G = mountGame({icon:'🌱', title:'Plant Growth'});
  let mistakes=0, placed=0;

  const slots = el('.row',{style:'gap:16px;flex-wrap:wrap;justify-content:center'});
  const tray  = el('.row',{style:'gap:16px;flex-wrap:wrap;justify-content:center;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'How does a plant grow? Put them in order!'));
  G.body.appendChild(slots);
  G.body.appendChild(el('div',{style:'height:2px;width:75%;background:#eef0fb;margin:6px 0'}));
  G.body.appendChild(tray);

  function stageTile(s){
    const t = el('.tile',{style:'width:120px;height:130px;flex-direction:column;gap:4px'},[
      imgOrEmoji(s.img, s.emo, 80), el('div',{style:'font-size:15px;color:#4a4e73'},s.name)
    ]);
    t.dataset.id=s.id; return t;
  }
  function build(){
    mistakes=0; placed=0; G.setScore('Placed 0 / 4');
    clear(slots); clear(tray);
    STAGES.forEach((s,i)=>{
      const slot = el('.dropzone',{style:'width:120px;height:130px;font-size:40px;flex-direction:column'},
        [el('div',{style:'font-size:22px;color:var(--brand)'},'#'+(i+1))]);
      slot.dataset.pos=i; slots.appendChild(slot);
    });
    shuffle(STAGES.slice()).forEach(s=>{
      const t = stageTile(s);
      enableDrag(t, {onDrop:(under)=>{
        const slot = under && under.closest ? under.closest('.dropzone') : null;
        if(slot && !slot.dataset.filled && (+slot.dataset.pos)===s.id){
          slot.dataset.filled='1'; clear(slot); slot.appendChild(stageTile(s)); slot.classList.add('flash-good');
          t.remove(); resetPos(t);
          placed++; G.setScore('Placed '+placed+' / 4'); checkBurst(G.body);
          if(placed>=4){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,build),500); }
        }else{ if(slot){ mistakes++; gentleRetry(slot); } resetPos(t); }
      }});
      tray.appendChild(t);
    });
  }

  G.instructions('🌰 → 🌱 → 🪴 → 🌸', build);
})();
