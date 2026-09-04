/* UI patch: warning state, simpler milestone replacement, and Up Next tap behavior. */
const baseRender = render;
let renderingV4 = false;
function render(){
  if(renderingV4)return;
  renderingV4=true;
  try { baseRender(); } finally { renderingV4=false; }
  const card=document.querySelector('.race-card');
  if(card){
    card.classList.remove('warn3','warn2','warn1');
    const status=state.race?.fields?.Status||'Not Started';
    const start=state.race?.fields?.['Start Time']?new Date(state.race.fields['Start Time']):null;
    let loop=Number(state.race?.fields?.['Current Loop']||1);
    if(status==='Running'&&start) loop=Math.max(loop,Math.floor((Date.now()-start)/3600000)+1);
    let rem=0;
    if(status==='Running'&&start) rem=Math.max(0,Math.floor((start.getTime()+loop*3600000-Date.now())/1000));
    if(status==='Running'){
      if(rem<=60&&rem>0) card.classList.add('warn1');
      else if(rem<=120) card.classList.add('warn2');
      else if(rem<=180) card.classList.add('warn3');
    }
  }
}

renderMilestones=function(current,dist){
  const el=$('milestoneList'); if(!el)return;
  const miles=(current-1)*dist;
  const next=[25,50,75,100].find(m=>m>miles);
  const remaining=next?Math.max(0,next-miles):0;
  el.innerHTML=`<div class="race-progress-summary"><div class="rps-main"><span>RACE PROGRESS</span><strong>${miles.toFixed(1)} MI</strong></div><div class="rps-next"><span>NEXT GOAL</span><b>${next?next+' MI':'100+ MI'}</b>${next?`<small>${remaining.toFixed(1)} MI TO GO</small>`:'<small>KEEP GOING</small>'}</div></div>`;
  set('milestoneNext',next?`${remaining.toFixed(1)} mi to ${next}`:'100+ mi');
};

document.addEventListener('DOMContentLoaded',()=>{
  const nextCard=document.querySelector('.next-card');
  if(nextCard) nextCard.addEventListener('click',()=>{
    switchTab('planTab');
    setTimeout(()=>document.querySelector('#planList .planRow')?.scrollIntoView({behavior:'smooth',block:'center'}),80);
  });
});
