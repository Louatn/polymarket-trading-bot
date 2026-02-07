/* ============================================================
   CHAT PAGE — Terminal-style chat with the AI trading bot
   
   Allows the user to have a conversation with the bot.
   The bot responds with simulated AI-generated answers
   about trading strategy, market analysis, and portfolio.
   
   Features:
   - Terminal-style chat interface
   - Typing indicator
   - Pre-built suggested questions
   - Chat history
   
   In production, messages go through the tunnel to the bot.
   ============================================================ */

'use client';

import { useState, useCallback } from 'react';
import { MessageSquareText, Lightbulb } from 'lucide-react';
import ClientLayout from '@/components/ClientLayout';
import ChatBox from '@/components/ChatBox';
import { ChatMessage } from '@/lib/types';
import { generateBotResponse } from '@/lib/simulator';

/* ---- Pre-built suggested questions ---- */
const SUGGESTED_QUESTIONS = [
  'What is your current trading strategy?',
  'How is my portfolio performing?',
  'What are the current market conditions?',
  'What is your risk management approach?',
  'Which markets are you most bullish on?',
  'How many active positions do you hold?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      timestamp: new Date().toISOString(),
      sender: 'BOT',
      content:
        'Welcome to the POLYBOT Trading Terminal. I\'m your AI trading assistant operating on Polymarket. You can ask me about my current strategy, portfolio performance, market analysis, or risk management. How can I help you?',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  /* Handle sending a message */
  const handleSendMessage = useCallback((content: string) => {
    /* Add user message */
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      timestamp: new Date().toISOString(),
      sender: 'USER',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);

    /* Simulate bot typing delay */
    setIsTyping(true);

    /* Generate bot response after a realistic delay */
    const delay = 1000 + Math.random() * 2000; // 1-3 seconds
    setTimeout(() => {
      const botResponse = generateBotResponse(content);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sender: 'BOT',
        content: botResponse,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  }, []);

  return (
    <ClientLayout>
      {/* ---- Page header — Retro ASCII ---- */}
      <div className="mb-6">
        <pre className="text-xs text-text-muted font-mono select-none">────────────────────────────────────────</pre>
        <h1 className="text-xl font-bold tracking-widest text-glow-green font-mono">
          {'>'} BOT_CHAT_
        </h1>
        <p className="text-xs text-text-secondary mt-1 font-mono">
          // Secure terminal channel — communicate with AI trader
        </p>
        <pre className="text-xs text-text-muted font-mono select-none">────────────────────────────────────────</pre>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ---- Chat window (3/4 of the width) ---- */}
        <div className="lg:col-span-3 card h-[calc(100vh-220px)] flex flex-col">
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
        </div>

        {/* ---- Sidebar: Suggested questions (1/4) ---- */}
        <div className="space-y-4">
          {/* Suggested questions card */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent-amber" />
              Quick Questions
            </h3>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left px-3 py-2 rounded-md text-xs text-text-secondary hover:text-accent-green hover:bg-surface-hover transition-colors border border-border hover:border-accent-green-dim"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Bot info card */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-accent-cyan" />
              About
            </h3>
            <div className="space-y-2 text-xs text-text-secondary">
              <p>
                This is a direct channel to the AI trading bot. Messages are
                processed in real-time through the secure tunnel.
              </p>
              <p>
                The bot can provide insights on its current strategy, portfolio
                status, market analysis, and risk management parameters.
              </p>
              <p className="text-text-muted italic">
                Note: The bot does not execute trades based on chat commands.
                All trading decisions are autonomous.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
