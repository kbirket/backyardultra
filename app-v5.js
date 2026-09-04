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
  const updateWarning=()=>{const card=qs('.race-card');if(!card)return;card.classList.remove('warn3','warn2','warn1');const t=getTiming();if(t.status!=='Running')return;if(t.remaining>0&&t.remaining<=60)card.classList.add('warn1');else if(t.remaining<=120)card.classList.add('warn2');else if(t.remaining<=180)card.classList.add('warn3');};
  const sortedLoops=()=>Array.isArray(remote.loops)?remote.loops.slice().sort((a,b)=>Number(a.fields?.['Loop #']||0)-Number(b.fields?.['Loop #']||0)):[];
  const updateLastLoop=()=>{const loops=sortedLoops();if(!loops.length)return;const f=loops[loops.length-1]?.fields||{};const sec=parseTime(f['Loop Time']);if(sec!=null){const paceSec=Math.round(sec/4.167),pace=`${Math.floor(paceSec/60)}:${String(paceSec%60).padStart(2,'0')}`,el=qs('#lastLoop');if(el)el.textContent=`${fmtTime(sec)} (${pace}/mi)`;}};
  const updateInbound=()=>{
    const home=qs('#liveTab');if(!home)return;const t=getTiming();let card=qs('#runnerInboundCard');
    if(t.status!=='Running'){if(card)card.remove();return;}
    if(!card){card=document.createElement('section');card.id='runnerInboundCard';card.className='card inbound-card';const anchor=qs('.phase-card');if(anchor)anchor.parentNode.insertBefore(card,anchor.nextSibling);else home.appendChild(card);}
    const loops=sortedLoops(),lastF=loops[loops.length-1]?.fields||{},lastSec=parseTime(lastF['Loop Time']),loop=t.loop,remaining=t.remaining;
    let title='RUNNER OUT',meta=`Loop ${loop} underway`,ret='EXPECTED RETURN',retVal=lastSec!=null?`~${fmtTime(lastSec)}`:'Before the next bell';
    if(remaining<=180){title='RUNNER INBOUND';meta=remaining<=60?'Get to the corral. Final minute.':`Loop ${loop} ends soon. Get the next kit ready.`;ret='NEXT BELL';retVal=fmtTime(remaining);}
    card.innerHTML=`<div class="inbound-icon">↗</div><div><div class="section-kicker">${title}</div><b>${esc(meta)}</b><small><span>${ret}</span><strong>${retVal}</strong></small></div><div class="inbound-kit"><i>🥤</i><i>🍌</i><i>🧦</i><i>👕</i></div>`;
  };
  const updateNight=()=>{const home=qs('#liveTab');if(!home)return;const t=getTiming();let card=qs('#nightAlertCard');if(t.status!=='Running'||t.loop<10){if(card)card.remove();return;}if(!card){card=document.createElement('section');card.id='nightAlertCard';card.className='card night-alert-card';const anchor=qs('#runnerInboundCard')||qs('.phase-card');if(anchor)anchor.parentNode.insertBefore(card,anchor.nextSibling);else home.appendChild(card);}const label=t.loop===10?'NIGHT GEAR REQUIRED':'NIGHT GEAR CHECK';card.innerHTML=`<div class="night-alert-icon">☾</div><div><div class="section-kicker">${label}</div><b>Lights + high-vis stay on.</b><small>Headlamp · reflective gear · high-vis layer</small></div>`;};
  const updateHome=()=>{
    const m=qs('.milestone-card');if(m){m.classList.add('motivation-card');if(!m.dataset.motivation){m.dataset.motivation='1';m.innerHTML='<div class="motivation-orbit" aria-hidden="true"><span>01</span></div><div class="motivation-kicker">KEEP GOING</div><div class="motivation-quote">ONE MORE LOOP.</div><div class="motivation-sub">You don’t need to run the whole race right now. Just get to the next bell.</div>';}}
    const next=qs('.next-card');if(next&&!next.dataset.bound){next.dataset.bound='1';next.setAttribute('role','button');next.setAttribute('tabindex','0');const go=()=>{if(typeof window.switchTab==='function'){window.switchTab('planTab');setTimeout(()=>qs('#planList .planRow')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}};next.addEventListener('click',go);next.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});}
    const home=qs('#liveTab');if(!home)return;if(!qs('#raceBrainCard')){const card=document.createElement('section');card.id='raceBrainCard';card.className='card race-brain-card';card.innerHTML='<div class="brain-icon" aria-hidden="true">✦</div><div class="section-kicker">RACE BRAIN</div><div id="brainTitle" class="brain-title">RACE READY</div><div id="brainMeta" class="brain-meta">Get food, fluids and gear ready before the first bell.</div><div class="brain-signal" aria-hidden="true"><i></i><i></i><i></i></div>';const anchor=qs('.motivation-card')||next;if(anchor)anchor.parentNode.insertBefore(card,anchor.nextSibling);else home.appendChild(card);}
    const brainTitle=qs('#brainTitle'),brainMeta=qs('#brainMeta');if(!brainTitle||!brainMeta)return;const t=getTiming(),last=remote.loops?.length;
    if(t.status!=='Running'){brainTitle.textContent='RACE READY';brainMeta.textContent='Get food, fluids and gear ready before the first bell.';return;}
    if(t.remaining<=60){brainTitle.textContent='GET TO THE LINE';brainMeta.textContent='Final minute. Runner should be heading to the starting corral.';}else if(t.remaining<=180){brainTitle.textContent='CREW, GET READY';brainMeta.textContent=`Loop ${t.loop} starts in ${Math.ceil(t.remaining/60)} min. Finish the next crew task now.`;}else if(last){const f=sortedLoops().at(-1)?.fields||{};brainTitle.textContent='STEADY';brainMeta.textContent=`Loop ${t.loop} is underway. Last loop: ${f['Loop Time']||'—'}. Nothing else needs attention right now.`;}else{brainTitle.textContent='ONE LOOP AT A TIME';brainMeta.textContent=`Loop ${t.loop} is underway. Stay steady and prepare for the next return.`;}
  };
  const runnerLogEntry=f=>`Feeling: ${f.feeling||'—'} | Legs: ${f.legs||'—'} | Feet: ${f.feet||'—'} | Hydration: ${f.hydration||'—'} | Fuel: ${f.fuel||'—'} | Mental: ${f.mental||'—'} | Note: ${f.note||'—'}`;
  const parseRunnerLogs=notes=>String(notes||'').split('\n').filter(x=>x.startsWith('RUNNER LOG | '));
  const updateRunnerLog=()=>{
    const runner=qs('#runnerTab');if(!runner)return;
    let card=qs('#runnerLogCard');
    if(!card){
      card=document.createElement('section');card.id='runnerLogCard';card.className='card runner-log-card';
      card.innerHTML=`<div class="section-title"><div><div class="section-kicker">RUNNER LOG</div><h2>How was that loop?</h2></div><span id="runnerLogLoopLabel">—</span></div><p class="check-hint">Quick check-in after each completed loop. Your crew can see this too.</p><div class="log-grid"><label>Feeling<select id="logFeeling"><option>Great</option><option>Good</option><option>Tired</option><option>Struggling</option></select></label><label>Legs<select id="logLegs"><option>Good</option><option>Heavy</option><option>Pain</option></select></label><label>Feet<select id="logFeet"><option>Good</option><option>Hot spot</option><option>Blister</option><option>Problem</option></select></label><label>Hydration<select id="logHydration"><option>Good</option><option>Behind</option></select></label><label>Fuel<select id="logFuel"><option>Good</option><option>Behind</option></select></label><label>Mental<select id="logMental"><option>Strong</option><option>Neutral</option><option>Struggling</option></select></label></div><textarea id="logNote" class="runner-log-note" placeholder="Anything the crew should know? (optional)"></textarea><button id="saveRunnerLog" class="good-go">SAVE LOOP CHECK-IN →</button><div id="runnerLogStatus" class="log-status"></div><div class="log-history-head"><b>RECENT LOOPS</b></div><div id="runnerLogHistory"></div>`;
      runner.appendChild(card);
      qs('#saveRunnerLog').addEventListener('click',async()=>{
        const t=getTiming(),loops=sortedLoops(),last=loops[loops.length-1],loop=Number(last?.fields?.['Loop #']);
        if(!loop){qs('#runnerLogStatus').textContent='Finish a loop first, then save the check-in.';return;}
        const f={feeling:qs('#logFeeling').value,legs:qs('#logLegs').value,feet:qs('#logFeet').value,hydration:qs('#logHydration').value,fuel:qs('#logFuel').value,mental:qs('#logMental').value,note:qs('#logNote').value.trim()};
        const status=qs('#runnerLogStatus');status.textContent='Saving…';
        try{const r=await fetch('/api/race',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'saveRunnerLog',loop,fields:f})});const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||'Could not save check-in.');status.textContent=`Loop ${loop} saved ✓`;qs('#logNote').value='';await refreshRemote();}catch(e){status.textContent=e.message||'Could not save check-in.';}
      });
    }
    const loops=sortedLoops(),last=loops[loops.length-1],lastLoop=Number(last?.fields?.['Loop #']||0);qs('#runnerLogLoopLabel').textContent=lastLoop?`LOOP ${lastLoop}`:'WAITING';
    const history=qs('#runnerLogHistory');if(history){const entries=[];loops.slice().reverse().forEach(x=>{const f=x.fields||{},logs=parseRunnerLogs(f.Notes);logs.forEach(raw=>{const parts=raw.split(' | ');entries.push({loop:f['Loop #'],stamp:parts[1]||'',text:parts.slice(2).join(' · ')})});});history.innerHTML=entries.slice(0,8).map(x=>`<div class="runner-log-row"><div><b>Loop ${esc(x.loop)}</b><small>${esc(x.stamp?new Date(x.stamp).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'')}</small></div><p>${esc(x.text)}</p></div>`).join('')||'<div class="muted">Your loop check-ins will appear here.</div>';}
  };
  const updateAll=()=>{updateWarning();updateLastLoop();updateInbound();updateNight();updateHome();updateRunnerLog();};
  window.addEventListener('load',()=>{updateAll();refreshRemote();setInterval(updateAll,1000);setInterval(refreshRemote,10000);});
})();
