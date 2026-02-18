import { useState, useEffect, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   ENVIROTRACK PRO — Refinery Environmental Compliance System
   Analyst: Emmanuel Igbokwe, Environmental Analyst
   Regulatory Coverage: CAA, CWA, RCRA, EPCRA, RMP, GHG
═══════════════════════════════════════════════════════════════ */

// Google Fonts
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Barlow:wght@300;400;500;600;700;800&family=Barlow+Condensed:wght@400;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const css = document.createElement("style");
css.textContent = `
  * { box-sizing: border-box; }
  body { background: #080c0f; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0f1419; }
  ::-webkit-scrollbar-thumb { background: #1e3a4a; border-radius: 3px; }
  .tab-scroll { overflow-x: auto; white-space: nowrap; scrollbar-width: none; }
  .tab-scroll::-webkit-scrollbar { display: none; }
  @keyframes pulse-red { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes pulse-amber { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scanline { 0%{top:0%} 100%{top:100%} }
  .animate-slide { animation: slideIn .3s ease forwards; }
  .pulse-red { animation: pulse-red 1.5s infinite; }
  .pulse-amber { animation: pulse-amber 2s infinite; }
  .font-mono { font-family: 'Space Mono', monospace !important; }
  .font-ui { font-family: 'Barlow', sans-serif !important; }
  .font-condensed { font-family: 'Barlow Condensed', sans-serif !important; }
  .grid-bg { background-image: linear-gradient(rgba(0,180,180,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,180,0.03) 1px, transparent 1px); background-size: 32px 32px; }
  .amber-glow { box-shadow: 0 0 20px rgba(245,158,11,0.15); }
  .cyan-glow { box-shadow: 0 0 20px rgba(6,182,212,0.12); }
  .red-glow { box-shadow: 0 0 20px rgba(239,68,68,0.2); }
`;
document.head.appendChild(css);

// ─── MASTER DATA ─────────────────────────────────────────────────────────────

const ANALYST = { name: "Emmanuel Igbokwe", title: "Environmental Analyst", cert: "CHMM Candidate · 40-hr HAZWOPER" };

const TODAY = new Date("2026-02-18");
const daysUntil = d => Math.ceil((new Date(d) - TODAY) / 86400000);

const LDAR_DATA = [
  {id:"L-001",tag:"FV-2201",type:"Valve",service:"Light HC",unit:"CDU-20",lastInsp:"2025-11-12",status:"No Leak",ppm:48,method:"OGI",repairDue:null},
  {id:"L-002",tag:"PMP-310",type:"Pump",service:"Benzene",unit:"HDS-31",lastInsp:"2025-12-01",status:"Leaking",ppm:2840,method:"Method 21",repairDue:"2026-02-25"},
  {id:"L-003",tag:"CV-0887",type:"Valve",service:"Heavy HC",unit:"VDU-08",lastInsp:"2026-01-04",status:"No Leak",ppm:120,method:"OGI",repairDue:null},
  {id:"L-004",tag:"FLG-445",type:"Flange",service:"Benzene",unit:"ARU-44",lastInsp:"2025-10-18",status:"Repair Done",ppm:198,method:"Method 21",repairDue:null},
  {id:"L-005",tag:"CMP-102",type:"Compressor",service:"Gas",unit:"GRU-10",lastInsp:"2026-01-15",status:"No Leak",ppm:55,method:"OGI",repairDue:null},
  {id:"L-006",tag:"AGT-220",type:"Agitator",service:"Light HC",unit:"DAO-22",lastInsp:"2025-09-30",status:"Leaking",ppm:4100,method:"Method 21",repairDue:"2026-03-01"},
  {id:"L-007",tag:"REL-601",type:"Relief Valve",service:"Gas",unit:"FCU-60",lastInsp:"2026-02-01",status:"No Leak",ppm:22,method:"OGI",repairDue:null},
  {id:"L-008",tag:"PMP-415",type:"Pump",service:"Heavy HC",unit:"VDU-08",lastInsp:"2026-01-20",status:"No Leak",ppm:88,method:"Method 21",repairDue:null},
  {id:"L-009",tag:"CV-1130",type:"Valve",service:"Benzene",unit:"ARU-44",lastInsp:"2026-02-05",status:"No Leak",ppm:210,method:"Method 21",repairDue:null},
  {id:"L-010",tag:"FLG-502",type:"Flange",service:"Light HC",unit:"CDU-20",lastInsp:"2025-11-30",status:"No Leak",ppm:65,method:"OGI",repairDue:null},
];

const GHG_DATA = [
  {month:"Jan",CO2e:12400,CH4:320,N2O:18,combustion:11800,fugitive:600},
  {month:"Feb",CO2e:11900,CH4:298,N2O:16,combustion:11300,fugitive:600},
  {month:"Mar",CO2e:13100,CH4:345,N2O:21,combustion:12400,fugitive:700},
  {month:"Apr",CO2e:12600,CH4:310,N2O:19,combustion:11900,fugitive:700},
  {month:"May",CO2e:11700,CH4:280,N2O:15,combustion:11100,fugitive:600},
  {month:"Jun",CO2e:14200,CH4:398,N2O:24,combustion:13500,fugitive:700},
  {month:"Jul",CO2e:15100,CH4:420,N2O:28,combustion:14300,fugitive:800},
  {month:"Aug",CO2e:14800,CH4:405,N2O:26,combustion:14000,fugitive:800},
  {month:"Sep",CO2e:13500,CH4:360,N2O:22,combustion:12800,fugitive:700},
  {month:"Oct",CO2e:12900,CH4:330,N2O:20,combustion:12200,fugitive:700},
  {month:"Nov",CO2e:12100,CH4:305,N2O:17,combustion:11500,fugitive:600},
  {month:"Dec",CO2e:13300,CH4:350,N2O:22,combustion:12600,fugitive:700},
];

const BWON_DATA = [
  {id:"B-01",stream:"Stripper Overhead Sour Water",benzene_ppm:2100,flow:4800,annual_lb:52.4,control:"Steam Stripper",eff:99.1,compliant:true},
  {id:"B-02",stream:"Desalter Effluent",benzene_ppm:8700,flow:2200,annual_lb:94.8,control:"Closed Loop",eff:98.5,compliant:true},
  {id:"B-03",stream:"API Separator Influent",benzene_ppm:3400,flow:9100,annual_lb:153.2,control:"Fixed Roof Tank",eff:85.0,compliant:false},
  {id:"B-04",stream:"Crude Tank Farm Drawoff",benzene_ppm:1800,flow:1100,annual_lb:9.8,control:"IFR Tank",eff:97.8,compliant:true},
  {id:"B-05",stream:"WWTP Influent",benzene_ppm:4200,flow:6700,annual_lb:138.5,control:"Bioscrubber",eff:96.2,compliant:false},
];

const PERMITS_DATA = [
  {id:"P-01",type:"Title V Air",number:"TXV-0047-2022",expiry:"2027-06-30",status:"Active",agency:"TCEQ",nextAction:"Annual Compliance Cert — Apr 2026",citation:"42 U.S.C. §7661"},
  {id:"P-02",type:"NPDES",number:"TX0023451",expiry:"2026-03-15",status:"Renewal Due",agency:"EPA R6",nextAction:"⚠️ Renewal Application OVERDUE",citation:"40 CFR §122"},
  {id:"P-03",type:"RCRA TSD",number:"TXD980749922",expiry:"2028-12-01",status:"Active",agency:"TCEQ",nextAction:"Biennial Report — Feb 2026",citation:"40 CFR §270"},
  {id:"P-04",type:"SWPPP",number:"SW-REF-0112",expiry:"2026-08-31",status:"Active",agency:"EPA R6",nextAction:"Q1 Inspection — Mar 2026",citation:"40 CFR §122.26"},
  {id:"P-05",type:"Air Permit-by-Rule",number:"PBR-2021-0034",expiry:"2026-12-31",status:"Active",agency:"TCEQ",nextAction:"Annual Self-Certification",citation:"30 TAC §116"},
  {id:"P-06",type:"RMP",number:"RMP-TX-00417",expiry:"2026-06-15",status:"Review Due",agency:"EPA R6",nextAction:"5-Year RMP Resubmission",citation:"40 CFR §68"},
];

const SPCC_DATA = [
  {id:"TK-01",name:"Crude Storage Tank A",capacity_bbl:250000,product:"Crude Oil",secondary:"Earthen Berm",inspection:"2026-01-10",status:"Compliant",tier:"Tier II"},
  {id:"TK-02",name:"Diesel Day Tank",capacity_bbl:5000,product:"Diesel",secondary:"Concrete Dike",inspection:"2025-12-15",status:"Compliant",tier:"Tier I"},
  {id:"TK-03",name:"Slop Oil Tank",capacity_bbl:12000,product:"Slop Oil",secondary:"Steel Containment",inspection:"2025-11-30",status:"Deficiency",tier:"Tier II"},
  {id:"TK-04",name:"Lube Oil AST",capacity_bbl:2000,product:"Lube Oil",secondary:"None",inspection:"2026-02-01",status:"Non-Compliant",tier:"Tier I"},
  {id:"TK-05",name:"Naphtha Blending Tank",capacity_bbl:35000,product:"Naphtha",secondary:"Earthen Berm",inspection:"2026-01-25",status:"Compliant",tier:"Tier II"},
];

const RCRA_DATA = [
  {code:"D001",name:"Ignitable Waste",volume_lbs:4200,container:"55-gal Drum",area:"SAA-HDS",generated:"2026-02-10",status:"Accumulating",limit_days:90,elapsed:8},
  {code:"D002",name:"Corrosive Waste",volume_lbs:1100,container:"Tote",area:"SAA-CDU",generated:"2026-01-15",status:"Manifested",limit_days:90,elapsed:34},
  {code:"F037",name:"Petroleum Refinery DAF Float",volume_lbs:18500,container:"Roll-off",area:"WWTP",generated:"2025-12-01",status:"Awaiting Disposal",limit_days:90,elapsed:79},
  {code:"K048",name:"Dissolved Air Flotation Float",volume_lbs:9200,container:"Roll-off",area:"WWTP",generated:"2026-01-01",status:"Accumulating",limit_days:90,elapsed:48},
  {code:"F019",name:"Wastewater from Metal Cleaning",volume_lbs:2300,container:"Drum",area:"Maint Shop",generated:"2026-02-05",status:"Accumulating",limit_days:90,elapsed:13},
];

const RMP_SCENARIOS = [
  {chem:"HF Acid",qty_lbs:42000,threshold_lbs:1000,scenario:"Worst Case: Full Tank Rupture",distance_mi:2.4,pop_affected:8200,lastReview:"2021-06-15",status:"Overdue"},
  {chem:"Chlorine",qty_lbs:3500,threshold_lbs:2500,scenario:"Alternative: 10-min Release",distance_mi:0.6,pop_affected:450,lastReview:"2021-06-15",status:"Overdue"},
  {chem:"Hydrogen Sulfide",qty_lbs:8200,threshold_lbs:10000,scenario:"Below RQ — Monitoring Only",distance_mi:null,pop_affected:null,lastReview:"2021-06-15",status:"Monitor"},
  {chem:"Ammonia (anhydrous)",qty_lbs:15000,threshold_lbs:10000,scenario:"Worst Case: Vessel Failure",distance_mi:1.1,pop_affected:2100,lastReview:"2021-06-15",status:"Overdue"},
];

const FLARE_DATA = [
  {date:"2026-02-14",unit:"SRU",duration_min:38,so2_lbs:124,h2s_lbs:82,cause:"Amine Regenerator Upset",reported:true,citation:"40 CFR §60.103"},
  {date:"2026-01-28",unit:"FCU",duration_min:72,so2_lbs:289,h2s_lbs:0,cause:"Compressor Surge",reported:true,citation:"40 CFR §63.670"},
  {date:"2026-01-10",unit:"CDU",duration_min:15,so2_lbs:43,h2s_lbs:31,cause:"Planned Startup",reported:false,citation:"40 CFR §63.670"},
  {date:"2025-12-22",unit:"HDS",duration_min:112,so2_lbs:405,h2s_lbs:0,cause:"Reactor High Temp Shutdown",reported:true,citation:"40 CFR §60.103"},
];

const STACK_TESTS = [
  {unit:"CDU Fired Heater H-101",pollutant:"SO₂",result:"0.42 lb/MMBtu",limit:"1.2 lb/MMBtu",date:"2025-09-12",next:"2028-09-12",status:"Pass"},
  {unit:"FCU Main Air Blower",pollutant:"NOₓ",result:"0.08 lb/MMBtu",limit:"0.20 lb/MMBtu",date:"2025-09-12",next:"2028-09-12",status:"Pass"},
  {unit:"SRU Tail Gas Incinerator",pollutant:"SO₂",result:"0.99 lb/ton",limit:"0.80 lb/ton",date:"2025-06-08",next:"2026-06-08",status:"Fail"},
  {unit:"HDS Fired Heater H-201",pollutant:"CO",result:"0.01 lb/MMBtu",limit:"0.10 lb/MMBtu",date:"2025-09-12",next:"2028-09-12",status:"Pass"},
  {unit:"Vapor Recovery Unit",pollutant:"NMOC",result:"98.1%",limit:"95.0%",date:"2025-11-01",next:"2027-11-01",status:"Pass"},
];

const WWTP_DATA = [
  {param:"BOD₅",limit_mgL:30,avg_mgL:18.4,max_mgL:24.1,compliant:true},
  {param:"TSS",limit_mgL:30,avg_mgL:21.2,max_mgL:28.8,compliant:true},
  {param:"Oil & Grease",limit_mgL:10,avg_mgL:7.6,max_mgL:12.4,compliant:false},
  {param:"Total Phenols",limit_mgL:0.5,avg_mgL:0.31,max_mgL:0.48,compliant:true},
  {param:"Benzene",limit_mgL:0.10,avg_mgL:0.04,max_mgL:0.09,compliant:true},
  {param:"Ammonia-N",limit_mgL:25,avg_mgL:16.8,max_mgL:22.1,compliant:true},
  {param:"pH",limit_mgL:"6–9",avg_mgL:"7.2",max_mgL:"8.1",compliant:true},
];

const INCIDENTS = [
  {id:"INC-001",date:"2026-01-20",type:"NOV",unit:"HDS-31",desc:"Pump seal leak — 2,840 ppm benzene",action:"Repair scheduled 2/25/26",severity:"High",status:"Open",regulator:"EPA R6"},
  {id:"INC-002",date:"2026-01-15",type:"Deviation",unit:"FCU-60",desc:"Flare event >1 hr — Excess emissions",action:"Deviation report submitted to TCEQ",severity:"Medium",status:"Reported",regulator:"TCEQ"},
  {id:"INC-003",date:"2025-12-10",type:"Spill",unit:"Tank Farm",desc:"12 gal crude oil spill — contained in secondary",action:"Cleanup complete, SPCC log updated",severity:"Low",status:"Closed",regulator:"None"},
  {id:"INC-004",date:"2025-11-22",type:"Near Miss",unit:"ARU-44",desc:"H₂S monitor alarm — 15 ppm at fence line",action:"Source identified, valve replaced",severity:"High",status:"Closed",regulator:"None"},
  {id:"INC-005",date:"2026-02-01",type:"Exceedance",unit:"WWTP",desc:"Oil & Grease monthly average exceeded NPDES limit",action:"Corrective action plan submitted",severity:"Medium",status:"Open",regulator:"EPA R6"},
];

const CEMS_DATA = [
  {unit:"CDU H-101",pollutant:"SO₂",current_ppm:42,limit_ppm:500,avg24h:38,status:"Normal"},
  {unit:"CDU H-101",pollutant:"NOₓ",current_ppm:78,limit_ppm:200,avg24h:72,status:"Normal"},
  {unit:"FCU Air Blower",pollutant:"CO",current_ppm:12,limit_ppm:200,avg24h:10,status:"Normal"},
  {unit:"SRU Incinerator",pollutant:"SO₂",current_ppm:438,limit_ppm:500,avg24h:401,status:"Warning"},
  {unit:"HDS H-201",pollutant:"NOₓ",current_ppm:94,limit_ppm:200,avg24h:88,status:"Normal"},
];

const TRAINING_DATA = [
  {name:"Emmanuel Igbokwe",role:"Environmental Analyst",course:"HAZWOPER 40-hr",completed:"2025-08-15",expires:"2026-08-15",status:"Current"},
  {name:"Emmanuel Igbokwe",role:"Environmental Analyst",course:"LDAR Inspector Cert",completed:"2025-09-01",expires:"2027-09-01",status:"Current"},
  {name:"Emmanuel Igbokwe",role:"Environmental Analyst",course:"40 CFR Part 98 GHG Reporting",completed:"2025-10-20",expires:"Never",status:"Current"},
  {name:"Emmanuel Igbokwe",role:"Environmental Analyst",course:"RMP Regulatory Training",completed:"2025-11-05",expires:"2027-11-05",status:"Current"},
  {name:"Emmanuel Igbokwe",role:"Environmental Analyst",course:"Benzene NESHAP Awareness",completed:"2024-06-10",expires:"2026-06-10",status:"Expires Soon"},
];

const CORRECTIVE_ACTIONS = [
  {id:"CA-001",finding:"API Sep Influent — BWON Non-Compliant",root:"Fixed Roof Tank — inadequate benzene control",action:"Install IFR or connect to vapor recovery",due:"2026-04-01",owner:"Emmanuel Igbokwe",status:"In Progress"},
  {id:"CA-002",finding:"Lube Oil AST — No secondary containment",root:"Legacy tank installed pre-SPCC revision",action:"Install portable steel containment berms",due:"2026-03-15",owner:"Emmanuel Igbokwe",status:"Planned"},
  {id:"CA-003",finding:"SRU Tail Gas Incinerator — Stack test fail",root:"Catalyst degradation — SO₂ breakthrough",action:"Catalyst replacement during turnaround",due:"2026-05-01",owner:"Maintenance",status:"Scheduled"},
  {id:"CA-004",finding:"WWTP O&G Exceedance — NPDES Limit",root:"Coalescing media fouled in CPI separator",action:"CPI separator clean-out and media replacement",due:"2026-03-01",owner:"Emmanuel Igbokwe",status:"In Progress"},
  {id:"CA-005",finding:"HDS-31 Pump Seal Active Leak",root:"Mechanical seal failure — high benzene service",action:"Emergency repair 2/25/26 — spare part ordered",due:"2026-02-25",owner:"Maintenance",status:"Open"},
];

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────

const colors = {
  bg:"#080c0f", card:"#0d1620", border:"#162535",
  cyan:"#06b6d4", amber:"#f59e0b", red:"#ef4444",
  green:"#10b981", violet:"#8b5cf6", text:"#e2e8f0",
  muted:"#64748b", dim:"#1e3a4a"
};

const S = {
  card: { background:colors.card, border:`1px solid ${colors.border}`, borderRadius:12, padding:16 },
  cardAlt: { background:"#0a1a28", border:`1px solid ${colors.dim}`, borderRadius:12, padding:16 },
};

const Badge = ({ label, color="gray" }) => {
  const map = {
    green:{bg:"rgba(16,185,129,0.15)",border:"rgba(16,185,129,0.3)",text:"#6ee7b7"},
    red:  {bg:"rgba(239,68,68,0.15)", border:"rgba(239,68,68,0.3)", text:"#fca5a5"},
    amber:{bg:"rgba(245,158,11,0.15)",border:"rgba(245,158,11,0.3)",text:"#fcd34d"},
    blue: {bg:"rgba(59,130,246,0.15)",border:"rgba(59,130,246,0.3)",text:"#93c5fd"},
    violet:{bg:"rgba(139,92,246,0.15)",border:"rgba(139,92,246,0.3)",text:"#c4b5fd"},
    cyan: {bg:"rgba(6,182,212,0.15)", border:"rgba(6,182,212,0.3)", text:"#67e8f9"},
    gray: {bg:"rgba(100,116,139,0.2)",border:"rgba(100,116,139,0.3)",text:"#94a3b8"},
  };
  const c = map[color]||map.gray;
  return (
    <span style={{background:c.bg,border:`1px solid ${c.border}`,color:c.text,padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
      {label}
    </span>
  );
};

const KPI = ({ label, value, sub, accent, pulse }) => (
  <div style={{...S.card,borderColor:accent||colors.border,position:"relative",overflow:"hidden"}} className={pulse?"pulse-amber":""}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:accent||colors.dim}} />
    <p style={{color:colors.muted,fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>{label}</p>
    <p style={{color:colors.text,fontSize:22,fontFamily:"'Space Mono',monospace",fontWeight:700,lineHeight:1.1}}>{value}</p>
    {sub && <p style={{color:colors.muted,fontSize:11,marginTop:4,fontFamily:"'Barlow',sans-serif"}}>{sub}</p>}
  </div>
);

const SectionHeader = ({ title, sub, reg }) => (
  <div style={{marginBottom:16}}>
    <div style={{display:"flex",alignItems:"baseline",gap:12,flexWrap:"wrap"}}>
      <h2 style={{color:colors.text,fontSize:16,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",margin:0}}>{title}</h2>
      {reg && <span style={{color:colors.cyan,fontSize:11,fontFamily:"'Space Mono',monospace"}}>{reg}</span>}
    </div>
    {sub && <p style={{color:colors.muted,fontSize:12,fontFamily:"'Barlow',sans-serif",marginTop:2}}>{sub}</p>}
  </div>
);

const TH = ({children}) => <th style={{color:colors.muted,fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",padding:"6px 12px 6px 0",textAlign:"left",whiteSpace:"nowrap",borderBottom:`1px solid ${colors.border}`}}>{children}</th>;
const TD = ({children,mono,accent}) => <td style={{padding:"9px 12px 9px 0",color:accent||colors.text,fontSize:12,fontFamily:mono?"'Space Mono',monospace":"'Barlow',sans-serif",borderBottom:`1px solid rgba(22,37,53,0.6)`,whiteSpace:"nowrap"}}>{children}</td>;

const Bar = ({ pct, color="#06b6d4", height=16, label, sublabel }) => (
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
    {label && <span style={{color:colors.muted,fontSize:11,fontFamily:"'Space Mono',monospace",width:80,flexShrink:0,textAlign:"right"}}>{label}</span>}
    <div style={{flex:1,background:"rgba(255,255,255,0.05)",borderRadius:3,height,overflow:"hidden"}}>
      <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:3,transition:"width 0.5s ease"}} />
    </div>
    {sublabel && <span style={{color,fontSize:11,fontFamily:"'Space Mono',monospace",width:70,textAlign:"right",flexShrink:0}}>{sublabel}</span>}
  </div>
);

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function DashboardTab() {
  const leaks = LDAR_DATA.filter(r=>r.status==="Leaking").length;
  const openIncidents = INCIDENTS.filter(r=>r.status==="Open").length;
  const bwonNon = BWON_DATA.filter(r=>!r.compliant).length;
  const totalCO2e = GHG_DATA.reduce((s,r)=>s+r.CO2e,0);
  const permitRed = PERMITS_DATA.filter(p=>daysUntil(p.expiry)<90).length;
  const rcra90 = RCRA_DATA.filter(r=>r.elapsed>80).length;
  const openCAs = CORRECTIVE_ACTIONS.filter(c=>c.status!=="Closed").length;

  const alerts = [
    leaks > 0 && {level:"CRITICAL",msg:`${leaks} active LDAR leaks — repair deadline approaching`,tab:"ldar"},
    openIncidents > 0 && {level:"HIGH",msg:`${openIncidents} open regulatory incidents require action`,tab:"incidents"},
    bwonNon > 0 && {level:"HIGH",msg:`${bwonNon} BWON waste streams non-compliant (40 CFR §61)`,tab:"bwon"},
    permitRed > 0 && {level:"URGENT",msg:`${permitRed} permit(s) expire within 90 days — action required`,tab:"permits"},
    rcra90 > 0 && {level:"HIGH",msg:`${rcra90} RCRA waste approaching 90-day accumulation limit`,tab:"rcra"},
    CEMS_DATA.filter(c=>c.status==="Warning").length > 0 && {level:"WARNING",msg:"SRU Incinerator SO₂ CEMS reading elevated (438 ppm)",tab:"cems"},
  ].filter(Boolean);

  return (
    <div className="animate-slide">
      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:10,padding:"12px 16px",marginBottom:20}}>
          <p style={{color:"#fca5a5",fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>⚡ Active Compliance Alerts — {alerts.length} Items</p>
          {alerts.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:12,marginBottom:4,alignItems:"flex-start"}}>
              <Badge label={a.level} color={a.level==="CRITICAL"||a.level==="URGENT"?"red":a.level==="HIGH"?"amber":"blue"} />
              <span style={{color:"#fcd34d",fontSize:12,fontFamily:"'Barlow',sans-serif"}}>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:20}}>
        <KPI label="Active LDAR Leaks" value={leaks} sub="15-day repair deadline" accent="#ef4444" pulse={leaks>0} />
        <KPI label="Annual GHG" value={`${(totalCO2e/1000).toFixed(0)}K MT`} sub="CO₂e · Scope 1 · 40 CFR 98" accent={colors.cyan} />
        <KPI label="Open Incidents" value={openIncidents} sub="NOVs, deviations, exceedances" accent={openIncidents>0?"#f59e0b":colors.border} />
        <KPI label="Permit Compliance" value={`${PERMITS_DATA.filter(p=>p.status==="Active").length}/${PERMITS_DATA.length}`} sub="Active permits" accent={colors.green} />
        <KPI label="Open CAs" value={openCAs} sub="Corrective actions" accent={openCAs>3?"#f59e0b":colors.border} />
        <KPI label="Stack Tests" value={`${STACK_TESTS.filter(s=>s.status==="Pass").length}/${STACK_TESTS.length}`} sub="Passing" accent={colors.violet} />
        <KPI label="BWON Streams" value={`${BWON_DATA.filter(r=>r.compliant).length}/${BWON_DATA.length}`} sub="Compliant · 40 CFR 61" accent="#f59e0b" />
        <KPI label="RCRA Waste" value={RCRA_DATA.length} sub="Active waste streams" accent={colors.violet} />
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {/* GHG Sparkline */}
        <div style={S.card}>
          <SectionHeader title="GHG Trend — 2025" reg="40 CFR Part 98" sub="Monthly CO₂e emissions (MT)" />
          <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80}}>
            {GHG_DATA.map((r,i)=>{
              const pct=(r.CO2e/16000)*100;
              const isHigh=r.CO2e>14000;
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{width:"100%",background:isHigh?"#f59e0b":"#06b6d4",borderRadius:"2px 2px 0 0",height:`${pct}%`,opacity:0.8}} />
                  <span style={{color:colors.muted,fontSize:9,fontFamily:"'Space Mono',monospace"}}>{r.month.substring(0,1)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CEMS Live */}
        <div style={S.card}>
          <SectionHeader title="CEMS — Live Readings" sub="Continuous Emission Monitoring System" />
          {CEMS_DATA.map((c,i)=>{
            const pct=(c.current_ppm/c.limit_ppm)*100;
            const col=pct>80?"#ef4444":pct>60?"#f59e0b":"#10b981";
            return (
              <div key={i} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{color:colors.muted,fontSize:10,fontFamily:"'Barlow',sans-serif"}}>{c.unit} · {c.pollutant}</span>
                  <span style={{color:col,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{c.current_ppm} / {c.limit_ppm} ppm</span>
                </div>
                <Bar pct={pct} color={col} height={6} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Regulatory Calendar */}
      <div style={S.card}>
        <SectionHeader title="2026 Regulatory Deadline Calendar" />
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
          {[
            {date:"Feb 28",task:"EPA Biennial RCRA Report",urgency:"red"},
            {date:"Mar 1",task:"Annual Compliance Certification (Title V)",urgency:"red"},
            {date:"Mar 15",task:"NPDES Permit Renewal — OVERDUE",urgency:"red"},
            {date:"Mar 15",task:"SPCC Lube Oil AST Corrective Action",urgency:"amber"},
            {date:"Apr 1",task:"Q1 Stormwater BMPs Inspection",urgency:"amber"},
            {date:"Apr 15",task:"GHG Annual Report — 40 CFR Part 98",urgency:"amber"},
            {date:"Apr 30",task:"BWON Corrective Action — API Separator",urgency:"amber"},
            {date:"Jun 15",task:"RMP 5-Year Resubmission Deadline",urgency:"amber"},
            {date:"Jun 30",task:"LDAR Semi-Annual Report",urgency:"blue"},
            {date:"Jul 1",task:"HAP Emission Inventory Update",urgency:"blue"},
            {date:"Aug 15",task:"Benzene NESHAP Awareness Recertification",urgency:"amber"},
            {date:"Dec 31",task:"Air Permit-by-Rule Annual Self-Certification",urgency:"blue"},
          ].map((r,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",background:"rgba(255,255,255,0.02)",borderRadius:6,border:`1px solid ${r.urgency==="red"?"rgba(239,68,68,0.2)":r.urgency==="amber"?"rgba(245,158,11,0.15)":"rgba(59,130,246,0.1)"}`}}>
              <span style={{color:r.urgency==="red"?"#fca5a5":r.urgency==="amber"?"#fcd34d":"#93c5fd",fontSize:11,fontFamily:"'Space Mono',monospace",flexShrink:0,minWidth:48}}>{r.date}</span>
              <span style={{color:colors.text,fontSize:11,fontFamily:"'Barlow',sans-serif",lineHeight:1.4}}>{r.task}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LDAR TAB ────────────────────────────────────────────────────────────────
function LDARTab() {
  const [filter,setFilter]=useState("All");
  const statuses=["All","No Leak","Leaking","Repair Done"];
  const filtered=filter==="All"?LDAR_DATA:LDAR_DATA.filter(r=>r.status===filter);
  const leaks=LDAR_DATA.filter(r=>r.status==="Leaking");

  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Total Components" value={LDAR_DATA.length} sub="Monitored components" accent={colors.cyan} />
        <KPI label="Active Leaks" value={leaks.length} sub="15-day repair required" accent="#ef4444" pulse />
        <KPI label="Highest Reading" value="4,100 ppm" sub="AGT-220 · DAO Unit" accent="#f59e0b" />
        <KPI label="Program Compliance" value={`${Math.round(((LDAR_DATA.length-leaks.length)/LDAR_DATA.length)*100)}%`} sub="Component pass rate" accent={colors.green} />
      </div>

      {leaks.map(l=>(
        <div key={l.id} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:10,padding:"12px 16px",display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}} className="pulse-red">
          <div>
            <Badge label="⚡ ACTIVE LEAK" color="red" />
            <span style={{color:"#fca5a5",fontSize:13,fontFamily:"'Barlow',sans-serif",marginLeft:10}}>{l.tag} · {l.unit} · {l.type} · {l.service} service</span>
          </div>
          <span style={{color:"#fcd34d",fontSize:12,fontFamily:"'Space Mono',monospace"}}>{l.ppm.toLocaleString()} ppm</span>
          {l.repairDue&&<span style={{color:"#fca5a5",fontSize:11}}>Repair due: <strong>{l.repairDue}</strong> ({daysUntil(l.repairDue)}d)</span>}
        </div>
      ))}

      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <SectionHeader title="Component Inspection Log" reg="40 CFR Part 63 Subpart H / UUU" />
          <div style={{display:"flex",gap:6}}>
            {statuses.map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,letterSpacing:"0.05em",fontWeight:600,background:filter===s?"#06b6d4":"rgba(255,255,255,0.05)",color:filter===s?"#000":colors.muted}}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>ID</TH><TH>Tag</TH><TH>Type</TH><TH>Service</TH><TH>Unit</TH><TH>Last Insp.</TH><TH>PPM</TH><TH>Method</TH><TH>Status</TH><TH>Repair Due</TH></tr></thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id}>
                  <TD mono accent={colors.cyan}>{r.id}</TD>
                  <TD mono>{r.tag}</TD>
                  <TD>{r.type}</TD>
                  <TD><Badge label={r.service} color={r.service==="Benzene"?"red":"gray"} /></TD>
                  <TD mono>{r.unit}</TD>
                  <TD>{r.lastInsp}</TD>
                  <TD mono accent={r.ppm>500?"#ef4444":r.ppm>200?"#f59e0b":"#10b981"}>{r.ppm.toLocaleString()}</TD>
                  <TD>{r.method}</TD>
                  <TD><Badge label={r.status} color={r.status==="Leaking"?"red":r.status==="Repair Done"?"amber":"green"} /></TD>
                  <TD mono accent="#fca5a5">{r.repairDue||"—"}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={S.card}>
        <SectionHeader title="PPM Reading — All Components" sub="500 ppm action level per 40 CFR §63.169" />
        {LDAR_DATA.sort((a,b)=>b.ppm-a.ppm).map(r=>{
          const col=r.ppm>500?"#ef4444":r.ppm>200?"#f59e0b":"#10b981";
          return <Bar key={r.id} pct={(r.ppm/5000)*100} color={col} label={r.tag} sublabel={`${r.ppm.toLocaleString()} ppm`} height={14} />;
        })}
      </div>
    </div>
  );
}

// ─── GHG TAB ────────────────────────────────────────────────────────────────
function GHGTab() {
  const [gasType,setGasType]=useState("CO2e");
  const [calc,setCalc]=useState({fuel:"Natural Gas",mmBtu:""});
  const EF={"Natural Gas":53.06,"Diesel":73.96,"Residual Fuel Oil":75.1,"Propane":62.87,"Coal (bituminous)":94.35};
  const calcResult = calc.mmBtu?((parseFloat(calc.mmBtu)||0)*(EF[calc.fuel]||0)/1000).toFixed(2):null;
  const totalAnnual=GHG_DATA.reduce((s,r)=>s+r.CO2e,0);
  const gas_map={CO2e:"CO₂e (MT)",CH4:"CH₄ (MT)",N2O:"N₂O (MT)",combustion:"Combustion CO₂ (MT)",fugitive:"Fugitive (MT)"};
  const maxVal=Math.max(...GHG_DATA.map(r=>r[gasType]||r.CO2e));
  const thisYear=new Date().getFullYear();

  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Annual CO₂e" value={`${(totalAnnual/1000).toFixed(1)}K MT`} sub="Scope 1 · 2025" accent={colors.cyan} />
        <KPI label="Monthly Peak" value="15,100 MT" sub="July 2025 — high production" accent="#f59e0b" />
        <KPI label="Reporting Threshold" value="25K MT" sub="40 CFR §98.2 trigger" accent={colors.border} />
        <KPI label="Facility Status" value="ABOVE" sub="Subject to mandatory reporting" accent="#ef4444" />
      </div>

      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <SectionHeader title="Monthly GHG Emissions" reg="40 CFR Part 98" sub={gas_map[gasType]} />
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {Object.keys(gas_map).map(g=>(
              <button key={g} onClick={()=>setGasType(g)} style={{padding:"3px 10px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,background:gasType===g?"#06b6d4":"rgba(255,255,255,0.05)",color:gasType===g?"#000":colors.muted}}>
                {g.replace("combustion","Comb.").replace("fugitive","Fugitive")}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:120,padding:"0 0 20px 0"}}>
          {GHG_DATA.map((r,i)=>{
            const val=r[gasType]||r.CO2e;
            const pct=(val/maxVal)*100;
            const isHigh=val>13000;
            return (
              <div key={i} title={`${r.month}: ${val.toLocaleString()}`} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
                <span style={{color:isHigh?"#f59e0b":"#64748b",fontSize:9,fontFamily:"'Space Mono',monospace",whiteSpace:"nowrap"}}>{val.toLocaleString()}</span>
                <div style={{width:"100%",background:isHigh?"#f59e0b":"#06b6d4",borderRadius:"3px 3px 0 0",height:`${pct}%`,opacity:0.85,minHeight:4,transition:"height 0.4s ease"}} />
                <span style={{color:colors.muted,fontSize:9,fontFamily:"'Barlow Condensed',sans-serif"}}>{r.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={S.card}>
          <SectionHeader title="Emission Calculator" reg="EPA Equation C-1" sub="Stationary combustion — 40 CFR Part 98 Table C-1" />
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <label style={{color:colors.muted,fontSize:11,display:"block",marginBottom:4,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Fuel Type</label>
              <select value={calc.fuel} onChange={e=>setCalc({...calc,fuel:e.target.value})}
                style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${colors.border}`,color:colors.text,borderRadius:6,padding:"8px 10px",fontFamily:"'Barlow',sans-serif",fontSize:13}}>
                {Object.keys(EF).map(f=><option key={f} style={{background:"#0d1620"}}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{color:colors.muted,fontSize:11,display:"block",marginBottom:4,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Annual Heat Input (MMBtu)</label>
              <input type="number" value={calc.mmBtu} onChange={e=>setCalc({...calc,mmBtu:e.target.value})} placeholder="e.g. 85000"
                style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${colors.border}`,color:colors.text,borderRadius:6,padding:"8px 10px",fontFamily:"'Space Mono',monospace",fontSize:13}} />
            </div>
            <div style={{background:calcResult?"rgba(16,185,129,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${calcResult?"rgba(16,185,129,0.3)":colors.border}`,borderRadius:8,padding:12,textAlign:"center"}}>
              {calcResult
                ?<><p style={{color:"#6ee7b7",fontSize:20,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{calcResult} MT CO₂</p><p style={{color:colors.muted,fontSize:11}}>EF: {EF[calc.fuel]} kg CO₂/MMBtu</p></>
                :<p style={{color:colors.muted,fontSize:12,fontFamily:"'Barlow',sans-serif"}}>Enter values to calculate</p>
              }
            </div>
            <p style={{color:colors.muted,fontSize:10,fontFamily:"'Barlow',sans-serif"}}>Formula: CO₂ (MT) = MMBtu × EF(kg/MMBtu) ÷ 1,000</p>
          </div>
        </div>

        <div style={S.card}>
          <SectionHeader title="Subpart Coverage" sub="40 CFR Part 98 applicable subparts" />
          {[
            {sub:"Subpart C",title:"General Stationary Combustion",applicability:"Fired heaters, boilers, turbines"},
            {sub:"Subpart W",title:"Petroleum and Natural Gas",applicability:"Fugitive emissions — equipment leaks"},
            {sub:"Subpart Y",title:"Petroleum Refineries",applicability:"Fluid Catalytic Cracking, process vents"},
            {sub:"Subpart CC",title:"Sour Natural Gas Processing",applicability:"Gas treating, sulfur recovery"},
            {sub:"Subpart HH",title:"Municipal Solid Waste Landfills",applicability:"Not applicable — N/A"},
          ].map(s=>(
            <div key={s.sub} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:`1px solid ${colors.border}`}}>
              <span style={{color:colors.cyan,fontFamily:"'Space Mono',monospace",fontSize:11,flexShrink:0,width:90}}>{s.sub}</span>
              <div>
                <p style={{color:colors.text,fontSize:12,fontFamily:"'Barlow',sans-serif",fontWeight:600}}>{s.title}</p>
                <p style={{color:colors.muted,fontSize:11}}>{s.applicability}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BWON TAB ────────────────────────────────────────────────────────────────
function BWONTab() {
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Total Streams" value={BWON_DATA.length} sub="Benzene-bearing waste" accent={colors.cyan} />
        <KPI label="Compliant" value={`${BWON_DATA.filter(r=>r.compliant).length}/${BWON_DATA.length}`} sub="40 CFR Part 61 Sub FF" accent={colors.green} />
        <KPI label="Non-Compliant" value={BWON_DATA.filter(r=>!r.compliant).length} sub="Control upgrade required" accent="#ef4444" pulse />
        <KPI label="BWON Threshold" value="10 lb/yr" sub="Annual benzene emissions cap" accent={colors.violet} />
      </div>

      <div style={S.card}>
        <SectionHeader title="BWON Waste Stream Monitoring" reg="40 CFR Part 61 Subpart FF" sub="Benzene Waste Operations NESHAP — annual benzene emission limits" />
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Stream</TH><TH>Waste Stream Name</TH><TH>Benzene (ppm)</TH><TH>Flow (gal/hr)</TH><TH>Annual Load (lb/yr)</TH><TH>Control Device</TH><TH>Efficiency</TH><TH>Status</TH></tr></thead>
            <tbody>
              {BWON_DATA.map(r=>(
                <tr key={r.id}>
                  <TD mono accent={colors.cyan}>{r.id}</TD>
                  <TD>{r.stream}</TD>
                  <TD mono accent={r.benzene_ppm>5000?"#ef4444":r.benzene_ppm>2000?"#f59e0b":"#10b981"}>{r.benzene_ppm.toLocaleString()}</TD>
                  <TD mono>{r.flow.toLocaleString()}</TD>
                  <TD mono accent={r.annual_lb>10?"#ef4444":"#10b981"}><strong>{r.annual_lb}</strong></TD>
                  <TD>{r.control}</TD>
                  <TD mono accent={r.eff<95?"#ef4444":"#10b981"}>{r.eff}%</TD>
                  <TD><Badge label={r.compliant?"Compliant":"Non-Compliant"} color={r.compliant?"green":"red"} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={S.card}>
          <SectionHeader title="Annual Benzene Loading" sub="▲ Red = exceeds 10 lb/yr threshold" />
          {BWON_DATA.map(r=>{
            const col=r.annual_lb>10?"#ef4444":"#10b981";
            return <Bar key={r.id} pct={(r.annual_lb/160)*100} color={col} label={r.id} sublabel={`${r.annual_lb} lb/yr`} height={14} />;
          })}
          <div style={{marginTop:8,borderTop:`1px solid ${colors.border}`,paddingTop:8}}>
            <p style={{color:"#fcd34d",fontSize:11,fontFamily:"'Barlow',sans-serif"}}>🔶 10 lb/yr threshold = BWON control requirement (40 CFR §61.342)</p>
          </div>
        </div>

        <div style={S.card}>
          <SectionHeader title="Required Controls by Stream Type" sub="Regulatory basis for each control method" />
          {[
            {type:"Steam Strippers",basis:"§61.348 — Water streams ≥10 ppm benzene",status:"Compliant"},
            {type:"Closed-Loop Systems",basis:"§61.349 — Prevent benzene emissions",status:"Compliant"},
            {type:"Fixed Roof Tanks",basis:"§61.350 — Non-compliant without vapor recovery",status:"Action"},
            {type:"Internal Floating Roof",basis:"§61.351 — Acceptable control for liquids",status:"Compliant"},
            {type:"Bioscrubbers / WWTP",basis:"§61.354 — WWTP benzene emissions control",status:"Action"},
          ].map(r=>(
            <div key={r.type} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${colors.border}`}}>
              <div>
                <p style={{color:colors.text,fontSize:12,fontFamily:"'Barlow',sans-serif",fontWeight:600}}>{r.type}</p>
                <p style={{color:colors.muted,fontSize:10}}>{r.basis}</p>
              </div>
              <Badge label={r.status} color={r.status==="Compliant"?"green":"red"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SPCC TAB ────────────────────────────────────────────────────────────────
function SPCCTab() {
  const totalBbl = SPCC_DATA.reduce((s,r)=>s+r.capacity_bbl,0);
  const nonComp = SPCC_DATA.filter(r=>r.status!=="Compliant").length;
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Total Oil Storage" value={`${(totalBbl/1000).toFixed(0)}K bbl`} sub="Aggregate capacity" accent={colors.amber} />
        <KPI label="SPCC Plan" value="Required" sub="≥1,320 gal aboveground" accent={colors.cyan} />
        <KPI label="Non-Compliant ASTs" value={nonComp} sub="Require corrective action" accent={nonComp>0?"#ef4444":colors.border} pulse={nonComp>0} />
        <KPI label="PE Certification" value="Required" sub="≥10,000 gal capacity" accent={colors.violet} />
      </div>

      <div style={S.card}>
        <SectionHeader title="Aboveground Storage Tank Inventory" reg="40 CFR Part 112" sub="Spill Prevention, Control and Countermeasure Plan — Secondary Containment Status" />
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Tank ID</TH><TH>Name</TH><TH>Capacity (bbl)</TH><TH>Product</TH><TH>Secondary Containment</TH><TH>Last Inspection</TH><TH>Tier</TH><TH>Status</TH></tr></thead>
            <tbody>
              {SPCC_DATA.map(r=>(
                <tr key={r.id}>
                  <TD mono accent={colors.cyan}>{r.id}</TD>
                  <TD>{r.name}</TD>
                  <TD mono>{r.capacity_bbl.toLocaleString()}</TD>
                  <TD>{r.product}</TD>
                  <TD accent={r.secondary==="None"?"#ef4444":colors.text}>{r.secondary}</TD>
                  <TD>{r.inspection}</TD>
                  <TD><Badge label={r.tier} color="blue" /></TD>
                  <TD><Badge label={r.status} color={r.status==="Compliant"?"green":r.status==="Deficiency"?"amber":"red"} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={S.card}>
          <SectionHeader title="SPCC Plan Requirements" sub="40 CFR §112.7 minimum elements" />
          {[
            {req:"PE-Certified SPCC Plan",status:"Current","date":"2023-04-15"},
            {req:"5-Year Plan Amendment Review",status:"Due 2028-04-15","date":"Next"},
            {req:"Secondary Containment — 110% largest tank",status:"Partial","date":"See CA-002"},
            {req:"Facility Inspection Records",status:"Current","date":"Quarterly"},
            {req:"Discharge Notification Procedures",status:"Current","date":"Posted"},
            {req:"Oil Spill Response Contractor",status:"On-File","date":"Clean Response LLC"},
            {req:"Personnel Training Records",status:"Current","date":"Annual"},
          ].map(r=>(
            <div key={r.req} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"7px 0",borderBottom:`1px solid ${colors.border}`,gap:8}}>
              <div>
                <p style={{color:colors.text,fontSize:12,fontFamily:"'Barlow',sans-serif"}}>{r.req}</p>
                <p style={{color:colors.muted,fontSize:10}}>{r.date}</p>
              </div>
              <Badge label={r.status} color={r.status==="Current"||r.status==="On-File"?"green":r.status==="Partial"?"amber":"red"} />
            </div>
          ))}
        </div>

        <div style={S.card}>
          <SectionHeader title="Discharge Response Tiers" sub="OPA 90 / SPCC response levels" />
          {[
            {tier:"Tier 1",level:"Small Discharge",action:"On-site containment, spill kit, report to supervisor",volume:"< 1 bbl"},
            {tier:"Tier 2",level:"Medium Discharge",action:"Deploy absorbents, notify EH&S Manager, assess waterbody impact",volume:"1–10 bbl"},
            {tier:"Tier 3",level:"Large Discharge",action:"Activate ERP, notify National Response Center (800-424-8802), mobilize contractor",volume:"> 10 bbl"},
          ].map(r=>(
            <div key={r.tier} style={{padding:10,background:"rgba(255,255,255,0.02)",border:`1px solid ${colors.border}`,borderRadius:8,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <Badge label={`${r.tier} — ${r.level}`} color={r.tier==="Tier 3"?"red":r.tier==="Tier 2"?"amber":"green"} />
                <span style={{color:colors.muted,fontSize:11,fontFamily:"'Space Mono',monospace"}}>{r.volume}</span>
              </div>
              <p style={{color:colors.text,fontSize:11,fontFamily:"'Barlow',sans-serif",lineHeight:1.5}}>{r.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RCRA TAB ────────────────────────────────────────────────────────────────
function RCRATab() {
  const near90 = RCRA_DATA.filter(r=>r.elapsed>80).length;
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Active Waste Streams" value={RCRA_DATA.length} sub="Hazardous waste codes" accent={colors.cyan} />
        <KPI label="Approaching 90 Days" value={near90} sub="Large Quantity Generator" accent={near90>0?"#ef4444":colors.border} pulse={near90>0} />
        <KPI label="Generator Status" value="LQG" sub="≥1,000 kg/month — Site" accent="#f59e0b" />
        <KPI label="Biennial Report" value="Feb 2026" sub="Due — submit to EPA R6" accent="#ef4444" />
      </div>

      <div style={S.card}>
        <SectionHeader title="Hazardous Waste Accumulation Tracking" reg="40 CFR Parts 260–262" sub="90-day accumulation limit for LQG facilities" />
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Waste Code</TH><TH>Description</TH><TH>Volume (lbs)</TH><TH>Container</TH><TH>SAA Location</TH><TH>Generated</TH><TH>Days Elapsed</TH><TH>Status</TH></tr></thead>
            <tbody>
              {RCRA_DATA.map(r=>{
                const pct=(r.elapsed/90)*100;
                const col=pct>89?"#ef4444":pct>70?"#f59e0b":"#10b981";
                return (
                  <tr key={r.code}>
                    <TD mono accent={colors.cyan}>{r.code}</TD>
                    <TD>{r.name}</TD>
                    <TD mono>{r.volume_lbs.toLocaleString()}</TD>
                    <TD>{r.container}</TD>
                    <TD mono>{r.area}</TD>
                    <TD>{r.generated}</TD>
                    <TD>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:60,background:"rgba(255,255,255,0.05)",borderRadius:3,height:8}}>
                          <div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:3}} />
                        </div>
                        <span style={{color:col,fontSize:11,fontFamily:"'Space Mono',monospace"}}>{r.elapsed}/90</span>
                      </div>
                    </TD>
                    <TD><Badge label={r.status} color={r.elapsed>80?"red":r.elapsed>60?"amber":"green"} /></TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={S.card}>
          <SectionHeader title="LQG Compliance Requirements" sub="40 CFR §262 — Large Quantity Generator obligations" />
          {[
            {req:"EPA ID Number",status:"TXD980749922","note":"Active"},
            {req:"90-Day Limit — No Extensions",status:"Tracking","note":"F037 approaching"},
            {req:"Emergency Coordinator On-Call",status:"Designated","note":"Emmanuel Igbokwe"},
            {req:"Emergency Response Plan (ERP)",status:"Current","note":"Rev 2024-06"},
            {req:"Manifesting — Uniform HW Manifest",status:"Compliant","note":"All shipments"},
            {req:"Land Disposal Restriction (LDR) Notif.",status:"Compliant","note":"With each manifest"},
            {req:"Personnel Training — 40 CFR §262.17",status:"Current","note":"Annual + new employee"},
            {req:"Biennial Report",status:"Due Now","note":"Report Year 2025"},
          ].map(r=>(
            <div key={r.req} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${colors.border}`,gap:8,alignItems:"center"}}>
              <div><p style={{color:colors.text,fontSize:12,fontFamily:"'Barlow',sans-serif"}}>{r.req}</p><p style={{color:colors.muted,fontSize:10}}>{r.note}</p></div>
              <Badge label={r.status} color={r.status==="Current"||r.status==="Compliant"||r.status==="Designated"?"green":r.status==="Tracking"||r.status==="Due Now"?"red":"amber"} />
            </div>
          ))}
        </div>

        <div style={S.card}>
          <SectionHeader title="Refinery-Specific Listed Wastes" sub="F/K wastes from petroleum refining operations" />
          {[
            {code:"F037",desc:"Primary oil/water/solids separation sludge (API separator)"},
            {code:"F038",desc:"Secondary oil/water/solids separation sludge"},
            {code:"K048",desc:"Dissolved air flotation (DAF) float from petroleum refining"},
            {code:"K049",desc:"Slop oil emulsion solids from petroleum refining"},
            {code:"K050",desc:"Heat exchanger bundle cleaning sludge"},
            {code:"K051",desc:"API separator sludge from petroleum refining"},
            {code:"K052",desc:"Tank bottoms (leaded) from petroleum refining"},
          ].map(r=>(
            <div key={r.code} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${colors.border}`}}>
              <span style={{color:"#f59e0b",fontFamily:"'Space Mono',monospace",fontSize:11,flexShrink:0,width:44}}>{r.code}</span>
              <span style={{color:colors.text,fontSize:11,fontFamily:"'Barlow',sans-serif",lineHeight:1.4}}>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RMP TAB ────────────────────────────────────────────────────────────────
function RMPTab() {
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:10,padding:"12px 16px"}}>
        <Badge label="⚠️ RMP 5-YEAR RESUBMISSION DUE — Jun 15, 2026" color="red" />
        <p style={{color:"#fca5a5",fontSize:12,fontFamily:"'Barlow',sans-serif",marginTop:6}}>Risk Management Plan last submitted June 2021. Resubmission required within 5 years per 40 CFR §68.190. HF Acid, Chlorine, and Ammonia threshold quantities exceeded. Program Level 3 required.</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Program Level" value="Level 3" sub="PSM-covered processes" accent="#ef4444" />
        <KPI label="Regulated Chemicals" value={RMP_SCENARIOS.filter(r=>r.status!=="Monitor").length} sub="Above threshold" accent="#f59e0b" />
        <KPI label="Worst Case Distance" value="2.4 mi" sub="HF Acid full tank rupture" accent="#ef4444" />
        <KPI label="Population at Risk" value="8,200+" sub="Within worst-case endpoint" accent="#f59e0b" />
      </div>

      <div style={S.card}>
        <SectionHeader title="Regulated Substance Inventory & Worst-Case Scenarios" reg="40 CFR Part 68" sub="RMP offsite consequence analysis — worst-case and alternative scenarios" />
        {RMP_SCENARIOS.map(r=>(
          <div key={r.chem} style={{padding:12,background:"rgba(255,255,255,0.02)",border:`1px solid ${r.status==="Overdue"?"rgba(239,68,68,0.3)":colors.border}`,borderRadius:8,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}>
              <div>
                <p style={{color:colors.text,fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,margin:0}}>{r.chem}</p>
                <p style={{color:colors.muted,fontSize:11,marginTop:2}}>{r.scenario}</p>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <Badge label={`${r.qty_lbs.toLocaleString()} lbs on-site`} color="amber" />
                <Badge label={r.status==="Overdue"?"Review Overdue":r.status==="Monitor"?"Below RQ":"Active"} color={r.status==="Overdue"?"red":r.status==="Monitor"?"blue":"green"} />
              </div>
            </div>
            {r.distance_mi&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:8}}>
                {[
                  {label:"Threshold (lbs)",val:r.threshold_lbs.toLocaleString()},
                  {label:"On-Site Qty (lbs)",val:r.qty_lbs.toLocaleString()},
                  {label:"Endpoint Distance",val:`${r.distance_mi} mi`},
                  {label:"Pop. in Zone",val:r.pop_affected?.toLocaleString()},
                ].map(s=>(
                  <div key={s.label} style={{background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"6px 8px"}}>
                    <p style={{color:colors.muted,fontSize:9,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>{s.label}</p>
                    <p style={{color:colors.text,fontSize:13,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{s.val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={S.card}>
          <SectionHeader title="Prevention Program (PSM Integration)" sub="40 CFR §68.65 — Program Level 3 elements" />
          {[
            {elem:"Process Safety Information (PSI)",status:"Complete"},
            {elem:"Process Hazard Analysis (PHA)",status:"Due 2027"},
            {elem:"Operating Procedures",status:"Current"},
            {elem:"Training — Initial & Refresher",status:"Current"},
            {elem:"Mechanical Integrity Program",status:"Current"},
            {elem:"Management of Change (MOC)",status:"Active"},
            {elem:"Pre-Startup Safety Review (PSSR)",status:"Active"},
            {elem:"Incident Investigation",status:"Current"},
            {elem:"Emergency Response Program",status:"Needs Update"},
          ].map(r=>(
            <div key={r.elem} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${colors.border}`,gap:8}}>
              <span style={{color:colors.text,fontSize:12,fontFamily:"'Barlow',sans-serif"}}>{r.elem}</span>
              <Badge label={r.status} color={r.status==="Current"||r.status==="Complete"||r.status==="Active"?"green":r.status.includes("Due")?"amber":"red"} />
            </div>
          ))}
        </div>

        <div style={S.card}>
          <SectionHeader title="Emergency Response Program" sub="40 CFR §68.90 — Community coordination" />
          {[
            {item:"Local Emergency Planning Committee (LEPC)",detail:"Annual coordination meeting — scheduled Apr 2026"},
            {item:"Emergency Response Plan",detail:"Rev. 4 — 2023-09-01 — Update required"},
            {item:"Emergency Contact (NRC)",detail:"1-800-424-8802 — National Response Center"},
            {item:"Community Right-to-Know",detail:"EPCRA §§301-303 notifications current"},
            {item:"HF Acid Evacuation Zone",detail:"2.4 mi radius — Coordinate with county OEM"},
            {item:"Shelter-in-Place Procedures",detail:"Posted — last drill Nov 2025"},
          ].map(r=>(
            <div key={r.item} style={{padding:"8px 0",borderBottom:`1px solid ${colors.border}`}}>
              <p style={{color:colors.text,fontSize:12,fontFamily:"'Barlow',sans-serif",fontWeight:600}}>{r.item}</p>
              <p style={{color:colors.muted,fontSize:11}}>{r.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── WWTP/NPDES TAB ──────────────────────────────────────────────────────────
function WWTPTab() {
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="NPDES Permit" value="TX0023451" sub="⚠️ RENEWAL OVERDUE" accent="#ef4444" pulse />
        <KPI label="Parameters Monitored" value={WWTP_DATA.length} sub="Monthly effluent limits" accent={colors.cyan} />
        <KPI label="Exceedances" value={WWTP_DATA.filter(r=>!r.compliant).length} sub="This reporting period" accent="#f59e0b" />
        <KPI label="Wastewater Flow" value="~4.2 MGD" sub="Avg daily discharge" accent={colors.border} />
      </div>

      <div style={S.card}>
        <SectionHeader title="NPDES Effluent Monitoring — Monthly Average" reg="40 CFR §122" sub="Refinery effluent guidelines — 40 CFR Part 419 (Petroleum Refining)" />
        {WWTP_DATA.map(r=>{
          const avgNum=parseFloat(r.avg_mgL)||0;
          const limitNum=parseFloat(r.limit_mgL)||0;
          const pct=limitNum>0?(avgNum/limitNum)*100:0;
          const col=!r.compliant?"#ef4444":pct>80?"#f59e0b":"#10b981";
          return (
            <div key={r.param} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{color:colors.text,fontSize:13,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,width:120}}>{r.param}</span>
                  <Badge label={r.compliant?"Compliant":"EXCEEDANCE"} color={r.compliant?"green":"red"} />
                </div>
                <div style={{display:"flex",gap:16,textAlign:"right"}}>
                  <div>
                    <p style={{color:colors.muted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif"}}>Avg</p>
                    <p style={{color:col,fontFamily:"'Space Mono',monospace",fontSize:12}}>{r.avg_mgL} mg/L</p>
                  </div>
                  <div>
                    <p style={{color:colors.muted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif"}}>Max</p>
                    <p style={{color:parseFloat(r.max_mgL)>limitNum?"#ef4444":colors.muted,fontFamily:"'Space Mono',monospace",fontSize:12}}>{r.max_mgL} mg/L</p>
                  </div>
                  <div>
                    <p style={{color:colors.muted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif"}}>Limit</p>
                    <p style={{color:colors.muted,fontFamily:"'Space Mono',monospace",fontSize:12}}>{r.limit_mgL} mg/L</p>
                  </div>
                </div>
              </div>
              {limitNum>0&&<Bar pct={pct} color={col} height={10} />}
            </div>
          );
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={S.card}>
          <SectionHeader title="WWTP Treatment Train" sub="Unit process overview — refinery wastewater" />
          {[
            {step:"1",process:"API Gravity Separator",purpose:"Free oil removal — primary treatment"},
            {step:"2",process:"CPI Corrugated Plate Interceptor",purpose:"Enhanced oil/solids separation"},
            {step:"3",process:"Dissolved Air Flotation (DAF)",purpose:"Suspended solids, emulsified oil"},
            {step:"4",process:"Equalization Basin",purpose:"Flow/load equalization"},
            {step:"5",process:"Activated Sludge (Bio)",purpose:"BOD, phenol, ammonia removal"},
            {step:"6",process:"Secondary Clarifier",purpose:"Biomass separation"},
            {step:"7",process:"Multimedia Filtration",purpose:"TSS polishing"},
            {step:"8",process:"Effluent Holding Pond",purpose:"Final pH adjustment, monitoring"},
          ].map(r=>(
            <div key={r.step} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${colors.border}`,alignItems:"flex-start"}}>
              <span style={{color:colors.cyan,fontFamily:"'Space Mono',monospace",fontSize:11,flexShrink:0,width:20}}>{r.step}</span>
              <div>
                <p style={{color:colors.text,fontSize:12,fontFamily:"'Barlow',sans-serif",fontWeight:600}}>{r.process}</p>
                <p style={{color:colors.muted,fontSize:10}}>{r.purpose}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <SectionHeader title="Discharge Monitoring Report (DMR)" sub="Monthly DMR requirements — NPDES" />
          {[
            {item:"Monthly DMR Submission to EPA",due:"15th of following month",status:"Current"},
            {item:"DMR-QA Study (Annual)",due:"Sep 2026",status:"Upcoming"},
            {item:"Whole Effluent Toxicity (WET) Test",due:"Quarterly",status:"Q4 2025 Complete"},
            {item:"Stormwater SWPPP Inspection",due:"Quarterly",status:"Q1 2026 Due"},
            {item:"BMP Annual Evaluation",due:"Jan 2026",status:"Overdue"},
            {item:"SPDES Annual Report",due:"Mar 31, 2026",status:"Upcoming"},
          ].map(r=>(
            <div key={r.item} style={{padding:"8px 0",borderBottom:`1px solid ${colors.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <p style={{color:colors.text,fontSize:12,fontFamily:"'Barlow',sans-serif"}}>{r.item}</p>
                <Badge label={r.status} color={r.status==="Current"||r.status.includes("Complete")?"green":r.status==="Overdue"?"red":r.status.includes("Due")?"amber":"blue"} />
              </div>
              <p style={{color:colors.muted,fontSize:10,marginTop:2}}>{r.due}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FLARE / STACK TEST TAB ──────────────────────────────────────────────────
function FlareStackTab() {
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Flare Events (YTD)" value={FLARE_DATA.length} sub="2026 year-to-date" accent="#f59e0b" />
        <KPI label="Total SO₂" value={`${FLARE_DATA.reduce((s,r)=>s+r.so2_lbs,0)} lbs`} sub="Flaring emissions 2026" accent="#ef4444" />
        <KPI label="Unreported Events" value={FLARE_DATA.filter(r=>!r.reported).length} sub="⚠️ Requires deviation report" accent="#ef4444" pulse />
        <KPI label="Stack Test Failures" value={STACK_TESTS.filter(s=>s.status==="Fail").length} sub="Require corrective action" accent="#f59e0b" />
      </div>

      <div style={S.card}>
        <SectionHeader title="Flare Event Log" reg="40 CFR §63.670 / §60.103" sub="All flare events ≥15 minutes must be reported to state agency" />
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Date</TH><TH>Unit</TH><TH>Duration (min)</TH><TH>SO₂ (lbs)</TH><TH>H₂S (lbs)</TH><TH>Root Cause</TH><TH>Reported</TH><TH>Regulation</TH></tr></thead>
            <tbody>
              {FLARE_DATA.map((r,i)=>(
                <tr key={i}>
                  <TD mono>{r.date}</TD>
                  <TD><Badge label={r.unit} color="blue" /></TD>
                  <TD mono accent={r.duration_min>60?"#ef4444":r.duration_min>30?"#f59e0b":colors.text}>{r.duration_min}</TD>
                  <TD mono accent={r.so2_lbs>200?"#ef4444":"#f59e0b"}>{r.so2_lbs}</TD>
                  <TD mono accent={r.h2s_lbs>50?"#ef4444":colors.muted}>{r.h2s_lbs||"—"}</TD>
                  <TD>{r.cause}</TD>
                  <TD><Badge label={r.reported?"Reported":"NOT REPORTED"} color={r.reported?"green":"red"} /></TD>
                  <TD mono style={{fontSize:10}}>{r.citation}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {FLARE_DATA.filter(r=>!r.reported).length>0&&(
          <div style={{marginTop:12,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"10px 14px"}}>
            <p style={{color:"#fca5a5",fontSize:12}}><strong>⚡ Action Required:</strong> CDU flare event (Jan 10) not reported. Submit deviation report to agency within 2 business days. Document root cause, duration, and excess emissions per 40 CFR §63.10(d)(5).</p>
          </div>
        )}
      </div>

      <div style={S.card}>
        <SectionHeader title="Performance Stack Test Records" reg="40 CFR Parts 60/63" sub="Initial and subsequent performance tests — regulatory compliance demonstration" />
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Source Unit</TH><TH>Pollutant</TH><TH>Test Result</TH><TH>Permit Limit</TH><TH>Test Date</TH><TH>Next Due</TH><TH>Status</TH></tr></thead>
            <tbody>
              {STACK_TESTS.map((r,i)=>(
                <tr key={i}>
                  <TD>{r.unit}</TD>
                  <TD><Badge label={r.pollutant} color="cyan" /></TD>
                  <TD mono accent={r.status==="Fail"?"#ef4444":"#10b981"}>{r.result}</TD>
                  <TD mono>{r.limit}</TD>
                  <TD>{r.date}</TD>
                  <TD mono accent={daysUntil(r.next)<365?"#f59e0b":colors.muted}>{r.next}</TD>
                  <TD><Badge label={r.status} color={r.status==="Pass"?"green":"red"} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── INCIDENTS TAB ───────────────────────────────────────────────────────────
function IncidentsTab() {
  const [type,setType]=useState("All");
  const types=["All","NOV","Deviation","Spill","Near Miss","Exceedance"];
  const filtered=type==="All"?INCIDENTS:INCIDENTS.filter(r=>r.type===type);
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
        {["Open","Reported","Closed"].map(s=>(
          <KPI key={s} label={`${s} Incidents`} value={INCIDENTS.filter(r=>r.status===s).length}
            sub={s==="Open"?"Require active response":s==="Reported"?"Submitted to agency":"Resolved"}
            accent={s==="Open"?"#ef4444":s==="Reported"?"#f59e0b":colors.border} pulse={s==="Open"} />
        ))}
        <KPI label="Severity — High" value={INCIDENTS.filter(r=>r.severity==="High").length} sub="Priority resolution" accent="#ef4444" />
      </div>

      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <SectionHeader title="Regulatory Incident Tracker" sub="NOVs, deviations, exceedances, spills, near-misses" />
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {types.map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{padding:"3px 10px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:600,background:type===t?"#06b6d4":"rgba(255,255,255,0.05)",color:type===t?"#000":colors.muted}}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {filtered.map(r=>(
          <div key={r.id} style={{padding:12,background:"rgba(255,255,255,0.02)",border:`1px solid ${r.status==="Open"?"rgba(239,68,68,0.3)":r.status==="Reported"?"rgba(245,158,11,0.2)":colors.border}`,borderRadius:8,marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{color:colors.cyan,fontFamily:"'Space Mono',monospace",fontSize:11}}>{r.id}</span>
                <Badge label={r.type} color={r.type==="NOV"?"red":r.type==="Spill"?"amber":r.type==="Deviation"?"violet":"blue"} />
                <Badge label={r.severity} color={r.severity==="High"?"red":r.severity==="Medium"?"amber":"green"} />
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:colors.muted,fontSize:11,fontFamily:"'Space Mono',monospace"}}>{r.date}</span>
                <Badge label={r.unit} color="blue" />
                <Badge label={r.status} color={r.status==="Open"?"red":r.status==="Reported"?"amber":"green"} />
              </div>
            </div>
            <p style={{color:colors.text,fontSize:13,fontFamily:"'Barlow',sans-serif",marginBottom:4}}>{r.desc}</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{color:"#93c5fd",fontSize:11}}>Action: {r.action}</span>
              {r.regulator!=="None"&&<Badge label={`Regulator: ${r.regulator}`} color="violet" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CORRECTIVE ACTIONS TAB ──────────────────────────────────────────────────
function CorrectiveActionsTab() {
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Total CAs" value={CORRECTIVE_ACTIONS.length} sub="All corrective actions" accent={colors.cyan} />
        <KPI label="Open" value={CORRECTIVE_ACTIONS.filter(c=>c.status==="Open").length} sub="Immediate attention" accent="#ef4444" pulse />
        <KPI label="In Progress" value={CORRECTIVE_ACTIONS.filter(c=>c.status==="In Progress").length} sub="Active remediation" accent="#f59e0b" />
        <KPI label="Overdue (Est.)" value={CORRECTIVE_ACTIONS.filter(c=>c.status!=="Closed"&&daysUntil(c.due)<0).length} sub="Past target date" accent="#ef4444" />
      </div>

      <div style={S.card}>
        <SectionHeader title="Corrective Action Register" sub="Tracked from finding to closure — assigned owner: Emmanuel Igbokwe" />
        {CORRECTIVE_ACTIONS.map(ca=>{
          const days=daysUntil(ca.due);
          const urgent=days<14;
          return (
            <div key={ca.id} style={{padding:12,background:"rgba(255,255,255,0.02)",border:`1px solid ${urgent?"rgba(239,68,68,0.3)":colors.border}`,borderRadius:8,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:6}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:colors.cyan,fontFamily:"'Space Mono',monospace",fontSize:11}}>{ca.id}</span>
                  <Badge label={ca.status} color={ca.status==="Open"?"red":ca.status==="In Progress"?"amber":ca.status==="Scheduled"?"blue":"green"} />
                  {urgent&&<Badge label={`DUE IN ${days}d`} color="red" />}
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:colors.muted,fontSize:11}}>Owner: <span style={{color:ca.owner.includes("Emmanuel")?"#06b6d4":colors.text}}>{ca.owner}</span></span>
                  <Badge label={`Due: ${ca.due}`} color={urgent?"red":"gray"} />
                </div>
              </div>
              <p style={{color:colors.text,fontSize:13,fontFamily:"'Barlow',sans-serif",fontWeight:600,marginBottom:3}}>{ca.finding}</p>
              <p style={{color:colors.muted,fontSize:11,marginBottom:4}}>Root Cause: {ca.root}</p>
              <div style={{background:"rgba(6,182,212,0.05)",border:"1px solid rgba(6,182,212,0.15)",borderRadius:6,padding:"6px 10px"}}>
                <span style={{color:"#67e8f9",fontSize:11}}>📋 Action: {ca.action}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TRAINING TAB ────────────────────────────────────────────────────────────
function TrainingTab() {
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{...S.card,background:"linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))",borderColor:colors.dim}}>
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#06b6d4,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700}}>EI</span>
          </div>
          <div>
            <p style={{color:colors.text,fontSize:18,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.03em"}}>{ANALYST.name}</p>
            <p style={{color:colors.cyan,fontSize:13,fontFamily:"'Barlow',sans-serif"}}>{ANALYST.title}</p>
            <p style={{color:colors.muted,fontSize:11,marginTop:2}}>{ANALYST.cert}</p>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:10,flexWrap:"wrap"}}>
            <Badge label="40 CFR Part 63 Certified" color="cyan" />
            <Badge label="HAZWOPER 40-hr" color="green" />
            <Badge label="LDAR Inspector" color="violet" />
          </div>
        </div>
      </div>

      <div style={S.card}>
        <SectionHeader title="Training & Certification Records" sub="Regulatory required training — 40 CFR §262.17, §68.71, OSHA 29 CFR §1910.120" />
        {TRAINING_DATA.map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${colors.border}`,gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <div>
              <p style={{color:colors.text,fontSize:13,fontFamily:"'Barlow',sans-serif",fontWeight:600}}>{r.course}</p>
              <p style={{color:colors.muted,fontSize:11}}>Completed: {r.completed} · Expires: {r.expires}</p>
            </div>
            <Badge label={r.status} color={r.status==="Current"?"green":"amber"} />
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={S.card}>
          <SectionHeader title="Required Regulatory Training Matrix" sub="OSHA / EPA mandatory training for refinery env. staff" />
          {[
            {course:"HAZWOPER — 40 hr Initial",frequency:"One-time + Annual 8-hr refresh",reg:"29 CFR §1910.120"},
            {course:"Hazard Communication (HazCom/GHS)",frequency:"Initial + when new chemicals added",reg:"29 CFR §1910.1200"},
            {course:"Confined Space Entry",frequency:"Annual",reg:"29 CFR §1910.146"},
            {course:"Respiratory Protection",frequency:"Annual fit test + training",reg:"29 CFR §1910.134"},
            {course:"LDAR Inspector Training",frequency:"Initial + 2-yr refresher",reg:"40 CFR §63.180"},
            {course:"RCRA Hazardous Waste",frequency:"Annual",reg:"40 CFR §262.17"},
            {course:"Emergency Response / RMP",frequency:"Annual tabletop drill",reg:"40 CFR §68.71"},
            {course:"Spill Response / SPCC",frequency:"Annual",reg:"40 CFR §112.21"},
          ].map(r=>(
            <div key={r.course} style={{padding:"6px 0",borderBottom:`1px solid ${colors.border}`}}>
              <p style={{color:colors.text,fontSize:11,fontFamily:"'Barlow',sans-serif",fontWeight:600}}>{r.course}</p>
              <div style={{display:"flex",gap:10}}>
                <span style={{color:colors.muted,fontSize:10}}>{r.frequency}</span>
                <span style={{color:colors.cyan,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{r.reg}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <SectionHeader title="Professional Development Roadmap" sub="Skills aligned with refinery environmental analyst career path" />
          {[
            {skill:"CHMM (Certified Hazardous Materials Manager)",priority:"High",timeline:"2026"},
            {skill:"QEP (Qualified Environmental Professional)",priority:"High",timeline:"2027"},
            {skill:"PE (Professional Engineer — Environmental)",priority:"Medium",timeline:"2028"},
            {skill:"EPA RMP Qualified Coordinator",priority:"High",timeline:"2026"},
            {skill:"API 653 Tank Inspector",priority:"Medium",timeline:"2027"},
            {skill:"NEPA Environmental Review Training",priority:"Low",timeline:"2027"},
            {skill:"ISO 14001 Lead Auditor",priority:"Medium",timeline:"2026"},
          ].map(r=>(
            <div key={r.skill} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${colors.border}`,gap:8}}>
              <div>
                <p style={{color:colors.text,fontSize:11,fontFamily:"'Barlow',sans-serif"}}>{r.skill}</p>
                <span style={{color:colors.muted,fontSize:10}}>Target: {r.timeline}</span>
              </div>
              <Badge label={r.priority} color={r.priority==="High"?"amber":r.priority==="Medium"?"blue":"gray"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PERMITS TAB ─────────────────────────────────────────────────────────────
function PermitsTab() {
  return (
    <div className="animate-slide" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Total Permits" value={PERMITS_DATA.length} sub="Active & renewal" accent={colors.cyan} />
        <KPI label="Renewal Due <90d" value={PERMITS_DATA.filter(p=>daysUntil(p.expiry)<90).length} sub="Immediate action" accent="#ef4444" pulse />
        <KPI label="Active" value={PERMITS_DATA.filter(p=>p.status==="Active").length} sub="In compliance" accent={colors.green} />
        <KPI label="Review Due" value={PERMITS_DATA.filter(p=>p.status.includes("Review")||p.status.includes("Renewal")).length} sub="Action needed" accent="#f59e0b" />
      </div>

      {PERMITS_DATA.map(p=>{
        const days=daysUntil(p.expiry);
        const urgent=days<180||p.status.includes("Renewal")||p.status.includes("Review");
        return (
          <div key={p.id} style={{...S.card,borderColor:urgent?"rgba(239,68,68,0.35)":colors.border,borderWidth:1}}>
            <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:8}}>
              <div>
                <p style={{color:colors.text,fontSize:16,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{p.type}</p>
                <p style={{color:colors.muted,fontSize:11,fontFamily:"'Space Mono',monospace"}}>{p.number} · {p.agency} · {p.citation}</p>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:days<180?"#ef4444":days<365?"#f59e0b":"#64748b",fontFamily:"'Space Mono',monospace",fontSize:12}}>{days}d remaining</span>
                <Badge label={p.status} color={p.status==="Active"?"green":p.status.includes("Renewal")||p.status.includes("Review")?"red":"amber"} />
              </div>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{color:"#fcd34d",fontSize:12,fontFamily:"'Barlow',sans-serif"}}>📋 {p.nextAction}</span>
            </div>
            <div style={{marginTop:8,height:4,background:"rgba(255,255,255,0.05)",borderRadius:2}}>
              <div style={{height:"100%",width:`${Math.max(0,Math.min(100,(days/730)*100))}%`,background:days<90?"#ef4444":days<365?"#f59e0b":"#10b981",borderRadius:2}} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const ALL_TABS = [
  {id:"dashboard",  label:"Dashboard",    icon:"◈"},
  {id:"ldar",       label:"LDAR",         icon:"🔬"},
  {id:"ghg",        label:"GHG",          icon:"☁"},
  {id:"bwon",       label:"BWON",         icon:"⚗"},
  {id:"spcc",       label:"SPCC",         icon:"🛢"},
  {id:"rcra",       label:"RCRA",         icon:"☢"},
  {id:"rmp",        label:"RMP / PSM",    icon:"⚠"},
  {id:"wwtp",       label:"WWTP / NPDES", icon:"💧"},
  {id:"flare",      label:"Flare / Stack",icon:"🔥"},
  {id:"incidents",  label:"Incidents",    icon:"🚨"},
  {id:"corrections",label:"Corrective Actions",icon:"✏"},
  {id:"permits",    label:"Permits",      icon:"📋"},
  {id:"training",   label:"Training",     icon:"🎓"},
];

export default function App() {
  const [tab,setTab]=useState("dashboard");
  const [time,setTime]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);

  const alerts = LDAR_DATA.filter(r=>r.status==="Leaking").length + INCIDENTS.filter(r=>r.status==="Open").length;

  return (
    <div className="font-ui grid-bg" style={{minHeight:"100vh",background:colors.bg}}>
      {/* ── TOP HEADER ── */}
      <div style={{background:"rgba(13,22,32,0.95)",borderBottom:`1px solid ${colors.border}`,position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:52,gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#06b6d4,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif"}}>ET</span>
              </div>
              <div>
                <p style={{color:colors.text,fontSize:14,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",lineHeight:1}}>EnviroTrack Pro</p>
                <p style={{color:colors.muted,fontSize:10,fontFamily:"'Barlow',sans-serif"}}>Refinery Environmental Compliance System</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              {alerts>0&&(
                <div style={{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:20,padding:"3px 10px",display:"flex",alignItems:"center",gap:6}} className="pulse-red">
                  <span style={{color:"#fca5a5",fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{alerts} ACTIVE ALERTS</span>
                </div>
              )}
              <div style={{textAlign:"right"}}>
                <p style={{color:colors.text,fontSize:11,fontFamily:"'Space Mono',monospace"}}>{time.toLocaleTimeString("en-US",{hour12:false})}</p>
                <p style={{color:colors.muted,fontSize:10,fontFamily:"'Barlow',sans-serif"}}>{ANALYST.name}</p>
              </div>
              <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#06b6d4,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700}}>EI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ANALYST STRIP ── */}
      <div style={{background:"rgba(6,182,212,0.05)",borderBottom:`1px solid rgba(6,182,212,0.12)`}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"6px 16px",display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{color:colors.cyan,fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Analyst:</span>
          <span style={{color:colors.text,fontSize:12,fontFamily:"'Barlow',sans-serif",fontWeight:600}}>{ANALYST.name}</span>
          <span style={{color:colors.muted,fontSize:11}}>|</span>
          <span style={{color:colors.muted,fontSize:11}}>{ANALYST.title}</span>
          <span style={{color:colors.muted,fontSize:11}}>|</span>
          <span style={{color:colors.muted,fontSize:11}}>{ANALYST.cert}</span>
          <div style={{marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap"}}>
            {["40 CFR 60","40 CFR 61","40 CFR 63","40 CFR 68","40 CFR 98","40 CFR 112","40 CFR 122","40 CFR 260-270"].map(r=>(
              <span key={r} style={{color:"rgba(6,182,212,0.6)",fontSize:9,fontFamily:"'Space Mono',monospace"}}>{r}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1440,margin:"0 auto",padding:"16px"}}>
        {/* ── TABS ── */}
        <div className="tab-scroll" style={{marginBottom:16}}>
          <div style={{display:"flex",gap:2,background:"rgba(13,22,32,0.9)",borderRadius:10,padding:4,border:`1px solid ${colors.border}`,width:"fit-content",minWidth:"100%"}}>
            {ALL_TABS.map(t=>{
              const hasAlert=
                (t.id==="ldar"&&LDAR_DATA.filter(r=>r.status==="Leaking").length>0)||
                (t.id==="incidents"&&INCIDENTS.filter(r=>r.status==="Open").length>0)||
                (t.id==="permits"&&PERMITS_DATA.filter(p=>daysUntil(p.expiry)<90).length>0)||
                (t.id==="rcra"&&RCRA_DATA.filter(r=>r.elapsed>80).length>0);
              return (
                <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 14px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,letterSpacing:"0.05em",fontWeight:600,background:tab===t.id?"#06b6d4":hasAlert?"rgba(239,68,68,0.1)":"transparent",color:tab===t.id?"#000":hasAlert?"#fca5a5":colors.muted,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5,transition:"all 0.15s",position:"relative"}}>
                  <span style={{fontSize:11}}>{t.icon}</span>
                  {t.label}
                  {hasAlert&&tab!==t.id&&<span style={{width:6,height:6,borderRadius:"50%",background:"#ef4444",position:"absolute",top:5,right:5}} className="pulse-red" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div>
          {tab==="dashboard"   && <DashboardTab />}
          {tab==="ldar"        && <LDARTab />}
          {tab==="ghg"         && <GHGTab />}
          {tab==="bwon"        && <BWONTab />}
          {tab==="spcc"        && <SPCCTab />}
          {tab==="rcra"        && <RCRATab />}
          {tab==="rmp"         && <RMPTab />}
          {tab==="wwtp"        && <WWTPTab />}
          {tab==="flare"       && <FlareStackTab />}
          {tab==="incidents"   && <IncidentsTab />}
          {tab==="corrections" && <CorrectiveActionsTab />}
          {tab==="permits"     && <PermitsTab />}
          {tab==="training"    && <TrainingTab />}
        </div>
      </div>

      <div style={{borderTop:`1px solid ${colors.border}`,padding:"12px 16px",textAlign:"center"}}>
        <p style={{color:colors.muted,fontSize:10,fontFamily:"'Barlow',sans-serif"}}>EnviroTrack Pro · {ANALYST.name}, {ANALYST.title} · Regulatory Coverage: CAA · CWA · RCRA · EPCRA · OPA 90 · RMP/PSM · 40 CFR Parts 60, 61, 63, 68, 98, 112, 122, 260-270</p>
      </div>
    </div>
  );
}
