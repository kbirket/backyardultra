/* Tom + Kristen personalization and runner guidance. */
(function(){
  const qs=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data={race:null,loops:[],runnerLog:[]};
  const load=async()=>{try{const r=await fetch('/api/race',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'getAll'})});if(!r.ok)return;data=await r.json();render();}catch(e){}};
  const completed=()=>Array.isArray(data.loops)?data.loops.slice().sort((a,b)=>Number(b.fields?.['Loop #']||0)-Number(a.fields?.['Loop #']||0)):[];
  const renderAdvice=()=>{
    const runner=qs('#runnerTab');if(!runner||qs('#tomAdviceCard'))return;
    const card=document.createElement('section');card.id='tomAdviceCard';card.className='card tom-advice-card';
    card.innerHTML='<div class="section-kicker">TOM’S RACE BRAIN</div><h2>JUST MAKE THE NEXT LOOP.</h2><p>Don’t think about 100 miles. The job is one loop at a time.</p><div class="advice-list"><div><b>START EASY</b><span>Protect your legs early.</span></div><div><b>WALK EARLY</b><span>Walking is strategy, not failure.</span></div><div><b>FIX SMALL PROBLEMS</b><span>Hot spot, rubbing, pain or anything weird? Tell Kristen now.</span></div><div><b>COME IN WITH TIME</b><span>Recover, fuel, check feet and get to the corral.</span></div><div><b>DON’T CHASE</b><span>Run your loop. Other runners are not your pace group.</span></div><div><b>BAD LOOP?</b><span>Finish this loop. Recover. Then reassess.</span></div></div><div class="advice-call"><span>❤️ KRISTEN = RACE CONTROL</span><b>If Kristen says eat, drink, socks, lights or corral — do it.</b></div>';
    const anchor=runner.querySelector('.runner-check');anchor?anchor.parentNode.insertBefore(card,anchor):runner.appendChild(card);
  };
  const renderLog=()=>{
    const old=qs('#runnerLogCard');if(old)old.remove();
    const runner=qs('#runnerTab');if(!runner)return;
    const card=document.createElement('section');card.id='runnerLogCard';card.className='card runner-log-card';
    card.innerHTML='<div class="section-title"><div><div class="section-kicker">TOM’S RUNNER LOG</div><h2>How was that loop?</h2></div><span id="runnerLogLoopLabel">WAITING</span></div><p class="check-hint">Quick check-in after each completed loop. Kristen can see this too.</p><div class="log-grid"><label>Feeling<select id="logFeeling"><option>Great</option><option>Good</option><option>Tired</option><option>Struggling</option></select></label><label>Legs<select id="logLegs"><option>Good</option><option>Heavy</option><option>Pain</option></select></label><label>Feet<select id="logFeet"><option>Good</option><option>Hot spot</option><option>Blister</option><option>Problem</option></select></label><label>Hydration<select id="logHydration"><option>Good</option><option>Behind</option></select></label><label>Fuel<select id="logFuel"><option>Good</option><option>Behind</option></select></label><label>Mental<select id="logMental"><option>Strong</option><option>Neutral</option><option>Struggling</option></select></label></div><textarea id="logNote" class="runner-log-note" placeholder="Anything Kristen should know? (optional)"></textarea><button id="saveRunnerLog" class="good-go">SAVE LOOP CHECK-IN →</button><div id="runnerLogStatus" class="log-status"></div><div class="log-history-head"><b>RECENT LOOPS</b></div><div id="runnerLogHistory"></div>';
    runner.appendChild(card);
    qs('#saveRunnerLog').addEventListener('click',async()=>{
      const last=completed()[0],loop=Number(last?.fields?.['Loop #']);
      const status=qs('#runnerLogStatus');if(!loop){status.textContent='Finish a loop first, then save the check-in.';return;}
      const fields={feeling:qs('#logFeeling').value,legs:qs('#logLegs').value,feet:qs('#logFeet').value,hydration:qs('#logHydration').value,fuel:qs('#logFuel').value,mental:qs('#logMental').value,note:qs('#logNote').value.trim()};
      status.textContent='Saving…';
      try{const r=await fetch('/api/race',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'saveRunnerLog',loop,fields})});const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||'Could not save check-in.');status.textContent=`Loop ${loop} saved ✓`;qs('#logNote').value='';await load();}catch(e){status.textContent=e.message||'Could not save check-in.';}
    });
    const last=completed()[0],lastLoop=Number(last?.fields?.['Loop #']||0);qs('#runnerLogLoopLabel').textContent=lastLoop?`LOOP ${lastLoop}`:'WAITING';
    const logs=Array.isArray(data.runnerLog)?data.runnerLog.slice().sort((a,b)=>new Date(b.fields?.Time||0)-new Date(a.fields?.Time||0)):[];
    qs('#runnerLogHistory').innerHTML=logs.slice(0,8).map(x=>{const f=x.fields||{};const bits=[f.Feeling,f.Legs,f.Feet,f.Hydration,f.Fuel,f.Mental].filter(Boolean).join(' · ');return `<div class="runner-log-row"><div><b>Loop ${esc(f['Loop #']||'—')}</b><small>${f.Time?new Date(f.Time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):''}</small></div><p>${esc(bits)}${f.Note?` · ${esc(f.Note)}`:''}</p></div>`;}).join('')||'<div class="muted">Your loop check-ins will appear here.</div>';
  };
  const personalize=()=>{
    document.querySelectorAll('body *').forEach(el=>{if(el.children.length===0&&el.textContent.includes('CREW'))el.textContent=el.textContent.replace(/CREW/g,'KRISTEN');});
  };
  const render=()=>{renderAdvice();renderLog();personalize();};
  window.addEventListener('load',()=>{render();load();setInterval(load,10000);});
})();
