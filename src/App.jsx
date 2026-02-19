import { useState, useEffect, useRef, useCallback } from "react";

// ─── Inject fonts & base CSS ──────────────────────────────────────────
if (!document.getElementById("etp4css")) {
  const l = document.createElement("link");
  l.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap";
  l.rel = "stylesheet"; document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "etp4css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#060b10;font-family:'DM Sans',sans-serif;color:#c8dcea}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:#0b1520}
    ::-webkit-scrollbar-thumb{background:#1c3348;border-radius:2px}
    @keyframes fu{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes bk{0%,100%{opacity:1}50%{opacity:.2}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes sp{0%{opacity:0;transform:scale(.8)}30%{opacity:1;transform:scale(1)}80%{opacity:1}100%{opacity:0}}
    .fu{animation:fu .2s ease both}
    .blink{animation:bk 1.4s infinite}
    .nobar{scrollbar-width:none}.nobar::-webkit-scrollbar{display:none}
    .inp{width:100%;background:rgba(255,255,255,.04);border:1px solid #1c3348;color:#c8dcea;border-radius:6px;padding:9px 11px;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:.15s border-color}
    .inp:focus{border-color:#f0a020}
    .inp option{background:#0c1824}
    .btn{border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;border-radius:6px;transition:.15s all}
    .btn:hover{filter:brightness(1.1)}
    .btn:active{transform:scale(.97)}
    .hrow:hover{background:rgba(255,255,255,.025)}
    .wcard{transition:.18s all;cursor:pointer}
    .wcard:hover{transform:translateY(-2px);border-color:#f0a020!important}
    .svbdg{animation:sp 2.2s ease forwards;pointer-events:none}
  `;
  document.head.appendChild(s);
}

// ─── Palette ─────────────────────────────────────────────────────────
const C = {
  bg:"#060b10", card:"#0b1520", border:"#1c3348",
  amber:"#f0a020", teal:"#00b4d0", red:"#e03040",
  green:"#16a868", violet:"#8050e8",
  text:"#c8dcea", muted:"#3c5a70", dim:"#142030",
};

// ─── Storage – single key, in-memory mirror ───────────────────────────
const SK = "etp4-v1";
let MEM = null;
const BLANK  = () => ({ workspaces:{}, order:[], lastOpen:null });
const EMPTY_WS = () => ({
  profile:{ name:"", title:"Environmental Analyst", facility:"", epaId:"", agency:"", state:"", certs:"" },
  ldar:[], ghg:[], bwon:[], permits:[], incidents:[],
  rcra:[], spcc:[], flare:[], stacks:[], cas:[],
  created:now(), modified:now(),
});

async function loadDB() {
  if (MEM) return MEM;
  try { const r = await window.storage.get(SK); MEM = r ? JSON.parse(r.value) : BLANK(); }
  catch { MEM = BLANK(); }
  return MEM;
}
async function saveDB(data) {
  MEM = data;
  try { await window.storage.set(SK, JSON.stringify(data)); }
  catch(e) { console.error("Save failed:", e); }
}

// ─── Helpers ──────────────────────────────────────────────────────────
function now() { return new Date().toISOString(); }
const uid     = () => `${Date.now()}-${Math.random().toString(36).slice(2,5)}`;
const daysTo  = d  => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;
const fmtN    = v  => (v !== null && v !== "" && !isNaN(parseFloat(v))) ? Number(v).toLocaleString() : "—";
const fmtDT   = iso => iso ? new Date(iso).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

function dlJSON(obj, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], {type:"application/json"}));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => a.remove(), 800);
}
function dlCSV(rows, name) {
  if (!rows.length) { alert("No records to export."); return; }
  const cols = Object.keys(rows[0]).filter(k => !k.startsWith("_"));
  const csv  = [cols.join(","), ...rows.map(r => cols.map(k => `"${String(r[k]??"")}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => a.remove(), 800);
}

// ─── UI atoms ─────────────────────────────────────────────────────────
const BDG = {
  green:  ["rgba(22,168,104,.15)","rgba(22,168,104,.4)","#50d89a"],
  red:    ["rgba(224,48,64,.15)", "rgba(224,48,64,.4)", "#f08080"],
  amber:  ["rgba(240,160,32,.15)","rgba(240,160,32,.4)","#f0c060"],
  teal:   ["rgba(0,180,208,.15)", "rgba(0,180,208,.4)", "#50c8e0"],
  violet: ["rgba(128,80,232,.15)","rgba(128,80,232,.4)","#b090f8"],
  gray:   ["rgba(60,90,112,.2)",  "rgba(60,90,112,.4)", "#6088a0"],
};
const Bdg = ({t,c="gray"}) => {
  const [bg,bd,tx] = BDG[c]||BDG.gray;
  return <span style={{background:bg,border:`1px solid ${bd}`,color:tx,padding:"2px 7px",borderRadius:3,fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{t}</span>;
};
const Kpi = ({label,val,sub,hi,pulse}) => (
  <div className={pulse?"blink":""} style={{background:C.card,border:`1px solid ${hi||C.border}`,borderRadius:8,padding:"12px 14px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:hi||C.dim}}/>
    <p style={{color:C.muted,fontSize:9,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>{label}</p>
    <p style={{color:C.text,fontSize:20,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,lineHeight:1}}>{val ?? <span style={{color:C.muted}}>—</span>}</p>
    {sub && <p style={{color:C.muted,fontSize:10,marginTop:4}}>{sub}</p>}
  </div>
);
const KRow = ({children}) => <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>{children}</div>;
const Card = ({children,style}) => <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:16,...style}}>{children}</div>;
const SH   = ({title,reg,children}) => (
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,gap:10,flexWrap:"wrap"}}>
    <div>
      <p style={{color:C.text,fontSize:13,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,letterSpacing:".04em",textTransform:"uppercase"}}>{title}</p>
      {reg && <p style={{color:C.teal,fontSize:9,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{reg}</p>}
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{children}</div>
  </div>
);
const TH = ({v}) => <th style={{color:C.muted,fontSize:9,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",padding:"6px 10px 6px 0",textAlign:"left",whiteSpace:"nowrap",borderBottom:`1px solid ${C.border}`}}>{v}</th>;
const TD = ({children,mono,color,sm}) => <td style={{padding:"8px 10px 8px 0",color:color||C.text,fontSize:sm?10:12,fontFamily:mono?"'JetBrains Mono',monospace":"'DM Sans',sans-serif",borderBottom:"1px solid rgba(28,51,72,.45)",verticalAlign:"middle",whiteSpace:"nowrap"}}>{children}</td>;
const Bar = ({pct,color=C.teal,h=8}) => <div style={{background:"rgba(255,255,255,.05)",borderRadius:3,height:h,overflow:"hidden"}}><div style={{width:`${Math.min(pct||0,100)}%`,height:"100%",background:color,borderRadius:3,transition:"width .4s"}}/></div>;
const BtnA = ({onClick,children}) => <button className="btn" onClick={onClick} style={{background:C.amber,color:"#000",padding:"7px 14px",fontSize:12}}>{children}</button>;
const BtnS = ({onClick,children}) => <button className="btn" onClick={onClick} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"7px 13px",fontSize:12}}>{children}</button>;
const BtnE = ({onClick}) => <button className="btn" onClick={onClick} title="Edit" style={{background:"rgba(0,180,208,.1)",border:"1px solid rgba(0,180,208,.25)",color:C.teal,padding:"3px 8px",fontSize:11,borderRadius:4}}>✎</button>;
const BtnD = ({onClick}) => <button className="btn" onClick={onClick} title="Delete" style={{background:"rgba(224,48,64,.1)",border:"1px solid rgba(224,48,64,.25)",color:"#f08080",padding:"3px 8px",fontSize:11,borderRadius:4}}>×</button>;
const Empty = ({msg}) => (
  <div style={{padding:"40px 0",textAlign:"center",color:C.muted}}>
    <p style={{fontSize:28,marginBottom:10}}>📭</p>
    <p style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>{msg||"No records yet — click + Add Record to begin."}</p>
  </div>
);
const SaveBadge = ({show}) => show
  ? <span className="svbdg" style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(22,168,104,.15)",border:"1px solid rgba(22,168,104,.3)",color:"#50d89a",padding:"3px 10px",borderRadius:12,fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>✓ SAVED</span>
  : null;

// ─── Modal ────────────────────────────────────────────────────────────
const Modal = ({title,onClose,wide,children}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div className="fu" style={{background:C.card,border:`1px solid ${C.amber}`,borderRadius:10,width:"100%",maxWidth:wide?760:520,maxHeight:"88vh",overflow:"auto",padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
        <p style={{color:C.text,fontSize:13,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,letterSpacing:".04em",textTransform:"uppercase"}}>{title}</p>
        <button className="btn" onClick={onClose} style={{background:"none",color:C.muted,fontSize:22,lineHeight:1,padding:"0 4px"}}>×</button>
      </div>
      {children}
    </div>
  </div>
);
const ConfirmDel = ({msg,onConfirm,onClose}) => (
  <Modal title="Confirm Delete" onClose={onClose}>
    <p style={{color:C.text,fontSize:13,marginBottom:20}}>{msg||"Delete this record permanently?"}</p>
    <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
      <BtnS onClick={onClose}>Cancel</BtnS>
      <button className="btn" onClick={onConfirm} style={{background:"rgba(224,48,64,.18)",border:"1px solid rgba(224,48,64,.4)",color:"#f08080",padding:"8px 18px",fontSize:13}}>Delete</button>
    </div>
  </Modal>
);

// ─── Form helpers ─────────────────────────────────────────────────────
const Fld = ({label,hint,children}) => (
  <div style={{marginBottom:12}}>
    <label style={{color:C.muted,fontSize:9,display:"block",marginBottom:4,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{label}</label>
    {children}
    {hint && <p style={{color:"#253f55",fontSize:9,marginTop:3}}>{hint}</p>}
  </div>
);
const Inp = ({name,value,onChange,type="text",placeholder=""}) =>
  <input className="inp" type={type} name={name} value={value??""} onChange={onChange} placeholder={placeholder}/>;
const Sel = ({name,value,onChange,opts}) => (
  <select className="inp" name={name} value={value??""} onChange={onChange}>
    <option value="">— Select —</option>
    {opts.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);
const G2 = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>{children}</div>;

function useForm(init) {
  const [f, setF] = useState({...init});
  const on = e => setF(p => ({...p, [e.target.name]: e.target.value}));
  return [f, on, setF];
}
const FormFoot = ({onClose,onSave,isEdit}) => (
  <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
    <BtnS onClick={onClose}>Cancel</BtnS>
    <BtnA onClick={onSave}>{isEdit ? "💾 Update" : "💾 Save Record"}</BtnA>
  </div>
);

// ─── Record modal (add & edit) ────────────────────────────────────────
function RecModal({title,fields,defaults,editItem,onClose,onSave}) {
  const [f, on, setF] = useForm(editItem ? {...editItem} : {...defaults});
  useEffect(() => { if (editItem) setF({...editItem}); }, [editItem]);
  const save = () => {
    for (const fd of fields.filter(x => x.req)) {
      if (!f[fd.k] || !String(f[fd.k]).trim()) { alert(`"${fd.label}" is required.`); return; }
    }
    onSave(f);
  };
  const rows = [];
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i+2));
  return (
    <Modal title={editItem ? `Edit — ${title}` : `Add — ${title}`} onClose={onClose} wide={fields.length > 6}>
      {rows.map((row, ri) => (
        <G2 key={ri}>
          {row.map(fd => (
            <Fld key={fd.k} label={fd.label + (fd.req?" *":"")} hint={fd.hint}>
              {fd.opts
                ? <Sel name={fd.k} value={f[fd.k]} onChange={on} opts={fd.opts}/>
                : <Inp name={fd.k} value={f[fd.k]} onChange={on} type={fd.type||"text"} placeholder={fd.ph||""}/>}
            </Fld>
          ))}
        </G2>
      ))}
      <FormFoot onClose={onClose} onSave={save} isEdit={!!editItem}/>
    </Modal>
  );
}

// ─── Central state hook ───────────────────────────────────────────────
function useApp() {
  const [root,   setRoot]  = useState(null);
  const [wsId,   setWsId]  = useState(null);
  const [flash,  setFlash] = useState(false);
  const timer = useRef(null);

  // Load once on mount
  useEffect(() => {
    loadDB().then(data => {
      setRoot(data);
      if (data.lastOpen && data.workspaces[data.lastOpen]) setWsId(data.lastOpen);
    });
  }, []);

  // Persist + flash
  const commit = useCallback(next => {
    setRoot(next);
    saveDB(next);
    setFlash(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(false), 2200);
  }, []);

  // Workspace ops
  const createWs = useCallback(profile => {
    const id = uid(), ws = {...EMPTY_WS(), profile};
    setRoot(prev => {
      const next = {...prev, workspaces:{...prev.workspaces,[id]:ws}, order:[...(prev.order||[]),id], lastOpen:id};
      commit(next); return next;
    });
    setWsId(id);
  }, [commit]);

  const openWs = useCallback(id => {
    setRoot(prev => { const next={...prev,lastOpen:id}; commit(next); return next; });
    setWsId(id);
  }, [commit]);

  const closeWs = useCallback(() => {
    setRoot(prev => { const next={...prev,lastOpen:null}; commit(next); return next; });
    setWsId(null);
  }, [commit]);

  const deleteWs = useCallback(id => {
    setRoot(prev => {
      const ws={...prev.workspaces}; delete ws[id];
      const order=(prev.order||[]).filter(i=>i!==id);
      const lastOpen=prev.lastOpen===id?null:prev.lastOpen;
      const next={...prev,workspaces:ws,order,lastOpen};
      commit(next); return next;
    });
    if (wsId===id) setWsId(null);
  }, [commit, wsId]);

  const saveProfile = useCallback(profile => {
    setRoot(prev => {
      const ws={...prev.workspaces[wsId],profile,modified:now()};
      const next={...prev,workspaces:{...prev.workspaces,[wsId]:ws}};
      commit(next); return next;
    });
  }, [commit, wsId]);

  // Generic record ops
  const addRec = useCallback((key, rec) => {
    setRoot(prev => {
      const old=prev.workspaces[wsId];
      const ws={...old,[key]:[...(old[key]||[]),{...rec,_id:uid(),_ts:now()}],modified:now()};
      const next={...prev,workspaces:{...prev.workspaces,[wsId]:ws}};
      commit(next); return next;
    });
  }, [commit, wsId]);

  const editRec = useCallback((key, id, rec) => {
    setRoot(prev => {
      const old=prev.workspaces[wsId];
      const ws={...old,[key]:old[key].map(r=>r._id===id?{...r,...rec,_upd:now()}:r),modified:now()};
      const next={...prev,workspaces:{...prev.workspaces,[wsId]:ws}};
      commit(next); return next;
    });
  }, [commit, wsId]);

  const delRec = useCallback((key, id) => {
    setRoot(prev => {
      const old=prev.workspaces[wsId];
      const ws={...old,[key]:old[key].filter(r=>r._id!==id),modified:now()};
      const next={...prev,workspaces:{...prev.workspaces,[wsId]:ws}};
      commit(next); return next;
    });
  }, [commit, wsId]);

  const importWs = useCallback(data => {
    const id=uid(), ws={...EMPTY_WS(),...data,modified:now()};
    setRoot(prev => {
      const next={...prev,workspaces:{...prev.workspaces,[id]:ws},order:[...(prev.order||[]),id]};
      commit(next); return next;
    });
  }, [commit]);

  const ws     = root && wsId ? root.workspaces[wsId] : null;
  const wsList = root ? (root.order||[]).filter(id=>root.workspaces[id]).map(id=>({id,...root.workspaces[id]})) : [];
  return {root,ws,wsId,wsList,flash,createWs,openWs,closeWs,deleteWs,saveProfile,addRec,editRec,delRec,importWs};
}

// ─── Module scaffold (reusable CRUD wrapper) ──────────────────────────
function Mod({title,reg,recKey,records,addRec,editRec,delRec,fields,defaults,kpis,table,extra,csvName}) {
  const [modal, setModal] = useState(null);
  const [del,   setDel]   = useState(null);
  return (
    <div className="fu">
      {kpis}
      <Card>
        <SH title={title} reg={reg}>
          <BtnS onClick={()=>dlCSV(records,`${csvName||recKey}.csv`)}>⬇ CSV</BtnS>
          <BtnA onClick={()=>setModal("add")}>+ Add Record</BtnA>
        </SH>
        {records.length===0 ? <Empty/> : table(records, r=>setModal(r), r=>setDel(r))}
        {extra && extra(records)}
      </Card>
      {modal && (
        <RecModal title={title} fields={fields} defaults={defaults}
          editItem={modal==="add"?null:modal} onClose={()=>setModal(null)}
          onSave={rec=>{modal==="add"?addRec(recKey,rec):editRec(recKey,modal._id,rec);setModal(null);}}/>
      )}
      {del && <ConfirmDel onClose={()=>setDel(null)} onConfirm={()=>{delRec(recKey,del._id);setDel(null);}}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  HOME SCREEN
// ─────────────────────────────────────────────────────────────────────
function HomeScreen({wsList,onOpen,onCreate,onDelete,onImport}) {
  const fRef = useRef(null);
  return (
    <div className="fu" style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 16px"}}>
      <div style={{width:"100%",maxWidth:920}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:60,height:60,borderRadius:14,background:"linear-gradient(135deg,#f0a020,#b07010)",marginBottom:14}}><span style={{fontSize:28}}>⚡</span></div>
          <h1 style={{color:C.text,fontSize:24,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,letterSpacing:".04em"}}>ENVIROTRACK PRO</h1>
          <p style={{color:C.muted,fontSize:13,marginTop:6}}>Refinery Environmental Compliance Management System</p>
          <p style={{color:C.amber,fontSize:11,fontFamily:"'JetBrains Mono',monospace",marginTop:10}}>
            {wsList.length>0 ? "Select a workspace to continue, or create a new one" : "Create your first workspace to get started"}
          </p>
        </div>

        {/* Toolbar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <p style={{color:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>
            {wsList.length} workspace{wsList.length!==1?"s":""} saved in your browser
          </p>
          <div style={{display:"flex",gap:8}}>
            <button className="btn" onClick={()=>fRef.current.click()}
              style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"8px 14px",fontSize:12}}>
              📂 Import Backup
            </button>
            <input ref={fRef} type="file" accept=".json" style={{display:"none"}} onChange={e=>{
              const f=e.target.files[0]; if(!f) return;
              const r=new FileReader();
              r.onload=ev=>{try{onImport(JSON.parse(ev.target.result));alert("Workspace imported successfully!");}catch{alert("Invalid backup file.");}};
              r.readAsText(f); e.target.value="";
            }}/>
            <button className="btn" onClick={onCreate} style={{background:C.amber,color:"#000",padding:"8px 18px",fontSize:13}}>
              + New Workspace
            </button>
          </div>
        </div>

        {/* Cards */}
        {wsList.length===0 ? (
          <Card style={{padding:"60px 24px",textAlign:"center",border:`1px dashed ${C.border}`}}>
            <p style={{fontSize:28,marginBottom:12}}>🏭</p>
            <p style={{color:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:12,marginBottom:18}}>
              No workspaces yet. Each workspace = one facility or project.<br/>Your data is saved in your browser storage automatically.
            </p>
            <button className="btn" onClick={onCreate} style={{background:C.amber,color:"#000",padding:"10px 24px",fontSize:13}}>
              Create First Workspace →
            </button>
          </Card>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
            {wsList.map(ws => {
              const leaks = ws.ldar?.filter(r=>r.status==="Leaking").length||0;
              const total = (ws.ldar?.length||0)+(ws.permits?.length||0)+(ws.incidents?.length||0)+(ws.ghg?.length||0);
              return (
                <div key={ws.id} className="wcard"
                  style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,position:"relative"}}
                  onClick={()=>onOpen(ws.id)}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#f0a020,#b07010)",borderRadius:"10px 10px 0 0"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <div style={{width:42,height:42,borderRadius:8,background:"rgba(240,160,32,.1)",border:`1px solid rgba(240,160,32,.2)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏭</div>
                    <button className="btn" onClick={e=>{e.stopPropagation();if(confirm(`Delete "${ws.profile?.facility}"? This cannot be undone.`))onDelete(ws.id);}}
                      style={{background:"none",border:"none",color:C.muted,fontSize:18,padding:"2px 6px",lineHeight:1}}>×</button>
                  </div>
                  <h3 style={{color:C.text,fontSize:15,fontWeight:700,marginBottom:4}}>{ws.profile?.facility||"Unnamed Facility"}</h3>
                  <p style={{color:C.teal,fontSize:11,fontFamily:"'JetBrains Mono',monospace",marginBottom:12}}>
                    {ws.profile?.name||"No analyst set"}{ws.profile?.title?` · ${ws.profile.title}`:""}
                  </p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                    {[["LDAR",ws.ldar?.length||0],["Permits",ws.permits?.length||0],["Incidents",ws.incidents?.length||0]].map(([l,v])=>(
                      <div key={l} style={{background:C.dim,borderRadius:5,padding:"6px 8px",textAlign:"center"}}>
                        <p style={{color:C.muted,fontSize:8,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{l}</p>
                        <p style={{color:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700}}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {leaks>0 && (
                    <div className="blink" style={{background:"rgba(224,48,64,.1)",border:"1px solid rgba(224,48,64,.25)",borderRadius:5,padding:"4px 8px",marginBottom:10}}>
                      <span style={{color:"#f08080",fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>⚡ {leaks} active LDAR leak{leaks>1?"s":""}</span>
                    </div>
                  )}
                  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginBottom:12}}>
                    <p style={{color:C.muted,fontSize:10}}>Last modified: <span style={{color:C.text}}>{fmtDT(ws.modified)}</span></p>
                    {ws.profile?.epaId && <p style={{color:C.muted,fontSize:10,marginTop:2}}>EPA ID: <span style={{fontFamily:"'JetBrains Mono',monospace"}}>{ws.profile.epaId}</span></p>}
                  </div>
                  <div style={{background:C.amber,color:"#000",borderRadius:5,padding:"8px",textAlign:"center",fontSize:12,fontWeight:700}}>
                    Open Workspace →
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create workspace modal ───────────────────────────────────────────
function CreateModal({onClose,onCreate}) {
  const [f,on] = useForm({name:"",title:"Environmental Analyst",facility:"",epaId:"",agency:"",state:"TX",certs:""});
  const ok = f.name.trim() && f.facility.trim();
  const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
  const AGENCIES = ["EPA Region 1","EPA Region 2","EPA Region 3","EPA Region 4","EPA Region 5","EPA Region 6","EPA Region 7","EPA Region 8","EPA Region 9","EPA Region 10","TCEQ","LDEQ","CALEPA/CARB","NJDEP","PADEP","Other State Agency"];
  return (
    <Modal title="Create New Workspace" onClose={onClose}>
      <G2>
        <Fld label="Full Name *"><Inp name="name" value={f.name} onChange={on} placeholder="e.g. Jane Doe"/></Fld>
        <Fld label="Professional Title"><Inp name="title" value={f.title} onChange={on}/></Fld>
      </G2>
      <Fld label="Facility / Company Name *" hint="This appears on your workspace card">
        <Inp name="facility" value={f.facility} onChange={on} placeholder="e.g. Gulf Coast Refinery — Unit A"/>
      </Fld>
      <G2>
        <Fld label="EPA ID Number"><Inp name="epaId" value={f.epaId} onChange={on} placeholder="e.g. TXD980749922"/></Fld>
        <Fld label="State"><Sel name="state" value={f.state} onChange={on} opts={STATES}/></Fld>
      </G2>
      <G2>
        <Fld label="Regulatory Agency"><Sel name="agency" value={f.agency} onChange={on} opts={AGENCIES}/></Fld>
        <Fld label="Certifications"><Inp name="certs" value={f.certs} onChange={on} placeholder="CHMM, QEP, HAZWOPER"/></Fld>
      </G2>
      <button className="btn" onClick={()=>ok&&onCreate(f)}
        style={{width:"100%",background:ok?C.amber:"#182a3c",color:ok?"#000":"#3c5a70",padding:"12px",fontSize:14,cursor:ok?"pointer":"not-allowed",marginTop:4}}>
        {ok ? "Create Workspace →" : "Enter name & facility to continue"}
      </button>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────────────
function Dashboard({ws,onTab}) {
  const {ldar,ghg,bwon,permits,incidents,rcra,spcc,flare,stacks,cas} = ws;
  const leaks = ldar.filter(r=>r.status==="Leaking").length;
  const openI = incidents.filter(r=>r.status==="Open").length;
  const badB  = bwon.filter(r=>parseFloat(r.annual_lb)>10).length;
  const urgP  = permits.filter(p=>{const d=daysTo(p.expiry);return d!=null&&d<90;}).length;
  const r90   = rcra.filter(r=>parseInt(r.elapsed)>80).length;
  const sFail = stacks.filter(s=>s.status==="Fail").length;
  const co2   = ghg.reduce((s,r)=>s+(parseFloat(r.CO2e)||0),0);
  const bbl   = spcc.reduce((s,r)=>s+(parseFloat(r.bbl)||0),0);
  const ghgMx = Math.max(...ghg.map(r=>parseFloat(r.CO2e)||0),1);

  const alerts = [
    leaks>0 && {c:"red",   m:`${leaks} active LDAR leak(s) — 15-day repair deadline approaching`, tab:"ldar"},
    openI>0 && {c:"red",   m:`${openI} open regulatory incident(s) require active response`,      tab:"incidents"},
    badB>0  && {c:"amber", m:`${badB} BWON stream(s) exceed 10 lb/yr — 40 CFR §61 Subpart FF`,   tab:"bwon"},
    urgP>0  && {c:"red",   m:`${urgP} permit(s) expiring within 90 days — renewal action required`,tab:"permits"},
    r90>0   && {c:"red",   m:`${r90} RCRA stream(s) approaching 90-day LQG accumulation limit`,   tab:"rcra"},
    sFail>0 && {c:"amber", m:`${sFail} stack performance test(s) failed — corrective action needed`,tab:"flare"},
  ].filter(Boolean);

  return (
    <div className="fu">
      {alerts.length>0 && (
        <div style={{background:"rgba(224,48,64,.07)",border:"1px solid rgba(224,48,64,.2)",borderRadius:9,padding:"12px 14px",marginBottom:14}}>
          <p style={{color:"#f08080",fontSize:9,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".14em",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>⚡ Compliance Alerts ({alerts.length})</p>
          {alerts.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"center"}}>
              <Bdg t={a.c==="red"?"ACTION REQUIRED":"WARNING"} c={a.c}/>
              <button style={{background:"none",border:"none",color:"#c09030",fontSize:12,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>onTab(a.tab)}>{a.m}</button>
            </div>
          ))}
        </div>
      )}

      <KRow>
        <Kpi label="Active LDAR Leaks"    val={leaks}   sub="15-day repair required" hi={leaks>0?C.red:null}   pulse={leaks>0}/>
        <Kpi label="Annual CO₂e"          val={co2>0?`${(co2/1000).toFixed(1)}K MT`:"No data"} sub="40 CFR Part 98" hi={C.teal}/>
        <Kpi label="Open Incidents"       val={openI}   sub="NOVs · Deviations"      hi={openI>0?C.amber:null} pulse={openI>0}/>
        <Kpi label="Permits <90 Days"     val={urgP}    sub="Renewal required"        hi={urgP>0?C.red:null}/>
        <Kpi label="Open Corrective Acts" val={cas.filter(c=>c.status!=="Closed").length}/>
        <Kpi label="RCRA >80 Days"        val={r90}     sub="LQG 90-day limit"        hi={r90>0?C.red:null}     pulse={r90>0}/>
        <Kpi label="Stack Tests Failing"  val={sFail}   hi={sFail>0?C.red:null}/>
        <Kpi label="Total Oil Storage"    val={bbl>0?`${fmtN(Math.round(bbl))} bbl`:"No data"} sub="SPCC tracked"/>
      </KRow>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <Card>
          <SH title="GHG Trend" reg="40 CFR Part 98"/>
          {ghg.length===0 ? <Empty msg="No GHG data entered yet."/> : (
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80}}>
              {ghg.slice(-12).map((r,i)=>{
                const v=parseFloat(r.CO2e)||0,pct=(v/ghgMx)*100;
                return (
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}} title={`${r.month||""}: ${fmtN(v)} MT`}>
                    <div style={{width:"100%",background:v===Math.max(...ghg.map(x=>parseFloat(x.CO2e)||0))?C.amber:C.teal,borderRadius:"2px 2px 0 0",height:`${pct||4}%`,opacity:.85,minHeight:4}}/>
                    <span style={{color:C.muted,fontSize:8,fontFamily:"'JetBrains Mono',monospace"}}>{String(r.month||"").slice(0,3)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card>
          <SH title="Permit Status"/>
          {permits.length===0 ? <Empty msg="No permits entered yet."/> : (
            permits.slice(0,6).map(p=>{
              const d=daysTo(p.expiry),col=d!=null&&d<90?C.red:d!=null&&d<365?C.amber:C.green;
              return (
                <div key={p._id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{color:C.text,fontSize:11}}>{p.type}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {d!=null&&<span style={{color:col,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{d}d</span>}
                    <Bdg t={p.status} c={p.status==="Active"?"green":p.status.toLowerCase().includes("expired")||p.status.toLowerCase().includes("renewal")?"red":"amber"}/>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>

      <Card>
        <SH title="Recent Incidents"/>
        {incidents.length===0 ? <Empty msg="No incidents logged."/> : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><TH v="Date"/><TH v="Type"/><TH v="Unit"/><TH v="Description"/><TH v="Severity"/><TH v="Status"/></tr></thead>
              <tbody>
                {[...incidents].reverse().slice(0,6).map(r=>(
                  <tr key={r._id} className="hrow">
                    <TD mono sm>{r.date}</TD>
                    <TD><Bdg t={r.type} c={r.type==="NOV"?"red":"amber"}/></TD>
                    <TD mono color={C.teal} sm>{r.unit}</TD>
                    <TD>{r.desc}</TD>
                    <TD><Bdg t={r.severity} c={r.severity==="High"||r.severity==="Critical"?"red":r.severity==="Medium"?"amber":"green"}/></TD>
                    <TD><Bdg t={r.status} c={r.status==="Open"?"red":r.status==="Closed"?"green":"amber"}/></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  MODULE FIELD DEFINITIONS + COMPONENTS
// ─────────────────────────────────────────────────────────────────────

/* ── LDAR ── */
const LDAR_F = [
  {k:"tag",      label:"Tag / Equipment ID", req:true, ph:"e.g. FV-2201"},
  {k:"type",     label:"Component Type",     opts:["Valve","Pump","Compressor","Agitator","Flange","Connector","Relief Valve","Open-Ended Line","Sampling Connection","Other"]},
  {k:"service",  label:"Process Service",    opts:["Light HC","Heavy HC","Benzene","Gas","Aqueous","Polymerizing","Other"]},
  {k:"unit",     label:"Unit / Process Area",req:true, ph:"e.g. CDU-20"},
  {k:"lastInsp", label:"Last Inspection Date",type:"date"},
  {k:"method",   label:"Inspection Method",  opts:["OGI","Method 21","Audio-Visual-Olfactory","EPA Alt Work Practice"]},
  {k:"ppm",      label:"PPM Reading",        type:"number", hint:"500 ppm = action level (40 CFR §63.169)"},
  {k:"status",   label:"Status",             opts:["No Leak","Leaking","Repair Done","Delay of Repair","First Attempt Repair"]},
  {k:"repairDue",label:"Repair Due Date",    type:"date"},
  {k:"notes",    label:"Notes",              ph:"Inspector name, additional details..."},
];
const LDAR_D = {tag:"",type:"Valve",service:"Light HC",unit:"",lastInsp:"",method:"OGI",ppm:"",status:"No Leak",repairDue:"",notes:""};

function LDARMod({ws,addRec,editRec,delRec}) {
  const recs=ws.ldar, leaks=recs.filter(r=>r.status==="Leaking").length, maxP=recs.length?Math.max(...recs.map(r=>parseFloat(r.ppm)||0)):0;
  return (
    <Mod title="LDAR Inspection Log" reg="40 CFR Part 63 Subpart H/UUU · Method 21 / OGI"
      recKey="ldar" records={recs} addRec={addRec} editRec={editRec} delRec={delRec}
      fields={LDAR_F} defaults={LDAR_D} csvName="LDAR-records"
      kpis={<KRow>
        <Kpi label="Components Monitored" val={recs.length} hi={C.teal}/>
        <Kpi label="Active Leaks" val={leaks} sub="15-day repair required" hi={leaks>0?C.red:null} pulse={leaks>0}/>
        <Kpi label="Highest PPM" val={maxP>0?`${fmtN(maxP)} ppm`:"—"} sub="500 ppm = action level" hi={maxP>500?C.amber:null}/>
        <Kpi label="Compliance Rate" val={recs.length?`${Math.round(((recs.length-leaks)/recs.length)*100)}%`:"—"} hi={C.green}/>
      </KRow>}
      table={(recs,onE,onD)=>(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH v="Tag"/><TH v="Type"/><TH v="Service"/><TH v="Unit"/><TH v="Last Insp."/><TH v="PPM"/><TH v="Method"/><TH v="Status"/><TH v="Repair Due"/><TH v="Actions"/></tr></thead>
            <tbody>{recs.map(r=>{const p=parseFloat(r.ppm)||0;return(
              <tr key={r._id} className="hrow">
                <TD mono color={C.teal}>{r.tag}</TD><TD>{r.type}</TD>
                <TD><Bdg t={r.service} c={r.service==="Benzene"?"red":"gray"}/></TD>
                <TD mono sm>{r.unit}</TD><TD sm>{r.lastInsp}</TD>
                <TD mono color={p>500?C.red:p>200?C.amber:C.green}>{fmtN(p)}</TD>
                <TD sm>{r.method}</TD>
                <TD><Bdg t={r.status} c={r.status==="Leaking"?"red":r.status==="Repair Done"?"amber":"green"}/></TD>
                <TD mono color={r.repairDue?"#f08080":""}>{r.repairDue||"—"}</TD>
                <TD><div style={{display:"flex",gap:4}}><BtnE onClick={()=>onE(r)}/><BtnD onClick={()=>onD(r)}/></div></TD>
              </tr>);})}</tbody>
          </table>
        </div>
      )}
      extra={recs=>recs.length>0&&(
        <div style={{marginTop:14,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
          <p style={{color:C.muted,fontSize:9,fontFamily:"'JetBrains Mono',monospace",marginBottom:8,letterSpacing:".1em",textTransform:"uppercase"}}>PPM Reading Chart</p>
          {[...recs].sort((a,b)=>(parseFloat(b.ppm)||0)-(parseFloat(a.ppm)||0)).map(r=>{
            const p=parseFloat(r.ppm)||0,col=p>500?C.red:p>200?C.amber:C.green;
            return(<div key={r._id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
              <span style={{color:C.muted,fontSize:9,fontFamily:"'JetBrains Mono',monospace",width:72,textAlign:"right",flexShrink:0}}>{r.tag}</span>
              <Bar pct={(p/Math.max(maxP,1))*100} color={col} h={11}/>
              <span style={{color:col,fontSize:9,fontFamily:"'JetBrains Mono',monospace",width:72,textAlign:"right",flexShrink:0}}>{fmtN(p)} ppm</span>
            </div>);
          })}
        </div>
      )}
    />
  );
}

/* ── GHG ── */
const GHG_F = [
  {k:"month",     label:"Reporting Period", req:true, ph:"e.g. January, Q1, Annual"},
  {k:"year",      label:"Year",             type:"number"},
  {k:"CO2e",      label:"Total CO₂e (MT)", req:true, type:"number", hint:"All GHGs expressed as CO₂ equivalent"},
  {k:"CH4",       label:"CH₄ (MT)",        type:"number"},
  {k:"N2O",       label:"N₂O (MT)",        type:"number"},
  {k:"combustion",label:"Combustion CO₂ (MT)", type:"number"},
  {k:"fugitive",  label:"Fugitive Emissions (MT)", type:"number"},
  {k:"subpart",   label:"Subpart / Source Category", ph:"e.g. Subpart C, W, Y"},
];
const GHG_D = {month:"",year:new Date().getFullYear(),CO2e:"",CH4:"",N2O:"",combustion:"",fugitive:"",subpart:""};

function GHGMod({ws,addRec,editRec,delRec}) {
  const recs=ws.ghg, total=recs.reduce((s,r)=>s+(parseFloat(r.CO2e)||0),0), ghgMx=Math.max(...recs.map(r=>parseFloat(r.CO2e)||0),1);
  const [calcOpen,setCalc] = useState(false);
  const [cf,hc] = useForm({fuel:"Natural Gas",mmbtu:""});
  const EF = {"Natural Gas":53.06,"Diesel":73.96,"Residual Fuel Oil":75.1,"Propane":62.87,"Coal (bituminous)":94.35};
  const result = cf.mmbtu ? ((parseFloat(cf.mmbtu)||0)*(EF[cf.fuel]||0)/1000).toFixed(2) : null;
  return (<>
    <Mod title="GHG Emission Records" reg="40 CFR Part 98 — Mandatory GHG Reporting Rule"
      recKey="ghg" records={recs} addRec={addRec} editRec={editRec} delRec={delRec}
      fields={GHG_F} defaults={GHG_D} csvName="GHG-records"
      kpis={<KRow>
        <Kpi label="Total CO₂e (All Records)" val={total>0?`${(total/1000).toFixed(1)}K MT`:"—"} hi={C.teal}/>
        <Kpi label="Records Entered" val={recs.length}/>
        <Kpi label="MRR Threshold" val="25,000 MT" sub="40 CFR §98.2"/>
        <Kpi label="Above Threshold?" val={total>=25000?"YES":total>0?"NO":"—"} hi={total>=25000?C.red:null}/>
      </KRow>}
      table={(recs,onE,onD)=>(<>
        <div style={{overflowX:"auto",marginBottom:12}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH v="Period"/><TH v="Year"/><TH v="CO₂e (MT)"/><TH v="CH₄"/><TH v="N₂O"/><TH v="Combustion"/><TH v="Fugitive"/><TH v="Subpart"/><TH v="Actions"/></tr></thead>
            <tbody>{recs.map(r=>(<tr key={r._id} className="hrow">
              <TD mono color={C.amber}>{r.month}</TD><TD mono>{r.year}</TD><TD mono color={C.teal}>{fmtN(r.CO2e)}</TD>
              <TD mono>{r.CH4||"—"}</TD><TD mono>{r.N2O||"—"}</TD><TD mono>{r.combustion||"—"}</TD><TD mono>{r.fugitive||"—"}</TD>
              <TD sm>{r.subpart||"—"}</TD>
              <TD><div style={{display:"flex",gap:4}}><BtnE onClick={()=>onE(r)}/><BtnD onClick={()=>onD(r)}/></div></TD>
            </tr>))}</tbody>
          </table>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:3,height:70}}>
          {recs.map((r,i)=>{const v=parseFloat(r.CO2e)||0,pct=(v/ghgMx)*100;return(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{width:"100%",background:v===Math.max(...recs.map(x=>parseFloat(x.CO2e)||0))?C.amber:C.teal,borderRadius:"2px 2px 0 0",height:`${pct||4}%`,opacity:.85,minHeight:4}}/>
              <span style={{color:C.muted,fontSize:8,fontFamily:"'JetBrains Mono',monospace"}}>{String(r.month||"").slice(0,3)}</span>
            </div>);
          })}
        </div>
      </>)}
    />
    <Card style={{marginTop:10}}>
      <SH title="🧮 EPA Emission Calculator" reg="Equation C-1 — 40 CFR Part 98 Table C-1">
        <BtnS onClick={()=>setCalc(v=>!v)}>{calcOpen?"Hide":"Show Calculator"}</BtnS>
      </SH>
      {calcOpen && <div className="fu">
        <G2>
          <Fld label="Fuel Type"><Sel name="fuel" value={cf.fuel} onChange={hc} opts={Object.keys(EF)}/></Fld>
          <Fld label="Annual Heat Input (MMBtu)" hint="From fuel use records or CEMS data"><Inp name="mmbtu" value={cf.mmbtu} onChange={hc} type="number" placeholder="e.g. 85000"/></Fld>
        </G2>
        <div style={{background:result?"rgba(22,168,104,.07)":"rgba(255,255,255,.02)",border:`1px solid ${result?"rgba(22,168,104,.3)":C.border}`,borderRadius:7,padding:14,textAlign:"center"}}>
          {result ? <>
            <p style={{color:C.green,fontSize:22,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{result} MT CO₂</p>
            <p style={{color:C.muted,fontSize:10,marginTop:4}}>Emission Factor: {EF[cf.fuel]} kg CO₂/MMBtu · Formula: MMBtu × EF ÷ 1,000</p>
          </> : <p style={{color:C.muted,fontSize:12}}>Enter heat input above to calculate CO₂ emissions</p>}
        </div>
      </div>}
    </Card>
  </>);
}

/* ── BWON ── */
const BWON_F = [
  {k:"stream",    label:"Waste Stream Name", req:true, ph:"e.g. API Separator Influent"},
  {k:"benzene_ppm",label:"Benzene Conc. (ppm)", type:"number"},
  {k:"flow",      label:"Flow Rate (gal/hr)", type:"number"},
  {k:"annual_lb", label:"Annual Benzene (lb/yr)", req:true, type:"number", hint:">10 lb/yr = BWON control required"},
  {k:"control",   label:"Control Device", opts:["Steam Stripper","Closed Loop","IFR Tank","EFR Tank","Fixed Roof + VRU","Bioscrubber","Enclosed Combustion","None"]},
  {k:"eff",       label:"Control Efficiency (%)", type:"number", hint:"≥95% required for most BWON controls"},
];
const BWON_D = {stream:"",benzene_ppm:"",flow:"",annual_lb:"",control:"Steam Stripper",eff:""};

function BWONMod({ws,addRec,editRec,delRec}) {
  const recs=ws.bwon, nc=recs.filter(r=>parseFloat(r.annual_lb)>10).length, maxLb=Math.max(...recs.map(r=>parseFloat(r.annual_lb)||0),1);
  return (
    <Mod title="BWON Waste Stream Monitoring" reg="40 CFR Part 61 Subpart FF — Benzene Waste Operations NESHAP"
      recKey="bwon" records={recs} addRec={addRec} editRec={editRec} delRec={delRec}
      fields={BWON_F} defaults={BWON_D} csvName="BWON-records"
      kpis={<KRow>
        <Kpi label="Streams Monitored" val={recs.length} hi={C.teal}/>
        <Kpi label="Non-Compliant" val={nc} sub=">10 lb/yr threshold" hi={nc>0?C.red:null} pulse={nc>0}/>
        <Kpi label="Threshold" val="10 lb/yr" sub="40 CFR §61.342"/>
        <Kpi label="Compliant Streams" val={recs.length-nc} hi={C.green}/>
      </KRow>}
      table={(recs,onE,onD)=>(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH v="Waste Stream"/><TH v="Benzene (ppm)"/><TH v="Flow (gal/hr)"/><TH v="Annual (lb/yr)"/><TH v="Control Device"/><TH v="Efficiency"/><TH v="Status"/><TH v="Actions"/></tr></thead>
            <tbody>{recs.map(r=>{const lb=parseFloat(r.annual_lb)||0;return(
              <tr key={r._id} className="hrow">
                <TD>{r.stream}</TD>
                <TD mono color={parseFloat(r.benzene_ppm)>5000?C.red:parseFloat(r.benzene_ppm)>2000?C.amber:C.green}>{fmtN(r.benzene_ppm)}</TD>
                <TD mono>{fmtN(r.flow)}</TD>
                <TD mono color={lb>10?C.red:C.green}><b>{r.annual_lb}</b></TD>
                <TD sm>{r.control}</TD>
                <TD mono color={parseFloat(r.eff)<95?C.red:C.green}>{r.eff?`${r.eff}%`:"—"}</TD>
                <TD><Bdg t={lb<=10?"Compliant":"Non-Compliant"} c={lb<=10?"green":"red"}/></TD>
                <TD><div style={{display:"flex",gap:4}}><BtnE onClick={()=>onE(r)}/><BtnD onClick={()=>onD(r)}/></div></TD>
              </tr>);})}</tbody>
          </table>
        </div>
      )}
      extra={recs=>recs.length>0&&(
        <div style={{marginTop:14,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
          <p style={{color:C.muted,fontSize:9,fontFamily:"'JetBrains Mono',monospace",marginBottom:8,letterSpacing:".1em",textTransform:"uppercase"}}>Annual Benzene Loading — 10 lb/yr threshold</p>
          {recs.map(r=>{const lb=parseFloat(r.annual_lb)||0;return(
            <div key={r._id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
              <span style={{color:C.muted,fontSize:9,fontFamily:"'JetBrains Mono',monospace",width:110,flexShrink:0,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis"}}>{r.stream.split(" ").slice(0,2).join(" ")}</span>
              <Bar pct={(lb/maxLb)*100} color={lb>10?C.red:C.green} h={10}/>
              <span style={{color:lb>10?C.red:C.green,fontSize:9,fontFamily:"'JetBrains Mono',monospace",width:64,textAlign:"right",flexShrink:0}}>{r.annual_lb} lb/yr</span>
            </div>);
          })}
        </div>
      )}
    />
  );
}

/* ── PERMITS ── */
const PERMIT_F = [
  {k:"type",      label:"Permit Type",        req:true, opts:["Title V Air","Minor Source Air","NPDES","RCRA TSD","SWPPP","RMP","Permit-by-Rule","State Air Permit","UIC","Other"]},
  {k:"number",    label:"Permit Number",       req:true, ph:"e.g. TX-TV-0047"},
  {k:"agency",    label:"Issuing Agency",      ph:"e.g. EPA Region 6, TCEQ"},
  {k:"citation",  label:"Regulatory Citation", ph:"e.g. 40 CFR §70"},
  {k:"expiry",    label:"Expiration Date",     type:"date"},
  {k:"status",    label:"Status",              opts:["Active","Renewal Due","Expired","Under Review","Pending Issuance","Terminated"]},
  {k:"nextAction",label:"Next Required Action",ph:"e.g. Annual Compliance Certification"},
  {k:"notes",     label:"Notes"},
];
const PERMIT_D = {type:"Title V Air",number:"",agency:"",citation:"",expiry:"",status:"Active",nextAction:"",notes:""};

function PermitsMod({ws,addRec,editRec,delRec}) {
  const recs=ws.permits, urg=recs.filter(p=>{const d=daysTo(p.expiry);return d!=null&&d<90;}).length;
  return (
    <Mod title="Permit & Authorization Register" reg="CAA · CWA · RCRA · RMP · OPA 90"
      recKey="permits" records={recs} addRec={addRec} editRec={editRec} delRec={delRec}
      fields={PERMIT_F} defaults={PERMIT_D} csvName="Permits"
      kpis={<KRow>
        <Kpi label="Total Permits" val={recs.length} hi={C.teal}/>
        <Kpi label="Expiring <90 Days" val={urg} hi={urg>0?C.red:null} pulse={urg>0}/>
        <Kpi label="Active" val={recs.filter(p=>p.status==="Active").length} hi={C.green}/>
        <Kpi label="Need Action" val={recs.filter(p=>p.status!=="Active").length} hi={C.amber}/>
      </KRow>}
      table={(recs,onE,onD)=>(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {recs.map(p=>{const d=daysTo(p.expiry),u=d!=null&&d<90;return(
            <div key={p._id} style={{background:"rgba(255,255,255,.02)",border:`1px solid ${u?"rgba(224,48,64,.3)":C.border}`,borderRadius:7,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:6}}>
                <div>
                  <p style={{color:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700}}>{p.type}</p>
                  <p style={{color:C.muted,fontSize:10,marginTop:2}}>{p.number}{p.agency?` · ${p.agency}`:""}{p.citation?` · ${p.citation}`:""}</p>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  {d!=null&&<span style={{color:d<90?C.red:d<365?C.amber:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{d}d remaining</span>}
                  <Bdg t={p.status} c={p.status==="Active"?"green":p.status.toLowerCase().includes("expired")||p.status.toLowerCase().includes("renewal")?"red":"amber"}/>
                  <BtnE onClick={()=>onE(p)}/><BtnD onClick={()=>onD(p)}/>
                </div>
              </div>
              {p.nextAction&&<div style={{background:"rgba(240,160,32,.05)",border:"1px solid rgba(240,160,32,.15)",borderRadius:4,padding:"5px 10px",marginBottom:6}}><span style={{color:"#c09030",fontSize:11}}>📋 {p.nextAction}</span></div>}
              {d!=null&&<Bar pct={Math.max(0,Math.min(100,(d/730)*100))} color={d<90?C.red:d<365?C.amber:C.green} h={3}/>}
            </div>);
          })}
        </div>
      )}
    />
  );
}

/* ── INCIDENTS ── */
const INC_F = [
  {k:"date",     label:"Date",            req:true, type:"date"},
  {k:"type",     label:"Incident Type",   opts:["NOV","Deviation","Spill","Near Miss","Exceedance","Enforcement Action","Voluntary Disclosure","Self-Reported Deviation"]},
  {k:"unit",     label:"Unit / Area",     ph:"e.g. HDS-31, WWTP"},
  {k:"severity", label:"Severity",        opts:["Low","Medium","High","Critical"]},
  {k:"status",   label:"Status",          opts:["Open","Reported","Under Investigation","Pending Closure","Closed"]},
  {k:"regulator",label:"Regulatory Agency",ph:"e.g. EPA R6, TCEQ"},
  {k:"desc",     label:"Description / Finding", req:true, ph:"Describe the incident or violation..."},
  {k:"action",   label:"Corrective Action",ph:"Repair scheduled, report submitted..."},
];
const INC_D = {date:"",type:"NOV",unit:"",desc:"",action:"",severity:"Medium",status:"Open",regulator:""};

function IncidentsMod({ws,addRec,editRec,delRec}) {
  const recs=ws.incidents, open=recs.filter(r=>r.status==="Open").length;
  return (
    <Mod title="Regulatory Incident & NOV Tracker" reg="NOVs · Deviations · Spills · Exceedances · Near Misses"
      recKey="incidents" records={recs} addRec={addRec} editRec={editRec} delRec={delRec}
      fields={INC_F} defaults={INC_D} csvName="Incidents"
      kpis={<KRow>
        <Kpi label="Total Logged" val={recs.length} hi={C.teal}/>
        <Kpi label="Open" val={open} hi={open>0?C.red:null} pulse={open>0}/>
        <Kpi label="Reported to Agency" val={recs.filter(r=>r.status==="Reported").length} hi={C.amber}/>
        <Kpi label="Closed" val={recs.filter(r=>r.status==="Closed").length} hi={C.green}/>
        <Kpi label="High / Critical" val={recs.filter(r=>r.severity==="High"||r.severity==="Critical").length} hi={C.red}/>
      </KRow>}
      table={(recs,onE,onD)=>(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[...recs].reverse().map(r=>(
            <div key={r._id} style={{padding:"11px 13px",background:"rgba(255,255,255,.02)",border:`1px solid ${r.status==="Open"?"rgba(224,48,64,.22)":C.border}`,borderRadius:7}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:6}}>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <Bdg t={r.type} c={r.type==="NOV"?"red":"amber"}/>
                  <Bdg t={r.severity} c={r.severity==="High"||r.severity==="Critical"?"red":r.severity==="Medium"?"amber":"green"}/>
                  <span style={{color:C.muted,fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{r.date}</span>
                  {r.unit&&<Bdg t={r.unit} c="teal"/>}
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <Bdg t={r.status} c={r.status==="Open"?"red":r.status==="Closed"?"green":"amber"}/>
                  {r.regulator&&<Bdg t={r.regulator} c="violet"/>}
                  <BtnE onClick={()=>onE(r)}/><BtnD onClick={()=>onD(r)}/>
                </div>
              </div>
              <p style={{color:C.text,fontSize:12,marginBottom:r.action?5:0}}>{r.desc}</p>
              {r.action&&<p style={{color:C.muted,fontSize:11}}>↳ {r.action}</p>}
            </div>
          ))}
        </div>
      )}
    />
  );
}

/* ── RCRA ── */
const RCRA_F = [
  {k:"code",     label:"EPA Waste Code", req:true, ph:"e.g. D001, F037, K048"},
  {k:"name",     label:"Waste Description", req:true, ph:"e.g. Ignitable Waste"},
  {k:"vol",      label:"Volume (lbs)", type:"number"},
  {k:"container",label:"Container Type", opts:["55-gal Drum","Tote (IBC)","Roll-off","Tank","Lab Pack","Bulk","Other"]},
  {k:"area",     label:"SAA Location", ph:"e.g. WWTP, Maint Shop"},
  {k:"generated",label:"Date First Generated", type:"date"},
  {k:"elapsed",  label:"Days Elapsed", type:"number", hint:"Days since accumulation began (90-day LQG limit)"},
  {k:"status",   label:"Status", opts:["Accumulating","Manifested","Awaiting Disposal","Shipped Off-Site","Recycled On-Site"]},
];
const RCRA_D = {code:"",name:"",vol:"",container:"55-gal Drum",area:"",generated:"",elapsed:"",status:"Accumulating"};

function RCRAMod({ws,addRec,editRec,delRec}) {
  const recs=ws.rcra, near=recs.filter(r=>parseInt(r.elapsed)>80).length;
  return (
    <Mod title="RCRA Hazardous Waste Tracker" reg="40 CFR Parts 260–262 — 90-day LQG accumulation limit"
      recKey="rcra" records={recs} addRec={addRec} editRec={editRec} delRec={delRec}
      fields={RCRA_F} defaults={RCRA_D} csvName="RCRA-waste"
      kpis={<KRow>
        <Kpi label="Active Streams" val={recs.length} hi={C.teal}/>
        <Kpi label=">80 Days Elapsed" val={near} sub="LQG 90-day limit" hi={near>0?C.red:null} pulse={near>0}/>
        <Kpi label="Generator Status" val="LQG" sub="≥1,000 kg/month" hi={C.amber}/>
        <Kpi label="Regulation" val="40 CFR 262"/>
      </KRow>}
      table={(recs,onE,onD)=>(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH v="Waste Code"/><TH v="Description"/><TH v="Vol (lbs)"/><TH v="Container"/><TH v="SAA"/><TH v="Generated"/><TH v="Days / 90"/><TH v="Status"/><TH v="Actions"/></tr></thead>
            <tbody>{recs.map(r=>{const el=parseInt(r.elapsed)||0,pct=(el/90)*100,col=pct>89?C.red:pct>70?C.amber:C.green;return(
              <tr key={r._id} className="hrow">
                <TD mono color={C.amber}>{r.code}</TD><TD>{r.name}</TD><TD mono>{fmtN(r.vol)}</TD>
                <TD sm>{r.container}</TD><TD mono color={C.teal} sm>{r.area}</TD><TD sm>{r.generated}</TD>
                <TD>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:44,background:"rgba(255,255,255,.05)",borderRadius:3,height:7}}><div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:col,borderRadius:3}}/></div>
                    <span style={{color:col,fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{el}/90</span>
                  </div>
                </TD>
                <TD><Bdg t={r.status} c={el>80?"red":el>60?"amber":"green"}/></TD>
                <TD><div style={{display:"flex",gap:4}}><BtnE onClick={()=>onE(r)}/><BtnD onClick={()=>onD(r)}/></div></TD>
              </tr>);})}</tbody>
          </table>
        </div>
      )}
    />
  );
}

/* ── SPCC ── */
const SPCC_F = [
  {k:"name",     label:"Tank / AST Name", req:true, ph:"e.g. Crude Storage Tank A"},
  {k:"bbl",      label:"Capacity (barrels)", type:"number", hint:"1 barrel = 42 gallons"},
  {k:"product",  label:"Stored Product", opts:["Crude Oil","Diesel","Gasoline","Naphtha","Jet Fuel","Residual Fuel Oil","Lube Oil","Slop Oil","Other Petroleum"]},
  {k:"secondary",label:"Secondary Containment", opts:["Earthen Berm","Concrete Dike","Steel Containment","IFR Tank","Portable Steel Berms","Synthetic Liner","None"], hint:"Must contain 110% of largest tank capacity"},
  {k:"tier",     label:"SPCC Tier", opts:["Tier I","Tier II"]},
  {k:"inspection",label:"Last Inspection Date", type:"date"},
  {k:"status",   label:"Compliance Status", opts:["Compliant","Deficiency Noted","Non-Compliant","Under Repair"]},
  {k:"notes",    label:"Notes"},
];
const SPCC_D = {name:"",bbl:"",product:"Crude Oil",secondary:"Earthen Berm",tier:"Tier II",inspection:"",status:"Compliant",notes:""};

function SPCCMod({ws,addRec,editRec,delRec}) {
  const recs=ws.spcc, bbl=recs.reduce((s,r)=>s+(parseFloat(r.bbl)||0),0), nc=recs.filter(r=>r.status!=="Compliant").length;
  return (
    <Mod title="SPCC — AST Inventory" reg="40 CFR Part 112 — Spill Prevention, Control and Countermeasure"
      recKey="spcc" records={recs} addRec={addRec} editRec={editRec} delRec={delRec}
      fields={SPCC_F} defaults={SPCC_D} csvName="SPCC-tanks"
      kpis={<KRow>
        <Kpi label="Total Oil Storage" val={bbl>0?`${fmtN(Math.round(bbl))} bbl`:"—"} hi={C.amber}/>
        <Kpi label="ASTs Tracked" val={recs.length} hi={C.teal}/>
        <Kpi label="Non-Compliant" val={nc} hi={nc>0?C.red:null} pulse={nc>0}/>
        <Kpi label="Regulation" val="40 CFR 112"/>
      </KRow>}
      table={(recs,onE,onD)=>(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH v="Tank Name"/><TH v="Capacity (bbl)"/><TH v="Product"/><TH v="Secondary Containment"/><TH v="Last Inspection"/><TH v="Tier"/><TH v="Status"/><TH v="Actions"/></tr></thead>
            <tbody>{recs.map(r=>(
              <tr key={r._id} className="hrow">
                <TD>{r.name}</TD><TD mono>{fmtN(r.bbl)}</TD><TD>{r.product}</TD>
                <TD color={r.secondary==="None"?C.red:C.text}>{r.secondary}</TD>
                <TD sm>{r.inspection}</TD><TD><Bdg t={r.tier||"—"} c="teal"/></TD>
                <TD><Bdg t={r.status} c={r.status==="Compliant"?"green":r.status==="Deficiency Noted"?"amber":"red"}/></TD>
                <TD><div style={{display:"flex",gap:4}}><BtnE onClick={()=>onE(r)}/><BtnD onClick={()=>onD(r)}/></div></TD>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    />
  );
}

/* ── FLARE + STACK ── */
const FLARE_F = [
  {k:"date",    label:"Date",     req:true, type:"date"},
  {k:"unit",    label:"Unit",     req:true, ph:"e.g. SRU, FCU, CDU"},
  {k:"min",     label:"Duration (minutes)", type:"number", hint:">15 min typically requires regulatory reporting"},
  {k:"so2",     label:"SO₂ Released (lbs)", type:"number"},
  {k:"h2s",     label:"H₂S Released (lbs)", type:"number"},
  {k:"reported",label:"Reported to Agency?", opts:["Yes","No"]},
  {k:"cause",   label:"Root Cause", ph:"e.g. Compressor surge, planned startup"},
  {k:"reg",     label:"Applicable Regulation", ph:"e.g. 40 CFR §63.670"},
];
const FLARE_D = {date:"",unit:"",min:"",so2:"",h2s:"",reported:"Yes",cause:"",reg:"40 CFR §63.670"};
const STACK_F = [
  {k:"unit",     label:"Source Unit", req:true, ph:"e.g. CDU Fired Heater H-101"},
  {k:"pollutant",label:"Pollutant Tested", opts:["SO₂","NOₓ","CO","PM","PM₂.₅","VOC","NMOC","H₂S","Benzene","HCl","Other"]},
  {k:"result",   label:"Test Result", req:true, ph:"e.g. 0.42 lb/MMBtu or 98.1%"},
  {k:"limit",    label:"Applicable Limit", ph:"e.g. 1.2 lb/MMBtu"},
  {k:"date",     label:"Test Date", type:"date"},
  {k:"next",     label:"Next Test Due", type:"date"},
  {k:"status",   label:"Pass / Fail", opts:["Pass","Fail","Inconclusive","Pending Review"]},
  {k:"notes",    label:"Notes / Method Reference"},
];
const STACK_D = {unit:"",pollutant:"SO₂",result:"",limit:"",date:"",next:"",status:"Pass",notes:""};

function FlareStackMod({ws,addRec,editRec,delRec}) {
  const [sub,setSub] = useState("flare");
  const flare=ws.flare, stacks=ws.stacks, unrpt=flare.filter(r=>r.reported==="No").length, fail=stacks.filter(s=>s.status==="Fail").length;
  return (
    <div className="fu">
      <KRow>
        <Kpi label="Flare Events" val={flare.length} hi={flare.length>0?C.amber:null}/>
        <Kpi label="Unreported Events" val={unrpt} sub="Need deviation report" hi={unrpt>0?C.red:null} pulse={unrpt>0}/>
        <Kpi label="Stack Tests Logged" val={stacks.length} hi={C.teal}/>
        <Kpi label="Tests Failing" val={fail} hi={fail>0?C.red:null}/>
      </KRow>
      <div style={{display:"flex",gap:2,background:C.card,borderRadius:7,padding:3,border:`1px solid ${C.border}`,marginBottom:12,width:"fit-content"}}>
        {[["flare","🔥 Flare Events"],["stacks","📊 Stack Tests"]].map(([k,l])=>(
          <button key={k} className="btn" onClick={()=>setSub(k)} style={{padding:"6px 15px",fontSize:12,background:sub===k?C.amber:"transparent",border:"none",color:sub===k?"#000":C.muted}}>{l}</button>
        ))}
      </div>
      {sub==="flare" && (
        <Mod title="Flare Event Log" reg="40 CFR §63.670 / §60.103 — Events ≥15 min require reporting"
          recKey="flare" records={flare} addRec={addRec} editRec={editRec} delRec={delRec}
          fields={FLARE_F} defaults={FLARE_D} csvName="Flare-events" kpis={null}
          table={(recs,onE,onD)=>(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><TH v="Date"/><TH v="Unit"/><TH v="Duration"/><TH v="SO₂ (lbs)"/><TH v="H₂S (lbs)"/><TH v="Root Cause"/><TH v="Reported?"/><TH v="Regulation"/><TH v="Actions"/></tr></thead>
                <tbody>{recs.map(r=>(
                  <tr key={r._id} className="hrow">
                    <TD mono sm>{r.date}</TD><TD><Bdg t={r.unit} c="teal"/></TD>
                    <TD mono color={parseInt(r.min)>60?C.red:parseInt(r.min)>30?C.amber:C.text}>{r.min}</TD>
                    <TD mono color={parseInt(r.so2)>200?C.red:C.amber}>{r.so2||"—"}</TD>
                    <TD mono color={parseInt(r.h2s)>50?C.red:C.muted}>{r.h2s||"—"}</TD>
                    <TD sm>{r.cause}</TD>
                    <TD><Bdg t={r.reported==="Yes"?"Reported":"NOT REPORTED"} c={r.reported==="Yes"?"green":"red"}/></TD>
                    <TD sm mono>{r.reg}</TD>
                    <TD><div style={{display:"flex",gap:4}}><BtnE onClick={()=>onE(r)}/><BtnD onClick={()=>onD(r)}/></div></TD>
                  </tr>))}</tbody>
              </table>
            </div>
          )}
        />
      )}
      {sub==="stacks" && (
        <Mod title="Stack Performance Test Records" reg="40 CFR Parts 60/63 — Initial & Subsequent Performance Tests"
          recKey="stacks" records={stacks} addRec={addRec} editRec={editRec} delRec={delRec}
          fields={STACK_F} defaults={STACK_D} csvName="Stack-tests" kpis={null}
          table={(recs,onE,onD)=>(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><TH v="Source Unit"/><TH v="Pollutant"/><TH v="Result"/><TH v="Limit"/><TH v="Test Date"/><TH v="Next Due"/><TH v="Status"/><TH v="Actions"/></tr></thead>
                <tbody>{recs.map(r=>(
                  <tr key={r._id} className="hrow">
                    <TD>{r.unit}</TD><TD><Bdg t={r.pollutant} c="teal"/></TD>
                    <TD mono color={r.status==="Fail"?C.red:C.green}>{r.result}</TD>
                    <TD mono>{r.limit}</TD><TD sm>{r.date}</TD>
                    <TD mono color={daysTo(r.next)<365?C.amber:C.muted}>{r.next}</TD>
                    <TD><Bdg t={r.status} c={r.status==="Pass"?"green":"red"}/></TD>
                    <TD><div style={{display:"flex",gap:4}}><BtnE onClick={()=>onE(r)}/><BtnD onClick={()=>onD(r)}/></div></TD>
                  </tr>))}</tbody>
              </table>
            </div>
          )}
        />
      )}
    </div>
  );
}

/* ── CORRECTIVE ACTIONS ── */
const CA_F = [
  {k:"finding", label:"Finding / Deficiency", req:true, ph:"e.g. API Separator non-compliant per BWON"},
  {k:"root",    label:"Root Cause",           ph:"e.g. Inadequate control device"},
  {k:"action",  label:"Corrective Action",    req:true, ph:"e.g. Install IFR, repair seal, submit report"},
  {k:"due",     label:"Due Date",             type:"date"},
  {k:"owner",   label:"Responsible Owner",    ph:"Name or department"},
  {k:"status",  label:"Status",               opts:["Open","In Progress","Planned","Scheduled","Pending Verification","Closed"]},
  {k:"priority",label:"Priority",             opts:["Low","Medium","High","Critical"]},
  {k:"notes",   label:"Notes"},
];
const CA_D = {finding:"",root:"",action:"",due:"",owner:"",status:"Open",priority:"Medium",notes:""};

function CAsMod({ws,addRec,editRec,delRec}) {
  const recs=ws.cas, open=recs.filter(c=>c.status!=="Closed").length;
  return (
    <Mod title="Corrective Action Register" reg="Finding → Root Cause → Action → Verification → Closure"
      recKey="cas" records={recs} addRec={addRec} editRec={editRec} delRec={delRec}
      fields={CA_F} defaults={CA_D} csvName="Corrective-Actions"
      kpis={<KRow>
        <Kpi label="Total CAs" val={recs.length} hi={C.teal}/>
        <Kpi label="Open" val={open} hi={open>0?C.red:null} pulse={open>0}/>
        <Kpi label="In Progress" val={recs.filter(c=>c.status==="In Progress").length} hi={C.amber}/>
        <Kpi label="Closed" val={recs.filter(c=>c.status==="Closed").length} hi={C.green}/>
      </KRow>}
      table={(recs,onE,onD)=>(
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {recs.map(ca=>{
            const d=daysTo(ca.due),urg=d!=null&&d<14&&ca.status!=="Closed";
            return (
              <div key={ca._id} style={{padding:"12px 14px",background:"rgba(255,255,255,.02)",border:`1px solid ${urg?"rgba(224,48,64,.25)":C.border}`,borderRadius:7}}>
                <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:7}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <Bdg t={ca.status} c={ca.status==="Open"?"red":ca.status==="In Progress"?"amber":ca.status==="Closed"?"green":"teal"}/>
                    <Bdg t={ca.priority||"Medium"} c={ca.priority==="Critical"||ca.priority==="High"?"red":ca.priority==="Medium"?"amber":"gray"}/>
                    {urg&&<Bdg t={`DUE IN ${d}d`} c="red"/>}
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {ca.due&&<span style={{color:d<14?C.red:C.muted,fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>Due: {ca.due}</span>}
                    {ca.owner&&<span style={{color:C.teal,fontSize:10}}>Owner: {ca.owner}</span>}
                    <BtnE onClick={()=>onE(ca)}/><BtnD onClick={()=>onD(ca)}/>
                  </div>
                </div>
                <p style={{color:C.text,fontSize:12,fontWeight:600,marginBottom:3}}>{ca.finding}</p>
                {ca.root&&<p style={{color:C.muted,fontSize:11,marginBottom:5}}>Root cause: {ca.root}</p>}
                <div style={{background:"rgba(0,180,208,.05)",border:"1px solid rgba(0,180,208,.15)",borderRadius:4,padding:"5px 10px"}}>
                  <span style={{color:"#4090a8",fontSize:11}}>Action: {ca.action}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    />
  );
}

/* ── SETTINGS ── */
const STATES_L = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const AGENCIES_L = ["EPA Region 1","EPA Region 2","EPA Region 3","EPA Region 4","EPA Region 5","EPA Region 6","EPA Region 7","EPA Region 8","EPA Region 9","EPA Region 10","TCEQ","LDEQ","CALEPA/CARB","NJDEP","PADEP","Other State Agency"];

function SettingsMod({ws,onSaveProfile}) {
  const {profile} = ws;
  const [f,on,setF] = useForm({...profile});
  useEffect(()=>setF({...profile}),[profile]);
  return (
    <div className="fu" style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card>
        <SH title="⚙ Analyst Profile"/>
        <G2>
          <Fld label="Full Name *"><Inp name="name" value={f.name} onChange={on}/></Fld>
          <Fld label="Professional Title"><Inp name="title" value={f.title} onChange={on}/></Fld>
        </G2>
        <Fld label="Facility / Company Name *"><Inp name="facility" value={f.facility} onChange={on} placeholder="e.g. Gulf Coast Refinery — Unit A"/></Fld>
        <G2>
          <Fld label="EPA ID Number"><Inp name="epaId" value={f.epaId} onChange={on}/></Fld>
          <Fld label="State"><Sel name="state" value={f.state} onChange={on} opts={STATES_L}/></Fld>
        </G2>
        <G2>
          <Fld label="Regulatory Agency"><Sel name="agency" value={f.agency} onChange={on} opts={AGENCIES_L}/></Fld>
          <Fld label="Certifications"><Inp name="certs" value={f.certs} onChange={on} placeholder="e.g. CHMM, QEP, HAZWOPER"/></Fld>
        </G2>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
          <BtnA onClick={()=>onSaveProfile(f)}>💾 Save Profile</BtnA>
        </div>
      </Card>

      <Card>
        <SH title="📤 Export & Backup"/>
        <p style={{color:C.muted,fontSize:11,marginBottom:14}}>
          Download a full JSON backup of this workspace to restore later or import on another device. Export any individual module as a CSV spreadsheet.
        </p>
        <BtnA onClick={()=>dlJSON(ws,`envirotrack-backup-${Date.now()}.json`)}>⬇ Full JSON Backup (all data)</BtnA>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:8,marginTop:12}}>
          {[["ldar","LDAR Records"],["ghg","GHG Records"],["bwon","BWON Records"],["permits","Permits"],["incidents","Incidents"],["rcra","RCRA Waste"],["spcc","SPCC Tanks"],["flare","Flare Events"],["stacks","Stack Tests"],["cas","Corrective Actions"]].map(([k,l])=>(
            <button key={k} className="btn" onClick={()=>dlCSV(ws[k]||[],`${k}-export.csv`)}
              style={{background:"rgba(255,255,255,.03)",border:`1px solid ${C.border}`,color:C.muted,padding:"9px 12px",fontSize:11,textAlign:"left"}}>
              ⬇ {l} <span style={{color:C.teal,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>({(ws[k]||[]).length})</span>
            </button>
          ))}
        </div>
        <p style={{color:C.muted,fontSize:10,marginTop:10,fontFamily:"'JetBrains Mono',monospace"}}>JSON backup can be imported from the Workspaces home screen to restore or share.</p>
      </Card>

      <Card>
        <SH title="📖 Regulatory Reference"/>
        {[["40 CFR Part 60","NSPS — Stationary Source Performance Standards"],["40 CFR Part 61","NESHAP — BWON (Subpart FF), Benzene Fugitives"],["40 CFR Part 63","MACT Standards — Subparts H, CC, UUU, FFFF"],["40 CFR Part 68","Risk Management Program (RMP) — CAA §112(r)"],["40 CFR Part 98","Mandatory GHG Reporting Rule — Scope 1"],["40 CFR Part 112","SPCC — Oil Pollution Prevention"],["40 CFR Part 122","NPDES Permit Program — Clean Water Act"],["40 CFR Parts 260–270","RCRA — Hazardous Waste Management"],["OSHA 29 CFR §1910.119","Process Safety Management (PSM)"],["42 U.S.C. §7661","Title V Operating Permit Program"]].map(([c,t])=>(
          <div key={c} style={{display:"flex",gap:12,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{color:C.teal,fontFamily:"'JetBrains Mono',monospace",fontSize:10,width:160,flexShrink:0}}>{c}</span>
            <span style={{color:C.text,fontSize:11}}>{t}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  WORKSPACE SHELL (app frame once a workspace is open)
// ─────────────────────────────────────────────────────────────────────
const TABS = [
  {id:"dashboard", label:"Dashboard",    icon:"◈"},
  {id:"ldar",      label:"LDAR",         icon:"🔬"},
  {id:"ghg",       label:"GHG",          icon:"☁"},
  {id:"bwon",      label:"BWON",         icon:"⚗"},
  {id:"permits",   label:"Permits",      icon:"📋"},
  {id:"incidents", label:"Incidents",    icon:"🚨"},
  {id:"rcra",      label:"RCRA",         icon:"☢"},
  {id:"spcc",      label:"SPCC",         icon:"🛢"},
  {id:"flare",     label:"Flare/Stack",  icon:"🔥"},
  {id:"cas",       label:"Corr. Actions",icon:"✏"},
  {id:"settings",  label:"Settings",     icon:"⚙"},
];

function WorkspaceShell({ws,flash,onClose,saveProfile,addRec,editRec,delRec}) {
  const [tab, setTab] = useState("dashboard");
  const [clock, setClock] = useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(t);},[]);

  const {profile,ldar,permits,incidents,rcra} = ws;
  const leaks  = ldar.filter(r=>r.status==="Leaking").length;
  const openI  = incidents.filter(r=>r.status==="Open").length;
  const urgP   = permits.filter(p=>{const d=daysTo(p.expiry);return d!=null&&d<90;}).length;
  const rcra90 = rcra.filter(r=>parseInt(r.elapsed)>80).length;
  const alerts = leaks+openI+urgP+rcra90;

  const hasAlert = id =>
    (id==="ldar"&&leaks>0)||(id==="incidents"&&openI>0)||
    (id==="permits"&&urgP>0)||(id==="rcra"&&rcra90>0);

  const initials = profile.name ? profile.name.split(" ").map(w=>w[0]).slice(0,2).join("") : "?";

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      {/* Header */}
      <div style={{background:"rgba(11,21,32,.97)",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100,backdropFilter:"blur(8px)"}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:50,gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="btn" onClick={onClose}
                style={{background:"rgba(255,255,255,.04)",border:`1px solid ${C.border}`,color:C.muted,padding:"5px 10px",fontSize:11}}>
                ← Workspaces
              </button>
              <div style={{width:30,height:30,borderRadius:7,background:"linear-gradient(135deg,#f0a020,#b07010)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:14}}>⚡</span>
              </div>
              <div>
                <p style={{color:C.text,fontSize:12,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,letterSpacing:".05em",lineHeight:1}}>ENVIROTRACK PRO</p>
                <p style={{color:C.muted,fontSize:9,marginTop:1}}>{profile.facility||"Unnamed Facility"}</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <SaveBadge show={flash}/>
              {alerts>0 && (
                <div className="blink" style={{background:"rgba(224,48,64,.1)",border:"1px solid rgba(224,48,64,.28)",borderRadius:20,padding:"3px 12px"}}>
                  <span style={{color:"#f08080",fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>⚡ {alerts} ALERT{alerts>1?"S":""}</span>
                </div>
              )}
              <span style={{color:C.text,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>{clock.toLocaleTimeString("en-US",{hour12:false})}</span>
              <div onClick={()=>setTab("settings")} title="Settings & Profile"
                style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#f0a020,#8050e8)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                <span style={{color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700}}>{initials}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analyst strip */}
      <div style={{background:"rgba(0,180,208,.035)",borderBottom:`1px solid rgba(0,180,208,.09)`}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"4px 16px",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
          {profile.name&&<><span style={{color:C.teal,fontSize:9,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".14em",textTransform:"uppercase",fontWeight:700}}>Analyst:</span><span style={{color:C.text,fontSize:11,fontWeight:600}}>{profile.name}</span></>}
          {profile.title&&<><span style={{color:C.muted}}>·</span><span style={{color:C.muted,fontSize:11}}>{profile.title}</span></>}
          {profile.epaId&&<><span style={{color:C.muted}}>·</span><span style={{color:C.muted,fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>EPA ID: {profile.epaId}</span></>}
          {profile.certs&&<><span style={{color:C.muted}}>·</span><span style={{color:C.muted,fontSize:10}}>{profile.certs}</span></>}
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            {["40 CFR 60","40 CFR 61","40 CFR 63","40 CFR 68","40 CFR 98","40 CFR 112","40 CFR 122","40 CFR 260–270"].map(r=>(
              <span key={r} style={{color:"rgba(0,180,208,.3)",fontSize:8,fontFamily:"'JetBrains Mono',monospace"}}>{r}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1440,margin:"0 auto",padding:14}}>
        {/* Tab bar */}
        <div className="nobar" style={{overflowX:"auto",marginBottom:14}}>
          <div style={{display:"inline-flex",gap:2,background:C.card,borderRadius:8,padding:3,border:`1px solid ${C.border}`,minWidth:"100%"}}>
            {TABS.map(t=>{
              const alert=hasAlert(t.id), active=tab===t.id;
              return (
                <button key={t.id} className="btn" onClick={()=>setTab(t.id)}
                  style={{padding:"6px 13px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".04em",background:active?C.amber:"transparent",border:"none",color:active?"#000":alert?"#f08080":C.muted,whiteSpace:"nowrap",position:"relative"}}>
                  {t.icon} {t.label}
                  {alert&&!active&&<span className="blink" style={{position:"absolute",top:3,right:3,width:5,height:5,borderRadius:"50%",background:C.red}}/>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Module content */}
        {tab==="dashboard" && <Dashboard ws={ws} onTab={setTab}/>}
        {tab==="ldar"      && <LDARMod      ws={ws} addRec={addRec} editRec={editRec} delRec={delRec}/>}
        {tab==="ghg"       && <GHGMod       ws={ws} addRec={addRec} editRec={editRec} delRec={delRec}/>}
        {tab==="bwon"      && <BWONMod      ws={ws} addRec={addRec} editRec={editRec} delRec={delRec}/>}
        {tab==="permits"   && <PermitsMod   ws={ws} addRec={addRec} editRec={editRec} delRec={delRec}/>}
        {tab==="incidents" && <IncidentsMod ws={ws} addRec={addRec} editRec={editRec} delRec={delRec}/>}
        {tab==="rcra"      && <RCRAMod      ws={ws} addRec={addRec} editRec={editRec} delRec={delRec}/>}
        {tab==="spcc"      && <SPCCMod      ws={ws} addRec={addRec} editRec={editRec} delRec={delRec}/>}
        {tab==="flare"     && <FlareStackMod ws={ws} addRec={addRec} editRec={editRec} delRec={delRec}/>}
        {tab==="cas"       && <CAsMod       ws={ws} addRec={addRec} editRec={editRec} delRec={delRec}/>}
        {tab==="settings"  && <SettingsMod  ws={ws} onSaveProfile={saveProfile}/>}
      </div>

      <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 16px",textAlign:"center"}}>
        <p style={{color:C.muted,fontSize:9,fontFamily:"'JetBrains Mono',monospace"}}>
          EnviroTrack Pro · Data auto-saved to browser storage on every change · CAA · CWA · RCRA · OPA 90 · RMP/PSM · 40 CFR 60, 61, 63, 68, 98, 112, 122, 260–270
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────────────────────────────
export default function App() {
  const {root,ws,wsList,flash,createWs,openWs,closeWs,deleteWs,saveProfile,addRec,editRec,delRec,importWs} = useApp();
  const [showCreate, setShowCreate] = useState(false);

  // Loading
  if (root === null) {
    return (
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <div style={{width:38,height:38,border:`3px solid ${C.dim}`,borderTopColor:C.amber,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
        <p style={{color:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>Loading your workspaces…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Workspace open
  if (ws) {
    return (
      <WorkspaceShell ws={ws} flash={flash} onClose={closeWs}
        saveProfile={saveProfile} addRec={addRec} editRec={editRec} delRec={delRec}/>
    );
  }

  // Home screen
  return (
    <>
      <HomeScreen
        wsList={wsList}
        onOpen={openWs}
        onCreate={()=>setShowCreate(true)}
        onDelete={deleteWs}
        onImport={importWs}
      />
      {showCreate && <CreateModal onClose={()=>setShowCreate(false)} onCreate={createWs}/>}
    </>
  );
}