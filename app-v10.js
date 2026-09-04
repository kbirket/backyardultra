/* Final gear submit handler + restore the milestone renderer used by app-v3. */
function renderMilestones(current,dist){const el=document.getElementById('milestoneList');const miles=[25,50,75,100];if(el)el.innerHTML=miles.map(m=>{const hit=((current-1)*dist)>=m;return `<div class="milestone ${hit?'hit':''}"><b>${m}</b><span>MI</span><i>${hit?'✓':''}</i></div>`}).join('');const next=miles.find(m=>((current-1)*dist)<m);const nextEl=document.getElementById('milestoneNext');if(nextEl)nextEl.textContent=next?`${next} mi next`:'100+ mi';const err=document.getElementById('error');if(err){err.textContent='';err.classList.add('hidden')}}
(function(){
  const form=document.getElementById('gearForm');
  if(!form)return;
  form.onsubmit=async function(e){
    e.preventDefault();
    e.stopPropagation();
    const f=new FormData(form),item=String(f.get('item')||'').trim();
    if(!item){showError(new Error('Enter a gear item first.'));return false;}
    const btn=form.querySelector('button[value="default"]')||form.querySelector('button');
    if(btn){btn.disabled=true;btn.textContent='SAVING…';}
    try{
      await api('saveGear',{fields:{item,category:String(f.get('category')||'Other'),person:String(f.get('person')||'Both'),quantity:Number(f.get('quantity')||1),status:String(f.get('status')||'Ready'),location:String(f.get('location')||''),notes:String(f.get('notes')||''),done:false}});
      form.reset();
      document.getElementById('gearDialog')?.close();
      await load();
    }catch(err){showError(err)}
    finally{if(btn){btn.disabled=false;btn.textContent='ADD GEAR';}}
    return false;
  };
  try{renderMilestones(Number(document.getElementById('currentLoop')?.textContent||1),4.167)}catch(e){}
})();
