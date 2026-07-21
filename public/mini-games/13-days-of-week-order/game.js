/* =========================================================
   GAME 13 — DAYS OF THE WEEK ORDER
   The first day is placed for you; drag the remaining day
   cards into the empty slots in correct order. Teaches
   calendar sequencing. Text cards + small icon per day.
   No image assets required.
   ========================================================= */
(function(){
  const DAYS = [
    {n:'Monday',   i:'🌅'},{n:'Tuesday', i:'☕'},{n:'Wednesday',i:'🐫'},
    {n:'Thursday', i:'🌤️'},{n:'Friday',  i:'🎉'},{n:'Saturday', i:'⚽'},
    {n:'Sunday',   i:'😴'}
  ];
  const G = mountGame({icon:'📅', title:'Days of the Week'});
  let mistakes=0, placed=0, nextIndex=1;

  const slots = el('.row',{style:'gap:10px;flex-wrap:wrap;justify-content:center'});
  const tray  = el('.row',{style:'gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px'});
  G.body.appendChild(el('.prompt',null,'Put the days in order! Monday is first.'));
  G.body.appendChild(slots);
  G.body.appendChild(el('div',{style:'height:2px;width:75%;background:#eef0fb;margin:6px 0'}));
  G.body.appendChild(tray);

  function dayCard(d, drag){
    const c = el('.tile',{style:'width:130px;height:96px;flex-direction:column;gap:4px;font-size:18px;'+(drag?'':'cursor:default')},[
      el('div',{style:'font-size:34px'},d.i),
      el('div',null,d.n)
    ]);
    c.dataset.name=d.n;
    return c;
  }
  function build(){
    mistakes=0; placed=0; nextIndex=1;
    G.setScore('Placed 1 / 7');
    clear(slots); clear(tray);
    // 7 slots; slot 0 pre-filled with Monday
    DAYS.forEach((d,i)=>{
      if(i===0){
        const filled = dayCard(d,false); filled.style.borderColor='var(--good)';
        slots.appendChild(el('div',{style:'display:flex'},[filled]));
      }else{
        const s = el('.dropzone',{style:'width:130px;height:96px;font-size:16px'}, (i+1)+'');
        s.dataset.pos=i; slots.appendChild(s);
      }
    });
    // draggable cards for days 2..7, shuffled
    shuffle(DAYS.slice(1)).forEach(d=>{
      const c = dayCard(d,true);
      enableDrag(c, {onDrop:(under)=>{
        const slot = under && under.closest ? under.closest('.dropzone') : null;
        const wantPos = DAYS.findIndex(x=>x.n===d.n); // correct index
        if(slot && !slot.dataset.filled && (+slot.dataset.pos)===wantPos){
          slot.dataset.filled='1'; slot.textContent=''; slot.classList.add('flash-good');
          slot.appendChild(dayCard(d,false));
          c.remove(); resetPos(c);
          placed++; G.setScore('Placed '+(placed+1)+' / 7'); checkBurst(G.body);
          if(placed>=6){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,build),500); }
        }else{ if(slot){ mistakes++; gentleRetry(slot); } resetPos(c); }
      }});
      tray.appendChild(c);
    });
  }

  G.instructions('📅 Mon → Tue → Wed …', build);
})();
