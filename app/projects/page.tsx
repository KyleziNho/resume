'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// --- INTERFACES & DATA (Unchanged) ---
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
    icon: '/app-onlybills.png',
    appStoreLink: 'https://apps.apple.com/gb/app/onlybills/id6754412082',
    description: 'The easiest way to split receipts. Snap a photo and AI extracts items, prices, tax and tips. Assign items to friends and see exactly who owes what. Built with SwiftUI and powered by Google Gemini for intelligent receipt scanning. I wanted to apply for an iOS developer role at Revolut and needed a strong SwiftUI project. Numerous times I\'ve been at restaurants with friends spending ages looking at the bill, adding everything up, then calculating service charge. I thought there must be a far simpler way.',
    detailedDescription: `The easiest way to split receipts. Snap a photo and AI extracts items, prices, tax and tips. Assign items to friends and see exactly who owes what. Built with SwiftUI and powered by Google Gemini for intelligent receipt scanning.

Why I Built This:
I wanted to apply for an iOS developer role at Revolut and needed a strong SwiftUI project for my portfolio. I was also curious about Apple Vision OCR capabilities. Numerous times I've been at restaurants with friends spending ages looking at the bill, adding everything up, then calculating service charge on top. I thought there must be a far simpler way to do this. Was surprised that Splitwise and other apps didn't have a feature like this.

Business Reality:
Very limited monetisation potential. It's difficult to charge people for this - the types of people who would download a bill-splitting app are likely not the ones who want to pay for something they could easily do for free. I don't think the business case is strong, but it solved a real problem I had and was a great learning experience.`,
    videoId: '1140723788',
    videoAspectRatio: 'portrait',
    screenshots: [
      '/onlybills-screenshot-1.png',
      '/onlybills-screenshot-2.png',
      '/onlybills-screenshot-3.png',
      '/onlybills-screenshot-4.png'
    ],
    progress: 100,
    status: 'Live on App Store',
    technologies: ['SwiftUI', 'SwiftData', 'Google Gemini', 'Vision'],
    date: 'November 2025',
    category: 'Mobile App'
  },
  {
    id: 'frift',
    name: 'Frift',
    tagline: 'Your campus marketplace',
    icon: '/app-frift.png',
    website: 'https://www.frift.uk',
    appStoreLink: 'https://apps.apple.com/gb/app/frift-student-marketplace/id6745021634',
    description: 'A marketplace for second-hand furniture and student goods built for university students. Started with friends at uni - nightlife tickets were sold across Snapchat and WhatsApp making them hard to find. Surveyed 100+ students and 87% said they would download the app. Flew to Chicago to learn Flutter, spent 3 months building it solo. Won Santander X and made it to final round of Dragons Den (Bath). Students trust each other more than random people on Facebook. The second-hand market is growing rapidly, driven by students and Gen Z.',
    detailedDescription: `Started with friends at uni - nightlife tickets were sold across snapchat and whatsapp making them hard to find. Surveyed 100+ students and 87% said they would download the app. Flew to Chicago to learn Flutter from a friend, spent 3 months building it solo. Won Santander X and made it to final round of Dragons Den (Bath). Now live on the App Store and integrated into a Bath uni module where students handle marketing and business development.

Why I Built This:
Students trust each other more than random people on Facebook - I've had plenty of bad experiences with shady sellers. The second-hand market is growing rapidly each year, driven largely by students and Gen Z. With Frift, you can try on clothes before buying, get same-day delivery, and skip the hassle of Vinted shipping. Everyone was selling tickets across Snapchat/WhatsApp group chats with no central place to find them.

I saw huge potential: hyper-personalised ads (direct DMs, custom home pages - things Instagram or the SU website can't do), rentals, connecting with alumni, carpooling, advertising student businesses, checking latest events. The vision was to turn it into a super app for the university - everything in one place. Surprisingly, most universities still don't have their own apps.

Reality Check:
I don't think Frift will make much money. It's hard to convince people to pay for something that's already free (Facebook, Vinted). They don't want commission on buying/selling. Making money from ads takes way too long. Gave up on this project because it was very difficult to secure partnerships with the university, which would have been the optimal revenue stream.

Competitors like Rumie (US, valued in millions, 15% commission) are only truly successful at one university. Hazaar at Birmingham raised 150k with 20k users, tried charging commission, pivoted to charging universities, then pivoted again to discount codes. The market is tough.`,
    videoId: '1068684400',
    videoAspectRatio: 'landscape',
    screenshots: [
      '/frift-screenshot-1.png',
      '/frift-screenshot-2.png',
      '/frift-screenshot-3.png',
      '/frift-screenshot-4.png',
      '/frift-screenshot-5.png'
    ],
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
    description: 'Professional Excel add-in for M&A and PE deal modeling with AI-powered automation. My good friend Leon (most driven person I know my age) was in an MSc Real Estate Finance module at Cambridge - his lecturer said they\'d stop teaching financial modelling because AI would automate everything. Leon landed a role as an investment banker and found there\'s still nothing to automate these processes. He reached out to me. After testing an MVP with bankers across NYC, London, and Hong Kong, I developed a prototype. We pitched to Cambridge, Bayes, and Hull universities - very well received. The prototype was too ambitious to turn into a working product. We had over 130 applicants for hiring, interviewed 10+ incredibly smart people (mainly top 10 worldwide universities and PhDs in computer science). They were interested but wouldn\'t work for free. We realised this top talent would require significant funding. We\'ve reached out to fundraisers, had conversations with TechStars, Forge AI, LSE, Cambridge and Bayes accelerators. Currently applying to Cambridge accelerator offering £40k at start and £40k at completion.',
    detailedDescription: `Professional Excel add-in for M&A and PE deal modeling. AI-powered data extraction from financial documents with automated model generation. Streamlines the deal modeling process for private equity and investment banking professionals.

The Origin Story:
My good friend Leon (most driven person I know my age) was in an MSc Real Estate Finance module at Cambridge. His lecturer said they'd stop teaching financial modelling the following year because AI would automate everything. Fast forward - Leon lands a role as an investment banker at a real estate company and finds there's still nothing to automate these processes. He reached out to me.

After testing an MVP with bankers across NYC, London, and Hong Kong, I developed a prototype. We pitched it to Cambridge, Bayes, and Hull universities - very well received. However, the prototype was too ambitious to turn into a working product. We had over 130 applicants for hiring, interviewed 10+ incredibly smart people (mainly top 10 worldwide universities and PhDs in computer science). They were interested but wouldn't work for free. We realised this top talent would require significant funding.

Current Status:
We've reached out to fundraisers, had conversations with TechStars, Forge AI, LSE, Cambridge and Bayes accelerators. Found a Cambridge accelerator starting in January offering £40k at the start and £40k at completion - currently applying. Also onboarding CS students at Bayes for support, though unsure how helpful this will be.

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
    description: 'Real-time multiplayer card game where you compete for the lowest score. Started off as a card game my well-traveled friend showed me - he was taught it by a man during his travels to Amsterdam. It became a flat classic - we played it every day, non-stop. Very competitive, short rounds, enough skill to win if you\'re good at it, simple enough for new players. I\'ve always been fascinated by games and wanted to make my own. At first I wanted physical cards - designed them on Canva, got factory quotes (£1-1.2k). Recently developed it into an online game with Socket.io.',
    detailedDescription: `Real-time multiplayer card game where you compete for the lowest score. Use power cards strategically, match cards to eliminate them, and call Kyro to win. Built with real-time websockets for seamless multiplayer gameplay.

The Origin:
Started off as a card game my well-traveled friend showed me - he was taught it by a man during his travels to Amsterdam. There was no name for it. It took 30 minutes for us to properly remember what all the cards did (we were all drunk), but after we understood it, we had so much fun. This game became a flat classic - we played it every day, non-stop. Anytime we were bored, we'd get together and play it. Whenever we had people over, we'd play it.

It's very competitive, has short rounds, and has enough skill involved so you can win most matches if you're good at it, while being simple enough for new players to learn quickly - everything needed to make it a hit. I've always grown up playing games - my mum is obsessed with board games and I used to play video games to the point where I made money from them. I've always been fascinated by games and wanted to make my own. This seemed like the perfect opportunity.

From Physical to Digital:
At first I wanted to make this into a physical card game. It can be played with any normal deck of cards, but each card has a special ability and having to remember them or teach someone can be very time consuming. I designed the cards on Canva and went to factories for quotes. At the time it was looking like £1-1.2k, and as a broke student I couldn't afford that. Arcadeus and Frift started picking up momentum so I stopped Kyro there for a while.

Recently I came back to it and developed it into an online game with Socket.io. This has been a decent hit with my friends and I was surprised by how well it turned out.

Business Case:
My idea is that the website is free but channels sales to the physical version. Cards are cheap to produce so hopefully high margin. Easy word of mouth marketing due to the nature of multiplayer games - it's addictive. Also, as the game is memory-based, I was hoping to do something in the space of dementia (I've worked in dementia care homes and have close family that have suffered with it) or home education. Developing a party version (drinking game) would be good too, perhaps included in the launch version.`,
    videoId: '1140726803',
    videoAspectRatio: 'landscape',
    screenshots: [
      '/kyro-screenshot-1.png',
      '/kyro-screenshot-2.png',
      '/kyro-screenshot-3.png',
      '/kyro-screenshot-4.png',
      '/kyro-screenshot-5.png',
      '/kyro-screenshot-6.png',
      '/kyro-screenshot-7.png',
      '/kyro-screenshot-8.png',
      '/kyro-screenshot-9.png',
      '/kyro-screenshot-10.png',
      '/kyro-screenshot-11.png',
      '/kyro-screenshot-12.png',
      '/kyro-screenshot-13.png',
      '/kyro-screenshot-14.png',
      '/kyro-screenshot-15.png',
      '/kyro-screenshot-16.png'
    ],
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
    description: 'A comprehensive map app that lists all resources available to vulnerable people within an area - food shelters, healthcare, day care centres, sexual abuse clinics, and everything someone in a vulnerable state would need to know is available to them. I was at my good friend Leon\'s (Arcadeus co-founder) birthday party a few weeks ago, which was incredible. The next morning I met this lady who\'s been working on this non-profit idea. She\'s had a pretty successful career as a lawyer at top companies and wanted to give back.',
    detailedDescription: `A comprehensive map app that lists all resources available to vulnerable people within an area - food shelters, healthcare, day care centres, sexual abuse clinics, and everything someone in a vulnerable state would need to know is available to them.

How It Started:
I was at my good friend Leon's (Arcadeus co-founder) birthday party a few weeks ago, which was incredible. Lots of people flew in from across the world and everyone there was so interesting to talk to. The next morning I walked downstairs to make a coffee and met this lady who I didn't get to talk to much the day before. We got talking about what we do. I mentioned I make apps, and she mentioned she's been working on this non-profit idea. She's had a pretty successful career as a lawyer at lots of top companies and wanted to give back.

The Problem:
There is no readily available map that lists the resources available to vulnerable people within an area. Currently, vulnerable people may be going to one food shelter and not be aware that there's another one just 100m away. This causes overcrowding or people not getting access to the resources they need. It's not just food shelters - it's healthcare, day care centres, sexual abuse clinics, everything. Also in this age, most homeless people have phones (although the app is not just for homeless people).

Current Status:
I've since solely developed the MVP and there's a strong team of 12 people covering all other aspects. There's an app in the states that launched doing a very similar thing and amassed 250k+ users.

Business Case:
There's a big need for this in the UK and it will likely be successful. As a non-profit the business case isn't huge, but definitely a great venture to be involved in as it can have a massive impact on people's lives.`,
    videoId: '1141169621',
    videoAspectRatio: 'portrait',
    screenshots: [
      '/wearehere-screenshot-1.png',
      '/wearehere-screenshot-2.png',
      '/wearehere-screenshot-3.png',
      '/wearehere-screenshot-4.png'
    ],
    progress: 75,
    status: 'In Development',
    technologies: ['Flutter', 'Firebase', 'MapBox'],
    date: 'November 2025',
    category: 'Mobile App'
  }
];

// Checkerboard pattern for classic Mac background
const checkerboardStyle = {
  backgroundImage: `
    linear-gradient(45deg, #c0c0c0 25%, transparent 25%),
    linear-gradient(-45deg, #c0c0c0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #c0c0c0 75%),
    linear-gradient(-45deg, transparent 75%, #c0c0c0 75%)
  `,
  backgroundSize: '4px 4px',
  backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
  backgroundColor: '#808080',
};

export default function ProjectsPage() {
  // New state for Master-Detail view
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  // Used to toggle between list and detail view on mobile
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTech, setFilterTech] = useState<string>('all');
  const [selectedScreenshot, setSelectedScreenshot] = useState<{projectId: string, index: number} | null>(null);

  // Preconnect to Vimeo for faster video loading
  useEffect(() => {
    const preconnectLink = document.createElement('link');
    preconnectLink.rel = 'preconnect';
    preconnectLink.href = 'https://player.vimeo.com';
    document.head.appendChild(preconnectLink);

    const dnsPrefetchLink = document.createElement('link');
    dnsPrefetchLink.rel = 'dns-prefetch';
    dnsPrefetchLink.href = 'https://player.vimeo.com';
    document.head.appendChild(dnsPrefetchLink);

    return () => {
      document.head.removeChild(preconnectLink);
      document.head.removeChild(dnsPrefetchLink);
    };
  }, []);

  // Get all unique technologies
  const allTechnologies = Array.from(
    new Set(projects.flatMap(p => p.technologies))
  ).sort();

  // Filter projects
  const filteredProjects = useMemo(() => projects.filter(project => {
    if (filterStatus !== 'all' && project.status !== filterStatus) return false;
    if (filterTech !== 'all' && !project.technologies.includes(filterTech)) return false;
    return true;
  }), [filterStatus, filterTech]);

   // Set initial selected project when list changes
   useEffect(() => {
    if (filteredProjects.length > 0 && selectedProjectId === null) {
        setSelectedProjectId(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProjectId]);


  const activeProject = projects.find(p => p.id === selectedProjectId) || filteredProjects[0];

  const handleProjectClick = (projectId: string) => {
      setSelectedProjectId(projectId);
      setShowMobileDetail(true);
  }

  const handleBackToList = () => {
      setShowMobileDetail(false);
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={checkerboardStyle}>
      {/* Menu Bar */}
      <div className="h-10 sm:h-6 bg-white border-b-2 border-black flex items-center px-3 sm:px-2 text-[10px] uppercase tracking-wider select-none shrink-0 z-50 font-mono">
        <span className="mr-3 sm:mr-4 font-bold">💼 Projects Explorer</span>
        <Link href="/" className="mr-3 sm:mr-4 hover:bg-black hover:text-white px-2 py-1 active:bg-black active:text-white">Home</Link>
        <div className="flex-1"></div>
        <span className="font-mono text-[9px] sm:text-[10px]">{filteredProjects.length} items</span>
      </div>

      {/* Main Container - Now a fixed height container for internal scrolling */}
      <div className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col">
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex-1 flex flex-col overflow-hidden">
          {/* Window Title Bar */}
          <div className="h-6 bg-white border-b-2 border-black flex items-center px-2 shrink-0 font-mono">
            <div className="w-3 h-3 border border-black mr-2 bg-white"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider flex-1 text-center">
                {showMobileDetail && activeProject ? activeProject.name : "Kyle's Projects & Apps"}
            </span>
          </div>

          {/* Filter Bar (Only visible in list view on mobile) */}
          <div className={`border-b-2 border-black bg-gray-100 p-2 shrink-0 ${showMobileDetail ? 'hidden md:block' : 'block'}`}>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center text-[10px] font-mono">
              <span className="font-bold uppercase tracking-wider">Filters:</span>
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border-2 border-black px-2 py-1 bg-white font-mono uppercase text-[10px]"
              >
                <option value="all">All Status</option>
                <option value="Live">Live</option>
                <option value="Live on App Store">Live on App Store</option>
                <option value="In Development">In Development</option>
              </select>

              {/* Tech Filter */}
              <select
                value={filterTech}
                onChange={(e) => setFilterTech(e.target.value)}
                className="border-2 border-black px-2 py-1 bg-white font-mono uppercase text-[10px]"
              >
                <option value="all">All Tech</option>
                {allTechnologies.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>

               {/* Reset Filters */}
               {(filterStatus !== 'all' || filterTech !== 'all') && (
                <button
                  onClick={() => { setFilterStatus('all'); setFilterTech('all'); }}
                  className="px-2 py-1 bg-white border-2 border-black text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 active:bg-gray-300 font-mono"
                >
                  Reset
                </button>
              )}
            </div>
          </div>


          {/* Master-Detail Content Area */}
          <div className="flex-1 flex overflow-hidden relative font-mono">

            {/* --- LEFT PANE: Project List (Sidebar) --- */}
            {/* Hidden on mobile if detail is shown */}
            <div className={`w-full md:w-1/3 lg:w-1/4 border-r-2 border-black bg-gray-50 overflow-y-auto ${showMobileDetail ? 'hidden md:block' : 'block'}`}>
                {filteredProjects.length === 0 ? (
                    <div className="p-4 text-[10px] uppercase">No projects found.</div>
                ) : (
                    <ul className="p-2 space-y-2">
                        {filteredProjects.map(project => (
                            <li key={project.id}>
                                <button
                                    onClick={() => handleProjectClick(project.id)}
                                    className={`w-full text-left flex items-center gap-3 p-2 border-2 ${selectedProjectId === project.id ? 'border-black bg-black text-white shadow-[2px_2px_0_rgba(255,255,255,1)]' : 'border-transparent hover:border-black hover:bg-white hover:shadow-[2px_2px_0_rgba(0,0,0,1)]'} transition-all group`}
                                >
                                     <div className="relative w-8 h-8 shrink-0">
                                        <Image
                                            src={project.icon}
                                            alt={project.name}
                                            width={32}
                                            height={32}
                                            className={`w-full h-full object-cover border border-black ${selectedProjectId === project.id ? 'border-white' : ''}`}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-bold uppercase tracking-wider truncate">{project.name}</div>
                                        <div className={`text-[9px] truncate ${selectedProjectId === project.id ? 'text-gray-300' : 'text-gray-500'}`}>{project.category}</div>
                                    </div>
                                     {selectedProjectId === project.id && <span className="text-[10px]">▶</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {/* Return to Desktop - Desktop only */}
                <div className="p-3 border-t-2 border-black bg-gray-100 hidden md:block">
                    <Link href="/" className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase border-2 border-black px-3 py-2 bg-white hover:bg-gray-50 shadow-[2px_2px_0_black] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] transition-all">
                        <Image src="/favicon.png" alt="KyleOS" width={14} height={14} />
                        Return to Desktop
                    </Link>
                </div>
                {/* Exit to Home - Mobile only */}
                <div className="p-4 mt-4 flex justify-center md:hidden">
                    <Link href="/" className="text-[10px] font-bold uppercase border-2 border-black px-3 py-2 bg-white hover:bg-gray-100 shadow-[2px_2px_0_black] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] transition-all">
                        Exit to Home
                    </Link>
                </div>
            </div>

            {/* --- RIGHT PANE: Project Details --- */}
            {/* Hidden on mobile unless detail is shown */}
            <div className={`w-full md:w-2/3 lg:w-3/4 bg-white overflow-y-auto absolute inset-0 md:relative z-10 md:z-0 ${showMobileDetail ? 'block' : 'hidden md:block'}`}>
                
                {activeProject ? (
                    <div className="flex flex-col min-h-full">
                         {/* Mobile Back Button Header */}
                         <div className="md:hidden bg-gray-100 border-b-2 border-black p-2 sticky top-0 z-20 flex">
                            <button onClick={handleBackToList} className="text-[10px] font-bold uppercase border-2 border-black px-2 py-1 bg-white shadow-[2px_2px_0_black] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] flex items-center">
                                <span className="mr-1">◀</span> Back to List
                            </button>
                        </div>

                        {/* Project Header Section */}
                        <div className="p-3 md:p-4 border-b-2 border-black bg-gray-50">
                            <div className="flex flex-row gap-3 md:gap-4 items-start">
                                {/* Icon */}
                                <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 border-2 border-black shadow-[2px_2px_0_black]">
                                    <Image
                                        src={activeProject.icon}
                                        alt={activeProject.name}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover"
                                        priority
                                    />
                                </div>
                                {/* Title & Info */}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-base md:text-xl font-bold uppercase tracking-wider font-sans truncate">{activeProject.name}</h1>
                                    <p className="text-[10px] md:text-xs text-gray-600 mb-1.5 md:mb-2 font-sans line-clamp-1">{activeProject.tagline}</p>

                                     {/* Status & Links */}
                                     <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
                                        {activeProject.status === 'Live on App Store' && activeProject.appStoreLink ? (
                                            <a
                                                href={activeProject.appStoreLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider px-1.5 md:px-2 py-0.5 md:py-1 border border-black bg-black text-white hover:bg-gray-800 flex items-center gap-1"
                                            >
                                                🍎 App Store
                                            </a>
                                        ) : (
                                            <div className={`text-[8px] md:text-[9px] font-bold uppercase tracking-wider px-1.5 md:px-2 py-0.5 md:py-1 border border-black flex items-center ${activeProject.status.includes('Live') ? 'bg-black text-white' : 'bg-white'}`}>
                                                {activeProject.status}
                                            </div>
                                        )}
                                        {activeProject.website && (
                                            <a href={activeProject.website} target="_blank" rel="noopener noreferrer" className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider px-1.5 md:px-2 py-0.5 md:py-1 border border-black bg-white hover:bg-gray-100">
                                                🌐 Web
                                            </a>
                                        )}
                                     </div>
                                     <div className="mt-1.5 md:mt-2 text-[8px] md:text-[9px] text-gray-500">{activeProject.date} • {activeProject.category}</div>
                                </div>
                            </div>
                        </div>

                         {/* Gallery Section (Screenshots/Video) - Kept existing implementation mostly */}
                         {(activeProject.screenshots.length > 0 || activeProject.videoId) && (
                            <div className="border-b-2 border-black bg-gray-100 p-3 overflow-x-auto snap-x snap-mandatory flex gap-3">
                                {/* Video Demo */}
                                {activeProject.videoId && (
                                    <button
                                    onClick={() => setSelectedScreenshot({ projectId: activeProject.id, index: -1 })}
                                    className={`border-2 border-black bg-black shrink-0 overflow-hidden hover:opacity-90 transition-opacity snap-start shadow-[2px_2px_0_black] ${
                                        activeProject.videoAspectRatio === 'portrait' ? 'h-40 w-[90px]' : 'h-40 w-[285px]'
                                    }`}
                                    >
                                    <iframe
                                        src={`https://player.vimeo.com/video/${activeProject.videoId}?title=0&byline=0&portrait=0&background=1`}
                                        className="w-full h-full pointer-events-none opacity-80"
                                        frameBorder="0"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        
                                    />
                                    </button>
                                )}
                                {/* Screenshots */}
                                {activeProject.screenshots.map((screenshot, i) => (
                                    <button
                                    key={i}
                                    onClick={() => setSelectedScreenshot({ projectId: activeProject.id, index: i })}
                                    className="border-2 border-black bg-white shrink-0 h-40 w-auto overflow-hidden hover:opacity-90 transition-opacity flex items-center justify-center snap-start shadow-[2px_2px_0_black]"
                                    >
                                    <Image
                                        src={screenshot}
                                        alt={`${activeProject.name} screenshot ${i + 1}`}
                                        width={150}
                                        height={300}
                                        className="h-full w-auto object-contain"
                                    />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tech Stack Section */}
                        <div className="p-4 border-b-2 border-black bg-white">
                             <div className="text-[10px] uppercase tracking-wider font-bold mb-2">Technologies</div>
                             <div className="flex flex-wrap gap-2">
                                {activeProject.technologies.map((tech, i) => (
                                    <span key={i} className="text-[10px] bg-gray-50 border border-black px-2 py-1 shadow-[1px_1px_0_black]">{tech}</span>
                                ))}
                             </div>
                        </div>

                        {/* FULL Description Section - NO TRUNCATION */}
                        <div className="p-4 flex-1 bg-white">
                             <div className="text-[10px] uppercase tracking-wider font-bold mb-3 border-b border-black pb-1 inline-block">{activeProject.name.toUpperCase()}.TXT</div>
                             <div className="text-xs leading-relaxed whitespace-pre-line font-sans prose prose-sm max-w-none">
                                {activeProject.detailedDescription || activeProject.description}
                             </div>
                        </div>
                        
                        {/* Footer filler to ensure scrolling feels right */}
                        <div className="h-8 bg-gray-50 border-t-2 border-black shrink-0 flex items-center justify-center">
                            <span className="text-[9px] text-gray-400">--- End of File ---</span>
                        </div>

                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase text-gray-500">
                        Select a project from the list to view details.
                    </div>
                )}
            </div>

          </div>

          {/* Status Bar */}
          <div className="h-5 bg-gray-100 border-t-2 border-black flex items-center px-2 text-[10px] shrink-0 font-mono z-20">
            <span>{activeProject ? `Viewing: ${activeProject.id.toUpperCase()}.App` : 'Ready.'}</span>
            <div className="flex-1"></div>
            <span>Mem: 640K OK</span>
          </div>
        </div>
      </div>

      {/* Screenshot Modal (Reusing existing logic exactly) */}
      {selectedScreenshot && (() => {
        const currentProject = projects.find(p => p.id === selectedScreenshot.projectId);
        const hasVideo = !!currentProject?.videoId;
        const totalScreenshots = currentProject?.screenshots.length || 0;
        const totalItems = totalScreenshots + (hasVideo ? 1 : 0);
        const currentIndex = selectedScreenshot.index;
        const isVideo = currentIndex === -1;

        const goToPrevious = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isVideo) return; // Already at first item
          if (currentIndex === 0 && hasVideo) {
            // Go to video
            setSelectedScreenshot({ projectId: selectedScreenshot.projectId, index: -1 });
          } else if (currentIndex > 0) {
            setSelectedScreenshot({ projectId: selectedScreenshot.projectId, index: currentIndex - 1 });
          }
        };

        const goToNext = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isVideo && totalScreenshots > 0) {
            // Go to first screenshot
            setSelectedScreenshot({ projectId: selectedScreenshot.projectId, index: 0 });
          } else if (currentIndex < totalScreenshots - 1) {
            setSelectedScreenshot({ projectId: selectedScreenshot.projectId, index: currentIndex + 1 });
          }
        };

        const displayPosition = isVideo ? 1 : currentIndex + (hasVideo ? 2 : 1);

        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[100] font-mono"
            onClick={() => setSelectedScreenshot(null)}
          >
            {/* Previous arrow */}
            {(currentIndex > 0 || (currentIndex === 0 && hasVideo)) && (
              <button
                onClick={goToPrevious}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-12 sm:h-12 bg-white border-2 border-white flex items-center justify-center text-black font-bold text-3xl sm:text-2xl active:bg-gray-200 shadow-[4px_4px_0_rgba(0,0,0,0.3)] z-10 touch-manipulation"
              >
                ‹
              </button>
            )}

            {/* Next arrow */}
            {((isVideo && totalScreenshots > 0) || currentIndex < totalScreenshots - 1) && (
              <button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-12 sm:h-12 bg-white border-2 border-white flex items-center justify-center text-black font-bold text-3xl sm:text-2xl active:bg-gray-200 shadow-[4px_4px_0_rgba(0,0,0,0.3)] z-10 touch-manipulation"
              >
                ›
              </button>
            )}

            <div className={`relative border-4 border-white shadow-[8px_8px_0_rgba(255,255,255,0.3)] bg-black ${
              isVideo
                ? currentProject?.videoAspectRatio === 'portrait'
                  ? 'w-[50vh] h-[90vh]'
                  : 'w-[90vw] max-w-4xl h-[50vh]'
                : 'max-w-4xl max-h-[90vh]'
            }`} onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="absolute -top-10 sm:-top-8 right-0 w-10 h-10 sm:w-6 sm:h-6 bg-white border-2 border-white flex items-center justify-center text-black font-bold text-xl sm:text-base active:bg-gray-200 touch-manipulation shadow-[2px_2px_0_rgba(0,0,0,1)]"
              >
                ✕
              </button>

              {/* Image/Video counter */}
              <div className="absolute -top-10 sm:-top-8 left-0 px-3 py-2 sm:px-2 sm:py-1 bg-white border-2 border-white text-xs sm:text-[10px] font-mono font-bold shadow-[2px_2px_0_rgba(0,0,0,1)]">
                {displayPosition} / {totalItems}
              </div>

              {isVideo ? (
                <iframe
                  src={`https://player.vimeo.com/video/${currentProject?.videoId}?title=0&byline=0&portrait=0&autoplay=1`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <Image
                  src={currentProject?.screenshots[currentIndex] || ''}
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