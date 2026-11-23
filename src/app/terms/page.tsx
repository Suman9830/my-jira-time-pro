import { LegalPage, BASE_URL, SUPPORT_EMAIL, VENDOR } from "../legal";

export const metadata = { title: "Terms of Service – Jira My Time Pro" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        By signing in to or using Jira My Time Pro (&quot;the App&quot;, {BASE_URL}), provided by {VENDOR}, you agree to
        these terms.
      </p>

      <h2>1. The service</h2>
      <p>
        The App is a companion interface for Jira Cloud that helps you view issues and log and review time. It requires a
        valid Atlassian account and access to a Jira Cloud site.
      </p>

      <h2>2. Your account and responsibilities</h2>
      <ul>
        <li>You are responsible for activity performed through your session.</li>
        <li>You must have the right to access the Jira site and data you use with the App.</li>
        <li>You must not misuse the App, attempt to disrupt it, or access data you are not authorised to see.</li>
        <li>Your use of Jira remains subject to Atlassian&apos;s own terms.</li>
      </ul>

      <h2>3. Your data</h2>
      <p>
        Your Jira data belongs to you or your organisation. The App acts on it only at your direction. See the{" "}
        <a href="/privacy">Privacy Policy</a> for how data is handled.
      </p>

      <h2>4. Availability and changes</h2>
      <p>
        The App is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We may change, suspend or
        discontinue features at any time, and we do not guarantee uninterrupted or error-free operation.
      </p>

      <h2>5. Disclaimer and liability</h2>
      <p>
        To the maximum extent permitted by law, {VENDOR} gives no warranties, express or implied, and is not liable for
        indirect or consequential damages, data loss, or inaccurate time entries arising from use of the App. You should
        verify important worklogs in Jira.
      </p>

      <h2>6. Termination</h2>
      <p>
        You may stop using the App and revoke its access at any time through your Atlassian account settings. We may
        suspend access for misuse.
      </p>

      <h2>7. Changes to these terms</h2>
      <p>Continued use after an update means you accept the revised terms.</p>

      <h2>8. Contact</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
