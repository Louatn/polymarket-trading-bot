/* ============================================================
   CHAT PAGE — Terminal-style chat with the AI trading bot
   
   Allows the user to have a conversation with the bot.
   Les messages sont envoyés au backend Python via POST /api/chat.
   
   Features:
   - Terminal-style chat interface
   - Typing indicator
   - Pre-built suggested questions
   - Chat history
   ============================================================ */

'use client';

import { useState, useCallback } from 'react';
import { MessageSquareText, Lightbulb } from 'lucide-react';
import ClientLayout from '@/components/ClientLayout';
import { useAppContext } from '@/components/ClientLayout';
import ChatBox from '@/components/ChatBox';
import { ChatMessage } from '@/lib/types';

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
  return (
    <ClientLayout>
      <ChatContent />
    </ClientLayout>
  );
}

function ChatContent() {
  const { sendChatMessage, isConnected, chatHistory } = useAppContext();

  /* Local messages = DB history + session messages */
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  /* Merge: DB history first, then any session-only messages (avoids duplicates) */
  const allMessages = (() => {
    const dbIds = new Set(chatHistory.map(m => m.id));
    const extra = sessionMessages.filter(m => !dbIds.has(m.id));
    const merged = [...chatHistory, ...extra];
    // If no messages at all, show initial welcome
    if (merged.length === 0) {
      return [{
        id: 'initial',
        timestamp: new Date().toISOString(),
        sender: 'BOT' as const,
        content:
          'Welcome to the POLYBOT Trading Terminal. I\'m your AI trading assistant operating on Polymarket. You can ask me about my current strategy, portfolio performance, market analysis, or risk management. How can I help you?',
      }];
    }
    return merged;
  })();

  /* Handle sending a message — appelle le backend via API */
  const handleSendMessage = useCallback(async (content: string) => {
    /* Add user message */
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      timestamp: new Date().toISOString(),
      sender: 'USER',
      content,
    };
    setSessionMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    /* Envoyer au backend Python */
    const botResponse = await sendChatMessage(content);

    if (botResponse) {
      /* Réponse reçue du backend — already added to chatHistory via context */
      setSessionMessages((prev) => [...prev, botResponse]);
    } else {
      /* Erreur — message de fallback */
      const errorMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sender: 'BOT',
        content: '⚠️ Impossible de joindre le backend. Vérifiez que le serveur Python est lancé.',
      };
      setSessionMessages((prev) => [...prev, errorMsg]);
    }

    setIsTyping(false);
  }, [sendChatMessage]);

  return (
    <>
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
            messages={allMessages}
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
    </>
  );
}
