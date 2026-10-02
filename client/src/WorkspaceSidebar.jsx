import { useState } from "react";

const navigation = [
  { id: "dashboard", label: "Overview", icon: "overview", group: "WORKSPACE" },
  { id: "interview", label: "Start Interview", icon: "interview", group: "PREPARATION" },
  { id: "voice-interview", label: "Voice Interview", icon: "voice", group: "PREPARATION" },
  { id: "resume-review", label: "Resume Reviewer", icon: "resume", group: "PREPARATION" },
  { id: "practice", label: "Coding Practice", icon: "code", group: "PREPARATION" },
  { id: "tutor", label: "AI Tutor", icon: "tutor", group: "PREPARATION" },
  { id: "interview-report", label: "Interview Report", icon: "report", group: "PREPARATION" },
];

function WorkspaceIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    overview: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    interview: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4M9 22h6" /></>,
    voice: <><path d="M12 3v18M8 7v10M4 10v4M16 7v10M20 10v4" /></>,
    resume: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v6h5M10 13h6M10 17h6" /></>,
    code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" /></>,
    tutor: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.1L12 19l-1.9-5.9L4 11l6.1-2.2L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>,
    report: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /><path d="M17 6h3v3" /></>,
  };
  return <svg {...common}>{paths[name] || paths.overview}</svg>;
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function WorkspaceSidebar({ currentPage, onNavigate, onProfile, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = readUser();
  const groups = [...new Set(navigation.map((item) => item.group))];

  const navigate = (page) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  return (
    <>
      <div className="workspace-mobile-bar">
        <button className="workspace-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen}>
          {mobileOpen ? "×" : "☰"}
        </button>
        <button className="workspace-mobile-brand" onClick={() => navigate("dashboard")}>AI Interview Arena</button>
        <span className="workspace-mobile-current">{navigation.find((item) => item.id === currentPage)?.label}</span>
      </div>
      {mobileOpen && <button className="workspace-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <aside className={`workspace-sidebar${mobileOpen ? " is-open" : ""}`}>
        <button className="workspace-brand" onClick={() => navigate("dashboard")}>
          <span className="workspace-brand-mark"><WorkspaceIcon name="tutor" /></span>
          <span>AI Interview Arena</span>
        </button>

        <nav className="workspace-navigation" aria-label="Main navigation">
          {groups.map((group) => (
            <div className="workspace-nav-group" key={group}>
              <p className="workspace-nav-label">{group}</p>
              {navigation.filter((item) => item.group === group).map((item) => (
                <button
                  className={`workspace-nav-item${currentPage === item.id ? " is-active" : ""}`}
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  aria-current={currentPage === item.id ? "page" : undefined}
                >
                  <span className="workspace-nav-icon"><WorkspaceIcon name={item.icon} /></span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="workspace-sidebar-bottom">
          <button className="workspace-profile-button" onClick={onProfile}>
            <span className="workspace-user-avatar">{(user.name || "U").slice(0, 1).toUpperCase()}</span>
            <span className="workspace-user-details"><strong>{user.name || "Your profile"}</strong><small>Account settings</small></span>
            <span aria-hidden="true">›</span>
          </button>
          <button className="workspace-logout-button" onClick={onLogout}><span aria-hidden="true">↪</span> Sign out</button>
        </div>
      </aside>
    </>
  );
}

export default WorkspaceSidebar;
