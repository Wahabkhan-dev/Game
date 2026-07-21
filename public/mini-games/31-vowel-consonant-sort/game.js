/* =========================================================
   GAME 31 — VOWEL vs CONSONANT SORT
   Drag letters into the "Vowel" or "Consonant" bin.
   Teaches phonics fundamentals. 1 board of 6 letters = round.
   No image assets required (letters are CSS tiles).
   ========================================================= */
(function(){
  const VOWELS = 'AEIOU'.split('');
  const CONS   = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
  const G = mountGame({icon:'🔠', title:'Vowel or Consonant'});
  let mistakes=0, sorted=0, need=0;

  const vowelBin = el('.dropzone',{style:'width:220px;min-height:140px;flex-wrap:wrap;gap:6px;padding:12px;align-content:flex-start'});
  const consBin  = el('.dropzone',{style:'width:220px;min-height:140px;flex-wrap:wrap;gap:6px;padding:12px;align-content:flex-start'});
  vowelBin.dataset.cat='vowel'; consBin.dataset.cat='cons';
  const tray = el('.row',{style:'gap:12px;flex-wrap:wrap;max-width:600px;margin-top:14px'});

  G.body.appendChild(el('.prompt',null,'Sort each letter into the right bin!'));
  G.body.appendChild(el('.row',{style:'gap:40px;align-items:flex-start;flex-wrap:wrap;justify-content:center'},[
    el('div',null,[el('div',{style:'font-size:22px;margin-bottom:6px;color:var(--good)'},'🅰️ Vowel'), vowelBin]),
    el('div',null,[el('div',{style:'font-size:22px;margin-bottom:6px;color:var(--brand2)'},'🅱️ Consonant'), consBin])
  ]));
  G.body.appendChild(tray);

  function letterTile(ch){
    const cat = VOWELS.includes(ch) ? 'vowel' : 'cons';
    const t = el('.tile',{style:'width:74px;height:80px;font-size:44px;font-weight:bold;color:var(--brand)'}, ch);
    enableDrag(t,{onDrop:(under)=>{
      const bin = under && under.closest ? under.closest('.dropzone') : null;
      if(bin && bin.dataset.cat===cat){
        const tag = el('div',{style:'font-size:30px;font-weight:bold;color:'+(cat==='vowel'?'var(--good)':'var(--brand2)')}, ch);
        bin.appendChild(tag); t.remove(); resetPos(t);
        sorted++; G.setScore('Sorted '+sorted+' / '+need); checkBurst(bin); flashGood(bin);
        if(sorted>=need){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,build),500); }
      }else{ if(bin){ mistakes++; gentleRetry(bin); } resetPos(t); }
    }});
    return t;
  }
  function build(){
    mistakes=0; sorted=0; clear(vowelBin); clear(consBin); clear(tray);
    // 2-3 vowels + rest consonants = 6 letters
    const nv = rand(2,3);
    const letters = shuffle([...shuffle(VOWELS).slice(0,nv), ...shuffle(CONS).slice(0,6-nv)]);
    need = letters.length;
    G.setScore('Sorted 0 / '+need);
    letters.forEach(ch=>tray.appendChild(letterTile(ch)));
  }

  G.instructions('A E I O U = 🅰️  ·  B C D… = 🅱️', build);
})();
