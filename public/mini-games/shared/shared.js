/* =========================================================
   SHADOWGAMMA — SHARED ENGINE (games 11-20)
   Loaded by every game via <script src="../shared/shared.js">.
   Provides: DOM helpers, router, drag, feedback, game frame,
   and imgOrEmoji() (placeholder <img> with emoji fallback).
   Everything is attached to window so game.js files can use it.
   ========================================================= */
(function(){

  /* ---------- tiny DOM helper ---------- */
  function el(sel, attrs, kids){
    const parts = String(sel).split(/(?=[.#])/);
    let tag = 'div';
    if(parts[0] && parts[0][0]!=='.' && parts[0][0]!=='#') tag = parts[0].replace(/[.#].*/,'')||'div';
    const node = document.createElement(tag);
    parts.forEach(p=>{ if(p[0]==='.') node.classList.add(p.slice(1));
                       else if(p[0]==='#') node.id=p.slice(1); });
    if(attrs) for(const k in attrs){
      if(k==='style') node.style.cssText=attrs[k];
      else if(k.slice(0,2)==='on'&&typeof attrs[k]==='function') node.addEventListener(k.slice(2),attrs[k]);
      else if(k==='html') node.innerHTML=attrs[k];
      else node.setAttribute(k,attrs[k]);
    }
    if(kids!=null)(Array.isArray(kids)?kids:[kids]).forEach(c=>{
      if(c==null)return; node.appendChild(typeof c==='string'?document.createTextNode(c):c);
    });
    return node;
  }
  const clear = n=>{ while(n.firstChild) n.removeChild(n.firstChild); };
  const rand  = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const shuffle = a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
  const pick  = a=>a[Math.floor(Math.random()*a.length)];

  /* ---------- navigation ---------- */
  function goMenu(){ location.href = '../index.html'; }

  /* ---------- placeholder image w/ emoji fallback ----------
     Shows real art at src if present; otherwise renders emoji.
     This is how every "asset needed" game stays playable now. */
  function imgOrEmoji(src, emoji, size){
    size = size||64;
    const wrap = el('span.asset', {style:`width:${size}px;height:${size}px;font-size:${Math.round(size*.8)}px;`});
    const img = new Image();
    img.src = src; img.alt = emoji;
    img.style.width='100%'; img.style.height='100%';
    img.onerror = ()=>{ img.remove(); wrap.textContent = emoji; };
    wrap.appendChild(img);
    return wrap;
  }

  /* ---------- positive / gentle feedback ---------- */
  function burstConfetti(){
    const em=['🎉','⭐','✨','🎈','🌈','💛','💙'];
    for(let i=0;i<28;i++){
      const c=el('.confetti',{style:`left:${Math.random()*100}vw;animation-delay:${Math.random()*.5}s;`},pick(em));
      document.body.appendChild(c); setTimeout(()=>c.remove(),2600);
    }
  }
  function checkBurst(parent){ const b=el('.check-burst',null,'✅'); parent.appendChild(b); setTimeout(()=>b.remove(),500); }
  function flashGood(n){ n.classList.remove('flash-good'); void n.offsetWidth; n.classList.add('flash-good'); }
  function gentleRetry(n){ n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake'); }
  function speak(text){
    try{ if(!window.speechSynthesis) return false;
      const u=new SpeechSynthesisUtterance(text); u.rate=.9; u.pitch=1.2;
      u.volume=1;   // max speech volume (browsers cap at 1.0)
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); return true;
    }catch(e){ return false; }
  }
  // Simple offline instrument-ish tone (Web Audio) used as audio stand-in.
  function tone(freqs, dur){
    try{
      const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
      const ctx=tone._ctx||(tone._ctx=new AC());
      if(ctx.state==='suspended') ctx.resume();   // ensure full-volume playback
      // Louder than before (was .25). Scale peak by how many notes play at
      // once so chords (game 20) stay below 1.0 and don't clip/distort.
      const peak = Math.min(0.85, 0.9/freqs.length);
      freqs.forEach((f,i)=>{
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type=['sine','triangle','square','sawtooth'][i%4]; o.frequency.value=f;
        g.gain.setValueAtTime(.0001,ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(peak,ctx.currentTime+.02);
        g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+(dur||.5));
        o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+(dur||.5));
      });
    }catch(e){}
  }

  /* ---------- drag helper (mouse + touch) ---------- */
  function enableDrag(node, opts){
    opts=opts||{}; node.style.touchAction='none';
    node.addEventListener('pointerdown', e=>{
      e.preventDefault();
      const rect=node.getBoundingClientRect();
      const offX=e.clientX-rect.left, offY=e.clientY-rect.top;
      const w=rect.width,h=rect.height;
      node.setPointerCapture(e.pointerId); node.classList.add('dragging');
      const move=ev=>{ node.style.position='fixed'; node.style.width=w+'px'; node.style.height=h+'px';
        node.style.left=(ev.clientX-offX)+'px'; node.style.top=(ev.clientY-offY)+'px'; node.style.zIndex=2000; };
      const up=ev=>{ document.removeEventListener('pointermove',move); document.removeEventListener('pointerup',up);
        node.classList.remove('dragging'); node.style.pointerEvents='none';
        const under=document.elementFromPoint(ev.clientX,ev.clientY); node.style.pointerEvents='';
        opts.onDrop&&opts.onDrop(under,ev); };
      document.addEventListener('pointermove',move); document.addEventListener('pointerup',up);
    });
  }
  function resetPos(n){ n.style.position=''; n.style.left=''; n.style.top=''; n.style.zIndex=''; n.style.width=''; n.style.height=''; }

  /* ---------- standard game frame ----------
     buildGame({icon,title}) -> {root,body,setScore,instructions,result}
     Menu button returns to the hub (../index.html).            */
  // True when this game is running inside another page (e.g. embedded in the
  // Phaser game via an <iframe>). Used to report results back instead of
  // navigating to the standalone hub.
  const EMBEDDED = (function(){ try { return window.parent && window.parent !== window; } catch(e){ return false; } })();
  // Tag the page so CSS can make the backdrop transparent when embedded
  // (so the host level shows through behind the game's popup).
  if (EMBEDDED) { try { (document.body||document.documentElement).classList.add('embedded'); } catch(e){} }
  function postToHost(type, extra){ try { window.parent.postMessage(Object.assign({type}, extra||{}), '*'); } catch(e){} }

  function buildGame(cfg){
    const scorePill=el('.score-pill',null,'⭐ 0');
    const body=el('.game-body');
    // Embedded: the host frames/closes the game, so hide the hub "Menu" button.
    const topRight = EMBEDDED
      ? [scorePill]
      : [scorePill, el('button.btn.secondary',{onclick:goMenu},'🏠 Menu')];
    const root=el('.game',null,[
      el('.game-top',null,[
        el('.title',null,cfg.icon+' '+cfg.title),
        el('.row',null,topRight)
      ]),
      body
    ]);
    function setScore(t){ scorePill.textContent=t; }
    function instructions(demoHtml,onStart){
      const ov=el('.overlay',null,[
        el('.demo',{html:demoHtml}),
        el('h2',null,'How to play'),
        el('button.btn.big',{onclick:()=>{ov.remove();onStart();}},'▶ Start')
      ]); body.appendChild(ov);
    }
    function result(stars,onAgain){
      const s='⭐'.repeat(stars)+'☆'.repeat(3-stars);
      // Embedded in the main game → single "Continue" that reports the result
      // back to the host level. Standalone → the usual Play Again / Menu.
      const buttons = EMBEDDED
        ? [ el('button.btn.big',{onclick:()=>postToHost('minigame-complete',{stars})},'▶ Continue') ]
        : [ el('button.btn.big',{onclick:()=>{ov.remove();onAgain();}},'🔁 Play Again'),
            el('button.btn.big.secondary',{onclick:goMenu},'🏠 Menu') ];
      const ov=el('.overlay',null,[
        el('.demo',null,stars===3?'🏆':'🎉'),
        el('h2',null,stars===3?'Perfect!':'Great job!'),
        el('.stars',null,s),
        el('.row',null,buttons)
      ]); body.appendChild(ov); burstConfetti();
    }
    return {root,body,setScore,instructions,result};
  }
  // Convenience: build frame + attach to #app in one call.
  function mountGame(cfg){ const G=buildGame(cfg); document.getElementById('app').appendChild(G.root); return G; }

  /* ---------- export to window ---------- */
  Object.assign(window,{
    el,clear,rand,shuffle,pick,goMenu,imgOrEmoji,
    burstConfetti,checkBurst,flashGood,gentleRetry,speak,tone,
    enableDrag,resetPos,buildGame,mountGame
  });
})();
