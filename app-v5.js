/* Live race-control refinements. Safe patch: no render wrapping, no recursion. */
(function(){
  const qs=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtTime=sec=>{sec=Math.max(0,Math.round(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s2=sec%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s2).padStart(2,'0')}`:`${m}:${String(s2).padStart(2,'0')}`;};
  const parseTime=v=>{const m=String(v||'').match(/(\d+)\s*:\s*(\d+)(?::(\d+))?/);if(!m)return null;return m[3]?Number(m[1])*3600+Number(m[2])*60+Number(m[3]):Number(m[1])*60+Number(m[2]);};
  let remote={race:null,loops:[]};
  const refreshRemote=async()=>{try{const r=await fetch('/api/race',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'getAll'})});if(!r.ok)return;remote=await r.json();updateAll();}catch(e){}};
  const raceFields=()=>remote.race?.fields||{};
  const getTiming=()=>{
    const r=raceFields(),start=r['Start Time']?new Date(r['Start Time']):null,status=r.Status||'Not Started';
    if(!start||status!=='Running')return {status,start,loop:Number(r['Current Loop']||1),remaining:0};
    let loop=Math.max(Number(r['Current Loop']||1),Math.floor((Date.now()-start.getTime())/3600000)+1);
    const remaining=Math.max(0,Math.floor((start.getTime()+loop*3600000-Date.now())/1000));
    return {status,start,loop,remaining};
  };
  const updateWarning=()=>{
    const card=qs('.race-card');if(!card)return;
    card.classList.remove('warn3','warn2','warn1');
    const t=getTiming();if(t.status!=='Running')return;
    if(t.remaining>0&&t.remaining<=60)card.classList.add('warn1');
    else if(t.remaining<=120)card.classList.add('warn2');
    else if(t.remaining<=180)card.classList.add('warn3');
  };
  const updateLastLoop=()=>{
    const loops=Array.isArray(remote.loops)?remote.loops:[];if(!loops.length)return;
    const sorted=loops.slice().sort((a,b)=>Number(a.fields?.['Loop #']||0)-Number(b.fields?.['Loop #']||0));
    const f=sorted[sorted.length-1]?.fields||{};const sec=parseTime(f['Loop Time']);
    if(sec!=null){const miles=4.167;const paceSec=Math.round(sec/miles);const pace=`${Math.floor(paceSec/60)}:${String(paceSec%60).padStart(2,'0')}`;const el=qs('#lastLoop');if(el)el.textContent=`${fmtTime(sec)} (${pace}/mi)`;}
  };
  const updateInbound=()=>{
    const home=qs('#liveTab');if(!home)return;
    const t=getTiming();let card=qs('#runnerInboundCard');
    if(t.status!=='Running'){
      if(card)card.remove();
      return;
    }
    if(!card){
      card=document.createElement('section');card.id='runnerInboundCard';card.className='card inbound-card';
      const anchor=qs('.phase-card');if(anchor)anchor.parentNode.insertBefore(card,anchor.nextSibling);else home.appendChild(card);
    }
    const loops=Array.isArray(remote.loops)?remote.loops:[];const sorted=loops.slice().sort((a,b)=>Number(a.fields?.['Loop #']||0)-Number(b.fields?.['Loop #']||0));const lastF=sorted[sorted.length-1]?.fields||{};const lastSec=parseTime(lastF['Loop Time']);
    const loop=t.loop,remaining=t.remaining;
    let title='RUNNER OUT',meta=`Loop ${loop} underway`,ret='EXPECTED RETURN',retVal=lastSec!=null?`~${fmtTime(lastSec)}`:'Before the next bell';
    if(remaining<=180){title='RUNNER INBOUND';meta=remaining<=60?'Get to the corral. Final minute.':`Loop ${loop} ends soon. Get the next kit ready.`;ret='NEXT BELL';retVal=fmtTime(remaining);}
    card.innerHTML=`<div class="inbound-icon">↗</div><div><div class="section-kicker">${title}</div><b>${esc(meta)}</b><small><span>${ret}</span><strong>${retVal}</strong></small></div><div class="inbound-kit"><i>🥤</i><i>🍌</i><i>🧦</i><i>👕</i></div>`;
  };
  const updateNight=()=>{
    const home=qs('#liveTab');if(!home)return;const t=getTiming();let card=qs('#nightAlertCard');
    if(t.status!=='Running'||t.loop<10){if(card)card.remove();return;}
    if(!card){card=document.createElement('section');card.id='nightAlertCard';card.className='card night-alert-card';const anchor=qs('#runnerInboundCard')||qs('.phase-card');if(anchor)anchor.parentNode.insertBefore(card,anchor.nextSibling);else home.appendChild(card);}
    const label=t.loop===10?'NIGHT GEAR REQUIRED':'NIGHT GEAR CHECK';
    card.innerHTML=`<div class="night-alert-icon">☾</div><div><div class="section-kicker">${label}</div><b>Lights + high-vis stay on.</b><small>Headlamp · reflective gear · high-vis layer</small></div>`;
  };
  const updateHome=()=>{
    const m=qs('.milestone-card');if(m){
      m.classList.add('motivation-card');
      if(!m.dataset.motivation){m.dataset.motivation='1';m.innerHTML='<div class="motivation-orbit" aria-hidden="true"><span>01</span></div><div class="motivation-kicker">KEEP GOING</div><div class="motivation-quote">ONE MORE LOOP.</div><div class="motivation-sub">You don’t need to run the whole race right now. Just get to the next bell.</div>'}
    }
    const next=qs('.next-card');if(next&&!next.dataset.bound){
      next.dataset.bound='1';next.setAttribute('role','button');next.setAttribute('tabindex','0');
      const go=()=>{if(typeof window.switchTab==='function'){window.switchTab('planTab');setTimeout(()=>qs('#planList .planRow')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}};
      next.addEventListener('click',go);next.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    }
    const home=qs('#liveTab');if(!home)return;
    if(!qs('#raceBrainCard')){
      const card=document.createElement('section');card.id='raceBrainCard';card.className='card race-brain-card';
      card.innerHTML='<div class="brain-icon" aria-hidden="true">✦</div><div class="section-kicker">RACE BRAIN</div><div id="brainTitle" class="brain-title">RACE READY</div><div id="brainMeta" class="brain-meta">Get food, fluids and gear ready before the first bell.</div><div class="brain-signal" aria-hidden="true"><i></i><i></i><i></i></div>';
      const anchor=qs('.motivation-card')||next;if(anchor)anchor.parentNode.insertBefore(card,anchor.nextSibling);else home.appendChild(card);
    }
    const brainTitle=qs('#brainTitle'),brainMeta=qs('#brainMeta');if(!brainTitle||!brainMeta)return;
    const t=getTiming(),last=remote.loops?.length;
    if(t.status!=='Running'){brainTitle.textContent='RACE READY';brainMeta.textContent='Get food, fluids and gear ready before the first bell.';return;}
    if(t.remaining<=60){brainTitle.textContent='GET TO THE LINE';brainMeta.textContent='Final minute. Runner should be heading to the starting corral.';}
    else if(t.remaining<=180){brainTitle.textContent='CREW, GET READY';brainMeta.textContent=`Loop ${t.loop} starts in ${Math.ceil(t.remaining/60)} min. Finish the next crew task now.`;}
    else if(last){const f=remote.loops.slice().sort((a,b)=>Number(a.fields?.['Loop #']||0)-Number(b.fields?.['Loop #']||0)).at(-1)?.fields||{};brainTitle.textContent='STEADY';brainMeta.textContent=`Loop ${t.loop} is underway. Last loop: ${f['Loop Time']||'—'}. Nothing else needs attention right now.`;}
    else {brainTitle.textContent='ONE LOOP AT A TIME';brainMeta.textContent=`Loop ${t.loop} is underway. Stay steady and prepare for the next return.`;}
  };
  const updateAll=()=>{updateWarning();updateLastLoop();updateInbound();updateNight();updateHome();};
  window.addEventListener('load',()=>{updateAll();refreshRemote();setInterval(updateAll,1000);setInterval(refreshRemote,10000);});
})();
