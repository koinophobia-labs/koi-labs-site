import type { Metadata } from "next";
import Link from "next/link";

const privacyEmail = "koinophobia999@gmail.com";

export const metadata: Metadata = {
  title: "Trendi Privacy Policy",
  description:
    "How Trendi processes creator content, account information, recordings, and service data.",
  alternates: { canonical: "/trendi/privacy" },
};

export default function TrendiPrivacyPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/trendi">
        ← Trendi
      </Link>
      <p className="kicker kicker-orange">Trendi</p>
      <h1>Privacy Policy</h1>
      <p className="legal-note">Effective August 13, 2026</p>

      <section>
        <h2>Scope</h2>
        <p>
          Trendi is a creator-coaching app from Koinophobia Labs. This policy
          explains how the Trendi iPhone app, its Coach service, and the Trendi
          public web pages process information.
        </p>
      </section>

      <section>
        <h2>Information Trendi processes</h2>
        <ul>
          <li>
            <strong>Account information.</strong> Trendi uses Sign in with Apple.
            It verifies Apple credentials and associates Coach requests with a
            pseudonymous workspace. Trendi does not request your Apple email
            address. A name provided during sign-in can be used on your device.
          </li>
          <li>
            <strong>Creator content.</strong> When you ask Trendi to generate a
            Coach Pack, the selected thought or draft and relevant profile context
            you chose to provide are sent to the Coach service. That context can
            include goals, audience, content preferences, tone guidance, and a
            typed voice sample.
          </li>
          <li>
            <strong>Service records.</strong> Trendi processes request digests,
            delivery and acknowledgement status, allowance and rate-limit state,
            timestamps, and similar records needed to deliver Coach Packs reliably
            and protect the service. These records are designed not to contain raw
            creator text.
          </li>
          <li>
            <strong>Support messages.</strong> If you contact support, Koinophobia
            Labs processes the email address and information you include so it can
            respond to your support request or Trendi inquiry.
          </li>
          <li>
            <strong>Technical data.</strong> Hosting and network providers can
            process information such as IP address, request time, device or browser
            type, and diagnostics. The public Trendi web pages also use Vercel
            Analytics to understand page visits and performance.
          </li>
        </ul>
        <p>
          This version of Trendi does not offer an in-app purchase or subscription
          and does not receive payment-card information.
        </p>
      </section>

      <section>
        <h2>Speech, camera, and recordings</h2>
        <p>
          Spoken-thought capture uses Apple&apos;s Speech framework. Depending on
          device, language, and system availability, Apple may process speech audio
          on device or send it to Apple for recognition. Trendi sends the resulting
          text—not the speech audio—to the Coach service when you request a Coach
          Pack.
        </p>
        <p>
          Video and audio recorded in Record Mode stay on your device unless you
          choose to save them to Photos or share them through iOS. The Coach service
          does not upload those recordings.
        </p>
      </section>

      <section>
        <h2>How Trendi uses information</h2>
        <ul>
          <li>authenticate you and keep workspaces separated;</li>
          <li>generate, deliver, replay, and recover the Coach Pack you request;</li>
          <li>personalize coaching from context you choose to provide;</li>
          <li>operate free allowances, retries, and delivery controls;</li>
          <li>secure, maintain, and troubleshoot the service; and</li>
          <li>respond to support, privacy, and deletion requests.</li>
        </ul>
      </section>

      <section>
        <h2>Service providers</h2>
        <ul>
          <li>
            <strong>Apple</strong> provides Sign in with Apple, speech recognition,
            Photos export, and system sharing.
          </li>
          <li>
            <strong>Vercel</strong> hosts the Coach service and public pages;
            Vercel Blob stores private generated Coach results.
          </li>
          <li>
            <strong>Upstash</strong> provides the control store used for delivery,
            allowance, rate-limit, and related service state.
          </li>
          <li>
            <strong>Anthropic</strong> processes the text sent for a Coach Pack and
            generates the response. Anthropic says standard commercial API inputs
            and outputs are automatically deleted within 30 days, except where a
            different service or retention arrangement applies, law requires longer
            retention, or content is retained for safety or usage-policy enforcement.
            Anthropic says flagged inputs and outputs may be retained for up to two
            years and related trust-and-safety classification scores for up to seven
            years. See Anthropic&apos;s{" "}
            <a href="https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data">
              commercial data-retention notice
            </a>
            .
          </li>
          <li>
            <strong>Google</strong> provides Gmail, which processes support and
            inquiry messages sent to the contact address on these pages.
          </li>
        </ul>
      </section>

      <section>
        <h2>Retention</h2>
        <ul>
          <li>
            Creator profiles, ideas, drafts, plans, progress, preferences, and
            recordings stored by the app remain on your device until you delete
            them, delete the Trendi account data on that device, or remove the app.
            Copies in device backups are controlled by you and Apple.
          </li>
          <li>
            Trendi does not durably store the raw request text as a separate server
            record. A generated Coach result can reflect that text. An unacknowledged
            result is scheduled for deletion 24 hours after delivery; after first
            acknowledgement, it is scheduled for deletion at the end of a seven-day
            recovery window. Recurring cleanup removes due results. A failed provider
            deletion remains inaccessible and is retried by later cleanup runs.
          </li>
          <li>
            Content-free delivery, allowance, idempotency, and similar control
            records can remain for up to 90 days. Shorter-lived operational records
            expire sooner.
          </li>
          <li>
            Limited hosting and security logs are retained according to the
            applicable provider settings and legal requirements.
          </li>
          <li>
            Support and inquiry messages are kept as long as reasonably needed to
            respond, maintain the request record, and meet legal or security
            obligations. You may ask Koinophobia Labs to delete a message unless it
            must be retained for one of those obligations.
          </li>
        </ul>
      </section>

      <section>
        <h2>Delete your account and data</h2>
        <p>
          In Trendi, open <strong>Profile</strong>, choose{" "}
          <strong>Account &amp; Workspace</strong>, tap <strong>Delete Account</strong>,
          then confirm with Apple. Trendi permanently deletes the account&apos;s
          account-scoped Coach results and ordinary service records, deletes its
          local workspace from the device, clears the session, and signs out. This
          deletion overrides Trendi&apos;s normal Coach-result and control-record
          retention periods.
        </p>
        <p>
          Trendi also attempts to revoke its Sign in with Apple authorization.
          Apple credential availability or a revocation error does not prevent
          Trendi from deleting your data. If Trendi still appears in your Sign in
          with Apple settings, open iPhone Settings, tap your name, tap Sign in with
          Apple, select Trendi or Koinophobia Labs, then tap Delete and confirm Stop
          Using.
        </p>
        <p>
          After deletion, Trendi may retain content-free deletion and revoked-session
          safeguards for up to 24 hours solely to prevent existing sessions from
          restoring the deleted account. These safeguards then expire. A fresh Sign
          in with Apple can intentionally create a new Trendi service account.
        </p>
        <p>
          Deleting a Trendi account cannot delete copies you previously saved to
          Photos or shared with another app or service. Data already processed by a
          service provider can remain for the provider&apos;s stated retention period
          or as required for safety or law.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can edit or remove local creator content in Trendi, change camera,
          microphone, speech, and Photos permissions in iOS Settings, reset your AI
          processing consent from <strong>Profile</strong> under{" "}
          <strong>Privacy &amp; Data</strong>, and delete your Trendi account from the
          app. Resetting AI processing consent does not delete your content; Trendi
          asks for consent again before sending another request to an external AI
          provider. For an access, correction, privacy, or deletion question, email{" "}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
        </p>
      </section>

      <section>
        <h2>Sale, advertising, and tracking</h2>
        <p>
          Koinophobia Labs does not sell Trendi personal data. Trendi does not use
          app data for third-party advertising or track you across apps and websites
          owned by other companies.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Trendi uses HTTPS, Apple authentication, device Keychain storage for
          session credentials, private server storage, and account-separated access
          controls. No service can guarantee absolute security. Do not put passwords,
          payment-card details, or other secrets in a Coach request.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Trendi is a general creator tool and is not directed to children. If you
          believe a child provided personal information to Trendi, contact us so we
          can investigate and delete it where required.
        </p>
      </section>

      <section>
        <h2>International processing</h2>
        <p>
          Trendi&apos;s service providers may process information in countries other
          than the one where you live. Their privacy and security protections apply
          to that processing, together with applicable law.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          Koinophobia Labs may update this policy as Trendi or its providers change.
          The effective date at the top identifies the current version.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Privacy questions and requests: {" "}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
        </p>
        <p>Trendi · A Koinophobia Labs product</p>
      </section>
    </main>
  );
}
