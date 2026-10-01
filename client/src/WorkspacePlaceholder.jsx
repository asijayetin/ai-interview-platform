const content = {
  practice: {
    eyebrow: "CODING PRACTICE",
    title: "Practice coding with feedback",
    description: "Solve role-focused coding problems, run your code against test cases, and track your results.",
    icon: "</>",
    status: "Coming soon",
    next: "This workspace will include a code editor, problem sets, test cases, and scoring.",
  },
  tutor: {
    eyebrow: "AI TUTOR",
    title: "Your personal AI tutor",
    description: "Get guided explanations and a learning plan based on the skills you want to improve.",
    icon: "✦",
    status: "Coming soon",
    next: "This workspace will turn your practice and review results into focused lessons.",
  },
};

function WorkspacePlaceholder({ feature }) {
  const page = content[feature] || content.practice;

  return (
    <section className="workspace-placeholder-page">
      <div className="workspace-placeholder-card">
        <span className="workspace-placeholder-icon">{page.icon}</span>
        <p className="small-heading">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p className="workspace-placeholder-description">{page.description}</p>
        <span className="workspace-status-pill">{page.status}</span>
        <p className="workspace-placeholder-next">{page.next}</p>
      </div>
    </section>
  );
}

export default WorkspacePlaceholder;
