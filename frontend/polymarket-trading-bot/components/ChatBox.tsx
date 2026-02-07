/* ============================================================
   CHAT BOX — Terminal-style chat interface with the bot
   
   Allows the user to converse with the AI trading bot.
   Messages appear in a scrollable terminal-style container.
   
   The input field at the bottom lets users type and send
   messages. The bot responds with simulated AI answers.
   
   Props:
   - messages: array of ChatMessage
   - onSendMessage: callback when user sends a message
   - isTyping: whether the bot is currently typing
   ============================================================ */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Terminal } from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import { formatTime, cn } from '@/lib/utils';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
}

export default function ChatBox({ messages, onSendMessage, isTyping }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll to bottom when new messages arrive */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /* Handle message submission */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* ---- Chat header ---- */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Terminal className="h-4 w-4 text-accent-green" />
        <span className="text-sm font-bold text-accent-green">POLYBOT TERMINAL</span>
        <span className="text-xs text-text-muted ml-auto">Secure Channel</span>
      </div>

      {/* ---- Messages area ---- */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-start gap-3',
              msg.sender === 'USER' ? 'flex-row-reverse' : ''
            )}
          >
            {/* Avatar */}
            <div className={cn(
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
              msg.sender === 'BOT' ? 'bg-accent-green-dim' : 'bg-accent-cyan-dim'
            )}>
              {msg.sender === 'BOT' ? (
                <Bot className="h-4 w-4 text-accent-green" />
              ) : (
                <User className="h-4 w-4 text-accent-cyan" />
              )}
            </div>

            {/* Message bubble */}
            <div className={cn(
              'max-w-[75%] rounded-lg px-4 py-3',
              msg.sender === 'BOT'
                ? 'bg-surface border border-border'
                : 'bg-accent-cyan-dim border border-accent-cyan/20'
            )}>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
              <p className="text-[10px] text-text-muted mt-2 font-mono">
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-green-dim">
              <Bot className="h-4 w-4 text-accent-green" />
            </div>
            <div className="bg-surface border border-border rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-accent-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-accent-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-accent-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---- Input area ---- */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          {/* Terminal prompt */}
          <span className="text-accent-green font-mono text-sm flex-shrink-0">$&gt;</span>

          {/* Input field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the trading bot anything..."
            className="terminal-input flex-1 rounded-lg px-4 py-2.5 text-sm"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim()}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-all',
              input.trim()
                ? 'bg-accent-green text-black hover:bg-accent-green/80'
                : 'bg-surface text-text-muted cursor-not-allowed'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
