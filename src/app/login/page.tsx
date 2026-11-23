export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="wrap" style={{ maxWidth: 420, marginTop: 80 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Jira My Time Pro</h2>
        <p className="muted">Sign in with your Atlassian account. You will only see the projects you already have access to in Jira.</p>
        {searchParams.error && <p className="err">{searchParams.error}</p>}
        <a href="/api/auth/login">
          <button className="primary" style={{ width: "100%" }}>
            Sign in with Atlassian
          </button>
        </a>
        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
          <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/support">Support</a>
        </p>
      </div>
    </main>
  );
}
