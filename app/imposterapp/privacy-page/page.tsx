import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imposter - Privacy Policy",
  description: "Privacy Policy for the Imposter party game app.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#7C3AED]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm font-medium text-white/60">
            Imposter &mdash; Party Game
          </p>
          <p className="mt-1 text-xs text-white/40">
            Last updated: 6 March 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-[15px] leading-relaxed text-white/85">
          <Section title="Overview">
            <p>
              Imposter is a pass-the-phone party game. We respect your privacy
              and are committed to being transparent about how the app works and
              what data, if any, is collected.
            </p>
          </Section>

          <Section title="Information We Collect">
            <p>Imposter collects minimal data to provide and improve the game experience:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Game session analytics</strong> &mdash;
                anonymous gameplay data such as player count, category played,
                round duration, and vote outcomes. This data is not linked to
                your identity.
              </li>
              <li>
                <strong className="text-white">Apple Sign In</strong> &mdash; if you
                choose to sign in, we receive the user identifier and name
                provided by Apple. We do not receive or store your Apple ID
                email unless you choose to share it.
              </li>
              <li>
                <strong className="text-white">User-created content</strong> &mdash;
                custom categories you create and submit to the community are
                stored on our servers along with the creator name you provide.
              </li>
              <li>
                <strong className="text-white">Device identifier</strong> &mdash; a
                randomly generated ID stored locally on your device, used solely
                for aggregating anonymous game statistics.
              </li>
            </ul>
          </Section>

          <Section title="Information We Do Not Collect">
            <ul className="list-disc space-y-2 pl-5">
              <li>We do not collect your location.</li>
              <li>We do not access your contacts, microphone, or files.</li>
              <li>We do not serve advertisements or share data with ad networks.</li>
              <li>We do not sell or rent your data to third parties.</li>
            </ul>
          </Section>

          <Section title="Camera &amp; Photo Library">
            <p>
              Imposter requests camera and photo library access only when you
              choose to upload a custom player avatar or category icon. Photos
              are processed on-device for background removal and stored locally.
              They are never uploaded to our servers.
            </p>
          </Section>

          <Section title="Third-Party Services">
            <p>Imposter uses the following third-party services:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">Firebase (Google)</strong> &mdash;
                for authentication, database storage, and analytics. Firebase
                may collect device and usage data as described in the{" "}
                <a
                  href="https://firebase.google.com/support/privacy"
                  className="underline decoration-white/30 underline-offset-2 transition-colors hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Firebase Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong className="text-white">Apple Sign In</strong> &mdash;
                authentication is handled by Apple and subject to{" "}
                <a
                  href="https://www.apple.com/legal/privacy/"
                  className="underline decoration-white/30 underline-offset-2 transition-colors hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apple&apos;s Privacy Policy
                </a>
                .
              </li>
            </ul>
          </Section>

          <Section title="Data Storage &amp; Security">
            <p>
              Player names, avatars, and game preferences are stored locally on
              your device. Community-submitted categories and anonymous game
              statistics are stored securely in Firebase with appropriate access
              controls.
            </p>
          </Section>

          <Section title="Data Retention">
            <p>
              Local data remains on your device until you delete the app.
              Anonymous game analytics are retained indefinitely for product
              improvement. If you sign in with Apple and later wish to delete
              your account data, contact us at the email below.
            </p>
          </Section>

          <Section title="Children&rsquo;s Privacy">
            <p>
              Imposter is a general audience party game. We do not knowingly
              collect personal information from children under 13. If you
              believe we have inadvertently collected such information, please
              contact us and we will promptly delete it.
            </p>
          </Section>

          <Section title="Changes to This Policy">
            <p>
              We may update this privacy policy from time to time. Changes will
              be reflected on this page with an updated date. Continued use of
              the app constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              If you have questions about this privacy policy or your data,
              contact us at{" "}
              <a
                href="mailto:kylesull1011@gmail.com"
                className="underline decoration-white/30 underline-offset-2 transition-colors hover:text-white"
              >
                kylesull1011@gmail.com
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}
