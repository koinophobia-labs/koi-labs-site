import type { Metadata } from "next";
import Link from "next/link";

const supportEmail = "koinophobia999@gmail.com";

export const metadata: Metadata = {
  title: "Trendi Support",
  description:
    "Support, troubleshooting, privacy, and account-deletion help for Trendi.",
  alternates: { canonical: "/trendi/support" },
};

export default function TrendiSupportPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/trendi">
        ← Trendi
      </Link>
      <p className="kicker kicker-orange">Trendi</p>
      <h1>Support</h1>
      <p className="legal-note">Help with sign-in, Coach Packs, recording, and data</p>

      <section>
        <h2>Contact</h2>
        <p>
          Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Include your
          iPhone model, iOS version, Trendi version or build if known, the step you
          were taking, and what happened. Include a screenshot only if it contains
          no content you want to keep private.
        </p>
        <p>
          Never send an Apple credential, password, API key, payment-card number, or
          recording you do not want reviewed.
        </p>
      </section>

      <section>
        <h2>Sign in with Apple</h2>
        <ul>
          <li>Trendi does not have a separate username or password.</li>
          <li>Confirm your iPhone has an internet connection, then retry Sign in with Apple.</li>
          <li>If sign-in still fails, send support the exact error message and time it occurred.</li>
        </ul>
      </section>

      <section>
        <h2>Coach Pack generation</h2>
        <ul>
          <li>Coach Packs require an internet connection.</li>
          <li>If generation fails, your local thought or draft should remain available.</li>
          <li>Use Retry after the app shows the final error.</li>
          <li>
            For an unexpected allowance or rate-limit message, include the time and
            time zone in your support email.
          </li>
        </ul>
        <p>
          This version does not offer a subscription or other in-app purchase. Free
          Coach Pack availability resets on the schedule shown in the app.
        </p>
      </section>

      <section>
        <h2>Speech and recording permissions</h2>
        <p>
          Open iPhone Settings, choose Apps, then Trendi to review permissions.
          Speech recognition and microphone access are needed for spoken thoughts.
          Camera and microphone access are needed for Record Mode. Add-only Photos
          access is requested when you choose to save a recording.
        </p>
      </section>

      <section>
        <h2>Delete your Trendi account</h2>
        <p>
          In Trendi, open <strong>Profile</strong>, choose{" "}
          <strong>Account &amp; Workspace</strong>, tap <strong>Delete Account</strong>,
          then confirm with Apple. Trendi deletes the account&apos;s Coach results and
          ordinary service records and deletes the local workspace, clears the
          session, and signs out. If deletion fails before the service confirms it,
          your local data remains available so you can retry safely.
        </p>
        <p>
          Limited content-free deletion and revoked-session safeguards may remain for
          up to 24 hours; see the <Link href="/trendi/privacy">Privacy Policy</Link>.
        </p>
        <p>
          Trendi attempts to revoke its Sign in with Apple authorization. If Trendi
          still appears in Apple&apos;s list, open iPhone Settings, tap your name, tap
          Sign in with Apple, select Trendi or Koinophobia Labs, then tap Delete and
          confirm Stop Using.
        </p>
      </section>

      <section>
        <h2>Privacy</h2>
        <p>
          Read the <Link href="/trendi/privacy">Trendi Privacy Policy</Link> for the
          data Trendi processes, provider details, retention periods, and deletion
          choices.
        </p>
      </section>

      <section>
        <h2>App requirements</h2>
        <ul>
          <li>iPhone running iOS 17 or later.</li>
          <li>Internet access for Sign in with Apple and Coach Packs.</li>
          <li>Camera and microphone access only when you use recording features.</li>
        </ul>
      </section>

      <section>
        <h2>About Trendi</h2>
        <p>
          Trendi helps creators turn a rough typed or spoken thought into one angle,
          three hook options, an editable script, a caption, a shot plan, and a
          record-ready workflow. Trendi does not automatically publish content.
        </p>
      </section>
    </main>
  );
}
