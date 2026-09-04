/* Gear + milestone presentation polish. Keep gear data sourced from Airtable through the existing API. */
(function(){
  const escValue=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const gearAccent=category=>{
    const c=String(category||'Other').toLowerCase();
    if(c==='shoes')return '#9b5cff';
    if(c==='clothing')return '#20b8ff';
    if(c==='lighting')return '#6678bd';
    if(c==='fuel')return '#ffb51b';
    if(c==='hydration')return '#20b8ff';
    if(c==='recovery')return '#14b8a6';
    if(c==='tools')return '#24a8ff';
    return '#8d45ff';
  };
  function renderGear(){
    const el=document.getElementById('gearList');
    if(!el)return;
    const items=Array.isArray(state.gear)?state.gear:[];
    if(!items.length){el.innerHTML='<div class="gear-empty">No gear in Airtable yet.</div>'}
    else{
      const sorted=items.slice().sort((a,b)=>{
        const ad=String(a.fields?.Done===true),bd=String(b.fields?.Done===true);
        if(ad!==bd)return ad.localeCompare(bd);
        return String(a.fields?.Category||'Other').localeCompare(String(b.fields?.Category||'Other'))||String(a.fields?.Item||'').localeCompare(String(b.fields?.Item||''));
      });
      el.innerHTML=sorted.map(g=>{
        const f=g.fields||{},done=f.Done===true,category=String(f.Category||'Other'),accent=gearAccent(category);
        return `<div class="gear-item ${done?'done':''}" style="--gear-accent:${accent}">
          <div class="gear-copy"><div class="gear-name">${escValue(f.Item||'Gear')}</div><div class="gear-meta">${escValue(category)} · ${escValue(f.Person||'Both')}${f.Location?` · ${escValue(f.Location)}`:''}${f['How Many']?` · Qty ${escValue(f['How Many'])}`:''}</div>${f.Notes?`<div class="gear-note">${escValue(f.Notes)}</div>`:''}</div>
          <button class="gear-action" data-gear-id="${escValue(g.id)}">${done?'UNDO':'READY'}</button>
        </div>`;
      }).join('');
      el.querySelectorAll('[data-gear-id]').forEach(btn=>btn.addEventListener('click',async()=>{
        const g=items.find(x=>x.id===btn.dataset.gearId),done=g?.fields?.Done===true;
        if(!g)return;
        btn.disabled=true;
        try{await api('setGearDone',{id:g.id,done:!done});await load()}catch(e){showError(e)}finally{btn.disabled=false}
      }));
    }
    const cur=document.getElementById('currentGear');
    if(cur){
      const active=items.filter(g=>g.fields?.Done!==true&&g.fields?.Status!=='Packed');
      cur.innerHTML=active.length?active.slice(0,8).map(g=>{const f=g.fields||{};return `<div class="current-gear"><b>${escValue(f.Item||'Gear')}</b><span>${escValue(f.Person||'Both')} · ${escValue(f.Status||'Ready')}</span></div>`}).join(''):'<div class="muted">Add the current kit above.</div>';
    }
  }
  function renderMilestones(current,dist){
    const el=document.getElementById('milestoneList');
    if(!el)return;
    const miles=(Number(current||1)-1)*Number(dist||4.167);
    const targets=[50,100,150,200];
    const next=targets.find(x=>x>miles)||Math.ceil((miles+50)/50)*50;
    const nextEl=document.getElementById('milestoneNext');if(nextEl)nextEl.textContent=`${next} mi next`;
    el.innerHTML=targets.map(t=>{
      const hit=miles>=t,loops=Math.ceil(t/Number(dist||4.167));
      return `<div class="milestone ${hit?'hit':''}"><span>${hit?'✓':'○'}</span><div><b>${t} MILES</b><small>≈ LOOP ${loops}</small></div></div>`;
    }).join('');
  }
  window.renderGear=renderGear;
  window.renderMilestones=renderMilestones;
  setTimeout(()=>{try{renderGear();const r=state?.race?.fields||{};renderMilestones(Number(r['Current Loop']||1),Number(r['Loop Distance']||4.167))}catch(e){}},0);
})();
