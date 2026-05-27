import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "We Are Here — Support",
  description:
    "Get help with the We Are Here app, report an issue, or suggest a service.",
};

const WHATSAPP_NUMBER = "+447305403957";
const WHATSAPP_DISPLAY = "+44 7305 403957";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}`;
const EMAIL = "kyle.osullivan@arcadeus.ai";

export default function SupportPage() {
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
            Support
          </h1>
          <p className="mt-3 text-[13px] font-medium text-[#6E6E73]">
            We&rsquo;re here to help — reach out any time.
          </p>
        </div>

        {/* Quick contact cards */}
        <div className="mb-10 grid gap-3">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/5 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.453 3.488z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6E6E73]">
                WhatsApp
              </div>
              <div className="mt-0.5 truncate text-[15px] font-semibold text-[#1D1D1F]">
                {WHATSAPP_DISPLAY}
              </div>
            </div>
            <span className="text-[#6E6E73] transition-transform group-hover:translate-x-0.5">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M7 5l6 5-6 5" />
              </svg>
            </span>
          </a>

          <a
            href={`mailto:${EMAIL}`}
            className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/5 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6E6E73]">
                Email
              </div>
              <div className="mt-0.5 truncate text-[15px] font-semibold text-[#1D1D1F]">
                {EMAIL}
              </div>
            </div>
            <span className="text-[#6E6E73] transition-transform group-hover:translate-x-0.5">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M7 5l6 5-6 5" />
              </svg>
            </span>
          </a>
        </div>

        {/* Content */}
        <div className="space-y-9 text-[15px] leading-[1.65] text-[#3A3A3C]">
          <Section title="At a glance">
            <p>
              We Are Here is built and maintained by one person, in London. If
              something isn&rsquo;t working, a service detail is wrong, or
              you&rsquo;d like to suggest a service we should add, please get
              in touch &mdash; messages go straight to me and I read every one.
            </p>
          </Section>

          <Section title="What to message about">
            <ul className="space-y-2 pl-4">
              <Li>
                <strong className="text-[#1D1D1F]">A service is closed, moved, or wrong.</strong>{" "}
                The directory is only useful if it&rsquo;s accurate &mdash; let
                me know and I&rsquo;ll update it the same day where I can.
              </Li>
              <Li>
                <strong className="text-[#1D1D1F]">Suggest a new service.</strong>{" "}
                Share a name, location, and what they offer. I&rsquo;ll verify
                and add it.
              </Li>
              <Li>
                <strong className="text-[#1D1D1F]">The app isn&rsquo;t working.</strong>{" "}
                Crashes, missing map, offline issues, anything broken on your
                device. A short description of your phone and what happened
                helps a lot.
              </Li>
              <Li>
                <strong className="text-[#1D1D1F]">Accessibility or translation.</strong>{" "}
                If something is hard to read, use, or makes no sense in
                Arabic, please flag it.
              </Li>
              <Li>
                <strong className="text-[#1D1D1F]">Partnerships and feedback.</strong>{" "}
                Outreach workers, charities, and councils &mdash; tell me what
                would make this more useful in your work.
              </Li>
            </ul>
          </Section>

          <Section title="Response times">
            <p>
              I aim to reply within 48 hours. Urgent service-accuracy issues
              (a centre that&rsquo;s closed down, an unsafe referral) are
              handled the same day where possible.
            </p>
          </Section>

          <Section title="In a crisis">
            <p>
              We Are Here is a directory, not a crisis service. If you or
              someone else is in immediate danger, call <strong className="text-[#1D1D1F]">999</strong>.
              For non-emergency NHS help call <strong className="text-[#1D1D1F]">111</strong>.
              For Samaritans, call <strong className="text-[#1D1D1F]">116 123</strong>{" "}
              &mdash; free, 24/7.
            </p>
          </Section>

          <Section title="Privacy">
            <p>
              Anything you send by WhatsApp or email is seen only by me and
              used only to follow up with you. See the{" "}
              <InlineLink href="/wearehere/privacy-policy">
                Privacy Policy
              </InlineLink>{" "}
              for full details.
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
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  return (
    <a
      href={href}
      className="text-[#0071E3] underline decoration-[#0071E3]/30 underline-offset-2 transition-colors hover:decoration-[#0071E3]"
      target={isExternal && !href.startsWith("mailto:") ? "_blank" : undefined}
      rel={isExternal && !href.startsWith("mailto:") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
