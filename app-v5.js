/* Live race-control refinements. No render wrapping, no recursion. */
(function(){
  const qs=s=>document.querySelector(s);
  const fmtTime=sec=>{sec=Math.max(0,Math.round(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s2=sec%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s2).padStart(2,'0')}`:`${m}:${String(s2).padStart(2,'0')}`};
  const updateWarning=()=>{
    const card=qs('.race-card'); if(!card)return;
    card.classList.remove('warn3','warn2','warn1');
    const r=window.state?.race?.fields||{};
    if(r.Status!=='Running'||!r['Start Time'])return;
    const start=new Date(r['Start Time']);
    let loop=Number(r['Current Loop']||1);
    loop=Math.max(loop,Math.floor((Date.now()-start.getTime())/3600000)+1);
    const rem=Math.max(0,Math.floor((start.getTime()+loop*3600000-Date.now())/1000));
    if(rem>0&&rem<=60)card.classList.add('warn1');
    else if(rem<=120)card.classList.add('warn2');
    else if(rem<=180)card.classList.add('warn3');
  };
  const updateHome=()=>{
    const m=qs('.milestone-card'); if(m){
      m.classList.add('motivation-card');
      if(!m.dataset.motivation){m.dataset.motivation='1';m.innerHTML='<div class="motivation-kicker">KEEP GOING</div><div class="motivation-quote">ONE MORE LOOP.</div><div class="motivation-sub">You don’t need to run the whole race right now. Just get to the next bell.</div>';
      }
    }
    const next=qs('.next-card');
    if(next&&!next.dataset.bound){
      next.dataset.bound='1';next.setAttribute('role','button');next.setAttribute('tabindex','0');
      const go=()=>{if(typeof window.switchTab==='function'){window.switchTab('planTab');setTimeout(()=>qs('#planList .planRow')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}};
      next.addEventListener('click',go);next.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    }
    const home=qs('#liveTab'); if(!home)return;
    if(!qs('#raceBrainCard')){
      const card=document.createElement('section');card.id='raceBrainCard';card.className='card race-brain-card';
      card.innerHTML='<div class="section-kicker">RACE BRAIN</div><div id="brainTitle" class="brain-title">NOTHING NEEDS YOUR ATTENTION</div><div id="brainMeta" class="brain-meta">Stay steady. The next bell is the only thing that matters.</div>';
      const anchor=qs('.motivation-card')||next; if(anchor)anchor.parentNode.insertBefore(card,anchor.nextSibling);else home.appendChild(card);
    }
    const r=window.state?.race?.fields||{};const brainTitle=qs('#brainTitle'),brainMeta=qs('#brainMeta');if(!brainTitle||!brainMeta)return;
    if(r.Status!=='Running'){brainTitle.textContent='RACE READY';brainMeta.textContent='Get food, fluids and gear ready before the first bell.';return;}
    const start=new Date(r['Start Time']);const loop=Number(r['Current Loop']||1);const last=Number(window.state?.loops?.[0]?.fields?.['Loop Time']||0);
    const elapsed=Date.now()-start.getTime();const rem=3600000-(elapsed%3600000);const mins=Math.ceil(rem/60000);
    if(rem<=60000){brainTitle.textContent='GET TO THE LINE';brainMeta.textContent='Final minute. Runner should be heading to the starting corral.';}
    else if(rem<=180000){brainTitle.textContent='CREW, GET READY';brainMeta.textContent=`Loop ${loop} starts in ${mins} min. Finish the next crew task now.`;}
    else if(last){brainTitle.textContent='STEADY';brainMeta.textContent=`Loop ${loop} is underway. Last loop: ${fmtTime(last)}. Nothing else needs attention right now.`;}
    else {brainTitle.textContent='ONE LOOP AT A TIME';brainMeta.textContent=`Loop ${loop} is underway. Stay steady and prepare for the next return.`;}
  };
  const tick=()=>{updateWarning();updateHome();};
  window.addEventListener('load',()=>{tick();setInterval(tick,1000);});
})();
