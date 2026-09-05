export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({error:"POST only"});

  const BASE = "app9vrf64xM7v4i7w";
  const PAT = process.env.AIRTABLE_PAT;
  if (!PAT) return res.status(500).json({error:"Vercel environment variable AIRTABLE_PAT is missing."});

  async function at(table,method="GET",body){const url=`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`;const r=await fetch(url,{method,headers:{"Authorization":`Bearer ${PAT}`,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||`Airtable error ${r.status}`);return d}
  async function all(table){let out=[],offset="";do{const url=`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}${offset?`?offset=${encodeURIComponent(offset)}`:""}`;const r=await fetch(url,{headers:{"Authorization":`Bearer ${PAT}`}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||`Airtable error ${r.status}`);out.push(...(d.records||[]));offset=d.offset||""}while(offset);return out}
  async function update(table,id,fields){return at(table,"PATCH",{records:[{id,fields}]})}
  async function create(table,fields){return at(table,"POST",{records:[{fields}]})}

  const tables={race:"tblHqXklgAtVIB6wb",loops:"tblME4RgJ0DUpM9Ja",reminders:"tbly8LBfSYxsc3jW9",plan:"tblCu4PYDG3DE6ZPl",runnerLog:"tbl7m6iZcMhP2C315",gear:"tblJuTpt1AtiY0fDZ"};
  try{
    const b=req.body||{},action=b.action;
    if(action==="getAll"){
      const entries=await Promise.all(Object.entries(tables).map(async([key,table])=>{try{return [key,await all(table),null]}catch(e){console.error(`Airtable ${key} read failed:`,e);return [key,[],e.message||String(e)]}}));
      const data=Object.fromEntries(entries.map(([key,value])=>[key,value]));
      const dataErrors=Object.fromEntries(entries.filter(([,value,error])=>error).map(([key,,error])=>[key,error]));
      const race=data.race?.[0]||null;
      // The race starts on the scheduled hour even if nobody taps Start Race.
      if(race && race.fields?.Status==="Not Started" && race.fields?.["Start Time"]){
        const start=new Date(race.fields["Start Time"]);
        if(!Number.isNaN(start.getTime()) && Date.now()>=start.getTime()){
          await update(tables.race,race.id,{Status:"Running",["Current Loop"]:1});
          race.fields.Status="Running";
          race.fields["Current Loop"]=1;
        }
      }
      return res.status(200).json({race,loops:data.loops||[],reminders:data.reminders||[],plan:data.plan||[],runnerLog:data.runnerLog||[],gear:data.gear||[],dataErrors});
    }
    const races=await all(tables.race),race=races[0];if(!race)throw new Error("Race table has no record.");
    if(action==="startRace"){await update(tables.race,race.id,{Status:"Running",["Current Loop"]:1});return res.status(200).json({ok:true})}
    if(action==="resetRace"){await update(tables.race,race.id,{Status:"Not Started",["Current Loop"]:1});return res.status(200).json({ok:true})}
    if(action==="setStatus"){await update(tables.race,race.id,{Status:b.status});return res.status(200).json({ok:true})}
    if(action==="completeLoop"){const cur=Number(race.fields["Current Loop"]||1),dist=Number(race.fields["Loop Distance"]||4.167),start=new Date(race.fields["Start Time"]),ret=new Date(),loopStart=new Date(start.getTime()+(cur-1)*3600000),mins=Math.max(0,Math.round((ret-loopStart)/60000));await create(tables.loops,{"Loop #":cur,"Start Time":loopStart.toISOString(),"Return Time":ret.toISOString(),"Loop Time":`${mins} min`,"Total Miles":Number((cur*dist).toFixed(1)),Notes:"Recorded from Crew Mode"});await update(tables.race,race.id,{"Current Loop":cur+1,Status:"Running"});return res.status(200).json({ok:true})}
    if(action==="saveRunnerLog"){const loopNumber=Number(b.loop),f=b.fields||{};if(!loopNumber||!b.fields)throw new Error("Runner log is missing its loop number or check-in.");const loops=await all(tables.loops);if(!loops.some(r=>Number(r.fields?.["Loop #"])===loopNumber))throw new Error(`Loop ${loopNumber} has not been completed yet.`);await create(tables.runnerLog,{"Name":`Loop ${loopNumber} — Tom Check-In`,"Loop #":loopNumber,"Time":new Date().toISOString(),"Feeling":f.feeling||"","Legs":f.legs||"","Feet":f.feet||"","Hydration":f.hydration||"","Fuel":f.fuel||"","Mental":f.mental||"","Note":String(f.note||"").trim()});return res.status(200).json({ok:true})}
    if(action==="saveGear"){const f=b.fields||{},item=String(f.item||"").trim();if(!item)throw new Error("Gear item is required.");await create(tables.gear,{"Item":item,"Category":f.category||"Other","Person":f.person||"Both","How Many":Number(f.quantity||1),"Status":f.status||"Ready","Location":f.location||"","Notes":String(f.notes||"").trim(),"Done":!!f.done});return res.status(200).json({ok:true})}
    if(action==="setGearDone"){await update(tables.gear,b.id,{Done:!!b.done,Status:b.done?"In Use":"Ready"});return res.status(200).json({ok:true})}
    if(action==="setReminderDone"){await update(tables.reminders,b.id,{Done:!!b.done});return res.status(200).json({ok:true})}
    if(action==="setPlanDone"){await update(tables.plan,b.id,{Done:!!b.done,Status:b.done?"Done":"Not started"});return res.status(200).json({ok:true})}
    if(action==="createReminder"){await create(tables.reminders,b.fields||{});return res.status(200).json({ok:true})}
    if(action==="createPlan"){await create(tables.plan,b.fields||{});return res.status(200).json({ok:true})}
    throw new Error("Unknown action");
  }catch(e){return res.status(500).json({error:e.message||String(e)})}
}