import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "We Are Here — Privacy Policy",
  description:
    "Privacy Policy for the We Are Here app, a directory of support services in London.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-black/5 bg-[#F5F5F7]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#6E6E73]">
            We Are Here
          </span>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-black/[0.05] px-3 py-1.5 text-[12px] font-semibold text-[#1D1D1F] transition-colors active:bg-black/10"
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

      <div className="mx-auto max-w-lg px-5 pb-20 pt-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[30px] font-black leading-[1.1] tracking-tight text-[#1D1D1F]">
            Privacy Policy
          </h1>
          <p className="mt-3 text-[13px] font-medium text-[#6E6E73]">
            Last updated: 9 May 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-9 text-[15px] leading-[1.65] text-[#3A3A3C]">
          <Section title="At a glance">
            <p>
              We Are Here is a free, non-commercial directory of homeless
              support services in London. It is designed to be useful even when
              you have no account, no signal, and no identification. We collect
              the minimum data needed to make the app work and we do not sell
              or share your data with anyone.
            </p>
          </Section>

          <Section title="What stays on your device">
            <ul className="space-y-2 pl-4">
              <Li>
                <strong className="text-[#1D1D1F]">Your location.</strong> Used
                only on your device to show distances and centre the map. It
                is never sent to our servers or any third party.
              </Li>
              <Li>
                <strong className="text-[#1D1D1F]">Bookmarks and collections.</strong>{" "}
                Saved services, notes, and folders live in local storage on
                your device. They are not synced to any cloud.
              </Li>
              <Li>
                <strong className="text-[#1D1D1F]">Language preference.</strong>{" "}
                The English / Arabic toggle is stored locally so the app
                remembers your choice.
              </Li>
              <Li>
                <strong className="text-[#1D1D1F]">Cached service data.</strong>{" "}
                We store a copy of the service directory on your device so it
                works offline.
              </Li>
            </ul>
          </Section>

          <Section title="What you can choose to send us">
            <p>
              Two features let you send information to us, and only if you use
              them:
            </p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>
                <strong className="text-[#1D1D1F]">Reporting an issue</strong>{" "}
                with a service. We receive the service identifier, the issue
                type you select, and any optional description and email
                address you provide. Email is optional &mdash; if you don&rsquo;t
                want to be contacted back, leave it blank.
              </Li>
              <Li>
                <strong className="text-[#1D1D1F]">Suggesting a new service.</strong>{" "}
                We receive the service details you submit and any optional
                email address you provide.
              </Li>
            </ul>
            <p className="mt-3">
              We use this information solely to keep the directory accurate
              and, if you provide an email, to follow up with you about your
              report or suggestion.
            </p>
          </Section>

          <Section title="What we do not collect">
            <ul className="space-y-2 pl-4">
              <Li>No accounts, sign-ups, or passwords.</Li>
              <Li>No advertising identifiers.</Li>
              <Li>No tracking pixels, cookies, or third-party analytics.</Li>
              <Li>No access to your contacts, photos, microphone, or camera.</Li>
              <Li>
                No record of which services you view, search, or save.
              </Li>
            </ul>
          </Section>

          <Section title="Third-party services">
            <p>
              The app relies on two infrastructure providers. They process
              technical data needed to deliver content; they do not receive
              your name, email, or location from us.
            </p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>
                <strong className="text-[#1D1D1F]">Supabase</strong> &mdash;
                hosts the public service directory and receives reports and
                suggestions you choose to submit.{" "}
                <InlineLink href="https://supabase.com/privacy">
                  Supabase Privacy Policy
                </InlineLink>
                .
              </Li>
              <Li>
                <strong className="text-[#1D1D1F]">Mapbox</strong> &mdash;
                serves the map tiles. Mapbox may log your IP address and
                approximate region as part of standard tile delivery.{" "}
                <InlineLink href="https://www.mapbox.com/legal/privacy">
                  Mapbox Privacy Policy
                </InlineLink>
                .
              </Li>
            </ul>
          </Section>

          <Section title="Sensitive content">
            <p>
              Some services in the directory relate to domestic abuse,
              substance use, mental health, and other sensitive topics. We do
              not log which services you view. If you are using a shared
              device and are concerned about your activity being seen, you
              can clear the app from your phone&rsquo;s recent apps and the
              app does not retain a browsing history.
            </p>
          </Section>

          <Section title="Children">
            <p>
              We Are Here is intended for adults seeking support or
              professionals helping others. Some services in the directory
              are for young people aged 16 and over. We do not knowingly
              collect data from children under 13.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              Under UK GDPR you have the right to access, correct, or delete
              any information you have sent to us. Because we do not require
              accounts, the only data tied to you is what you choose to
              include in a report or suggestion (typically just an email
              address). Email us at the address below and we will action your
              request within 30 days.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If we change how the app handles data, we will update this page
              and revise the date at the top. Significant changes will also
              be noted in the app&rsquo;s release notes.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For questions or to exercise any of your data rights, email{" "}
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
      <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#1D1D1F]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-3 before:absolute before:left-0 before:top-[0.65em] before:h-[5px] before:w-[5px] before:rounded-full before:bg-[#0071E3]">
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
      className="text-[#0071E3] underline decoration-[#0071E3]/30 underline-offset-2 transition-colors hover:decoration-[#0071E3]"
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
    >
      {children}
    </a>
  );
}
