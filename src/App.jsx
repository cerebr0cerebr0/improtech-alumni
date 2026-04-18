import { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, getDocs, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebase";

const IS_REGISTER = new URLSearchParams(window.location.search).has('register');
const REGISTER_LINK = `${window.location.origin}${window.location.pathname}?register`;
const ADMIN_EMAIL = "othniel.atseh@gmail.com";

const B = {
  purple: "#2D1654", purpleMid: "#3D2070", purpleLight: "#5A3090",
  gold: "#F5A623", goldLight: "#FFD27D", teal: "#00BCD4",
  white: "#FFFFFF", offWhite: "#F8F5FF", gray: "#8B7FAA",
  darkGray: "#4A4060", green: "#27AE60", red: "#E74C3C",
};

const CERTS = ["CCIE Enterprise","CCIE Security","CCNP Enterprise","CCNP Security","CCNA","CompTIA Security+","CompTIA CySA+","CompTIA A+","Fortinet NSE","Azure AZ-900","PMP","ITIL"];
const SECTORS = ["Tech","Banque","Télécoms","Gouvernement","Santé","Mines","Éducation","Autre"];
const COUNTRIES = ["Ghana","Côte d'Ivoire","Mali","Bénin","Togo","Sénégal","Cameroun","Nigeria","Burkina Faso","Congo","France","Autre"];
const CARD_COLORS = [B.teal, B.gold, B.purpleLight, B.green];

const INITIAL_ALUMNI = [
  { name: "Aurore Oniboukou", country: "Bénin", flag: "🇧🇯", cert: "CCIE Enterprise", year: 2019, employer: "Sopra Steria, France", role: "Network Engineer", sector: "Tech", story: "L'une des premières femmes du Bénin certifiée CCIE. Après un début de carrière chez un Cisco Gold Partner au Ghana, elle travaille désormais dans un cabinet tech européen de plus de 50 000 employés.", linkedin: "", email: "aurore@example.com" },
  { name: "Gemila Koureichi", country: "Mali", flag: "🇲🇱", cert: "CCNP Security", year: 2021, employer: "Gouvernement du Mali", role: "Head of Information Security", sector: "Gouvernement", story: "Après sa formation CCNP Security à Improtech, Gemila dirige aujourd'hui la sécurité informatique d'une institution gouvernementale.", linkedin: "", email: "gemila@example.com" },
  { name: "Vanessa Manzan", country: "Côte d'Ivoire", flag: "🇨🇮", cert: "CCNP Security", year: 2020, employer: "Secteur Minier", role: "Network Security Officer", sector: "Mines", story: "Après son passage chez un intégrateur systèmes au Ghana, Vanessa est aujourd'hui responsable sécurité réseau dans le secteur minier.", linkedin: "", email: "vanessa@example.com" },
];

const iStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, background: `${B.purple}88`, border: `1px solid ${B.purpleLight}55`, color: B.white, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const lStyle = { fontSize: 12, color: B.gray, fontWeight: 600, marginBottom: 4, display: "block" };

// ─── UTILS ────────────────────────────────────────────────────────────────
function initials(name) { return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function cardColor(name) { return CARD_COLORS[(name || "").charCodeAt(0) % CARD_COLORS.length]; }
function Avatar({ name, size = 44 }) {
  const bg = cardColor(name);
  return <div style={{ width: size, height: size, borderRadius: size * 0.25, background: `linear-gradient(135deg, ${bg}, ${bg}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>{initials(name)}</div>;
}
function Toast({ toast }) {
  if (!toast) return null;
  return <div style={{ position: "fixed", top: 20, right: 20, zIndex: 2000, background: toast.type === "error" ? B.red : toast.type === "info" ? B.teal : B.green, color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px #0006" }}>{toast.msg}</div>;
}
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  return [toast, show];
}
function Loading() {
  return <div style={{ minHeight: "100vh", background: B.purple, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center", color: B.gray }}><div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div><div>Chargement...</div></div></div>;
}

// ─── LOGO / HEADER HELPERS ────────────────────────────────────────────────
function LogoIcon({ size = 40 }) {
  return <div style={{ width: size, height: size, borderRadius: size * 0.25, background: `linear-gradient(135deg, ${B.gold}, ${B.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, fontWeight: 900, color: B.purple, flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>I</div>;
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setError("Email ou mot de passe incorrect."); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: B.purple, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap'); * { box-sizing: border-box; } input::placeholder { color: #8B7FAA; }`}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <LogoIcon size={60} />
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: B.white, marginTop: 14 }}>IMPROTECH Alumni</div>
          <div style={{ fontSize: 13, color: B.gray, marginTop: 4 }}>Connecte-toi à ta communauté</div>
        </div>
        <div style={{ background: B.purpleMid, borderRadius: 20, padding: 32, border: `1px solid ${B.purpleLight}44` }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: B.white, marginBottom: 24 }}>Connexion</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={lStyle}>Email</label><input style={iStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
            <div><label style={lStyle}>Mot de passe</label><input style={iStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
            {error && <div style={{ background: `${B.red}22`, border: `1px solid ${B.red}44`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: B.red }}>{error}</div>}
            <button onClick={handleLogin} disabled={loading || !email || !password} style={{ padding: "13px", borderRadius: 12, border: "none", cursor: email && password ? "pointer" : "default", background: email && password ? `linear-gradient(135deg, ${B.gold}, ${B.goldLight})` : B.darkGray, color: email && password ? B.purple : B.gray, fontWeight: 800, fontSize: 15, fontFamily: "'Sora', sans-serif" }}>
              {loading ? "Connexion..." : "→ Se connecter"}
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: B.gray }}>Tu n'as pas encore de compte ? Contacte un admin pour recevoir ton lien d'inscription.</div>
      </div>
    </div>
  );
}

// ─── REGISTER PAGE (publique) ─────────────────────────────────────────────
function RegisterPage() {
  const flagMap = { Ghana:"🇬🇭","Côte d'Ivoire":"🇨🇮",Mali:"🇲🇱",Bénin:"🇧🇯",Togo:"🇹🇬",Sénégal:"🇸🇳",Cameroun:"🇨🇲",Nigeria:"🇳🇬","Burkina Faso":"🇧🇫",Congo:"🇨🇬",France:"🇫🇷",Autre:"🌍" };
  const [form, setForm] = useState({ name:"",country:"",flag:"",cert:"",year:new Date().getFullYear(),employer:"",role:"",sector:"",story:"",linkedin:"",email:"",password:"",confirm:"" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f => ({ ...f,[k]:v,...(k==="country"?{flag:flagMap[v]||"🌍"}:{}) }));
  const valid = form.name && form.country && form.cert && form.employer && form.role && form.email && form.password && form.password === form.confirm && form.password.length >= 6;

  const handleSubmit = async () => {
    if (!valid) return;
    if (form.password !== form.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setStatus("loading"); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const { password, confirm, ...profile } = form;
      await addDoc(collection(db, "alumni"), { ...profile, year: Number(profile.year), uid: cred.user.uid, createdAt: serverTimestamp() });
      await setDoc(doc(db, "users", cred.user.uid), { role: "alumni", name: form.name, email: form.email, createdAt: serverTimestamp() });
      await signOut(auth);
      setStatus("success");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setError("Cet email est déjà utilisé.");
      else setError("Une erreur est survenue. Réessaie.");
      setStatus("idle");
    }
  };

  if (status === "success") return (
    <div style={{ minHeight:"100vh",background:B.purple,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@800&display=swap'); * { box-sizing: border-box; }`}</style>
      <div style={{ textAlign:"center",maxWidth:400 }}>
        <div style={{ fontSize:64,marginBottom:20 }}>🎉</div>
        <div style={{ fontFamily:"'Sora', sans-serif",fontSize:26,fontWeight:800,color:B.white,marginBottom:12 }}>Bienvenue {form.name.split(" ")[0]} !</div>
        <div style={{ fontSize:15,color:B.gray,lineHeight:1.7,marginBottom:24 }}>Ton profil a été créé. Connecte-toi maintenant avec ton email et ton mot de passe !</div>
        <button onClick={() => window.location.href = window.location.pathname} style={{ padding:"12px 28px",borderRadius:12,background:`linear-gradient(135deg, ${B.gold}, ${B.goldLight})`,color:B.purple,fontWeight:800,fontSize:15,border:"none",cursor:"pointer",fontFamily:"'Sora', sans-serif" }}>→ Se connecter</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:B.purple,fontFamily:"'Inter', sans-serif",color:B.white }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap'); * { box-sizing: border-box; } select option { background: #3D2070; } input::placeholder, textarea::placeholder { color: #8B7FAA; }`}</style>
      <div style={{ background:B.purpleMid,borderBottom:`1px solid ${B.purpleLight}44`,padding:"16px 24px",display:"flex",alignItems:"center",gap:14 }}>
        <LogoIcon />
        <div><div style={{ fontFamily:"'Sora', sans-serif",fontWeight:800,fontSize:16 }}>IMPROTECH Alumni</div><div style={{ fontSize:11,color:B.gray }}>Crée ton compte alumni</div></div>
      </div>
      <div style={{ maxWidth:600,margin:"0 auto",padding:24 }}>
        <div style={{ background:`${B.gold}11`,border:`1px solid ${B.gold}33`,borderRadius:14,padding:20,marginBottom:28 }}>
          <div style={{ fontFamily:"'Sora', sans-serif",fontSize:20,fontWeight:800,color:B.white,marginBottom:6 }}>Rejoins la famille IMPROTECH ! 🎓</div>
          <div style={{ fontSize:14,color:B.gray,lineHeight:1.6 }}>Crée ton compte pour accéder à l'annuaire et discuter avec les autres alumni.</div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <div style={{ gridColumn:"1/-1" }}><label style={lStyle}>Nom complet *</label><input style={iStyle} value={form.name} onChange={e => set("name",e.target.value)} placeholder="Ex: Jean Dupont" /></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lStyle}>Email * (sera ton identifiant)</label><input style={iStyle} type="email" value={form.email} onChange={e => set("email",e.target.value)} placeholder="ton@email.com" /></div>
          <div><label style={lStyle}>Mot de passe * (min. 6 caractères)</label><input style={iStyle} type="password" value={form.password} onChange={e => set("password",e.target.value)} placeholder="••••••••" /></div>
          <div><label style={lStyle}>Confirmer le mot de passe *</label><input style={iStyle} type="password" value={form.confirm} onChange={e => set("confirm",e.target.value)} placeholder="••••••••" /></div>
          {form.confirm && form.password !== form.confirm && <div style={{ gridColumn:"1/-1",background:`${B.red}22`,border:`1px solid ${B.red}44`,borderRadius:8,padding:"8px 12px",fontSize:12,color:B.red }}>Les mots de passe ne correspondent pas.</div>}
          <div><label style={lStyle}>Pays *</label><select style={iStyle} value={form.country} onChange={e => set("country",e.target.value)}><option value="">-- Sélectionner --</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={lStyle}>Certification *</label><select style={iStyle} value={form.cert} onChange={e => set("cert",e.target.value)}><option value="">-- Sélectionner --</option>{CERTS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={lStyle}>Année de formation</label><input style={iStyle} type="number" value={form.year} min={2015} max={2030} onChange={e => set("year",e.target.value)} /></div>
          <div><label style={lStyle}>Secteur</label><select style={iStyle} value={form.sector} onChange={e => set("sector",e.target.value)}><option value="">-- Sélectionner --</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lStyle}>Poste actuel *</label><input style={iStyle} value={form.role} onChange={e => set("role",e.target.value)} placeholder="Ex: Network Security Engineer" /></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lStyle}>Employeur *</label><input style={iStyle} value={form.employer} onChange={e => set("employer",e.target.value)} placeholder="Ex: Ecobank Ghana" /></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lStyle}>LinkedIn</label><input style={iStyle} value={form.linkedin} onChange={e => set("linkedin",e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lStyle}>Success Story (optionnel)</label><textarea style={{ ...iStyle,resize:"vertical",minHeight:90 }} value={form.story} onChange={e => set("story",e.target.value)} placeholder="Parle-nous de ton parcours depuis ta formation à Improtech..." /></div>
        </div>
        {error && <div style={{ marginTop:12,padding:"10px 14px",background:`${B.red}22`,border:`1px solid ${B.red}44`,borderRadius:10,fontSize:13,color:B.red }}>{error}</div>}
        <button disabled={!valid||status==="loading"} onClick={handleSubmit} style={{ width:"100%",marginTop:20,padding:"14px",borderRadius:12,background:valid?`linear-gradient(135deg, ${B.gold}, ${B.goldLight})`:B.darkGray,color:valid?B.purple:B.gray,fontWeight:800,fontSize:16,border:"none",cursor:valid?"pointer":"default",fontFamily:"'Sora', sans-serif" }}>
          {status==="loading"?"Création du compte...":"✓ Créer mon compte alumni"}
        </button>
        <div style={{ marginTop:20,textAlign:"center",fontSize:12,color:B.gray }}>IMPROTECH Training Center · Accra, Ghana</div>
      </div>
    </div>
  );
}

// ─── COMPOSANT CHAT ───────────────────────────────────────────────────────
function ChatPanel({ user, userName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "messages"), snap => {
      const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (a.createdAt?.toMillis?.()||0) - (b.createdAt?.toMillis?.()||0));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return unsub;
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    const t = text.trim(); setText("");
    await addDoc(collection(db, "messages"), { text: t, senderName: userName, senderUid: user.uid, senderEmail: user.email, createdAt: serverTimestamp() });
  };

  const fmt = (ts) => { if (!ts?.toMillis) return ""; const d = new Date(ts.toMillis()); return d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); };

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 180px)",minHeight:400,background:B.purpleMid,borderRadius:18,border:`1px solid ${B.purpleLight}33`,overflow:"hidden" }}>
      <div style={{ padding:"16px 20px",borderBottom:`1px solid ${B.purpleLight}33`,fontFamily:"'Sora', sans-serif",fontWeight:700,fontSize:15 }}>💬 Chat Alumni</div>
      <div style={{ flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:10 }}>
        {messages.length === 0 && <div style={{ textAlign:"center",padding:40,color:B.gray,fontSize:14 }}>Pas encore de messages. Sois le premier à écrire ! 👋</div>}
        {messages.map(m => {
          const isMe = m.senderUid === user.uid;
          return (
            <div key={m.id} style={{ display:"flex",flexDirection:isMe?"row-reverse":"row",gap:10,alignItems:"flex-end" }}>
              {!isMe && <Avatar name={m.senderName} size={32} />}
              <div style={{ maxWidth:"70%" }}>
                {!isMe && <div style={{ fontSize:11,color:B.gray,marginBottom:3,marginLeft:4 }}>{m.senderName}</div>}
                <div style={{ background:isMe?`linear-gradient(135deg, ${B.purpleLight}, ${B.purple})`:`${B.purple}88`, borderRadius:isMe?"16px 16px 4px 16px":"16px 16px 16px 4px", padding:"10px 14px", fontSize:14, color:B.white, border:`1px solid ${B.purpleLight}44` }}>{m.text}</div>
                <div style={{ fontSize:10,color:B.gray,marginTop:3,textAlign:isMe?"right":"left",marginRight:isMe?4:0,marginLeft:isMe?0:4 }}>{fmt(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding:"12px 16px",borderTop:`1px solid ${B.purpleLight}33`,display:"flex",gap:10 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder="Écris un message..." style={{ ...iStyle,margin:0 }} />
        <button onClick={send} disabled={!text.trim()} style={{ padding:"10px 20px",borderRadius:10,background:text.trim()?`linear-gradient(135deg, ${B.gold}, ${B.goldLight})`:B.darkGray,color:text.trim()?B.purple:B.gray,fontWeight:700,border:"none",cursor:text.trim()?"pointer":"default",flexShrink:0,fontSize:14 }}>Envoyer</button>
      </div>
    </div>
  );
}

// ─── CARTE ALUMNI ─────────────────────────────────────────────────────────
function AlumniCard({ a, onClick }) {
  const bg = cardColor(a.name);
  return (
    <div onClick={() => onClick(a)} style={{ background:B.purpleMid,borderRadius:16,padding:20,cursor:"pointer",transition:"transform 0.2s, box-shadow 0.2s",border:`1px solid ${B.purpleLight}55`,display:"flex",flexDirection:"column",gap:12 }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 32px ${B.purple}88`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
      <div style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
        <Avatar name={a.name} size={52} />
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontWeight:700,color:B.white,fontSize:15,marginBottom:2,fontFamily:"'Sora', sans-serif" }}>{a.name}</div>
          <div style={{ fontSize:12,color:B.gray }}>{a.flag} {a.country}</div>
        </div>
        {a.isNew && <span style={{ background:`${B.green}22`,color:B.green,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,flexShrink:0 }}>NOUVEAU</span>}
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
        <div style={{ background:`${bg}22`,border:`1px solid ${bg}44`,borderRadius:8,padding:"4px 10px",fontSize:11,color:bg,fontWeight:700,display:"inline-block",width:"fit-content" }}>{a.cert}</div>
        <div style={{ fontSize:13,color:B.offWhite,fontWeight:600 }}>{a.role}</div>
        <div style={{ fontSize:12,color:B.gray }}>{a.employer}</div>
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ fontSize:11,color:B.gray }}>Promo {a.year}</div>
        {a.sector && <div style={{ background:`${B.green}22`,color:B.green,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700 }}>{a.sector}</div>}
      </div>
    </div>
  );
}

// ─── MODAL ALUMNI ─────────────────────────────────────────────────────────
function AlumniModal({ a, onClose, onDelete, isAdmin }) {
  const bg = cardColor(a.name);
  return (
    <div style={{ position:"fixed",inset:0,background:"#00000088",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }} onClick={onClose}>
      <div style={{ background:B.purpleMid,borderRadius:24,padding:32,maxWidth:480,width:"100%",border:`1px solid ${B.purpleLight}55`,boxShadow:`0 24px 64px ${B.purple}cc` }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",gap:20,alignItems:"flex-start",marginBottom:20 }}>
          <Avatar name={a.name} size={72} />
          <div>
            <div style={{ fontSize:22,fontWeight:800,color:B.white,fontFamily:"'Sora', sans-serif" }}>{a.name}</div>
            <div style={{ fontSize:14,color:B.gray,marginTop:2 }}>{a.flag} {a.country} · Promo {a.year}</div>
            <div style={{ marginTop:6 }}><span style={{ background:`${bg}22`,border:`1px solid ${bg}44`,borderRadius:8,padding:"3px 10px",fontSize:12,color:bg,fontWeight:700 }}>{a.cert}</span></div>
          </div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:20 }}>
          {[{label:"Poste",value:a.role},{label:"Employeur",value:a.employer},{label:"Email",value:a.email},{label:"Secteur",value:a.sector}].filter(x=>x.value).map(({label,value})=>(
            <div key={label} style={{ display:"flex",gap:12 }}>
              <div style={{ width:80,fontSize:12,color:B.gray,fontWeight:600,flexShrink:0 }}>{label}</div>
              <div style={{ flex:1,fontSize:14,color:B.white }}>{value}</div>
            </div>
          ))}
        </div>
        {a.story && <div style={{ background:`${B.gold}11`,border:`1px solid ${B.gold}33`,borderRadius:12,padding:16,marginBottom:20 }}><div style={{ fontSize:11,color:B.gold,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1 }}>Success Story</div><div style={{ fontSize:13,color:B.offWhite,lineHeight:1.6 }}>{a.story}</div></div>}
        <div style={{ display:"flex",gap:10 }}>
          {a.linkedin && <a href={a.linkedin} target="_blank" rel="noreferrer" style={{ flex:1,textAlign:"center",padding:"10px 16px",background:B.teal,color:"#fff",borderRadius:10,fontSize:13,fontWeight:700,textDecoration:"none" }}>LinkedIn</a>}
          {a.email && <a href={`mailto:${a.email}`} style={{ flex:1,textAlign:"center",padding:"10px 16px",background:B.purpleLight,color:"#fff",borderRadius:10,fontSize:13,fontWeight:700,textDecoration:"none" }}>Email</a>}
          {isAdmin && <button onClick={()=>{if(window.confirm(`Supprimer ${a.name} ?`)){onDelete(a.firestoreId);onClose();}}} style={{ padding:"10px 14px",borderRadius:10,background:`${B.red}22`,color:B.red,border:`1px solid ${B.red}44`,cursor:"pointer",fontSize:14,fontWeight:700 }}>🗑</button>}
          <button onClick={onClose} style={{ flex:1,padding:"10px 16px",background:`${B.white}11`,color:B.gray,border:`1px solid ${B.purpleLight}55`,borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer" }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─── ANNUAIRE (partagé admin+alumni) ─────────────────────────────────────
function Directory({ alumni, onDelete, isAdmin }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCert, setFilterCert] = useState("");
  const [filterCountry, setFilterCountry] = useState("");

  const filtered = alumni.filter(a => {
    const q = search.toLowerCase();
    const m = !q || a.name?.toLowerCase().includes(q) || a.role?.toLowerCase().includes(q) || a.employer?.toLowerCase().includes(q);
    return m && (!filterCert||a.cert===filterCert) && (!filterCountry||a.country===filterCountry);
  });

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <div style={{ fontFamily:"'Sora', sans-serif",fontSize:22,fontWeight:800 }}>Annuaire des Alumni</div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{ flex:"1 1 200px",padding:"10px 14px",borderRadius:10,background:B.purpleMid,border:`1px solid ${B.purpleLight}55`,color:B.white,fontSize:14,outline:"none" }} />
        <select value={filterCert} onChange={e=>setFilterCert(e.target.value)} style={{ flex:"1 1 150px",padding:"10px 14px",borderRadius:10,background:B.purpleMid,border:`1px solid ${B.purpleLight}55`,color:filterCert?B.white:B.gray,fontSize:13,outline:"none" }}>
          <option value="">Certification: Toutes</option>{CERTS.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)} style={{ flex:"1 1 150px",padding:"10px 14px",borderRadius:10,background:B.purpleMid,border:`1px solid ${B.purpleLight}55`,color:filterCountry?B.white:B.gray,fontSize:13,outline:"none" }}>
          <option value="">Pays: Tous</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}
        </select>
        {(search||filterCert||filterCountry)&&<button onClick={()=>{setSearch("");setFilterCert("");setFilterCountry("");}} style={{ padding:"10px 16px",borderRadius:10,background:`${B.red}22`,color:B.red,border:`1px solid ${B.red}44`,cursor:"pointer",fontSize:13,fontWeight:700 }}>✕</button>}
      </div>
      <div style={{ fontSize:13,color:B.gray }}>{filtered.length} alumni</div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:16 }}>
        {filtered.map(a=><AlumniCard key={a.firestoreId} a={a} onClick={setSelected} />)}
        {filtered.length===0&&<div style={{ gridColumn:"1/-1",textAlign:"center",padding:60,color:B.gray }}><div style={{ fontSize:40,marginBottom:12 }}>🔍</div><div>Aucun résultat.</div></div>}
      </div>
      {selected && <AlumniModal a={selected} onClose={()=>setSelected(null)} onDelete={onDelete} isAdmin={isAdmin} />}
    </div>
  );
}

// ─── SUCCESS STORIES (partagé) ────────────────────────────────────────────
function Stories({ alumni }) {
  const withStories = alumni.filter(a=>a.story);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
      <div><div style={{ fontFamily:"'Sora', sans-serif",fontSize:22,fontWeight:800,marginBottom:4 }}>Success Stories</div><div style={{ color:B.gray,fontSize:14 }}>Parcours inspirants de nos diplômés</div></div>
      {withStories.map((a,i)=>{
        const cols=[B.gold,B.teal,B.green,B.purpleLight]; const ac=cols[i%cols.length];
        return <div key={a.firestoreId} style={{ background:B.purpleMid,borderRadius:20,padding:28,border:`1px solid ${ac}33`,borderLeft:`4px solid ${ac}`,display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ display:"flex",gap:16,alignItems:"flex-start" }}><Avatar name={a.name} size={56} /><div style={{ flex:1 }}><div style={{ fontFamily:"'Sora', sans-serif",fontWeight:800,fontSize:17,color:B.white }}>{a.name}</div><div style={{ fontSize:13,color:B.gray,marginTop:2 }}>{a.flag} {a.country} · {a.cert} · Promo {a.year}</div></div></div>
          <div style={{ background:`${ac}11`,borderRadius:12,padding:16,fontSize:14,color:B.offWhite,lineHeight:1.7,fontStyle:"italic" }}>"{a.story}"</div>
          <div style={{ display:"flex",gap:16,fontSize:13,flexWrap:"wrap" }}><div><span style={{ color:B.gray }}>Poste : </span><span style={{ color:B.white,fontWeight:600 }}>{a.role}</span></div><div><span style={{ color:B.gray }}>Chez : </span><span style={{ color:ac,fontWeight:600 }}>{a.employer}</span></div></div>
        </div>;
      })}
      {withStories.length===0&&<div style={{ textAlign:"center",padding:60,color:B.gray }}><div style={{ fontSize:40,marginBottom:12 }}>★</div><div>Les success stories apparaîtront ici.</div></div>}
    </div>
  );
}

// ─── LAYOUT PARTAGÉ ───────────────────────────────────────────────────────
function AppLayout({ user, userName, isAdmin, tabs, activeTab, setTab, children, rightActions }) {
  return (
    <div style={{ minHeight:"100vh",background:B.purple,fontFamily:"'Inter', 'Segoe UI', sans-serif",color:B.white }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } select option { background: #3D2070; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #5A3090; border-radius: 3px; } input::placeholder, textarea::placeholder { color: #8B7FAA; }`}</style>
      <div style={{ background:`linear-gradient(135deg, ${B.purpleMid}, ${B.purple})`,borderBottom:`1px solid ${B.purpleLight}44`,padding:"14px 24px",display:"flex",alignItems:"center",gap:16,position:"sticky",top:0,zIndex:100,flexWrap:"wrap" }}>
        <LogoIcon />
        <div>
          <div style={{ fontFamily:"'Sora', sans-serif",fontWeight:800,fontSize:16 }}>IMPROTECH Alumni</div>
          <div style={{ fontSize:11,color:B.gray,marginTop:2 }}>{isAdmin?"👑 Admin":"🎓 Alumni"} · {userName || user.email}</div>
        </div>
        <div style={{ marginLeft:"auto",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
          {rightActions}
          <button onClick={()=>signOut(auth)} style={{ padding:"8px 14px",borderRadius:10,background:`${B.white}11`,color:B.gray,border:`1px solid ${B.purpleLight}44`,cursor:"pointer",fontSize:13,fontWeight:600 }}>Déconnexion</button>
        </div>
      </div>
      <div style={{ display:"flex",gap:4,padding:"12px 24px 0",borderBottom:`1px solid ${B.purpleLight}33`,background:B.purpleMid,overflowX:"auto" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"8px 18px",borderRadius:"10px 10px 0 0",background:activeTab===t.id?B.purple:"transparent",color:activeTab===t.id?B.gold:B.gray,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,borderBottom:activeTab===t.id?`2px solid ${B.gold}`:"2px solid transparent",transition:"all 0.2s",whiteSpace:"nowrap",fontFamily:"'Sora', sans-serif" }}>{t.icon} {t.label}</button>
        ))}
      </div>
      <div style={{ padding:24,maxWidth:1100,margin:"0 auto" }}>{children}</div>
    </div>
  );
}

// ─── DASHBOARD ALUMNI ─────────────────────────────────────────────────────
function AlumniDashboard({ user, userName }) {
  const [alumni, setAlumni] = useState([]);
  const [tab, setTab] = useState("annuaire");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "alumni"), snap => {
      const now = Date.now();
      const data = snap.docs.map(d => ({ ...d.data(),firestoreId:d.id,isNew:d.data().createdAt?.toMillis?(now-d.data().createdAt.toMillis())<86400000:false }));
      setAlumni(data.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const TABS = [
    { id:"annuaire", label:"Annuaire", icon:"☰" },
    { id:"chat", label:"Chat", icon:"💬" },
    { id:"stories", label:"Success Stories", icon:"★" },
  ];

  if (loading) return <Loading />;

  return (
    <AppLayout user={user} userName={userName} isAdmin={false} tabs={TABS} activeTab={tab} setTab={setTab}>
      {tab==="annuaire" && <Directory alumni={alumni} onDelete={()=>{}} isAdmin={false} />}
      {tab==="chat" && <ChatPanel user={user} userName={userName} />}
      {tab==="stories" && <Stories alumni={alumni} />}
    </AppLayout>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────
function AdminDashboard({ user }) {
  const [alumni, setAlumni] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [toast, showToast] = useToast();
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const seedIfEmpty = async () => {
      const snap = await getDocs(collection(db, "alumni"));
      if (snap.empty) for (const a of INITIAL_ALUMNI) await addDoc(collection(db, "alumni"), { ...a, createdAt: serverTimestamp() });
    };
    seedIfEmpty();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "alumni"), snap => {
      const now = Date.now();
      const data = snap.docs.map(d => ({ ...d.data(),firestoreId:d.id,isNew:d.data().createdAt?.toMillis?(now-d.data().createdAt.toMillis())<86400000:false }));
      setAlumni(data.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = async (id) => { await deleteDoc(doc(db,"alumni",id)); showToast("Alumni supprimé.","error"); };

  const copyLink = () => { navigator.clipboard.writeText(REGISTER_LINK); setLinkCopied(true); showToast("Lien copié !","info"); setTimeout(()=>setLinkCopied(false),2000); };

  const stats = { total:alumni.length, countries:[...new Set(alumni.map(a=>a.country))].length, sectors:[...new Set(alumni.map(a=>a.sector))].length, nouveaux:alumni.filter(a=>a.isNew).length };
  const byCert = CERTS.map(c=>({ c,n:alumni.filter(a=>a.cert===c).length })).filter(x=>x.n>0);
  const bySector = SECTORS.map(s=>({ s,n:alumni.filter(a=>a.sector===s).length })).filter(x=>x.n>0);

  const TABS = [
    { id:"dashboard", label:"Tableau de bord", icon:"◉" },
    { id:"annuaire", label:"Annuaire", icon:"☰" },
    { id:"chat", label:"Chat", icon:"💬" },
    { id:"stories", label:"Success Stories", icon:"★" },
  ];

  if (loading) return <Loading />;

  const rightActions = <>
    {stats.nouveaux>0&&<div style={{ background:`${B.green}22`,border:`1px solid ${B.green}44`,borderRadius:8,padding:"4px 12px",fontSize:13,color:B.green,fontWeight:700 }}>+{stats.nouveaux} nouveau{stats.nouveaux>1?"x":""}</div>}
    <button onClick={copyLink} style={{ padding:"8px 16px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:linkCopied?B.green:`linear-gradient(135deg, ${B.gold}, ${B.goldLight})`,color:linkCopied?B.white:B.purple,transition:"all 0.3s" }}>
      {linkCopied?"✓ Copié !":"📋 Inviter un alumni"}
    </button>
  </>;

  return (
    <AppLayout user={user} userName="Admin" isAdmin={true} tabs={TABS} activeTab={tab} setTab={setTab} rightActions={rightActions}>
      <Toast toast={toast} />

      {tab==="dashboard" && (
        <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
          <div><div style={{ fontFamily:"'Sora', sans-serif",fontSize:22,fontWeight:800,marginBottom:4 }}>Tableau de bord</div><div style={{ color:B.gray,fontSize:14 }}>Données en temps réel · Firebase ⚡</div></div>
          <div style={{ background:B.purpleMid,borderRadius:16,padding:20,border:`1px solid ${B.gold}33` }}>
            <div style={{ fontFamily:"'Sora', sans-serif",fontWeight:700,fontSize:14,color:B.gold,marginBottom:10 }}>📋 Lien d'inscription alumni</div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              <div style={{ flex:1,minWidth:200,background:`${B.purple}88`,border:`1px solid ${B.purpleLight}55`,borderRadius:8,padding:"8px 12px",fontSize:12,color:B.gray,fontFamily:"monospace",wordBreak:"break-all" }}>{REGISTER_LINK}</div>
              <button onClick={copyLink} style={{ padding:"8px 18px",borderRadius:8,background:`linear-gradient(135deg, ${B.gold}, ${B.goldLight})`,color:B.purple,border:"none",fontWeight:700,fontSize:13,cursor:"pointer" }}>{linkCopied?"✓ Copié !":"Copier"}</button>
            </div>
            <div style={{ fontSize:12,color:B.gray,marginTop:8 }}>L'alumni reçoit ce lien, crée son compte, et peut se connecter à la plateforme directement.</div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",gap:16 }}>
            {[{label:"Alumni au total",value:stats.total,color:B.gold,sub:"Depuis 2015"},{label:"Pays représentés",value:stats.countries,color:B.teal},{label:"Secteurs couverts",value:stats.sectors,color:B.purpleLight},{label:"Inscrits aujourd'hui",value:stats.nouveaux,color:B.green,sub:"Dernières 24h"}].map(s=>(
              <div key={s.label} style={{ background:`linear-gradient(135deg, ${s.color}22 0%, ${s.color}11 100%)`,border:`1px solid ${s.color}44`,borderRadius:16,padding:"20px 24px" }}>
                <div style={{ fontSize:32,fontWeight:800,color:s.color,fontFamily:"'Sora', sans-serif" }}>{s.value}</div>
                <div style={{ fontSize:13,color:B.gray,fontWeight:600 }}>{s.label}</div>
                {s.sub&&<div style={{ fontSize:11,color:B.gray,marginTop:2 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
          {byCert.length>0&&<div style={{ background:B.purpleMid,borderRadius:18,padding:24,border:`1px solid ${B.purpleLight}33` }}>
            <div style={{ fontFamily:"'Sora', sans-serif",fontWeight:700,fontSize:15,marginBottom:16 }}>📜 Certifications</div>
            {byCert.sort((a,b)=>b.n-a.n).map(({c,n})=>(
              <div key={c} style={{ display:"flex",gap:12,alignItems:"center",marginBottom:10 }}>
                <div style={{ width:160,fontSize:13,color:B.offWhite,flexShrink:0 }}>{c}</div>
                <div style={{ flex:1,height:8,background:`${B.purpleLight}44`,borderRadius:4,overflow:"hidden" }}><div style={{ width:`${(n/Math.max(alumni.length,1))*100}%`,height:"100%",background:`linear-gradient(90deg, ${B.gold}, ${B.teal})`,borderRadius:4 }} /></div>
                <div style={{ fontSize:13,color:B.gold,fontWeight:700,width:24,textAlign:"right" }}>{n}</div>
              </div>
            ))}
          </div>}
          {bySector.length>0&&<div style={{ background:B.purpleMid,borderRadius:18,padding:24,border:`1px solid ${B.purpleLight}33` }}>
            <div style={{ fontFamily:"'Sora', sans-serif",fontWeight:700,fontSize:15,marginBottom:16 }}>🏢 Secteurs</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>
              {bySector.sort((a,b)=>b.n-a.n).map(({s,n},i)=>{const cols=[B.teal,B.gold,B.purpleLight,B.green,B.gray];const col=cols[i%cols.length];return <div key={s} style={{ background:`${col}22`,border:`1px solid ${col}44`,borderRadius:10,padding:"8px 16px",display:"flex",gap:10,alignItems:"center" }}><span style={{ color:col,fontWeight:700 }}>{n}</span><span style={{ fontSize:13,color:B.offWhite }}>{s}</span></div>;})}
            </div>
          </div>}
        </div>
      )}
      {tab==="annuaire" && <Directory alumni={alumni} onDelete={handleDelete} isAdmin={true} />}
      {tab==="chat" && <ChatPanel user={user} userName="Admin" />}
      {tab==="stories" && <Stories alumni={alumni} />}
    </AppLayout>
  );
}

// ─── POINT D'ENTRÉE ────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const newRole = u.email === ADMIN_EMAIL ? "admin" : "alumni";
          await setDoc(userRef, { role:newRole, email:u.email, createdAt:serverTimestamp() });
          setRole(newRole); setUserName(u.email.split("@")[0]);
        } else {
          setRole(userSnap.data().role);
          setUserName(userSnap.data().name || u.email.split("@")[0]);
        }
      } else { setUser(null); setRole(null); setUserName(""); }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  if (IS_REGISTER) return <RegisterPage />;
  if (authLoading) return <Loading />;
  if (!user) return <LoginPage />;
  if (role === "admin") return <AdminDashboard user={user} />;
  return <AlumniDashboard user={user} userName={userName} />;
}
