const baseRender=render;
function render(){baseRender();
  const card=document.querySelector('.race-card');
  if(card){card.classList.remove('warn3','warn2','warn1'); const status=state.race?.fields?.Status||'Not Started'; const start=state.race?.fields?.['Start Time']?new Date(state.race.fields['Start Time']):null; let loop=Number(state.race?.fields?.['Current Loop']||1); if(status==='Running'&&start) loop=Math.max(loop,Math.floor((Date.now()-start)/3600000)+1); let rem=0; if(status==='Running'&&start) rem=Math.max(0,Math.floor((start.getTime()+loop*3600000-Date.now())/1000)); if(status==='Running'){if(rem<=60&&rem>0)card.classList.add('warn1'); else if(rem<=120)card.classList.add('warn2'); else if(rem<=180)card.classList.add('warn3');}}
}
const originalMilestones=renderMilestones;
renderMilestones=function(current,dist){
  const el=$('milestoneList'); if(!el)return;
  const ms=[25,50,75,100], miles=(current-1)*dist, next=ms.find(m=>m>miles);
  el.innerHTML=`<div class="milestone-strip">${ms.map(m=>{const hit=miles>=m,active=!hit&&m===next;return `<div class="mile-stop ${hit?'hit':''} ${active?'active':''}"><b>${m}</b><span>MI</span><i>${hit?'✓':active?'NEXT':''}</i></div>`}).join('')}</div><div class="milestone-caption">${next?`Next milestone: <b>${next} miles</b> · Loop ${Math.ceil(next/dist)}`:'100+ miles — keep going'}</div>`;
  set('milestoneNext',next?`${next} mi next`:'100+ mi');
};

document.addEventListener('DOMContentLoaded',()=>{
  const nextCard=document.querySelector('.next-card');
  if(nextCard){nextCard.addEventListener('click',()=>{switchTab('planTab');setTimeout(()=>{const first=document.querySelector('#planList .planRow');first?.scrollIntoView({behavior:'smooth',block:'center'});},80);});}
});
