import type { Metadata } from "next";
import Link from "next/link";

const supportEmail = "koinophobia999@gmail.com";

export const metadata: Metadata = {
  title: "ForgetAboutIt Support",
  description:
    "Support for ForgetAboutIt — capture, Watch sync, reminders, exporting, and deleting your journal.",
  alternates: { canonical: "/forget-about-it/support" },
};

export default function ForgetAboutItSupportPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">
        ← Koinophobia Labs
      </Link>
      <p className="kicker kicker-orange">ForgetAboutIt</p>
      <h1>Support</h1>
      <p className="legal-note">Help with capture, Watch sync, reminders, and your data</p>

      <section>
        <h2>Contact</h2>
        <p>
          Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Include
          your iPhone and Watch models, iOS/watchOS versions, the app version if
          known, the step you were taking, and what happened. Include a
          screenshot only if it contains nothing you want to keep private.
        </p>
        <p>
          Because your journal lives only on your devices, support can never see,
          recover, or delete it for you.
        </p>
      </section>

      <section>
        <h2>Capturing</h2>
        <ul>
          <li>
            On iPhone, type into the field on Today, or tap the microphone to
            dictate. Return saves the thought.
          </li>
          <li>
            On Apple Watch, the app opens straight into capture — speak, scribble,
            or type, then tap Done.
          </li>
          <li>
            If on-device speech recognition is unavailable, the app falls back to
            typing and says so; your words are never lost to a failed dictation.
          </li>
        </ul>
      </section>

      <section>
        <h2>Watch sync</h2>
        <ul>
          <li>
            Watch captures save on the Watch first, then transfer to the iPhone
            automatically — including captures made offline, which sync when the
            devices reconnect.
          </li>
          <li>
            &ldquo;N to sync&rdquo; on the Watch is a calm fact, not an error;
            opening the iPhone app usually completes delivery.
          </li>
          <li>Each thought carries a unique ID, so retries never duplicate it.</li>
        </ul>
      </section>

      <section>
        <h2>Evening reminder</h2>
        <p>
          The reminder is opt-in during onboarding and lives at the top of
          Settings. It only fires on days you actually captured something. Change
          notification permission any time in iPhone Settings → Apps →
          ForgetAboutIt.
        </p>
      </section>

      <section>
        <h2>Keeping a copy / moving phones</h2>
        <p>
          Your journal is deliberately excluded from iCloud and computer backups.
          To keep your thoughts across phones, use{" "}
          <strong>Settings → Save a copy of everything</strong> to save an export before
          you switch. A new phone starts with an empty journal.
        </p>
      </section>

      <section>
        <h2>Deleting your data</h2>
        <p>
          Swipe a thought to delete it (with a brief undo), use{" "}
          <strong>Settings → Erase everything</strong> to erase the whole journal, or
          remove the app — nothing exists off your devices.
        </p>
      </section>

      <section>
        <h2>Privacy</h2>
        <p>
          Read the{" "}
          <Link href="/forget-about-it/privacy">ForgetAboutIt Privacy Policy</Link>{" "}
          — the short version is that everything stays on your devices and the
          app has no network code at all.
        </p>
      </section>

      <section>
        <h2>App requirements</h2>
        <ul>
          <li>iPhone running iOS 17 or later.</li>
          <li>Optional Apple Watch app requires watchOS 10 or later.</li>
          <li>No account, no sign-in, and no internet connection required.</li>
        </ul>
      </section>

      <section>
        <h2>About ForgetAboutIt</h2>
        <p>
          ForgetAboutIt captures a thought before it disappears — fastest from
          the wrist — and turns the fragments of your day into a private, written
          record in your own words.
        </p>
      </section>
    </main>
  );
}
