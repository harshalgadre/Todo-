// Daylight Couple Planner — local-only demo authentication.
// IMPORTANT: credentials in a browser app are visible to anyone who can inspect its files.
// Do not reuse these passwords for email, banking, or other important accounts.
const ACCOUNTS = [
  { phone: "8879720125", password: "harshal", id: "harshal", name: "Harshal", partnerId: "gauri", partnerName: "Gauri" },
  { phone: "+918591541286", password: "gauri", id: "gauri", name: "Gauri", partnerId: "harshal", partnerName: "Harshal" }
];
const STORAGE_KEY = "daylight_couple_v2_data";
const SESSION_KEY = "daylight_couple_v2_session";
const $ = s => document.querySelector(s);
const isoToday = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const addDays = (iso,n) => { const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const dateFmt = (iso,opts={weekday:"long",day:"numeric",month:"long"}) => new Date(iso+"T12:00:00").toLocaleDateString("en-IN",opts);
const mins = t => { const [h,m]=t.split(":").map(Number); return h*60+m; };
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initial = s => (s||"?").trim()[0].toUpperCase();
let store, user, selectedDate=isoToday(), mode="week", view="planner";

function starterData(){
  return {
    version:2,
    events:[
      {id:"e1",title:"Focus time",owner:"harshal",date:isoToday(),start:"09:00",end:"10:30",note:"Personal work"},
      {id:"e2",title:"Study / work",owner:"gauri",date:isoToday(),start:"10:00",end:"12:30",note:""},
      {id:"e3",title:"Lunch together",owner:"shared",date:isoToday(),start:"13:00",end:"14:00",note:"Our time"},
      {id:"e4",title:"Project time",owner:"harshal",date:isoToday(),start:"16:00",end:"17:30",note:""},
      {id:"e5",title:"Evening call",owner:"shared",date:isoToday(),start:"20:00",end:"20:45",note:""}
    ],
    tasks:[
      {id:"t1",title:"Finish important work",owner:"harshal",date:isoToday(),priority:"Important",done:false},
      {id:"t2",title:"Check messages",owner:"harshal",date:isoToday(),priority:"Normal",done:false},
      {id:"t3",title:"Complete assignments",owner:"gauri",date:isoToday(),priority:"Important",done:false},
      {id:"t4",title:"Plan the weekend",owner:"shared",date:isoToday(),priority:"Whenever",done:false}
    ]
  };
}
function loadStore(){
  try{const raw=localStorage.getItem(STORAGE_KEY);store=raw?JSON.parse(raw):starterData();}
  catch(e){store=starterData();}
  if(!store||!Array.isArray(store.events)||!Array.isArray(store.tasks))store=starterData();
  saveStore();
}
function saveStore(){localStorage.setItem(STORAGE_KEY,JSON.stringify(store));}
function ownerName(owner){if(owner==="shared")return "Together";return ACCOUNTS.find(a=>a.id===owner)?.name||owner;}
function ownerLabel(owner){return owner==="shared"?"Together":owner===user.id?"You":ownerName(owner);}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200);}

function login(phone,password){
  const normalPhone=phone.replace(/[\s()-]/g,"");
  return ACCOUNTS.find(a=>a.phone.replace(/[\s()-]/g,"")===normalPhone && a.password===password);
}
$("#loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const found=login($("#phone").value.trim(),$("#password").value);
  if(!found){$("#loginError").textContent="Phone number or password is incorrect.";return;}
  user=found;sessionStorage.setItem(SESSION_KEY,user.id);$("#loginError").textContent="";
  $("#loginScreen").classList.add("hidden");$("#appScreen").classList.remove("hidden");render();
});
function logout(){user=null;sessionStorage.removeItem(SESSION_KEY);$("#appScreen").classList.add("hidden");$("#loginScreen").classList.remove("hidden");$("#password").value="";}
$("#logoutBtn").onclick=logout;
function tryRestoreSession(){const id=sessionStorage.getItem(SESSION_KEY);user=ACCOUNTS.find(a=>a.id===id);if(user){$("#loginScreen").classList.add("hidden");$("#appScreen").classList.remove("hidden");render();}}
loadStore();tryRestoreSession();

function render(){
  const partner=ACCOUNTS.find(a=>a.id===user.partnerId);
  $("#userName").textContent=user.name;$("#otherName").textContent=partner.name;
  $("#userAvatar").textContent=initial(user.name);$("#otherAvatar").textContent=initial(partner.name);
  $("#legendMe").textContent=user.name;$("#legendPartner").textContent=partner.name;
  $("#coupleNames").textContent=user.name+" & "+partner.name;$("#coupleInitials").textContent=initial(user.name)+" + "+initial(partner.name);
  $("#dateLabel").textContent=dateFmt(selectedDate);
  $("#welcomeLine").textContent=view==="couple"?"YOUR SHARED LITTLE SPACE":"A LITTLE SPACE FOR YOUR DAY";
  $("#pageTitle").textContent=view==="tasks"?"Small steps add up.":view==="couple"?"Together, at a glance.":"Make today count.";
  $("#calendarHeading").textContent=view==="couple"?"Your shared week":"Your week at a glance";
  document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("selected",b.dataset.mode===mode));
  renderWeek();renderTimeline();renderTasks();renderAvailability();renderStats();
}
function renderWeek(){
  const start=mode==="week"?addDays(selectedDate,-((new Date(selectedDate+"T12:00:00").getDay()+6)%7)):selectedDate;
  const count=mode==="week"?7:1;const strip=$("#weekStrip");strip.innerHTML="";
  for(let i=0;i<count;i++){const d=addDays(start,i),dt=new Date(d+"T12:00:00"),b=document.createElement("button");b.className="day"+(d===selectedDate?" selected":"")+(d===isoToday()?" today":"");b.innerHTML=`<span>${dt.toLocaleDateString("en-IN",{weekday:"short"})}</span><b>${dt.getDate()}</b>`;b.onclick=()=>{selectedDate=d;render();};strip.append(b);}
}
function renderTimeline(){
  const timeline=$("#timeline");timeline.innerHTML="";
  const events=store.events.filter(e=>e.date===selectedDate).sort((a,b)=>a.start.localeCompare(b.start));
  for(let h=7;h<=21;h++){
    const row=document.createElement("div");row.className="time-row";
    const label=document.createElement("div");label.className="time-label";label.textContent=String(h).padStart(2,"0")+":00";
    const cell=document.createElement("div");cell.className="time-cell";
    events.filter(e=>Math.floor(mins(e.start)/60)===h).forEach(e=>{
      const card=document.createElement("div");card.className="event "+(e.owner==="shared"?"shared":e.owner===user.id?"me":"partner");
      card.innerHTML=`<div><h4>${esc(e.title)}</h4><p>${e.start}–${e.end}${e.note?" · "+esc(e.note):""}</p></div><span class="tag">${ownerLabel(e.owner)}</span><button aria-label="Delete event" title="Delete event">×</button>`;
      card.querySelector("button").onclick=()=>{if(!confirm("Delete this plan?"))return;store.events=store.events.filter(x=>x.id!==e.id);saveStore();render();toast("Plan deleted");};cell.append(card);
    });row.append(label,cell);timeline.append(row);
  }
  if(!events.length)timeline.innerHTML='<p class="hint">Nothing planned yet. Add a plan to shape the day.</p>';
}
function renderTasks(){
  const query=$("#search").value.toLowerCase();
  const tasks=store.tasks.filter(t=>t.date===selectedDate&&(!query||t.title.toLowerCase().includes(query)));
  const list=$("#taskList");list.innerHTML="";
  if(!tasks.length){list.innerHTML='<p class="hint">No tasks for this day. Add one whenever you're ready.</p>';return;}
  tasks.forEach(t=>{
    const el=document.createElement("div");el.className="task"+(t.done?" done":"");
    el.innerHTML=`<input type="checkbox" ${t.done?"checked":""} aria-label="Complete task"><div class="task-main"><div class="task-title">${esc(t.title)}</div><div class="task-meta">${esc(t.priority)} · ${esc(ownerLabel(t.owner))}</div></div><span class="owner-tag">${t.owner==="shared"?"Both":t.owner===user.id?"Mine":"Partner"}</span><button class="x" aria-label="Delete task">×</button>`;
    el.querySelector('input').onchange=e=>{t.done=e.target.checked;saveStore();render();};
    el.querySelector("button").onclick=()=>{if(!confirm("Delete this task?"))return;store.tasks=store.tasks.filter(x=>x.id!==t.id);saveStore();render();};
    list.append(el);
  });
}
function renderAvailability(){
  const events=store.events.filter(e=>e.date===selectedDate);
  const busyMe=events.filter(e=>e.owner===user.id||e.owner==="shared");
  const busyPartner=events.filter(e=>e.owner===user.partnerId||e.owner==="shared");
  const allBusy=[...busyMe,...busyPartner].sort((a,b)=>a.start.localeCompare(b.start));
  function gaps(items){let cursor=480,out=[];for(const e of items.sort((a,b)=>a.start.localeCompare(b.start))){const s=mins(e.start),end=mins(e.end);if(s-cursor>=60)out.push([cursor,s]);cursor=Math.max(cursor,end);}if(1200-cursor>=60)out.push([cursor,1200]);return out;}
  const fmt=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
  const me=gaps(busyMe),partner=gaps(busyPartner),both=gaps(allBusy),first=both[0];
  $("#availability").innerHTML=`<div class="avail-row"><b>${esc(user.name)}</b><span class="free-pill">${me.length?me.map(g=>fmt(g[0])).join(", ")+"+": "No 1-hour gap"}</span></div><div class="avail-row"><b>${esc(ownerName(user.partnerId))}</b><span class="free-pill">${partner.length?partner.map(g=>fmt(g[0])).join(", ")+"+": "No 1-hour gap"}</span></div><div class="avail-row"><b>Both available</b><span class="free-pill">${first?fmt(first[0])+" – "+fmt(first[1]):"No 1-hour gap"}</span></div>`;
}
function renderStats(){
  const tasks=store.tasks.filter(t=>t.date===selectedDate),events=store.events.filter(e=>e.date===selectedDate);
  $("#openCount").textContent=tasks.filter(t=>!t.done).length;
  $("#doneCount").textContent=tasks.filter(t=>t.done).length;
  $("#sharedCount").textContent=events.filter(e=>e.owner==="shared").length;
  const busy=events.filter(e=>e.owner===user.id||e.owner==="shared").sort((a,b)=>a.start.localeCompare(b.start));let cursor=480,free=0;
  busy.forEach(e=>{const s=mins(e.start),end=mins(e.end);if(s>cursor)free+=s-cursor;cursor=Math.max(cursor,end);});free+=Math.max(0,1200-cursor);
  $("#freeCount").textContent=Math.floor(free/60)+"h";
}
function openDialog(id,formId){const form=$("#"+formId);form.reset();form.elements.date.value=selectedDate;$("#"+id).showModal();}
$("#addEventBtn").onclick=()=>openDialog("eventDialog","eventForm");
$("#addTaskBtn").onclick=()=>openDialog("taskDialog","taskForm");
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).close());
$("#eventForm").addEventListener("submit",e=>{
  e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f));
  if(mins(v.end)<=mins(v.start)){toast("End time must be after start time.");return;}
  const owner=v.owner==="me"?user.id:v.owner==="partner"?user.partnerId:"shared";
  store.events.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title:v.title.trim(),owner,date:v.date,start:v.start,end:v.end,note:v.note.trim()});
  saveStore();$("#eventDialog").close();render();toast("Plan saved");
});
$("#taskForm").addEventListener("submit",e=>{
  e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));
  const owner=v.owner==="me"?user.id:v.owner==="partner"?user.partnerId:"shared";
  store.tasks.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title:v.title.trim(),owner,date:v.date,priority:v.priority,done:false});
  saveStore();$("#taskDialog").close();render();toast("Task saved");
});
$("#quickAdd").onclick=()=>{const input=$("#quickTask"),title=input.value.trim();if(!title)return;store.tasks.push({id:String(Date.now()),title,owner:user.id,date:selectedDate,priority:"Normal",done:false});input.value="";saveStore();render();toast("Task added to your list");};
$("#quickTask").addEventListener("keydown",e=>{if(e.key==="Enter")$("#quickAdd").click();});
$("#search").oninput=renderTasks;
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render();});
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{view=b.dataset.view;$("#sidebar").classList.remove("open");render();});
$("#todayBtn").onclick=()=>{selectedDate=isoToday();render();};
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");

$("#exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(store,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="daylight-planner-backup.json";a.click();URL.revokeObjectURL(url);toast("JSON backup downloaded");
};
$("#importFile").onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{const parsed=JSON.parse(await file.text());if(!parsed||!Array.isArray(parsed.events)||!Array.isArray(parsed.tasks))throw new Error("Invalid planner backup");store=parsed;saveStore();render();toast("Backup restored");}
  catch(err){alert("Could not import this JSON file. Please select a Daylight backup.");}
  e.target.value="";
};
