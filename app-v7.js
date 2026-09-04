/* Failsafe for the shared race dashboard: keep the known race schedule visible if Airtable returns no Race record. */
(function(){
  const FALLBACK={id:'scheduled-race',fields:{'Race Name':'Tom’s Backyard Ultra','Start Time':'2026-09-05T09:00:00-05:00','Loop Distance':4.167,'Current Loop':1,'Status':'Not Started'}};
  const fmt=sec=>{sec=Math.max(0,Math.floor(sec));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`};
  const tick=()=>{
    if(!window.stateForFailsafe){
      try{window.stateForFailsafe=state}catch(e){return}
    }
    if(!state.race){state.race=FALLBACK;try{render()}catch(e){}}
    const f=state.race?.fields||{};
    if(f['Start Time']&&f.Status==='Not Started'){
      const sec=Math.max(0,Math.floor((new Date(f['Start Time']).getTime()-Date.now())/1000));
      const el=document.getElementById('countdown');if(el)el.textContent=fmt(sec);
      const runner=document.getElementById('runnerCountdown');if(runner)runner.textContent=fmt(sec);
      const sync=document.getElementById('syncStatus');if(sync)sync.textContent='SCHEDULED';
      const prog=document.getElementById('raceProgress');if(prog)prog.style.width='0%';
      const ep=document.getElementById('elapsedProgress');if(ep)ep.textContent='RACE STARTS 9:00 AM CT';
      const rp=document.getElementById('remainingProgress');if(rp)rp.textContent=fmt(sec)+' until start';
    }
  };
  setInterval(tick,250);tick();
})();
