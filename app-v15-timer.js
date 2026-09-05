/* Stable race clock: one lightweight tick updates only clock fields. */
(function(){
  const API=window.APP_CONFIG?.API_URL||'/api/race';
  let race=null;
  const $=id=>document.getElementById(id);
  const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
  const width=(id,v)=>{const e=$(id);if(e)e.style.width=v};
  const fmt=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`};
  function tick(){
    const f=race?.fields||{},start=f['Start Time']?new Date(f['Start Time']):null,status=f.Status||'Not Started',stored=Number(f['Current Loop']||1),dist=Number(f['Loop Distance']||4.167);
    if(!start||Number.isNaN(start.getTime()))return;
    let current=stored,remaining=0;
    if(status==='Running'){
      current=Math.max(stored,Math.floor((Date.now()-start.getTime())/3600000)+1);
      remaining=Math.max(0,Math.ceil((start.getTime()+current*3600000-Date.now())/1000));
      set('countdown',fmt(remaining));set('runnerCountdown',fmt(remaining));
      set('currentLoop',current);set('runnerLoop',current);set('heroLoop',`LOOP ${current}`);set('miles',((current-1)*dist).toFixed(1));
      set('elapsedProgress',fmt(3600-remaining)+' elapsed');set('remainingProgress',fmt(remaining)+' remaining');width('raceProgress',Math.min(100,Math.max(0,(3600-remaining)/36))+'%');
      set('elapsed',(()=>{const e=Math.max(0,Math.floor((Date.now()-start.getTime())/60000));return `${Math.floor(e/60)}:${String(e%60).padStart(2,'0')}`})());
    }else if(status==='Not Started'){
      remaining=Math.max(0,Math.ceil((start.getTime()-Date.now())/1000));
      set('countdown',fmt(remaining));set('runnerCountdown',fmt(remaining));set('elapsedProgress','RACE STARTS 9:00 AM');set('remainingProgress',remaining?' '+fmt(remaining)+' until start':'READY TO START');width('raceProgress','0%');
    }else{
      const label=status==='Finished'?'DONE':status==='DNF'?'DNF':'—';set('countdown',label);set('runnerCountdown',label);set('remainingProgress','—');width('raceProgress','0%');
    }
  }
  async function sync(){
    try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'getAll'})});const d=await r.json();if(!r.ok||d.error)return;race=d.race||null;tick()}catch(e){console.warn('Clock sync failed',e)}
  }
  sync();setInterval(tick,1000);setInterval(sync,15000);
})();
