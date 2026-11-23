import { LegalPage, SUPPORT_EMAIL } from "../legal";

export const metadata = { title: "Support – Jira My Time Pro" };

export default function Support() {
  return (
    <LegalPage title="Support">
      <p>
        Need help with Jira My Time Pro? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We aim to reply
        within 2 business days.
      </p>

      <h2>Common questions</h2>
      <h3>I can&apos;t see my projects or issues</h3>
      <p>
        The App shows only what your Jira account can access. Check your permissions in Jira, then sign out and in again.
      </p>
      <h3>The consent screen doesn&apos;t list my Jira site</h3>
      <p>You need access to a Jira Cloud site. Ask your Jira admin to add you.</p>
      <h3>My session expired</h3>
      <p>
        Sign in again from the <a href="/login">login page</a>.
      </p>
      <h3>How do I revoke access or delete my data?</h3>
      <p>
        Revoke at <a href="https://id.atlassian.com/manage-profile/apps">id.atlassian.com/manage-profile/apps</a>, and
        email us to delete stored session data.
      </p>

      <h2>When reporting a problem, please include</h2>
      <ul>
        <li>What you were doing and what you expected</li>
        <li>Any error message or screenshot</li>
        <li>Your browser and device</li>
      </ul>
    </LegalPage>
  );
}
