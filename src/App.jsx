import { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, getDocs, getDoc, setDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebase";

const IS_REGISTER = new URLSearchParams(window.location.search).has('register');
const REGISTER_LINK = `${window.location.origin}${window.location.pathname}?register`;
const ADMIN_EMAIL = "othniel.atseh@gmail.com";

const B = {
  purple: "#2D1654", purpleMid: "#3D2070", purpleLight: "#5A3090",
  gold: "#F5A623", goldLight: "#FFD27D", teal: "#00BCD4", tealDark: "#008FA3",
  white: "#FFFFFF", offWhite: "#F8F5FF", gray: "#8B7FAA",
  darkGray: "#4A4060", green: "#27AE60", red: "#E74C3C",
};

const CERTS = ["CCIE Enterprise","CCIE Security","CCNP Enterprise","CCNP Security","CCNA","CompTIA Security+","CompTIA CySA+","CompTIA A+","Fortinet NSE","Azure AZ-900","PMP","ITIL"];
const SECTORS = ["Tech","Banking","Telecoms","Government","Healthcare","Mining","Education","Other"];
const COUNTRIES = ["Ghana","Côte d'Ivoire","Mali","Benin","Togo","Senegal","Cameroon","Nigeria","Burkina Faso","Congo","France","Other"];
const CARD_COLORS = [B.teal, B.gold, B.purpleLight, B.green];

const COUNTRY_COORDS = {
  "Ghana": [7.9465, -1.0232], "Côte d'Ivoire": [7.54, -5.55], "Mali": [17.57, -3.99],
  "Benin": [9.31, 2.32], "Togo": [8.62, 0.82], "Senegal": [14.50, -14.45],
  "Cameroon": [3.85, 11.52], "Nigeria": [9.08, 8.68], "Burkina Faso": [12.36, -1.53],
  "Congo": [-4.04, 21.76], "France": [46.23, 2.21], "Other": [0, 20],
};

const INITIAL_ALUMNI = [
  { name: "Aurore Oniboukou", country: "Benin", flag: "🇧🇯", cert: "CCIE Enterprise", year: 2019, employer: "Sopra Steria, France", role: "Network Engineer", sector: "Tech", story: "One of the first women from Benin to achieve CCIE certification. She started her career in Ghana with a Cisco Gold Partner and later joined Sopra Steria in France.", linkedin: "", email: "aurore@example.com" },
  { name: "Gemila Koureichi", country: "Mali", flag: "🇲🇱", cert: "CCNP Security", year: 2021, employer: "Government of Mali", role: "Head of Information Security", sector: "Government", story: "After completing CCNP Security at Improtech, Gemila returned to Mali and now leads information security for a government institution.", linkedin: "", email: "gemila@example.com" },
  { name: "Vanessa Manzan", country: "Côte d'Ivoire", flag: "🇨🇮", cert: "CCNP Security", year: 2020, employer: "Mining Sector", role: "Network Security Officer", sector: "Mining", story: "After gaining experience with a systems integrator in Ghana, Vanessa now works as a Network Security Officer in the mining sector.", linkedin: "", email: "vanessa@example.com" },
];

const iStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, background: `${B.purple}88`, border: `1px solid ${B.purpleLight}55`, color: B.white, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const lStyle = { fontSize: 12, color: B.gray, fontWeight: 600, marginBottom: 4, display: "block" };

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
  return <div style={{ minHeight: "100vh", background: B.purple, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center", color: B.gray }}><div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div><div>Loading...</div></div></div>;
}

function LogoIcon({ size = 40 }) {
  return <img src={`${import.meta.env.BASE_URL}logo.png`} alt="IMPROTECH" style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, display: "block" }} />;
}

// ─── WORLD MAP ────────────────────────────────────────────────────────────
function AlumniMap({ alumni }) {
  const grouped = {};
  alumni.forEach(a => {
    const key = a.country || "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  // Simple SVG world map projection
  const project = ([lat, lng]) => {
    const x = ((lng + 180) / 360) * 680;
    const y = ((90 - lat) / 180) * 340;
    return [x, y];
  };

  const dots = Object.entries(grouped).map(([country, als]) => {
    const coords = COUNTRY_COORDS[country];
    if (!coords) return null;
    const [x, y] = project(coords);
    return { country, als, x, y };
  }).filter(Boolean);

  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{ background: B.purpleMid, borderRadius: 18, padding: 24, border: `1px solid ${B.purpleLight}33` }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🗺️ Alumni World Map</div>
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: `${B.purple}88`, border: `1px solid ${B.purpleLight}33` }}>
        <svg width="100%" viewBox="0 0 680 340" style={{ display: "block" }}>
          {/* Grid lines */}
          {[30,60,90,120,150].map(x => <line key={x} x1={x*680/180} y1={0} x2={x*680/180} y2={340} stroke={`${B.purpleLight}22`} strokeWidth={0.5} />)}
          {[60,120,180,240,300].map(y => <line key={y} x1={0} y1={y*340/360} x2={680} y2={y*340/360} stroke={`${B.purpleLight}22`} strokeWidth={0.5} />)}

          {/* Africa highlight */}
          <ellipse cx={385} cy={195} rx={80} ry={90} fill={`${B.purpleLight}22`} stroke={`${B.purpleLight}44`} strokeWidth={0.5} />
          <text x={385} y={300} textAnchor="middle" fill={`${B.gray}`} fontSize={10}>Africa</text>

          {/* Europe highlight */}
          <ellipse cx={340} cy={105} rx={35} ry={25} fill={`${B.purpleLight}22`} stroke={`${B.purpleLight}44`} strokeWidth={0.5} />
          <text x={340} y={90} textAnchor="middle" fill={`${B.gray}`} fontSize={10}>Europe</text>

          {/* Alumni dots */}
          {dots.map(({ country, als, x, y }) => (
            <g key={country} style={{ cursor: "pointer" }}
              onMouseEnter={() => setTooltip({ country, als, x, y })}
              onMouseLeave={() => setTooltip(null)}>
              <circle cx={x} cy={y} r={Math.min(6 + als.length * 4, 20)} fill={B.gold} opacity={0.85} />
              <circle cx={x} cy={y} r={Math.min(6 + als.length * 4, 20) + 4} fill={B.gold} opacity={0.2} />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill={B.purple} fontSize={10} fontWeight={800}>{als.length}</text>
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{ position: "absolute", left: Math.min(tooltip.x, 500), top: Math.max(tooltip.y - 10, 0), background: B.purpleMid, border: `1px solid ${B.gold}55`, borderRadius: 10, padding: "10px 14px", pointerEvents: "none", minWidth: 160, zIndex: 10, boxShadow: "0 4px 16px #0008" }}>
            <div style={{ fontWeight: 700, color: B.gold, fontSize: 13, marginBottom: 6 }}>{tooltip.country}</div>
            {tooltip.als.map(a => (
              <div key={a.firestoreId || a.name} style={{ fontSize: 12, color: B.offWhite, marginBottom: 3 }}>• {a.name} · {a.cert}</div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {dots.map(({ country, als }) => (
          <div key={country} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: B.gray }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: B.gold }} />
            {country} ({als.length})
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ALUMNI OF THE MONTH ─────────────────────────────────────────────────
function AlumniOfTheMonth({ alumni, isAdmin }) {
  const [aotm, setAotm] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "alumniOfTheMonth"), snap => {
      if (snap.exists()) setAotm(snap.data());
    });
    return unsub;
  }, []);

  const select = async (a) => {
    const month = new Date().toLocaleString("en", { month: "long", year: "numeric" });
    await setDoc(doc(db, "config", "alumniOfTheMonth"), { ...a, month, selectedAt: serverTimestamp() });
    setSelecting(false);
  };

  const shareText = aotm ? `🏆 Alumni of the Month — ${aotm.month}\n\n🎓 ${aotm.name}\n📍 ${aotm.country} | ${aotm.cert}\n💼 ${aotm.role} @ ${aotm.employer}\n\n"${aotm.story}"\n\n— IMPROTECH Training Center` : "";

  const copyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!aotm && !isAdmin) return null;

  return (
    <div style={{ background: `linear-gradient(135deg, ${B.gold}22, ${B.goldLight}11)`, border: `1px solid ${B.gold}44`, borderRadius: 18, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: B.gold }}>🏆 Alumni of the Month</div>
        {isAdmin && <button onClick={() => setSelecting(!selecting)} style={{ padding: "6px 14px", borderRadius: 8, background: `${B.gold}22`, color: B.gold, border: `1px solid ${B.gold}44`, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{selecting ? "Cancel" : "Change"}</button>}
      </div>

      {selecting && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: B.gray, marginBottom: 10 }}>Select an alumni :</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
            {alumni.map(a => (
              <div key={a.firestoreId} onClick={() => select(a)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: `${B.purple}88`, borderRadius: 10, cursor: "pointer", border: `1px solid ${B.purpleLight}33` }}>
                <Avatar name={a.name} size={36} />
                <div><div style={{ fontSize: 13, color: B.white, fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 11, color: B.gray }}>{a.cert} · {a.country}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {aotm ? (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Avatar name={aotm.name} size={72} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: B.white }}>{aotm.name}</div>
            <div style={{ fontSize: 13, color: B.gray, marginTop: 2 }}>{aotm.flag} {aotm.country} · {aotm.cert}</div>
            <div style={{ fontSize: 13, color: B.offWhite, marginTop: 4 }}>{aotm.role} @ {aotm.employer}</div>
            {aotm.story && <div style={{ fontSize: 13, color: B.gray, marginTop: 8, lineHeight: 1.6, fontStyle: "italic" }}>"{aotm.story.slice(0, 150)}..."</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={copyShare} style={{ padding: "8px 16px", borderRadius: 8, background: `linear-gradient(135deg, ${B.gold}, ${B.goldLight})`, color: B.purple, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {copied ? "✓ Copied!" : "📋 Copy & Share"}
              </button>
              <div style={{ padding: "6px 12px", borderRadius: 8, background: `${B.gold}22`, color: B.gold, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center" }}>{aotm.month}</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0", color: B.gray, fontSize: 14 }}>No alumni selected yet. Click "Change" to highlight someone.</div>
      )}
    </div>
  );
}

// ─── RESOURCE LIBRARY ────────────────────────────────────────────────────
function ResourceLibrary({ user, isAdmin }) {
  const [resources, setResources] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", url: "", category: "", cert: "" });
  const [filter, setFilter] = useState("");

  const CATEGORIES = ["Study Guide", "Cheat Sheet", "Practice Exam", "Video", "Article", "Tool", "Other"];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "resources"), snap => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setResources(data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    });
    return unsub;
  }, []);

  const addResource = async () => {
    if (!form.title || !form.url) return;
    await addDoc(collection(db, "resources"), { ...form, addedBy: user.email, createdAt: serverTimestamp() });
    setForm({ title: "", description: "", url: "", category: "", cert: "" });
    setShowAdd(false);
  };

  const deleteResource = async (id) => {
    if (window.confirm("Delete this resource?")) await deleteDoc(doc(db, "resources", id));
  };

  const filtered = filter ? resources.filter(r => r.cert === filter || r.category === filter) : resources;

  const catColors = { "Study Guide": B.teal, "Cheat Sheet": B.gold, "Practice Exam": B.green, "Video": "#9C27B0", "Article": B.purpleLight, "Tool": B.tealDark, "Other": B.gray };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800 }}>📚 Resource Library</div>
          <div style={{ color: B.gray, fontSize: 14, marginTop: 4 }}>Study materials shared by the community</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "10px 20px", borderRadius: 10, background: `linear-gradient(135deg, ${B.gold}, ${B.goldLight})`, color: B.purple, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {showAdd ? "✕ Cancel" : "+ Add Resource"}
        </button>
      </div>

      {showAdd && (
        <div style={{ background: B.purpleMid, borderRadius: 16, padding: 24, border: `1px solid ${B.purpleLight}33` }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Add a Resource</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>Title *</label><input style={iStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. CCIE Study Guide 2024" /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>URL / Link *</label><input style={iStyle} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
            <div><label style={lStyle}>Category</label><select style={iStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}><option value="">-- Select --</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={lStyle}>Certification</label><select style={iStyle} value={form.cert} onChange={e => setForm(f => ({ ...f, cert: e.target.value }))}><option value="">-- Select --</option>{CERTS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>Description</label><textarea style={{ ...iStyle, resize: "vertical", minHeight: 70 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this resource..." /></div>
          </div>
          <button onClick={addResource} disabled={!form.title || !form.url} style={{ marginTop: 14, padding: "11px 24px", borderRadius: 10, background: form.title && form.url ? `linear-gradient(135deg, ${B.gold}, ${B.goldLight})` : B.darkGray, color: form.title && form.url ? B.purple : B.gray, border: "none", fontWeight: 700, fontSize: 14, cursor: form.title && form.url ? "pointer" : "default" }}>
            ✓ Share Resource
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("")} style={{ padding: "6px 14px", borderRadius: 20, background: !filter ? B.gold : `${B.purpleLight}33`, color: !filter ? B.purple : B.gray, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>All ({resources.length})</button>
        {CATEGORIES.filter(c => resources.some(r => r.category === c)).map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{ padding: "6px 14px", borderRadius: 20, background: filter === c ? catColors[c] || B.teal : `${B.purpleLight}33`, color: filter === c ? "#fff" : B.gray, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{c}</button>
        ))}
      </div>

      {/* Resource cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {filtered.map(r => {
          const col = catColors[r.category] || B.gray;
          return (
            <div key={r.id} style={{ background: B.purpleMid, borderRadius: 14, padding: 20, border: `1px solid ${B.purpleLight}33`, borderTop: `3px solid ${col}`, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: B.white, fontSize: 14, marginBottom: 6 }}>{r.title}</div>
                  {r.description && <div style={{ fontSize: 12, color: B.gray, lineHeight: 1.5 }}>{r.description}</div>}
                </div>
                {(isAdmin || r.addedBy === user.email) && (
                  <button onClick={() => deleteResource(r.id)} style={{ background: "none", border: "none", color: B.gray, cursor: "pointer", fontSize: 14, padding: "0 0 0 8px" }}>🗑</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {r.category && <span style={{ background: `${col}22`, color: col, border: `1px solid ${col}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{r.category}</span>}
                {r.cert && <span style={{ background: `${B.teal}22`, color: B.teal, border: `1px solid ${B.teal}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{r.cert}</span>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: B.gray }}>by {r.addedBy?.split("@")[0]}</div>
                <a href={r.url} target="_blank" rel="noreferrer" style={{ padding: "7px 16px", borderRadius: 8, background: `linear-gradient(135deg, ${B.teal}, ${B.tealDark})`, color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>Open →</a>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: B.gray }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <div>No resources yet. Be the first to share one!</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHAT ────────────────────────────────────────────────────────────────
function ChatPanel({ user, userName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "messages"), snap => {
      const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
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

  const fmt = ts => { if (!ts?.toMillis) return ""; const d = new Date(ts.toMillis()); return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", minHeight: 400, background: B.purpleMid, borderRadius: 18, border: `1px solid ${B.purpleLight}33`, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.purpleLight}33`, fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15 }}>💬 Alumni Chat</div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && <div style={{ textAlign: "center", padding: 40, color: B.gray, fontSize: 14 }}>No messages yet. Say hello! 👋</div>}
        {messages.map(m => {
          const isMe = m.senderUid === user.uid;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 10, alignItems: "flex-end" }}>
              {!isMe && <Avatar name={m.senderName} size={32} />}
              <div style={{ maxWidth: "70%" }}>
                {!isMe && <div style={{ fontSize: 11, color: B.gray, marginBottom: 3, marginLeft: 4 }}>{m.senderName}</div>}
                <div style={{ background: isMe ? `linear-gradient(135deg, ${B.purpleLight}, ${B.purple})` : `${B.purple}88`, borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontSize: 14, color: B.white, border: `1px solid ${B.purpleLight}44` }}>{m.text}</div>
                <div style={{ fontSize: 10, color: B.gray, marginTop: 3, textAlign: isMe ? "right" : "left" }}>{fmt(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${B.purpleLight}33`, display: "flex", gap: 10 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Write a message..." style={{ ...iStyle, margin: 0 }} />
        <button onClick={send} disabled={!text.trim()} style={{ padding: "10px 20px", borderRadius: 10, background: text.trim() ? `linear-gradient(135deg, ${B.gold}, ${B.goldLight})` : B.darkGray, color: text.trim() ? B.purple : B.gray, fontWeight: 700, border: "none", cursor: text.trim() ? "pointer" : "default", flexShrink: 0, fontSize: 14 }}>Send</button>
      </div>
    </div>
  );
}

// ─── ALUMNI CARD ─────────────────────────────────────────────────────────
function AlumniCard({ a, onClick }) {
  const bg = cardColor(a.name);
  return (
    <div onClick={() => onClick(a)} style={{ background: B.purpleMid, borderRadius: 16, padding: 20, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", border: `1px solid ${B.purpleLight}55`, display: "flex", flexDirection: "column", gap: 12 }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${B.purple}88`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Avatar name={a.name} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: B.white, fontSize: 15, marginBottom: 2, fontFamily: "'Sora', sans-serif" }}>{a.name}</div>
          <div style={{ fontSize: 12, color: B.gray }}>{a.flag} {a.country}</div>
        </div>
        {a.isNew && <span style={{ background: `${B.green}22`, color: B.green, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>NEW</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ background: `${bg}22`, border: `1px solid ${bg}44`, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: bg, fontWeight: 700, display: "inline-block", width: "fit-content" }}>{a.cert}</div>
        <div style={{ fontSize: 13, color: B.offWhite, fontWeight: 600 }}>{a.role}</div>
        <div style={{ fontSize: 12, color: B.gray }}>{a.employer}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: B.gray }}>Class of {a.year}</div>
        {a.sector && <div style={{ background: `${B.green}22`, color: B.green, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{a.sector}</div>}
      </div>
    </div>
  );
}

function AlumniModal({ a, onClose, onDelete, isAdmin }) {
  const bg = cardColor(a.name);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: B.purpleMid, borderRadius: 24, padding: 32, maxWidth: 480, width: "100%", border: `1px solid ${B.purpleLight}55`, boxShadow: `0 24px 64px ${B.purple}cc` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
          <Avatar name={a.name} size={72} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: B.white, fontFamily: "'Sora', sans-serif" }}>{a.name}</div>
            <div style={{ fontSize: 14, color: B.gray, marginTop: 2 }}>{a.flag} {a.country} · Class of {a.year}</div>
            <div style={{ marginTop: 6 }}><span style={{ background: `${bg}22`, border: `1px solid ${bg}44`, borderRadius: 8, padding: "3px 10px", fontSize: 12, color: bg, fontWeight: 700 }}>{a.cert}</span></div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[{ label: "Role", value: a.role }, { label: "Employer", value: a.employer }, { label: "Email", value: a.email }, { label: "Sector", value: a.sector }].filter(x => x.value).map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 80, fontSize: 12, color: B.gray, fontWeight: 600, flexShrink: 0 }}>{label}</div>
              <div style={{ flex: 1, fontSize: 14, color: B.white }}>{value}</div>
            </div>
          ))}
        </div>
        {a.story && <div style={{ background: `${B.gold}11`, border: `1px solid ${B.gold}33`, borderRadius: 12, padding: 16, marginBottom: 20 }}><div style={{ fontSize: 11, color: B.gold, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Success Story</div><div style={{ fontSize: 13, color: B.offWhite, lineHeight: 1.6 }}>{a.story}</div></div>}
        <div style={{ display: "flex", gap: 10 }}>
          {a.linkedin && <a href={a.linkedin} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", padding: "10px 16px", background: B.teal, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>LinkedIn</a>}
          {a.email && <a href={`mailto:${a.email}`} style={{ flex: 1, textAlign: "center", padding: "10px 16px", background: B.purpleLight, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Email</a>}
          {isAdmin && <button onClick={() => { if (window.confirm(`Delete ${a.name}?`)) { onDelete(a.firestoreId); onClose(); } }} style={{ padding: "10px 14px", borderRadius: 10, background: `${B.red}22`, color: B.red, border: `1px solid ${B.red}44`, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>🗑</button>}
          <button onClick={onClose} style={{ flex: 1, padding: "10px 16px", background: `${B.white}11`, color: B.gray, border: `1px solid ${B.purpleLight}55`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Directory({ alumni, onDelete, isAdmin }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCert, setFilterCert] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const filtered = alumni.filter(a => {
    const q = search.toLowerCase();
    const m = !q || a.name?.toLowerCase().includes(q) || a.role?.toLowerCase().includes(q) || a.employer?.toLowerCase().includes(q);
    return m && (!filterCert || a.cert === filterCert) && (!filterCountry || a.country === filterCountry);
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800 }}>Alumni Directory</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 10, background: B.purpleMid, border: `1px solid ${B.purpleLight}55`, color: B.white, fontSize: 14, outline: "none" }} />
        <select value={filterCert} onChange={e => setFilterCert(e.target.value)} style={{ flex: "1 1 150px", padding: "10px 14px", borderRadius: 10, background: B.purpleMid, border: `1px solid ${B.purpleLight}55`, color: filterCert ? B.white : B.gray, fontSize: 13, outline: "none" }}>
          <option value="">All Certifications</option>{CERTS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{ flex: "1 1 150px", padding: "10px 14px", borderRadius: 10, background: B.purpleMid, border: `1px solid ${B.purpleLight}55`, color: filterCountry ? B.white : B.gray, fontSize: 13, outline: "none" }}>
          <option value="">All Countries</option>{COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
        {(search || filterCert || filterCountry) && <button onClick={() => { setSearch(""); setFilterCert(""); setFilterCountry(""); }} style={{ padding: "10px 16px", borderRadius: 10, background: `${B.red}22`, color: B.red, border: `1px solid ${B.red}44`, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕</button>}
      </div>
      <div style={{ fontSize: 13, color: B.gray }}>{filtered.length} alumni</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {filtered.map(a => <AlumniCard key={a.firestoreId} a={a} onClick={setSelected} />)}
        {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: B.gray }}><div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div><div>No results found.</div></div>}
      </div>
      {selected && <AlumniModal a={selected} onClose={() => setSelected(null)} onDelete={onDelete} isAdmin={isAdmin} />}
    </div>
  );
}

function Stories({ alumni }) {
  const withStories = alumni.filter(a => a.story);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div><div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Success Stories</div><div style={{ color: B.gray, fontSize: 14 }}>Inspiring journeys from our graduates</div></div>
      {withStories.map((a, i) => {
        const cols = [B.gold, B.teal, B.green, B.purpleLight]; const ac = cols[i % cols.length];
        return <div key={a.firestoreId} style={{ background: B.purpleMid, borderRadius: 20, padding: 28, border: `1px solid ${ac}33`, borderLeft: `4px solid ${ac}`, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}><Avatar name={a.name} size={56} /><div style={{ flex: 1 }}><div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 17, color: B.white }}>{a.name}</div><div style={{ fontSize: 13, color: B.gray, marginTop: 2 }}>{a.flag} {a.country} · {a.cert} · Class of {a.year}</div></div></div>
          <div style={{ background: `${ac}11`, borderRadius: 12, padding: 16, fontSize: 14, color: B.offWhite, lineHeight: 1.7, fontStyle: "italic" }}>"{a.story}"</div>
          <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}><div><span style={{ color: B.gray }}>Role: </span><span style={{ color: B.white, fontWeight: 600 }}>{a.role}</span></div><div><span style={{ color: B.gray }}>At: </span><span style={{ color: ac, fontWeight: 600 }}>{a.employer}</span></div></div>
        </div>;
      })}
      {withStories.length === 0 && <div style={{ textAlign: "center", padding: 60, color: B.gray }}><div style={{ fontSize: 40, marginBottom: 12 }}>★</div><div>Success stories will appear here.</div></div>}
    </div>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────
function AppLayout({ user, userName, isAdmin, tabs, activeTab, setTab, children, rightActions }) {
  return (
    <div style={{ minHeight: "100vh", background: B.purple, fontFamily: "'Inter', 'Segoe UI', sans-serif", color: B.white }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } select option { background: #3D2070; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #5A3090; border-radius: 3px; } input::placeholder, textarea::placeholder { color: #8B7FAA; }`}</style>
      <div style={{ background: `linear-gradient(135deg, ${B.purpleMid}, ${B.purple})`, borderBottom: `1px solid ${B.purpleLight}44`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap" }}>
        <LogoIcon size={36} />
        <div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16 }}>IMPROTECH Alumni</div>
          <div style={{ fontSize: 11, color: B.gray, marginTop: 2 }}>{isAdmin ? "👑 Admin" : "🎓 Alumni"} · {userName}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {rightActions}
          <button onClick={() => signOut(auth)} style={{ padding: "8px 14px", borderRadius: 10, background: `${B.white}11`, color: B.gray, border: `1px solid ${B.purpleLight}44`, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Sign Out</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 0, padding: "0 24px", borderBottom: `1px solid ${B.purpleLight}33`, background: B.purpleMid, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 16px", background: activeTab === t.id ? B.purple : "transparent", color: activeTab === t.id ? B.gold : B.gray, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, borderBottom: activeTab === t.id ? `2px solid ${B.gold}` : "2px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap", fontFamily: "'Sora', sans-serif" }}>{t.icon} {t.label}</button>
        ))}
      </div>
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

// ─── ALUMNI APP ───────────────────────────────────────────────────────────
function AlumniDashboard({ user, userName }) {
  const [alumni, setAlumni] = useState([]);
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "alumni"), snap => {
      const now = Date.now();
      const data = snap.docs.map(d => ({ ...d.data(), firestoreId: d.id, isNew: d.data().createdAt?.toMillis ? (now - d.data().createdAt.toMillis()) < 86400000 : false }));
      setAlumni(data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const TABS = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "directory", label: "Directory", icon: "☰" },
    { id: "map", label: "Map", icon: "🗺️" },
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "stories", label: "Stories", icon: "★" },
    { id: "resources", label: "Resources", icon: "📚" },
  ];

  if (loading) return <Loading />;

  return (
    <AppLayout user={user} userName={userName} isAdmin={false} tabs={TABS} activeTab={tab} setTab={setTab}>
      {tab === "home" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome back, {userName.split(" ")[0]} 👋</div>
            <div style={{ color: B.gray, fontSize: 14 }}>Connect with {alumni.length} IMPROTECH alumni worldwide</div>
          </div>
          <AlumniOfTheMonth alumni={alumni} isAdmin={false} />
          <AlumniMap alumni={alumni} />
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🕐 Recently joined</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {alumni.slice(0, 3).map(a => <AlumniCard key={a.firestoreId} a={a} onClick={() => setTab("directory")} />)}
            </div>
          </div>
        </div>
      )}
      {tab === "directory" && <Directory alumni={alumni} onDelete={() => {}} isAdmin={false} />}
      {tab === "map" && <div style={{ display: "flex", flexDirection: "column", gap: 20 }}><div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800 }}>Alumni World Map</div><AlumniMap alumni={alumni} /></div>}
      {tab === "chat" && <ChatPanel user={user} userName={userName} />}
      {tab === "stories" && <Stories alumni={alumni} />}
      {tab === "resources" && <ResourceLibrary user={user} isAdmin={false} />}
    </AppLayout>
  );
}

// ─── ADMIN APP ───────────────────────────────────────────────────────────
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
      const data = snap.docs.map(d => ({ ...d.data(), firestoreId: d.id, isNew: d.data().createdAt?.toMillis ? (now - d.data().createdAt.toMillis()) < 86400000 : false }));
      setAlumni(data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = async (id) => { await deleteDoc(doc(db, "alumni", id)); showToast("Alumni removed.", "error"); };
  const copyLink = () => { navigator.clipboard.writeText(REGISTER_LINK); setLinkCopied(true); showToast("Link copied!", "info"); setTimeout(() => setLinkCopied(false), 2000); };

  const stats = { total: alumni.length, countries: [...new Set(alumni.map(a => a.country))].length, sectors: [...new Set(alumni.map(a => a.sector))].length, nouveaux: alumni.filter(a => a.isNew).length };
  const byCert = CERTS.map(c => ({ c, n: alumni.filter(a => a.cert === c).length })).filter(x => x.n > 0);
  const bySector = SECTORS.map(s => ({ s, n: alumni.filter(a => a.sector === s).length })).filter(x => x.n > 0);

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "◉" },
    { id: "directory", label: "Directory", icon: "☰" },
    { id: "map", label: "Map", icon: "🗺️" },
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "stories", label: "Stories", icon: "★" },
    { id: "resources", label: "Resources", icon: "📚" },
    { id: "aotm", label: "Alumni of Month", icon: "🏆" },
  ];

  if (loading) return <Loading />;

  const rightActions = <>
    {stats.nouveaux > 0 && <div style={{ background: `${B.green}22`, border: `1px solid ${B.green}44`, borderRadius: 8, padding: "4px 12px", fontSize: 13, color: B.green, fontWeight: 700 }}>+{stats.nouveaux} new</div>}
    <button onClick={copyLink} style={{ padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: linkCopied ? B.green : `linear-gradient(135deg, ${B.gold}, ${B.goldLight})`, color: linkCopied ? B.white : B.purple, transition: "all 0.3s" }}>
      {linkCopied ? "✓ Copied!" : "📋 Invite Alumni"}
    </button>
  </>;

  return (
    <AppLayout user={user} userName="Admin" isAdmin={true} tabs={TABS} activeTab={tab} setTab={setTab} rightActions={rightActions}>
      <Toast toast={toast} />

      {tab === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div><div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Admin Dashboard</div><div style={{ color: B.gray, fontSize: 14 }}>Real-time data · Firebase ⚡</div></div>
          <div style={{ background: B.purpleMid, borderRadius: 16, padding: 20, border: `1px solid ${B.gold}33` }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, color: B.gold, marginBottom: 10 }}>📋 Alumni Registration Link</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, background: `${B.purple}88`, border: `1px solid ${B.purpleLight}55`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: B.gray, fontFamily: "monospace", wordBreak: "break-all" }}>{REGISTER_LINK}</div>
              <button onClick={copyLink} style={{ padding: "8px 18px", borderRadius: 8, background: `linear-gradient(135deg, ${B.gold}, ${B.goldLight})`, color: B.purple, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{linkCopied ? "✓ Copied!" : "Copy"}</button>
            </div>
            <div style={{ fontSize: 12, color: B.gray, marginTop: 8 }}>Share this link with alumni — they register and appear here automatically.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            {[{ label: "Total Alumni", value: stats.total, color: B.gold, sub: "Since 2015" }, { label: "Countries", value: stats.countries, color: B.teal }, { label: "Sectors", value: stats.sectors, color: B.purpleLight }, { label: "Joined Today", value: stats.nouveaux, color: B.green, sub: "Last 24h" }].map(s => (
              <div key={s.label} style={{ background: `linear-gradient(135deg, ${s.color}22 0%, ${s.color}11 100%)`, border: `1px solid ${s.color}44`, borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "'Sora', sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 13, color: B.gray, fontWeight: 600 }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 11, color: B.gray, marginTop: 2 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
          <AlumniMap alumni={alumni} />
          {byCert.length > 0 && <div style={{ background: B.purpleMid, borderRadius: 18, padding: 24, border: `1px solid ${B.purpleLight}33` }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📜 Certifications</div>
            {byCert.sort((a, b) => b.n - a.n).map(({ c, n }) => (
              <div key={c} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                <div style={{ width: 160, fontSize: 13, color: B.offWhite, flexShrink: 0 }}>{c}</div>
                <div style={{ flex: 1, height: 8, background: `${B.purpleLight}44`, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${(n / Math.max(alumni.length, 1)) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${B.gold}, ${B.teal})`, borderRadius: 4 }} /></div>
                <div style={{ fontSize: 13, color: B.gold, fontWeight: 700, width: 24, textAlign: "right" }}>{n}</div>
              </div>
            ))}
          </div>}
          {bySector.length > 0 && <div style={{ background: B.purpleMid, borderRadius: 18, padding: 24, border: `1px solid ${B.purpleLight}33` }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🏢 Sectors</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {bySector.sort((a, b) => b.n - a.n).map(({ s, n }, i) => { const cols = [B.teal, B.gold, B.purpleLight, B.green, B.gray]; const col = cols[i % cols.length]; return <div key={s} style={{ background: `${col}22`, border: `1px solid ${col}44`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 10, alignItems: "center" }}><span style={{ color: col, fontWeight: 700 }}>{n}</span><span style={{ fontSize: 13, color: B.offWhite }}>{s}</span></div>; })}
            </div>
          </div>}
        </div>
      )}
      {tab === "directory" && <Directory alumni={alumni} onDelete={handleDelete} isAdmin={true} />}
      {tab === "map" && <div style={{ display: "flex", flexDirection: "column", gap: 20 }}><div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800 }}>Alumni World Map</div><AlumniMap alumni={alumni} /></div>}
      {tab === "chat" && <ChatPanel user={user} userName="Admin" />}
      {tab === "stories" && <Stories alumni={alumni} />}
      {tab === "resources" && <ResourceLibrary user={user} isAdmin={true} />}
      {tab === "aotm" && <div style={{ display: "flex", flexDirection: "column", gap: 20 }}><div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800 }}>🏆 Alumni of the Month</div><AlumniOfTheMonth alumni={alumni} isAdmin={true} /></div>}
    </AppLayout>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────
function LoginPage() {
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setError("Incorrect email or password."); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: B.purple, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap'); * { box-sizing: border-box; } input::placeholder { color: #8B7FAA; }`}</style>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><LogoIcon size={100} /></div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: B.white }}>IMPROTECH Alumni</div>
          <div style={{ fontSize: 13, color: B.gray, marginTop: 4 }}>Connect to your community</div>
        </div>

        {!mode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <button onClick={() => setMode("alumni")} style={{ padding: "18px 24px", borderRadius: 14, border: `1px solid ${B.teal}55`, background: `${B.teal}11`, cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
              onMouseEnter={e => e.currentTarget.style.background = `${B.teal}22`}
              onMouseLeave={e => e.currentTarget.style.background = `${B.teal}11`}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${B.teal}, ${B.tealDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎓</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: B.white }}>Alumni Login</div>
                <div style={{ fontSize: 12, color: B.gray, marginTop: 2 }}>Access the network, chat & resources</div>
              </div>
              <div style={{ marginLeft: "auto", color: B.teal, fontSize: 20 }}>→</div>
            </button>
            <button onClick={() => setMode("admin")} style={{ padding: "18px 24px", borderRadius: 14, border: `1px solid ${B.gold}55`, background: `${B.gold}11`, cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
              onMouseEnter={e => e.currentTarget.style.background = `${B.gold}22`}
              onMouseLeave={e => e.currentTarget.style.background = `${B.gold}11`}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${B.gold}, ${B.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>👑</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: B.white }}>Admin Login</div>
                <div style={{ fontSize: 12, color: B.gray, marginTop: 2 }}>Manage the platform & statistics</div>
              </div>
              <div style={{ marginLeft: "auto", color: B.gold, fontSize: 20 }}>→</div>
            </button>
          </div>
        )}

        {mode && (
          <div style={{ background: B.purpleMid, borderRadius: 20, padding: 32, border: `1px solid ${mode === "admin" ? B.gold : B.teal}44` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => { setMode(null); setEmail(""); setPassword(""); setError(""); }} style={{ background: "none", border: "none", color: B.gray, cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: B.white }}>{mode === "admin" ? "👑 Admin Sign In" : "🎓 Alumni Sign In"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lStyle}>Email</label><input style={iStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus /></div>
              <div><label style={lStyle}>Password</label><input style={iStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
              {error && <div style={{ background: `${B.red}22`, border: `1px solid ${B.red}44`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: B.red }}>{error}</div>}
              <button onClick={handleLogin} disabled={loading || !email || !password} style={{ padding: "13px", borderRadius: 12, border: "none", cursor: email && password ? "pointer" : "default", background: email && password ? `linear-gradient(135deg, ${mode === "admin" ? B.gold : B.teal}, ${mode === "admin" ? B.goldLight : B.tealDark})` : B.darkGray, color: email && password ? (mode === "admin" ? B.purple : B.white) : B.gray, fontWeight: 800, fontSize: 15, fontFamily: "'Sora', sans-serif" }}>
                {loading ? "Signing in..." : "→ Sign In"}
              </button>
            </div>
            {mode === "alumni" && <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: B.gray }}>No account yet? Contact an admin to receive your registration link.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── REGISTER ────────────────────────────────────────────────────────────
function RegisterPage() {
  const flagMap = { Ghana: "🇬🇭", "Côte d'Ivoire": "🇨🇮", Mali: "🇲🇱", Benin: "🇧🇯", Togo: "🇹🇬", Senegal: "🇸🇳", Cameroon: "🇨🇲", Nigeria: "🇳🇬", "Burkina Faso": "🇧🇫", Congo: "🇨🇬", France: "🇫🇷", Other: "🌍" };
  const [form, setForm] = useState({ name: "", country: "", flag: "", cert: "", year: new Date().getFullYear(), employer: "", role: "", sector: "", story: "", linkedin: "", email: "", password: "", confirm: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v, ...(k === "country" ? { flag: flagMap[v] || "🌍" } : {}) }));
  const valid = form.name && form.country && form.cert && form.employer && form.role && form.email && form.password && form.password === form.confirm && form.password.length >= 6;

  const handleSubmit = async () => {
    if (!valid) return;
    setStatus("loading"); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const { password, confirm, ...profile } = form;
      await addDoc(collection(db, "alumni"), { ...profile, year: Number(profile.year), uid: cred.user.uid, createdAt: serverTimestamp() });
      await setDoc(doc(db, "users", cred.user.uid), { role: "alumni", name: form.name, email: form.email, createdAt: serverTimestamp() });
      await signOut(auth);
      setStatus("success");
    } catch (e) {
      setError(e.code === "auth/email-already-in-use" ? "This email is already registered." : "An error occurred. Please try again.");
      setStatus("idle");
    }
  };

  if (status === "success") return (
    <div style={{ minHeight: "100vh", background: B.purple, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@800&display=swap'); * { box-sizing: border-box; }`}</style>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: B.white, marginBottom: 12 }}>Welcome {form.name.split(" ")[0]}!</div>
        <div style={{ fontSize: 15, color: B.gray, lineHeight: 1.7, marginBottom: 24 }}>Your profile has been created. Sign in now to join the community!</div>
        <button onClick={() => window.location.href = window.location.pathname} style={{ padding: "12px 28px", borderRadius: 12, background: `linear-gradient(135deg, ${B.gold}, ${B.goldLight})`, color: B.purple, fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "'Sora', sans-serif" }}>→ Sign In</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: B.purple, fontFamily: "'Inter', sans-serif", color: B.white }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap'); * { box-sizing: border-box; } select option { background: #3D2070; } input::placeholder, textarea::placeholder { color: #8B7FAA; }`}</style>
      <div style={{ background: B.purpleMid, borderBottom: `1px solid ${B.purpleLight}44`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <LogoIcon size={40} />
        <div><div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16 }}>IMPROTECH Alumni</div><div style={{ fontSize: 11, color: B.gray }}>Create your alumni account</div></div>
      </div>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <div style={{ background: `${B.gold}11`, border: `1px solid ${B.gold}33`, borderRadius: 14, padding: 20, marginBottom: 28 }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: B.white, marginBottom: 6 }}>Join the IMPROTECH family! 🎓</div>
          <div style={{ fontSize: 14, color: B.gray, lineHeight: 1.6 }}>Create your account to access the alumni network, chat, and resources.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>Full Name *</label><input style={iStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Jean Dupont" /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>Email * (your login)</label><input style={iStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" /></div>
          <div><label style={lStyle}>Password * (min. 6 chars)</label><input style={iStyle} type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" /></div>
          <div><label style={lStyle}>Confirm Password *</label><input style={iStyle} type="password" value={form.confirm} onChange={e => set("confirm", e.target.value)} placeholder="••••••••" /></div>
          {form.confirm && form.password !== form.confirm && <div style={{ gridColumn: "1/-1", background: `${B.red}22`, border: `1px solid ${B.red}44`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: B.red }}>Passwords do not match.</div>}
          <div><label style={lStyle}>Country *</label><select style={iStyle} value={form.country} onChange={e => set("country", e.target.value)}><option value="">-- Select --</option>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label style={lStyle}>Certification *</label><select style={iStyle} value={form.cert} onChange={e => set("cert", e.target.value)}><option value="">-- Select --</option>{CERTS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label style={lStyle}>Year of Training</label><input style={iStyle} type="number" value={form.year} min={2015} max={2030} onChange={e => set("year", e.target.value)} /></div>
          <div><label style={lStyle}>Sector</label><select style={iStyle} value={form.sector} onChange={e => set("sector", e.target.value)}><option value="">-- Select --</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>Current Role *</label><input style={iStyle} value={form.role} onChange={e => set("role", e.target.value)} placeholder="e.g. Network Security Engineer" /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>Employer *</label><input style={iStyle} value={form.employer} onChange={e => set("employer", e.target.value)} placeholder="e.g. Ecobank Ghana" /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>LinkedIn</label><input style={iStyle} value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>Your Story (optional)</label><textarea style={{ ...iStyle, resize: "vertical", minHeight: 90 }} value={form.story} onChange={e => set("story", e.target.value)} placeholder="Tell us about your journey since training at Improtech..." /></div>
        </div>
        {error && <div style={{ marginTop: 12, padding: "10px 14px", background: `${B.red}22`, border: `1px solid ${B.red}44`, borderRadius: 10, fontSize: 13, color: B.red }}>{error}</div>}
        <button disabled={!valid || status === "loading"} onClick={handleSubmit} style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 12, background: valid ? `linear-gradient(135deg, ${B.gold}, ${B.goldLight})` : B.darkGray, color: valid ? B.purple : B.gray, fontWeight: 800, fontSize: 16, border: "none", cursor: valid ? "pointer" : "default", fontFamily: "'Sora', sans-serif" }}>
          {status === "loading" ? "Creating account..." : "✓ Create My Alumni Account"}
        </button>
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: B.gray }}>IMPROTECH Training Center · Accra, Ghana</div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (IS_REGISTER) { setAuthLoading(false); return; }
    const timeout = setTimeout(() => setAuthLoading(false), 8000);
    const unsub = onAuthStateChanged(auth, async (u) => {
      clearTimeout(timeout);
      if (u) {
        setUser(u);
        const isAdmin = u.email === ADMIN_EMAIL;
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (!snap.exists()) {
            await setDoc(doc(db, "users", u.uid), { role: isAdmin ? "admin" : "alumni", email: u.email, createdAt: serverTimestamp() });
            setRole(isAdmin ? "admin" : "alumni");
            setUserName(u.email.split("@")[0]);
          } else {
            setRole(snap.data().role || (isAdmin ? "admin" : "alumni"));
            setUserName(snap.data().name || u.email.split("@")[0]);
          }
        } catch {
          setRole(isAdmin ? "admin" : "alumni");
          setUserName(u.email.split("@")[0]);
        }
      } else { setUser(null); setRole(null); setUserName(""); }
      setAuthLoading(false);
    });
    return () => { clearTimeout(timeout); unsub(); };
  }, []);

  if (IS_REGISTER) return <RegisterPage />;
  if (authLoading) return <Loading />;
  if (!user) return <LoginPage />;
  if (role === "admin") return <AdminDashboard user={user} />;
  return <AlumniDashboard user={user} userName={userName} />;
}
