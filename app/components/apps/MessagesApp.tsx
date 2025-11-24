'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Eraser, Smile } from 'lucide-react';

// --- Types ---
type Message = {
  id: string;
  sender: 'kyle' | 'user';
  text: string;
  timestamp: string;
};

// --- Bot Logic: Simple Keyword Matching ---
const getBotResponse = (input: string): string => {
  const lower = input.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey'))
    return "hey! thanks for stopping by. feel free to ask about my projects, skills, or experience.";

  if (lower.includes('project') || lower.includes('work') || lower.includes('app'))
    return "i've built some cool stuff. check out the 'My Work' folder on the desktop! 'Frift' and 'Arcadeus' are my favorites.";

  if (lower.includes('skill') || lower.includes('stack') || lower.includes('tech'))
    return "i'm fluent in the modern stack: React, Next.js, TypeScript, and Python. I also love Flutter for mobile.";

  if (lower.includes('hire') || lower.includes('job') || lower.includes('contact'))
    return "i'm always open to interesting opportunities! shoot me an email at kyle@bath.ac.uk or check the Contact folder.";

  if (lower.includes('who are you') || lower.includes('about'))
    return "i'm kyle, a cs master's student at bath. i build things that live on the internet.";

  return "hmm, i'm just a simulation so i might have missed that. try asking about my 'projects' or 'skills'!";
};

export default function MessagesApp() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'kyle',
      text: "👋 hey! i'm kyle. ask me anything!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate network delay and typing
    setTimeout(() => {
      const responseText = getBotResponse(userMsg.text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'kyle',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleClear = () => {
    setMessages([]);
  };

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
      <div className="relative z-10 flex items-center justify-between px-4 h-11 bg-gradient-to-b from-[#f9f9f9] to-[#e0e0e0] border-b border-[#b0b0b0] shadow-sm select-none">
        <div className="flex items-center gap-1 text-gray-500 text-sm font-medium drop-shadow-[0_1px_0_rgba(255,255,255,1)]">
          <span>To:</span>
          <span className="text-black font-bold">Kyle</span>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-[#666] hover:text-black font-medium active:scale-95 transition-transform"
        >
          Clear
        </button>
      </div>

      {/* 3. CHAT AREA */}
      <div
        ref={scrollRef}
        className="flex-1 relative z-10 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.map((msg) => {
          const isMe = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}
            >
              {/* Header (Name + Time) */}
              <div className={`flex gap-2 text-[10px] text-[#888] mb-0.5 px-1 font-medium drop-shadow-[0_1px_0_rgba(255,255,255,1)]`}>
                <span className="font-bold text-[#666]">{isMe ? 'You' : 'Kyle'}</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* BUBBLE (The Glossy Look) */}
              <div
                className={`
                  relative max-w-[80%] px-4 py-2 rounded-2xl shadow-md border
                  ${isMe
                    ? 'bg-gradient-to-b from-[#fffcdb] to-[#fcf39a] border-[#e8d98b] text-[#5c4b08]' // Yellow/Gold Gloss
                    : 'bg-gradient-to-b from-[#e3f2fd] to-[#bfdff5] border-[#9bc4e0] text-[#1a3b5c]' // Blue/Aqua Gloss
                  }
                `}
                style={{
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.7)'
                }}
              >
                <p className="text-sm leading-snug drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
           <div className="flex flex-col items-start">
             <div className="text-[10px] text-[#888] mb-0.5 px-1 font-medium ml-1">Kyle is typing...</div>
             <div className="bg-gradient-to-b from-[#e3f2fd] to-[#bfdff5] border border-[#9bc4e0] px-4 py-2 rounded-2xl shadow-md w-16 flex items-center justify-center gap-1">
               <div className="w-1.5 h-1.5 bg-[#1a3b5c]/40 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-[#1a3b5c]/40 rounded-full animate-bounce delay-75"></div>
               <div className="w-1.5 h-1.5 bg-[#1a3b5c]/40 rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}
      </div>

      {/* 4. INPUT AREA (Pill Shape) */}
      <div className="relative z-20 p-3 bg-gradient-to-t from-[#dcdcdc] to-[#eeeeee] border-t border-[#aaa]">
        <form
          onSubmit={handleSend}
          className="bg-white rounded-full border border-[#999] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] flex items-center px-2 py-1 focus-within:ring-2 focus-within:ring-blue-400/50 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or push 'enter' to talk..."
            className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-700 placeholder:text-gray-400 h-8"
          />
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Smile size={18} />
          </button>
        </form>
      </div>

    </div>
  );
}
