/* LIVE > UP NEXT: update only when the underlying next item changes. */
(function(){
  const API=window.APP_CONFIG?.API_URL||'/api/race';
  function dateTime(f){if(!f.Date)return null;const m=String(f.Time||'').trim().toUpperCase().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);if(!m)return new Date(f.Date+'T23:59:59');let h=+m[1],n=+(m[2]||0);if(m[3]==='PM'&&h<12)h+=12;if(m[3]==='AM'&&h===12)h=0;return new Date(`${f.Date}T${String(h).padStart(2,'0')}:${String(n).padStart(2,'0')}:00`);}
  function signature(x){const f=x?.fields||{};return [x?.id,f.Name||f.Item||'',f.Date||'',f.Time||'',f['Loop #']||'',f.Category||'',f.Done===true?'1':'0',f.Status||''].join('|');}
  let last='';
  async function refreshNext(){try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'getAll'})});const d=await r.json();if(!r.ok||d.error)return;const plan=(d.plan||[]).filter(x=>x.fields?.Date),now=new Date();const pending=plan.filter(x=>x.fields.Done!==true&&x.fields.Status!=='Done');const upcoming=pending.filter(x=>{const dt=dateTime(x.fields);return dt&&dt.getTime()>=now.getTime()-60000}).sort((a,b)=>dateTime(a.fields)-dateTime(b.fields));const next=upcoming[0],sig=signature(next);if(sig===last)return;last=sig;const title=document.getElementById('nextPlan'),meta=document.getElementById('nextMeta');if(!title||!meta)return;if(!next){title.textContent='Nothing pending';meta.textContent='Race plan is caught up.';return;}const f=next.fields;title.textContent=f.Name||f.Item||'Plan item';meta.textContent=`${f.Time||'—'}${f['Loop #']?` · Loop ${f['Loop #']}`:''}${f.Category?` · ${f.Category}`:''}`;}catch(e){console.warn('Up Next refresh failed',e)}}
  refreshNext();setInterval(refreshNext,10000);
})();
