/* Failsafes for the shared race dashboard: keep the known race schedule and race plan visible if a backend read returns empty. */
(function(){
  const FALLBACK={id:'scheduled-race',fields:{'Race Name':'Tom’s Backyard Ultra','Start Time':'2026-09-05T09:00:00-05:00','Loop Distance':4.167,'Current Loop':1,'Status':'Not Started'}};
  const PLAN=[
    ['recULmBeHIkK1ks6p','2026-09-05','6:00 AM','Arrival & Setup',null,'Setup'],
    ['recaKvgO6iva737mj','2026-09-05','7:00 AM','Coffee Break',null,'Coffee'],
    ['recTcbzfnKHk1Dkc9','2026-09-05','9:00 AM','Race starts','1','Race'],
    ['recit2EoOnXyxBb3m','2026-09-05','11:00 AM','Gabapentin + Beta','3','Medication'],
    ['recrZt0iRsRFKBY1K','2026-09-05','12:00 PM','Creatine','4','Supplement'],
    ['recy3Y1M7jEj2ogwe','2026-09-05','1:00 PM','Sandwich','5','Food'],
    ['recYlaY9hfkkVrIZ4','2026-09-05','4:00 PM','Gabapentin','8','Medication'],
    ['recgHhbVPJutTQEdR','2026-09-05','6:00 PM','Sandwich','10','Food'],
    ['recbWbKxrcJ8MTWAU','2026-09-05','8:00 PM','Beta','12','Supplement'],
    ['recuCwbIYh4jYps9Y','2026-09-05','9:00 PM','Gabapentin','13','Medication'],
    ['recVjJelOYUmQT92L','2026-09-05','10:00 PM','Creatine','14','Supplement'],
    ['recamORBoCIXI0ELL','2026-09-05','11:00 PM','Sandwich','15','Food'],
    ['reckw5DOJT7D9cBqe','2026-09-06','2:00 AM','Gabapentin','18','Medication'],
    ['recExbERkxr7s7Y0r','2026-09-06','4:00 AM','Sandwich','20','Food'],
    ['recvBr7ZMC5haWP2l','2026-09-06','6:00 AM','Beta','22','Supplement'],
    ['recaDuMCQGIlflBqQ','2026-09-06','7:00 AM','Gabapentin','23','Medication'],
    ['recNtQ6R5QTKVQYng','2026-09-06','8:00 AM','Creatine','24','Supplement'],
    ['rectym88Iu2hWWSU7','2026-09-06','9:00 AM','Coffee break (24 hrs)','25','Race'],
    ['rec5qC1IoJQ9hSVTm','2026-09-06','10:00 AM','Sandwich','26','Food']
  ].map(([id,date,time,name,loop,category])=>({id,fields:{Date:date,Time:time,Name:name,'Loop #':loop?Number(loop):null,Category:category,Status:'Not started',Done:false}}));
  const fmt=sec=>{sec=Math.max(0,Math.floor(sec));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`};
  const tick=()=>{
    if(!window.stateForFailsafe){
      try{window.stateForFailsafe=state}catch(e){return}
    }
    let changed=false;
    if(!state.race){state.race=FALLBACK;changed=true}
    if(!Array.isArray(state.plan)||!state.plan.length){state.plan=PLAN.slice();changed=true}
    if(changed){try{render()}catch(e){}}
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
