/* Independent live timer: never depends on the plan renderer. */
(function(){
  const API=window.APP_CONFIG?.API_URL||'/api/race';
  const pad=n=>String(Math.max(0,n)).padStart(2,'0');
  const fmt=s=>{s=Math.max(0,Math.floor(s));return `${Math.floor(s/3600)}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`};
  let race=null;
  async function getRace(){try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'getAll'})});const d=await r.json();if(r.ok&&!d.error)race=d.race||null}catch(e){console.warn('Timer sync failed',e)}}
  function tick(){
    const f=race?.fields||{},start=f['Start Time']?new Date(f['Start Time']).getTime():NaN,status=f.Status||'Not Started';
    const stored=Math.max(1,Number(f['Current Loop']||1));
    let current=stored,remaining=0;
    if(Number.isFinite(start)&&status==='Running'){
      current=Math.max(stored,Math.floor((Date.now()-start)/3600000)+1);
      remaining=Math.max(0,Math.floor((start+current*3600000-Date.now())/1000));
    }else if(Number.isFinite(start)&&status==='Not Started'){
      remaining=Math.max(0,Math.floor((start-Date.now())/1000));
    }
    const ids=[['countdown',remaining],['runnerCountdown',remaining]];
    ids.forEach(([id])=>{const el=document.getElementById(id);if(!el)return;el.textContent=status==='Finished'?'DONE':status==='DNF'?'DNF':fmt(remaining)});
    const loop=document.getElementById('currentLoop'),runner=document.getElementById('runnerLoop'),hero=document.getElementById('heroLoop');
    if(loop)loop.textContent=current;if(runner)runner.textContent=current;if(hero)hero.textContent=`LOOP ${current}`;
    const elapsed=document.getElementById('elapsedProgress'),rem=document.getElementById('remainingProgress');
    if(status==='Running'){if(elapsed)elapsed.textContent=fmt(3600-remaining)+' elapsed';if(rem)rem.textContent=fmt(remaining)+' remaining'}
    else if(status==='Not Started'){if(elapsed)elapsed.textContent='RACE STARTS 9:00 AM';if(rem)rem.textContent=fmt(remaining)+' until start'}
    const prog=document.getElementById('raceProgress');if(prog)prog.style.width=status==='Running'?Math.min(100,Math.max(0,(3600-remaining)/36))+'%':'0%';
  }
  getRace();tick();setInterval(tick,1000);setInterval(getRace,5000);
})();
