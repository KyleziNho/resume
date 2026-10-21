'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Archivo_Black } from 'next/font/google';

const archivo = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

// --- INTERFACES & DATA ---

interface Project {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  website?: string;
  appStoreLink?: string;
  description: string;
  detailedDescription?: string;
  videoId?: string;
  videoAspectRatio?: 'landscape' | 'portrait';
  screenshots: string[];
  progress: number;
  status: string;
  technologies: string[];
  date: string;
  category: string;
}

const projects: Project[] = [
  {
    id: 'onlybills',
    name: 'OnlyBills',
    tagline: 'Split bills, not friendships',
    icon: '/app-onlybills-2.png',
    appStoreLink: 'https://apps.apple.com/gb/app/onlybills/id6754412082',
    description: 'The easiest way to split a bill. Scan the receipt and AI reads every item, then share a QR code with the table. Everyone joins from their own phone (no app or login needed), taps what they had, and pays you with Monzo, Revolut, PayPal or bank transfer.',
    detailedDescription: `The easiest way to split a bill. Scan the receipt and AI reads every item, then share a QR code with the table. Everyone joins from their own phone (no app or login needed), taps what they had, and pays you with Monzo, Revolut, PayPal or bank transfer.

What's New in 2.0:
A full redesign in Apple's liquid glass style, plus live tables. Instead of the host assigning everyone's items, the table scans a QR code and each person claims what they ordered. Shared plates split automatically and totals update live for everyone. Guests on Android or without the app use a web page; iPhone guests get a native App Clip. The host gets paid through Monzo, Revolut, PayPal or bank transfer deep links, so the app never holds money. There's also an IOU tab that tracks who still owes you across bills. Built with SwiftUI, SwiftData and Firebase, with 100+ unit tests.

Why I Built This:
I wanted to apply for an iOS developer role at Revolut and needed a strong SwiftUI project for my portfolio. I was also curious about Apple Vision OCR capabilities. Numerous times I've been at restaurants with friends spending ages looking at the bill, adding everything up, then calculating service charge on top. I thought there must be a far simpler way to do this. Was surprised that Splitwise and other apps didn't have a feature like this.

Business Reality:
Very limited monetisation potential. It's difficult to charge people for this - the types of people who would download a bill-splitting app are likely not the ones who want to pay for something they could easily do for free. I don't think the business case is strong, but it solved a real problem I had and was a great learning experience.`,
    videoId: '1140723788',
    videoAspectRatio: 'portrait',
    screenshots: ['/onlybills-screenshot-1.png', '/onlybills-screenshot-2.png', '/onlybills-screenshot-3.png', '/onlybills-screenshot-4.png'],
    progress: 100,
    status: 'Live on App Store',
    technologies: ['SwiftUI', 'SwiftData', 'Google Gemini', 'Vision', 'Firebase', 'App Clips'],
    date: 'October 2026',
    category: 'Mobile App'
  },
  {
    id: 'frift',
    name: 'Frift',
    tagline: 'Your campus marketplace',
    icon: '/app-frift.png',
    website: 'https://www.frift.uk',
    appStoreLink: 'https://apps.apple.com/gb/app/frift-student-marketplace/id6745021634',
    description: 'A marketplace for second-hand furniture and student goods built for university students. Surveyed 100+ students and 87% said they would download the app. Flew to Chicago to learn Flutter, spent 3 months building it solo. Won Santander X and made it to final round of Dragons Den (Bath).',
    detailedDescription: `Started with friends at uni - nightlife tickets were sold across snapchat and whatsapp making them hard to find. Surveyed 100+ students and 87% said they would download the app. Flew to Chicago to learn Flutter from a friend, spent 3 months building it solo. Won Santander X and made it to final round of Dragons Den (Bath). Now live on the App Store and integrated into a Bath uni module where students handle marketing and business development.

Why I Built This:
Students trust each other more than random people on Facebook - I've had plenty of bad experiences with shady sellers. The second-hand market is growing rapidly each year, driven largely by students and Gen Z. With Frift, you can try on clothes before buying, get same-day delivery, and skip the hassle of Vinted shipping. Everyone was selling tickets across Snapchat/WhatsApp group chats with no central place to find them.

I saw huge potential: hyper-personalised ads (direct DMs, custom home pages - things Instagram or the SU website can't do), rentals, connecting with alumni, carpooling, advertising student businesses, checking latest events. The vision was to turn it into a super app for the university - everything in one place. Surprisingly, most universities still don't have their own apps.

Reality Check:
I don't think Frift will make much money. It's hard to convince people to pay for something that's already free (Facebook, Vinted). They don't want commission on buying/selling. Making money from ads takes way too long. Gave up on this project because it was very difficult to secure partnerships with the university, which would have been the optimal revenue stream.

Competitors like Rumie (US, valued in millions, 15% commission) are only truly successful at one university. Hazaar at Birmingham raised 150k with 20k users, tried charging commission, pivoted to charging universities, then pivoted again to discount codes. The market is tough.`,
    videoId: '1068684400',
    videoAspectRatio: 'landscape',
    screenshots: ['/frift-screenshot-1.png', '/frift-screenshot-2.png', '/frift-screenshot-3.png', '/frift-screenshot-4.png', '/frift-screenshot-5.png'],
    progress: 100,
    status: 'Live on App Store',
    technologies: ['Flutter', 'Firebase', 'Firestore', 'Cloud Functions'],
    date: 'May 2025',
    category: 'Mobile App'
  },
  {
    id: 'arcadeus',
    name: 'Arcadeus',
    tagline: 'M&A Deal Modeling',
    icon: '/app-arcadeus.png',
    website: 'https://www.arcadeus.ai',
    description: 'Professional Excel add-in for M&A and PE deal modeling with AI-powered automation. Tested MVP with bankers across NYC, London, and Hong Kong. Pitched to Cambridge, Bayes, and Hull universities. Currently applying to Cambridge accelerator.',
    detailedDescription: `Professional Excel add-in for M&A and PE deal modeling. AI-powered data extraction from financial documents with automated model generation. Streamlines the deal modeling process for private equity and investment banking professionals.

The Origin Story:
My good friend Leon (most driven person I know my age) was in an MSc Real Estate Finance module at Cambridge. His lecturer said they'd stop teaching financial modelling the following year because AI would automate everything. Fast forward - Leon lands a role as an investment banker at a real estate company and finds there's still nothing to automate these processes. He reached out to me.

After testing an MVP with bankers across NYC, London, and Hong Kong, I developed a prototype. We pitched it to Cambridge, Bayes, and Hull universities - very well received. However, the prototype was too ambitious to turn into a working product. We had over 130 applicants for hiring, interviewed 10+ incredibly smart people (mainly top 10 worldwide universities and PhDs in computer science). They were interested but wouldn't work for free. We realised this top talent would require significant funding.

Current Status:
We've reached out to fundraisers, had conversations with TechStars, Forge AI, LSE, Cambridge and Bayes accelerators. Found a Cambridge accelerator starting in January offering \u00a340k at the start and \u00a340k at completion - currently applying. Also onboarding CS students at Bayes for support, though unsure how helpful this will be.

The Challenge:
The prototype promised a lot in demos, but we haven't found our niche. It's impossible to automate every aspect of financial modelling well. We're pivoting to automate the 'quick evaluation' process of a company (currently takes hours to days), which happens before any real modelling begins. This pivot is strategic - it's Leon's current workstream, so we can iterate and test easily with very specific requirements.

The Business Case:
Huge potential, but complex. Integrating into PE firms is difficult - too much red tape (Leon is involved in this process, we've confirmed this with many industry professionals). It can take over a year just to analyse a company, and most get rejected.

However, universities are a different story. Far easier to sell to - doesn't need to be as accurate or insanely secure. Just needs to give students a real idea of how the industry works. Two out of four universities we contacted quickly suggested purchasing licences once developed (ballpark 100 licences to start). Should be quick to expand once we have that initial stamp of approval. Eventually we can expand into PE once more trusted and developed.`,
    screenshots: [],
    progress: 85,
    status: 'In Development',
    technologies: ['Node.js', 'Python', 'OpenAI', 'Excel API'],
    date: 'September 2024',
    category: 'Web Platform'
  },
  {
    id: 'kyro',
    name: 'Kyro',
    tagline: 'Multiplayer Card Game',
    icon: '/app-kyro.png',
    website: 'https://kyro.onl',
    description: 'Real-time multiplayer card game where you compete for the lowest score. Use power cards strategically, match cards to eliminate them, and call Kyro to win. A flat classic turned digital.',
    detailedDescription: `Real-time multiplayer card game where you compete for the lowest score. Use power cards strategically, match cards to eliminate them, and call Kyro to win. Built with real-time websockets for seamless multiplayer gameplay.

The Origin:
Started off as a card game my well-traveled friend showed me - he was taught it by a man during his travels to Amsterdam. There was no name for it. It took 30 minutes for us to properly remember what all the cards did (we were all drunk), but after we understood it, we had so much fun. This game became a flat classic - we played it every day, non-stop. Anytime we were bored, we'd get together and play it. Whenever we had people over, we'd play it.

It's very competitive, has short rounds, and has enough skill involved so you can win most matches if you're good at it, while being simple enough for new players to learn quickly - everything needed to make it a hit. I've always grown up playing games - my mum is obsessed with board games and I used to play video games to the point where I made money from them. I've always been fascinated by games and wanted to make my own. This seemed like the perfect opportunity.

From Physical to Digital:
At first I wanted to make this into a physical card game. It can be played with any normal deck of cards, but each card has a special ability and having to remember them or teach someone can be very time consuming. I designed the cards on Canva and went to factories for quotes. At the time it was looking like \u00a31-1.2k, and as a broke student I couldn't afford that. Arcadeus and Frift started picking up momentum so I stopped Kyro there for a while.

Recently I came back to it and developed it into an online game with Socket.io. This has been a decent hit with my friends and I was surprised by how well it turned out.

Business Case:
My idea is that the website is free but channels sales to the physical version. Cards are cheap to produce so hopefully high margin. Easy word of mouth marketing due to the nature of multiplayer games - it's addictive. Also, as the game is memory-based, I was hoping to do something in the space of dementia (I've worked in dementia care homes and have close family that have suffered with it) or home education. Developing a party version (drinking game) would be good too, perhaps included in the launch version.`,
    videoId: '1140726803',
    videoAspectRatio: 'landscape',
    screenshots: ['/kyro-screenshot-1.png', '/kyro-screenshot-2.png', '/kyro-screenshot-3.png', '/kyro-screenshot-4.png', '/kyro-screenshot-5.png', '/kyro-screenshot-6.png', '/kyro-screenshot-7.png', '/kyro-screenshot-8.png', '/kyro-screenshot-9.png', '/kyro-screenshot-10.png', '/kyro-screenshot-11.png', '/kyro-screenshot-12.png', '/kyro-screenshot-13.png', '/kyro-screenshot-14.png', '/kyro-screenshot-15.png', '/kyro-screenshot-16.png'],
    progress: 100,
    status: 'Live',
    technologies: ['Node.js', 'Express', 'Socket.IO', 'HTML5'],
    date: 'October 2025',
    category: 'Web App'
  },
  {
    id: 'wearehere',
    name: 'We Are Here',
    tagline: 'Resources for vulnerable people',
    icon: '/app-wearehere.png',
    description: 'A charity map app that connects people experiencing homelessness to shelters, food banks, legal aid and mental health support across London. I\'m CTO and lead developer, running a tech team of 5. Works fully offline, now live on iOS and Android.',
    detailedDescription: `A comprehensive map app that lists all resources available to vulnerable people within an area - food shelters, healthcare, day care centres, sexual abuse clinics, and everything someone in a vulnerable state would need to know is available to them.

How It Started:
I was at my good friend Leon's (Arcadeus co-founder) birthday party a few weeks ago, which was incredible. Lots of people flew in from across the world and everyone there was so interesting to talk to. The next morning I walked downstairs to make a coffee and met this lady who I didn't get to talk to much the day before. We got talking about what we do. I mentioned I make apps, and she mentioned she's been working on this non-profit idea. She's had a pretty successful career as a lawyer at lots of top companies and wanted to give back.

The Problem:
There is no readily available map that lists the resources available to vulnerable people within an area. Currently, vulnerable people may be going to one food shelter and not be aware that there's another one just 100m away. This causes overcrowding or people not getting access to the resources they need. It's not just food shelters - it's healthcare, day care centres, sexual abuse clinics, everything. Also in this age, most homeless people have phones (although the app is not just for homeless people).

Current Status:
I'm now CTO and lead developer, leading a tech team of 5 within a wider team of 12. It's a UK registered charity and the app is live on iOS and Android. It's built with Flutter, Mapbox and Supabase, with smart tile caching so it works fully offline without mobile data, and a zero-data-export policy so no user data leaves the device. We ran a pilot with 50+ users, built a dashboard that grassroots organisations use to manage 256+ charity listings, secured funding backed by Tom Holland, and partnered with 6 London boroughs.

Business Case:
There's a big need for this in the UK and it will likely be successful. As a non-profit the business case isn't huge, but definitely a great venture to be involved in as it can have a massive impact on people's lives.`,
    videoId: '1141169621',
    videoAspectRatio: 'portrait',
    screenshots: ['/wearehere-screenshot-1.png', '/wearehere-screenshot-2.png', '/wearehere-screenshot-3.png', '/wearehere-screenshot-4.png'],
    progress: 100,
    status: 'Live on iOS & Android',
    technologies: ['Flutter', 'Supabase', 'PostgreSQL', 'Mapbox'],
    date: 'November 2025',
    category: 'Mobile App'
  }
];

// --- HELPERS ---

function dateToFilename(date: string, name: string): string {
  const months: Record<string, string> = {
    January: '01', February: '02', March: '03', April: '04',
    May: '05', June: '06', July: '07', August: '08',
    September: '09', October: '10', November: '11', December: '12',
  };
  const [monthName, year] = date.split(' ');
  return `${year}-${months[monthName] || '01'}-${name.toLowerCase().replace(/\s+/g, '-')}.html`;
}

// --- RETRO COMPUTER ILLUSTRATION ---

function RetroComputer() {
  return (
    <svg viewBox="0 0 300 310" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden>
      {/* Cable */}
      <path d="M 225 185 C 240 195, 250 215, 245 255 Q 242 275, 255 285" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* Monitor body */}
      <rect x="35" y="45" width="190" height="165" rx="14" fill="#1a1a1a" stroke="#000" strokeWidth="2.5"/>
      {/* Screen bezel */}
      <rect x="50" y="58" width="160" height="130" rx="7" fill="#f0efe8" stroke="#1a1a1a" strokeWidth="1.5"/>

      {/* Eye */}
      <circle cx="130" cy="112" r="26" fill="#1a1a1a"/>
      <circle cx="121" cy="103" r="8.5" fill="#f0efe8"/>
      <circle cx="125" cy="100" r="3.5" fill="#f0efe8"/>

      {/* Smile */}
      <path d="M 95 140 Q 130 168 165 140" stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round"/>

      {/* Knobs */}
      <circle cx="60" cy="200" r="5" fill="#f0efe8" stroke="#1a1a1a" strokeWidth="1.5"/>
      <circle cx="77" cy="200" r="5" fill="#f0efe8" stroke="#1a1a1a" strokeWidth="1.5"/>

      {/* Stand */}
      <rect x="105" y="213" width="50" height="22" rx="2" fill="#1a1a1a" stroke="#000" strokeWidth="2"/>
      <rect x="85" y="235" width="90" height="11" rx="4" fill="#1a1a1a" stroke="#000" strokeWidth="2"/>

      {/* Arm */}
      <path d="M 225 130 C 232 125, 238 112, 242 98" stroke="#1a1a1a" strokeWidth="10" strokeLinecap="round"/>
      <path d="M 225 118 C 235 108, 244 88, 248 72" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round"/>

      {/* Hand */}
      <ellipse cx="249" cy="68" rx="9" ry="7" fill="#1a1a1a" transform="rotate(-18 249 68)"/>

      {/* Pen shaft */}
      <line x1="253" y1="60" x2="265" y2="22" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Pen nib */}
      <polygon points="265,22 259,10 271,10" fill="#1a1a1a"/>
      {/* Pen band */}
      <line x1="260" y1="16" x2="268" y2="16" stroke="#f0efe8" strokeWidth="1.2"/>

      {/* Bubbles */}
      <circle cx="276" cy="8" r="4" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
      <circle cx="266" cy="-2" r="3" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
      <circle cx="274" cy="-10" r="2" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    </svg>
  );
}

// --- QUICK LINKS ---

const quickLinks = [
  { label: 'GitHub', href: 'https://github.com/KyleziNho', external: true },
  { label: 'Projects', href: '#projects', external: false },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kos33/', external: true },
  { label: 'Home', href: '/', external: false },
];

// --- MAIN PAGE ---

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<{ projectId: string; index: number } | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedScreenshot) setSelectedScreenshot(null);
        else if (selectedProject) setSelectedProject(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedProject, selectedScreenshot]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedProject || selectedScreenshot) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedProject, selectedScreenshot]);

  return (
    <div className="min-h-screen bg-[#f5f5f0]" style={{ scrollBehavior: 'smooth' }}>

      {/* ===================== HERO ===================== */}
      <section className="max-w-[960px] mx-auto px-6 pt-14 pb-10 md:pt-24 md:pb-16">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className={`${archivo.className} text-[clamp(3rem,8vw,4.5rem)] leading-[0.92] tracking-tight text-black`}>
              Hello.<br />I&apos;m Kyle.
            </h1>
            <p className="mt-4 text-[15px] text-[#666] max-w-xs leading-relaxed">
              Software Engineer @ SharkNinja · Open to grad roles
            </p>
            <Link
              href="/"
              className="mt-6 inline-block border-[1.5px] border-black px-5 py-2.5 text-[13px] font-semibold tracking-wide hover:bg-black hover:text-white transition-colors duration-200"
            >
              Message Me
            </Link>
          </div>
          <div className="hidden md:block w-52 lg:w-60 shrink-0 -mt-4">
            <RetroComputer />
          </div>
        </div>
      </section>

      {/* ===================== QUICK LINKS ===================== */}
      <section className="max-w-[960px] mx-auto px-6 pb-14 md:pb-20">
        <h3 className={`${archivo.className} text-[13px] mb-3 tracking-wide`}>Quick links</h3>
        <div className="flex border border-[#aaa] bg-[#d8d8d0] divide-x divide-[#aaa]">
          {quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="flex-1 flex items-center justify-between px-4 py-3 text-[13px] font-medium hover:bg-[#cdcdc5] transition-colors duration-150"
            >
              <span>{link.label}</span>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0 ml-2 opacity-60">
                <path d="M4 1h9v9M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          ))}
        </div>
      </section>

      {/* ===================== PROJECTS ===================== */}
      <section id="projects" className="bg-[#e5e5dc] py-12 md:py-16">
        <div className="max-w-[960px] mx-auto px-6">
          <h2 className={`${archivo.className} text-3xl md:text-[2.5rem] mb-8`}>Projects</h2>
        </div>
        <div
          className="overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <div
            className="flex gap-5 px-[max(1.5rem,calc((100%-960px)/2+1.5rem))] pt-2 pb-4 snap-x snap-mandatory"
          >
            {projects.map(project => (
              <article
                key={project.id}
                className="min-w-[300px] sm:min-w-[340px] max-w-[380px] flex-shrink-0 bg-white border border-[#aaa] snap-start flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
              >
                {/* Window title bar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#bbb] bg-[#e8e8e0]">
                  <div className="flex gap-1.5">
                    <div className="w-[10px] h-[10px] rounded-full border-[1.5px] border-[#999]" />
                    <div className="w-[10px] h-[10px] rounded-full border-[1.5px] border-[#999]" />
                  </div>
                  <span className="flex-1 text-center text-[10px] text-[#777] font-mono truncate select-none">
                    {dateToFilename(project.date, project.name)}
                  </span>
                </div>

                {/* Image */}
                <div className="h-44 bg-[#eee] border-b border-[#ccc] overflow-hidden relative">
                  {project.screenshots.length > 0 ? (
                    <Image
                      src={project.screenshots[0]}
                      alt={project.name}
                      fill
                      className="object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                      sizes="380px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#e8e8e0]">
                      <Image src={project.icon} alt={project.name} width={72} height={72} className="object-contain" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className={`${archivo.className} text-[17px] mb-2`}>{project.name}</h3>
                  <p className="text-[13px] text-[#555] leading-relaxed flex-1 line-clamp-5">
                    {project.description}
                  </p>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="mt-4 self-start border border-black px-4 py-2 text-[11px] font-bold tracking-wider uppercase hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer"
                  >
                    View project
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="bg-[#f5f5f0] py-8 border-t border-[#ddd]">
        <div className="max-w-[960px] mx-auto px-6 text-center text-[11px] text-[#999] tracking-wide">
          Kyle Sherwood &middot; 2026
        </div>
      </footer>

      {/* ===================== PROJECT DETAIL MODAL ===================== */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-8"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-white border-2 border-black w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[6px_6px_0_rgba(0,0,0,1)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal title bar */}
            <div className="flex items-center px-3 py-2.5 border-b-2 border-black bg-[#e8e8e0] shrink-0">
              <div className="flex gap-1.5 mr-3">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="w-3 h-3 rounded-full bg-black hover:bg-red-600 transition-colors cursor-pointer"
                  aria-label="Close"
                />
                <div className="w-3 h-3 rounded-full border-[1.5px] border-[#999]" />
              </div>
              <span className="flex-1 text-center text-[11px] font-bold uppercase tracking-[0.1em] font-mono">
                {selectedProject.name}
              </span>
              <div className="w-[30px]" />
            </div>

            {/* Modal content */}
            <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
              {/* Header */}
              <div className="p-5 md:p-6 border-b border-[#ddd] flex gap-4 items-start">
                <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 border border-black overflow-hidden">
                  <Image src={selectedProject.icon} alt="" width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className={`${archivo.className} text-xl md:text-2xl`}>{selectedProject.name}</h2>
                  <p className="text-[13px] text-[#666] mt-0.5">{selectedProject.tagline}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedProject.website && (
                      <a href={selectedProject.website} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border border-black hover:bg-black hover:text-white transition-colors">
                        Website &#8599;
                      </a>
                    )}
                    {selectedProject.appStoreLink && (
                      <a href={selectedProject.appStoreLink} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border border-black bg-black text-white hover:bg-[#333] transition-colors">
                        App Store &#8599;
                      </a>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border border-[#aaa] text-[#777]">
                      {selectedProject.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Screenshots */}
              {(selectedProject.screenshots.length > 0 || selectedProject.videoId) && (
                <div
                  className="border-b border-[#ddd] bg-[#f0f0e8] p-4 overflow-x-auto flex gap-3 snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {selectedProject.videoId && (
                    <button
                      onClick={() => setSelectedScreenshot({ projectId: selectedProject.id, index: -1 })}
                      className={`border border-black bg-black shrink-0 overflow-hidden hover:opacity-80 transition-opacity snap-start cursor-pointer ${
                        selectedProject.videoAspectRatio === 'portrait' ? 'h-36 w-[81px]' : 'h-36 w-[256px]'
                      }`}
                    >
                      <iframe
                        src={`https://player.vimeo.com/video/${selectedProject.videoId}?title=0&byline=0&portrait=0&background=1`}
                        className="w-full h-full pointer-events-none opacity-80"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                      />
                    </button>
                  )}
                  {selectedProject.screenshots.map((ss, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedScreenshot({ projectId: selectedProject.id, index: i })}
                      className="border border-black bg-white shrink-0 h-36 overflow-hidden hover:opacity-80 transition-opacity snap-start cursor-pointer"
                    >
                      <Image src={ss} alt="" width={150} height={300} className="h-full w-auto object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Tech stack */}
              <div className="px-5 md:px-6 pt-4 pb-2 flex flex-wrap gap-2 items-center">
                {selectedProject.technologies.map((tech, i) => (
                  <span key={i} className="text-[10px] font-mono bg-[#f0f0e8] border border-[#aaa] px-2.5 py-1">{tech}</span>
                ))}
                <span className="text-[10px] font-mono text-[#999] px-1 py-1">{selectedProject.date} &middot; {selectedProject.category}</span>
              </div>

              {/* Description */}
              <div className="px-5 md:px-6 py-4 pb-8">
                <p className="text-[13px] leading-[1.75] whitespace-pre-line text-[#333]">
                  {selectedProject.detailedDescription || selectedProject.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SCREENSHOT LIGHTBOX ===================== */}
      {selectedScreenshot && (() => {
        const currentProject = projects.find(p => p.id === selectedScreenshot.projectId);
        if (!currentProject) return null;
        const hasVideo = !!currentProject.videoId;
        const totalScreenshots = currentProject.screenshots.length;
        const totalItems = totalScreenshots + (hasVideo ? 1 : 0);
        const currentIndex = selectedScreenshot.index;
        const isVideo = currentIndex === -1;
        const displayPosition = isVideo ? 1 : currentIndex + (hasVideo ? 2 : 1);

        const goToPrevious = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isVideo) return;
          if (currentIndex === 0 && hasVideo) {
            setSelectedScreenshot({ projectId: selectedScreenshot.projectId, index: -1 });
          } else if (currentIndex > 0) {
            setSelectedScreenshot({ projectId: selectedScreenshot.projectId, index: currentIndex - 1 });
          }
        };

        const goToNext = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isVideo && totalScreenshots > 0) {
            setSelectedScreenshot({ projectId: selectedScreenshot.projectId, index: 0 });
          } else if (currentIndex < totalScreenshots - 1) {
            setSelectedScreenshot({ projectId: selectedScreenshot.projectId, index: currentIndex + 1 });
          }
        };

        return (
          <div
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
            onClick={() => setSelectedScreenshot(null)}
          >
            {/* Previous */}
            {(currentIndex > 0 || (currentIndex === 0 && hasVideo)) && (
              <button onClick={goToPrevious} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white flex items-center justify-center text-black font-bold text-xl z-10 cursor-pointer active:bg-gray-200 shadow-[3px_3px_0_rgba(0,0,0,0.3)]">&#8249;</button>
            )}
            {/* Next */}
            {((isVideo && totalScreenshots > 0) || currentIndex < totalScreenshots - 1) && (
              <button onClick={goToNext} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white flex items-center justify-center text-black font-bold text-xl z-10 cursor-pointer active:bg-gray-200 shadow-[3px_3px_0_rgba(0,0,0,0.3)]">&#8250;</button>
            )}

            <div
              className={`relative border-4 border-white bg-black ${
                isVideo
                  ? currentProject.videoAspectRatio === 'portrait' ? 'w-[50vh] h-[90vh]' : 'w-[90vw] max-w-4xl h-[50vh]'
                  : 'max-w-4xl max-h-[90vh]'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelectedScreenshot(null)} className="absolute -top-9 right-0 w-7 h-7 bg-white flex items-center justify-center text-black font-bold text-sm cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,1)]">&#10005;</button>
              <div className="absolute -top-9 left-0 px-2 py-1 bg-white text-[10px] font-mono font-bold shadow-[2px_2px_0_rgba(0,0,0,1)]">{displayPosition} / {totalItems}</div>

              {isVideo ? (
                <iframe
                  src={`https://player.vimeo.com/video/${currentProject.videoId}?title=0&byline=0&portrait=0&autoplay=1`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <Image
                  src={currentProject.screenshots[currentIndex]}
                  alt="Screenshot"
                  width={800}
                  height={1600}
                  className="max-h-[90vh] w-auto object-contain"
                  priority
                  sizes="(max-width: 640px) 90vw, 800px"
                  quality={85}
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
