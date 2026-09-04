/* Gear form reliability patch. The gear dialog is a method=dialog form, so capture submit before the legacy handler and use the exact Airtable field payload. */
(function(){
  const form=document.getElementById('gearForm');
  if(!form)return;
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    const f=new FormData(form);
    const item=String(f.get('item')||'').trim();
    if(!item){showError(new Error('Gear item is required.'));return;}
    const btn=form.querySelector('button[type="submit"]');
    if(btn){btn.disabled=true;btn.textContent='SAVING…';}
    try{
      const result=await api('saveGear',{fields:{
        item:item,
        category:String(f.get('category')||'Other'),
        person:String(f.get('person')||'Both'),
        quantity:Number(f.get('quantity')||1),
        status:String(f.get('status')||'Ready'),
        location:String(f.get('location')||''),
        notes:String(f.get('notes')||'').trim(),
        done:false
      }});
      if(!result || result.error) throw new Error(result?.error||'Gear was not saved.');
      form.reset();
      document.getElementById('gearDialog')?.close();
      await load();
    }catch(err){
      showError(err);
    }finally{
      if(btn){btn.disabled=false;btn.textContent='ADD GEAR';}
    }
  },true);
})();
