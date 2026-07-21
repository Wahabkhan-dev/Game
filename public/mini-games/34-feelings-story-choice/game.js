/* =========================================================
   GAME 34 — FEELINGS STORY CHOICE
   A short scenario (text + illustration, also spoken) is
   shown; child picks the emotion face that fits. Teaches
   emotional reasoning. 5 rounds.
   ASSETS: assets/scene-<id>.png scenarios + assets/face-*.png.
   ========================================================= */
(function(){
  const FACES = {
    happy:{img:'assets/face-happy.png',emo:'😀'}, sad:{img:'assets/face-sad.png',emo:'😢'},
    angry:{img:'assets/face-angry.png',emo:'😠'}, scared:{img:'assets/face-scared.png',emo:'😨'},
    excited:{img:'assets/face-excited.png',emo:'🤩'}
  };
  const SCENES = [
    {id:'toy-broke',   text:'Your favorite toy broke.',        img:'assets/scene-toy-broke.png',   emo:'🧸', feel:'sad'},
    {id:'birthday',    text:'It is your birthday party!',      img:'assets/scene-birthday.png',    emo:'🎂', feel:'excited'},
    {id:'lost-toy',    text:'Someone took your toy.',          img:'assets/scene-lost-toy.png',    emo:'😾', feel:'angry'},
    {id:'dark-room',   text:'The room is very dark.',          img:'assets/scene-dark-room.png',   emo:'🌑', feel:'scared'},
    {id:'new-friend',  text:'You made a new friend.',          img:'assets/scene-new-friend.png',  emo:'🤝', feel:'happy'},
    {id:'ice-cream',   text:'You dropped your ice cream.',     img:'assets/scene-ice-cream.png',   emo:'🍦', feel:'sad'},
    {id:'big-dog',     text:'A big dog barks loudly.',         img:'assets/scene-big-dog.png',     emo:'🐕', feel:'scared'}
  ];
  const G = mountGame({icon:'💭', title:'Feelings Story'});
  let queue=[], idx=0, mistakes=0, answer='';
  const TOTAL=5;

  const scene = el('div',{style:'display:flex;flex-direction:column;align-items:center;gap:8px'});
  const sceneText = el('.prompt',{style:'max-width:520px'});
  const choices = el('.row',{style:'gap:16px;flex-wrap:wrap;margin-top:14px'});
  G.body.appendChild(el('div',{style:'font-size:20px;color:#8a5bff'},'How would you feel?'));
  G.body.appendChild(scene);
  G.body.appendChild(sceneText);
  G.body.appendChild(choices);

  function newRound(){
    const sc = queue[idx];
    answer = sc.feel;
    G.setScore('Story '+(idx+1)+' / '+TOTAL);
    clear(scene); scene.appendChild(imgOrEmoji(sc.img, sc.emo, 120));
    sceneText.textContent = sc.text;
    speak(sc.text);
    // choices = correct feeling + 2 others
    const others = shuffle(Object.keys(FACES).filter(f=>f!==answer)).slice(0,2);
    clear(choices);
    shuffle([answer,...others]).forEach(f=>{
      const t = el('.tile',{style:'width:120px;height:130px;flex-direction:column;gap:4px'},[
        imgOrEmoji(FACES[f].img, FACES[f].emo, 74),
        el('div',{style:'font-size:15px;color:#4a4e73'}, f.toUpperCase())
      ]);
      t.addEventListener('pointerdown',()=>guess(f,t));
      choices.appendChild(t);
    });
  }
  function guess(f,node){
    // gentle: any answer is accepted as a valid feeling, but the
    // "expected" one gets the celebration; others get a soft retry.
    if(f===answer){
      flashGood(node); checkBurst(G.body);
      if(idx>=TOTAL-1){ const stars=mistakes===0?3:mistakes<=2?2:1; setTimeout(()=>G.result(stars,start),550); }
      else { idx++; setTimeout(newRound,600); }
    }else{ mistakes++; gentleRetry(node); }
  }
  function start(){ queue=shuffle(SCENES.slice()).slice(0,TOTAL); idx=0; mistakes=0; newRound(); }

  G.instructions('🧸💔 ➡️ 😢', start);
})();
