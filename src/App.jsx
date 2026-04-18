import { useState, useEffect } from "react";

const BRAND = {
  purple: "#2D1654",
  purpleMid: "#3D2070",
  purpleLight: "#5A3090",
  gold: "#F5A623",
  goldLight: "#FFD27D",
  teal: "#00BCD4",
  tealDark: "#008FA3",
  white: "#FFFFFF",
  offWhite: "#F8F5FF",
  gray: "#8B7FAA",
  darkGray: "#4A4060",
  green: "#27AE60",
  red: "#E74C3C",
};

const INITIAL_ALUMNI = [
  {
    id: 1, name: "Aurore Oniboukou", country: "Bénin", flag: "🇧🇯",
    cert: "CCIE Enterprise", year: 2019, employer: "Sopra Steria, France",
    role: "Network Engineer", sector: "Tech",
    story: "L'une des premières femmes du Bénin certifiée CCIE. Après un début de carrière chez un Cisco Gold Partner au Ghana, elle travaille désormais dans un cabinet tech européen de plus de 50 000 employés.",
    linkedin: "", email: ""
  },
  {
    id: 2, name: "Gemila Koureichi", country: "Mali", flag: "🇲🇱",
    cert: "CCNP Security", year: 2021, employer: "Gouvernement du Mali",
    role: "Head of Information Security", sector: "Gouvernement",
    story: "Après sa formation CCNP Security à Improtech, Gemila est rentrée au Mali et dirige aujourd'hui la sécurité informatique d'une institution gouvernementale.",
    linkedin: "", email: ""
  },
  {
    id: 3, name: "Vanessa Manzan", country: "Côte d'Ivoire", flag: "🇨🇮",
    cert: "CCNP Security", year: 2020, employer: "Secteur Minier",
    role: "Network Security Officer", sector: "Mines",
    story: "Après son passage chez un intégrateur systèmes au Ghana, Vanessa est aujourd'hui responsable sécurité réseau dans le secteur minier.",
    linkedin: "", email: ""
  },
];

const CERTS = ["CCIE Enterprise", "CCIE Security", "CCNP Enterprise", "CCNP Security", "CCNA", "CompTIA Security+", "CompTIA CySA+", "CompTIA A+", "Fortinet NSE", "Azure AZ-900", "PMP", "ITIL"];
const SECTORS = ["Tech", "Banque", "Télécoms", "Gouvernement", "Santé", "Mines", "Éducation", "Autre"];
const COUNTRIES = ["Ghana", "Côte d'Ivoire", "Mali", "Bénin", "Togo", "Sénégal", "Cameroun", "France", "Autre"];

const TABS = [
  { id: "dashboard", label: "Tableau de bord", icon: "◉" },
  { id: "directory", label: "Annuaire", icon: "☰" },
  { id: "stories", label: "Success Stories", icon: "★" },
  { id: "add", label: "Ajouter Alumni", icon: "+" },
];

const cardColors = [BRAND.teal, BRAND.gold, BRAND.purpleLight, BRAND.green];

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
      border: `1px solid ${color}44`, borderRadius: 16, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "'Sora', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 13, color: BRAND.gray, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function AlumniCard({ a, onClick }) {
  const initials = a.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const bg = cardColors[a.id % cardColors.length];
  return (
    <div onClick={() => onClick(a)} style={{
      background: BRAND.purpleMid, borderRadius: 16, padding: 20,
      cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
      border: `1px solid ${BRAND.purpleLight}55`,
      display: "flex", flexDirection: "column", gap: 12,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${BRAND.purple}88`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: `linear-gradient(135deg, ${bg}, ${bg}99)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0,
          fontFamily: "'Sora', sans-serif",
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: BRAND.white, fontSize: 15, marginBottom: 2, fontFamily: "'Sora', sans-serif" }}>{a.name}</div>
          <div style={{ fontSize: 12, color: BRAND.gray }}>{a.flag} {a.country}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          background: `${bg}22`, border: `1px solid ${bg}44`, borderRadius: 8,
          padding: "4px 10px", fontSize: 11, color: bg, fontWeight: 700,
          display: "inline-block", width: "fit-content"
        }}>{a.cert}</div>
        <div style={{ fontSize: 13, color: BRAND.offWhite, fontWeight: 600 }}>{a.role}</div>
        <div style={{ fontSize: 12, color: BRAND.gray }}>{a.employer}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <div style={{ fontSize: 11, color: BRAND.gray }}>Promo {a.year}</div>
        <div style={{ background: `${BRAND.green}22`, color: BRAND.green, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{a.sector}</div>
      </div>
    </div>
  );
}

function Modal({ a, onClose, onDelete }) {
  const initials = a.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const bg = cardColors[a.id % cardColors.length];
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#00000088",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: BRAND.purpleMid, borderRadius: 24, padding: 32,
        maxWidth: 480, width: "100%", border: `1px solid ${BRAND.purpleLight}55`,
        boxShadow: `0 24px 64px ${BRAND.purple}cc`,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: `linear-gradient(135deg, ${bg}, ${bg}88)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "#fff", flexShrink: 0,
            fontFamily: "'Sora', sans-serif",
          }}>{initials}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.white, fontFamily: "'Sora', sans-serif" }}>{a.name}</div>
            <div style={{ fontSize: 14, color: BRAND.gray, marginTop: 2 }}>{a.flag} {a.country} · Promo {a.year}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ background: `${bg}22`, border: `1px solid ${bg}44`, borderRadius: 8, padding: "3px 10px", fontSize: 12, color: bg, fontWeight: 700 }}>{a.cert}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {[{ label: "Poste actuel", value: a.role }, { label: "Employeur", value: a.employer }, { label: "Secteur", value: a.sector }].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 120, fontSize: 12, color: BRAND.gray, fontWeight: 600, paddingTop: 1 }}>{label}</div>
              <div style={{ flex: 1, fontSize: 14, color: BRAND.white, fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        {a.story && (
          <div style={{ background: `${BRAND.gold}11`, border: `1px solid ${BRAND.gold}33`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: BRAND.gold, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Success Story</div>
            <div style={{ fontSize: 13, color: BRAND.offWhite, lineHeight: 1.6 }}>{a.story}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          {a.linkedin && <a href={a.linkedin} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", padding: "10px 16px", background: BRAND.teal, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>LinkedIn</a>}
          {a.email && <a href={`mailto:${a.email}`} style={{ flex: 1, textAlign: "center", padding: "10px 16px", background: BRAND.purpleLight, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Email</a>}
          <button onClick={() => { if (window.confirm(`Supprimer ${a.name} ?`)) { onDelete(a.id); onClose(); } }}
            style={{ padding: "10px 16px", borderRadius: 10, background: `${BRAND.red}22`, color: BRAND.red, border: `1px solid ${BRAND.red}44`, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>🗑</button>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 16px", background: `${BRAND.white}11`, color: BRAND.gray, border: `1px solid ${BRAND.purpleLight}55`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function AddForm({ onAdd, onCancel }) {
  const empty = { name: "", country: "", flag: "", cert: "", year: new Date().getFullYear(), employer: "", role: "", sector: "", story: "", linkedin: "", email: "" };
  const [form, setForm] = useState(empty);
  const flagMap = { Ghana: "🇬🇭", "Côte d'Ivoire": "🇨🇮", Mali: "🇲🇱", Bénin: "🇧🇯", Togo: "🇹🇬", Sénégal: "🇸🇳", Cameroun: "🇨🇲", France: "🇫🇷", Autre: "🌍" };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v, ...(k === "country" ? { flag: flagMap[v] || "🌍" } : {}) }));
  const valid = form.name && form.country && form.cert && form.employer && form.role;

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    background: `${BRAND.purple}88`, border: `1px solid ${BRAND.purpleLight}55`,
    color: BRAND.white, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };
  const labelStyle = { fontSize: 12, color: BRAND.gray, fontWeight: 600, marginBottom: 4, display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: BRAND.white, marginBottom: 4 }}>Ajouter un Alumni</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Nom complet *</label>
          <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex: Jean Dupont" />
        </div>
        <div>
          <label style={labelStyle}>Pays *</label>
          <select style={inputStyle} value={form.country} onChange={e => set("country", e.target.value)}>
            <option value="">-- Sélectionner --</option>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Certification *</label>
          <select style={inputStyle} value={form.cert} onChange={e => set("cert", e.target.value)}>
            <option value="">-- Sélectionner --</option>
            {CERTS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Année de formation</label>
          <input style={inputStyle} type="number" value={form.year} min={2015} max={2030} onChange={e => set("year", Number(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle}>Secteur</label>
          <select style={inputStyle} value={form.sector} onChange={e => set("sector", e.target.value)}>
            <option value="">-- Sélectionner --</option>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Poste actuel *</label>
          <input style={inputStyle} value={form.role} onChange={e => set("role", e.target.value)} placeholder="Ex: Network Security Engineer" />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Employeur *</label>
          <input style={inputStyle} value={form.employer} onChange={e => set("employer", e.target.value)} placeholder="Ex: Ecobank Ghana" />
        </div>
        <div>
          <label style={labelStyle}>LinkedIn</label>
          <input style={inputStyle} value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@exemple.com" />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>Success Story (optionnel)</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.story} onChange={e => set("story", e.target.value)} placeholder="Décrivez le parcours inspirant de cet alumni..." />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <button disabled={!valid} onClick={() => onAdd({ ...form, id: Date.now() })} style={{
          flex: 1, padding: "12px 24px", borderRadius: 12,
          background: valid ? `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldLight})` : BRAND.darkGray,
          color: valid ? BRAND.purple : BRAND.gray, fontWeight: 800, fontSize: 14,
          border: "none", cursor: valid ? "pointer" : "default", fontFamily: "'Sora', sans-serif",
        }}>✓ Ajouter l'alumni</button>
        <button onClick={onCancel} style={{
          padding: "12px 20px", borderRadius: 12, background: "transparent",
          color: BRAND.gray, border: `1px solid ${BRAND.purpleLight}55`,
          fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>Annuler</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [alumni, setAlumni] = useState(() => {
    try {
      const saved = localStorage.getItem("improtech_alumni");
      return saved ? JSON.parse(saved) : INITIAL_ALUMNI;
    } catch { return INITIAL_ALUMNI; }
  });
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCert, setFilterCert] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSector, setFilterSector] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("improtech_alumni", JSON.stringify(alumni)); } catch {}
  }, [alumni]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = (a) => {
    setAlumni(prev => [a, ...prev]);
    setTab("directory");
    showToast(`${a.name} a bien été ajouté(e) !`);
  };

  const handleDelete = (id) => {
    setAlumni(prev => prev.filter(a => a.id !== id));
    showToast("Alumni supprimé.", "error");
  };

  const filtered = alumni.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.employer.toLowerCase().includes(q) || a.country.toLowerCase().includes(q);
    return matchQ && (!filterCert || a.cert === filterCert) && (!filterCountry || a.country === filterCountry) && (!filterSector || a.sector === filterSector);
  });

  const stats = {
    total: alumni.length,
    countries: [...new Set(alumni.map(a => a.country))].length,
    sectors: [...new Set(alumni.map(a => a.sector))].length,
    stories: alumni.filter(a => a.story).length,
  };

  const byCert = CERTS.map(c => ({ c, n: alumni.filter(a => a.cert === c).length })).filter(x => x.n > 0);
  const bySector = SECTORS.map(s => ({ s, n: alumni.filter(a => a.sector === s).length })).filter(x => x.n > 0);

  return (
    <div style={{ minHeight: "100vh", background: BRAND.purple, fontFamily: "'Inter', 'Segoe UI', sans-serif", color: BRAND.white }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        select option { background: #3D2070; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #2D1654; }
        ::-webkit-scrollbar-thumb { background: #5A3090; border-radius: 3px; }
        input::placeholder, textarea::placeholder { color: #8B7FAA; }
      `}</style>

      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 2000,
          background: toast.type === "success" ? BRAND.green : BRAND.red,
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px #0006",
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.purpleMid} 0%, ${BRAND.purple} 100%)`,
        borderBottom: `1px solid ${BRAND.purpleLight}44`,
        padding: "16px 24px", display: "flex", alignItems: "center", gap: 16,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.teal})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 900, color: BRAND.purple, flexShrink: 0,
          fontFamily: "'Sora', sans-serif",
        }}>I</div>
        <div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>IMPROTECH Alumni</div>
          <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>Training Center · Réseau des diplômés</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <div style={{ background: `${BRAND.gold}22`, border: `1px solid ${BRAND.gold}44`, borderRadius: 8, padding: "4px 12px", fontSize: 13, color: BRAND.gold, fontWeight: 700 }}>
            {alumni.length} alumni
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, padding: "12px 24px 0",
        borderBottom: `1px solid ${BRAND.purpleLight}33`,
        background: BRAND.purpleMid, overflowX: "auto",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 18px", borderRadius: "10px 10px 0 0",
            background: tab === t.id ? BRAND.purple : "transparent",
            color: tab === t.id ? BRAND.gold : BRAND.gray,
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
            borderBottom: tab === t.id ? `2px solid ${BRAND.gold}` : "2px solid transparent",
            transition: "all 0.2s", whiteSpace: "nowrap", fontFamily: "'Sora', sans-serif",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>

        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tableau de bord</div>
              <div style={{ color: BRAND.gray, fontSize: 14 }}>Vue d'ensemble du réseau alumni Improtech</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
              <StatCard label="Alumni au total" value={stats.total} color={BRAND.gold} sub="Depuis 2015" />
              <StatCard label="Pays représentés" value={stats.countries} color={BRAND.teal} sub="Afrique & Europe" />
              <StatCard label="Secteurs couverts" value={stats.sectors} color={BRAND.purpleLight} sub="Industries diverses" />
              <StatCard label="Success Stories" value={stats.stories} color={BRAND.green} sub="Parcours inspirants" />
            </div>
            <div style={{ background: BRAND.purpleMid, borderRadius: 18, padding: 24, border: `1px solid ${BRAND.purpleLight}33` }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📜 Certifications les plus obtenues</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {byCert.sort((a, b) => b.n - a.n).map(({ c, n }) => (
                  <div key={c} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 160, fontSize: 13, color: BRAND.offWhite, flexShrink: 0 }}>{c}</div>
                    <div style={{ flex: 1, height: 8, background: `${BRAND.purpleLight}44`, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${(n / alumni.length) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.teal})`, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 13, color: BRAND.gold, fontWeight: 700, width: 24, textAlign: "right" }}>{n}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: BRAND.purpleMid, borderRadius: 18, padding: 24, border: `1px solid ${BRAND.purpleLight}33` }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🏢 Secteurs d'insertion</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {bySector.sort((a, b) => b.n - a.n).map(({ s, n }, i) => {
                  const cols = [BRAND.teal, BRAND.gold, BRAND.purpleLight, BRAND.green, BRAND.gray, BRAND.tealDark];
                  const col = cols[i % cols.length];
                  return (
                    <div key={s} style={{ background: `${col}22`, border: `1px solid ${col}44`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 14, color: col, fontWeight: 700 }}>{n}</span>
                      <span style={{ fontSize: 13, color: BRAND.offWhite }}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🕐 Derniers alumni</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {alumni.slice(0, 3).map(a => <AlumniCard key={a.id} a={a} onClick={setSelected} />)}
              </div>
            </div>
          </div>
        )}

        {tab === "directory" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800 }}>Annuaire des Alumni</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher…"
                style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 10, background: BRAND.purpleMid, border: `1px solid ${BRAND.purpleLight}55`, color: BRAND.white, fontSize: 14, outline: "none" }} />
              {[
                { label: "Certification", val: filterCert, set: setFilterCert, opts: CERTS },
                { label: "Pays", val: filterCountry, set: setFilterCountry, opts: COUNTRIES },
                { label: "Secteur", val: filterSector, set: setFilterSector, opts: SECTORS },
              ].map(({ label, val, set: s, opts }) => (
                <select key={label} value={val} onChange={e => s(e.target.value)} style={{ flex: "1 1 150px", padding: "10px 14px", borderRadius: 10, background: BRAND.purpleMid, border: `1px solid ${BRAND.purpleLight}55`, color: val ? BRAND.white : BRAND.gray, fontSize: 13, outline: "none" }}>
                  <option value="">{label}: Tous</option>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
              {(search || filterCert || filterCountry || filterSector) && (
                <button onClick={() => { setSearch(""); setFilterCert(""); setFilterCountry(""); setFilterSector(""); }}
                  style={{ padding: "10px 16px", borderRadius: 10, background: `${BRAND.red}22`, color: BRAND.red, border: `1px solid ${BRAND.red}44`, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕ Reset</button>
              )}
            </div>
            <div style={{ fontSize: 13, color: BRAND.gray }}>{filtered.length} alumni trouvé(s)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {filtered.map(a => <AlumniCard key={a.id} a={a} onClick={setSelected} />)}
              {filtered.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: BRAND.gray }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                  <div>Aucun alumni ne correspond à ces critères.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "stories" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Success Stories</div>
              <div style={{ color: BRAND.gray, fontSize: 14 }}>Parcours inspirants de nos diplômés</div>
            </div>
            {alumni.filter(a => a.story).map((a, i) => {
              const cols = [BRAND.gold, BRAND.teal, BRAND.green, BRAND.purpleLight];
              const ac = cols[i % cols.length];
              const initials = a.name.split(" ").map(w => w[0]).join("").slice(0, 2);
              return (
                <div key={a.id} style={{ background: BRAND.purpleMid, borderRadius: 20, padding: 28, border: `1px solid ${ac}33`, borderLeft: `4px solid ${ac}`, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${ac}, ${ac}77)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 17, color: BRAND.white }}>{a.name}</div>
                      <div style={{ fontSize: 13, color: BRAND.gray, marginTop: 2 }}>{a.flag} {a.country} · {a.cert} · Promo {a.year}</div>
                    </div>
                    <div style={{ background: `${ac}22`, border: `1px solid ${ac}44`, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: ac, fontWeight: 700 }}>{a.sector}</div>
                  </div>
                  <div style={{ background: `${ac}11`, borderRadius: 12, padding: 16, fontSize: 14, color: BRAND.offWhite, lineHeight: 1.7, fontStyle: "italic" }}>"{a.story}"</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
                    <div><span style={{ color: BRAND.gray }}>Poste : </span><span style={{ color: BRAND.white, fontWeight: 600 }}>{a.role}</span></div>
                    <div><span style={{ color: BRAND.gray }}>Chez : </span><span style={{ color: ac, fontWeight: 600 }}>{a.employer}</span></div>
                  </div>
                </div>
              );
            })}
            {alumni.filter(a => a.story).length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: BRAND.gray }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>★</div>
                <div>Ajoutez des alumni avec une success story pour qu'elles apparaissent ici.</div>
              </div>
            )}
          </div>
        )}

        {tab === "add" && (
          <AddForm onAdd={handleAdd} onCancel={() => setTab("directory")} />
        )}
      </div>

      {selected && <Modal a={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />}
    </div>
  );
}
