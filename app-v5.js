/* Final UI patch: keep render untouched; no render recursion. */
(function(){
  const qs=s=>document.querySelector(s);
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
      m.innerHTML='<div class="motivation-kicker">KEEP GOING</div><div class="motivation-quote">ONE MORE LOOP.</div><div class="motivation-sub">You don’t need to run the whole race right now. Just get to the next bell.</div>';
    }
    const next=qs('.next-card');
    if(next&&!next.dataset.bound){
      next.dataset.bound='1';
      next.setAttribute('role','button'); next.setAttribute('tabindex','0');
      const go=()=>{if(typeof window.switchTab==='function'){window.switchTab('planTab');setTimeout(()=>qs('#planList .planRow')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}};
      next.addEventListener('click',go); next.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ') {e.preventDefault();go();}});
    }
  };
  const tick=()=>{updateWarning();updateHome();};
  window.addEventListener('load',()=>{tick();setInterval(tick,1000);});
})();
