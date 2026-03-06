import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Imposter - Privacy Policy",
  description: "Privacy Policy for the Imposter party game app.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#7C3AED]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#7C3AED]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <span className="text-[13px] font-bold tracking-wide text-white/50">
            IMPOSTER
          </span>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/80 transition-colors active:bg-white/20"
          >
            <Image
              src="/favicon.png"
              alt="KyleOS"
              width={18}
              height={18}
              className="rounded-[4px]"
            />
            KyleOS
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 pb-16 pt-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[28px] font-black leading-tight tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-[13px] font-medium text-white/50">
            Last updated: 6 March 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-[14px] leading-[1.7] text-white/80">
          <Section title="Overview">
            <p>
              Imposter is a pass-the-phone party game. We respect your privacy
              and are committed to being transparent about how the app works and
              what data, if any, is collected.
            </p>
          </Section>

          <Section title="Information We Collect">
            <p>
              Imposter collects minimal data to provide and improve the game
              experience:
            </p>
            <ul className="mt-2.5 space-y-2 pl-4">
              <Li>
                <strong className="text-white">Game session analytics</strong>{" "}
                &mdash; anonymous gameplay data such as player count, category
                played, round duration, and vote outcomes. This data is not
                linked to your identity.
              </Li>
              <Li>
                <strong className="text-white">Apple Sign In</strong> &mdash; if
                you choose to sign in, we receive the user identifier and name
                provided by Apple. We do not receive or store your Apple ID
                email unless you choose to share it.
              </Li>
              <Li>
                <strong className="text-white">User-created content</strong>{" "}
                &mdash; custom categories you create and submit to the community
                are stored on our servers along with the creator name you
                provide.
              </Li>
              <Li>
                <strong className="text-white">Device identifier</strong>{" "}
                &mdash; a randomly generated ID stored locally on your device,
                used solely for aggregating anonymous game statistics.
              </Li>
            </ul>
          </Section>

          <Section title="Information We Do Not Collect">
            <ul className="space-y-2 pl-4">
              <Li>We do not collect your location.</Li>
              <Li>We do not access your contacts, microphone, or files.</Li>
              <Li>
                We do not serve advertisements or share data with ad networks.
              </Li>
              <Li>We do not sell or rent your data to third parties.</Li>
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
            <ul className="mt-2.5 space-y-2 pl-4">
              <Li>
                <strong className="text-white">Firebase (Google)</strong>{" "}
                &mdash; for authentication, database storage, and analytics.
                Firebase may collect device and usage data as described in the{" "}
                <InlineLink href="https://firebase.google.com/support/privacy">
                  Firebase Privacy Policy
                </InlineLink>
                .
              </Li>
              <Li>
                <strong className="text-white">Apple Sign In</strong> &mdash;
                authentication is handled by Apple and subject to{" "}
                <InlineLink href="https://www.apple.com/legal/privacy/">
                  Apple&apos;s Privacy Policy
                </InlineLink>
                .
              </Li>
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
              <InlineLink href="mailto:kyle.osullivan@arcadeus.ai">
                kyle.osullivan@arcadeus.ai
              </InlineLink>
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
      <h2 className="mb-2 text-[15px] font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-3 before:absolute before:left-0 before:top-[0.6em] before:h-[5px] before:w-[5px] before:rounded-full before:bg-white/30">
      {children}
    </li>
  );
}

function InlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="underline decoration-white/30 underline-offset-2 transition-colors hover:text-white"
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
    >
      {children}
    </a>
  );
}
