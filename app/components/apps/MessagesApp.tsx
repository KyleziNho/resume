'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Eraser, Smile } from 'lucide-react';
import { haptic } from 'ios-haptics';
import { trackChatMessage } from '@/app/lib/analytics';

// Suggested prompts for users
const SUGGESTED_PROMPTS = [
  "What projects has Kyle worked on?",
  "What did Kyle study?",
  "What are Kyle's skills?",
  "How can I contact Kyle?",
];

// App data for contextual buttons
const APP_DATA = [
  {
    id: 'onlybills',
    name: 'OnlyBills',
    keywords: ['onlybills', 'only bills', 'bill split', 'split bills', 'receipt'],
    icon: '/app-onlybills.png',
    website: null,
    appStoreLink: 'https://apps.apple.com/gb/app/onlybills/id6754412082',
    bgColor: 'from-[#FF6B35] to-[#F7931E]',
    borderColor: 'border-[#E85A24]',
  },
  {
    id: 'frift',
    name: 'Frift',
    keywords: ['frift', 'marketplace', 'student marketplace', 'campus marketplace', 'second-hand'],
    icon: '/app-frift.png',
    website: 'https://www.frift.uk',
    appStoreLink: 'https://apps.apple.com/gb/app/frift-student-marketplace/id6745021634',
    bgColor: 'from-[#4A90D9] to-[#357ABD]',
    borderColor: 'border-[#2E6BA8]',
  },
  {
    id: 'arcadeus',
    name: 'Arcadeus',
    keywords: ['arcadeus', 'm&a', 'deal model', 'financial model', 'excel add-in', 'investment bank'],
    icon: '/app-arcadeus.png',
    website: 'https://www.arcadeus.ai',
    appStoreLink: null,
    bgColor: 'from-[#1a1a2e] to-[#16213e]',
    borderColor: 'border-[#0f0f1a]',
  },
  {
    id: 'kyro',
    name: 'Kyro',
    keywords: ['kyro', 'card game', 'multiplayer game', 'multiplayer card'],
    icon: '/app-kyro.png',
    website: 'https://kyro.onl',
    appStoreLink: null,
    bgColor: 'from-[#2D1B4E] to-[#1A0F2E]',
    borderColor: 'border-[#150A22]',
  },
  {
    id: 'wearehere',
    name: 'We Are Here',
    keywords: ['we are here', 'wearehere', 'vulnerable', 'shelter', 'resources', 'non-profit', 'nonprofit'],
    icon: '/app-wearehere.png',
    website: null,
    appStoreLink: null,
    bgColor: 'from-[#43A047] to-[#2E7D32]',
    borderColor: 'border-[#1B5E20]',
  },
];

// --- Types ---
type Message = {
  id: string;
  sender: 'kyle' | 'user';
  text: string;
  timestamp: string;
};

// --- AI Bot Logic ---
const getBotResponse = async (input: string, history: Message[]): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: input,
        history: history.slice(1), // Exclude initial greeting
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      throw new Error(`API request failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Chat error:', error);
    return "hmm, i'm having trouble connecting right now. my circuits might be overloaded - try again?";
  }
};

interface MessagesAppProps {
  onOpenSafari?: (url: string) => void;
  onOpenAppStore?: (appId: string) => void;
  onOpenResume?: () => void;
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  sender: 'kyle',
  text: "hey! i'm a bot trained on everything about kyle. ask me anything about him or his projects!",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export default function MessagesApp({ onOpenSafari, onOpenAppStore, onOpenResume }: MessagesAppProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kyleos_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('kyleos_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      // Small delay to ensure layout has updated
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, isTyping]);

  // Scroll to top when keyboard opens on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const handleFocus = () => {
      // Multiple attempts to scroll to top to override browser behavior
      window.scrollTo(0, 0);

      // Use setTimeout to run after browser's automatic scroll
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);

      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 300);

      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 500);
    };

    // Also listen to visualViewport scroll events
    const handleViewportScroll = () => {
      if (document.activeElement === inputRef.current) {
        window.scrollTo(0, 0);
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('scroll', handleViewportScroll);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('scroll', handleViewportScroll);
      }
    };
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    // Haptic feedback when sending message
    haptic();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInput('');
    setIsTyping(true);

    // Keep keyboard open by refocusing input (mobile)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);

    // Get AI response
    const responseText = await getBotResponse(userMsg.text, currentMessages);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'kyle',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Haptic feedback when receiving response
    haptic();

    // Analytics: Track chat message
    trackChatMessage(userMsg.text, responseText);

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem('kyleos_chat_history');
  };

  const handleSuggestedPrompt = async (prompt: string) => {
    // Haptic feedback
    haptic();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setIsTyping(true);

    // Get AI response
    const responseText = await getBotResponse(prompt, currentMessages);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'kyle',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Haptic feedback when receiving response
    haptic();

    // Analytics: Track chat message
    trackChatMessage(prompt, responseText);

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  // Check if message is about contacting Kyle
  const isContactRelated = (text: string) => {
    const keywords = ['contact', 'reach', 'touch', 'email', 'linkedin', 'whatsapp', 'message', 'hire', 'connect', 'get in touch', 'talk to'];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  // Check if message is about CV/Resume
  const isCVRelated = (text: string) => {
    const keywords = ['cv', 'resume', 'résumé', 'curriculum', 'qualifications', 'experience summary'];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  // Check if message mentions a specific app and return its data
  const getSpecificApp = (text: string) => {
    const lowerText = text.toLowerCase();
    return APP_DATA.find(app =>
      app.keywords.some(keyword => lowerText.includes(keyword))
    ) || null;
  };

  // Check if message is about projects generally (not a specific app)
  const isProjectRelated = (text: string) => {
    const keywords = ['project', 'built', 'created', 'developed', 'portfolio', 'working on'];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  // Get user messages to filter out already-asked prompts
  const askedQuestions = messages
    .filter(msg => msg.sender === 'user')
    .map(msg => msg.text.toLowerCase());

  // Filter out prompts that have already been asked
  const remainingPrompts = SUGGESTED_PROMPTS.filter(
    prompt => !askedQuestions.some(asked =>
      asked.includes(prompt.toLowerCase()) || prompt.toLowerCase().includes(asked)
    )
  );

  // Show suggestions if there are any remaining and not currently typing
  const showSuggestions = remainingPrompts.length > 0 && !isTyping;

  return (
    <div className="flex flex-col h-full bg-[#f2f2f2] font-sans overflow-hidden relative">

      {/* 1. RETRO PINSTRIPE BACKGROUND PATTERN */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)`
        }}
      ></div>

      {/* 2. HEADER (Skeuomorphic Bar) */}
      <div className="relative z-10 flex items-center justify-between px-3 md:px-4 h-10 md:h-11 bg-gradient-to-b from-[#f9f9f9] to-[#e0e0e0] border-b border-[#b0b0b0] shadow-sm select-none shrink-0">
        <div className="flex items-center gap-1 text-gray-500 text-xs md:text-sm font-medium drop-shadow-[0_1px_0_rgba(255,255,255,1)]">
          <span>To:</span>
          <span className="text-black font-bold">Kyle</span>
        </div>
        <button
          onClick={handleClear}
          className="text-[10px] md:text-xs text-[#666] hover:text-black font-medium active:scale-95 transition-transform"
        >
          Clear
        </button>
      </div>

      {/* 3. CHAT AREA */}
      <div
        ref={scrollRef}
        className="flex-1 relative z-10 overflow-y-auto p-2 md:p-4 pb-1 md:pb-2 space-y-2 md:space-y-3 custom-scrollbar min-h-0"
      >
        {messages.map((msg, index) => {
          const isMe = msg.sender === 'user';
          const isContact = !isMe && isContactRelated(msg.text) && index > 0;
          const isCV = !isMe && isCVRelated(msg.text) && !isContact && index > 0;
          const specificApp = !isMe && !isContact && !isCV && index > 0 ? getSpecificApp(msg.text) : null;
          const showProjectLink = !isMe && isProjectRelated(msg.text) && !isContact && !isCV && !specificApp && index > 0;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}
            >
              {/* Header (Name + Time) */}
              <div className={`flex gap-1 md:gap-2 text-[9px] md:text-[10px] text-[#888] mb-0.5 px-1 font-medium drop-shadow-[0_1px_0_rgba(255,255,255,1)]`}>
                <span className="font-bold text-[#666]">{isMe ? 'You' : 'Kyle'}</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* BUBBLE (The Glossy Look) */}
              <div
                className={`
                  relative max-w-[85%] md:max-w-[75%] px-3 md:px-4 py-1.5 md:py-2 rounded-2xl shadow-md border
                  ${isMe
                    ? 'bg-gradient-to-b from-[#fffcdb] to-[#fcf39a] border-[#e8d98b] text-[#5c4b08]' // Yellow/Gold Gloss
                    : 'bg-gradient-to-b from-[#e3f2fd] to-[#bfdff5] border-[#9bc4e0] text-[#1a3b5c]' // Blue/Aqua Gloss
                  }
                `}
                style={{
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.7)'
                }}
              >
                <p className="text-xs md:text-sm leading-snug drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                  {msg.text}
                </p>
              </div>

              {/* Contact Buttons - shown after contact-related bot messages */}
              {isContact && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href="https://www.linkedin.com/in/kos33/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 bg-gradient-to-b from-[#0077b5] to-[#005885] hover:from-[#0088cc] hover:to-[#006699] border border-[#004d77] text-white font-medium px-3 py-1.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 text-xs"
                    style={{
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                  <a
                    href="https://wa.me/447305403957"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 bg-gradient-to-b from-[#25D366] to-[#128C7E] hover:from-[#2be077] hover:to-[#149e8c] border border-[#0d7d6a] text-white font-medium px-3 py-1.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 text-xs"
                    style={{
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}

              {/* CV Button - shown after CV-related bot messages */}
              {isCV && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => onOpenResume?.()}
                    className="group flex items-center gap-2 bg-gradient-to-b from-[#dc2626] to-[#b91c1c] hover:from-[#ef4444] hover:to-[#dc2626] border border-[#991b1b] text-white font-medium px-3 py-1.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 text-xs"
                    style={{
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
                      <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
                    </svg>
                    <span>View CV</span>
                  </button>
                </div>
              )}

              {/* App-Specific Buttons - shown when a specific app is mentioned */}
              {specificApp && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {/* Website Button */}
                  {specificApp.website && (
                    <button
                      onClick={() => onOpenSafari?.(specificApp.website!)}
                      className={`group flex items-center gap-2 bg-gradient-to-b ${specificApp.bgColor} ${specificApp.borderColor} border text-white font-medium px-3 py-1.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 text-xs hover:brightness-110`}
                      style={{
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                      }}
                    >
                      <Image
                        src={specificApp.icon}
                        alt={specificApp.name}
                        width={16}
                        height={16}
                        className="rounded group-hover:scale-110 transition-transform"
                      />
                      <span>Visit Website</span>
                    </button>
                  )}

                  {/* App Store Button */}
                  {specificApp.appStoreLink && (
                    <button
                      onClick={() => onOpenAppStore?.(specificApp.id)}
                      className={`group flex items-center gap-2 bg-gradient-to-b ${specificApp.bgColor} ${specificApp.borderColor} border text-white font-medium px-3 py-1.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 text-xs hover:brightness-110`}
                      style={{
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                      }}
                    >
                      <Image
                        src={specificApp.icon}
                        alt={specificApp.name}
                        width={16}
                        height={16}
                        className="rounded group-hover:scale-110 transition-transform"
                      />
                      <span>Get on App Store</span>
                    </button>
                  )}

                  {/* View Other Projects Button */}
                  <button
                    onClick={() => onOpenSafari?.('/projects')}
                    className="group flex items-center gap-2 bg-gradient-to-b from-gray-100 to-gray-200 hover:from-gray-50 hover:to-gray-150 border border-gray-300 text-gray-700 font-medium px-3 py-1.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 text-xs"
                    style={{
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)'
                    }}
                  >
                    <Image
                      src="/favicon.png"
                      alt="Projects"
                      width={16}
                      height={16}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <span>Other Projects</span>
                  </button>
                </div>
              )}

              {/* View Projects Button - shown after project-related bot messages (but not contact-related or app-specific) */}
              {showProjectLink && (
                <button
                  onClick={() => onOpenSafari?.('/projects')}
                  className="mt-2 group flex items-center gap-2 bg-gradient-to-b from-gray-100 to-gray-200 hover:from-gray-50 hover:to-gray-150 border border-gray-300 text-gray-700 font-medium px-3 py-1.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 text-xs"
                  style={{
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)'
                  }}
                >
                  <Image
                    src="/favicon.png"
                    alt="Projects"
                    width={16}
                    height={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span>View Projects</span>
                </button>
              )}
            </div>
          );
        })}

        {/* Suggested Prompts - shown until all have been asked */}
        {showSuggestions && (
          <div className="flex flex-col items-start mt-2 mb-2">
            <p className="text-[10px] text-gray-500 mb-2 px-1 font-medium">
              {messages.length === 1 ? 'Try asking:' : 'Ask me about:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {remainingPrompts.map((prompt, index) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="text-[11px] md:text-xs px-3 py-1.5 rounded-full bg-gradient-to-b from-white to-gray-100 border border-gray-300 text-gray-700 hover:from-gray-50 hover:to-gray-200 active:scale-95 transition-all shadow-sm hover:shadow-md"
                  style={{
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {isTyping && (
           <div className="flex flex-col items-start">
             <div className="text-[9px] md:text-[10px] text-[#888] mb-0.5 px-1 font-medium ml-1">Kyle is typing...</div>
             <div className="bg-gradient-to-b from-[#e3f2fd] to-[#bfdff5] border border-[#9bc4e0] px-3 md:px-4 py-1.5 md:py-2 rounded-2xl shadow-md w-14 md:w-16 flex items-center justify-center gap-1">
               <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#1a3b5c]/40 rounded-full animate-bounce"></div>
               <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#1a3b5c]/40 rounded-full animate-bounce delay-75"></div>
               <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#1a3b5c]/40 rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}
      </div>

      {/* 4. INPUT AREA (Pill Shape) */}
      <div className="relative z-20 p-1.5 md:p-3 bg-gradient-to-t from-[#dcdcdc] to-[#eeeeee] border-t border-[#aaa] shrink-0">
        <form
          onSubmit={handleSend}
          className="bg-white rounded-full border border-[#999] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] flex items-center px-2 md:px-2 py-0.5 md:py-1 focus-within:ring-2 focus-within:ring-blue-400/50 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="iMessage"
            className="flex-1 bg-transparent border-none outline-none text-base px-2 text-gray-700 placeholder:text-gray-400 h-8 md:h-8"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            style={{ fontSize: '16px' }}
          />
          <button
            type="submit"
            className="p-1 md:p-1.5 text-blue-500 hover:text-blue-600 transition-colors active:scale-95"
          >
            <Send size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        </form>
      </div>

    </div>
  );
}
