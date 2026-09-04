export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({error:"POST only"});

  const env = process.env;
  // This app is intentionally pinned to the shared Backyard Ultra Airtable base.
  // The PAT remains a Vercel secret and is never exposed.
  const BASE = "app9vrf64xM7v4i7w";
  const PAT = env.AIRTABLE_PAT;
  if (!PAT) return res.status(500).json({error:"Vercel environment variable AIRTABLE_PAT is missing."});

  const patInfo = {received:true,startsWithPat:PAT.startsWith("pat"),hasDot:PAT.includes("."),hasWhitespace:PAT!==PAT.trim(),length:PAT.length};
  const tables = {
    race:"tblHqXklgAtVIB6wb",
    loops:"tblME4RgJ0DUpM9Ja",
    reminders:"tbly8LBfSYxsc3jW9",
    plan:"tblCu4PYDG3DE6ZPl",
    runnerLog:"tbl7m6iZcMhP2C315",
    gear:"tblJuTpt1AtiY0fDZ"
  };
  function airtableError(status,message){if(status===401)return new Error(`Airtable rejected AIRTABLE_PAT (401). Safe token check: startsWithPat=${patInfo.startsWithPat}, hasDot=${patInfo.hasDot}, hasWhitespace=${patInfo.hasWhitespace}, length=${patInfo.length}. The token itself is not exposed.`);return new Error(message||`Airtable error ${status}`)}
  async function at(table,method="GET",body){const url=`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`;const r=await fetch(url,{method,headers:{"Authorization":`Bearer ${PAT}`,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));if(!r.ok)throw airtableError(r.status,d.error?.message);return d}
  async function all(table){let out=[],offset="";do{const url=`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}${offset?`?offset=${encodeURIComponent(offset)}`:""}`;const r=await fetch(url,{headers:{"Authorization":`Bearer ${PAT}`}});const d=await r.json().catch(()=>({}));if(!r.ok)throw airtableError(r.status,d.error?.message);out.push(...(d.records||[]));offset=d.offset||""}while(offset);return out}
  async function safeAll(table,errors){try{return await all(table)}catch(e){console.error(`Airtable read failed for ${table}:`,e.message);errors[table]=e.message;return []}}
  async function update(table,id,fields){return at(table,"PATCH",{records:[{id,fields}]})}
  async function create(table,fields){return at(table,"POST",{records:[{fields}]})}
  try{
    const b=req.body||{},action=b.action;
    if(action==="getAll"){
      const errors={};
      const [race,loops,reminders,plan,runnerLog,gear]=await Promise.all([
        safeAll(tables.race,errors),safeAll(tables.loops,errors),safeAll(tables.reminders,errors),safeAll(tables.plan,errors),safeAll(tables.runnerLog,errors),safeAll(tables.gear,errors)
      ]);
      return res.status(200).json({race:race[0]||null,loops,reminders,plan,runnerLog,gear,dataErrors:errors});
    }
    const races=await all(tables.race),race=races[0];if(!race)throw new Error("Race table has no record.");
    if(action==="startRace"){await update(tables.race,race.id,{Status:"Running",["Current Loop"]:1});return res.status(200).json({ok:true})}
    if(action==="resetRace"){await update(tables.race,race.id,{Status:"Not Started",["Current Loop"]:1});return res.status(200).json({ok:true})}
    if(action==="setStatus"){await update(tables.race,race.id,{Status:b.status});return res.status(200).json({ok:true})}
    if(action==="completeLoop"){const cur=Number(race.fields["Current Loop"]||1),dist=Number(race.fields["Loop Distance"]||4.167),start=new Date(race.fields["Start Time"]),ret=new Date(),loopStart=new Date(start.getTime()+(cur-1)*3600000),mins=Math.max(0,Math.round((ret-loopStart)/60000));await create(tables.loops,{"Loop #":cur,"Start Time":loopStart.toISOString(),"Return Time":ret.toISOString(),"Loop Time":`${mins} min`,"Total Miles":Number((cur*dist).toFixed(1)),Notes:"Recorded from Crew Mode"});await update(tables.race,race.id,{"Current Loop":cur+1,Status:"Running"});return res.status(200).json({ok:true})}
    if(action==="saveRunnerLog"){
      const loopNumber=Number(b.loop);
      if(!loopNumber||!b.fields)throw new Error("Runner log is missing its loop number or check-in.");
      const f=b.fields||{};
      const loops=await all(tables.loops);
      if(!loops.some(r=>Number(r.fields?.["Loop #"])===loopNumber))throw new Error(`Loop ${loopNumber} has not been completed yet.`);
      await create(tables.runnerLog,{"Name":`Loop ${loopNumber} — Tom Check-In`,"Loop #":loopNumber,"Time":new Date().toISOString(),"Feeling":f.feeling||"","Legs":f.legs||"","Feet":f.feet||"","Hydration":f.hydration||"","Fuel":f.fuel||"","Mental":f.mental||"","Note":String(f.note||"").trim()});
      return res.status(200).json({ok:true});
    }
    if(action==="saveGear"){
      const f=b.fields||{};
      if(!String(f.item||"").trim())throw new Error("Gear item is required.");
      await create(tables.gear,{"Item":String(f.item).trim(),"Category":f.category||"Other","Person":f.person||"Both","Quantity":Number(f.quantity||1),"Status":f.status||"Ready","Location":f.location||"","Notes":String(f.notes||"").trim(),"Done":!!f.done});
      return res.status(200).json({ok:true});
    }
    if(action==="setGearDone"){await update(tables.gear,b.id,{Done:!!b.done,Status:b.done?"In Use":"Ready"});return res.status(200).json({ok:true})}
    if(action==="setReminderDone"){await update(tables.reminders,b.id,{Done:!!b.done});return res.status(200).json({ok:true})}
    if(action==="setPlanDone"){await update(tables.plan,b.id,{Done:!!b.done,Status:b.done?"Done":"Not started"});return res.status(200).json({ok:true})}
    if(action==="createReminder"){await create(tables.reminders,b.fields||{});return res.status(200).json({ok:true})}
    if(action==="createPlan"){await create(tables.plan,b.fields||{});return res.status(200).json({ok:true})}
    throw new Error("Unknown action");
  }catch(e){return res.status(500).json({error:e.message||String(e)})}
}
