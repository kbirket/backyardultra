/* Final gear renderer: fetch Airtable-backed gear directly so it cannot be hidden by legacy renderers. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const accent=c=>({Shoes:'#9b5cff',Clothing:'#20b8ff',Lighting:'#6678bd',Fuel:'#ffb51b',Hydration:'#20b8ff',Recovery:'#14b8a6',Tools:'#24a8ff'})[c]||'#8d45ff';
  const css=document.createElement('style');css.textContent='.gear-item{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:15px 12px 15px 16px;border-bottom:1px solid #1a2944;background:linear-gradient(90deg,rgba(9,20,39,.98),rgba(7,15,29,.98))}.gear-item:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--gear-accent,#8d45ff)}.gear-item.done{opacity:.48}.gear-item.done .gear-name{text-decoration:line-through}.gear-name{font-size:15px;font-weight:850;color:#f7f9ff}.gear-meta{font-size:10px;color:#8294b8;margin-top:5px}.gear-note{font-size:10px;color:#6f83aa;margin-top:4px}.gear-action{border:1px solid var(--gear-accent,#8d45ff);background:rgba(141,69,255,.1);color:#d8c8ff;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:900}.gear-empty{padding:28px 16px;text-align:center;border:1px dashed #314365;border-radius:15px;color:#8292b1;background:#081426}';document.head.appendChild(css);
  async function loadGear(){
    const el=document.getElementById('gearList');if(!el)return;
    try{
      const r=await fetch('/api/race',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'getAll'})});
      const d=await r.json();if(!r.ok||d.error)throw Error(d.error||`Request failed (${r.status})`);
      const items=Array.isArray(d.gear)?d.gear:[];
      if(!items.length){el.innerHTML='<div class="gear-empty">No gear in Airtable yet.</div>';return}
      const rows=items.slice().sort((a,b)=>Number(a.fields?.Done===true)-Number(b.fields?.Done===true)||String(a.fields?.Category||'Other').localeCompare(String(b.fields?.Category||'Other'))||String(a.fields?.Item||'').localeCompare(String(b.fields?.Item||'')));
      el.innerHTML=rows.map(g=>{const f=g.fields||{},cat=String(f.Category||'Other'),done=f.Done===true;return `<div class="gear-item ${done?'done':''}" style="--gear-accent:${accent(cat)}"><div class="gear-copy"><div class="gear-name">${esc(f.Item||'Gear')}</div><div class="gear-meta">${esc(cat)} · ${esc(f.Person||'Both')}${f.Location?` · ${esc(f.Location)}`:''}${f['How Many']?` · Qty ${esc(f['How Many'])}`:''}</div>${f.Notes?`<div class="gear-note">${esc(f.Notes)}</div>`:''}</div><button class="gear-action" data-gear-id="${esc(g.id)}">${done?'UNDO':'READY'}</button></div>`}).join('');
      el.querySelectorAll('[data-gear-id]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.gearId;btn.disabled=true;try{const r=await fetch('/api/race',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'setGearDone',id,done:false})});const d=await r.json();if(!r.ok||d.error)throw Error(d.error||'Could not update gear');await loadGear()}catch(e){console.error(e)}finally{btn.disabled=false}});
    }catch(e){console.error('Gear load failed',e);el.innerHTML='<div class="gear-empty">Gear is temporarily unavailable. Refresh to retry.</div>'}
  }
  setTimeout(loadGear,150);setInterval(loadGear,5000);
})();
