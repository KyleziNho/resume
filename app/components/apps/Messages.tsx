'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send } from 'lucide-react';

interface Message {
  id: string;
  sender: 'kyle' | 'user';
  text: string;
  timestamp: string;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  online: boolean;
  unread: number;
}

export default function Messages() {
  const [activeChat, setActiveChat] = useState('kyle');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'kyle',
      text: "👋 hey! i'm kyle. ask me anything!",
      timestamp: '14:22'
    }
  ]);

  const [chats] = useState<Chat[]>([
    { id: 'kyle', name: '@kyle', lastMessage: "hey! i'm kyle. ask me anything!", online: true, unread: 0 },
    { id: 'portfolio', name: '#portfolio', lastMessage: 'Check out my projects', online: false, unread: 0 },
    { id: 'skills', name: '#skills', lastMessage: 'Tech stack discussion', online: false, unread: 1 },
    { id: 'experience', name: '#experience', lastMessage: 'Work history', online: false, unread: 0 },
    { id: 'contact', name: '#contact', lastMessage: "Let's connect!", online: false, unread: 0 },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: getCurrentTime()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageText('');

    // TODO: Future Gemini API integration here
    // For now, just echo back
    setTimeout(() => {
      const kyleResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'kyle',
        text: "Thanks for your message! I'm currently just a demo, but soon I'll be powered by AI to answer questions about Kyle's experience, skills, and projects. 🚀",
        timestamp: getCurrentTime()
      };
      setMessages(prev => [...prev, kyleResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-white font-sans">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col bg-[#f6f6f6]">
        {/* Sidebar Header */}
        <div className="h-12 px-3 flex items-center justify-between border-b border-gray-200 bg-white">
          <h2 className="text-sm font-semibold text-gray-800">Chats</h2>
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
            <Plus size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full px-3 py-3 flex items-start gap-3 hover:bg-gray-100 transition-colors border-b border-gray-100 ${
                activeChat === chat.id ? 'bg-blue-100' : ''
              }`}
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${activeChat === chat.id ? 'text-blue-600' : 'text-gray-900'}`}>
                    {chat.name}
                  </span>
                  {chat.online && (
                    <span className="text-[10px] text-gray-500">{chats.filter(c => c.id === chat.id && c.online).length} online</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <span className="mt-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] text-center">
                  {chat.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">
              {chats.find(c => c.id === activeChat)?.name}
            </span>
          </div>
          <button className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800">
            Clear
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-gray-500">
                    {message.sender === 'kyle' ? 'Kyle' : 'You'}
                  </span>
                  <span className="text-xs text-gray-400">{message.timestamp}</span>
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-yellow-100 text-gray-900'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-gray-200 focus-within:border-blue-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            AI-powered responses coming soon via Gemini API
          </p>
        </div>
      </div>
    </div>
  );
}
