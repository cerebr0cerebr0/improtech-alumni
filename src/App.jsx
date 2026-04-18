import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// ─── Détection du mode (admin vs inscription alumni) ───────────────────────
const IS_REGISTER = new URLSearchParams(window.location.search).has('register');
const REGISTER_LINK = typeof window !== 'undefined'
  ? `${window.location.origin}${window.location.pathname}?register`
  : '';

// ─── Constantes de marque ──────────────────────────────────────────────────
const B = {
  purple: "#2D1654", purpleMid: "#3D2070", purpleLight: "#5A3090",
  gold: "#F5A623", goldLight: "#FFD27D", teal: "#00BCD4", tealDark: "#008FA3",
  white: "#FFFFFF", offWhite: "#F8F5FF", gray: "#8B7FAA", darkGray: "#4A4060",
  green: "#27AE60", red: "#E74C3C",
};

const CERTS = ["CCIE Enterprise", "CCIE Security", "CCNP Enterprise", "CCNP Security", "CCNA", "CompTIA Security+", "CompTIA CySA+", "CompTIA A+", "Fortinet NSE", "Azure AZ-900", "PMP", "ITIL"];
const SECTORS = ["Tech", "Banque", "Télécoms", "Gouvernement", "Santé", "Mines", "Éducation", "Autre"];
const COUNTRIES = ["Ghana", "Côte d'Ivoire", "Mali", "Bénin", "Togo", "Sénégal", "Cameroun", "Nigeria", "Burkina Faso", "Congo", "France", "Autre"];
const CARD_COLORS = [B.teal, B.gold, B.purpleLight, B.green];
const TABS = [
  { id: "dashboard", label: "Tableau de bord", icon: "◉" },
  { id: "directory", label: "Annuaire", icon: "☰" },
  { id: "stories", label: "Success Stories", icon: "★" },
];

// ─── Styles réutilisables ──────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  background: `${B.purple}88`, border: `1px solid ${B.purpleLight}55`,
  color: B.white, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
const labelStyle = { fontSize: 12, color: B.gray, fontWeight: 600, marginBottom: 4, display: "block" };

// ─── Composants partagés ───────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 2000,
      background: toast.type === "success" ? B.green : toast.type === "info" ? B.teal : B.red,
      color: "#fff", padding: "12px 20px", borderRadius: 12,
      fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px #0006",
    }}>{toast.msg}</div>
  );
}

function Logo() {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: `linear-gradient(135deg, ${B.gold}, ${B.teal})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, fontWeight: 900, color: B.purple, flexShrink: 0,
      fontFamily: "'Sora', sans-serif",
    }}>I</div>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} type={type} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select style={inputStyle} value={value} onChange={onChange}>
        <option value="">{placeholder || `-- ${label} --`}</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── PAGE D'INSCRIPTION ALUMNI (lien public) ───────────────────────────────
function RegisterPage() {
  const flagMap = { Ghana: "🇬🇭", "Côte d'Ivoire": "🇨🇮", Mali: "🇲🇱", Bénin: "🇧🇯", Togo: "🇹🇬", Sénégal: "🇸🇳", Cameroun: "🇨🇲", Nigeria: "🇳🇬", "Burkina Faso": "🇧🇫", Congo: "🇨🇬", France: "🇫🇷", Autre: "🌍" };
  const [form, setForm] = useState({ name: "", country: "", flag: "", cert: "", year: new Date().getFullYear(), employer: "", role: "", sector: "", story: "", linkedin: "", email: "" });
  const [status, setStatus] = useState("idle");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v, ...(k === "country" ? { flag: flagMap[v] || "🌍" } : {}) }));
  const valid = form.name && form.country && form.cert && form.employer && form.role && form.email;

  const handleSubmit = async () => {
    if (!valid) return;
    setStatus("loading");
    try {
      await addDoc(collection(db, "alumni"), {
        ...form,
        year: Number(form.year),
        createdAt: serverTimestamp(),
      });
      setStatus("success");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={{ minHeight: "100vh", background: B.purple, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: B.white, marginBottom: 12 }}>Merci {form.name.split(" ")[0]} !</div>
          <div style={{ fontSize: 15, color: B.gray, lineHeight: 1.7, marginBottom: 24 }}>
            Ton profil a bien été ajouté au réseau alumni IMPROTECH. Tu fais maintenant partie de notre communauté de talents !
          </div>
          <div style={{ background: `${B.gold}22`, border: `1px solid ${B.gold}44`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, color: B.gold, fontWeight: 700 }}>IMPROTECH Training Center</div>
            <div style={{ fontSize: 12, color: B.gray, marginTop: 4 }}>Créateurs de talents · Accra, Ghana</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: B.purple, fontFamily: "'Inter', sans-serif", color: B.white }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap'); * { box-sizing: border-box; } select option { background: #3D2070; } input::placeholder, textarea::placeholder { color: #8B7FAA; }`}</style>

      {/* Header */}
      <div style={{ background: B.purpleMid, borderBottom: `1px solid ${B.purpleLight}44`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <Logo />
        <div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16 }}>IMPROTECH Alumni</div>
          <div style={{ fontSize: 11, color: B.gray }}>Rejoins le réseau des diplômés</div>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <div style={{ background: `${B.gold}11`, border: `1px solid ${B.gold}33`, borderRadius: 14, padding: 20, marginBottom: 28 }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: B.white, marginBottom: 6 }}>
            Bienvenue dans la famille IMPROTECH ! 🎓
          </div>
          <div style={{ fontSize: 14, color: B.gray, lineHeight: 1.6 }}>
            Remplis ce formulaire pour rejoindre notre annuaire des alumni. Tes informations seront visibles par la communauté.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <FieldInput label="Nom complet *" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex: Jean Dupont" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <FieldInput label="Email *" value={form.email} onChange={e => set("email", e.target.value)} placeholder="ton@email.com" type="email" />
          </div>
          <FieldSelect label="Pays *" value={form.country} onChange={e => set("country", e.target.value)} options={COUNTRIES} placeholder="-- Sélectionner --" />
          <FieldSelect label="Certification obtenue *" value={form.cert} onChange={e => set("cert", e.target.value)} options={CERTS} placeholder="-- Sélectionner --" />
          <div>
            <label style={labelStyle}>Année de formation</label>
            <input style={inputStyle} type="number" value={form.year} min={2015} max={2030} onChange={e => set("year", e.target.value)} />
          </div>
          <FieldSelect label="Secteur d'activité" value={form.sector} onChange={e => set("sector", e.target.value)} options={SECTORS} placeholder="-- Sélectionner --" />
          <div style={{ gridColumn: "1/-1" }}>
            <FieldInput label="Poste actuel *" value={form.role} onChange={e => set("role", e.target.value)} placeholder="Ex: Network Security Engineer" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <FieldInput label="Employeur *" value={form.employer} onChange={e => set("employer", e.target.value)} placeholder="Ex: Ecobank Ghana" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <FieldInput label="LinkedIn" value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/ton-profil" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Ton parcours / Success Story (optionnel)</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 100 }} value={form.story} onChange={e => set("story", e.target.value)} placeholder="Parle-nous de ton parcours depuis ta formation à Improtech..." />
          </div>
        </div>

        <button
          disabled={!valid || status === "loading"}
          onClick={handleSubmit}
          style={{
            width: "100%", marginTop: 20, padding: "14px 24px", borderRadius: 12,
            background: valid ? `linear-gradient(135deg, ${B.gold}, ${B.goldLight})` : B.darkGray,
            color: valid ? B.purple : B.gray, fontWeight: 800, fontSize: 16,
            border: "none", cursor: valid ? "pointer" : "default",
            fontFamily: "'Sora', sans-serif",
          }}>
          {status === "loading" ? "Envoi en cours..." : "✓ Rejoindre le réseau alumni"}
        </button>

        {status === "error" && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: `${B.red}22`, border: `1px solid ${B.red}44`, borderRadius: 10, fontSize: 13, color: B.red }}>
            Une erreur est survenue. Vérifie ta connexion et réessaie.
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: B.gray }}>
          IMPROTECH Training Center · Accra, Ghana · improtech.edu.gh
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ADMIN ──────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`, border: `1px solid ${color}44`, borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "'Sora', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 13, color: B.gray, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: B.gray, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function AlumniCard({ a, onClick }) {
  const initials = a.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const bg = CARD_COLORS[(a.name.charCodeAt(0) || 0) % CARD_COLORS.length];
  return (
    <div onClick={() => onClick(a)} style={{
      background: B.purpleMid, borderRadius: 16, padding: 20, cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s", border: `1px solid ${B.purpleLight}55`,
      display: "flex", flexDirection: "column", gap: 12,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${B.purple}88`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${bg}, ${bg}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: B.white, fontSize: 15, marginBottom: 2, fontFamily: "'Sora', sans-serif" }}>{a.name}</div>
          <div style={{ fontSize: 12, color: B.gray }}>{a.flag} {a.country}</div>
        </div>
        {a.isNew && <span style={{ background: `${B.green}22`, color: B.green, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>NOUVEAU</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ background: `${bg}22`, border: `1px solid ${bg}44`, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: bg, fontWeight: 700, display: "inline-block", width: "fit-content" }}>{a.cert}</div>
        <div style={{ fontSize: 13, color: B.offWhite, fontWeight: 600 }}>{a.role}</div>
        <div style={{ fontSize: 12, color: B.gray }}>{a.employer}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: B.gray }}>Promo {a.year}</div>
        {a.sector && <div style={{ background: `${B.green}22`, color: B.green, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{a.sector}</div>}
      </div>
    </div>
  );
}

function Modal({ a, onClose, onDelete }) {
  const initials = a.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const bg = CARD_COLORS[(a.name.charCodeAt(0) || 0) % CARD_COLORS.length];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: B.purpleMid, borderRadius: 24, padding: 32, maxWidth: 480, width: "100%", border: `1px solid ${B.purpleLight}55`, boxShadow: `0 24px 64px ${B.purple}cc` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: `linear-gradient(135deg, ${bg}, ${bg}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>{initials}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: B.white, fontFamily: "'Sora', sans-serif" }}>{a.name}</div>
            <div style={{ fontSize: 14, color: B.gray, marginTop: 2 }}>{a.flag} {a.country} · Promo {a.year}</div>
            <div style={{ marginTop: 6 }}><span style={{ background: `${bg}22`, border: `1px solid ${bg}44`, borderRadius: 8, padding: "3px 10px", fontSize: 12, color: bg, fontWeight: 700 }}>{a.cert}</span></div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {[{ label: "Poste", value: a.role }, { label: "Employeur", value: a.employer }, { label: "Email", value: a.email }, { label: "Secteur", value: a.sector }].filter(x => x.value).map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 80, fontSize: 12, color: B.gray, fontWeight: 600, paddingTop: 1, flexShrink: 0 }}>{label}</div>
              <div style={{ flex: 1, fontSize: 14, color: B.white }}>{value}</div>
            </div>
          ))}
        </div>
        {a.story && (
          <div style={{ background: `${B.gold}11`, border: `1px solid ${B.gold}33`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: B.gold, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Success Story</div>
            <div style={{ fontSize: 13, color: B.offWhite, lineHeight: 1.6 }}>{a.story}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          {a.linkedin && <a href={a.linkedin} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", padding: "10px 16px", background: B.teal, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>LinkedIn</a>}
          {a.email && <a href={`mailto:${a.email}`} style={{ flex: 1, textAlign: "center", padding: "10px 16px", background: B.purpleLight, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Email</a>}
          <button onClick={() => { if (window.confirm(`Supprimer ${a.name} ?`)) { onDelete(a.firestoreId); onClose(); } }} style={{ padding: "10px 14px", borderRadius: 10, background: `${B.red}22`, color: B.red, border: `1px solid ${B.red}44`, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>🗑</button>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 16px", background: `${B.white}11`, color: B.gray, border: `1px solid ${B.purpleLight}55`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function AdminApp() {
  const [tab, setTab] = useState("dashboard");
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCert, setFilterCert] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSector, setFilterSector] = useState("");
  const [toast, setToast] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Écoute Firestore en temps réel
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "alumni"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), firestoreId: d.id }));
      // Marquer les nouveaux (ajoutés dans les dernières 24h)
      const now = Date.now();
      const withNew = data.map(a => ({
        ...a,
        isNew: a.createdAt?.toMillis ? (now - a.createdAt.toMillis()) < 86400000 : false,
      }));
      setAlumni(withNew.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (firestoreId) => {
    await deleteDoc(doc(db, "alumni", firestoreId));
    showToast("Alumni supprimé.", "error");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(REGISTER_LINK);
    setLinkCopied(true);
    showToast("Lien copié ! Envoie-le à l'alumni.", "info");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const filtered = alumni.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.name?.toLowerCase().includes(q) || a.role?.toLowerCase().includes(q) || a.employer?.toLowerCase().includes(q) || a.country?.toLowerCase().includes(q);
    return matchQ && (!filterCert || a.cert === filterCert) && (!filterCountry || a.country === filterCountry) && (!filterSector || a.sector === filterSector);
  });

  const stats = {
    total: alumni.length,
    countries: [...new Set(alumni.map(a => a.country))].length,
    sectors: [...new Set(alumni.map(a => a.sector))].length,
    nouveaux: alumni.filter(a => a.isNew).length,
  };

  const byCert = CERTS.map(c => ({ c, n: alumni.filter(a => a.cert === c).length })).filter(x => x.n > 0);
  const bySector = SECTORS.map(s => ({ s, n: alumni.filter(a => a.sector === s).length })).filter(x => x.n > 0);

  return (
    <div style={{ minHeight: "100vh", background: B.purple, fontFamily: "'Inter', 'Segoe UI', sans-serif", color: B.white }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } select option { background: #3D2070; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #5A3090; border-radius: 3px; } input::placeholder, textarea::placeholder { color: #8B7FAA; }`}</style>

      <Toast toast={toast} />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${B.purpleMid}, ${B.purple})`, borderBottom: `1px solid ${B.purpleLight}44`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
        <Logo />
        <div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16 }}>IMPROTECH Alumni</div>
          <div style={{ fontSize: 11, color: B.gray, marginTop: 2 }}>Tableau de bord · Temps réel ⚡</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {stats.nouveaux > 0 && (
            <div style={{ background: `${B.green}22`, border: `1px solid ${B.green}44`, borderRadius: 8, padding: "4px 12px", fontSize: 13, color: B.green, fontWeight: 700 }}>
              +{stats.nouveaux} nouveau{stats.nouveaux > 1 ? 'x' : ''}
            </div>
          )}
          <button onClick={copyLink} style={{
            padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
            background: linkCopied ? B.green : `linear-gradient(135deg, ${B.gold}, ${B.goldLight})`,
            color: linkCopied ? B.white : B.purple, transition: "all 0.3s",
          }}>
            {linkCopied ? "✓ Copié !" : "📋 Inviter un alumni"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 24px 0", borderBottom: `1px solid ${B.purpleLight}33`, background: B.purpleMid, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 18px", borderRadius: "10px 10px 0 0", background: tab === t.id ? B.purple : "transparent",
            color: tab === t.id ? B.gold : B.gray, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
            borderBottom: tab === t.id ? `2px solid ${B.gold}` : "2px solid transparent",
            transition: "all 0.2s", whiteSpace: "nowrap", fontFamily: "'Sora', sans-serif",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: B.gray }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <div>Connexion à la base de données...</div>
          </div>
        )}

        {!loading && tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tableau de bord</div>
              <div style={{ color: B.gray, fontSize: 14 }}>Données en temps réel · Firebase</div>
            </div>

            {/* Lien d'invitation */}
            <div style={{ background: B.purpleMid, borderRadius: 16, padding: 20, border: `1px solid ${B.gold}33` }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, color: B.gold, marginBottom: 10 }}>📋 Lien d'inscription alumni</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200, background: `${B.purple}88`, border: `1px solid ${B.purpleLight}55`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: B.gray, fontFamily: "monospace", wordBreak: "break-all" }}>{REGISTER_LINK}</div>
                <button onClick={copyLink} style={{ padding: "8px 18px", borderRadius: 8, background: `linear-gradient(135deg, ${B.gold}, ${B.goldLight})`, color: B.purple, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {linkCopied ? "✓ Copié !" : "Copier"}
                </button>
              </div>
              <div style={{ fontSize: 12, color: B.gray, marginTop: 8 }}>Envoie ce lien par WhatsApp, email ou SMS à l'alumni — il remplit le formulaire et son profil apparaît ici automatiquement.</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
              <StatCard label="Alumni au total" value={stats.total} color={B.gold} sub="Depuis 2015" />
              <StatCard label="Pays représentés" value={stats.countries} color={B.teal} />
              <StatCard label="Secteurs couverts" value={stats.sectors} color={B.purpleLight} />
              <StatCard label="Inscrits aujourd'hui" value={stats.nouveaux} color={B.green} sub="Dernières 24h" />
            </div>

            {byCert.length > 0 && (
              <div style={{ background: B.purpleMid, borderRadius: 18, padding: 24, border: `1px solid ${B.purpleLight}33` }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📜 Certifications</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {byCert.sort((a, b) => b.n - a.n).map(({ c, n }) => (
                    <div key={c} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 160, fontSize: 13, color: B.offWhite, flexShrink: 0 }}>{c}</div>
                      <div style={{ flex: 1, height: 8, background: `${B.purpleLight}44`, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${(n / Math.max(alumni.length, 1)) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${B.gold}, ${B.teal})`, borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 13, color: B.gold, fontWeight: 700, width: 24, textAlign: "right" }}>{n}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bySector.length > 0 && (
              <div style={{ background: B.purpleMid, borderRadius: 18, padding: 24, border: `1px solid ${B.purpleLight}33` }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🏢 Secteurs d'insertion</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {bySector.sort((a, b) => b.n - a.n).map(({ s, n }, i) => {
                    const cols = [B.teal, B.gold, B.purpleLight, B.green, B.gray];
                    const col = cols[i % cols.length];
                    return (
                      <div key={s} style={{ background: `${col}22`, border: `1px solid ${col}44`, borderRadius: 10, padding: "8px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ color: col, fontWeight: 700 }}>{n}</span>
                        <span style={{ fontSize: 13, color: B.offWhite }}>{s}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {alumni.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: B.gray }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
                <div style={{ fontSize: 16, marginBottom: 8 }}>Aucun alumni encore enregistré.</div>
                <div style={{ fontSize: 14 }}>Copie le lien d'invitation et envoie-le aux premiers alumni !</div>
              </div>
            )}
          </div>
        )}

        {!loading && tab === "directory" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800 }}>Annuaire des Alumni</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher…"
                style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 10, background: B.purpleMid, border: `1px solid ${B.purpleLight}55`, color: B.white, fontSize: 14, outline: "none" }} />
              {[
                { label: "Certification", val: filterCert, set: setFilterCert, opts: CERTS },
                { label: "Pays", val: filterCountry, set: setFilterCountry, opts: COUNTRIES },
                { label: "Secteur", val: filterSector, set: setFilterSector, opts: SECTORS },
              ].map(({ label, val, set: s, opts }) => (
                <select key={label} value={val} onChange={e => s(e.target.value)} style={{ flex: "1 1 150px", padding: "10px 14px", borderRadius: 10, background: B.purpleMid, border: `1px solid ${B.purpleLight}55`, color: val ? B.white : B.gray, fontSize: 13, outline: "none" }}>
                  <option value="">{label}: Tous</option>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
              {(search || filterCert || filterCountry || filterSector) && (
                <button onClick={() => { setSearch(""); setFilterCert(""); setFilterCountry(""); setFilterSector(""); }}
                  style={{ padding: "10px 16px", borderRadius: 10, background: `${B.red}22`, color: B.red, border: `1px solid ${B.red}44`, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕ Reset</button>
              )}
            </div>
            <div style={{ fontSize: 13, color: B.gray }}>{filtered.length} alumni trouvé(s)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {filtered.map(a => <AlumniCard key={a.firestoreId} a={a} onClick={setSelected} />)}
              {filtered.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: B.gray }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                  <div>Aucun alumni ne correspond.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && tab === "stories" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Success Stories</div>
              <div style={{ color: B.gray, fontSize: 14 }}>Parcours inspirants de nos diplômés</div>
            </div>
            {alumni.filter(a => a.story).map((a, i) => {
              const cols = [B.gold, B.teal, B.green, B.purpleLight];
              const ac = cols[i % cols.length];
              const initials = a.name.split(" ").map(w => w[0]).join("").slice(0, 2);
              return (
                <div key={a.firestoreId} style={{ background: B.purpleMid, borderRadius: 20, padding: 28, border: `1px solid ${ac}33`, borderLeft: `4px solid ${ac}`, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${ac}, ${ac}77)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 17, color: B.white }}>{a.name}</div>
                      <div style={{ fontSize: 13, color: B.gray, marginTop: 2 }}>{a.flag} {a.country} · {a.cert} · Promo {a.year}</div>
                    </div>
                    {a.sector && <div style={{ background: `${ac}22`, border: `1px solid ${ac}44`, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: ac, fontWeight: 700 }}>{a.sector}</div>}
                  </div>
                  <div style={{ background: `${ac}11`, borderRadius: 12, padding: 16, fontSize: 14, color: B.offWhite, lineHeight: 1.7, fontStyle: "italic" }}>"{a.story}"</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
                    <div><span style={{ color: B.gray }}>Poste : </span><span style={{ color: B.white, fontWeight: 600 }}>{a.role}</span></div>
                    <div><span style={{ color: B.gray }}>Chez : </span><span style={{ color: ac, fontWeight: 600 }}>{a.employer}</span></div>
                  </div>
                </div>
              );
            })}
            {alumni.filter(a => a.story).length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: B.gray }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>★</div>
                <div>Les success stories des alumni apparaîtront ici.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && <Modal a={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />}
    </div>
  );
}

// ─── POINT D'ENTRÉE ────────────────────────────────────────────────────────
export default function App() {
  return IS_REGISTER ? <RegisterPage /> : <AdminApp />;
}
