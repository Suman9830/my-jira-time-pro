import { LegalPage, BASE_URL, SUPPORT_EMAIL, VENDOR } from "../legal";

export const metadata = { title: "Privacy Policy – Jira My Time Pro" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Jira My Time Pro (&quot;the App&quot;, available at {BASE_URL}) is provided by {VENDOR}. This policy explains what
        data the App handles when you sign in with your Atlassian account and use it with Jira Cloud.
      </p>

      <h2>1. Data we access</h2>
      <p>With your consent, via Atlassian OAuth 2.0, the App accesses on your behalf:</p>
      <ul>
        <li>Your Atlassian profile: account ID, display name and avatar.</li>
        <li>Your Jira Cloud site name/URL and cloud ID.</li>
        <li>Jira data you can already see: projects, issues, comments and worklogs.</li>
      </ul>
      <p>
        Requested scopes: <code>read:jira-user</code>, <code>read:jira-work</code>, <code>write:jira-work</code>,{" "}
        <code>offline_access</code>. Write access is used only to create or update issues and worklogs when you ask the
        App to.
      </p>

      <h2>2. Data we store</h2>
      <ul>
        <li>
          A session record containing your account ID, name, avatar, Jira site details and your OAuth access and refresh
          tokens. Tokens are <strong>encrypted</strong> before being stored.
        </li>
        <li>A session cookie in your browser that identifies your session.</li>
      </ul>
      <p>
        Jira issues, comments and worklogs are fetched from Jira when needed and are not kept as a permanent copy by the
        App. Jira remains the system of record.
      </p>

      <h2>3. How we use data</h2>
      <p>
        Solely to provide the App&apos;s features: showing your issues and timesheets, and creating or updating Jira
        content you request. We do not sell your data, use it for advertising, or share it with third parties, except the
        infrastructure providers needed to run the App (hosting and database).
      </p>

      <h2>4. Retention and deletion</h2>
      <p>
        Session data is kept until you sign out or the session expires. You can revoke the App&apos;s access at any time
        at <a href="https://id.atlassian.com/manage-profile/apps">id.atlassian.com/manage-profile/apps</a>. To request
        deletion of any data we hold about you, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>; we will
        act on it within 30 days.
      </p>

      <h2>5. Security</h2>
      <p>
        Traffic uses HTTPS, tokens are encrypted at rest, and the App only requests the permissions it needs. No system
        is perfectly secure, and we cannot guarantee absolute security.
      </p>

      <h2>6. Cookies</h2>
      <p>The App uses only a strictly necessary session cookie. No advertising or analytics cookies are used.</p>

      <h2>7. Children</h2>
      <p>The App is intended for professional use and is not directed at children under 16.</p>

      <h2>8. Changes</h2>
      <p>We may update this policy; the &quot;Last updated&quot; date above will change when we do.</p>

      <h2>9. Contact</h2>
      <p>
        Questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
