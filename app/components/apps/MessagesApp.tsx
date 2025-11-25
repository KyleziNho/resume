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

export default function MessagesApp() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'kyle',
      text: "👋 hey! i'm kyle. ask me anything!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

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
      // Scroll page to top when keyboard opens
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

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

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
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
        {messages.map((msg) => {
          const isMe = msg.sender === 'user';
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
            </div>
          );
        })}

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
