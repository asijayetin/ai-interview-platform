import { useState } from "react";

const navigation = [
  { id: "dashboard", label: "Overview", icon: "⌂", group: "WORKSPACE" },
  { id: "interview", label: "Start Interview", icon: "◉", group: "PREPARATION" },
  { id: "resume-review", label: "Resume Reviewer", icon: "▤", group: "PREPARATION" },
  { id: "practice", label: "Coding Practice", icon: "</>", group: "PREPARATION" },
  { id: "tutor", label: "AI Tutor", icon: "✦", group: "PREPARATION" },
];

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
          <span className="workspace-brand-mark">A</span>
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
                  <span className="workspace-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                  {(item.id === "practice" || item.id === "tutor") && <span className="workspace-soon-dot" title="Coming soon" />}
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
