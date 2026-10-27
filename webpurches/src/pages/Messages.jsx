import React, { useState } from 'react';
import { Send, Paperclip, CheckCheck, Circle, ShieldCheck, Sparkles, User } from 'lucide-react';

export const Messages = () => {
  const [activeChat, setActiveChat] = useState('chat-1');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [chats, setChats] = useState([
    {
      id: 'chat-1',
      name: 'Atelier Soundworks Zurich',
      role: 'Artisan Seller',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      online: true,
      messages: [
        { id: 1, sender: 'seller', text: 'Hello Vikramaditya. We have finalized the titanium anodizing on your Sony WH-1000XM5 studio headphones.', time: '11:15 AM', read: true },
        { id: 2, sender: 'buyer', text: 'Splendid! Will the audio cable include the balanced 4.4mm Pentaconn adapter?', time: '11:20 AM', read: true },
        { id: 3, sender: 'seller', text: 'Yes, both 3.5mm single-ended and 4.4mm balanced silver-plated OFC cables are included in the velvet vault case.', time: '11:22 AM', read: true },
      ],
    },
    {
      id: 'chat-2',
      name: 'Cupertino Studio Lab',
      role: 'Pro Hardware Specialist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      online: false,
      messages: [
        { id: 1, sender: 'seller', text: 'Your MacBook Pro M4 Max custom BTO configuration is queued for dispatch.', time: 'Yesterday', read: true },
      ],
    },
  ]);

  const currentChat = chats.find((c) => c.id === activeChat) || chats[0];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'buyer',
      text: inputMessage,
      time: 'Just now',
      read: true,
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, newMsg] }
          : c
      )
    );
    setInputMessage('');

    // Simulate WebSocket typing reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyMsg = {
        id: Date.now() + 1,
        sender: 'seller',
        text: 'Received via encrypted Django Channels WebSocket connection. Preparing dispatch confirmation.',
        time: 'Just now',
        read: true,
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat
            ? { ...c, messages: [...c.messages, replyMsg] }
            : c
        )
      );
    }, 1800);
  };

  return (
    <div className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn text-[#F5F5F5]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#A7A7AE] block mb-0.5">
            MERCHANT ↔ CUSTOMER ENCRYPTED STUDIO
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#F5F5F5]">
            WSHOP <span className="italic font-serif text-[#D6A85F]">Messaging</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-[#A7A7AE]">
          <span className="w-2 h-2 rounded-full bg-[#D6A85F] animate-pulse" />
          <span>DJANGO CHANNELS WEBSOCKET ACTIVE</span>
        </div>
      </div>

      {/* 2-Column Chat Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-[#151519] border border-white/10 shadow-2xl overflow-hidden min-h-[550px]">
        
        {/* Left: Chat Contacts (4 Cols) */}
        <div className="md:col-span-4 border-r border-white/10 bg-[#0B0B0D] p-4 space-y-2">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#A7A7AE] px-3 block mb-2 font-bold">
            CONVERSATIONS ({chats.length})
          </span>
          {chats.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center space-x-3 ${
                activeChat === c.id
                  ? 'bg-[#1C1C21] border border-[#D6A85F] shadow-sm'
                  : 'hover:bg-[#1C1C21]/60 border border-transparent'
              }`}
            >
              <div className="relative">
                <img src={c.avatar} alt={c.name} className="w-11 h-11 rounded-xl object-cover border border-white/10" />
                {c.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#050505] border-2 border-[#151519] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D6A85F]" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-serif font-bold text-sm text-[#F5F5F5] block truncate">{c.name}</span>
                <span className="text-[11px] text-[#A7A7AE] font-sans truncate block">{c.role}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Message Stream (8 Cols) */}
        <div className="md:col-span-8 flex flex-col justify-between p-6 bg-[#151519]">
          
          {/* Active Chat Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <img src={currentChat.avatar} alt={currentChat.name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
              <div>
                <h4 className="font-serif font-bold text-base text-[#F5F5F5]">{currentChat.name}</h4>
                <div className="flex items-center space-x-1.5 text-[10px] text-[#A7A7AE] font-mono">
                  <span>{currentChat.online ? 'Online' : 'Offline'}</span>
                  <span>·</span>
                  <span className="text-[#D6A85F]">End-to-End Escrow Bound</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 py-6 space-y-4 overflow-y-auto max-h-[380px] pr-2">
            {currentChat.messages.map((m) => {
              const isMe = m.sender === 'buyer';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] p-4 rounded-2xl text-xs font-sans leading-relaxed ${
                      isMe
                        ? 'bg-[#D6A85F] text-[#050505] font-semibold rounded-br-xs shadow-md'
                        : 'bg-[#1C1C21] text-[#F5F5F5] border border-white/10 rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-[#A7A7AE] font-mono mt-1 px-1">
                    {m.time}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center space-x-2 text-xs font-mono text-[#A7A7AE]">
                <span className="w-2 h-2 rounded-full bg-[#D6A85F] animate-bounce" />
                <span>Seller is drafting response...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="pt-4 border-t border-white/10 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Inquire regarding order dispatch, warranty, or customization..."
              className="flex-1 h-12 px-4 rounded-full bg-[#1C1C21] border border-white/15 text-xs font-sans text-[#F5F5F5] placeholder-[#A7A7AE] focus:outline-none focus:border-[#D6A85F]"
            />
            <button
              type="submit"
              className="p-3.5 rounded-full bg-[#D6A85F] text-[#050505] hover:bg-[#F0C982] transition-colors shadow-lg"
              title="Send Message"
            >
              <Send className="w-4 h-4 text-[#050505]" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
