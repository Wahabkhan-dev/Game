/* =========================================================
   GAME 03 — SHAPE SORTER
   Drag each shape into its matching outline slot.
   Teaches shape recognition. 1 board = 1 round.
   No image assets required (shapes are emoji).
   ========================================================= */
(function(){
  const SHAPES = [
    {id:'circle',   emoji:'🔵', outline:'⭕'},
    {id:'square',   emoji:'🟦', outline:'⬜'},
    {id:'triangle', emoji:'🔺', outline:'🔻'},
    {id:'star',     emoji:'⭐', outline:'✩'}
  ];
  const G = mountGame({icon:'⭐', title:'Shape Sorter'});

  let mistakes=0, placed=0;
  const slotsRow = el('.row',{style:'gap:22px;flex-wrap:wrap;'});
  const traysRow = el('.row',{style:'gap:22px;flex-wrap:wrap;margin-top:10px;'});
  G.body.appendChild(el('.prompt',null,'Drag each shape to its matching outline'));
  G.body.appendChild(slotsRow);
  G.body.appendChild(el('div',{style:'height:2px;width:80%;background:#eef0fb;margin:8px 0'}));
  G.body.appendChild(traysRow);

  function build(){
    mistakes=0; placed=0; clear(slotsRow); clear(traysRow);
    G.setScore('Placed 0 / '+SHAPES.length);
    SHAPES.forEach(s=>{
      const slot = el('.dropzone', {style:'width:110px;height:110px;font-size:60px;'}, s.outline);
      slot.dataset.want=s.id; slotsRow.appendChild(slot);
    });
    shuffle(SHAPES.slice()).forEach(s=>{
      const t = el('.tile', {style:'width:100px;height:100px;font-size:60px;'}, s.emoji);
      t.dataset.id=s.id;
      enableDrag(t, {onDrop:(under)=>{
        const slot = under && under.closest ? under.closest('.dropzone') : null;
        if(slot && slot.dataset.want===s.id && !slot.dataset.filled){
          slot.dataset.filled='1'; slot.textContent=s.emoji; slot.classList.add('flash-good');
          t.remove(); resetPos(t);
          placed++; G.setScore('Placed '+placed+' / '+SHAPES.length); checkBurst(G.body);
          if(placed>=SHAPES.length){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,build),450); }
        }else{ if(slot){ mistakes++; gentleRetry(slot); } resetPos(t); }
      }});
      traysRow.appendChild(t);
    });
  }

  G.instructions('🔷➡️⬜', build);
})();
