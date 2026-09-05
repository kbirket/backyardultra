/* Keep LIVE > UP NEXT tied to the actual race clock, not checkbox state. */
(function(){
  const API=window.APP_CONFIG?.API_URL||'/api/race';
  const timeKey=v=>{const m=String(v||'').trim().toUpperCase().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);if(!m)return 999999;let h=+m[1],n=+(m[2]||0);if(m[3]==='PM'&&h<12)h+=12;if(m[3]==='AM'&&h===12)h=0;return h*60+n};
  function dateTime(f){
    if(!f.Date)return null;
    const m=String(f.Time||'').trim().toUpperCase().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
    if(!m)return new Date(f.Date+'T23:59:59');
    let h=+m[1],n=+(m[2]||0);if(m[3]==='PM'&&h<12)h+=12;if(m[3]==='AM'&&h===12)h=0;
    return new Date(`${f.Date}T${String(h).padStart(2,'0')}:${String(n).padStart(2,'0')}:00`);
  }
  async function refreshNext(){
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'getAll'})});
      const d=await r.json();if(!r.ok||d.error)return;
      const plan=(d.plan||[]).map(x=>({id:x.id,fields:x.fields||{}})).filter(x=>x.fields.Date);
      const now=new Date();
      const pending=plan.filter(x=>x.fields.Done!==true&&x.fields.Status!=='Done');
      const upcoming=pending.filter(x=>{const dt=dateTime(x.fields);return dt&&dt.getTime()>=now.getTime()-60000}).sort((a,b)=>dateTime(a.fields)-dateTime(b.fields));
      const next=upcoming[0];
      const title=document.getElementById('nextPlan'),meta=document.getElementById('nextMeta');
      if(!title||!meta)return;
      if(!next){title.textContent='Nothing pending';meta.textContent='Race plan is caught up.';return}
      const f=next.fields,loop=f['Loop #']?` · Loop ${f['Loop #']}`:'';
      title.textContent=f.Name||f.Item||'Plan item';
      meta.textContent=`${f.Time||'—'}${loop}${f.Category?` · ${f.Category}`:''}`;
    }catch(e){console.warn('Up Next refresh failed',e)}
  }
  refreshNext();
  setInterval(refreshNext,5000);
})();
