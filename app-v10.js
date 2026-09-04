/* Final gear submit handler: one handler, explicit submit button, clear success/error state. */
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
})();
