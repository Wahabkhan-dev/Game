/* =========================================================
   GAME 05 — WORD BUILDER
   Drag scattered letters into order to spell the pictured
   word. Teaches spelling/phonics. 5 words per game.
   Picture hints are emoji (no image assets required).
   ========================================================= */
(function(){
  const WORDS = [
    {w:'CAT',pic:'🐱'},{w:'DOG',pic:'🐶'},{w:'SUN',pic:'☀️'},
    {w:'BUS',pic:'🚌'},{w:'CAKE',pic:'🍰'},{w:'STAR',pic:'⭐'},
    {w:'FISH',pic:'🐟'},{w:'FROG',pic:'🐸'},{w:'BALL',pic:'⚽'}
  ];
  const G = mountGame({icon:'🔡', title:'Word Builder'});

  let queue=[], idx=0, mistakes=0, cur=null;
  const TOTAL=5;
  const pic = el('div',{style:'font-size:110px;line-height:1'});
  const slots = el('.row',{style:'gap:10px;'});
  const tray = el('.row',{style:'gap:10px;flex-wrap:wrap;margin-top:6px;'});
  G.body.appendChild(el('.prompt',null,'Spell the word!'));
  G.body.appendChild(pic);
  G.body.appendChild(slots);
  G.body.appendChild(el('div',{style:'height:2px;width:70%;background:#eef0fb;margin:6px 0'}));
  G.body.appendChild(tray);

  function newWord(){
    cur = queue[idx];
    pic.textContent = cur.pic;
    G.setScore('Word '+(idx+1)+' / '+TOTAL);
    clear(slots); clear(tray);
    cur.w.split('').forEach((ch,i)=>{
      const s = el('.dropzone',{style:'width:80px;height:90px;font-size:48px;font-weight:bold;'});
      s.dataset.want=ch; s.dataset.pos=i; slots.appendChild(s);
    });
    let letters = shuffle(cur.w.split(''));
    if(letters.join('')===cur.w && cur.w.length>1) letters = shuffle(letters);
    letters.forEach(ch=>{
      const t = el('.tile',{style:'width:80px;height:90px;font-size:48px;font-weight:bold;color:var(--brand)'}, ch);
      t.dataset.ch=ch;
      enableDrag(t, {onDrop:(under)=>{
        const slot = under && under.closest ? under.closest('.dropzone') : null;
        if(slot && !slot.dataset.filled && slot.dataset.want===ch){
          slot.dataset.filled='1'; slot.textContent=ch; slot.classList.add('flash-good');
          t.remove(); resetPos(t); checkDone();
        }else{ if(slot){ mistakes++; gentleRetry(slot); } resetPos(t); }
      }});
      tray.appendChild(t);
    });
  }
  function checkDone(){
    const filled = slots.querySelectorAll('.dropzone[data-filled]').length;
    if(filled===cur.w.length){
      checkBurst(G.body);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=3?2:1; setTimeout(()=>G.result(stars,start),500); }
      else { idx++; setTimeout(newWord,550); }
    }
  }
  function start(){ queue = shuffle(WORDS.slice()).slice(0,TOTAL); idx=0; mistakes=0; newWord(); }

  G.instructions('🔡➡️🐱', start);
})();
